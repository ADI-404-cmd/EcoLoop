/**
 * EcoLoop Database Seeder
 * Populates scientific reference tables, collection centers, and optional demo submissions.
 */

const fs = require('fs');
const path = require('path');
const { getDb } = require('./connection');
const { evaluateEnvironmentalImpact } = require('../calculator');
const { recommendCircularPathway } = require('../circular-engine');

const DATA_DIR = path.join(__dirname, '../../data');

function seedDatabase(options = {}) {
  const { db = null, includeDemo = false } = options;
  const dbInstance = db || getDb();

  // Load JSON datasets
  const referencesData = JSON.parse(fs.readFileSync(path.join(DATA_DIR, 'scientific-references.json'), 'utf8'));
  const devicesData = JSON.parse(fs.readFileSync(path.join(DATA_DIR, 'reference-devices.json'), 'utf8'));
  const recoveryData = JSON.parse(fs.readFileSync(path.join(DATA_DIR, 'material-recovery-factors.json'), 'utf8'));
  const centersData = JSON.parse(fs.readFileSync(path.join(DATA_DIR, 'collection-centers-seed.json'), 'utf8'));

  const seedTransaction = dbInstance.transaction(() => {
    // 1. Seed Sources
    const insertSource = dbInstance.prepare(`
      INSERT OR REPLACE INTO sources (
        id, short_code, title, authors, organization, publication_year,
        source_type, url_or_doi, parameters_supported, geographical_scope,
        methodology_notes, limitations
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    for (const ref of referencesData.references) {
      insertSource.run(
        ref.id,
        ref.shortCode,
        ref.title,
        ref.authors || null,
        ref.organization,
        ref.year,
        ref.type || 'technical_report',
        ref.doiOrUrl || null,
        JSON.stringify(ref.parametersSupported || []),
        ref.geographicalScope || 'Global',
        ref.notes || null,
        ref.limitations || null
      );
    }

    // 2. Seed Device Categories
    const insertCategory = dbInstance.prepare(`
      INSERT OR REPLACE INTO device_categories (
        id, name, cpcb_code, description, default_weight_kg,
        reference_source_id, composition_id, typical_lifespan_years, v1_calculation_status
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    for (const cat of devicesData.categories) {
      insertCategory.run(
        cat.id,
        cat.name,
        cat.cpcbCode,
        cat.description || null,
        cat.defaultWeightKg,
        cat.referenceSourceId || null,
        cat.compositionId || null,
        cat.lifespanYears?.typical || 5,
        cat.v1CalculationStatus || 'READY'
      );
    }

    // 3. Seed Verified Exact Devices
    const insertDevice = dbInstance.prepare(`
      INSERT OR REPLACE INTO devices (
        id, category_id, brand, model, weight_kg,
        source_id, source_detail, confidence_tier
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `);

    for (const dev of devicesData.exactModels) {
      insertDevice.run(
        dev.id,
        dev.categoryId,
        dev.brand,
        dev.model,
        dev.weightKg,
        dev.sourceId,
        dev.sourceDetail || null,
        dev.confidenceTier || 'High'
      );
    }

    // 4. Seed Materials
    const insertMaterial = dbInstance.prepare(`
      INSERT OR REPLACE INTO materials (
        id, name, category, recovery_efficiency, recovery_method,
        avoided_co2e_factor_kg_per_kg, primary_emission_factor_kg_per_kg,
        secondary_emission_factor_kg_per_kg, is_critical_raw_material,
        hazard_level, source_id, citation_notes
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    for (const [matId, mat] of Object.entries(recoveryData.materials)) {
      insertMaterial.run(
        matId,
        mat.name,
        mat.category,
        mat.recoveryEfficiency || 0.0,
        mat.recoveryMethod || 'Mechanical separation',
        mat.avoidedCo2eFactorKgPerKg || 0.0,
        mat.primaryEmissionFactorKgPerKg || null,
        mat.secondaryEmissionFactorKgPerKg || null,
        mat.isCriticalRawMaterial ? 1 : 0,
        mat.hazardLevel || 'Low',
        mat.sourceId || null,
        mat.citationNotes || null
      );
    }

    // 5. Seed Material Compositions
    const insertComposition = dbInstance.prepare(`
      INSERT OR REPLACE INTO material_compositions (
        id, composition_id, name, source_id, materials_json
      ) VALUES (?, ?, ?, ?, ?)
    `);

    for (const [compKey, comp] of Object.entries(recoveryData.compositions)) {
      insertComposition.run(
        compKey,
        compKey,
        comp.name,
        comp.sourceId,
        JSON.stringify(comp.materials)
      );
    }

    // 6. Seed CPCB EPR Factors (Regulatory quotas)
    const insertEpr = dbInstance.prepare(`
      INSERT OR REPLACE INTO cpcb_epr_factors (
        id, category_id, cpcb_code, metal, recoverable_percentage, source_id
      ) VALUES (?, ?, ?, ?, ?, ?)
    `);

    // Standard CPCB EPR Schedule-I targets for key e-waste categories
    const eprSchedule = [
      { id: 'epr-itew3-au', categoryId: 'cat-laptop', cpcbCode: 'ITEW3', metal: 'Gold (Au)', percentage: 0.02, sourceId: 'ref-cpcb-rules-2022' },
      { id: 'epr-itew3-cu', categoryId: 'cat-laptop', cpcbCode: 'ITEW3', metal: 'Copper (Cu)', percentage: 12.0, sourceId: 'ref-cpcb-rules-2022' },
      { id: 'epr-itew3-fe', categoryId: 'cat-laptop', cpcbCode: 'ITEW3', metal: 'Iron (Fe)', percentage: 22.0, sourceId: 'ref-cpcb-rules-2022' },
      { id: 'epr-itew3-al', categoryId: 'cat-laptop', cpcbCode: 'ITEW3', metal: 'Aluminum (Al)', percentage: 17.0, sourceId: 'ref-cpcb-rules-2022' },
      { id: 'epr-itew15-au', categoryId: 'cat-smartphone', cpcbCode: 'ITEW15', metal: 'Gold (Au)', percentage: 0.03, sourceId: 'ref-cpcb-rules-2022' },
      { id: 'epr-itew15-cu', categoryId: 'cat-smartphone', cpcbCode: 'ITEW15', metal: 'Copper (Cu)', percentage: 14.0, sourceId: 'ref-cpcb-rules-2022' },
      { id: 'epr-itew1-fe', categoryId: 'cat-desktop', cpcbCode: 'ITEW1', metal: 'Iron (Fe)', percentage: 45.0, sourceId: 'ref-cpcb-rules-2022' },
      { id: 'epr-itew1-cu', categoryId: 'cat-desktop', cpcbCode: 'ITEW1', metal: 'Copper (Cu)', percentage: 6.0, sourceId: 'ref-cpcb-rules-2022' }
    ];

    for (const epr of eprSchedule) {
      insertEpr.run(epr.id, epr.categoryId, epr.cpcbCode, epr.metal, epr.percentage, epr.sourceId);
    }

    // 7. Seed Collection Centers
    const insertCenter = dbInstance.prepare(`
      INSERT OR REPLACE INTO collection_centers (
        id, name, operator, cpcb_registration_no, address, city, state,
        pincode, phone, email, operating_hours, status, accepts_drop_off,
        offers_home_pickup, accepted_categories, latitude, longitude, certifications
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    for (const c of centersData.centers) {
      insertCenter.run(
        c.id,
        c.name,
        c.operator,
        c.cpcbRegistrationNo,
        c.address,
        c.city,
        c.state,
        c.pincode,
        c.phone || null,
        c.email || null,
        c.operatingHours || null,
        c.status || 'Accepting E-Waste',
        c.acceptsDropOff ? 1 : 0,
        c.offersHomePickup ? 1 : 0,
        JSON.stringify(c.acceptedCategories || []),
        c.latitude || null,
        c.longitude || null,
        JSON.stringify(c.certifications || [])
      );
    }

    // 8. Optional Demo Submissions (only if explicitly requested)
    if (includeDemo) {
      const demoPath = path.join(DATA_DIR, 'initial-submissions-seed.json');
      if (fs.existsSync(demoPath)) {
        const demoData = JSON.parse(fs.readFileSync(demoPath, 'utf8'));

        const insertSubmission = dbInstance.prepare(`
          INSERT OR REPLACE INTO ewaste_submissions (
            id, tracking_code, user_id, user_name, user_email, category_id,
            category_name, cpcb_code, brand, model, quantity, purchase_year,
            age_years, condition, weight_kg_per_unit, weight_source_type,
            weight_confidence, total_declared_mass_kg, user_intended_pathway,
            recommended_pathway, pathway_rationale, selected_center_id,
            collection_method, notes, status, is_demo, created_at, updated_at
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 1, ?, ?)
        `);

        const insertHistory = dbInstance.prepare(`
          INSERT INTO submission_status_history (
            submission_id, previous_status, new_status, actor, note, timestamp
          ) VALUES (?, ?, ?, ?, ?, ?)
        `);

        const insertCalc = dbInstance.prepare(`
          INSERT OR REPLACE INTO impact_calculations (
            id, submission_id, category_id, total_mass_kg, reference_data_version,
            methodology_version, data_level, confidence_tier, calculation_inputs,
            material_breakdown, recovery_estimates, environmental_estimates,
            source_ids, assumptions, warnings
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `);

        const insertRecovery = dbInstance.prepare(`
          INSERT INTO recovery_records (
            submission_id, material_id, material_name, category,
            potential_mass_kg, actual_mass_kg, avoided_co2e_kg, is_confirmed, recorded_at
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
        `);

        for (const sub of demoData.submissions) {
          const isProcessed = sub.status === 'Processing' || sub.status === 'Recovered';
          const isConfirmed = sub.status === 'Recovered' ? 1 : 0;

          const evalResult = evaluateEnvironmentalImpact({
            categoryId: sub.categoryId,
            brand: sub.brand,
            model: sub.model,
            quantity: sub.quantity,
            purchaseYear: sub.purchaseYear,
            condition: sub.condition,
            userWeightKg: sub.weightSource === 'User-Specified Weight' ? sub.weightKgPerUnit : null,
            userIntendedPathway: sub.userIntendedPathway,
            isActuallyProcessed: isProcessed
          });

          const recResult = recommendCircularPathway({
            category: sub.categoryId,
            condition: sub.condition,
            ageYears: sub.ageYears,
            userIntendedPathway: sub.userIntendedPathway
          });

          // Insert submission
          insertSubmission.run(
            sub.id,
            sub.trackingCode,
            sub.userId || 'usr-demo',
            sub.userName,
            sub.userEmail,
            sub.categoryId,
            sub.categoryName,
            evalResult.category?.cpcbCode || 'ITEW3',
            sub.brand,
            sub.model,
            sub.quantity,
            sub.purchaseYear,
            sub.ageYears,
            sub.condition,
            sub.weightKgPerUnit,
            sub.weightSource || 'Exact Model',
            sub.weightConfidence || 'High',
            sub.totalMassKg,
            sub.userIntendedPathway,
            sub.recommendedPathway || recResult.recommendedPathway,
            sub.pathwayRationale || recResult.rationale,
            sub.selectedCenterId || 'cc-blr-01',
            sub.collectionMethod || 'Drop-off at Center',
            `[DEMO RECORD] ${sub.notes || ''}`.trim(),
            sub.status,
            sub.registeredAt || new Date().toISOString(),
            new Date().toISOString()
          );

          // Clear existing history for this demo ID if re-seeding
          dbInstance.prepare('DELETE FROM submission_status_history WHERE submission_id = ?').run(sub.id);
          dbInstance.prepare('DELETE FROM recovery_records WHERE submission_id = ?').run(sub.id);

          // Insert status history
          if (sub.statusHistory && sub.statusHistory.length > 0) {
            let prev = null;
            for (const h of sub.statusHistory) {
              insertHistory.run(
                sub.id,
                prev,
                h.status,
                'EcoLoop Demo System',
                h.note || `Transitioned to ${h.status}`,
                h.timestamp || new Date().toISOString()
              );
              prev = h.status;
            }
          } else {
            insertHistory.run(
              sub.id,
              null,
              sub.status,
              'EcoLoop Demo System',
              `Initial demo submission in ${sub.status} state`,
              sub.registeredAt || new Date().toISOString()
            );
          }

          // Insert impact calculation snapshot
          insertCalc.run(
            `calc-${sub.id}`,
            sub.id,
            sub.categoryId,
            sub.totalMassKg,
            '1.0',
            '1.0',
            evalResult.weightResolution?.hierarchyLevel === 1 ? 'EXACT_MODEL' : 'CATEGORY_LEVEL',
            evalResult.confidenceTier || 'High',
            JSON.stringify({
              categoryId: sub.categoryId,
              brand: sub.brand,
              model: sub.model,
              quantity: sub.quantity,
              purchaseYear: sub.purchaseYear,
              condition: sub.condition
            }),
            JSON.stringify(evalResult.materialBreakdown || []),
            JSON.stringify(evalResult.summary || {}),
            JSON.stringify({
              avoidedCo2eKg: evalResult.summary?.potentialAvoidedCo2eKg || null,
              actualAvoidedCo2eKg: isProcessed ? evalResult.summary?.potentialAvoidedCo2eKg : 0,
              methodology: evalResult.methodology
            }),
            JSON.stringify(evalResult.dataSources || []),
            JSON.stringify(['Empirical metallurgical recovery factors from UNEP / JRC ProSUM']),
            JSON.stringify([])
          );

          // Insert recovery records
          if (evalResult.materialBreakdown) {
            for (const mat of evalResult.materialBreakdown) {
              const actualMass = isProcessed ? mat.massPotentialRecoverableKg : 0;
              const avoidedCo2 = isProcessed ? mat.potentialAvoidedCo2eKg : 0;

              insertRecovery.run(
                sub.id,
                mat.materialId,
                mat.standardName,
                mat.category,
                mat.massPotentialRecoverableKg,
                actualMass,
                avoidedCo2,
                isConfirmed,
                sub.registeredAt || new Date().toISOString()
              );
            }
          }
        }
      }
    }
  });

  seedTransaction();
  return { success: true, seededCenters: centersData.centers.length, demoLoaded: includeDemo };
}

module.exports = {
  seedDatabase
};
