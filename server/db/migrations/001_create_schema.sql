-- EcoLoop Database Migration 001: Initial Relational Schema
-- Aligned with BACKEND_SPEC.md and REFERENCE_DATA_V1.md

-- 1. Schema Migrations Ledger
CREATE TABLE IF NOT EXISTS schema_migrations (
    version INTEGER PRIMARY KEY,
    name TEXT NOT NULL,
    applied_at TEXT NOT NULL DEFAULT (datetime('now'))
);

-- 2. Scientific & Reference Tables
CREATE TABLE IF NOT EXISTS sources (
    id TEXT PRIMARY KEY,
    short_code TEXT NOT NULL,
    title TEXT NOT NULL,
    authors TEXT,
    organization TEXT NOT NULL,
    publication_year INTEGER NOT NULL,
    source_type TEXT NOT NULL,
    url_or_doi TEXT,
    parameters_supported TEXT, -- JSON array string
    geographical_scope TEXT NOT NULL,
    methodology_notes TEXT,
    limitations TEXT,
    created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS device_categories (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    cpcb_code TEXT,
    description TEXT,
    default_weight_kg REAL NOT NULL,
    reference_source_id TEXT,
    composition_id TEXT,
    typical_lifespan_years INTEGER NOT NULL,
    v1_calculation_status TEXT NOT NULL DEFAULT 'READY',
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    FOREIGN KEY (reference_source_id) REFERENCES sources(id)
);

CREATE TABLE IF NOT EXISTS devices (
    id TEXT PRIMARY KEY,
    category_id TEXT NOT NULL,
    brand TEXT NOT NULL,
    model TEXT NOT NULL,
    weight_kg REAL NOT NULL,
    source_id TEXT NOT NULL,
    source_detail TEXT,
    confidence_tier TEXT NOT NULL DEFAULT 'High',
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    FOREIGN KEY (category_id) REFERENCES device_categories(id),
    FOREIGN KEY (source_id) REFERENCES sources(id)
);

CREATE TABLE IF NOT EXISTS materials (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    category TEXT NOT NULL,
    recovery_efficiency REAL NOT NULL DEFAULT 0.0,
    recovery_method TEXT NOT NULL,
    avoided_co2e_factor_kg_per_kg REAL NOT NULL DEFAULT 0.0,
    primary_emission_factor_kg_per_kg REAL,
    secondary_emission_factor_kg_per_kg REAL,
    is_critical_raw_material INTEGER NOT NULL DEFAULT 0,
    hazard_level TEXT DEFAULT 'Low',
    source_id TEXT,
    citation_notes TEXT,
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    FOREIGN KEY (source_id) REFERENCES sources(id)
);

CREATE TABLE IF NOT EXISTS material_compositions (
    id TEXT PRIMARY KEY,
    composition_id TEXT NOT NULL,
    name TEXT NOT NULL,
    source_id TEXT NOT NULL,
    materials_json TEXT NOT NULL,
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    FOREIGN KEY (source_id) REFERENCES sources(id)
);

CREATE TABLE IF NOT EXISTS cpcb_epr_factors (
    id TEXT PRIMARY KEY,
    category_id TEXT NOT NULL,
    cpcb_code TEXT NOT NULL,
    metal TEXT NOT NULL,
    recoverable_percentage REAL NOT NULL,
    source_id TEXT NOT NULL,
    reference_data_version TEXT NOT NULL DEFAULT '1.0',
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    FOREIGN KEY (category_id) REFERENCES device_categories(id),
    FOREIGN KEY (source_id) REFERENCES sources(id)
);

-- 3. Application & Transactional Tables
CREATE TABLE IF NOT EXISTS collection_centers (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    operator TEXT NOT NULL,
    cpcb_registration_no TEXT NOT NULL,
    address TEXT NOT NULL,
    city TEXT NOT NULL,
    state TEXT NOT NULL,
    pincode TEXT NOT NULL,
    phone TEXT,
    email TEXT,
    operating_hours TEXT,
    status TEXT NOT NULL DEFAULT 'Accepting E-Waste',
    accepts_drop_off INTEGER NOT NULL DEFAULT 1,
    offers_home_pickup INTEGER NOT NULL DEFAULT 0,
    accepted_categories TEXT NOT NULL, -- JSON array string
    latitude REAL,
    longitude REAL,
    certifications TEXT, -- JSON array string
    created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS ewaste_submissions (
    id TEXT PRIMARY KEY,
    tracking_code TEXT UNIQUE NOT NULL,
    user_id TEXT,
    user_name TEXT NOT NULL,
    user_email TEXT NOT NULL,
    category_id TEXT NOT NULL,
    category_name TEXT NOT NULL,
    cpcb_code TEXT NOT NULL,
    brand TEXT NOT NULL,
    model TEXT NOT NULL,
    quantity INTEGER NOT NULL DEFAULT 1,
    purchase_year INTEGER,
    age_years INTEGER NOT NULL,
    condition TEXT NOT NULL,
    weight_kg_per_unit REAL NOT NULL,
    weight_source_type TEXT NOT NULL,
    weight_confidence TEXT NOT NULL,
    total_declared_mass_kg REAL NOT NULL,
    user_intended_pathway TEXT NOT NULL,
    recommended_pathway TEXT NOT NULL,
    pathway_rationale TEXT NOT NULL,
    selected_center_id TEXT,
    collection_method TEXT NOT NULL,
    notes TEXT,
    status TEXT NOT NULL DEFAULT 'Registered',
    is_demo INTEGER NOT NULL DEFAULT 0,
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    updated_at TEXT NOT NULL DEFAULT (datetime('now')),
    FOREIGN KEY (selected_center_id) REFERENCES collection_centers(id),
    CHECK (status IN ('Registered', 'Collected', 'In Assessment', 'Processing', 'Recovered')),
    CHECK (quantity >= 1),
    CHECK (total_declared_mass_kg > 0)
);

CREATE TABLE IF NOT EXISTS submission_status_history (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    submission_id TEXT NOT NULL,
    previous_status TEXT,
    new_status TEXT NOT NULL,
    actor TEXT,
    note TEXT,
    timestamp TEXT NOT NULL DEFAULT (datetime('now')),
    FOREIGN KEY (submission_id) REFERENCES ewaste_submissions(id) ON DELETE CASCADE,
    CHECK (new_status IN ('Registered', 'Collected', 'In Assessment', 'Processing', 'Recovered'))
);

CREATE TABLE IF NOT EXISTS impact_calculations (
    id TEXT PRIMARY KEY,
    submission_id TEXT,
    category_id TEXT NOT NULL,
    total_mass_kg REAL NOT NULL,
    reference_data_version TEXT NOT NULL DEFAULT '1.0',
    methodology_version TEXT NOT NULL DEFAULT '1.0',
    data_level TEXT NOT NULL,
    confidence_tier TEXT NOT NULL,
    calculation_inputs TEXT NOT NULL, -- JSON string
    material_breakdown TEXT NOT NULL, -- JSON string
    recovery_estimates TEXT NOT NULL, -- JSON string
    environmental_estimates TEXT NOT NULL, -- JSON string
    source_ids TEXT NOT NULL, -- JSON string array
    assumptions TEXT NOT NULL, -- JSON string array
    warnings TEXT, -- JSON string array
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    FOREIGN KEY (submission_id) REFERENCES ewaste_submissions(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS recovery_records (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    submission_id TEXT NOT NULL,
    material_id TEXT NOT NULL,
    material_name TEXT NOT NULL,
    category TEXT,
    potential_mass_kg REAL NOT NULL DEFAULT 0,
    actual_mass_kg REAL NOT NULL DEFAULT 0,
    avoided_co2e_kg REAL NOT NULL DEFAULT 0,
    is_confirmed INTEGER NOT NULL DEFAULT 0,
    recorded_at TEXT NOT NULL DEFAULT (datetime('now')),
    FOREIGN KEY (submission_id) REFERENCES ewaste_submissions(id) ON DELETE CASCADE
);

-- Indexes for performance & query filtering
CREATE INDEX IF NOT EXISTS idx_submissions_tracking ON ewaste_submissions(tracking_code);
CREATE INDEX IF NOT EXISTS idx_submissions_status ON ewaste_submissions(status);
CREATE INDEX IF NOT EXISTS idx_submissions_category ON ewaste_submissions(category_id);
CREATE INDEX IF NOT EXISTS idx_status_history_submission ON submission_status_history(submission_id);
CREATE INDEX IF NOT EXISTS idx_impact_calculations_sub ON impact_calculations(submission_id);
CREATE INDEX IF NOT EXISTS idx_recovery_records_sub ON recovery_records(submission_id);
