/**
 * EcoLoop Database Repository
 * Data Access Layer for Submissions, Status History, Impact Calculations, Recovery Records, Centers & Analytics.
 */

const { getDb } = require('./connection');

// Strict State Machine Lifecycle: Registered -> Collected -> In Assessment -> Processing -> Recovered
const VALID_STATUSES = ['Registered', 'Collected', 'In Assessment', 'Processing', 'Recovered'];

const VALID_TRANSITIONS = {
  'Registered': ['Collected'],
  'Collected': ['In Assessment'],
  'In Assessment': ['Processing'],
  'Processing': ['Recovered'],
  'Recovered': []
};

/**
 * Format submission record from DB row and attached entities into the API shape
 */
function formatSubmission(row, historyRows = [], calcRow = null) {
  if (!row) return null;

  let evaluation = null;
  if (calcRow) {
    try {
      const inputs = JSON.parse(calcRow.calculation_inputs || '{}');
      const breakdown = JSON.parse(calcRow.material_breakdown || '[]');
      const summary = JSON.parse(calcRow.recovery_estimates || '{}');
      const env = JSON.parse(calcRow.environmental_estimates || '{}');
      const sources = JSON.parse(calcRow.source_ids || '[]');

      evaluation = {
        available: calcRow.confidence_tier !== 'Unavailable',
        totalDevicesCount: row.quantity,
        unitWeightKg: row.weight_kg_per_unit,
        totalMassKg: row.total_declared_mass_kg,
        confidenceTier: calcRow.confidence_tier,
        referenceDataVersion: calcRow.reference_data_version,
        methodologyVersion: calcRow.methodology_version,
        weightResolution: {
          weightKg: row.weight_kg_per_unit,
          weightSourceType: row.weight_source_type,
          confidenceTier: row.weight_confidence,
          matchedModel: row.model
        },
        category: {
          id: row.category_id,
          name: row.category_name,
          cpcbCode: row.cpcb_code
        },
        ageYears: row.age_years,
        condition: row.condition,
        summary: {
          ...summary,
          totalMassKg: row.total_declared_mass_kg,
          estimatedMaterialPresentKg: row.total_declared_mass_kg,
          isActuallyProcessed: ['Processing', 'Recovered'].includes(row.status)
        },
        methodology: {
          co2eApproach: 'Per-material cradle-to-gate virgin vs secondary production substitution',
          equation: 'Avoided CO2e = Σ (Recovered Mass_i × (Primary Emission Factor_i - Secondary Recycling Emission Factor_i))',
          noUniversalConstantStatement: 'EcoLoop does NOT apply a generic "1 kg e-waste = X kg CO2" factor. Avoided GHG impacts are derived exclusively by summing physical metallurgical and polymer substitution across quantified elemental fractions.'
        },
        materialBreakdown: breakdown,
        dataSources: sources
      };
    } catch {
      evaluation = null;
    }
  }

  const statusHistory = historyRows.map(h => ({
    status: h.new_status,
    timestamp: h.timestamp,
    note: h.note || `Status transitioned to ${h.new_status}`,
    actor: h.actor || 'System'
  }));

  return {
    id: row.id,
    trackingCode: row.tracking_code,
    registeredAt: row.created_at,
    userId: row.user_id || 'usr-anonymous',
    userName: row.user_name,
    userEmail: row.user_email,
    categoryId: row.category_id,
    categoryName: row.category_name,
    cpcbCode: row.cpcb_code,
    brand: row.brand,
    model: row.model,
    quantity: row.quantity,
    purchaseYear: row.purchase_year,
    ageYears: row.age_years,
    condition: row.condition,
    weightKgPerUnit: row.weight_kg_per_unit,
    weightSource: row.weight_source_type,
    weightConfidence: row.weight_confidence,
    totalMassKg: row.total_declared_mass_kg,
    userIntendedPathway: row.user_intended_pathway,
    recommendedPathway: row.recommended_pathway,
    pathwayRationale: row.pathway_rationale,
    selectedCenterId: row.selected_center_id,
    collectionMethod: row.collection_method,
    notes: row.notes || '',
    status: row.status,
    isDemo: Boolean(row.is_demo),
    statusHistory: statusHistory.length > 0 ? statusHistory : [
      {
        status: row.status,
        timestamp: row.created_at,
        note: `Registered by ${row.user_name}`
      }
    ],
    evaluation
  };
}

/**
 * Retrieve all submissions matching filter criteria
 */
function getAllSubmissions(filters = {}) {
  const db = getDb();
  const { status, categoryId, search } = filters;

  let query = 'SELECT * FROM ewaste_submissions WHERE 1=1';
  const params = [];

  if (status) {
    query += ' AND LOWER(status) = LOWER(?)';
    params.push(status);
  }

  if (categoryId) {
    query += ' AND category_id = ?';
    params.push(categoryId);
  }

  if (search) {
    const q = `%${search.toLowerCase()}%`;
    query += ` AND (
      LOWER(tracking_code) LIKE ? OR
      LOWER(model) LIKE ? OR
      LOWER(brand) LIKE ? OR
      LOWER(user_name) LIKE ?
    )`;
    params.push(q, q, q, q);
  }

  query += ' ORDER BY created_at DESC';

  const rows = db.prepare(query).all(...params);

  // Hydrate history and calculations for each row
  return rows.map(row => {
    const historyRows = db.prepare(
      'SELECT * FROM submission_status_history WHERE submission_id = ? ORDER BY id ASC'
    ).all(row.id);

    const calcRow = db.prepare(
      'SELECT * FROM impact_calculations WHERE submission_id = ?'
    ).get(row.id);

    return formatSubmission(row, historyRows, calcRow);
  });
}

/**
 * Retrieve a single submission by ID or Tracking Code
 */
function getSubmissionById(idOrTrackingCode) {
  const db = getDb();
  const row = db.prepare(
    'SELECT * FROM ewaste_submissions WHERE id = ? OR tracking_code = ?'
  ).get(idOrTrackingCode, idOrTrackingCode);

  if (!row) return null;

  const historyRows = db.prepare(
    'SELECT * FROM submission_status_history WHERE submission_id = ? ORDER BY id ASC'
  ).all(row.id);

  const calcRow = db.prepare(
    'SELECT * FROM impact_calculations WHERE submission_id = ?'
  ).get(row.id);

  return formatSubmission(row, historyRows, calcRow);
}

/**
 * Create a new submission record with atomic history, calculation snapshot, and recovery items
 */
function createSubmission(submissionData, evaluation, recommendation) {
  const db = getDb();

  const id = submissionData.id || `SUB-${Date.now()}`;
  const trackingCode = submissionData.trackingCode;
  const createdAt = submissionData.registeredAt || new Date().toISOString();

  const tx = db.transaction(() => {
    // 1. Insert into ewaste_submissions
    db.prepare(`
      INSERT INTO ewaste_submissions (
        id, tracking_code, user_id, user_name, user_email, category_id,
        category_name, cpcb_code, brand, model, quantity, purchase_year,
        age_years, condition, weight_kg_per_unit, weight_source_type,
        weight_confidence, total_declared_mass_kg, user_intended_pathway,
        recommended_pathway, pathway_rationale, selected_center_id,
        collection_method, notes, status, is_demo, created_at, updated_at
      ) VALUES (
        ?, ?, ?, ?, ?, ?,
        ?, ?, ?, ?, ?, ?,
        ?, ?, ?, ?,
        ?, ?, ?,
        ?, ?, ?,
        ?, ?, ?, 0, ?, ?
      )
    `).run(
      id,
      trackingCode,
      submissionData.userId || `usr-${Math.floor(Math.random() * 9999)}`,
      submissionData.userName,
      submissionData.userEmail || 'anonymous@ecoloop.org',
      submissionData.categoryId,
      submissionData.categoryName || 'Electronic Device',
      submissionData.cpcbCode || 'N/A',
      submissionData.brand || 'Generic',
      submissionData.model || 'Standard Model',
      submissionData.quantity || 1,
      submissionData.purchaseYear || null,
      submissionData.ageYears || 3,
      submissionData.condition,
      evaluation.unitWeightKg || submissionData.weightKgPerUnit || 1.0,
      evaluation.weightResolution?.weightSourceType || 'Category Empirical Benchmark',
      evaluation.confidenceTier || 'Medium',
      evaluation.totalMassKg || submissionData.totalMassKg || 1.0,
      submissionData.userIntendedPathway || 'Not sure',
      recommendation.recommendedPathway || 'Formal Recycling',
      recommendation.rationale || 'Pathway evaluated via EcoLoop circular engine',
      submissionData.selectedCenterId || 'cc-blr-01',
      submissionData.collectionMethod || 'Drop-off at Center',
      submissionData.notes || '',
      'Registered',
      createdAt,
      createdAt
    );

    // 2. Insert initial status history
    db.prepare(`
      INSERT INTO submission_status_history (
        submission_id, previous_status, new_status, actor, note, timestamp
      ) VALUES (?, ?, ?, ?, ?, ?)
    `).run(
      id,
      null,
      'Registered',
      submissionData.userName,
      `Registered by ${submissionData.userName}. Intended: ${submissionData.userIntendedPathway || 'Recommended'}`,
      createdAt
    );

    // 3. Insert immutable calculation snapshot
    db.prepare(`
      INSERT INTO impact_calculations (
        id, submission_id, category_id, total_mass_kg, reference_data_version,
        methodology_version, data_level, confidence_tier, calculation_inputs,
        material_breakdown, recovery_estimates, environmental_estimates,
        source_ids, assumptions, warnings, created_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      `calc-${id}`,
      id,
      submissionData.categoryId,
      evaluation.totalMassKg || 0,
      evaluation.referenceDataVersion || '1.0',
      evaluation.methodologyVersion || '1.0',
      evaluation.weightResolution?.hierarchyLevel === 1 ? 'EXACT_MODEL' : 'CATEGORY_LEVEL',
      evaluation.confidenceTier || 'Medium',
      JSON.stringify({
        categoryId: submissionData.categoryId,
        brand: submissionData.brand,
        model: submissionData.model,
        quantity: submissionData.quantity,
        purchaseYear: submissionData.purchaseYear,
        condition: submissionData.condition,
        userWeightKg: submissionData.userWeightKg,
        userIntendedPathway: submissionData.userIntendedPathway
      }),
      JSON.stringify(evaluation.materialBreakdown || []),
      JSON.stringify(evaluation.summary || {}),
      JSON.stringify({
        avoidedCo2eKg: evaluation.summary?.potentialAvoidedCo2eKg || null,
        methodology: evaluation.methodology
      }),
      JSON.stringify(evaluation.dataSources || []),
      JSON.stringify(['Empirical metallurgical recovery factors from UNEP / JRC ProSUM']),
      JSON.stringify(evaluation.available ? [] : [evaluation.reason || 'Calculation unavailable']),
      createdAt
    );

    // 4. Insert recovery records (potential vs actual separation)
    if (evaluation.materialBreakdown && Array.isArray(evaluation.materialBreakdown)) {
      const insertRecovery = db.prepare(`
        INSERT INTO recovery_records (
          submission_id, material_id, material_name, category,
          potential_mass_kg, actual_mass_kg, avoided_co2e_kg, is_confirmed, recorded_at
        ) VALUES (?, ?, ?, ?, ?, 0, ?, 0, ?)
      `);

      for (const mat of evaluation.materialBreakdown) {
        insertRecovery.run(
          id,
          mat.materialId,
          mat.standardName,
          mat.category || 'Base Metals',
          mat.massPotentialRecoverableKg || 0,
          mat.potentialAvoidedCo2eKg || 0,
          createdAt
        );
      }
    }
  });

  tx();
  return getSubmissionById(id);
}

/**
 * Validate and update lifecycle status
 */
function updateSubmissionStatus(idOrTrackingCode, newStatus, note = null, actor = 'Operator') {
  const db = getDb();

  const subRow = db.prepare(
    'SELECT * FROM ewaste_submissions WHERE id = ? OR tracking_code = ?'
  ).get(idOrTrackingCode, idOrTrackingCode);

  if (!subRow) {
    const err = new Error('Submission not found');
    err.statusCode = 404;
    throw err;
  }

  const prevStatus = subRow.status;

  // Validate status is allowed
  if (!VALID_STATUSES.includes(newStatus)) {
    const err = new Error(`Invalid status. Must be one of: ${VALID_STATUSES.join(', ')}`);
    err.statusCode = 400;
    throw err;
  }

  // If status is unchanged, just record an informational note if provided
  if (prevStatus === newStatus) {
    if (note) {
      db.prepare(`
        INSERT INTO submission_status_history (
          submission_id, previous_status, new_status, actor, note, timestamp
        ) VALUES (?, ?, ?, ?, ?, ?)
      `).run(subRow.id, prevStatus, newStatus, actor, note, new Date().toISOString());
    }
    return getSubmissionById(subRow.id);
  }

  // Validate state machine flow: Registered -> Collected -> In Assessment -> Processing -> Recovered
  const allowedNext = VALID_TRANSITIONS[prevStatus] || [];
  if (!allowedNext.includes(newStatus)) {
    const err = new Error(
      `Invalid status transition from '${prevStatus}' to '${newStatus}'. Allowed next step is: ${allowedNext.join(', ') || 'None (terminal status)'}`
    );
    err.statusCode = 400;
    throw err;
  }

  const now = new Date().toISOString();
  const tx = db.transaction(() => {
    // 1. Update ewaste_submissions
    db.prepare(`
      UPDATE ewaste_submissions
      SET status = ?, updated_at = ?
      WHERE id = ?
    `).run(newStatus, now, subRow.id);

    // 2. Insert history record
    db.prepare(`
      INSERT INTO submission_status_history (
        submission_id, previous_status, new_status, actor, note, timestamp
      ) VALUES (?, ?, ?, ?, ?, ?)
    `).run(
      subRow.id,
      prevStatus,
      newStatus,
      actor,
      note || `Status transitioned from ${prevStatus} to ${newStatus}`,
      now
    );

    // 3. Operational recovery update:
    // If status reaches 'Processing' or 'Recovered', operational recovery is recorded
    const isProcessingOrRecovered = ['Processing', 'Recovered'].includes(newStatus);
    const isRecovered = newStatus === 'Recovered';

    if (isProcessingOrRecovered) {
      db.prepare(`
        UPDATE recovery_records
        SET actual_mass_kg = potential_mass_kg,
            is_confirmed = ?
        WHERE submission_id = ?
      `).run(isRecovered ? 1 : 0, subRow.id);
    }
  });

  tx();
  return getSubmissionById(subRow.id);
}

/**
 * Retrieve collection centers with optional filters
 */
function getCollectionCenters(filters = {}) {
  const db = getDb();
  const { city, categoryId, search } = filters;

  let query = 'SELECT * FROM collection_centers WHERE 1=1';
  const params = [];

  if (city) {
    query += ' AND LOWER(city) = LOWER(?)';
    params.push(city);
  }

  if (search) {
    const q = `%${search.toLowerCase()}%`;
    query += ` AND (
      LOWER(name) LIKE ? OR
      LOWER(city) LIKE ? OR
      LOWER(address) LIKE ? OR
      pincode LIKE ?
    )`;
    params.push(q, q, q, q);
  }

  query += ' ORDER BY name ASC';
  const rows = db.prepare(query).all(...params);

  // Filter category in JS since accepted_categories is JSON array string
  let centers = rows.map(r => {
    let acceptedCategories = [];
    let certifications = [];
    try { acceptedCategories = JSON.parse(r.accepted_categories || '[]'); } catch {}
    try { certifications = JSON.parse(r.certifications || '[]'); } catch {}

    return {
      id: r.id,
      name: r.name,
      operator: r.operator,
      cpcbRegistrationNo: r.cpcb_registration_no,
      address: r.address,
      city: r.city,
      state: r.state,
      pincode: r.pincode,
      phone: r.phone,
      email: r.email,
      operatingHours: r.operating_hours,
      status: r.status,
      acceptsDropOff: Boolean(r.accepts_drop_off),
      offersHomePickup: Boolean(r.offers_home_pickup),
      acceptedCategories,
      latitude: r.latitude,
      longitude: r.longitude,
      certifications
    };
  });

  if (categoryId) {
    centers = centers.filter(c => c.acceptedCategories.includes(categoryId));
  }

  return centers;
}

/**
 * Compute Management Analytics directly from database aggregations
 * Guarantees no double-counting and strict separation of potential vs actual recovery.
 */
function getAnalytics() {
  const db = getDb();

  // 1. Registered: All registered submissions
  const registeredStats = db.prepare(`
    SELECT
      COALESCE(SUM(quantity), 0) as units,
      COALESCE(SUM(total_declared_mass_kg), 0.0) as massKg
    FROM ewaste_submissions
  `).get();

  // 2. Collected: Submissions in ('Collected', 'In Assessment', 'Processing', 'Recovered')
  const collectedStats = db.prepare(`
    SELECT
      COALESCE(SUM(quantity), 0) as units,
      COALESCE(SUM(total_declared_mass_kg), 0.0) as massKg
    FROM ewaste_submissions
    WHERE status IN ('Collected', 'In Assessment', 'Processing', 'Recovered')
  `).get();

  // 3. Processed: Submissions in ('Processing', 'Recovered')
  const processedStats = db.prepare(`
    SELECT
      COALESCE(SUM(quantity), 0) as units,
      COALESCE(SUM(total_declared_mass_kg), 0.0) as massKg
    FROM ewaste_submissions
    WHERE status IN ('Processing', 'Recovered')
  `).get();

  // 4. Material Recovery:
  // Potential = all registered submissions' potential recovery
  const potentialRecoveryStats = db.prepare(`
    SELECT COALESCE(SUM(potential_mass_kg), 0.0) as potentialMassKg
    FROM recovery_records
  `).get();

  // Actual = physical mass extracted from items actually in Processing or Recovered
  const actualRecoveryStats = db.prepare(`
    SELECT
      COALESCE(SUM(actual_mass_kg), 0.0) as actualMassKg,
      COALESCE(SUM(avoided_co2e_kg), 0.0) as avoidedCo2eKg
    FROM recovery_records
    WHERE submission_id IN (
      SELECT id FROM ewaste_submissions WHERE status IN ('Processing', 'Recovered')
    )
  `).get();

  // 5. Status Pipeline Count
  const pipelineRows = db.prepare(`
    SELECT status, COALESCE(SUM(quantity), 0) as count
    FROM ewaste_submissions
    GROUP BY status
  `).all();

  const statusPipelineCount = {
    'Registered': 0,
    'Collected': 0,
    'In Assessment': 0,
    'Processing': 0,
    'Recovered': 0
  };
  for (const row of pipelineRows) {
    if (statusPipelineCount[row.status] !== undefined) {
      statusPipelineCount[row.status] = row.count;
    }
  }

  // 6. Category Breakdown
  const categoryBreakdown = db.prepare(`
    SELECT
      category_name as name,
      COALESCE(SUM(quantity), 0) as units,
      ROUND(COALESCE(SUM(total_declared_mass_kg), 0.0), 2) as massKg
    FROM ewaste_submissions
    GROUP BY category_name
    ORDER BY massKg DESC
  `).all();

  // 7. Circular Pathway Breakdown
  const pathwayBreakdown = db.prepare(`
    SELECT
      recommended_pathway as name,
      COALESCE(SUM(quantity), 0) as units,
      ROUND(COALESCE(SUM(total_declared_mass_kg), 0.0), 2) as massKg
    FROM ewaste_submissions
    GROUP BY recommended_pathway
    ORDER BY units DESC
  `).all();

  // 8. Materials Recovered Breakdown (aggregated from actual recovery records in processing/recovered)
  const materialsRows = db.prepare(`
    SELECT
      material_name as name,
      category,
      ROUND(COALESCE(SUM(actual_mass_kg), 0.0), 3) as massKg,
      ROUND(COALESCE(SUM(avoided_co2e_kg), 0.0), 2) as avoidedCo2eKg
    FROM recovery_records
    WHERE submission_id IN (
      SELECT id FROM ewaste_submissions WHERE status IN ('Processing', 'Recovered')
    )
    GROUP BY material_name, category
    HAVING massKg > 0
    ORDER BY massKg DESC
  `).all();

  // Critical raw materials identification
  const criticalMaterials = new Set(['mat-gold', 'mat-silver', 'mat-palladium', 'mat-battery']);
  const materialsRecovered = materialsRows.map(m => ({
    name: m.name,
    category: m.category,
    massKg: m.massKg,
    avoidedCo2eKg: m.avoidedCo2eKg,
    isCriticalRawMaterial: criticalMaterials.has(m.name.toLowerCase()) || m.category === 'Precious Metals'
  }));

  const regMass = Number(registeredStats.massKg.toFixed(2));
  const colMass = Number(collectedStats.massKg.toFixed(2));
  const procMass = Number(processedStats.massKg.toFixed(2));

  return {
    metrics: {
      registered: {
        units: registeredStats.units,
        massKg: regMass,
        definition: 'Total electronic equipment registered/logged in EcoLoop by users and organizations.'
      },
      collected: {
        units: collectedStats.units,
        massKg: colMass,
        definition: 'Physical equipment verified as collected via drop-off kiosks or logistics pickup.'
      },
      processed: {
        units: processedStats.units,
        massKg: procMass,
        definition: 'Equipment currently in triage, refurbishment benches, or industrial dismantling lines.'
      },
      materialRecovered: {
        massKg: Number(actualRecoveryStats.actualMassKg.toFixed(2)),
        potentialMassKg: Number(potentialRecoveryStats.potentialMassKg.toFixed(2)),
        definition: 'Estimated usable secondary metals, engineering plastics, and active materials reclaimed from processed stream based on recovery yields.'
      },
      avoidedCo2eKg: Number(actualRecoveryStats.avoidedCo2eKg.toFixed(2)),
      collectionRatePercent: regMass > 0 ? Number(((colMass / regMass) * 100).toFixed(1)) : 0,
      processingRatePercent: colMass > 0 ? Number(((procMass / colMass) * 100).toFixed(1)) : 0
    },
    statusPipelineCount,
    categoryBreakdown,
    pathwayBreakdown,
    materialsRecovered,
    methodologyNotes: 'All material recoveries and avoided CO2e figures are computed through peer-reviewed metallurgical yields (UNEP, EU JRC ProSUM, US EPA WARM v15).'
  };
}

/**
 * Build Circular Journey stages from database records
 */
function getCircularJourney(trackingCode) {
  const sub = getSubmissionById(trackingCode);
  if (!sub) return null;

  const stages = [
    {
      stage: '1. Registration & Profiling',
      title: 'Digital Inception',
      completed: true,
      current: sub.status === 'Registered',
      date: sub.statusHistory.find(h => h.status === 'Registered')?.timestamp || sub.registeredAt,
      description: `Device registered with ${sub.weightConfidence} confidence tier. Initial mass: ${sub.totalMassKg} kg.`
    },
    {
      stage: '2. Formal Collection',
      title: 'Secure Logistics & Custody',
      completed: ['Collected', 'In Assessment', 'Processing', 'Recovered'].includes(sub.status),
      current: sub.status === 'Collected',
      date: sub.statusHistory.find(h => h.status === 'Collected')?.timestamp || null,
      description: `${sub.collectionMethod} via ${sub.selectedCenterId || 'Central Hub'}.`
    },
    {
      stage: '3. Technical Assessment',
      title: 'Condition Diagnostic & Grading',
      completed: ['In Assessment', 'Processing', 'Recovered'].includes(sub.status),
      current: sub.status === 'In Assessment',
      date: sub.statusHistory.find(h => h.status === 'In Assessment')?.timestamp || null,
      description: `Graded: ${sub.condition}. Pathway determined: ${sub.recommendedPathway}.`
    },
    {
      stage: '4. Circular Loop Execution',
      title: 'Reuse / Refurbish / Smelting',
      completed: ['Processing', 'Recovered'].includes(sub.status),
      current: sub.status === 'Processing',
      date: sub.statusHistory.find(h => h.status === 'Processing')?.timestamp || null,
      description: `Undergoing ${sub.recommendedPathway}. Depollution and critical raw material separation in progress.`
    },
    {
      stage: '5. Value Regeneration',
      title: 'Secondary Materials to New Products',
      completed: sub.status === 'Recovered',
      current: sub.status === 'Recovered',
      date: sub.statusHistory.find(h => h.status === 'Recovered')?.timestamp || null,
      description: sub.status === 'Recovered'
        ? `Closed Loop Complete! Avoided ~${sub.evaluation?.summary?.potentialAvoidedCo2eKg || 0} kg CO2e virgin extraction emissions.`
        : 'Awaiting completion of secondary smelting and regranulation.'
    }
  ];

  return {
    submission: sub,
    journey: {
      trackingCode: sub.trackingCode,
      device: `${sub.brand} ${sub.model}`,
      category: sub.categoryName,
      status: sub.status,
      recommendedPathway: sub.recommendedPathway,
      stages
    }
  };
}

module.exports = {
  VALID_STATUSES,
  VALID_TRANSITIONS,
  getAllSubmissions,
  getSubmissionById,
  createSubmission,
  updateSubmissionStatus,
  getCollectionCenters,
  getAnalytics,
  getCircularJourney
};
