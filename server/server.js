const express = require('express');
const cors = require('cors');
const path = require('path');
const fs = require('fs');

const { evaluateEnvironmentalImpact } = require('./calculator');
const { recommendCircularPathway } = require('./circular-engine');
const { getDb } = require('./db/connection');
const { runMigrations } = require('./db/migrate');
const { seedDatabase } = require('./db/seed');
const {
  VALID_STATUSES,
  getAllSubmissions,
  getSubmissionById,
  createSubmission,
  updateSubmissionStatus,
  getCollectionCenters,
  getAnalytics,
  getCircularJourney
} = require('./db/repository');

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

// Initialize Database (schema migrations and reference data seed)
try {
  const db = getDb();
  runMigrations(db);
  seedDatabase({ db, includeDemo: process.env.LOAD_DEMO_DATA === 'true' });
  console.log('[EcoLoop Backend] SQLite database connected and verified.');
} catch (dbInitErr) {
  console.error('[EcoLoop Backend] Database initialization error:', dbInitErr);
}

// Load static reference datasets for quick lookup endpoints
const referencesData = JSON.parse(fs.readFileSync(path.join(__dirname, '../data/scientific-references.json'), 'utf8'));
const devicesData = JSON.parse(fs.readFileSync(path.join(__dirname, '../data/reference-devices.json'), 'utf8'));

// Allowed condition enums
const VALID_CONDITIONS = [
  'Fully working',
  'Working with issues',
  'Non-working',
  'Physically damaged'
];

// ==========================================
// 1. Scientific & Reference Data Endpoints
// ==========================================

app.get('/api/references', (req, res) => {
  res.json({
    success: true,
    count: referencesData.references.length,
    references: referencesData.references
  });
});

app.get('/api/categories', (req, res) => {
  res.json({
    success: true,
    categories: devicesData.categories
  });
});

app.get('/api/exact-models', (req, res) => {
  const { categoryId, brand } = req.query;
  let models = devicesData.exactModels;
  if (categoryId) {
    models = models.filter(m => m.categoryId === categoryId);
  }
  if (brand) {
    models = models.filter(m => m.brand.toLowerCase() === brand.toLowerCase());
  }
  res.json({
    success: true,
    models
  });
});

// ==========================================
// 2. Environmental Impact Calculator API
// ==========================================

app.post('/api/calculator/evaluate', (req, res) => {
  try {
    const {
      categoryId,
      brand,
      model,
      quantity,
      purchaseYear,
      condition,
      userWeightKg,
      userIntendedPathway
    } = req.body;

    // Validation
    if (!categoryId) {
      return res.status(400).json({
        success: false,
        error: 'Missing required field: categoryId'
      });
    }

    if (quantity !== undefined && (isNaN(Number(quantity)) || Number(quantity) < 1)) {
      return res.status(400).json({
        success: false,
        error: 'Quantity must be a positive integer (minimum 1).'
      });
    }

    if (userWeightKg !== undefined && userWeightKg !== null && userWeightKg !== '') {
      const parsedWeight = Number(userWeightKg);
      if (isNaN(parsedWeight) || parsedWeight <= 0) {
        return res.status(400).json({
          success: false,
          error: 'User specified weight must be a positive number greater than 0 kg.'
        });
      }
    }

    const evaluation = evaluateEnvironmentalImpact({
      categoryId,
      brand,
      model,
      quantity,
      purchaseYear,
      condition,
      userWeightKg,
      userIntendedPathway,
      isActuallyProcessed: false
    });

    const currentYear = 2026;
    const ageYears = purchaseYear ? Math.max(0, currentYear - parseInt(purchaseYear, 10)) : 3;
    const recommendation = recommendCircularPathway({
      category: categoryId,
      condition,
      ageYears,
      userIntendedPathway
    });

    res.json({
      success: true,
      evaluation,
      recommendation
    });
  } catch (error) {
    console.error('Calculator evaluation error:', error);
    res.status(500).json({
      success: false,
      error: 'An error occurred during calculation: ' + error.message
    });
  }
});

// ==========================================
// 3. User Submissions & Registration API
// ==========================================

app.get('/api/submissions', (req, res) => {
  try {
    const { status, categoryId, search } = req.query;
    const submissions = getAllSubmissions({ status, categoryId, search });

    res.json({
      success: true,
      count: submissions.length,
      submissions
    });
  } catch (err) {
    console.error('Failed to retrieve submissions:', err);
    res.status(500).json({ success: false, error: 'Database error retrieving submissions.' });
  }
});

app.get('/api/submissions/:id', (req, res) => {
  try {
    const sub = getSubmissionById(req.params.id);
    if (!sub) {
      return res.status(404).json({ success: false, error: 'Submission not found' });
    }
    res.json({ success: true, submission: sub });
  } catch (err) {
    console.error('Failed to retrieve submission:', err);
    res.status(500).json({ success: false, error: 'Database error retrieving submission.' });
  }
});

app.post('/api/submissions', (req, res) => {
  try {
    const {
      userName,
      userEmail,
      categoryId,
      brand,
      model,
      quantity = 1,
      purchaseYear,
      condition,
      userWeightKg,
      userIntendedPathway,
      selectedCenterId,
      collectionMethod,
      notes
    } = req.body;

    // Strict Input Validation
    if (!userName || typeof userName !== 'string' || !userName.trim()) {
      return res.status(400).json({
        success: false,
        error: 'Missing required field: userName (must be a non-empty string).'
      });
    }

    if (!categoryId || typeof categoryId !== 'string') {
      return res.status(400).json({
        success: false,
        error: 'Missing required field: categoryId.'
      });
    }

    const categoryObj = devicesData.categories.find(c => c.id === categoryId);
    if (!categoryObj) {
      return res.status(400).json({
        success: false,
        error: `Invalid categoryId '${categoryId}'. Must be an authorized e-waste category.`
      });
    }

    if (!condition) {
      return res.status(400).json({
        success: false,
        error: 'Missing required field: condition.'
      });
    }

    const normalizedCondition = VALID_CONDITIONS.find(
      c => c.toLowerCase() === String(condition).trim().toLowerCase()
    );
    if (!normalizedCondition) {
      return res.status(400).json({
        success: false,
        error: `Invalid condition '${condition}'. Allowed values: ${VALID_CONDITIONS.join(', ')}.`
      });
    }

    const parsedQty = parseInt(quantity, 10);
    if (isNaN(parsedQty) || parsedQty < 1) {
      return res.status(400).json({
        success: false,
        error: 'Quantity must be a valid integer greater than or equal to 1.'
      });
    }

    if (userWeightKg !== undefined && userWeightKg !== null && userWeightKg !== '') {
      const parsedWeight = Number(userWeightKg);
      if (isNaN(parsedWeight) || parsedWeight <= 0) {
        return res.status(400).json({
          success: false,
          error: 'Unit weight must be a positive number greater than 0 kg.'
        });
      }
    }

    const currentYear = 2026;
    let validPurchaseYear = null;
    if (purchaseYear !== undefined && purchaseYear !== null && purchaseYear !== '') {
      const py = parseInt(purchaseYear, 10);
      if (isNaN(py) || py < 1990 || py > currentYear) {
        return res.status(400).json({
          success: false,
          error: `Purchase year must be between 1990 and ${currentYear}.`
        });
      }
      validPurchaseYear = py;
    }

    const ageYears = validPurchaseYear ? Math.max(0, currentYear - validPurchaseYear) : 3;

    // Run scientific calculation
    const evaluation = evaluateEnvironmentalImpact({
      categoryId,
      brand,
      model,
      quantity: parsedQty,
      purchaseYear: validPurchaseYear,
      condition: normalizedCondition,
      userWeightKg,
      userIntendedPathway,
      isActuallyProcessed: false
    });

    // Run circular pathway recommendation
    const recommendation = recommendCircularPathway({
      category: categoryId,
      condition: normalizedCondition,
      ageYears,
      userIntendedPathway
    });

    const trackingSuffix = Math.floor(1000 + Math.random() * 9000);
    const catCode = categoryObj ? categoryObj.cpcbCode.slice(0, 3) : 'DEV';
    const trackingCode = `ECL-${catCode}-${trackingSuffix}`;
    const id = `SUB-${Date.now()}`;

    // Persist into Relational Database
    const newSubmission = createSubmission(
      {
        id,
        trackingCode,
        userName: userName.trim(),
        userEmail: userEmail ? userEmail.trim() : 'anonymous@ecoloop.org',
        categoryId,
        categoryName: categoryObj.name,
        cpcbCode: categoryObj.cpcbCode,
        brand: brand ? brand.trim() : 'Generic',
        model: model ? model.trim() : 'Standard Model',
        quantity: parsedQty,
        purchaseYear: validPurchaseYear,
        ageYears,
        condition: normalizedCondition,
        weightKgPerUnit: evaluation.unitWeightKg || 1.0,
        totalMassKg: evaluation.totalMassKg || 1.0,
        userIntendedPathway: userIntendedPathway || 'Not sure',
        selectedCenterId: selectedCenterId || 'cc-blr-01',
        collectionMethod: collectionMethod || 'Drop-off at Center',
        notes: notes ? notes.trim() : ''
      },
      evaluation,
      recommendation
    );

    res.status(201).json({
      success: true,
      message: 'E-Waste device successfully registered in EcoLoop database',
      submission: newSubmission
    });
  } catch (err) {
    console.error('Submission creation error:', err);
    res.status(500).json({ success: false, error: err.message || 'Error persisting submission' });
  }
});

// Update workflow status (Registered -> Collected -> In Assessment -> Processing -> Recovered)
app.patch('/api/submissions/:id/status', (req, res) => {
  try {
    const { status, note, actor } = req.body;

    if (!status) {
      return res.status(400).json({
        success: false,
        error: 'Missing required field: status'
      });
    }

    if (!VALID_STATUSES.includes(status)) {
      return res.status(400).json({
        success: false,
        error: `Invalid status. Must be one of: ${VALID_STATUSES.join(', ')}`
      });
    }

    const updatedSub = updateSubmissionStatus(
      req.params.id,
      status,
      note,
      actor || 'EcoLoop Operations'
    );

    res.json({
      success: true,
      message: `Status updated to ${status}`,
      submission: updatedSub
    });
  } catch (err) {
    if (err.statusCode === 404) {
      return res.status(404).json({ success: false, error: err.message });
    }
    if (err.statusCode === 400) {
      return res.status(400).json({ success: false, error: err.message });
    }
    console.error('Status transition error:', err);
    res.status(500).json({ success: false, error: err.message || 'Database status update error' });
  }
});

// ==========================================
// 4. Collection Centers API
// ==========================================

app.get('/api/collection-centers', (req, res) => {
  try {
    const { city, categoryId, search } = req.query;
    const centers = getCollectionCenters({ city, categoryId, search });

    res.json({
      success: true,
      count: centers.length,
      centers
    });
  } catch (err) {
    console.error('Collection centers retrieval error:', err);
    res.status(500).json({ success: false, error: 'Failed to retrieve collection centers.' });
  }
});

// ==========================================
// 5. Circular Journey Visualizer API
// ==========================================

app.get('/api/circular-journey/:trackingCode', (req, res) => {
  try {
    const journeyData = getCircularJourney(req.params.trackingCode);
    if (!journeyData) {
      return res.status(404).json({ success: false, error: 'Device tracking code not found' });
    }

    res.json({
      success: true,
      submission: journeyData.submission,
      journey: journeyData.journey
    });
  } catch (err) {
    console.error('Circular journey retrieval error:', err);
    res.status(500).json({ success: false, error: 'Failed to retrieve circular journey.' });
  }
});

// ==========================================
// 6. Management Analytics Dashboard API
// ==========================================

app.get('/api/analytics', (req, res) => {
  try {
    const analytics = getAnalytics();
    res.json({
      success: true,
      ...analytics
    });
  } catch (err) {
    console.error('Analytics computation error:', err);
    res.status(500).json({ success: false, error: 'Failed to compute management analytics.' });
  }
});

// Serve frontend build if exists
app.use(express.static(path.join(__dirname, '../dist')));

app.use((req, res, next) => {
  if (req.path.startsWith('/api')) {
    return next();
  }
  const indexPath = path.join(__dirname, '../dist/index.html');
  if (fs.existsSync(indexPath)) {
    res.sendFile(indexPath);
  } else {
    res.send(`<h2>EcoLoop API is running on port ${PORT}. Frontend is running via Vite.</h2>`);
  }
});

if (require.main === module) {
  app.listen(PORT, () => {
    console.log(`[EcoLoop Server] API running on http://localhost:${PORT}`);
  });
}

module.exports = app;
