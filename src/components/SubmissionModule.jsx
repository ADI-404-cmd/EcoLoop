import React, { useState, useEffect } from 'react';
import { api } from '../api';
import { 
  PlusCircle, 
  CheckCircle2, 
  MapPin, 
  ShieldCheck, 
  ArrowRight, 
  Truck, 
  Building2, 
  QrCode, 
  Clock, 
  FileCheck,
  AlertCircle
} from 'lucide-react';

export default function SubmissionModule({ initialFormData, onSuccessSubmit, onNavigateToJourney }) {
  const [categories, setCategories] = useState([]);
  const [centers, setCenters] = useState([]);
  const [loading, setLoading] = useState(false);
  const [successSubmission, setSuccessSubmission] = useState(null);
  const [formError, setFormError] = useState('');

  // Form fields
  const [userName, setUserName] = useState('');
  const [userEmail, setUserEmail] = useState('');
  const [categoryId, setCategoryId] = useState(initialFormData?.categoryId || 'cat-laptop');
  const [brand, setBrand] = useState(initialFormData?.brand || 'Dell');
  const [model, setModel] = useState(initialFormData?.model || 'Latitude 5420 / 5430');
  const [quantity, setQuantity] = useState(initialFormData?.quantity || 1);
  const [purchaseYear, setPurchaseYear] = useState(initialFormData?.purchaseYear || 2021);
  const [condition, setCondition] = useState(initialFormData?.condition || 'Working with issues');
  const [weightMode, setWeightMode] = useState('reference');
  const [userWeightKg, setUserWeightKg] = useState(initialFormData?.userWeightKg || '');
  const [userIntendedPathway, setUserIntendedPathway] = useState(initialFormData?.userIntendedPathway || 'Repair/refurbish');
  const [selectedCenterId, setSelectedCenterId] = useState('cc-blr-01');
  const [collectionMethod, setCollectionMethod] = useState('Drop-off at Center');
  const [notes, setNotes] = useState('');

  useEffect(() => {
    api.categories().then(d => setCategories(d.categories || [])).catch(() => setFormError('Device categories are temporarily unavailable.'));
    api.centers().then(d => setCenters(d.centers || [])).catch(() => setFormError('Collection-center data is temporarily unavailable.'));
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setFormError('');
    try {
      const data = await api.register({
          userName,
          userEmail,
          categoryId,
          brand,
          model,
          quantity: parseInt(quantity, 10) || 1,
          purchaseYear: parseInt(purchaseYear, 10),
          condition,
          userWeightKg: weightMode === 'custom' && userWeightKg ? parseFloat(userWeightKg) : null,
          userIntendedPathway,
          selectedCenterId,
          collectionMethod,
          notes
      });
      setSuccessSubmission(data.submission);
      if (onSuccessSubmit) {
        onSuccessSubmit(data.submission);
      }
    } catch (err) {
      console.error('Registration failed:', err);
      setFormError(err.message || 'We could not reach the registration service. Your details have not been recorded; please try again.');
    } finally {
      setLoading(false);
    }
  };

  const selectedCenter = centers.find(c => c.id === selectedCenterId);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '28px', maxWidth: '1000px', margin: '0 auto' }}>
      {/* Header */}
      <div className="glass-panel" style={{ padding: '28px 32px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--accent-emerald-light)', fontSize: '0.85rem', fontWeight: 700, marginBottom: '6px' }}>
          <PlusCircle size={18} />
          E-WASTE REGISTRATION &amp; CUSTODY INTAKE
        </div>
        <h1 style={{ fontSize: '2.1rem', fontWeight: 800 }}>Register Electronic Device for Circular Pathway</h1>
        <p style={{ color: 'var(--text-secondary)', fontSize: '0.96rem', marginTop: '6px' }}>
          Submit electronic items to create a verifiable digital custody passport, assess potential material recovery, 
          and route the device through CPCB authorized collection centers.
        </p>
      </div>

      {successSubmission ? (
        /* Success Confirmation Panel */
        <div className="glass-panel-accent" style={{ padding: '36px', borderRadius: 'var(--radius-lg)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '14px', marginBottom: '20px' }}>
            <div style={{
              width: '56px',
              height: '56px',
              borderRadius: '50%',
              backgroundColor: 'rgba(16, 185, 129, 0.2)',
              border: '2px solid var(--accent-emerald)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'var(--accent-emerald-light)'
            }}>
              <CheckCircle2 size={32} />
            </div>
            <div>
              <span className="badge badge-high" style={{ marginBottom: '4px' }}>
                Status: Registered (Pending Collection)
              </span>
              <h2 style={{ fontSize: '1.7rem', fontWeight: 800 }}>
                Device Successfully Logged in EcoLoop!
              </h2>
            </div>
          </div>

          <div style={{
            backgroundColor: 'rgba(0, 0, 0, 0.4)',
            border: '1px solid var(--border-medium)',
            borderRadius: 'var(--radius-md)',
            padding: '24px',
            marginBottom: '24px',
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
            gap: '18px'
          }}>
            <div>
              <div style={{ fontSize: '0.76rem', color: 'var(--text-muted)' }}>Unique Digital Tracking Code</div>
              <div style={{ fontSize: '1.35rem', fontWeight: 800, fontFamily: 'var(--font-mono)', color: '#38bdf8' }}>
                {successSubmission.trackingCode}
              </div>
            </div>

            <div>
              <div style={{ fontSize: '0.76rem', color: 'var(--text-muted)' }}>Equipment</div>
              <div style={{ fontSize: '1.1rem', fontWeight: 700 }}>
                {successSubmission.brand} {successSubmission.model} ({successSubmission.quantity} units &bull; {successSubmission.totalMassKg} kg)
              </div>
            </div>

            <div>
              <div style={{ fontSize: '0.76rem', color: 'var(--text-muted)' }}>Recommended Circular Pathway</div>
              <div style={{ fontSize: '1.1rem', fontWeight: 700, color: 'var(--accent-emerald-light)' }}>
                {successSubmission.recommendedPathway}
              </div>
            </div>

            <div>
              <div style={{ fontSize: '0.76rem', color: 'var(--text-muted)' }}>Collection Method &amp; Hub</div>
              <div style={{ fontSize: '0.95rem', fontWeight: 600 }}>
                {successSubmission.collectionMethod} ({successSubmission.selectedCenterId})
              </div>
            </div>
          </div>

          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '14px' }}>
            <button
              className="btn btn-primary btn-lg"
              onClick={() => onNavigateToJourney(successSubmission.trackingCode)}
            >
              Trace Device Circular Journey
              <ArrowRight size={18} />
            </button>

            <button
              className="btn btn-secondary btn-lg"
              onClick={() => setSuccessSubmission(null)}
            >
              Register Another Item
            </button>
          </div>
        </div>
      ) : (
        /* Registration Form */
        <form onSubmit={handleSubmit} className="glass-panel" style={{ padding: '32px' }}>
          {formError && <div role="alert" style={{ marginBottom: '18px', padding: '12px 14px', borderRadius: '9px', border: '1px solid rgba(233,133,118,.25)', background: 'rgba(233,133,118,.08)', color: '#efafa5', fontSize: '.86rem' }}>{formError}</div>}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '22px' }}>
            {/* Section 1: User / Registrant Info */}
            <div>
              <h2 style={{ fontSize: '1.15rem', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '14px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span>1.</span> Registrant Details
              </h2>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
                <div className="form-group">
                  <label className="form-label">Registrant Name / Lab / Dept *</label>
                  <input 
                    type="text" 
                    required 
                    className="form-input" 
                    value={userName} 
                    onChange={e => setUserName(e.target.value)}
                    placeholder="e.g. Advait Sharma (Room 302, CS Dept)"
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Email Address *</label>
                  <input 
                    type="email" 
                    required 
                    className="form-input" 
                    value={userEmail} 
                    onChange={e => setUserEmail(e.target.value)}
                    placeholder="user@college.edu"
                  />
                </div>
              </div>
            </div>

            {/* Section 2: Device Specifics */}
            <div style={{ borderTop: '1px solid var(--border-subtle)', paddingTop: '18px' }}>
              <h2 style={{ fontSize: '1.15rem', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '14px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span>2.</span> Equipment &amp; Condition Details
              </h2>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '14px' }}>
                <div className="form-group">
                  <label className="form-label">Device Category *</label>
                  <select 
                    className="form-select" 
                    value={categoryId} 
                    onChange={e => setCategoryId(e.target.value)}
                  >
                    {categories.map(c => (
                      <option key={c.id} value={c.id}>
                        {c.name} ({c.cpcbCode})
                      </option>
                    ))}
                  </select>
                </div>

                <div className="form-group">
                  <label className="form-label">Brand</label>
                  <input 
                    type="text" 
                    className="form-input" 
                    value={brand} 
                    onChange={e => setBrand(e.target.value)}
                    placeholder="e.g. Dell, Apple, HP, Samsung"
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Model Name</label>
                  <input 
                    type="text" 
                    className="form-input" 
                    value={model} 
                    onChange={e => setModel(e.target.value)}
                    placeholder="e.g. Latitude 5420, iPhone 14"
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Quantity (Units) *</label>
                  <input 
                    type="number" 
                    min="1" 
                    max="1000" 
                    required
                    className="form-input" 
                    value={quantity} 
                    onChange={e => setQuantity(e.target.value)}
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Purchase Year *</label>
                  <input 
                    type="number" 
                    min="2000" 
                    max="2026" 
                    required
                    className="form-input" 
                    value={purchaseYear} 
                    onChange={e => setPurchaseYear(e.target.value)}
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Condition *</label>
                  <select 
                    className="form-select" 
                    value={condition} 
                    onChange={e => setCondition(e.target.value)}
                  >
                    <option value="Fully working">Fully working</option>
                    <option value="Working with issues">Working with issues</option>
                    <option value="Non-working">Non-working</option>
                    <option value="Physically damaged">Physically damaged</option>
                  </select>
                </div>
              </div>

              {/* End of Life Intended Pathway */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px', marginTop: '6px' }}>
                <div className="form-group">
                  <label className="form-label">User's Intended End-of-Life Pathway</label>
                  <select 
                    className="form-select" 
                    value={userIntendedPathway} 
                    onChange={e => setUserIntendedPathway(e.target.value)}
                  >
                    <option value="Continue using">Continue using</option>
                    <option value="Reuse/donate">Reuse/donate</option>
                    <option value="Repair/refurbish">Repair/refurbish</option>
                    <option value="Formal recycling">Formal recycling</option>
                    <option value="Not sure">Not sure (Recommend best circular path)</option>
                  </select>
                </div>

                <div className="form-group">
                  <label className="form-label">Weight Method</label>
                  <select 
                    className="form-select" 
                    value={weightMode} 
                    onChange={e => setWeightMode(e.target.value)}
                  >
                    <option value="reference">Use Scientific Category/Model Benchmark</option>
                    <option value="custom">Provide Custom Measured Mass (kg)</option>
                  </select>
                </div>
              </div>

              {weightMode === 'custom' && (
                <div className="form-group">
                  <label className="form-label">Measured Unit Weight (kg)</label>
                  <input 
                    type="number" 
                    step="0.01" 
                    className="form-input" 
                    value={userWeightKg} 
                    onChange={e => setUserWeightKg(e.target.value)}
                    placeholder="e.g. 1.45"
                  />
                </div>
              )}
            </div>

            {/* Section 3: Responsible Collection Logistics */}
            <div style={{ borderTop: '1px solid var(--border-subtle)', paddingTop: '18px' }}>
              <h2 style={{ fontSize: '1.15rem', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '14px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span>3.</span> Responsible Collection Routing
              </h2>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
                <div className="form-group">
                  <label className="form-label">Select CPCB Authorized Hub *</label>
                  <select 
                    className="form-select" 
                    value={selectedCenterId} 
                    onChange={e => setSelectedCenterId(e.target.value)}
                  >
                    {centers.map(c => (
                      <option key={c.id} value={c.id}>
                        {c.name} ({c.city} &bull; {c.status})
                      </option>
                    ))}
                  </select>
                  {selectedCenter && (
                    <div style={{ fontSize: '0.74rem', color: 'var(--text-muted)', marginTop: '4px' }}>
                      {selectedCenter.operator} &bull; Reg: {selectedCenter.cpcbRegistrationNo}
                    </div>
                  )}
                </div>

                <div className="form-group">
                  <label className="form-label">Collection Method *</label>
                  <select 
                    className="form-select" 
                    value={collectionMethod} 
                    onChange={e => setCollectionMethod(e.target.value)}
                  >
                    <option value="Drop-off at Center">Self Drop-off at Center Drop Box</option>
                    <option value="Pickup Scheduled">Request Campus / Doorstep Logistics Van Pickup</option>
                  </select>
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">Notes / Access Instructions</label>
                <textarea 
                  rows={2} 
                  className="form-textarea" 
                  value={notes} 
                  onChange={e => setNotes(e.target.value)}
                  placeholder="e.g. Department lab room 302, 3rd floor. Available between 2-4 PM."
                />
              </div>
            </div>

            {/* Submit Action */}
            <div style={{ borderTop: '1px solid var(--border-subtle)', paddingTop: '20px', display: 'flex', justifyContent: 'flex-end', gap: '12px' }}>
              <button 
                type="submit" 
                disabled={loading}
                className="btn btn-primary btn-lg"
              >
                {loading ? 'Processing Scientific Intake...' : 'Submit & Generate Circular Passport'}
                <ArrowRight size={18} />
              </button>
            </div>
          </div>
        </form>
      )}
    </div>
  );
}
