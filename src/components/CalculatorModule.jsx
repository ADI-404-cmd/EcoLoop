import React, { useState, useEffect } from 'react';
import { api } from '../api';
import { 
  Calculator, 
  Sparkles, 
  Layers, 
  ShieldCheck, 
  ArrowRight, 
  CheckCircle2, 
  AlertTriangle, 
  Info, 
  HelpCircle, 
  BookOpen, 
  ChevronDown, 
  ChevronUp, 
  Scale, 
  Leaf, 
  RefreshCw,
  Cpu
} from 'lucide-react';

export default function CalculatorModule({ onProceedToRegister }) {
  const [categories, setCategories] = useState([]);
  const [exactModels, setExactModels] = useState([]);
  const [loading, setLoading] = useState(false);
  const [calculationError, setCalculationError] = useState('');

  // Form states
  const [categoryId, setCategoryId] = useState('cat-laptop');
  const [brand, setBrand] = useState('Dell');
  const [model, setModel] = useState('Latitude 5420 / 5430');
  const [quantity, setQuantity] = useState(1);
  const [purchaseYear, setPurchaseYear] = useState(2022);
  const [condition, setCondition] = useState('Working with issues');
  const [weightMode, setWeightMode] = useState('reference'); // 'reference' or 'custom'
  const [userWeightKg, setUserWeightKg] = useState('');
  const [userIntendedPathway, setUserIntendedPathway] = useState('Repair/refurbish');

  // Calculation output state
  const [result, setResult] = useState(null);
  const [showSourcesModal, setShowSourcesModal] = useState(false);
  const [selectedMaterialFilter, setSelectedMaterialFilter] = useState('all');

  // Fetch categories and models on mount
  useEffect(() => {
    api.categories().then(d => setCategories(d.categories || [])).catch(err => setCalculationError(err.message));
    api.exactModels().then(d => setExactModels(d.models || [])).catch(err => setCalculationError(err.message));
  }, []);

  // When category changes, suggest appropriate brand/model
  const handleCategoryChange = (e) => {
    const newCat = e.target.value;
    setCategoryId(newCat);
    const matchingModel = exactModels.find(m => m.categoryId === newCat);
    if (matchingModel) {
      setBrand(matchingModel.brand);
      setModel(matchingModel.model);
    } else {
      setModel('');
    }
  };

  const handleSelectPredefinedModel = (m) => {
    setCategoryId(m.categoryId);
    setBrand(m.brand);
    setModel(m.model);
    setWeightMode('reference');
  };

  // Run calculation
  const executeCalculation = async () => {
    setLoading(true);
    setCalculationError('');
    try {
      const data = await api.evaluate({
          categoryId,
          brand,
          model,
          quantity: parseInt(quantity, 10) || 1,
          purchaseYear: parseInt(purchaseYear, 10),
          condition,
          userWeightKg: weightMode === 'custom' && userWeightKg ? parseFloat(userWeightKg) : null,
          userIntendedPathway
      });
      setResult(data);
    } catch (err) {
      console.error('Calculation error:', err);
      setCalculationError('The calculator could not reach the service. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Run initial calculation when ready
  useEffect(() => {
    executeCalculation();
  }, [categoryId, model, quantity, purchaseYear, condition, weightMode, userWeightKg, userIntendedPathway]);

  const currentCategory = categories.find(c => c.id === categoryId);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '30px' }}>
      {/* Module Header */}
      <div className="glass-panel" style={{ padding: '28px 32px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '16px' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--accent-emerald-light)', fontSize: '0.85rem', fontWeight: 700, marginBottom: '6px' }}>
              <Calculator size={18} />
              SCIENTIFIC LIFE-CYCLE INVENTORY MODULE
            </div>
            <h1 style={{ fontSize: '2.2rem', fontWeight: 800 }}>Environmental &amp; Material Recovery Calculator</h1>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.96rem', maxWidth: '780px', marginTop: '6px' }}>
              Evaluate the physical material constitution, potential secondary recovery yield, and defensible avoided 
              greenhouse gas emissions based on verified manufacturer disclosures and EU JRC / UNITAR e-waste characterization benchmarks.
            </p>
          </div>

          <div style={{
            backgroundColor: 'rgba(16, 185, 129, 0.08)',
            border: '1px solid rgba(16, 185, 129, 0.25)',
            borderRadius: 'var(--radius-md)',
            padding: '12px 18px',
            fontSize: '0.82rem',
            maxWidth: '300px'
          }}>
            <div style={{ fontWeight: 700, color: 'var(--accent-emerald-light)', marginBottom: '4px', display: 'flex', alignItems: 'center', gap: '6px' }}>
              <ShieldCheck size={15} />
              Strict Fallback Hierarchy
            </div>
            <div style={{ color: 'var(--text-muted)', lineHeight: 1.4 }}>
              1. Exact Model Carbon Report &rarr; 2. Manufacturer Spec &rarr; 3. Category Benchmark &rarr; 4. User Scale
            </div>
          </div>
        </div>
      </div>

      {/* Two Column Workspace: Input Parameters vs Evaluated Scientific Output */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))',
        gap: '24px',
        alignItems: 'start'
      }}>
        {/* Left Column: Input Form */}
        <div className="glass-panel" style={{ padding: '26px' }}>
          <h2 style={{ fontSize: '1.25rem', fontWeight: 700, marginBottom: '18px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span>1.</span> Device Input Parameters
          </h2>

          {/* Quick Model Selector Pills */}
          <div style={{ marginBottom: '20px' }}>
            <label className="form-label" style={{ fontSize: '0.78rem', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
              Verified Benchmark Presets (High Confidence Tier)
            </label>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', marginTop: '8px' }}>
              {exactModels.map(m => (
                <button
                  key={m.id}
                  type="button"
                  onClick={() => handleSelectPredefinedModel(m)}
                  style={{
                    backgroundColor: model === m.model ? 'rgba(16, 185, 129, 0.25)' : 'rgba(255, 255, 255, 0.04)',
                    color: model === m.model ? '#34d399' : 'var(--text-secondary)',
                    border: model === m.model ? '1px solid rgba(16, 185, 129, 0.5)' : '1px solid var(--border-subtle)',
                    padding: '4px 10px',
                    borderRadius: 'var(--radius-full)',
                    fontSize: '0.75rem',
                    fontWeight: 500,
                    cursor: 'pointer',
                    transition: 'all 0.15s ease'
                  }}
                >
                  {m.brand} {m.model.split('/')[0]} ({m.weightKg}kg)
                </button>
              ))}
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
            {/* Category */}
            <div className="form-group" style={{ gridColumn: 'span 2' }}>
              <label className="form-label">Device Category</label>
              <select 
                className="form-select" 
                value={categoryId} 
                onChange={handleCategoryChange}
              >
                {categories.map(c => (
                  <option key={c.id} value={c.id}>
                    {c.name} ({c.cpcbCode} &bull; Std: {c.defaultWeightKg} kg)
                  </option>
                ))}
              </select>
              {currentCategory && (
                <span style={{ fontSize: '0.74rem', color: 'var(--text-muted)', marginTop: '4px' }}>
                  {currentCategory.description}
                </span>
              )}
            </div>

            {/* Brand */}
            <div className="form-group">
              <label className="form-label">Brand / Manufacturer</label>
              <input 
                type="text" 
                className="form-input" 
                value={brand} 
                onChange={e => setBrand(e.target.value)}
                placeholder="e.g. Dell, Apple, HP, Samsung"
              />
            </div>

            {/* Model */}
            <div className="form-group">
              <label className="form-label">Model Name / Family</label>
              <input 
                type="text" 
                className="form-input" 
                value={model} 
                onChange={e => setModel(e.target.value)}
                placeholder="e.g. Latitude 5420, iPhone 14"
              />
            </div>

            {/* Quantity */}
            <div className="form-group">
              <label className="form-label">Quantity (Units)</label>
              <input 
                type="number" 
                min="1" 
                max="5000" 
                className="form-input" 
                value={quantity} 
                onChange={e => setQuantity(e.target.value)}
              />
            </div>

            {/* Purchase Year */}
            <div className="form-group">
              <label className="form-label">Purchase Year (Approx Age: {2026 - purchaseYear} yrs)</label>
              <input 
                type="number" 
                min="2000" 
                max="2026" 
                className="form-input" 
                value={purchaseYear} 
                onChange={e => setPurchaseYear(e.target.value)}
              />
            </div>

            {/* Condition */}
            <div className="form-group" style={{ gridColumn: 'span 2' }}>
              <label className="form-label">Physical &amp; Operational Condition</label>
              <select 
                className="form-select" 
                value={condition} 
                onChange={e => setCondition(e.target.value)}
              >
                <option value="Fully working">Fully working (Powers on, display/ports intact, full utility)</option>
                <option value="Working with issues">Working with issues (Degraded battery, cracked casing, slow)</option>
                <option value="Non-working">Non-working (No power, motherboard defect, non-responsive)</option>
                <option value="Physically damaged">Physically damaged (Crushed, water corroded, cracked screen)</option>
              </select>
            </div>

            {/* Weight Preference Mode */}
            <div className="form-group" style={{ gridColumn: 'span 2' }}>
              <label className="form-label">Device Mass Determination Method</label>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginTop: '4px' }}>
                <button
                  type="button"
                  onClick={() => setWeightMode('reference')}
                  style={{
                    padding: '10px 12px',
                    borderRadius: 'var(--radius-sm)',
                    border: weightMode === 'reference' ? '1px solid var(--accent-emerald)' : '1px solid var(--border-medium)',
                    backgroundColor: weightMode === 'reference' ? 'rgba(16, 185, 129, 0.15)' : 'var(--bg-input)',
                    color: weightMode === 'reference' ? '#34d399' : 'var(--text-secondary)',
                    fontSize: '0.82rem',
                    fontWeight: 600,
                    cursor: 'pointer',
                    textAlign: 'left'
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <ShieldCheck size={14} />
                    Scientific Reference Weight
                  </div>
                  <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: '2px' }}>
                    Auto-resolved from manufacturer/CPCB data
                  </div>
                </button>

                <button
                  type="button"
                  onClick={() => setWeightMode('custom')}
                  style={{
                    padding: '10px 12px',
                    borderRadius: 'var(--radius-sm)',
                    border: weightMode === 'custom' ? '1px solid var(--accent-amber)' : '1px solid var(--border-medium)',
                    backgroundColor: weightMode === 'custom' ? 'rgba(245, 158, 11, 0.15)' : 'var(--bg-input)',
                    color: weightMode === 'custom' ? '#fbbf24' : 'var(--text-secondary)',
                    fontSize: '0.82rem',
                    fontWeight: 600,
                    cursor: 'pointer',
                    textAlign: 'left'
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <Scale size={14} />
                    User-Measured Custom Weight
                  </div>
                  <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: '2px' }}>
                    Provide scale reading (Low confidence tier)
                  </div>
                </button>
              </div>

              {weightMode === 'custom' && (
                <div style={{ marginTop: '10px' }}>
                  <input 
                    type="number" 
                    step="0.01" 
                    min="0.01" 
                    max="200" 
                    className="form-input" 
                    value={userWeightKg} 
                    onChange={e => setUserWeightKg(e.target.value)}
                    placeholder="Enter measured unit weight in kg (e.g. 1.45)"
                  />
                  <span style={{ fontSize: '0.74rem', color: '#fbbf24', marginTop: '4px', display: 'block' }}>
                    Notice: Custom user weights will assign a "Low" confidence tier to the LCA output.
                  </span>
                </div>
              )}
            </div>

            {/* Intended EoL Pathway */}
            <div className="form-group" style={{ gridColumn: 'span 2' }}>
              <label className="form-label">User's Intended End-of-Life Pathway</label>
              <select 
                className="form-select" 
                value={userIntendedPathway} 
                onChange={e => setUserIntendedPathway(e.target.value)}
              >
                <option value="Continue using">Continue using (Self maintenance)</option>
                <option value="Reuse/donate">Reuse / Donate to school or peer</option>
                <option value="Repair/refurbish">Repair / Refurbish at authorized workshop</option>
                <option value="Formal recycling">Formal recycling &amp; material smelting</option>
                <option value="Not sure">Not sure (Recommend the best circular pathway)</option>
              </select>
            </div>
          </div>
        </div>

        {/* Right Column: Calculated Scientific Output */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          {calculationError && <div role="alert" style={{ padding: '14px', borderRadius: '10px', border: '1px solid rgba(233,133,118,.25)', background: 'rgba(233,133,118,.07)', color: '#efafa5', fontSize: '.84rem' }}>{calculationError}</div>}
          {result && result.evaluation && result.evaluation.available !== false && (
            <>
              {/* Card A: Weight Resolution & Confidence Metadata */}
              <div className="glass-panel" style={{ padding: '22px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '14px' }}>
                  <div>
                    <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.04em', fontWeight: 600 }}>
                      Weight Resolution &amp; Source Hierarchy
                    </span>
                    <h3 style={{ fontSize: '1.25rem', fontWeight: 700, marginTop: '2px' }}>
                      {result.evaluation.weightResolution.matchedModel}
                    </h3>
                  </div>

                  <span className={`badge ${
                    result.evaluation.confidenceTier === 'High' ? 'badge-high' :
                    result.evaluation.confidenceTier === 'Medium' ? 'badge-medium' : 'badge-low'
                  }`}>
                    {result.evaluation.confidenceTier} Confidence
                  </span>
                </div>

                <div style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(3, 1fr)',
                  gap: '12px',
                  backgroundColor: 'rgba(255, 255, 255, 0.02)',
                  padding: '14px',
                  borderRadius: 'var(--radius-sm)',
                  marginBottom: '14px'
                }}>
                  <div>
                    <div style={{ fontSize: '0.74rem', color: 'var(--text-muted)' }}>Unit Mass</div>
                    <div style={{ fontSize: '1.2rem', fontWeight: 700, fontFamily: 'var(--font-mono)', color: 'var(--text-primary)' }}>
                      {result.evaluation.unitWeightKg} <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>kg</span>
                    </div>
                  </div>
                  <div>
                    <div style={{ fontSize: '0.74rem', color: 'var(--text-muted)' }}>Total E-Waste Mass</div>
                    <div style={{ fontSize: '1.2rem', fontWeight: 700, fontFamily: 'var(--font-mono)', color: '#38bdf8' }}>
                      {result.evaluation.totalMassKg} <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>kg</span>
                    </div>
                  </div>
                  <div>
                    <div style={{ fontSize: '0.74rem', color: 'var(--text-muted)' }}>Source Level</div>
                    <div style={{ fontSize: '0.95rem', fontWeight: 600, color: 'var(--text-accent)' }}>
                      Level {result.evaluation.weightResolution.hierarchyLevel}
                    </div>
                  </div>
                </div>

                <div style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', lineHeight: 1.4 }}>
                  <strong>Source:</strong> {result.evaluation.weightResolution.notes}
                </div>
              </div>

              {/* Card B: Recommended Circular Pathway */}
              <div className="glass-panel" style={{ padding: '22px', borderColor: 'rgba(16, 185, 129, 0.35)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '10px' }}>
                  <div>
                    <span style={{ fontSize: '0.78rem', color: 'var(--accent-emerald-light)', textTransform: 'uppercase', letterSpacing: '0.04em', fontWeight: 700 }}>
                      RECOMMENDED CIRCULAR PATHWAY
                    </span>
                    <h3 style={{ fontSize: '1.35rem', fontWeight: 800, color: 'var(--text-primary)' }}>
                      {result.recommendation.recommendedPathway}
                    </h3>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>Value Retention</span>
                    <div style={{ fontSize: '1.15rem', fontWeight: 800, color: '#34d399', fontFamily: 'var(--font-mono)' }}>
                      {result.recommendation.circularRetentionScore}%
                    </div>
                  </div>
                </div>

                <p style={{ fontSize: '0.86rem', color: 'var(--text-secondary)', lineHeight: 1.5, marginBottom: '12px' }}>
                  {result.recommendation.rationale}
                </p>

                <div style={{
                  backgroundColor: 'rgba(16, 185, 129, 0.08)',
                  border: '1px solid rgba(16, 185, 129, 0.2)',
                  borderRadius: 'var(--radius-sm)',
                  padding: '10px 14px',
                  fontSize: '0.8rem',
                  color: 'var(--text-primary)'
                }}>
                  <strong>Recommended Next Step:</strong> {result.recommendation.nextAction}
                </div>
              </div>

              {/* Card C: Environmental LCA Summary & Avoided CO2e */}
              <div className="glass-panel" style={{ padding: '22px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                  <h3 style={{ fontSize: '1.15rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <Leaf size={18} color="#34d399" />
                    Estimated Environmental Recovery Indicators
                  </h3>
                  <span className="badge badge-high">
                    LCA Substantiated
                  </span>
                </div>

                <div style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))',
                  gap: '12px',
                  marginBottom: '16px'
                }}>
                  <div style={{ backgroundColor: 'rgba(255,255,255,0.02)', padding: '12px', borderRadius: 'var(--radius-sm)' }}>
                    <div style={{ fontSize: '0.74rem', color: 'var(--text-muted)' }}>Material Present</div>
                    <div style={{ fontSize: '1.3rem', fontWeight: 800, fontFamily: 'var(--font-mono)', color: 'var(--text-primary)' }}>
                      {result.evaluation.summary.estimatedMaterialPresentKg} <span style={{ fontSize: '0.75rem', fontWeight: 400 }}>kg</span>
                    </div>
                    <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>100% total mass</div>
                  </div>

                  <div style={{ backgroundColor: 'rgba(16, 185, 129, 0.06)', border: '1px solid rgba(16, 185, 129, 0.2)', padding: '12px', borderRadius: 'var(--radius-sm)' }}>
                    <div style={{ fontSize: '0.74rem', color: 'var(--accent-emerald-light)' }}>Potential Recoverable</div>
                    <div style={{ fontSize: '1.3rem', fontWeight: 800, fontFamily: 'var(--font-mono)', color: '#34d399' }}>
                      {result.evaluation.summary.potentialMaterialRecoverableKg} <span style={{ fontSize: '0.75rem', fontWeight: 400 }}>kg</span>
                    </div>
                    <div style={{ fontSize: '0.7rem', color: 'var(--accent-emerald-light)' }}>
                      {result.evaluation.summary.potentialRecoveryRatePercent}% recovery yield
                    </div>
                  </div>

                  <div style={{ backgroundColor: 'rgba(56, 189, 248, 0.06)', border: '1px solid rgba(56, 189, 248, 0.2)', padding: '12px', borderRadius: 'var(--radius-sm)' }}>
                    <div style={{ fontSize: '0.74rem', color: '#38bdf8' }}>Potential Avoided CO₂e</div>
                    <div style={{ fontSize: '1.3rem', fontWeight: 800, fontFamily: 'var(--font-mono)', color: '#38bdf8' }}>
                      ~{result.evaluation.summary.potentialAvoidedCo2eKg} <span style={{ fontSize: '0.75rem', fontWeight: 400 }}>kg CO₂e</span>
                    </div>
                    <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>Virgin extraction saved</div>
                  </div>
                </div>

                {/* Explicit Methodology Disclaimer */}
                <div style={{
                  fontSize: '0.76rem',
                  color: 'var(--text-muted)',
                  borderTop: '1px solid var(--border-subtle)',
                  paddingTop: '12px',
                  lineHeight: 1.5
                }}>
                  <strong style={{ color: 'var(--text-secondary)' }}>Methodology Notice: </strong>
                  {result.evaluation.methodology.noUniversalConstantStatement}
                </div>
              </div>
            </>
          )}
        </div>
        {result?.evaluation?.available === false && (
          <div role="status" style={{ gridColumn: '1 / -1', padding: '22px 24px', borderRadius: '14px', border: '1px solid rgba(231,189,103,.24)', background: 'linear-gradient(135deg, rgba(231,189,103,.08), rgba(25,31,27,.96))' }}>
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: '12px' }}>
              <ShieldCheck size={20} color="#e7bd67" />
              <div>
                <h3 style={{ fontSize: '1.05rem', margin: '0 0 5px' }}>Validated result not available</h3>
                <p style={{ color: 'var(--text-secondary)', fontSize: '.88rem', margin: 0 }}>{result.evaluation.reason || 'Validated reference data is currently unavailable for this calculation.'}</p>
                <p style={{ color: 'var(--text-muted)', fontSize: '.78rem', margin: '9px 0 0' }}>EcoLoop will not substitute an estimated value. Try a supported device category or provide a measured unit weight if you have one.</p>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Material Composition & Potential Recovery Breakdown */}
      {result && result.evaluation && result.evaluation.available !== false && (
        <div className="glass-panel" style={{ padding: '28px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '18px', flexWrap: 'wrap', gap: '12px' }}>
            <div>
              <h3 style={{ fontSize: '1.3rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Layers size={20} color="#06b6d4" />
                Estimated Material Composition &amp; Recovery Breakdown
              </h3>
              <p style={{ fontSize: '0.84rem', color: 'var(--text-muted)' }}>
                Based on EU JRC ProSUM / UNITAR characterization fractions and Umicore / EPA WARM industrial recycling recovery factors.
              </p>
            </div>

            <div style={{ display: 'flex', gap: '8px' }}>
              <button 
                className="btn btn-secondary btn-sm"
                onClick={() => setShowSourcesModal(!showSourcesModal)}
              >
                <BookOpen size={14} />
                {showSourcesModal ? 'Hide Data Sources' : 'View Data Sources & Citations'}
              </button>

              <button 
                className="btn btn-primary btn-sm"
                onClick={() => onProceedToRegister({
                  categoryId,
                  brand,
                  model,
                  quantity,
                  purchaseYear,
                  condition,
                  userWeightKg: weightMode === 'custom' ? userWeightKg : null,
                  userIntendedPathway
                })}
              >
                Proceed to Register This Device
                <ArrowRight size={14} />
              </button>
            </div>
          </div>

          {/* Sources Dropdown Drawer */}
          {showSourcesModal && (
            <div style={{
              backgroundColor: 'rgba(0, 0, 0, 0.4)',
              border: '1px solid rgba(16, 185, 129, 0.3)',
              borderRadius: 'var(--radius-md)',
              padding: '16px 20px',
              marginBottom: '20px'
            }}>
              <div style={{ fontWeight: 700, fontSize: '0.88rem', color: 'var(--accent-emerald-light)', marginBottom: '8px' }}>
                Documented Data Sources Used for this Calculation:
              </div>
              <ul style={{ paddingLeft: '20px', fontSize: '0.8rem', color: 'var(--text-secondary)', display: 'flex', flexDirection: 'column', gap: '6px' }}>
                {result.evaluation.dataSources.map((src, i) => (
                  <li key={i}>{src}</li>
                ))}
              </ul>
            </div>
          )}

          {/* Detailed Materials Table */}
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.86rem' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid var(--border-medium)', color: 'var(--text-muted)', fontSize: '0.78rem', textTransform: 'uppercase' }}>
                  <th style={{ padding: '12px 10px' }}>Material / Elemental Fraction</th>
                  <th style={{ padding: '12px 10px' }}>Mass Fraction</th>
                  <th style={{ padding: '12px 10px' }}>Estimated Present</th>
                  <th style={{ padding: '12px 10px' }}>Recovery Yield</th>
                  <th style={{ padding: '12px 10px' }}>Potential Recoverable</th>
                  <th style={{ padding: '12px 10px' }}>Avoided CO₂e Factor</th>
                  <th style={{ padding: '12px 10px' }}>Potential Avoided CO₂e</th>
                </tr>
              </thead>
              <tbody>
                {result.evaluation.materialBreakdown.map((mat, idx) => (
                  <tr 
                    key={idx}
                    style={{
                      borderBottom: '1px solid var(--border-subtle)',
                      backgroundColor: idx % 2 === 0 ? 'rgba(255, 255, 255, 0.01)' : 'transparent'
                    }}
                  >
                    <td style={{ padding: '12px 10px' }}>
                      <div style={{ fontWeight: 600, color: 'var(--text-primary)' }}>
                        {mat.standardName}
                      </div>
                      <div style={{ fontSize: '0.74rem', color: 'var(--text-muted)' }}>
                        {mat.label}
                      </div>
                      {mat.isCriticalRawMaterial && (
                        <span style={{
                          display: 'inline-block',
                          fontSize: '0.65rem',
                          backgroundColor: 'rgba(245, 158, 11, 0.15)',
                          color: '#fbbf24',
                          padding: '1px 5px',
                          borderRadius: '4px',
                          marginTop: '2px',
                          border: '1px solid rgba(245, 158, 11, 0.3)'
                        }}>
                          Critical Raw Material (CRM)
                        </span>
                      )}
                    </td>

                    <td style={{ padding: '12px 10px', fontFamily: 'var(--font-mono)' }}>
                      {mat.fractionPercent}%
                    </td>

                    <td style={{ padding: '12px 10px', fontFamily: 'var(--font-mono)', color: 'var(--text-primary)' }}>
                      {mat.massPresentKg >= 0.01 ? `${mat.massPresentKg.toFixed(3)} kg` : `${mat.massPresentGrams.toFixed(2)} g`}
                    </td>

                    <td style={{ padding: '12px 10px' }}>
                      <span style={{
                        padding: '2px 8px',
                        borderRadius: 'var(--radius-full)',
                        fontSize: '0.74rem',
                        fontWeight: 600,
                        backgroundColor: mat.recoveryEfficiencyPercent > 70 ? 'rgba(16, 185, 129, 0.12)' : 'rgba(245, 158, 11, 0.12)',
                        color: mat.recoveryEfficiencyPercent > 70 ? '#34d399' : '#fbbf24'
                      }}>
                        {mat.recoveryEfficiencyPercent}%
                      </span>
                    </td>

                    <td style={{ padding: '12px 10px', fontFamily: 'var(--font-mono)', fontWeight: 600, color: '#38bdf8' }}>
                      {mat.massPotentialRecoverableKg >= 0.01 ? `${mat.massPotentialRecoverableKg.toFixed(3)} kg` : `${mat.massPotentialRecoverableGrams.toFixed(2)} g`}
                    </td>

                    <td style={{ padding: '12px 10px', fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                      {mat.avoidedCo2eFactorKgPerKg > 0 ? `${mat.avoidedCo2eFactorKgPerKg.toLocaleString()} kg CO₂e / kg` : 'N/A'}
                    </td>

                    <td style={{ padding: '12px 10px', fontFamily: 'var(--font-mono)', color: mat.potentialAvoidedCo2eKg > 0 ? '#34d399' : 'var(--text-muted)', fontWeight: 600 }}>
                      {mat.potentialAvoidedCo2eKg > 0 ? `~${mat.potentialAvoidedCo2eKg.toFixed(2)} kg` : '—'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
