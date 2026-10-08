import React, { useState, useEffect } from 'react';
import { api } from '../api';
import { 
  GitFork, 
  Search, 
  CheckCircle2, 
  Clock, 
  Sparkles, 
  Cpu, 
  RefreshCw, 
  Layers, 
  Factory, 
  ArrowRight, 
  ShieldCheck, 
  ChevronRight,
  TrendingUp,
  AlertCircle
} from 'lucide-react';

export default function CircularJourneyModule({ selectedTrackingCode, submissions = [] }) {
  const [trackingCode, setTrackingCode] = useState(selectedTrackingCode || (submissions[0]?.trackingCode || ''));
  const [journeyData, setJourneyData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const fetchJourney = async (code) => {
    if (!code) return;
    setLoading(true);
    setError(null);
    try {
      const data = await api.journey(code);
      setJourneyData(data.journey);
    } catch (err) {
      console.error('Fetch journey failed:', err);
      setError(err.message || 'Could not connect to tracking engine.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (selectedTrackingCode) {
      setTrackingCode(selectedTrackingCode);
      fetchJourney(selectedTrackingCode);
    } else if (submissions.length > 0) {
      fetchJourney(trackingCode);
    }
  }, [selectedTrackingCode, submissions]);

  const handleSearch = (e) => {
    e.preventDefault();
    fetchJourney(trackingCode.trim());
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '30px' }}>
      {/* Module Banner */}
      <div className="glass-panel" style={{ padding: '28px 32px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '16px' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--accent-emerald-light)', fontSize: '0.85rem', fontWeight: 700, marginBottom: '6px' }}>
              <GitFork size={18} />
              CIRCULAR ECONOMY VALUE REGENERATION VISUALIZER
            </div>
            <h1 style={{ fontSize: '2.2rem', fontWeight: 800 }}>Device Circular Journey</h1>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.96rem', maxWidth: '780px', marginTop: '6px' }}>
              Follow an electronic device through each closed-loop milestone—demonstrating that value, rare elements, 
              and engineered materials are retained within the productive economy rather than lost to landfills.
            </p>
          </div>

          {/* Quick Tracking Selector */}
          <form onSubmit={handleSearch} style={{ display: 'flex', gap: '8px', minWidth: '320px' }}>
            <input 
              type="text" 
              className="form-input" 
              style={{ flex: 1, fontFamily: 'var(--font-mono)', textTransform: 'uppercase' }}
              value={trackingCode}
              onChange={e => setTrackingCode(e.target.value)}
              placeholder="Enter ECL-XXX-XXXX"
            />
            <button type="submit" className="btn btn-primary btn-sm">
              <Search size={15} />
              Trace
            </button>
          </form>
        </div>

        {/* Quick Clickable Tracking Pills */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginTop: '18px', flexWrap: 'wrap' }}>
          <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)', fontWeight: 600 }}>Track Sample Items:</span>
          {submissions.slice(0, 5).map(s => (
            <button
              key={s.id}
              onClick={() => {
                setTrackingCode(s.trackingCode);
                fetchJourney(s.trackingCode);
              }}
              style={{
                backgroundColor: trackingCode === s.trackingCode ? 'rgba(16, 185, 129, 0.2)' : 'rgba(255, 255, 255, 0.04)',
                border: trackingCode === s.trackingCode ? '1px solid var(--accent-emerald)' : '1px solid var(--border-subtle)',
                color: trackingCode === s.trackingCode ? '#34d399' : 'var(--text-secondary)',
                borderRadius: 'var(--radius-full)',
                padding: '3px 10px',
                fontSize: '0.75rem',
                fontFamily: 'var(--font-mono)',
                cursor: 'pointer'
              }}
            >
              {s.trackingCode} ({s.model.split('/')[0]} - {s.status})
            </button>
          ))}
        </div>
      </div>

      {error && (
        <div style={{
          backgroundColor: 'rgba(244, 63, 94, 0.1)',
          border: '1px solid rgba(244, 63, 94, 0.3)',
          color: '#fb7185',
          padding: '16px 20px',
          borderRadius: 'var(--radius-md)',
          display: 'flex',
          alignItems: 'center',
          gap: '10px'
        }}>
          <AlertCircle size={20} />
          {error}
        </div>
      )}

      {journeyData && (
        <>
          {/* Active Device Overview Card */}
          <div className="glass-panel" style={{ padding: '24px 30px' }}>
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              flexWrap: 'wrap',
              gap: '16px',
              borderBottom: '1px solid var(--border-subtle)',
              paddingBottom: '16px',
              marginBottom: '20px'
            }}>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span style={{ fontSize: '1.4rem', fontWeight: 800 }}>{journeyData.device}</span>
                  <span className="badge badge-cyan">{journeyData.category}</span>
                </div>
                <div style={{ fontSize: '0.84rem', color: 'var(--text-muted)', marginTop: '4px' }}>
                  Digital Passport: <span style={{ fontFamily: 'var(--font-mono)', color: '#38bdf8' }}>{journeyData.trackingCode}</span>
                </div>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>Assigned Circular Pathway</div>
                  <div style={{ fontSize: '1.05rem', fontWeight: 700, color: 'var(--accent-emerald-light)' }}>
                    {journeyData.recommendedPathway}
                  </div>
                </div>

                <span className={`badge ${
                  journeyData.status === 'Recovered' ? 'badge-high' :
                  journeyData.status === 'Processing' ? 'badge-medium' :
                  journeyData.status === 'In Assessment' ? 'badge-purple' :
                  journeyData.status === 'Collected' ? 'badge-cyan' : 'badge-low'
                }`} style={{ fontSize: '0.85rem', padding: '6px 14px' }}>
                  Current Status: {journeyData.status}
                </span>
              </div>
            </div>

            {/* Stepped Timeline */}
            <div style={{
              display: 'flex',
              flexDirection: 'column',
              gap: '24px',
              position: 'relative',
              paddingLeft: '16px'
            }}>
              {journeyData.stages.map((stg, idx) => {
                const isCompleted = stg.completed;
                const isCurrent = stg.current;

                return (
                  <div 
                    key={idx}
                    style={{
                      display: 'flex',
                      gap: '20px',
                      position: 'relative'
                    }}
                  >
                    {/* Connecting line */}
                    {idx < journeyData.stages.length - 1 && (
                      <div style={{
                        position: 'absolute',
                        left: '19px',
                        top: '40px',
                        bottom: '-24px',
                        width: '2px',
                        backgroundColor: isCompleted ? 'rgba(16, 185, 129, 0.4)' : 'rgba(255, 255, 255, 0.08)',
                        zIndex: 0
                      }} />
                    )}

                    {/* Milestone Icon Node */}
                    <div style={{
                      width: '40px',
                      height: '40px',
                      borderRadius: '50%',
                      backgroundColor: isCurrent ? 'var(--accent-emerald)' : (isCompleted ? 'rgba(16, 185, 129, 0.2)' : 'rgba(255, 255, 255, 0.05)'),
                      border: isCurrent ? '3px solid #34d399' : (isCompleted ? '2px solid var(--accent-emerald)' : '1px solid var(--border-subtle)'),
                      color: isCurrent ? '#022c22' : (isCompleted ? '#34d399' : 'var(--text-muted)'),
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontWeight: 700,
                      zIndex: 1,
                      boxShadow: isCurrent ? '0 0 20px rgba(16, 185, 129, 0.6)' : 'none',
                      flexShrink: 0
                    }}>
                      {isCompleted ? <CheckCircle2 size={20} /> : (idx + 1)}
                    </div>

                    {/* Stage Details */}
                    <div style={{
                      flex: 1,
                      backgroundColor: isCurrent ? 'rgba(16, 185, 129, 0.06)' : 'rgba(255, 255, 255, 0.015)',
                      border: isCurrent ? '1px solid rgba(16, 185, 129, 0.3)' : '1px solid var(--border-subtle)',
                      borderRadius: 'var(--radius-md)',
                      padding: '16px 20px'
                    }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '8px' }}>
                        <div>
                          <div style={{ fontSize: '0.74rem', color: isCurrent ? 'var(--accent-emerald-light)' : 'var(--text-muted)', fontWeight: 700, textTransform: 'uppercase' }}>
                            {stg.stage}
                          </div>
                          <div style={{ fontSize: '1.1rem', fontWeight: 700, marginTop: '2px', color: 'var(--text-primary)' }}>
                            {stg.title}
                          </div>
                        </div>

                        {stg.date && (
                          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.76rem', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>
                            <Clock size={13} />
                            {new Date(stg.date).toLocaleString()}
                          </div>
                        )}
                      </div>

                      <p style={{ fontSize: '0.86rem', color: 'var(--text-secondary)', marginTop: '8px', lineHeight: 1.5 }}>
                        {stg.description}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Interactive Closed-Loop Visual Flow Diagram */}
          <div className="glass-panel" style={{ padding: '30px' }}>
            <h3 style={{ fontSize: '1.25rem', fontWeight: 700, marginBottom: '18px', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <RefreshCw size={20} color="#34d399" />
              Circular Retention Loop Architecture
            </h3>

            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
              gap: '14px',
              position: 'relative'
            }}>
              <div style={{ backgroundColor: 'rgba(255, 255, 255, 0.02)', padding: '16px', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-subtle)' }}>
                <div style={{ color: '#38bdf8', fontSize: '0.78rem', fontWeight: 700 }}>STAGE 1</div>
                <div style={{ fontSize: '1rem', fontWeight: 700, marginTop: '4px' }}>Original Device</div>
                <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginTop: '6px' }}>
                  Manufactured from primary bauxite, iron ore, chalcopyrite copper, and refined gold.
                </div>
              </div>

              <div style={{ backgroundColor: 'rgba(255, 255, 255, 0.02)', padding: '16px', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-subtle)' }}>
                <div style={{ color: '#c084fc', fontSize: '0.78rem', fontWeight: 700 }}>STAGE 2</div>
                <div style={{ fontSize: '1rem', fontWeight: 700, marginTop: '4px' }}>Diagnostic Triage</div>
                <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginTop: '6px' }}>
                  Assessment distinguishes reuse potential vs component salvage vs industrial smelting.
                </div>
              </div>

              <div style={{ backgroundColor: 'rgba(16, 185, 129, 0.08)', padding: '16px', borderRadius: 'var(--radius-sm)', border: '1px solid rgba(16, 185, 129, 0.3)' }}>
                <div style={{ color: 'var(--accent-emerald-light)', fontSize: '0.78rem', fontWeight: 700 }}>STAGE 3</div>
                <div style={{ fontSize: '1rem', fontWeight: 700, marginTop: '4px' }}>Closed Loop Recovery</div>
                <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginTop: '6px' }}>
                  Mechanical separation &amp; hydrometallurgy yield 85-94% pure secondary raw materials.
                </div>
              </div>

              <div style={{ backgroundColor: 'rgba(6, 182, 212, 0.08)', padding: '16px', borderRadius: 'var(--radius-sm)', border: '1px solid rgba(6, 182, 212, 0.3)' }}>
                <div style={{ color: '#06b6d4', fontSize: '0.78rem', fontWeight: 700 }}>STAGE 4</div>
                <div style={{ fontSize: '1rem', fontWeight: 700, marginTop: '4px' }}>Secondary Value Creation</div>
                <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginTop: '6px' }}>
                  Replaces destructive open-pit mining; feeds secondary smelters for new electronics.
                </div>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
