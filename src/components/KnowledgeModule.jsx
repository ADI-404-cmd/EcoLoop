import React, { useState } from 'react';
import {
  BookOpen, Globe, IndianRupee, AlertTriangle, Recycle,
  TrendingUp, ShieldCheck, Cpu, Zap, Leaf, ChevronDown, ChevronRight,
  ExternalLink, Info
} from 'lucide-react';

function Section({ title, icon: Icon, color, children, defaultOpen = false }) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div className="glass-panel" style={{ overflow: 'hidden' }}>
      <button
        onClick={() => setOpen(!open)}
        style={{
          width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          padding: '20px 24px', background: 'none', border: 'none', cursor: 'pointer',
          color: 'var(--text-primary)', textAlign: 'left'
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div style={{
            width: '38px', height: '38px',
            background: `${color}18`,
            border: `1px solid ${color}35`,
            borderRadius: '10px',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            flexShrink: 0
          }}>
            <Icon size={18} color={color} />
          </div>
          <h2 style={{ fontSize: '1.05rem', fontWeight: 700, fontFamily: 'var(--font-heading)' }}>{title}</h2>
        </div>
        {open ? <ChevronDown size={18} color="var(--text-muted)" /> : <ChevronRight size={18} color="var(--text-muted)" />}
      </button>
      {open && (
        <div style={{ padding: '0 24px 24px', borderTop: '1px solid var(--border-subtle)' }}>
          {children}
        </div>
      )}
    </div>
  );
}

function StatBox({ label, value, unit, note, color = '#10b981' }) {
  return (
    <div style={{
      padding: '16px',
      background: `${color}0d`,
      border: `1px solid ${color}25`,
      borderRadius: 'var(--radius-md)',
      display: 'flex', flexDirection: 'column', gap: '4px'
    }}>
      <div style={{ fontSize: '1.5rem', fontWeight: 800, fontFamily: 'var(--font-mono)', color: color }}>
        {value}<span style={{ fontSize: '0.85rem', fontWeight: 500 }}>{unit}</span>
      </div>
      <div style={{ fontSize: '0.82rem', fontWeight: 600, color: 'var(--text-secondary)' }}>{label}</div>
      {note && <div style={{ fontSize: '0.74rem', color: 'var(--text-muted)' }}>{note}</div>}
    </div>
  );
}

export default function KnowledgeModule({ setActiveTab }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      {/* Header */}
      <div>
        <h1 style={{ fontSize: '1.7rem', fontWeight: 800, fontFamily: 'var(--font-heading)', marginBottom: '6px' }}>
          Knowledge Hub & EPR Framework
        </h1>
        <p style={{ color: 'var(--text-muted)', fontSize: '0.88rem' }}>
          Global and Indian e-waste statistics, hazardous materials, circular economy principles, and Extended Producer Responsibility.
        </p>
      </div>

      {/* Global E-Waste Crisis */}
      <Section title="Global E-Waste Crisis — Scale & Trends" icon={Globe} color="#38bdf8" defaultOpen>
        <div style={{ marginTop: '16px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: '12px' }}>
            <StatBox label="Global E-Waste Generated (2022)" value="62" unit=" Mt" note="UNITAR GEM 2024" color="#38bdf8" />
            <StatBox label="Formally Recycled" value="22.3" unit="%" note="of total generated" color="#10b981" />
            <StatBox label="Annual Growth Rate" value="2.6" unit=" Mt/yr" note="Fastest growing waste stream" color="#f59e0b" />
            <StatBox label="Economic Value at Risk" value="$62.5" unit="B" note="Secondary materials in unrecycled waste" color="#8b5cf6" />
          </div>
          <div style={{ padding: '14px 18px', background: 'rgba(244,63,94,0.08)', border: '1px solid rgba(244,63,94,0.2)', borderRadius: 'var(--radius-sm)', fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
            <strong style={{ color: '#fb7185' }}>77.6 Mt</strong> of e-waste will be generated annually by 2030 (GEM 2024 projection).
            Despite this, only about <strong style={{ color: '#fb7185' }}>22%</strong> is formally documented as properly collected and recycled.
            The remainder is often landfilled, informally processed, or traded across borders — releasing hazardous substances into soil, water, and air.
          </div>
          <div style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>
            Source: Baldé et al. (2024). <em>The Global E-waste Monitor 2024.</em> UNITAR / ITU / WHO.
          </div>
        </div>
      </Section>

      {/* India E-Waste */}
      <Section title="India E-Waste Scenario" icon={IndianRupee} color="#f59e0b">
        <div style={{ marginTop: '16px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: '12px' }}>
            <StatBox label="India E-Waste (2022)" value="1.6" unit=" Mt" note="3rd largest globally" color="#f59e0b" />
            <StatBox label="Informal Sector Handle" value="~90" unit="%" note="of India's e-waste" color="#f43f5e" />
            <StatBox label="CPCB Registered Recyclers" value="600+" unit="" note="as of 2024" color="#10b981" />
            <StatBox label="EPR Authorization" value="Mandatory" unit="" note="for all producers since 2022" color="#38bdf8" />
          </div>
          <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', lineHeight: 1.7 }}>
            <p>India is among the top 5 e-waste generators globally. Major challenges include:</p>
            <ul style={{ paddingLeft: '20px', marginTop: '8px', display: 'flex', flexDirection: 'column', gap: '4px' }}>
              <li>Informal dismantlers in urban areas (Delhi, Mumbai, Bengaluru) using acid baths and open burning</li>
              <li>Low consumer awareness about formal channels</li>
              <li>Limited collection infrastructure in Tier-2/3 cities</li>
              <li>Lack of standardized data reporting by producers</li>
            </ul>
          </div>
        </div>
      </Section>

      {/* E-Waste (Management) Rules 2022 */}
      <Section title="E-Waste (Management) Rules 2022 — India" icon={ShieldCheck} color="#10b981">
        <div style={{ marginTop: '16px', display: 'flex', flexDirection: 'column', gap: '14px', fontSize: '0.85rem', color: 'var(--text-secondary)', lineHeight: 1.7 }}>
          <p>
            Notified by MoEF&CC, effective from 1 April 2023. Key provisions:
          </p>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '12px' }}>
            {[
              ['Extended Producer Responsibility (EPR)', 'Producers, importers, and brand owners must ensure collection and channelization of e-waste equivalent to a mandated percentage of goods sold. EPR certificates are tradeable.'],
              ['Collection Targets', 'Phased targets: 60% collection in 2023-24, 70% in 2024-25, rising to 100% by 2026-27.'],
              ['Refurbishment Mandate', 'Refurbishers must obtain authorization and report to State PCBs.'],
              ['Deposit Refund System', 'Manufacturers encouraged to implement deposit-return schemes for consumers.'],
              ['Penalties', 'Non-compliance attracts penalties under Environment (Protection) Act, 1986. Fines can extend to ₹1 lakh/day.'],
              ['CPCB Central Portal', 'All transactions must be logged on the CPCB Centralized Online System for EPR compliance tracking.'],
            ].map(([title, desc]) => (
              <div key={title} style={{
                padding: '14px',
                background: 'rgba(16,185,129,0.06)',
                border: '1px solid rgba(16,185,129,0.15)',
                borderRadius: 'var(--radius-sm)'
              }}>
                <div style={{ fontWeight: 700, color: '#34d399', marginBottom: '6px' }}>{title}</div>
                <div style={{ fontSize: '0.8rem' }}>{desc}</div>
              </div>
            ))}
          </div>
        </div>
      </Section>

      {/* Hazardous Materials */}
      <Section title="Hazardous Fractions in E-Waste" icon={AlertTriangle} color="#f43f5e">
        <div style={{ marginTop: '16px' }}>
          <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '16px', lineHeight: 1.7 }}>
            Electronic devices contain a complex mixture of hazardous substances that pose serious environmental and health risks
            when improperly handled. Safe depollution is the first step in any certified recycling process.
          </p>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '12px', fontSize: '0.82rem' }}>
            {[
              { mat: 'Lead (Pb)', source: 'CRT monitors, solder, batteries', risk: 'Neurotoxin. Impairs cognitive development in children.', color: '#f43f5e' },
              { mat: 'Mercury (Hg)', source: 'LCD backlights (CCFL lamps), switches', risk: 'Highly toxic to kidneys and nervous system. Methylmercury bioaccumulates in fish.', color: '#f43f5e' },
              { mat: 'Cadmium (Cd)', source: 'NiCd batteries, pigments, semiconductors', risk: 'Carcinogen. Concentrates in soil and rice crops.', color: '#fb923c' },
              { mat: 'Chromium VI (Cr⁶⁺)', source: 'PCB coatings, steel components', risk: 'Carcinogenic, mutagenic, toxic to aquatic organisms.', color: '#fb923c' },
              { mat: 'Brominated Flame Retardants', source: 'PCB substrates, plastic casings (TBBPA, PBDEs)', risk: 'Form carcinogenic dioxins/furans when burned. Endocrine disruptors.', color: '#f59e0b' },
              { mat: 'Beryllium (Be)', source: 'Connectors, springs, high-frequency electronics', risk: 'Causes berylliosis (chronic lung disease) in dismantlers.', color: '#f59e0b' },
              { mat: 'PVC (Chlorinated)', source: 'Cable insulation', risk: 'Releases HCl and dioxins on burning. Corrosive.', color: '#a78bfa' },
              { mat: 'Lithium (Li) — batteries', source: 'Smartphones, laptops, power tools', risk: 'Thermal runaway / fire risk if punctured or short-circuited during informal dismantling.', color: '#a78bfa' },
            ].map(item => (
              <div key={item.mat} style={{
                padding: '12px 14px',
                background: `${item.color}0d`,
                border: `1px solid ${item.color}25`,
                borderRadius: 'var(--radius-sm)'
              }}>
                <div style={{ fontWeight: 700, color: item.color, marginBottom: '4px' }}>{item.mat}</div>
                <div style={{ color: 'var(--text-muted)', marginBottom: '4px' }}><strong>Source:</strong> {item.source}</div>
                <div style={{ color: 'var(--text-secondary)' }}>{item.risk}</div>
              </div>
            ))}
          </div>
        </div>
      </Section>

      {/* Critical Raw Materials */}
      <Section title="Critical Raw Materials in E-Waste" icon={Cpu} color="#8b5cf6">
        <div style={{ marginTop: '16px', display: 'flex', flexDirection: 'column', gap: '14px' }}>
          <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', lineHeight: 1.7 }}>
            The EU designates certain materials as "Critical Raw Materials" (CRM) due to their economic importance and supply risk.
            E-waste is one of the richest secondary sources for these elements, often containing higher ore grades than mined deposits.
          </p>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '10px', fontSize: '0.82rem' }}>
            {[
              { mat: 'Gold (Au)', conc: '0.2–0.4 g/kg in PCBs vs. 5g/tonne in ore', color: '#f59e0b' },
              { mat: 'Palladium (Pd)', conc: 'Up to 0.5 g/kg in MLCCs and connectors', color: '#a78bfa' },
              { mat: 'Indium (In)', conc: 'ITO in LCD panels; supply risk HIGH', color: '#38bdf8' },
              { mat: 'Cobalt (Co)', conc: 'Li-ion cathodes; ~5-20 g per smartphone battery', color: '#10b981' },
              { mat: 'Tantalum (Ta)', conc: 'Tantalum capacitors in phones/laptops', color: '#fb923c' },
              { mat: 'Neodymium (Nd)', conc: 'Permanent magnets in HDD, speakers', color: '#f43f5e' },
            ].map(item => (
              <div key={item.mat} style={{
                padding: '12px',
                background: `${item.color}10`,
                border: `1px solid ${item.color}30`,
                borderRadius: 'var(--radius-sm)'
              }}>
                <div style={{ fontWeight: 700, color: item.color, marginBottom: '4px' }}>{item.mat}</div>
                <div style={{ color: 'var(--text-muted)', fontSize: '0.78rem' }}>{item.conc}</div>
              </div>
            ))}
          </div>
          <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
            Sources: EU JRC ProSUM (2018), UNEP (2013) Metal Recycling – Opportunities, Limits, Infrastructure.
          </div>
        </div>
      </Section>

      {/* Circular Economy Principles */}
      <Section title="Circular Economy Principles for Electronics" icon={Recycle} color="#34d399">
        <div style={{ marginTop: '16px', display: 'flex', flexDirection: 'column', gap: '14px', fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
          <p>
            The circular economy (CE) replaces the linear "take-make-dispose" model with regenerative loops that retain the value of materials, components, and products as long as possible.
          </p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {[
              { step: '1. Prolong In-Use Life', desc: 'Software updates, modular repair, OS optimization. Retains 100% of embedded manufacturing energy.', color: '#10b981', retention: '95%' },
              { step: '2. Direct Reuse / Peer Transfer', desc: 'Working devices donated or sold to secondary users without dismantling. No processing emissions.', color: '#38bdf8', retention: '80–90%' },
              { step: '3. Refurbishment', desc: 'Battery, screen, and I/O replacement. Extends device lifespan 2–4 years. 60–80% energy footprint of new.', color: '#8b5cf6', retention: '60–75%' },
              { step: '4. Component Harvesting', desc: 'Selective removal of high-value sub-assemblies (GPU, SSD, RAM) for reuse in repair industry.', color: '#f59e0b', retention: '40–55%' },
              { step: '5. Depollution & Formal Recycling', desc: 'Mechanical shredding + pyrometallurgy / hydrometallurgy for base and precious metal recovery.', color: '#f43f5e', retention: '15–30%' },
            ].map(s => (
              <div key={s.step} style={{
                display: 'flex', alignItems: 'flex-start', gap: '14px',
                padding: '14px',
                background: `${s.color}0a`,
                border: `1px solid ${s.color}20`,
                borderRadius: 'var(--radius-sm)'
              }}>
                <div style={{
                  width: '40px', height: '40px', borderRadius: '10px',
                  background: `${s.color}18`, border: `1px solid ${s.color}35`,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  flexShrink: 0,
                  fontSize: '0.75rem', fontWeight: 800, fontFamily: 'var(--font-mono)', color: s.color
                }}>
                  {s.retention}
                </div>
                <div>
                  <div style={{ fontWeight: 700, color: s.color, marginBottom: '4px' }}>{s.step}</div>
                  <div style={{ fontSize: '0.8rem' }}>{s.desc}</div>
                </div>
              </div>
            ))}
          </div>
          <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
            Circular hierarchy based on: European Commission Circular Economy Action Plan (2020), Ellen MacArthur Foundation, UNEP IRP.
          </div>
        </div>
      </Section>

      {/* Energy Savings */}
      <Section title="Energy & GHG Benefits of Recycling" icon={Zap} color="#a3e635">
        <div style={{ marginTop: '16px', display: 'flex', flexDirection: 'column', gap: '14px' }}>
          <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', lineHeight: 1.7 }}>
            Recycling metals from e-waste requires significantly less energy than primary (virgin) extraction:
          </p>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '10px', fontSize: '0.82rem' }}>
            {[
              { mat: 'Aluminum', saving: '95%', note: 'vs. bauxite smelting' },
              { mat: 'Copper', saving: '85%', note: 'vs. open-pit mining + smelting' },
              { mat: 'Gold', saving: '~90%', note: 'vs. cyanide heap leach mining' },
              { mat: 'Steel', saving: '74%', note: 'vs. blast furnace route' },
              { mat: 'Plastics (regranulate)', saving: '30–80%', note: 'varies by polymer type' },
            ].map(item => (
              <div key={item.mat} style={{
                padding: '14px',
                background: 'rgba(163,230,53,0.07)',
                border: '1px solid rgba(163,230,53,0.2)',
                borderRadius: 'var(--radius-sm)',
                textAlign: 'center'
              }}>
                <div style={{ fontSize: '1.4rem', fontWeight: 800, fontFamily: 'var(--font-mono)', color: '#a3e635' }}>{item.saving}</div>
                <div style={{ fontWeight: 700, color: 'var(--text-secondary)', marginBottom: '2px' }}>{item.mat}</div>
                <div style={{ fontSize: '0.74rem', color: 'var(--text-muted)' }}>{item.note}</div>
              </div>
            ))}
          </div>
          <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
            Sources: US EPA WARM v15, International Aluminium Institute, UNEP Global Metal Flows Working Group.
          </div>
        </div>
      </Section>

      {/* Navigation CTA */}
      <div style={{
        padding: '20px 24px',
        background: 'linear-gradient(135deg, rgba(16,185,129,0.1) 0%, rgba(6,182,212,0.08) 100%)',
        border: '1px solid rgba(16,185,129,0.25)',
        borderRadius: 'var(--radius-md)',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '14px'
      }}>
        <div>
          <div style={{ fontWeight: 700, marginBottom: '4px' }}>Ready to act?</div>
          <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>Register your e-waste now — it takes under 2 minutes.</div>
        </div>
        <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
          <button className="btn btn-primary btn-sm" onClick={() => setActiveTab && setActiveTab('register')}>
            Register E-Waste
          </button>
          <button className="btn btn-secondary btn-sm" onClick={() => setActiveTab && setActiveTab('references')}>
            View Scientific Sources
          </button>
        </div>
      </div>
    </div>
  );
}
