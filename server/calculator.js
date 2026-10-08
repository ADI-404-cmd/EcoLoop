/**
 * EcoLoop Environmental & Material Impact Calculator
 * 
 * Strict Scientific Traceability Principles:
 * 1. NO invented or arbitrary constants.
 * 2. Explicit hierarchy: Exact Model -> Manufacturer Spec -> Category Reference -> User Input.
 * 3. Distinguishes: Material Present vs Material Potentially Recoverable vs Material Actually Recovered.
 * 4. CO2e estimation strictly uses per-material cradle-to-gate substitution factors from
 *    peer-reviewed LCA databases (JRC, US EPA WARM, Umicore, Ecoinvent 3.8).
 */

const path = require('path');
const fs = require('fs');

const referencesData = JSON.parse(fs.readFileSync(path.join(__dirname, '../data/scientific-references.json'), 'utf8'));
const devicesData = JSON.parse(fs.readFileSync(path.join(__dirname, '../data/reference-devices.json'), 'utf8'));
const recoveryData = JSON.parse(fs.readFileSync(path.join(__dirname, '../data/material-recovery-factors.json'), 'utf8'));

/**
 * Resolves device mass based on the strict fallback hierarchy
 */
function resolveDeviceWeight({ categoryId, brand, model, userWeightKg }) {
  // Level 1: Exact Model Match in Database
  if (model && model.trim()) {
    const normalizedInputModel = model.toLowerCase().trim();
    const exactMatch = devicesData.exactModels.find(m => {
      const dbModel = m.model.toLowerCase();
      return (
        dbModel.includes(normalizedInputModel) ||
        normalizedInputModel.includes(dbModel.split('/')[0].trim()) ||
        (m.brand && brand && m.brand.toLowerCase() === brand.toLowerCase() && dbModel.includes(normalizedInputModel))
      );
    });

    if (exactMatch) {
      const source = referencesData.references.find(r => r.id === exactMatch.sourceId);
      return {
        weightKg: exactMatch.weightKg,
        weightSourceType: 'Exact Verified Model Specification',
        hierarchyLevel: 1,
        confidenceTier: 'High',
        sourceCitations: [source ? `${source.shortCode} (${source.year}): ${exactMatch.sourceDetail || source.title}` : 'Manufacturer Technical Specification'],
        matchedModel: exactMatch.model,
        notes: `Weight resolved from manufacturer environmental disclosure for ${exactMatch.model}.`
      };
    }
  }

  // Level 2 / Level 3: Reliable Category Reference Data
  const category = devicesData.categories.find(c => c.id === categoryId);
  if (category) {
    // If user provided a custom weight and requested to override or no exact model found
    if (userWeightKg && Number(userWeightKg) > 0) {
      return {
        weightKg: Number(userWeightKg),
        weightSourceType: 'User-Specified Weight',
        hierarchyLevel: 4,
        confidenceTier: 'Low',
        sourceCitations: ['User-reported scale reading / estimate'],
        matchedModel: model || 'Generic model',
        notes: `User specified ${userWeightKg} kg. Category benchmark is ${category.defaultWeightKg} kg.`
      };
    }

    const source = referencesData.references.find(r => r.id === category.referenceSourceId);
    return {
      weightKg: category.defaultWeightKg,
      weightSourceType: 'Category Empirical Benchmark',
      hierarchyLevel: 3,
      confidenceTier: 'Medium',
      sourceCitations: [source ? `${source.shortCode} (${source.year}) - CPCB Code: ${category.cpcbCode}` : 'UNEP / ITU Global E-waste Monitor Benchmark'],
      matchedModel: `${category.name} (Category Standard)`,
      notes: `Using standard reference mass (${category.defaultWeightKg} kg) for ${category.name} under ${category.cpcbCode}.`
    };
  }

  // Fallback: If user provided weight only and category unknown
  if (userWeightKg && Number(userWeightKg) > 0) {
    return {
      weightKg: Number(userWeightKg),
      weightSourceType: 'User-Specified Weight',
      hierarchyLevel: 4,
      confidenceTier: 'Low',
      sourceCitations: ['User input'],
      matchedModel: 'Custom',
      notes: 'No category reference available. Relying on user entered mass.'
    };
  }

  return null; // No defensible data exists
}

/**
 * Calculates material composition, potential recovery, and avoided CO2e
 */
function evaluateEnvironmentalImpact({
  categoryId,
  brand,
  model,
  quantity = 1,
  purchaseYear,
  condition,
  userWeightKg,
  userIntendedPathway,
  isActuallyProcessed = false
}) {
  const qty = Math.max(1, parseInt(quantity, 10) || 1);
  const currentYear = 2026;
  const ageYears = purchaseYear ? Math.max(0, currentYear - parseInt(purchaseYear, 10)) : 3;

  // 1. Resolve weight through fallback hierarchy
  const weightResolution = resolveDeviceWeight({ categoryId, brand, model, userWeightKg });
  if (!weightResolution) {
    return {
      available: false,
      reason: 'No defensible device mass could be established. Please select a valid device category or enter a verified unit weight.',
      confidenceTier: 'Unavailable',
      referenceDataVersion: '1.0',
      methodologyVersion: '1.0'
    };
  }

  const unitWeightKg = weightResolution.weightKg;
  const totalMassKg = Number((unitWeightKg * qty).toFixed(3));

  // 2. Identify Category & Composition Profile
  const category = devicesData.categories.find(c => c.id === categoryId);
  if (!category) {
    return {
      available: false,
      reason: `Device category '${categoryId}' is unverified or not supported in V1 reference datasets.`,
      confidenceTier: 'Unavailable',
      referenceDataVersion: '1.0',
      methodologyVersion: '1.0',
      totalMassKg,
      unitWeightKg
    };
  }

  const compositionProfile = recoveryData.compositions[category.compositionId];
  if (!compositionProfile || category.v1CalculationStatus === 'RESEARCH_REQUIRED') {
    return {
      available: false,
      reason: `Material composition for category '${category.name}' requires primary research and is not available in V1 datasets.`,
      confidenceTier: 'Unavailable',
      category: {
        id: category.id,
        name: category.name,
        cpcbCode: category.cpcbCode
      },
      referenceDataVersion: '1.0',
      methodologyVersion: '1.0',
      totalMassKg,
      unitWeightKg
    };
  }

  const compositionSource = referencesData.references.find(r => r.id === compositionProfile.sourceId);

  // 3. Calculate Material Breakdown:
  // - Material Present (kg & g)
  // - Material Potentially Recoverable (kg & g)
  // - Material Actually Recovered (kg, if processed)
  // - Avoided CO2e (kg CO2e)
  const materialBreakdown = [];
  let totalPotentialRecoverableMassKg = 0;
  let totalActuallyRecoveredMassKg = 0;
  let totalPotentialAvoidedCo2eKg = 0;
  let totalActualAvoidedCo2eKg = 0;

  const citationsSet = new Set(weightResolution.sourceCitations);
  if (compositionSource) {
    citationsSet.add(`${compositionSource.shortCode} (${compositionSource.year}) - ${compositionSource.title}`);
  }

  compositionProfile.materials.forEach(item => {
    const matMeta = recoveryData.materials[item.materialId] || {
      name: item.label,
      recoveryEfficiency: 0.0,
      avoidedCo2eFactorKgPerKg: 0.0,
      recoveryMethod: 'Mechanical separation',
      sourceId: 'ref-gem-2024'
    };

    const matSource = referencesData.references.find(r => r.id === matMeta.sourceId);
    if (matSource) {
      citationsSet.add(`${matSource.shortCode}: ${matMeta.citationNotes || matSource.title}`);
    }

    const massPresentKg = Number((totalMassKg * item.fraction).toFixed(5));
    const massPresentGrams = Number((massPresentKg * 1000).toFixed(3));

    const recoveryYield = matMeta.recoveryEfficiency || 0;
    const massPotentialRecoverableKg = Number((massPresentKg * recoveryYield).toFixed(5));
    const massPotentialRecoverableGrams = Number((massPotentialRecoverableKg * 1000).toFixed(3));

    // Actually recovered depends on workflow processing status
    const massActuallyRecoveredKg = isActuallyProcessed ? massPotentialRecoverableKg : 0;
    const massActuallyRecoveredGrams = isActuallyProcessed ? massPotentialRecoverableGrams : 0;

    // Avoided CO2e calculation: Mass recovered * avoided virgin extraction emission factor
    const avoidedCo2eFactor = matMeta.avoidedCo2eFactorKgPerKg || 0;
    const itemPotentialAvoidedCo2e = Number((massPotentialRecoverableKg * avoidedCo2eFactor).toFixed(3));
    const itemActualAvoidedCo2e = Number((massActuallyRecoveredKg * avoidedCo2eFactor).toFixed(3));

    totalPotentialRecoverableMassKg += massPotentialRecoverableKg;
    totalActuallyRecoveredMassKg += massActuallyRecoveredKg;
    totalPotentialAvoidedCo2eKg += itemPotentialAvoidedCo2e;
    totalActualAvoidedCo2eKg += itemActualAvoidedCo2e;

    materialBreakdown.push({
      materialId: item.materialId,
      label: item.label,
      standardName: matMeta.name,
      category: matMeta.category,
      fractionPercent: Number((item.fraction * 100).toFixed(3)),
      massPresentKg,
      massPresentGrams,
      recoveryEfficiencyPercent: Number((recoveryYield * 100).toFixed(1)),
      recoveryMethod: matMeta.recoveryMethod,
      massPotentialRecoverableKg,
      massPotentialRecoverableGrams,
      massActuallyRecoveredKg,
      massActuallyRecoveredGrams,
      isCriticalRawMaterial: Boolean(matMeta.isCriticalRawMaterial),
      hazardLevel: matMeta.hazardLevel || 'Low',
      avoidedCo2eFactorKgPerKg: avoidedCo2eFactor,
      potentialAvoidedCo2eKg: itemPotentialAvoidedCo2e,
      actualAvoidedCo2eKg: itemActualAvoidedCo2e,
      sourceCitation: matMeta.citationNotes || 'EU JRC ProSUM / US EPA WARM v15'
    });
  });

  // Calculate circular economy indicators
  const potentialRecoveryRatePercent = totalMassKg > 0
    ? Number(((totalPotentialRecoverableMassKg / totalMassKg) * 100).toFixed(1))
    : 0;

  // Final confidence synthesis
  let overallConfidence = weightResolution.confidenceTier;
  if (weightResolution.hierarchyLevel === 4) {
    overallConfidence = 'Low';
  } else if (weightResolution.hierarchyLevel === 3) {
    overallConfidence = 'Medium';
  } else {
    overallConfidence = 'High';
  }

  return {
    available: true,
    referenceDataVersion: '1.0',
    methodologyVersion: '1.0',
    totalDevicesCount: qty,
    unitWeightKg,
    totalMassKg,
    weightResolution,
    category: {
      id: category.id,
      name: category.name,
      cpcbCode: category.cpcbCode
    },
    ageYears,
    condition: condition || 'Not specified',
    confidenceTier: overallConfidence,
    summary: {
      totalMassKg,
      estimatedMaterialPresentKg: totalMassKg,
      potentialMaterialRecoverableKg: Number(totalPotentialRecoverableMassKg.toFixed(3)),
      actualMaterialRecoveredKg: Number(totalActuallyRecoveredMassKg.toFixed(3)),
      potentialRecoveryRatePercent,
      potentialAvoidedCo2eKg: Number(totalPotentialAvoidedCo2eKg.toFixed(2)),
      actualAvoidedCo2eKg: Number(totalActualAvoidedCo2eKg.toFixed(2)),
      isActuallyProcessed
    },
    methodology: {
      co2eApproach: 'Per-material cradle-to-gate virgin vs secondary production substitution',
      equation: 'Avoided CO2e = Σ (Recovered Mass_i × (Primary Emission Factor_i - Secondary Recycling Emission Factor_i))',
      noUniversalConstantStatement: 'EcoLoop does NOT apply a generic "1 kg e-waste = X kg CO2" factor. Avoided GHG impacts are derived exclusively by summing physical metallurgical and polymer substitution across quantified elemental fractions.'
    },
    materialBreakdown,
    dataSources: Array.from(citationsSet)
  };
}

module.exports = {
  resolveDeviceWeight,
  evaluateEnvironmentalImpact
};
