import React, { useState, useEffect } from 'react';
import { api } from '../api';
import {
  FileText, ExternalLink, Search, BookOpen, FlaskConical,
  Globe, Building2, RefreshCw, Tag, ChevronDown
} from 'lucide-react';

const TYPE_COLORS = {
  'Report': '#38bdf8',
  'Database': '#10b981',
  'Standard': '#f59e0b',
  'Peer-Reviewed Paper': '#8b5cf6',
  'Regulatory Document': '#f43f5e',
  'LCA Database': '#34d399',
  'Government Publication': '#fb923c',
};

const TYPE_ICONS = {
  'Report': Globe,
  'Database': FlaskConical,
  'Standard': Building2,
  'Peer-Reviewed Paper': BookOpen,
  'Regulatory Document': Building2,
  'LCA Database': FlaskConical,
  'Government Publication': FileText,
};

function RefCard({ ref: r }) {
  const [expanded, setExpanded] = useState(false);
  const color = TYPE_COLORS[r.type] || '#94a3b8';
  const Icon = TYPE_ICONS[r.type] || FileText;

  return (
    <div
      className="glass-panel"
      style={{ padding: '16px 20px', cursor: 'pointer' }}
      onClick={() => setExpanded(!expanded)}
    >
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: '14px' }}>
        {/* Icon */}
        <div style={{
          width: '38px', height: '38px',
          background: `${color}15`,
          border: `1px solid ${color}30`,
          borderRadius: '10px',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          flexShrink: 0,
          marginTop: '2px'
        }}>
          <Icon size={16} color={color} />
        </div>

        {/* Content */}
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap', marginBottom: '4px' }}>
            <span style={{
              padding: '2px 8px', borderRadius: 'var(--radius-full)',
              fontSize: '0.7rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.04em',
              background: `${color}15`, color: color, border: `1px solid ${color}30`
            }}>{r.type}</span>
            <span style={{
              padding: '2px 8px', borderRadius: 'var(--radius-full)',
              fontSize: '0.7rem', fontWeight: 600,
              background: 'rgba(255,255,255,0.05)', color: 'var(--text-muted)',
              border: '1px solid var(--border-subtle)'
            }}>{r.year}</span>
            {r.shortCode && (
              <span style={{
                fontFamily: 'var(--font-mono)', fontSize: '0.72rem',
                color: 'var(--accent-emerald-light)', fontWeight: 600
              }}>[{r.shortCode}]</span>
            )}
          </div>

          <h3 style={{ fontSize: '0.92rem', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '4px', lineHeight: 1.4 }}>
            {r.title}
          </h3>

          {r.authors && (
            <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginBottom: '4px' }}>
              {r.authors}
            </p>
          )}

          {r.publisher && (
            <p style={{ fontSize: '0.78rem', color: 'var(--text-secondary)' }}>
              {r.publisher}
            </p>
          )}
        </div>

        <ChevronDown
          size={16}
          color="var(--text-muted)"
          style={{ flexShrink: 0, marginTop: '4px', transform: expanded ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s' }}
        />
      </div>

      {expanded && (
        <div style={{
          marginTop: '14px', paddingTop: '14px',
          borderTop: '1px solid var(--border-subtle)',
          display: 'flex', flexDirection: 'column', gap: '10px',
          fontSize: '0.83rem'
        }}>
          {r.description && (
            <p style={{ color: 'var(--text-secondary)', lineHeight: 1.6 }}>{r.description}</p>
          )}
          {r.usedFor && (
            <div>
              <span style={{ color: 'var(--text-muted)', fontWeight: 600 }}>Used in EcoLoop for: </span>
              <span style={{ color: 'var(--text-secondary)' }}>{r.usedFor}</span>
            </div>
          )}
          {r.doi && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{ color: 'var(--text-muted)' }}>DOI:</span>
              <a
                href={`https://doi.org/${r.doi}`}
                target="_blank"
                rel="noopener noreferrer"
                style={{ color: '#38bdf8', fontFamily: 'var(--font-mono)', fontSize: '0.8rem', textDecoration: 'none' }}
                onClick={e => e.stopPropagation()}
              >
                {r.doi} <ExternalLink size={11} style={{ display: 'inline', marginLeft: '4px' }} />
              </a>
            </div>
          )}
          {r.url && !r.doi && (
            <a
              href={r.url}
              target="_blank"
              rel="noopener noreferrer"
              style={{ color: '#38bdf8', fontSize: '0.8rem', textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: '5px' }}
              onClick={e => e.stopPropagation()}
            >
              <ExternalLink size={13} />
              Access Full Document
            </a>
          )}
        </div>
      )}
    </div>
  );
}

export default function ReferencesModule() {
  const [references, setReferences] = useState([]);
  const [filtered, setFiltered] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState('');
  const [types, setTypes] = useState([]);

  useEffect(() => {
    fetchReferences();
  }, []);

  const fetchReferences = async () => {
    setLoading(true);
    try {
      const data = await api.references();
      setReferences(data.references || []);
      setFiltered(data.references || []);
      const uniqueTypes = [...new Set((data.references || []).map(r => r.type).filter(Boolean))];
      setTypes(uniqueTypes);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    let list = [...references];
    if (typeFilter) list = list.filter(r => r.type === typeFilter);
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter(r =>
        r.title?.toLowerCase().includes(q) ||
        r.authors?.toLowerCase().includes(q) ||
        r.publisher?.toLowerCase().includes(q) ||
        r.shortCode?.toLowerCase().includes(q)
      );
    }
    setFiltered(list);
  }, [search, typeFilter, references]);

  // Methodology explanation boxes
  const methodologyNotes = [
    {
      title: 'Weight Resolution Hierarchy',
      color: '#38bdf8',
      text: 'EcoLoop resolves device mass through a 4-level fallback: (1) Exact manufacturer model specification from environmental disclosure, (2) Brand/series average, (3) Category empirical benchmark (UNITAR GEM 2024), (4) User-reported weight. Confidence tiers (High / Medium / Low) are assigned accordingly.'
    },
    {
      title: 'Avoided CO₂e Calculation',
      color: '#34d399',
      text: 'EcoLoop does NOT apply a generic "1 kg e-waste = X kg CO₂" factor. Avoided GHG impacts are derived by summing per-material substitution: Avoided CO₂e = Σ (Recovered Mass_i × (Primary EF_i − Secondary EF_i)). Primary EFs from Ecoinvent 3.8; secondary EFs from Umicore, EU JRC, US EPA WARM v15.'
    },
    {
      title: 'Material Recovery Yields',
      color: '#8b5cf6',
      text: 'Metallurgical recovery efficiencies are taken from EU JRC ProSUM (2018) and UNEP (2013). They represent state-of-the-art hydrometallurgical + pyrometallurgical smelter efficiencies, not generic shredder estimates. The values distinguish between material present, potentially recoverable, and actually recovered.'
    },
    {
      title: 'Circular Pathway Recommendation',
      color: '#f59e0b',
      text: 'Pathway recommendations are based on product age × condition matrix from UNEP GEM 2024 lifespan statistics (median laptop: 6 yr, smartphone: 3 yr, etc.) and the EU Circular Economy Action Plan hierarchy. EcoLoop maximizes circular retention score by preferring reuse/repair over recycling wherever technically defensible.'
    }
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '28px' }}>
      {/* Header */}
      <div>
        <h1 style={{ fontSize: '1.7rem', fontWeight: 800, fontFamily: 'var(--font-heading)', marginBottom: '6px' }}>
          Scientific Sources & Methodology
        </h1>
        <p style={{ color: 'var(--text-muted)', fontSize: '0.88rem' }}>
          Every calculation, threshold, and material factor in EcoLoop is traceable to peer-reviewed literature,
          international standards, or certified databases. No arbitrary constants.
        </p>
      </div>

      {/* Methodology Notes */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '14px' }}>
        {methodologyNotes.map(m => (
          <div key={m.title} style={{
            padding: '16px 18px',
            background: `${m.color}09`,
            border: `1px solid ${m.color}25`,
            borderRadius: 'var(--radius-md)'
          }}>
            <div style={{ fontWeight: 700, color: m.color, marginBottom: '8px', fontSize: '0.9rem' }}>{m.title}</div>
            <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', lineHeight: 1.65 }}>{m.text}</div>
          </div>
        ))}
      </div>

      {/* Search & Filter */}
      <div style={{
        display: 'flex', gap: '12px', flexWrap: 'wrap', alignItems: 'center',
        padding: '16px 18px',
        background: 'rgba(255,255,255,0.03)',
        border: '1px solid var(--border-subtle)',
        borderRadius: 'var(--radius-md)'
      }}>
        <div style={{ flex: 1, minWidth: '200px', position: 'relative' }}>
          <Search size={14} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
          <input
            className="form-input"
            style={{ width: '100%', paddingLeft: '36px' }}
            placeholder="Search references…"
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>
        <select
          className="form-select"
          value={typeFilter}
          onChange={e => setTypeFilter(e.target.value)}
          style={{ minWidth: '200px' }}
        >
          <option value="">All Types</option>
          {types.map(t => <option key={t} value={t}>{t}</option>)}
        </select>
        {(search || typeFilter) && (
          <button className="btn btn-secondary btn-sm" onClick={() => { setSearch(''); setTypeFilter(''); }}>
            Clear
          </button>
        )}
        <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginLeft: 'auto' }}>
          {filtered.length} source{filtered.length !== 1 ? 's' : ''}
        </span>
      </div>

      {/* Reference Cards */}
      {loading ? (
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', color: 'var(--text-muted)', padding: '32px 0' }}>
          <RefreshCw size={16} className="pulse-indicator" />
          Loading references…
        </div>
      ) : filtered.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '40px', color: 'var(--text-muted)' }}>
          <BookOpen size={36} style={{ margin: '0 auto 12px', opacity: 0.3 }} />
          <p>No references match your search.</p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          {filtered.map(r => <RefCard key={r.id} ref={r} />)}
        </div>
      )}

      {/* Citation format */}
      <div style={{
        padding: '16px 20px',
        background: 'rgba(255,255,255,0.02)',
        border: '1px solid var(--border-subtle)',
        borderRadius: 'var(--radius-md)',
        fontSize: '0.8rem', color: 'var(--text-muted)'
      }}>
        <strong style={{ color: 'var(--text-secondary)' }}>Citation format:</strong> EcoLoop uses [Short Code (Year)] notation in calculation outputs.
        Each material recovery factor and CO₂e avoided figure links to the specific paper or database entry from which the number was derived.
        Click any reference above to see its DOI or access link.
      </div>
    </div>
  );
}
