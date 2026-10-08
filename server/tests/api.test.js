/**
 * EcoLoop API End-to-End Integration Tests
 * Verifies all Express endpoints against SQLite persistence.
 */

const { describe, it, before, after } = require('node:test');
const assert = require('node:assert');
const path = require('path');
const fs = require('fs');
const http = require('http');

const app = require('../server');
const { closeDb } = require('../db/connection');

const API_TEST_DB = path.join(__dirname, '../../data/test_api.db');
let server = null;
let baseUrl = '';

describe('API End-to-End Integration', () => {

  before(async () => {
    if (fs.existsSync(API_TEST_DB)) {
      fs.unlinkSync(API_TEST_DB);
    }
    process.env.DATABASE_PATH = API_TEST_DB;

    await new Promise((resolve) => {
      server = http.createServer(app);
      server.listen(0, '127.0.0.1', () => {
        const port = server.address().port;
        baseUrl = `http://127.0.0.1:${port}/api`;
        resolve();
      });
    });
  });

  after(async () => {
    if (server) {
      await new Promise(resolve => server.close(resolve));
    }
    closeDb();
    if (fs.existsSync(API_TEST_DB)) {
      try { fs.unlinkSync(API_TEST_DB); } catch {}
    }
    delete process.env.DATABASE_PATH;
  });

  it('GET /api/categories returns valid categories list', async () => {
    const res = await fetch(`${baseUrl}/categories`);
    assert.strictEqual(res.status, 200);
    const data = await res.json();
    assert.strictEqual(data.success, true);
    assert.ok(Array.isArray(data.categories));
    assert.ok(data.categories.length > 0);
  });

  it('GET /api/exact-models supports filtering by categoryId and brand', async () => {
    const res = await fetch(`${baseUrl}/exact-models?categoryId=cat-laptop&brand=Dell`);
    assert.strictEqual(res.status, 200);
    const data = await res.json();
    assert.strictEqual(data.success, true);
    assert.ok(data.models.every(m => m.brand.toLowerCase() === 'dell'));
  });

  it('POST /api/calculator/evaluate performs calculation', async () => {
    const res = await fetch(`${baseUrl}/calculator/evaluate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        categoryId: 'cat-laptop',
        brand: 'Dell',
        model: 'Latitude 5420 / 5430',
        quantity: 2,
        condition: 'Working with issues'
      })
    });
    assert.strictEqual(res.status, 200);
    const data = await res.json();
    assert.strictEqual(data.success, true);
    assert.strictEqual(data.evaluation.totalMassKg, 2.80);
    assert.ok(data.recommendation.recommendedPathway);
  });

  it('POST /api/calculator/evaluate validates inputs', async () => {
    const res = await fetch(`${baseUrl}/calculator/evaluate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        categoryId: 'cat-laptop',
        quantity: -5
      })
    });
    assert.strictEqual(res.status, 400);
    const data = await res.json();
    assert.strictEqual(data.success, false);
    assert.ok(data.error.includes('Quantity'));
  });

  it('GET /api/collection-centers returns center list', async () => {
    const res = await fetch(`${baseUrl}/collection-centers`);
    assert.strictEqual(res.status, 200);
    const data = await res.json();
    assert.strictEqual(data.success, true);
    assert.ok(data.centers.length >= 6);
  });

  let createdSubId = null;
  let createdTracking = null;

  it('POST /api/submissions creates and persists new submission', async () => {
    const res = await fetch(`${baseUrl}/submissions`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        userName: 'Aarav Patel',
        userEmail: 'aarav@ecoloop.org',
        categoryId: 'cat-laptop',
        brand: 'Dell',
        model: 'Latitude 5420 / 5430',
        quantity: 1,
        condition: 'Working with issues',
        userIntendedPathway: 'Repair/refurbish',
        selectedCenterId: 'cc-blr-01',
        collectionMethod: 'Drop-off at Center',
        notes: 'Integration test machine'
      })
    });

    assert.strictEqual(res.status, 201);
    const data = await res.json();
    assert.strictEqual(data.success, true);
    assert.ok(data.submission.id);
    assert.ok(data.submission.trackingCode);
    assert.strictEqual(data.submission.status, 'Registered');

    createdSubId = data.submission.id;
    createdTracking = data.submission.trackingCode;
  });

  it('POST /api/submissions rejects invalid submission (validation error)', async () => {
    const res = await fetch(`${baseUrl}/submissions`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        userName: '',
        categoryId: 'cat-laptop',
        condition: 'Working with issues'
      })
    });

    assert.strictEqual(res.status, 400);
    const data = await res.json();
    assert.strictEqual(data.success, false);
    assert.ok(data.error.includes('userName'));
  });

  it('GET /api/submissions lists persisted submissions', async () => {
    const res = await fetch(`${baseUrl}/submissions`);
    assert.strictEqual(res.status, 200);
    const data = await res.json();
    assert.strictEqual(data.success, true);
    assert.ok(data.submissions.some(s => s.id === createdSubId));
  });

  it('PATCH /api/submissions/:id/status updates state along valid lifecycle', async () => {
    const res = await fetch(`${baseUrl}/submissions/${createdSubId}/status`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        status: 'Collected',
        note: 'Drop-off verified at Whitefield hub'
      })
    });

    assert.strictEqual(res.status, 200);
    const data = await res.json();
    assert.strictEqual(data.success, true);
    assert.strictEqual(data.submission.status, 'Collected');
  });

  it('PATCH /api/submissions/:id/status blocks invalid status transition', async () => {
    const res = await fetch(`${baseUrl}/submissions/${createdSubId}/status`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        status: 'Recovered',
        note: 'Attempting invalid skip'
      })
    });

    assert.strictEqual(res.status, 400);
    const data = await res.json();
    assert.strictEqual(data.success, false);
    assert.ok(data.error.includes('Invalid status transition'));
  });

  it('GET /api/circular-journey/:trackingCode returns visualizer payload', async () => {
    const res = await fetch(`${baseUrl}/circular-journey/${createdTracking}`);
    assert.strictEqual(res.status, 200);
    const data = await res.json();
    assert.strictEqual(data.success, true);
    assert.strictEqual(data.journey.trackingCode, createdTracking);
    assert.strictEqual(data.journey.stages.length, 5);
  });

  it('GET /api/analytics returns database-backed aggregation', async () => {
    const res = await fetch(`${baseUrl}/analytics`);
    assert.strictEqual(res.status, 200);
    const data = await res.json();
    assert.strictEqual(data.success, true);
    assert.ok(data.metrics.registered.units >= 1);
    assert.ok(data.metrics.collected.units >= 1);
  });
});
