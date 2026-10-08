/**
 * EcoLoop Database Persistence & Lifecycle State Machine Tests
 * Verifies relational tables, transactions, state machine transitions,
 * audit history, and reconnect persistence across server restarts.
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

const TEST_DB_PATH = path.join(__dirname, '../../data/test_ecoloop.db');

describe('Database Persistence & Lifecycle State Machine', () => {

  before(() => {
    // Clean up test DB if left over
    if (fs.existsSync(TEST_DB_PATH)) {
      fs.unlinkSync(TEST_DB_PATH);
    }
    process.env.DATABASE_PATH = TEST_DB_PATH;

    const db = getDb(TEST_DB_PATH);
    runMigrations(db);
    seedDatabase({ db, includeDemo: false });
  });

  after(() => {
    closeDb();
    if (fs.existsSync(TEST_DB_PATH)) {
      try { fs.unlinkSync(TEST_DB_PATH); } catch {}
    }
    delete process.env.DATABASE_PATH;
  });

  it('initializes schema and seeds reference data correctly', () => {
    const db = getDb(TEST_DB_PATH);
    const catCount = db.prepare('SELECT count(*) as count FROM device_categories').get().count;
    const centerCount = db.prepare('SELECT count(*) as count FROM collection_centers').get().count;
    const subCount = db.prepare('SELECT count(*) as count FROM ewaste_submissions').get().count;

    assert.ok(catCount >= 4, 'Should have at least 4 device categories seeded');
    assert.ok(centerCount >= 6, 'Should have 6 collection centers seeded');
    assert.strictEqual(subCount, 0, 'Production/clean init should start with 0 submissions');
  });

  let createdId = null;
  let createdTrackingCode = null;

  it('persists a new submission atomically with calculation snapshot and recovery records', () => {
    const evalResult = evaluateEnvironmentalImpact({
      categoryId: 'cat-laptop',
      brand: 'Dell',
      model: 'Latitude 5420 / 5430',
      quantity: 2,
      purchaseYear: 2021,
      condition: 'Working with issues'
    });

    const recResult = recommendCircularPathway({
      category: 'cat-laptop',
      condition: 'Working with issues',
      ageYears: 5
    });

    createdTrackingCode = `ECL-TST-${Math.floor(1000 + Math.random() * 9000)}`;

    const submission = repository.createSubmission(
      {
        trackingCode: createdTrackingCode,
        userName: 'Priya Sharma',
        userEmail: 'priya@university.edu',
        categoryId: 'cat-laptop',
        categoryName: 'Laptops & Notebooks',
        cpcbCode: 'ITEW3',
        brand: 'Dell',
        model: 'Latitude 5420 / 5430',
        quantity: 2,
        purchaseYear: 2021,
        ageYears: 5,
        condition: 'Working with issues',
        weightKgPerUnit: 1.40,
        totalMassKg: 2.80,
        userIntendedPathway: 'Repair/refurbish',
        selectedCenterId: 'cc-blr-01',
        collectionMethod: 'Pickup Scheduled',
        notes: 'College lab machines for testing'
      },
      evalResult,
      recResult
    );

    assert.ok(submission);
    assert.strictEqual(submission.userName, 'Priya Sharma');
    assert.strictEqual(submission.status, 'Registered');
    assert.strictEqual(submission.quantity, 2);
    assert.strictEqual(submission.totalMassKg, 2.80);
    assert.ok(submission.statusHistory.length >= 1);
    assert.strictEqual(submission.statusHistory[0].status, 'Registered');

    createdId = submission.id;

    // Verify DB recovery records created
    const db = getDb(TEST_DB_PATH);
    const recoveryRows = db.prepare('SELECT * FROM recovery_records WHERE submission_id = ?').all(createdId);
    assert.ok(recoveryRows.length > 0, 'Recovery records must be persisted');
    // Initially actual_mass_kg must be 0
    assert.strictEqual(recoveryRows[0].actual_mass_kg, 0);
    assert.ok(recoveryRows[0].potential_mass_kg > 0);
  });

  it('retrieves submission by tracking code and ID', () => {
    const byId = repository.getSubmissionById(createdId);
    assert.ok(byId);
    assert.strictEqual(byId.id, createdId);

    const byTracking = repository.getSubmissionById(createdTrackingCode);
    assert.ok(byTracking);
    assert.strictEqual(byTracking.trackingCode, createdTrackingCode);
  });

  it('prevents invalid lifecycle status transitions (e.g. Registered -> Processing)', () => {
    assert.throws(
      () => {
        repository.updateSubmissionStatus(createdId, 'Processing', 'Attempt direct jump');
      },
      err => {
        return err.statusCode === 400 && err.message.includes('Invalid status transition');
      }
    );
  });

  it('executes valid deterministic lifecycle transitions: Registered -> Collected -> In Assessment -> Processing -> Recovered', () => {
    // 1. Registered -> Collected
    const s1 = repository.updateSubmissionStatus(createdId, 'Collected', 'Picked up by logistics team');
    assert.strictEqual(s1.status, 'Collected');

    // 2. Collected -> In Assessment
    const s2 = repository.updateSubmissionStatus(createdId, 'In Assessment', 'Diagnostic testing underway');
    assert.strictEqual(s2.status, 'In Assessment');

    // 3. In Assessment -> Processing
    const s3 = repository.updateSubmissionStatus(createdId, 'Processing', 'Dismantling and depollution');
    assert.strictEqual(s3.status, 'Processing');

    // Verify recovery records updated for operational processing
    const db = getDb(TEST_DB_PATH);
    const recProcessing = db.prepare('SELECT * FROM recovery_records WHERE submission_id = ?').all(createdId);
    assert.ok(recProcessing[0].actual_mass_kg > 0, 'Actual mass should be set once item enters processing');
    assert.strictEqual(recProcessing[0].is_confirmed, 0);

    // 4. Processing -> Recovered
    const s4 = repository.updateSubmissionStatus(createdId, 'Recovered', 'Metals batch confirmed');
    assert.strictEqual(s4.status, 'Recovered');

    const recRecovered = db.prepare('SELECT * FROM recovery_records WHERE submission_id = ?').all(createdId);
    assert.strictEqual(recRecovered[0].is_confirmed, 1, 'Should be confirmed once Recovered');

    // Check full history
    assert.strictEqual(s4.statusHistory.length, 5);
  });

  it('prevents transitions out of terminal Recovered status', () => {
    assert.throws(
      () => {
        repository.updateSubmissionStatus(createdId, 'Collected', 'Attempt backward jump');
      },
      err => {
        return err.statusCode === 400 && err.message.includes('Invalid status transition');
      }
    );
  });

  it('confirms data persistence across connection restart (server reboot simulation)', () => {
    // Close the DB connection
    closeDb();

    // Reopen from disk
    const reopenedDb = getDb(TEST_DB_PATH);
    const sub = repository.getSubmissionById(createdId);

    assert.ok(sub, 'Submission must survive database reconnection');
    assert.strictEqual(sub.id, createdId);
    assert.strictEqual(sub.status, 'Recovered');
    assert.strictEqual(sub.userName, 'Priya Sharma');
    assert.strictEqual(sub.statusHistory.length, 5);
    assert.ok(sub.evaluation);
    assert.strictEqual(sub.evaluation.totalMassKg, 2.80);
  });
});
