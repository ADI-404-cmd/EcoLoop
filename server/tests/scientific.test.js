/**
 * EcoLoop Scientific Calculation Integrity Tests
 * Verifies mathematical formulas, fallback hierarchies, PPM conversions,
 * MWR yields, versioning, and unsupported category handling.
 */

const { describe, it } = require('node:test');
const assert = require('node:assert');
const { resolveDeviceWeight, evaluateEnvironmentalImpact } = require('../calculator');

describe('Scientific Calculation Integrity', () => {

  describe('Weight Fallback Hierarchy', () => {
    it('resolves Exact Verified Model specification (Hierarchy Level 1 - HIGH confidence)', () => {
      const result = resolveDeviceWeight({
        categoryId: 'cat-laptop',
        brand: 'Dell',
        model: 'Latitude 5420 / 5430'
      });

      assert.strictEqual(result.hierarchyLevel, 1);
      assert.strictEqual(result.weightKg, 1.40);
      assert.strictEqual(result.confidenceTier, 'High');
      assert.strictEqual(result.weightSourceType, 'Exact Verified Model Specification');
    });

    it('resolves Category Empirical Benchmark when model is generic or unknown (Hierarchy Level 3 - MEDIUM confidence)', () => {
      const result = resolveDeviceWeight({
        categoryId: 'cat-laptop',
        brand: 'UnknownBrand',
        model: 'CustomLaptop99'
      });

      assert.strictEqual(result.hierarchyLevel, 3);
      assert.strictEqual(result.weightKg, 2.10); // Standard laptop benchmark
      assert.strictEqual(result.confidenceTier, 'Medium');
      assert.strictEqual(result.weightSourceType, 'Category Empirical Benchmark');
    });

    it('resolves User-Specified Weight when explicitly provided (Hierarchy Level 4 - LOW confidence)', () => {
      const result = resolveDeviceWeight({
        categoryId: 'cat-laptop',
        brand: 'Dell',
        model: 'Custom',
        userWeightKg: 1.85
      });

      assert.strictEqual(result.hierarchyLevel, 4);
      assert.strictEqual(result.weightKg, 1.85);
      assert.strictEqual(result.confidenceTier, 'Low');
      assert.strictEqual(result.weightSourceType, 'User-Specified Weight');
    });

    it('returns null when category is invalid and no user weight is provided', () => {
      const result = resolveDeviceWeight({
        categoryId: 'cat-nonexistent',
        brand: 'Fake',
        model: 'Model'
      });

      assert.strictEqual(result, null);
    });
  });

  describe('Mass and Material Calculations', () => {
    it('computes total mass = weight × quantity correctly', () => {
      const evalResult = evaluateEnvironmentalImpact({
        categoryId: 'cat-laptop',
        brand: 'Dell',
        model: 'Latitude 5420 / 5430',
        quantity: 5
      });

      assert.strictEqual(evalResult.available, true);
      assert.strictEqual(evalResult.unitWeightKg, 1.40);
      assert.strictEqual(evalResult.totalDevicesCount, 5);
      assert.strictEqual(evalResult.totalMassKg, 7.0); // 1.40 * 5 = 7.000 kg
    });

    it('computes material mass = total mass × material fraction', () => {
      const evalResult = evaluateEnvironmentalImpact({
        categoryId: 'cat-laptop',
        brand: 'Dell',
        model: 'Latitude 5420 / 5430',
        quantity: 1
      });

      // Laptop steel fraction = 0.235 (23.5%)
      const steel = evalResult.materialBreakdown.find(m => m.materialId === 'mat-steel');
      assert.ok(steel, 'Steel material must be present');
      assert.strictEqual(steel.fractionPercent, 23.5);
      
      const expectedMass = Number((1.40 * 0.235).toFixed(5));
      assert.strictEqual(steel.massPresentKg, expectedMass);
    });

    it('handles PPM conversions accurately (e.g. Gold 210 ppm in laptop)', () => {
      const evalResult = evaluateEnvironmentalImpact({
        categoryId: 'cat-laptop',
        brand: 'Dell',
        model: 'Latitude 5420 / 5430',
        quantity: 1
      });

      // Gold fraction in laptop = 0.00021 (210 ppm = 210 / 1,000,000)
      const gold = evalResult.materialBreakdown.find(m => m.materialId === 'mat-gold');
      assert.ok(gold, 'Gold should be present');
      assert.strictEqual(gold.fractionPercent, 0.021); // 0.00021 * 100
      
      const expectedGoldKg = Number((1.40 * 0.00021).toFixed(5));
      assert.strictEqual(gold.massPresentKg, expectedGoldKg);
      assert.strictEqual(gold.massPresentGrams, Number((expectedGoldKg * 1000).toFixed(3)));
    });

    it('calculates potential recovery using MWR efficiency yields (potential ≠ actual)', () => {
      const evalResult = evaluateEnvironmentalImpact({
        categoryId: 'cat-laptop',
        brand: 'Dell',
        model: 'Latitude 5420 / 5430',
        quantity: 1,
        isActuallyProcessed: false
      });

      const aluminum = evalResult.materialBreakdown.find(m => m.materialId === 'mat-aluminum');
      assert.ok(aluminum);
      // Aluminum MWR yield = 88% (0.88)
      assert.strictEqual(aluminum.recoveryEfficiencyPercent, 88.0);

      const expectedPotential = Number((aluminum.massPresentKg * 0.88).toFixed(5));
      assert.strictEqual(aluminum.massPotentialRecoverableKg, expectedPotential);

      // Crucial: When isActuallyProcessed is false, actual recovered mass MUST be 0!
      assert.strictEqual(aluminum.massActuallyRecoveredKg, 0);
      assert.strictEqual(evalResult.summary.actualMaterialRecoveredKg, 0);
      assert.ok(evalResult.summary.potentialMaterialRecoverableKg > 0);
    });

    it('computes actual recovery when device is processed', () => {
      const evalResult = evaluateEnvironmentalImpact({
        categoryId: 'cat-laptop',
        brand: 'Dell',
        model: 'Latitude 5420 / 5430',
        quantity: 1,
        isActuallyProcessed: true
      });

      const aluminum = evalResult.materialBreakdown.find(m => m.materialId === 'mat-aluminum');
      assert.strictEqual(aluminum.massActuallyRecoveredKg, aluminum.massPotentialRecoverableKg);
      assert.strictEqual(evalResult.summary.actualMaterialRecoveredKg, evalResult.summary.potentialMaterialRecoverableKg);
    });
  });

  describe('Unsupported Categories & Scientific Boundaries', () => {
    it('returns UNAVAILABLE for unverified or unsupported device category even if weight is provided', () => {
      const evalResult = evaluateEnvironmentalImpact({
        categoryId: 'cat-quantum-computer',
        brand: 'Generic',
        model: 'Qubit1',
        userWeightKg: 10.0
      });

      assert.strictEqual(evalResult.available, false);
      assert.strictEqual(evalResult.confidenceTier, 'Unavailable');
      assert.ok(evalResult.reason.includes('unverified or not supported'));
    });

    it('returns UNAVAILABLE when no defensible mass can be established', () => {
      const evalResult = evaluateEnvironmentalImpact({
        categoryId: 'cat-quantum-computer',
        brand: 'Generic',
        model: 'Qubit1'
      });

      assert.strictEqual(evalResult.available, false);
      assert.strictEqual(evalResult.confidenceTier, 'Unavailable');
      assert.ok(evalResult.reason.includes('No defensible device mass could be established'));
    });

    it('does not reintroduce generic CO2e multiplier (uses per-material LCA factors)', () => {
      const evalResult = evaluateEnvironmentalImpact({
        categoryId: 'cat-laptop',
        brand: 'Dell',
        model: 'Latitude 5420 / 5430',
        quantity: 1
      });

      assert.ok(evalResult.methodology);
      assert.ok(evalResult.methodology.noUniversalConstantStatement.includes('NOT apply a generic'));
      assert.strictEqual(evalResult.methodology.co2eApproach, 'Per-material cradle-to-gate virgin vs secondary production substitution');
    });

    it('includes reference_data_version and methodology_version in output', () => {
      const evalResult = evaluateEnvironmentalImpact({
        categoryId: 'cat-laptop',
        brand: 'Dell',
        model: 'Latitude 5420 / 5430',
        quantity: 1
      });

      assert.strictEqual(evalResult.referenceDataVersion, '1.0');
      assert.strictEqual(evalResult.methodologyVersion, '1.0');
    });
  });
});
