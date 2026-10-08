/**
 * EcoLoop Analytics Aggregation Tests
 * Verifies metrics correctness, lifecycle stage filtering,
 * separation of potential vs actual recovery, and anti-double-counting guarantees.
 */

const { describe, it, before, after } = require('node:test');
const assert = require('node:assert');
const path = require('path');
const fs = require('fs');

const { getDb, closeDb } = require('../db/connection');
const { runMigrations } = require('../db/migrate');
const { seedDatabase } = require('../db/seed');
const repository = require('../db/repository');
const { evaluateEnvironmentalImpact } = require('../calculator');
const { recommendCircularPathway } = require('../circular-engine');

const ANALYTICS_DB_PATH = path.join(__dirname, '../../data/test_analytics.db');

describe('Management Analytics & Anti-Double-Counting', () => {

  before(() => {
    if (fs.existsSync(ANALYTICS_DB_PATH)) {
      fs.unlinkSync(ANALYTICS_DB_PATH);
    }
    process.env.DATABASE_PATH = ANALYTICS_DB_PATH;

    const db = getDb(ANALYTICS_DB_PATH);
    runMigrations(db);
    seedDatabase({ db, includeDemo: false });
  });

  after(() => {
    closeDb();
    if (fs.existsSync(ANALYTICS_DB_PATH)) {
      try { fs.unlinkSync(ANALYTICS_DB_PATH); } catch {}
    }
    delete process.env.DATABASE_PATH;
  });

  it('reports zero metrics for an empty database', () => {
    const analytics = repository.getAnalytics();

    assert.strictEqual(analytics.metrics.registered.units, 0);
    assert.strictEqual(analytics.metrics.registered.massKg, 0);
    assert.strictEqual(analytics.metrics.collected.units, 0);
    assert.strictEqual(analytics.metrics.collected.massKg, 0);
    assert.strictEqual(analytics.metrics.processed.units, 0);
    assert.strictEqual(analytics.metrics.processed.massKg, 0);
    assert.strictEqual(analytics.metrics.materialRecovered.actualMassKg || analytics.metrics.materialRecovered.massKg, 0);
  });

  it('correctly tracks pipeline stages without double-counting', () => {
    // Helper to insert a test submission with given status
    function addSub(code, categoryId, qty, status) {
      const evalResult = evaluateEnvironmentalImpact({
        categoryId,
        quantity: qty
      });
      const recResult = recommendCircularPathway({
        category: categoryId,
        condition: 'Fully working',
        ageYears: 2
      });

      const sub = repository.createSubmission(
        {
          trackingCode: code,
          userName: `User ${code}`,
          userEmail: 'user@test.org',
          categoryId,
          categoryName: evalResult.category.name,
          cpcbCode: evalResult.category.cpcbCode,
          brand: 'Generic',
          model: 'Standard',
          quantity: qty,
          condition: 'Fully working',
          weightKgPerUnit: evalResult.unitWeightKg,
          totalMassKg: evalResult.totalMassKg,
          userIntendedPathway: 'Reuse',
          collectionMethod: 'Drop-off'
        },
        evalResult,
        recResult
      );

      // Transition if needed
      if (status === 'Collected') {
        repository.updateSubmissionStatus(sub.id, 'Collected');
      } else if (status === 'In Assessment') {
        repository.updateSubmissionStatus(sub.id, 'Collected');
        repository.updateSubmissionStatus(sub.id, 'In Assessment');
      } else if (status === 'Processing') {
        repository.updateSubmissionStatus(sub.id, 'Collected');
        repository.updateSubmissionStatus(sub.id, 'In Assessment');
        repository.updateSubmissionStatus(sub.id, 'Processing');
      } else if (status === 'Recovered') {
        repository.updateSubmissionStatus(sub.id, 'Collected');
        repository.updateSubmissionStatus(sub.id, 'In Assessment');
        repository.updateSubmissionStatus(sub.id, 'Processing');
        repository.updateSubmissionStatus(sub.id, 'Recovered');
      }
      return sub;
    }

    // Add 4 devices with distinct statuses:
    // 1. Laptop (qty 1, 2.10 kg) -> 'Registered'
    addSub('TST-REG-01', 'cat-laptop', 1, 'Registered');

    // 2. Smartphone (qty 2, 0.18*2 = 0.36 kg) -> 'Collected'
    addSub('TST-COL-01', 'cat-smartphone', 2, 'Collected');

    // 3. Desktop (qty 1, 9.50 kg) -> 'Processing'
    addSub('TST-PRC-01', 'cat-desktop', 1, 'Processing');

    // 4. Laptop (qty 1, 2.10 kg) -> 'Recovered'
    addSub('TST-REC-01', 'cat-laptop', 1, 'Recovered');

    const analytics = repository.getAnalytics();

    // Total registered units = 1 + 2 + 1 + 1 = 5 units
    assert.strictEqual(analytics.metrics.registered.units, 5);
    // Total registered mass = 2.10 + 0.36 + 9.50 + 2.10 = 14.06 kg
    assert.strictEqual(analytics.metrics.registered.massKg, 14.06);

    // Collected = items in [Collected, In Assessment, Processing, Recovered] = 2 + 1 + 1 = 4 units
    assert.strictEqual(analytics.metrics.collected.units, 4);
    // Collected mass = 0.36 + 9.50 + 2.10 = 11.96 kg
    assert.strictEqual(analytics.metrics.collected.massKg, 11.96);

    // Processed = items in [Processing, Recovered] = 1 + 1 = 2 units
    assert.strictEqual(analytics.metrics.processed.units, 2);
    // Processed mass = 9.50 + 2.10 = 11.60 kg
    assert.strictEqual(analytics.metrics.processed.massKg, 11.60);

    // Potential recovery must exceed actual recovery (because Registered + Collected items haven't yielded actual material yet)
    assert.ok(analytics.metrics.materialRecovered.potentialMassKg > analytics.metrics.materialRecovered.massKg,
      'Potential recovery must exceed actual recovery when only a subset is processed');

    // Pipeline counts
    assert.strictEqual(analytics.statusPipelineCount['Registered'], 1);
    assert.strictEqual(analytics.statusPipelineCount['Collected'], 2);
    assert.strictEqual(analytics.statusPipelineCount['In Assessment'], 0);
    assert.strictEqual(analytics.statusPipelineCount['Processing'], 1);
    assert.strictEqual(analytics.statusPipelineCount['Recovered'], 1);
  });
});
