/**
 * EcoLoop Circular Economy Decision Engine
 * 
 * Implements the Circular Hierarchy of Electronics:
 * 1. Continue using / Maintenance
 * 2. Direct Reuse / Peer donation
 * 3. Component Repair / Refurbishment
 * 4. Component Harvesting / Parts Salvage
 * 5. Depollution & Formal Materials Recycling
 * 
 * Based on empirical product lifetime thresholds from:
 * - UNEP / ITU Global E-waste Monitor (GEM 2024)
 * - European Commission Ecodesign Directive & Circular Economy Action Plan
 * - CPCB E-Waste (Management) Rules 2022
 */

function recommendCircularPathway({ category, condition, ageYears, userIntendedPathway }) {
  const age = Number(ageYears) || 0;
  const cond = String(condition || '').trim();

  let pathway = '';
  let rationale = '';
  let nextAction = '';
  let circularRetentionScore = 0; // 0 - 100% of embodied value retained

  // Determine pathway based on condition and age thresholds
  if (cond === 'Fully working') {
    if (age <= 3) {
      pathway = 'Continue Using / Direct Reuse';
      rationale = 'The device is relatively young and in fully working condition. Prolonging in-use life or passing it directly to a second user retains 100% of the embedded energy, materials, and manufacturing value without processing losses.';
      nextAction = 'Data wipe using NIST 800-88 guidelines, then list for campus peer donation, buyback, or continued everyday use.';
      circularRetentionScore = 95;
    } else if (age <= 6) {
      pathway = 'Reuse / Educational Donation';
      rationale = 'Although older than 3 years, the device is fully functional. It is ideal for digital inclusion programs, school labs, or non-profit secondary deployment.';
      nextAction = 'Deliver to an authorized collection hub for diagnostic audit, clean OS installation, and distribution to educational initiatives.';
      circularRetentionScore = 80;
    } else {
      pathway = 'Component Harvesting + Formal Recycling';
      rationale = 'The device functions, but software support, security updates, and efficiency standards have phased out (>6-7 years old). Working components (RAM, storage, displays) can be salvaged while older motherboards enter high-efficiency smelting.';
      nextAction = 'Authorized drop-off for parts recovery and depollution.';
      circularRetentionScore = 50;
    }
  } else if (cond === 'Working with issues') {
    if (age <= 5) {
      pathway = 'Repair / Refurbish';
      rationale = 'Minor component faults (e.g. degraded battery, cracked port, swollen keys) can be economically repaired. Refurbishment extends device lifetime by 2-4 years, avoiding the significant footprint of new device manufacturing.';
      nextAction = 'Book for technical triage at a certified refurbisher center for battery/component replacement.';
      circularRetentionScore = 75;
    } else {
      pathway = 'Component Harvesting + Materials Recovery';
      rationale = 'Device has functional defects and is beyond 5 years of age. Comprehensive refurbishment may exceed replacement value; selective parts harvesting followed by formal shredding is optimal.';
      nextAction = 'Route to an authorized dismantling center.';
      circularRetentionScore = 40;
    }
  } else if (cond === 'Non-working') {
    if (age <= 4) {
      pathway = 'Diagnostic Triage & Subsystem Salvage';
      rationale = 'Device has failed power-on or display, but newer components (unibody chassis, cameras, heat pipes, power circuitry) possess high spare-part value.';
      nextAction = 'Submit to authorized repair/dismantling hub for technician bench testing and module harvesting.';
      circularRetentionScore = 55;
    } else {
      pathway = 'Component Harvesting + Formal Recycling';
      rationale = 'Older non-operational hardware is best treated through formal depollution (safely removing batteries/capacitors) followed by mechanical shredding and secondary smelting.';
      nextAction = 'Schedule drop-off or pickup with a CPCB registered recycler.';
      circularRetentionScore = 30;
    }
  } else if (cond === 'Physically damaged') {
    pathway = 'Depollution & Formal Materials Recycling';
    rationale = 'Heavy physical damage (shattered display, crushed enclosure, liquid corrosion) compromises electrical safety and mechanical reuse. Depollution prevents toxic leaks (mercury, lead, electrolyte) while recovering copper, steel, and gold.';
    nextAction = 'Safe containment in e-waste drop-off bin; avoid dismantling damaged lithium cells at home.';
    circularRetentionScore = 20;
  } else {
    // Default fallback
    pathway = 'Assessment & Formal Recycling';
    rationale = 'Device requires intake inspection at an authorized collection center to determine whether repair or smelting is optimal.';
    nextAction = 'Take device to nearest authorized EcoLoop collection point.';
    circularRetentionScore = 35;
  }

  return {
    recommendedPathway: pathway,
    rationale,
    nextAction,
    circularRetentionScore,
    userAlignment: userIntendedPathway && userIntendedPathway !== 'Not sure'
      ? (pathway.toLowerCase().includes(userIntendedPathway.toLowerCase()) || userIntendedPathway.toLowerCase().includes(pathway.toLowerCase().split('/')[0].trim()) ? 'Aligned with user intention' : 'System recommends alternative circular pathway for higher value retention')
      : 'User requested system recommendation'
  };
}

module.exports = {
  recommendCircularPathway
};
