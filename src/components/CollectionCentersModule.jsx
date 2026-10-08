import React, { useState, useEffect } from 'react';
import { api } from '../api';
import {
  MapPin, Phone, Clock, CheckCircle2, ShieldCheck,
  Search, Filter, ExternalLink, AlertTriangle, Building2,
  Truck, Package, RefreshCw
} from 'lucide-react';

function CenterCard({ center, isSelected, onSelect }) {
  const [expanded, setExpanded] = useState(false);

  return (
    <div
      className="glass-panel"
      style={{
        padding: '20px',
        border: isSelected ? '1px solid rgba(16,185,129,0.5)' : '1px solid var(--border-subtle)',
        boxShadow: isSelected ? '0 0 20px rgba(16,185,129,0.12)' : undefined,
        cursor: 'pointer',
        transition: 'all 0.2s ease',
      }}
      onClick={() => setExpanded(!expanded)}
    >
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '12px' }}>
        <div style={{ flex: 1 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px', flexWrap: 'wrap' }}>
            <h3 style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--text-primary)' }}>{center.name}</h3>
            {center.isActive && (
              <span style={{
                display: 'inline-flex', alignItems: 'center', gap: '4px',
                padding: '2px 8px', borderRadius: 'var(--radius-full)',
                fontSize: '0.7rem', fontWeight: 700,
                background: 'rgba(16,185,129,0.15)', color: '#34d399',
                border: '1px solid rgba(16,185,129,0.3)'
              }}>
                <span style={{ width: '5px', height: '5px', borderRadius: '50%', background: '#10b981', display: 'inline-block' }} />
                Active
              </span>
            )}
            {center.cpcbRegistrationNo && (
              <span style={{
                padding: '2px 8px', borderRadius: 'var(--radius-full)',
                fontSize: '0.68rem', fontWeight: 600,
                background: 'rgba(56,189,248,0.1)', color: '#38bdf8',
                border: '1px solid rgba(56,189,248,0.25)'
              }}>
                CPCB Authorized
              </span>
            )}
          </div>
          <p style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', marginBottom: '8px' }}>{center.operator}</p>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--text-muted)', fontSize: '0.82rem' }}>
            <MapPin size={13} />
            <span>{center.address}, {center.city} — {center.pincode}</span>
          </div>
        </div>
        <div style={{ textAlign: 'right', flexShrink: 0 }}>
          <div style={{
            fontSize: '1.1rem', fontWeight: 800, fontFamily: 'var(--font-mono)',
            color: '#10b981'
          }}>{center.distanceKm || '—'} km</div>
          <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>approx. distance</div>
        </div>
      </div>

      {/* Quick info row */}
      <div style={{
        display: 'flex', gap: '16px', flexWrap: 'wrap',
        marginTop: '14px', paddingTop: '14px',
        borderTop: '1px solid var(--border-subtle)',
        fontSize: '0.8rem', color: 'var(--text-secondary)'
      }}>
        {center.phone && (
          <span style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
            <Phone size={12} /> {center.phone}
          </span>
        )}
        {center.operatingHours && (
          <span style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
            <Clock size={12} /> {center.operatingHours}
          </span>
        )}
        {center.capacity && (
          <span style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
            <Package size={12} /> {center.capacity} capacity
          </span>
        )}
        {center.pickupAvailable && (
          <span style={{ display: 'flex', alignItems: 'center', gap: '5px', color: '#10b981' }}>
            <Truck size={12} /> Pickup available
          </span>
        )}
      </div>

      {/* Accepted categories */}
      {center.acceptedCategories && (
        <div style={{ marginTop: '12px', display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
          {center.acceptedCategories.map(cat => (
            <span key={cat} style={{
              padding: '2px 8px', borderRadius: 'var(--radius-full)',
              fontSize: '0.72rem', fontWeight: 600,
              background: 'rgba(139,92,246,0.1)', color: '#c084fc',
              border: '1px solid rgba(139,92,246,0.2)'
            }}>{cat}</span>
          ))}
        </div>
      )}

      {/* Expanded details */}
      {expanded && (
        <div style={{
          marginTop: '16px', paddingTop: '16px',
          borderTop: '1px solid var(--border-subtle)',
          display: 'flex', flexDirection: 'column', gap: '10px'
        }}>
          {center.cpcbRegistrationNo && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.82rem' }}>
              <ShieldCheck size={14} color="#38bdf8" />
              <span style={{ color: 'var(--text-muted)' }}>CPCB Reg. No:</span>
              <span style={{ fontFamily: 'var(--font-mono)', color: '#38bdf8', fontSize: '0.8rem' }}>
                {center.cpcbRegistrationNo}
              </span>
            </div>
          )}
          {center.services && (
            <div style={{ fontSize: '0.82rem', color: 'var(--text-secondary)' }}>
              <strong style={{ color: 'var(--text-secondary)' }}>Services: </strong>
              {center.services.join(', ')}
            </div>
          )}
          {center.notes && (
            <div style={{
              padding: '10px 14px',
              background: 'rgba(245,158,11,0.07)',
              border: '1px solid rgba(245,158,11,0.2)',
              borderRadius: 'var(--radius-sm)',
              fontSize: '0.8rem', color: '#fbbf24'
            }}>
              <AlertTriangle size={12} style={{ display: 'inline', marginRight: '6px' }} />
              {center.notes}
            </div>
          )}
          <button
            className="btn btn-outline-emerald btn-sm"
            style={{ alignSelf: 'flex-start', marginTop: '4px' }}
            onClick={e => { e.stopPropagation(); onSelect && onSelect(center.id); }}
          >
            Select This Center
          </button>
        </div>
      )}
    </div>
  );
}

export default function CollectionCentersModule() {
  const [centers, setCenters] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [cityFilter, setCityFilter] = useState('');
  const [selectedId, setSelectedId] = useState(null);
  const [cities, setCities] = useState([]);

  useEffect(() => {
    fetchCenters();
  }, []);

  const fetchCenters = async (params = {}) => {
    setLoading(true);
    try {
      const data = await api.centers(params);
      setCenters(data.centers || []);
      const uniqueCities = [...new Set((data.centers || []).map(c => c.city))];
      setCities(uniqueCities);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = () => {
    const params = {};
    if (search.trim()) params.search = search.trim();
    if (cityFilter) params.city = cityFilter;
    fetchCenters(params);
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter') handleSearch();
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '28px' }}>
      {/* Header */}
      <div>
        <h1 style={{ fontSize: '1.7rem', fontWeight: 800, fontFamily: 'var(--font-heading)', marginBottom: '6px' }}>
          Authorized Collection Centers
        </h1>
        <p style={{ color: 'var(--text-muted)', fontSize: '0.88rem' }}>
          CPCB-registered and EcoLoop-authorized e-waste drop-off and pickup facilities.
          All centers comply with E-Waste (Management) Rules 2022.
        </p>
      </div>

      {/* CPCB Compliance Banner */}
      <div style={{
        padding: '14px 18px',
        background: 'rgba(56,189,248,0.07)',
        border: '1px solid rgba(56,189,248,0.2)',
        borderRadius: 'var(--radius-md)',
        display: 'flex', alignItems: 'center', gap: '12px',
        fontSize: '0.85rem'
      }}>
        <ShieldCheck size={18} color="#38bdf8" style={{ flexShrink: 0 }} />
        <div>
          <strong style={{ color: '#38bdf8' }}>All listed centers are CPCB-authorized.</strong>
          {' '}Under E-Waste Rules 2022, producers and collection points must maintain EPR compliance.
          Never dispose of e-waste through informal channels — hazardous fractions (Pb, Hg, Cd, BFRs) require certified handling.
        </div>
      </div>

      {/* Search & Filter */}
      <div style={{
        display: 'flex', gap: '12px', flexWrap: 'wrap', alignItems: 'center',
        padding: '18px',
        background: 'rgba(255,255,255,0.03)',
        border: '1px solid var(--border-subtle)',
        borderRadius: 'var(--radius-md)'
      }}>
        <div style={{ flex: 1, minWidth: '200px', position: 'relative' }}>
          <Search size={15} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
          <input
            className="form-input"
            style={{ width: '100%', paddingLeft: '36px' }}
            placeholder="Search by name, address, or pincode…"
            value={search}
            onChange={e => setSearch(e.target.value)}
            onKeyDown={handleKeyDown}
          />
        </div>
        <select
          className="form-select"
          style={{ minWidth: '160px' }}
          value={cityFilter}
          onChange={e => setCityFilter(e.target.value)}
        >
          <option value="">All Cities</option>
          {cities.map(c => <option key={c} value={c}>{c}</option>)}
        </select>
        <button className="btn btn-primary btn-sm" onClick={handleSearch} style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <Filter size={14} />
          Filter
        </button>
        <button className="btn btn-secondary btn-sm" onClick={() => { setSearch(''); setCityFilter(''); fetchCenters(); }}>
          Clear
        </button>
      </div>

      {/* Results */}
      {loading ? (
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', color: 'var(--text-muted)', padding: '40px 0' }}>
          <RefreshCw size={16} className="pulse-indicator" />
          Loading collection centers…
        </div>
      ) : centers.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '40px', color: 'var(--text-muted)' }}>
          <Building2 size={40} style={{ margin: '0 auto 12px', opacity: 0.3 }} />
          <p>No centers match your search. Try clearing filters.</p>
        </div>
      ) : (
        <div>
          <div style={{ fontSize: '0.83rem', color: 'var(--text-muted)', marginBottom: '14px' }}>
            Showing {centers.length} authorized center{centers.length !== 1 ? 's' : ''}
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            {centers.map(c => (
              <CenterCard
                key={c.id}
                center={c}
                isSelected={selectedId === c.id}
                onSelect={setSelectedId}
              />
            ))}
          </div>
        </div>
      )}

      {/* Info Box */}
      <div className="glass-panel" style={{ padding: '20px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
          <AlertTriangle size={16} color="#f59e0b" />
          <h3 style={{ fontSize: '0.95rem', fontWeight: 700 }}>Why Not Informal Channels?</h3>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '12px', fontSize: '0.83rem', color: 'var(--text-secondary)' }}>
          {[
            ['Lead (Pb)', 'CRT monitors contain 1–4 kg Pb per unit. Informal burning releases toxic fumes.'],
            ['Mercury (Hg)', 'LCD backlights contain 3–5 mg Hg. Landfilling contaminates groundwater.'],
            ['Brominated Flame Retardants (BFRs)', 'PCBs in circuit boards form carcinogenic dioxins when burned informally.'],
            ['Cadmium (Cd)', 'Ni-Cd batteries release cadmium into soil; bioaccumulates in rice and vegetables.'],
          ].map(([mat, risk]) => (
            <div key={mat} style={{
              padding: '12px',
              background: 'rgba(244,63,94,0.06)',
              border: '1px solid rgba(244,63,94,0.15)',
              borderRadius: 'var(--radius-sm)'
            }}>
              <div style={{ fontWeight: 700, color: '#fb7185', marginBottom: '4px' }}>{mat}</div>
              <div style={{ fontSize: '0.79rem' }}>{risk}</div>
            </div>
          ))}
        </div>
        <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginTop: '12px' }}>
          Sources: UNITAR GEM 2024, WHO Environmental Health Criteria, CPCB Guidelines on E-Waste Handling.
        </p>
      </div>
    </div>
  );
}
