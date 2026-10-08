import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { api } from '../api';
import {
  BarChart3, RefreshCw, TrendingUp, Package, Truck, Factory,
  Layers, AlertTriangle, CheckCircle2, Clock, Activity,
  ArrowUpRight, Cpu, Recycle, Leaf, FlaskConical, PieChart as PieChartIcon,
  Flame, Sparkles, Filter, ChevronRight, ShieldCheck, ArrowRight
} from 'lucide-react';

// ==========================================
// 1. Interactive SVG Donut Chart for Pathways
// ==========================================
function CircularPathwayDonut({ pathways, totalUnits }) {
  const [hoveredIdx, setHoveredIdx] = useState(null);

  const colors = [
    '#10b981', '#38bdf8', '#8b5cf6', '#f59e0b', '#f43f5e', '#14b8a6'
  ];

  const total = totalUnits || pathways.reduce((acc, p) => acc + p.units, 0) || 1;

  // Compute angles for each segment
  let currentAngle = 0;
  const segments = pathways.map((p, idx) => {
    const fraction = p.units / total;
    const angle = fraction * 360;
    const startAngle = currentAngle;
    const endAngle = currentAngle + angle;
    currentAngle = endAngle;
    return {
      ...p,
      color: colors[idx % colors.length],
      fraction,
      startAngle,
      endAngle,
      percentage: Math.round(fraction * 100)
    };
  });

  // Helper to calculate SVG arc path
  const radius = 80;
  const innerRadius = 54;
  const cx = 110;
  const cy = 110;

  function polarToCartesian(centerX, centerY, r, angleInDegrees) {
    const angleInRadians = (angleInDegrees - 90) * Math.PI / 180.0;
    return {
      x: centerX + (r * Math.cos(angleInRadians)),
      y: centerY + (r * Math.sin(angleInRadians))
    };
  }

  function describeArc(x, y, r, ir, startA, endA) {
    const sweep = endA - startA;
    if (sweep >= 359.99) {
      // Full circle
      return `M ${x - r} ${y} A ${r} ${r} 0 1 0 ${x + r} ${y} A ${r} ${r} 0 1 0 ${x - r} ${y} M ${x - ir} ${y} A ${ir} ${ir} 0 1 1 ${x + ir} ${y} A ${ir} ${ir} 0 1 1 ${x - ir} ${y} Z`;
    }

    const outerStart = polarToCartesian(x, y, r, endA);
    const outerEnd = polarToCartesian(x, y, r, startA);
    const innerStart = polarToCartesian(x, y, ir, startA);
    const innerEnd = polarToCartesian(x, y, ir, endA);

    const largeArcFlag = sweep <= 180 ? '0' : '1';

    return [
      'M', outerStart.x, outerStart.y,
      'A', r, r, 0, largeArcFlag, 0, outerEnd.x, outerEnd.y,
      'L', innerStart.x, innerStart.y,
      'A', ir, ir, 0, largeArcFlag, 1, innerEnd.x, innerEnd.y,
      'Z'
    ].join(' ');
  }

  const activeSegment = hoveredIdx !== null ? segments[hoveredIdx] : null;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative' }}>
        <svg width="220" height="220" viewBox="0 0 220 220" style={{ overflow: 'visible' }}>
          <defs>
            <filter id="glow" x="-20%" y="-20%" width="140%" height="140%">
              <feGaussianBlur stdDeviation="3" result="blur" />
              <feComposite in="SourceGraphic" in2="blur" operator="over" />
            </filter>
          </defs>

          {/* Background circle track */}
          <circle cx={cx} cy={cy} r={radius} fill="none" stroke="rgba(255,255,255,0.04)" strokeWidth={radius - innerRadius} />

          {/* Segments */}
          {segments.map((seg, idx) => {
            const isHovered = hoveredIdx === idx;
            const currentR = isHovered ? radius + 4 : radius;
            const currentIr = isHovered ? innerRadius - 2 : innerRadius;
            const d = describeArc(cx, cy, currentR, currentIr, seg.startAngle, seg.endAngle);

            return (
              <motion.path
                key={seg.name}
                d={d}
                fill={seg.color}
                opacity={hoveredIdx === null || isHovered ? 1 : 0.4}
                filter={isHovered ? 'url(#glow)' : undefined}
                style={{ cursor: 'pointer', transition: 'opacity 0.2s, filter 0.2s' }}
                onMouseEnter={() => setHoveredIdx(idx)}
                onMouseLeave={() => setHoveredIdx(null)}
                whileHover={{ scale: 1.02, transformOrigin: `${cx}px ${cy}px` }}
              />
            );
          })}

          {/* Center Hole Information */}
          <g transform={`translate(${cx}, ${cy})`}>
            {activeSegment ? (
              <>
                <text textAnchor="middle" y="-12" fill={activeSegment.color} fontSize="17" fontWeight="800" fontFamily="var(--font-mono)">
                  {activeSegment.percentage}%
                </text>
                <text textAnchor="middle" y="6" fill="var(--text-primary)" fontSize="11" fontWeight="700">
                  {activeSegment.units} units
                </text>
                <text textAnchor="middle" y="21" fill="var(--text-muted)" fontSize="9">
                  {activeSegment.massKg} kg
                </text>
              </>
            ) : (
              <>
                <text textAnchor="middle" y="-6" fill="var(--accent-emerald-light)" fontSize="19" fontWeight="800" fontFamily="var(--font-mono)">
                  {total}
                </text>
                <text textAnchor="middle" y="12" fill="var(--text-secondary)" fontSize="10" fontWeight="600" letterSpacing="0.04em">
                  TOTAL UNITS
                </text>
                <text textAnchor="middle" y="26" fill="var(--text-muted)" fontSize="8">
                  Hover for details
                </text>
              </>
            )}
          </g>
        </svg>
      </div>

      {/* Legend Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: '8px' }}>
        {segments.map((seg, idx) => {
          const isSelected = hoveredIdx === idx;
          return (
            <motion.div
              key={seg.name}
              onMouseEnter={() => setHoveredIdx(idx)}
              onMouseLeave={() => setHoveredIdx(null)}
              whileHover={{ y: -2 }}
              style={{
                display: 'flex',
                flexDirection: 'column',
                gap: '4px',
                padding: '8px 10px',
                borderRadius: '8px',
                background: isSelected ? `${seg.color}15` : 'rgba(255,255,255,0.02)',
                border: `1px solid ${isSelected ? seg.color : 'rgba(255,255,255,0.06)'}`,
                cursor: 'pointer',
                transition: 'all 0.2s ease'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: seg.color, flexShrink: 0 }} />
                <span style={{ fontSize: '0.78rem', fontWeight: 600, color: isSelected ? seg.color : 'var(--text-secondary)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                  {seg.name.split(' /')[0]}
                </span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginTop: '2px' }}>
                <span style={{ fontSize: '0.88rem', fontWeight: 800, fontFamily: 'var(--font-mono)', color: 'var(--text-primary)' }}>
                  {seg.units} <small style={{ fontSize: '0.68rem', color: 'var(--text-muted)' }}>({seg.percentage}%)</small>
                </span>
                <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>
                  {seg.massKg} kg
                </span>
              </div>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}

// ==========================================
// 2. Interactive Column Bar Chart for Device Categories
// ==========================================
function CategoryColumnChart({ categories }) {
  const [metricType, setMetricType] = useState('mass'); // 'mass' or 'units'
  const [hoveredCat, setHoveredCat] = useState(null);

  const maxMass = Math.max(...categories.map(c => c.massKg), 1);
  const maxUnits = Math.max(...categories.map(c => c.units), 1);
  const totalMass = categories.reduce((sum, c) => sum + c.massKg, 0);

  const chartHeight = 170;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
      {/* Metric Toggle */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <span style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>
          Showing volume comparison across CPCB e-waste categories
        </span>
        <div style={{ display: 'inline-flex', background: 'rgba(255,255,255,0.04)', padding: '3px', borderRadius: '8px', border: '1px solid var(--border-subtle)' }}>
          <button
            onClick={() => setMetricType('mass')}
            style={{
              padding: '4px 10px',
              fontSize: '0.75rem',
              fontWeight: 700,
              borderRadius: '6px',
              border: 0,
              background: metricType === 'mass' ? 'var(--accent-emerald-light)' : 'transparent',
              color: metricType === 'mass' ? '#121a0d' : 'var(--text-secondary)',
              cursor: 'pointer',
              transition: 'all 0.2s'
            }}
          >
            Mass (kg)
          </button>
          <button
            onClick={() => setMetricType('units')}
            style={{
              padding: '4px 10px',
              fontSize: '0.75rem',
              fontWeight: 700,
              borderRadius: '6px',
              border: 0,
              background: metricType === 'units' ? 'var(--accent-emerald-light)' : 'transparent',
              color: metricType === 'units' ? '#121a0d' : 'var(--text-secondary)',
              cursor: 'pointer',
              transition: 'all 0.2s'
            }}
          >
            Units Count
          </button>
        </div>
      </div>

      {/* SVG Bar Chart */}
      <div style={{ position: 'relative', width: '100%', height: `${chartHeight + 50}px` }}>
        {/* Background Grid Lines */}
        <div style={{ position: 'absolute', inset: `0 0 45px 0`, display: 'flex', flexDirection: 'column', justifyContent: 'space-between', pointerEvents: 'none' }}>
          {[1, 0.75, 0.5, 0.25, 0].map(fraction => (
            <div key={fraction} style={{ display: 'flex', alignItems: 'center', width: '100%' }}>
              <span style={{ fontSize: '0.65rem', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)', width: '38px' }}>
                {metricType === 'mass' ? `${Math.round(maxMass * fraction)}kg` : Math.round(maxUnits * fraction)}
              </span>
              <div style={{ flex: 1, borderTop: '1px dashed rgba(255,255,255,0.06)' }} />
            </div>
          ))}
        </div>

        {/* Columns Container */}
        <div style={{ position: 'absolute', left: '42px', right: '10px', bottom: '40px', height: `${chartHeight}px`, display: 'flex', alignItems: 'flex-end', gap: '14px', justifyContent: 'space-around' }}>
          {categories.map((cat, idx) => {
            const isHovered = hoveredCat === cat.name;
            const val = metricType === 'mass' ? cat.massKg : cat.units;
            const maxVal = metricType === 'mass' ? maxMass : maxUnits;
            const heightPct = Math.max(8, (val / maxVal) * 100);
            const sharePct = totalMass > 0 ? ((cat.massKg / totalMass) * 100).toFixed(1) : 0;

            return (
              <div
                key={cat.name}
                style={{ flex: 1, height: '100%', display: 'flex', flexDirection: 'column', justifyContent: 'flex-end', alignItems: 'center', position: 'relative' }}
                onMouseEnter={() => setHoveredCat(cat.name)}
                onMouseLeave={() => setHoveredCat(null)}
              >
                {/* Value Pill Above Bar on Hover */}
                {isHovered && (
                  <motion.div
                    initial={{ opacity: 0, y: 6 }}
                    animate={{ opacity: 1, y: 0 }}
                    style={{
                      position: 'absolute',
                      bottom: `calc(${heightPct}% + 8px)`,
                      background: 'rgba(17, 24, 19, 0.95)',
                      border: '1px solid var(--accent-emerald-light)',
                      borderRadius: '6px',
                      padding: '4px 8px',
                      fontSize: '0.72rem',
                      fontFamily: 'var(--font-mono)',
                      color: 'var(--text-primary)',
                      whiteSpace: 'nowrap',
                      zIndex: 30,
                      boxShadow: '0 4px 16px rgba(0,0,0,0.4)'
                    }}
                  >
                    <strong>{val} {metricType === 'mass' ? 'kg' : 'units'}</strong> ({sharePct}% share)
                  </motion.div>
                )}

                {/* Vertical Bar */}
                <motion.div
                  initial={{ height: 0 }}
                  animate={{ height: `${heightPct}%` }}
                  transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
                  style={{
                    width: '100%',
                    maxWidth: '44px',
                    borderRadius: '8px 8px 3px 3px',
                    background: isHovered
                      ? 'linear-gradient(180deg, #c6f36a 0%, #38bdf8 100%)'
                      : 'linear-gradient(180deg, rgba(56, 189, 248, 0.85) 0%, rgba(16, 185, 129, 0.7) 100%)',
                    boxShadow: isHovered ? '0 0 18px rgba(198, 243, 106, 0.45)' : 'none',
                    cursor: 'pointer',
                    transition: 'box-shadow 0.2s, background 0.2s'
                  }}
                />

                {/* X-axis Label */}
                <div style={{
                  position: 'absolute',
                  top: '100%',
                  marginTop: '8px',
                  width: '60px',
                  textAlign: 'center',
                  fontSize: '0.72rem',
                  color: isHovered ? 'var(--text-primary)' : 'var(--text-muted)',
                  fontWeight: isHovered ? 700 : 500,
                  whiteSpace: 'nowrap',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis'
                }}>
                  {cat.name.split(' ')[0]}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

// ==========================================
// 3. Circular Pipeline Waterfall Flow Graph
// ==========================================
function PipelineWaterfall({ pipeline, metrics, selectedStatus, onSelectStatus }) {
  const stages = [
    { key: 'Registered', label: '1. Registered', icon: Package, color: '#38bdf8', desc: 'Logged intake' },
    { key: 'Collected', label: '2. Collected', icon: Truck, color: '#10b981', desc: 'Custody secured' },
    { key: 'In Assessment', label: '3. Assessed', icon: Cpu, color: '#f59e0b', desc: 'Diagnostic triage' },
    { key: 'Processing', label: '4. Processing', icon: Factory, color: '#8b5cf6', desc: 'Smelting/Harvesting' },
    { key: 'Recovered', label: '5. Recovered', icon: Recycle, color: '#34d399', desc: 'Secondary value' }
  ];

  const totalRegistered = pipeline['Registered'] + pipeline['Collected'] + pipeline['In Assessment'] + pipeline['Processing'] + pipeline['Recovered'] || 1;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(170px, 1fr))', gap: '10px' }}>
        {stages.map((stg, i) => {
          const count = pipeline[stg.key] || 0;
          const isSelected = selectedStatus === stg.key;
          const Icon = stg.icon;
          const share = Math.round((count / totalRegistered) * 100);

          return (
            <motion.div
              key={stg.key}
              onClick={() => onSelectStatus(isSelected ? null : stg.key)}
              whileHover={{ y: -3 }}
              whileTap={{ scale: 0.98 }}
              style={{
                position: 'relative',
                display: 'flex',
                flexDirection: 'column',
                gap: '8px',
                padding: '14px',
                borderRadius: '12px',
                background: isSelected ? `${stg.color}22` : 'rgba(255,255,255,0.025)',
                border: `1px solid ${isSelected ? stg.color : 'rgba(255,255,255,0.07)'}`,
                cursor: 'pointer',
                transition: 'all 0.22s ease',
                boxShadow: isSelected ? `0 0 20px ${stg.color}30` : 'none'
              }}
            >
              {/* Header with Icon */}
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <span style={{ fontSize: '0.75rem', fontWeight: 700, color: stg.color, letterSpacing: '0.02em' }}>
                  {stg.label}
                </span>
                <div style={{ width: '28px', height: '28px', borderRadius: '7px', background: `${stg.color}20`, display: 'grid', placeItems: 'center' }}>
                  <Icon size={14} color={stg.color} />
                </div>
              </div>

              {/* Count */}
              <div>
                <span style={{ fontSize: '1.6rem', fontWeight: 800, fontFamily: 'var(--font-mono)', color: 'var(--text-primary)' }}>
                  {count}
                </span>
                <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginLeft: '6px' }}>units</span>
              </div>

              {/* Progress bar */}
              <div style={{ height: '4px', background: 'rgba(255,255,255,0.06)', borderRadius: '2px', overflow: 'hidden' }}>
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${Math.min(100, Math.max(5, share))}%` }}
                  style={{ height: '100%', background: stg.color, borderRadius: '2px' }}
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                <span>{stg.desc}</span>
                <span style={{ fontFamily: 'var(--font-mono)', color: stg.color, fontWeight: 700 }}>{share}%</span>
              </div>

              {isSelected && (
                <div style={{ position: 'absolute', top: '-6px', right: '-6px', width: '12px', height: '12px', borderRadius: '50%', background: stg.color, boxShadow: `0 0 8px ${stg.color}` }} />
              )}
            </motion.div>
          );
        })}
      </div>

      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '10px', padding: '10px 14px', background: 'rgba(255,255,255,0.02)', borderRadius: '8px', border: '1px solid var(--border-subtle)', fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <Activity size={14} color="var(--accent-emerald-light)" />
          <span><strong>Operational conversion:</strong> Intake → Collection rate: <strong style={{ color: 'var(--accent-emerald-light)' }}>{metrics.collectionRatePercent || 0}%</strong></span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <Factory size={14} color="#8b5cf6" />
          <span>Collection → Processing rate: <strong style={{ color: '#8b5cf6' }}>{metrics.processingRatePercent || 0}%</strong></span>
        </div>
      </div>
    </div>
  );
}

// ==========================================
// 4. Secondary Material Recovery Yield Matrix
// ==========================================
function MaterialRecoveryMatrix({ materials }) {
  const critical = materials.filter(m => m.isCriticalRawMaterial);
  const regular = materials.filter(m => !m.isCriticalRawMaterial);

  const maxMat = Math.max(...materials.map(m => m.massKg), 1);

  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '20px' }}>
      {/* Critical Raw Materials Stream */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '8px 12px', background: 'rgba(251, 146, 60, 0.08)', borderRadius: '8px', border: '1px solid rgba(251, 146, 60, 0.25)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <AlertTriangle size={15} color="#fb923c" />
            <span style={{ fontSize: '0.82rem', fontWeight: 700, color: '#fb923c' }}>Critical Raw Materials (EU CRM / CPCB)</span>
          </div>
          <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>{critical.length} elements</span>
        </div>

        {critical.length === 0 ? (
          <p style={{ color: 'var(--text-muted)', fontSize: '0.82rem', padding: '16px', textAlign: 'center' }}>
            No critical raw materials reclaimed in current batch.
          </p>
        ) : (
          critical.map(m => {
            const displayMass = m.massKg < 0.01 ? `${(m.massKg * 1000).toFixed(2)} g` : `${m.massKg.toFixed(3)} kg`;
            const pct = Math.min(100, Math.max(5, (m.massKg / maxMat) * 100));

            return (
              <motion.div
                key={m.name}
                whileHover={{ x: 4 }}
                style={{
                  padding: '12px 14px',
                  background: 'rgba(255,255,255,0.025)',
                  border: '1px solid rgba(255,255,255,0.06)',
                  borderRadius: '10px',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '6px'
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-primary)' }}>{m.name}</span>
                  <span style={{ fontSize: '0.88rem', fontWeight: 800, fontFamily: 'var(--font-mono)', color: '#fb923c' }}>{displayMass}</span>
                </div>
                <div style={{ height: '6px', background: 'rgba(255,255,255,0.06)', borderRadius: '3px', overflow: 'hidden' }}>
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${pct}%` }}
                    style={{ height: '100%', background: 'linear-gradient(90deg, #f97316 0%, #fb923c 100%)', borderRadius: '3px' }}
                  />
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                  <span>Avoided: <strong>{m.avoidedCo2eKg.toFixed(2)} kg CO₂e</strong></span>
                  <span style={{ color: '#fb923c', fontWeight: 600 }}>High Conservation Priority</span>
                </div>
              </motion.div>
            );
          })
        )}
      </div>

      {/* Bulk & Engineering Materials Stream */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '8px 12px', background: 'rgba(52, 211, 153, 0.08)', borderRadius: '8px', border: '1px solid rgba(52, 211, 153, 0.25)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <CheckCircle2 size={15} color="#34d399" />
            <span style={{ fontSize: '0.82rem', fontWeight: 700, color: '#34d399' }}>Bulk &amp; Structural Materials</span>
          </div>
          <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>{regular.length} fractions</span>
        </div>

        {regular.length === 0 ? (
          <p style={{ color: 'var(--text-muted)', fontSize: '0.82rem', padding: '16px', textAlign: 'center' }}>
            No bulk materials reclaimed in current batch.
          </p>
        ) : (
          regular.map(m => {
            const pct = Math.min(100, Math.max(5, (m.massKg / maxMat) * 100));

            return (
              <motion.div
                key={m.name}
                whileHover={{ x: 4 }}
                style={{
                  padding: '12px 14px',
                  background: 'rgba(255,255,255,0.025)',
                  border: '1px solid rgba(255,255,255,0.06)',
                  borderRadius: '10px',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '6px'
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-primary)' }}>{m.name}</span>
                  <span style={{ fontSize: '0.88rem', fontWeight: 800, fontFamily: 'var(--font-mono)', color: '#34d399' }}>{m.massKg.toFixed(2)} kg</span>
                </div>
                <div style={{ height: '6px', background: 'rgba(255,255,255,0.06)', borderRadius: '3px', overflow: 'hidden' }}>
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${pct}%` }}
                    style={{ height: '100%', background: 'linear-gradient(90deg, #10b981 0%, #34d399 100%)', borderRadius: '3px' }}
                  />
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                  <span>Avoided: <strong>{m.avoidedCo2eKg.toFixed(2)} kg CO₂e</strong></span>
                  <span style={{ color: '#34d399', fontWeight: 600 }}>Secondary Smelting Flow</span>
                </div>
              </motion.div>
            );
          })
        )}
      </div>
    </div>
  );
}

// ==========================================
// 5. Environmental Equivalence Cards
// ==========================================
function CarbonEquivalencies({ avoidedCo2eKg }) {
  const co2 = Number(avoidedCo2eKg || 0);

  // Benchmarks from US EPA Greenhouse Gas Equivalencies Calculator:
  // 1 kg CO2e ~= 4.1 passenger car km avoided
  // 1 urban tree seedling nurtured for 10 years ~= 21.7 kg CO2e
  // 1 kWh coal grid electricity in India ~= 0.82 kg CO2e
  const carKm = Math.round(co2 * 4.1);
  const treeSeedlings = (co2 / 21.7).toFixed(1);
  const electricityKwh = (co2 / 0.82).toFixed(1);

  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '14px' }}>
      <motion.div
        whileHover={{ y: -3 }}
        style={{
          padding: '16px',
          background: 'rgba(163, 230, 53, 0.07)',
          border: '1px solid rgba(163, 230, 53, 0.22)',
          borderRadius: '12px',
          display: 'flex',
          flexDirection: 'column',
          gap: '6px'
        }}
      >
        <span style={{ fontSize: '0.75rem', fontWeight: 700, color: '#a3e635', textTransform: 'uppercase' }}>Passenger Travel</span>
        <span style={{ fontSize: '1.5rem', fontWeight: 800, fontFamily: 'var(--font-mono)', color: 'var(--text-primary)' }}>
          ~{carKm.toLocaleString()} <small style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>km</small>
        </span>
        <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)', margin: 0 }}>
          Equivalent to averted gasoline automobile driving emissions.
        </p>
      </motion.div>

      <motion.div
        whileHover={{ y: -3 }}
        style={{
          padding: '16px',
          background: 'rgba(16, 185, 129, 0.07)',
          border: '1px solid rgba(16, 185, 129, 0.22)',
          borderRadius: '12px',
          display: 'flex',
          flexDirection: 'column',
          gap: '6px'
        }}
      >
        <span style={{ fontSize: '0.75rem', fontWeight: 700, color: '#10b981', textTransform: 'uppercase' }}>Tree Carbon Sequestration</span>
        <span style={{ fontSize: '1.5rem', fontWeight: 800, fontFamily: 'var(--font-mono)', color: 'var(--text-primary)' }}>
          ~{treeSeedlings} <small style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>trees</small>
        </span>
        <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)', margin: 0 }}>
          Equivalent carbon absorbed by tree seedlings grown over 10 years.
        </p>
      </motion.div>

      <motion.div
        whileHover={{ y: -3 }}
        style={{
          padding: '16px',
          background: 'rgba(56, 189, 248, 0.07)',
          border: '1px solid rgba(56, 189, 248, 0.22)',
          borderRadius: '12px',
          display: 'flex',
          flexDirection: 'column',
          gap: '6px'
        }}
      >
        <span style={{ fontSize: '0.75rem', fontWeight: 700, color: '#38bdf8', textTransform: 'uppercase' }}>Virgin Smelting Energy</span>
        <span style={{ fontSize: '1.5rem', fontWeight: 800, fontFamily: 'var(--font-mono)', color: 'var(--text-primary)' }}>
          ~{electricityKwh} <small style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>kWh</small>
        </span>
        <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)', margin: 0 }}>
          Direct mining and ore smelting electricity generation preserved.
        </p>
      </motion.div>
    </div>
  );
}

// ==========================================
// Main Dashboard Module Component
// ==========================================
export default function DashboardModule({ analytics: propAnalytics, onRefresh }) {
  const [analytics, setAnalytics] = useState(propAnalytics);
  const [submissions, setSubmissions] = useState([]);
  const [loading, setLoading] = useState(!propAnalytics);
  const [refreshing, setRefreshing] = useState(false);
  const [lastRefresh, setLastRefresh] = useState(new Date());
  const [selectedStatusFilter, setSelectedStatusFilter] = useState(null);

  useEffect(() => {
    if (propAnalytics) {
      setAnalytics(propAnalytics);
      setLoading(false);
    }
  }, [propAnalytics]);

  useEffect(() => {
    fetchSubmissions();
  }, []);

  const fetchSubmissions = async () => {
    try {
      const data = await api.submissions();
      setSubmissions(data.submissions || []);
    } catch { /* silent */ }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    try {
      const data = await api.analytics();
      setAnalytics(data);
      await fetchSubmissions();
      setLastRefresh(new Date());
      if (onRefresh) onRefresh();
    } catch (err) {
      console.error('Refresh error:', err);
    } finally {
      setRefreshing(false);
    }
  };

  if (loading) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '400px', gap: '12px', color: 'var(--text-secondary)' }}>
        <RefreshCw size={22} className="spin-slow" />
        <span style={{ fontSize: '1rem', fontWeight: 600 }}>Loading database analytics...</span>
      </div>
    );
  }

  const metrics = analytics?.metrics || {};
  const pipeline = analytics?.statusPipelineCount || {};
  const categories = analytics?.categoryBreakdown || [];
  const pathways = analytics?.pathwayBreakdown || [];
  const materials = analytics?.materialsRecovered || [];

  const statusColors = {
    'Registered': '#38bdf8',
    'Collected': '#10b981',
    'In Assessment': '#f59e0b',
    'Processing': '#8b5cf6',
    'Recovered': '#34d399'
  };

  // Filtered submissions if user clicked a stage in the waterfall
  const displayedSubmissions = selectedStatusFilter
    ? submissions.filter(s => s.status.toLowerCase() === selectedStatusFilter.toLowerCase())
    : submissions;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '28px' }}>

      {/* Header Bar */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '12px' }}>
        <div>
          <h1 style={{ fontSize: '1.8rem', fontWeight: 800, fontFamily: 'var(--font-heading)', margin: '0 0 4px', letterSpacing: '-0.03em' }}>
            Circular Management Analytics
          </h1>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.88rem', margin: 0 }}>
            Persistent operational metrics &amp; scientific secondary recovery yields
          </p>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
            Synced: {lastRefresh.toLocaleTimeString()}
          </span>
          <motion.button
            className="btn btn-secondary btn-sm"
            onClick={handleRefresh}
            disabled={refreshing}
            whileHover={{ scale: 1.03 }}
            whileTap={{ scale: 0.96 }}
            style={{ display: 'flex', alignItems: 'center', gap: '6px' }}
          >
            <RefreshCw size={14} style={{ animation: refreshing ? 'spinSlow 0.8s linear infinite' : 'none' }} />
            {refreshing ? 'Refreshing…' : 'Sync Live'}
          </motion.button>
        </div>
      </div>

      {/* Top 5 Key Metric Cards with Motion Hover */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(210px, 1fr))', gap: '16px' }}>
        <motion.div
          className="glass-panel"
          whileHover={{ y: -4, transition: { type: 'spring', stiffness: 350, damping: 25 } }}
          style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '10px' }}
        >
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Registered Intake</span>
            <div style={{ width: '36px', height: '36px', background: 'rgba(56, 189, 248, 0.15)', border: '1px solid rgba(56, 189, 248, 0.35)', borderRadius: '10px', display: 'grid', placeItems: 'center' }}>
              <Package size={18} color="#38bdf8" />
            </div>
          </div>
          <div>
            <span style={{ fontSize: '2.1rem', fontWeight: 800, fontFamily: 'var(--font-mono)', color: '#38bdf8' }}>
              {metrics.registered?.units || 0}
            </span>
            <span style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', marginLeft: '6px' }}>units</span>
          </div>
          <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)', margin: 0 }}>
            {metrics.registered?.massKg || 0} kg total declared mass
          </p>
        </motion.div>

        <motion.div
          className="glass-panel"
          whileHover={{ y: -4, transition: { type: 'spring', stiffness: 350, damping: 25 } }}
          style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '10px' }}
        >
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Physically Collected</span>
            <div style={{ width: '36px', height: '36px', background: 'rgba(16, 185, 129, 0.15)', border: '1px solid rgba(16, 185, 129, 0.35)', borderRadius: '10px', display: 'grid', placeItems: 'center' }}>
              <Truck size={18} color="#10b981" />
            </div>
          </div>
          <div>
            <span style={{ fontSize: '2.1rem', fontWeight: 800, fontFamily: 'var(--font-mono)', color: '#10b981' }}>
              {metrics.collected?.units || 0}
            </span>
            <span style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', marginLeft: '6px' }}>units</span>
          </div>
          <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)', margin: 0 }}>
            {metrics.collected?.massKg || 0} kg custody secured ({metrics.collectionRatePercent || 0}% rate)
          </p>
        </motion.div>

        <motion.div
          className="glass-panel"
          whileHover={{ y: -4, transition: { type: 'spring', stiffness: 350, damping: 25 } }}
          style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '10px' }}
        >
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em' }}>In Active Processing</span>
            <div style={{ width: '36px', height: '36px', background: 'rgba(139, 92, 246, 0.15)', border: '1px solid rgba(139, 92, 246, 0.35)', borderRadius: '10px', display: 'grid', placeItems: 'center' }}>
              <Factory size={18} color="#8b5cf6" />
            </div>
          </div>
          <div>
            <span style={{ fontSize: '2.1rem', fontWeight: 800, fontFamily: 'var(--font-mono)', color: '#8b5cf6' }}>
              {metrics.processed?.units || 0}
            </span>
            <span style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', marginLeft: '6px' }}>units</span>
          </div>
          <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)', margin: 0 }}>
            {metrics.processed?.massKg || 0} kg in dismantling / smelting stream
          </p>
        </motion.div>

        <motion.div
          className="glass-panel"
          whileHover={{ y: -4, transition: { type: 'spring', stiffness: 350, damping: 25 } }}
          style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '10px' }}
        >
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Material Recovered</span>
            <div style={{ width: '36px', height: '36px', background: 'rgba(52, 211, 153, 0.15)', border: '1px solid rgba(52, 211, 153, 0.35)', borderRadius: '10px', display: 'grid', placeItems: 'center' }}>
              <Layers size={18} color="#34d399" />
            </div>
          </div>
          <div>
            <span style={{ fontSize: '2.1rem', fontWeight: 800, fontFamily: 'var(--font-mono)', color: '#34d399' }}>
              {metrics.materialRecovered?.massKg || 0}
            </span>
            <span style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', marginLeft: '6px' }}>kg actual</span>
          </div>
          <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)', margin: 0 }}>
            of {metrics.materialRecovered?.potentialMassKg || 0} kg potential recoverable
          </p>
        </motion.div>

        <motion.div
          className="glass-panel"
          whileHover={{ y: -4, transition: { type: 'spring', stiffness: 350, damping: 25 } }}
          style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '10px' }}
        >
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Avoided CO₂e</span>
            <div style={{ width: '36px', height: '36px', background: 'rgba(163, 230, 53, 0.15)', border: '1px solid rgba(163, 230, 53, 0.35)', borderRadius: '10px', display: 'grid', placeItems: 'center' }}>
              <Leaf size={18} color="#a3e635" />
            </div>
          </div>
          <div>
            <span style={{ fontSize: '2.1rem', fontWeight: 800, fontFamily: 'var(--font-mono)', color: '#a3e635' }}>
              {metrics.avoidedCo2eKg || 0}
            </span>
            <span style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', marginLeft: '6px' }}>kg CO₂e</span>
          </div>
          <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)', margin: 0 }}>
            Per-material virgin substitution
          </p>
        </motion.div>
      </div>

      {/* Visual 1: Circular Pipeline Funnel / Flow Graph */}
      <div className="glass-panel" style={{ padding: '24px' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '18px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <Activity size={18} color="var(--accent-emerald-light)" />
            <div>
              <h2 style={{ fontSize: '1.05rem', fontWeight: 700, margin: 0 }}>Circular Pipeline — Stage Waterfall &amp; Conversion Flow</h2>
              <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)', margin: 0 }}>Click any stage card to filter the audit log below</p>
            </div>
          </div>
          {selectedStatusFilter && (
            <motion.button
              onClick={() => setSelectedStatusFilter(null)}
              className="btn btn-secondary btn-sm"
              whileHover={{ scale: 1.03 }}
              style={{ fontSize: '0.75rem', padding: '4px 10px' }}
            >
              Clear filter ({selectedStatusFilter})
            </motion.button>
          )}
        </div>
        <PipelineWaterfall
          pipeline={pipeline}
          metrics={metrics}
          selectedStatus={selectedStatusFilter}
          onSelectStatus={setSelectedStatusFilter}
        />
      </div>

      {/* Visual 2 & 3: Two-Column Graphs (Category Intake Multi-Bar + Pathway Donut) */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))', gap: '20px' }}>

        {/* Graph A: Device Category Intake Multi-Bar Graph */}
        <div className="glass-panel" style={{ padding: '24px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '16px' }}>
            <BarChart3 size={18} color="#38bdf8" />
            <h2 style={{ fontSize: '1.02rem', fontWeight: 700, margin: 0 }}>E-Waste Intake by Category</h2>
          </div>
          {categories.length === 0 ? (
            <p style={{ color: 'var(--text-muted)', fontSize: '0.88rem' }}>No category records logged yet.</p>
          ) : (
            <CategoryColumnChart categories={categories} />
          )}
        </div>

        {/* Graph B: Circular Pathway Donut Chart */}
        <div className="glass-panel" style={{ padding: '24px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '16px' }}>
            <PieChartIcon size={18} color="#8b5cf6" />
            <h2 style={{ fontSize: '1.02rem', fontWeight: 700, margin: 0 }}>Circular Retention Pathways Distribution</h2>
          </div>
          {pathways.length === 0 ? (
            <p style={{ color: 'var(--text-muted)', fontSize: '0.88rem' }}>No pathway records logged yet.</p>
          ) : (
            <CircularPathwayDonut
              pathways={pathways}
              totalUnits={metrics.registered?.units || 0}
            />
          )}
        </div>
      </div>

      {/* Visual 4: Secondary Material Recovery Stream & Yield Matrix */}
      <div className="glass-panel" style={{ padding: '24px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '6px' }}>
          <FlaskConical size={18} color="#34d399" />
          <h2 style={{ fontSize: '1.05rem', fontWeight: 700, margin: 0 }}>Secondary Material Recovery Yields</h2>
        </div>
        <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)', marginBottom: '20px' }}>
          Separates <strong>Potential Secondary Mass</strong> from <strong>Actual Recovered Mass</strong> from equipment in Processing or Recovered states.
        </p>

        {materials.length === 0 ? (
          <div style={{ padding: '28px', textAlign: 'center', background: 'rgba(255,255,255,0.02)', borderRadius: '10px', border: '1px dashed var(--border-subtle)', color: 'var(--text-muted)' }}>
            No materials recovered yet. Transition items to <strong>Processing</strong> or <strong>Recovered</strong> status to trigger physical recovery yields.
          </div>
        ) : (
          <MaterialRecoveryMatrix materials={materials} />
        )}
      </div>

      {/* Visual 5: Environmental Avoidance & Resource Equivalencies */}
      <div className="glass-panel" style={{ padding: '24px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '14px' }}>
          <Sparkles size={18} color="#a3e635" />
          <h2 style={{ fontSize: '1.05rem', fontWeight: 700, margin: 0 }}>Emissions Averted &amp; Environmental Impact Equivalence</h2>
        </div>
        <CarbonEquivalencies avoidedCo2eKg={metrics.avoidedCo2eKg || 0} />
      </div>

      {/* Submissions Audit Log Table */}
      <div className="glass-panel" style={{ padding: '24px' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '18px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <Clock size={17} color="#f59e0b" />
            <h2 style={{ fontSize: '1.05rem', fontWeight: 700, margin: 0 }}>
              {selectedStatusFilter ? `Submissions: ${selectedStatusFilter} Status` : 'Recent Submissions Audit Ledger'}
            </h2>
          </div>
          <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)', background: 'rgba(255,255,255,0.04)', padding: '4px 10px', borderRadius: 'var(--radius-full)', border: '1px solid var(--border-subtle)' }}>
            {displayedSubmissions.length} record{displayedSubmissions.length === 1 ? '' : 's'}
          </span>
        </div>

        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.85rem' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid var(--border-subtle)' }}>
                {['Tracking Code', 'Category', 'Brand / Model', 'Mass (kg)', 'Condition', 'Status', 'Recommended Pathway', 'Registered'].map(h => (
                  <th key={h} style={{
                    padding: '8px 12px',
                    textAlign: 'left',
                    color: 'var(--text-muted)',
                    fontWeight: 600,
                    fontSize: '0.75rem',
                    textTransform: 'uppercase',
                    letterSpacing: '0.04em',
                    whiteSpace: 'nowrap'
                  }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {displayedSubmissions.slice(0, 15).map((sub, i) => {
                const statusColor = statusColors[sub.status] || '#94a3b8';
                return (
                  <motion.tr
                    key={sub.id}
                    whileHover={{ backgroundColor: 'rgba(255,255,255,0.03)' }}
                    style={{
                      borderBottom: '1px solid rgba(255,255,255,0.04)',
                      backgroundColor: i % 2 === 0 ? 'transparent' : 'rgba(255,255,255,0.015)'
                    }}
                  >
                    <td style={{ padding: '10px 12px' }}>
                      <span style={{
                        fontFamily: 'var(--font-mono)',
                        fontSize: '0.82rem',
                        color: 'var(--accent-emerald-light)',
                        fontWeight: 600
                      }}>{sub.trackingCode}</span>
                    </td>
                    <td style={{ padding: '10px 12px', color: 'var(--text-secondary)' }}>{sub.categoryName}</td>
                    <td style={{ padding: '10px 12px', color: 'var(--text-primary)' }}>
                      {sub.brand} {sub.model !== 'Standard Model' ? sub.model : ''}
                    </td>
                    <td style={{ padding: '10px 12px', fontFamily: 'var(--font-mono)', color: 'var(--text-secondary)' }}>
                      {sub.totalMassKg?.toFixed(2)}
                    </td>
                    <td style={{ padding: '10px 12px', color: 'var(--text-muted)', fontSize: '0.8rem' }}>{sub.condition}</td>
                    <td style={{ padding: '10px 12px' }}>
                      <span style={{
                        display: 'inline-flex', alignItems: 'center', gap: '5px',
                        padding: '3px 8px',
                        borderRadius: 'var(--radius-full)',
                        fontSize: '0.73rem',
                        fontWeight: 700,
                        background: `${statusColor}18`,
                        color: statusColor,
                        border: `1px solid ${statusColor}35`
                      }}>
                        {sub.status}
                      </span>
                    </td>
                    <td style={{ padding: '10px 12px', color: 'var(--text-muted)', fontSize: '0.8rem', maxWidth: '200px' }}>
                      {sub.recommendedPathway?.split(' /')[0] || '—'}
                    </td>
                    <td style={{ padding: '10px 12px', color: 'var(--text-muted)', fontSize: '0.78rem', whiteSpace: 'nowrap' }}>
                      {new Date(sub.registeredAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: '2-digit' })}
                    </td>
                  </motion.tr>
                );
              })}
            </tbody>
          </table>
        </div>

        <div style={{ marginTop: '16px', padding: '10px 14px', background: 'rgba(255,255,255,0.02)', borderRadius: 'var(--radius-sm)', fontSize: '0.78rem', color: 'var(--text-muted)' }}>
          {analytics?.methodologyNotes}
        </div>
      </div>
    </div>
  );
}
