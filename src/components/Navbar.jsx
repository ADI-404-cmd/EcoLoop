import React from 'react';
import { motion } from 'motion/react';
import { Activity, ArrowUpRight, BookOpen, ChartNoAxesCombined, Compass, Cpu, FileText, GitBranch, MapPin, Plus, Recycle, Sparkles } from 'lucide-react';

const items = [
  { id: 'home', label: 'Overview', icon: Compass },
  { id: 'calculator', label: 'Impact studio', icon: Sparkles },
  { id: 'journey', label: 'Device journey', icon: GitBranch },
  { id: 'centers', label: 'Collection network', icon: MapPin },
  { id: 'dashboard', label: 'Analytics', icon: ChartNoAxesCombined },
  { id: 'knowledge', label: 'Field notes', icon: BookOpen },
  { id: 'references', label: 'Evidence library', icon: FileText },
];

export default function Navbar({ activeTab, setActiveTab, stats }) {
  return (
    <header className="site-header">
      <div className="header-main">
        <motion.button
          className="brand-lockup"
          onClick={() => setActiveTab('home')}
          aria-label="EcoLoop overview"
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
        >
          <span className="brand-mark">
            <Recycle size={22} />
          </span>
          <span className="brand-copy">
            <strong>ecoloop<span>.</span></strong>
            <small>From E-Waste to New Value.</small>
          </span>
        </motion.button>

        <nav className="primary-nav" aria-label="Main navigation" style={{ position: 'relative' }}>
          {items.map(({ id, label, icon: Icon }) => {
            const isActive = activeTab === id;
            return (
              <button
                key={id}
                className={`nav-link ${isActive ? 'is-active' : ''}`}
                aria-current={isActive ? 'page' : undefined}
                onClick={() => setActiveTab(id)}
                style={{ position: 'relative' }}
              >
                <Icon size={15} />
                <span>{label}</span>
                {isActive && (
                  <motion.div
                    layoutId="activeNavIndicator"
                    style={{
                      position: 'absolute',
                      bottom: 0,
                      left: '12px',
                      right: '12px',
                      height: '2px',
                      background: 'var(--accent-emerald-light)',
                      borderRadius: '4px',
                      boxShadow: '0 0 10px rgba(198, 243, 106, 0.7)'
                    }}
                    transition={{ type: 'spring', stiffness: 450, damping: 32 }}
                  />
                )}
              </button>
            );
          })}
        </nav>

        <motion.button
          className="header-cta"
          onClick={() => setActiveTab('register')}
          whileHover={{ scale: 1.04, y: -1 }}
          whileTap={{ scale: 0.96 }}
        >
          <Plus size={16} />
          <span>Register device</span>
          <ArrowUpRight size={14} />
        </motion.button>
      </div>

      <div className="header-sub">
        <div>
          <Activity size={13} />
          <span>Responsible electronics lifecycle</span>
          <i /> Evidence-led · Circular by design
        </div>
        <div className="header-live">
          <span className="state-dot" />
          {stats ? `${Number(stats.registered?.units || 0).toLocaleString()} units in the ledger` : 'Connecting to live ledger'}
        </div>
      </div>
    </header>
  );
}
