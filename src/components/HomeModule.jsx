import React from 'react';
import { motion } from 'motion/react';
import {
  ArrowDownRight, ArrowRight, ArrowUpRight, Box, Check, ChevronRight,
  CircleDot, Cpu, Factory, Leaf, MapPin, PackageCheck, Plus, Recycle,
  ScanLine, Sparkles, Truck, Waves
} from 'lucide-react';

const stages = [
  { icon: ScanLine, label: 'Register', detail: 'Record the device' },
  { icon: Truck, label: 'Collect', detail: 'Confirm custody' },
  { icon: Cpu, label: 'Assess', detail: 'Find the best route' },
  { icon: Recycle, label: 'Recover', detail: 'Return materials' },
];

const fmt = value => Number(value || 0).toLocaleString(undefined, { maximumFractionDigits: 2 });

function Metric({ label, value, unit, icon: Icon, tone, note }) {
  return (
    <motion.article
      className="metric-tile"
      whileHover={{ y: -5, transition: { type: 'spring', stiffness: 400, damping: 25 } }}
    >
      <div className={`metric-icon ${tone}`}><Icon size={18} /></div>
      <p>{label}</p>
      <div className="metric-number">{value}<small>{unit}</small></div>
      <span className="metric-note">{note}</span>
    </motion.article>
  );
}

export default function HomeModule({ stats, recentSubmissions = [], setActiveTab, onSelectDeviceForJourney, loading }) {
  const registered = stats?.registered;
  const collected = stats?.collected;
  const processed = stats?.processed;
  const recovery = stats?.materialRecovered;

  return (
    <div className="home-content">
      {/* Hero Panel with Motion Elements */}
      <motion.section
        className="hero-panel"
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
      >
        <div className="hero-copy">
          <span className="hero-kicker"><Sparkles size={14} /> MATERIALS, KEPT IN MOTION</span>
          <h2>Waste is a design<br />problem. <em>Let’s close<br />the loop.</em></h2>
          <p>EcoLoop brings device intake, evidence-backed assessment and responsible collection into one transparent journey.</p>
          <div className="hero-actions">
            <motion.button
              className="button button-accent"
              onClick={() => setActiveTab('register')}
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.97 }}
            >
              <Plus size={17} /> Register e-waste <ArrowRight size={16} />
            </motion.button>
            <motion.button
              className="button button-quiet"
              onClick={() => setActiveTab('calculator')}
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.97 }}
            >
              Explore material impact <ArrowUpRight size={16} />
            </motion.button>
          </div>
          <div className="hero-trust">
            <span><Check size={13} /> Backend-calculated results</span>
            <span><Check size={13} /> Traceable device status</span>
          </div>
        </div>

        <div className="hero-art" aria-label="Illustration of electronic components moving through a circular material loop" role="img">
          <div className="orbit orbit-outer" />
          <div className="orbit orbit-inner" />
          <div className="orbit-node node-one"><Cpu size={22} /></div>
          <div className="orbit-node node-two"><Recycle size={22} /></div>
          <div className="orbit-node node-three"><Leaf size={21} /></div>
          <div className="orbit-core"><Waves size={30} /><span>CIRCULAR<br />BY DESIGN</span></div>
          <div className="art-caption"><span className="state-dot" /> A better next life starts here</div>
        </div>
        <div className="hero-index">01 <span>/</span> 04</div>
      </motion.section>

      {/* Overview Section */}
      <section className="overview-section">
        <div className="section-heading">
          <div>
            <span className="eyebrow">THE MATERIAL LEDGER</span>
            <h2>Progress, with clear definitions.</h2>
            <p>Each measure reflects a different point in the operational chain.</p>
          </div>
          <button className="text-link" onClick={() => setActiveTab('dashboard')}>
            Open analytics <ArrowRight size={15} />
          </button>
        </div>

        <div className="metric-grid">
          <Metric label="Registered" value={registered ? fmt(registered.massKg) : '—'} unit="kg" icon={Box} tone="tone-blue" note={`${registered ? fmt(registered.units) : '—'} units logged`} />
          <Metric label="Collected" value={collected ? fmt(collected.massKg) : '—'} unit="kg" icon={PackageCheck} tone="tone-teal" note={`${collected ? fmt(collected.units) : '—'} units in custody`} />
          <Metric label="Processed" value={processed ? fmt(processed.massKg) : '—'} unit="kg" icon={Factory} tone="tone-violet" note={`${processed ? fmt(processed.units) : '—'} units in processing`} />
          <Metric label="Potential recovery" value={recovery ? fmt(recovery.potentialMassKg) : '—'} unit="kg" icon={Leaf} tone="tone-lime" note="Scientific estimate · not actual recovery" />
        </div>

        <div className="integrity-note">
          <CircleDot size={15} />
          <span><strong>Potential ≠ actual.</strong> Potential recovery is modelled from reference data. Material recovered is reported separately for the processed stream.</span>
          <button onClick={() => setActiveTab('dashboard')}>See definitions <ChevronRight size={14} /></button>
        </div>
      </section>

      {/* Lower Grid */}
      <section className="lower-grid">
        <div className="journey-card">
          <div className="section-heading compact">
            <div><span className="eyebrow">A DEVICE, IN MOTION</span><h2>From intake to new value</h2></div>
            <motion.button
              className="round-link"
              aria-label="Explore circular journey"
              onClick={() => setActiveTab('journey')}
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.95 }}
            >
              <ArrowUpRight size={17} />
            </motion.button>
          </div>
          <div className="journey-steps">
            {stages.map(({ icon: Icon, label, detail }, index) => (
              <div className="journey-step" key={label}>
                <div className="journey-symbol"><Icon size={18} /></div>
                <span className="step-count">0{index + 1}</span>
                <strong>{label}</strong>
                <small>{detail}</small>
                {index < stages.length - 1 && <ArrowRight className="step-arrow" size={15} />}
              </div>
            ))}
          </div>
          <button className="text-link journey-link" onClick={() => setActiveTab('journey')}>
            Explore the circular journey <ArrowRight size={15} />
          </button>
        </div>

        <div className="activity-card">
          <div className="section-heading compact">
            <div><span className="eyebrow">RECENT REGISTRATIONS</span><h2>Device activity</h2></div>
            <motion.button
              className="round-link"
              aria-label="Register a device"
              onClick={() => setActiveTab('register')}
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.95 }}
            >
              <Plus size={17} />
            </motion.button>
          </div>
          {loading && !recentSubmissions.length ? (
            <div className="empty-state">Loading registered devices…</div>
          ) : recentSubmissions.length ? (
            <div className="activity-list">
              {recentSubmissions.slice(0, 4).map((item, index) => (
                <motion.button
                  className="activity-row"
                  key={item.id || item.trackingCode || index}
                  onClick={() => onSelectDeviceForJourney(item.trackingCode)}
                  whileHover={{ x: 4, transition: { duration: 0.15 } }}
                >
                  <span className="activity-device">
                    <span className="device-glyph"><Cpu size={16} /></span>
                    <span>
                      <strong>{item.brand} {item.model}</strong>
                      <small>{item.categoryName} · {item.trackingCode}</small>
                    </span>
                  </span>
                  <span className={`status-pill status-${(item.status || 'registered').toLowerCase().replaceAll(' ', '-')}`}>
                    {item.status}
                  </span>
                  <ChevronRight size={15} className="activity-chevron" />
                </motion.button>
              ))}
            </div>
          ) : (
            <div className="empty-state">
              <span className="empty-icon"><PackageCheck size={20} /></span>
              <strong>Your traceable journey starts here.</strong>
              <span>Registered devices will appear in this activity feed.</span>
              <button className="text-link" onClick={() => setActiveTab('register')}>
                Register your first device <ArrowRight size={14} />
              </button>
            </div>
          )}
        </div>
      </section>

      {/* Closing Banner */}
      <section className="closing-banner">
        <div className="closing-icon"><MapPin size={19} /></div>
        <div>
          <span className="eyebrow">RESPONSIBLE HANDOFF</span>
          <h2>Ready to give a device a next chapter?</h2>
          <p>Find a collection point and understand what it accepts before you go.</p>
        </div>
        <motion.button
          className="button button-dark"
          onClick={() => setActiveTab('centers')}
          whileHover={{ scale: 1.03 }}
          whileTap={{ scale: 0.97 }}
        >
          Find a collection center <ArrowDownRight size={16} />
        </motion.button>
      </section>
    </div>
  );
}
