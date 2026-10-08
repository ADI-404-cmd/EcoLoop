# EcoLoop ♻️

### From E-Waste to New Value

EcoLoop is a digital **e-waste management system** designed to support the registration, collection, assessment, recovery estimation, and circular tracking of electronic waste.

The project provides a structured digital workflow that connects **e-waste registration → assessment → collection → processing → recovery**, while using source-backed reference data to estimate material composition and potential material recovery.

---

## 📌 Problem Statement

The rapid growth of electronic waste creates environmental, resource, and waste-management challenges. Electronic devices contain valuable materials such as metals and plastics, but their recovery requires proper identification, collection, segregation, and processing.

EcoLoop aims to provide a digital model for managing this lifecycle by:

* Recording e-waste submissions
* Maintaining device and submission information
* Estimating material composition
* Estimating potential material recovery
* Tracking collection and processing status
* Providing collection-center information
* Visualizing the circular journey of submitted devices
* Providing management-level analytics
* Presenting scientific references and awareness information

---

## 🎯 Objectives

The main objectives of EcoLoop are:

1. Develop a digital platform for e-waste registration and tracking.
2. Provide evidence-based estimates of material composition and potential recovery.
3. Track the lifecycle of registered e-waste from registration to recovery.
4. Separate **potential recovery** from **actual operational recovery**.
5. Provide analytics for understanding e-waste quantities and recovery potential.
6. Promote circular-economy principles such as reuse, refurbishment, recycling, and responsible disposal.
7. Maintain scientific transparency by associating calculations with reference data, assumptions, and confidence levels.

---

## ✨ Key Features

### 1. E-Waste Registration

Users can register electronic devices by providing information such as:

* Device category
* Device model
* Quantity
* Weight
* Condition
* Purchase year

Each submission receives a unique tracking identity that can be used to follow its lifecycle.

---

### 2. Impact & Recovery Calculator

EcoLoop evaluates supported device categories using reference material-composition data.

The calculator can estimate:

* Total device mass
* Material mass
* Potential recoverable material
* Applicable recovery pathways
* Confidence level
* Scientific/reference information

Unsupported categories are explicitly reported as **UNAVAILABLE** rather than using unsupported or invented scientific values.

---

### 3. Collection Management

The system maintains collection-center information and allows registered e-waste to move through its collection lifecycle.

The lifecycle follows:

```text
Registered
     ↓
Collected
     ↓
In Assessment
     ↓
Processing
     ↓
Recovered
```

Invalid lifecycle transitions are rejected by the backend.

---

### 4. Circular Journey

Each submission can be tracked through its journey from registration to recovery.

The system distinguishes between:

* **Registered** — digitally submitted
* **Collected** — physically collected
* **Processed** — entered into processing
* **Potential Recovery** — scientifically estimated recovery potential
* **Actual Recovery** — recovery recorded through operational data

This prevents estimated recovery from being presented as actual recovered material.

---

### 5. Management Analytics

EcoLoop provides analytics based on persisted application data, including information such as:

* Number of registered devices
* Total logged e-waste mass
* Collection and processing activity
* Recovery potential
* Category-level information
* Lifecycle status distribution

Analytics are generated from the application's stored records rather than hardcoded dashboard values.

---

### 6. Knowledge & References

The project includes a dedicated knowledge and reference section containing:

* E-waste awareness information
* Circular-economy concepts
* Scientific references
* Material-composition sources
* Recovery methodology
* Reference-data information

---

## 🔬 Scientific Methodology

EcoLoop does not assume that every electronic device has the same material composition or environmental impact.

The project uses a versioned reference-data approach.

### Material Mass

For a material fraction:

```text
Material Mass = Total Device Mass × Material Fraction
```

### Potential Recovery

```text
Potential Recovery
= Material Mass × Applicable Recovery Factor
```

### PPM-based Materials

For concentrations represented in parts per million:

```text
Material Mass
= Total Device Mass × PPM / 1,000,000
```

### Weight Hierarchy

Where possible, device weight is selected using the following hierarchy:

```text
Exact Manufacturer Model
        ↓
Reliable Exact-Model Technical Data
        ↓
Category Reference
        ↓
User-Provided Weight
```

### Confidence

Scientific results are associated with a confidence level based on the quality and applicability of the reference data.

```text
HIGH
MEDIUM
LOW
UNAVAILABLE
```

If a scientifically defensible value is not available, EcoLoop does not invent a number.

---

## 🌱 Circular Economy Approach

EcoLoop follows a circular-economy-oriented pathway:

```text
Electronic Device
       ↓
Registration
       ↓
Assessment
       ↓
┌───────────────┐
│ Reuse / Repair│
└───────────────┘
       ↓
Refurbishment
       ↓
Collection
       ↓
Segregation
       ↓
Material Recovery
       ↓
Recovered Resources
       ↓
New Value
```

The preferred pathway can depend on the device's condition and available information.

The overall goal is to encourage **lifetime extension and resource recovery before final disposal**.

---

## 🏗️ System Architecture

EcoLoop uses a React frontend connected to a Node.js/Express backend.

```text
┌──────────────────────────────┐
│        React Frontend        │
│                              │
│  Dashboard                   │
│  Registration                │
│  Calculator                  │
│  Circular Journey            │
│  Collection Centers          │
│  Analytics                   │
│  Knowledge                   │
│  References                  │
└──────────────┬───────────────┘
               │
               │ REST API
               ▼
┌──────────────────────────────┐
│      Node.js / Express       │
│                              │
│  Validation                  │
│  Lifecycle Management        │
│  Scientific Calculations     │
│  Analytics                   │
│  Database Repository         │
└──────────────┬───────────────┘
               │
               ▼
┌──────────────────────────────┐
│           SQLite             │
│                              │
│  Submissions                 │
│  Status History              │
│  Calculations                │
│  Recovery Records            │
│  Collection Centers          │
└──────────────────────────────┘

Scientific Reference Data
        │
        ▼
Versioned JSON + Reference Tables
```

---

## 🛠️ Technology Stack

### Frontend

* React
* Vite
* JavaScript
* CSS

### Backend

* Node.js
* Express.js
* REST APIs

### Database

* SQLite
* better-sqlite3

### Development & Version Control

* npm
* Git
* GitHub

---

## 📁 Project Structure

```text
EcoLoop/
│
├── data/
│   ├── collection-centers-seed.json
│   ├── initial-submissions-seed.json
│   ├── material-recovery-factors.json
│   ├── reference-devices.json
│   └── scientific-references.json
│
├── server/
│   ├── db/
│   │   ├── migrations/
│   │   │   └── 001_create_schema.sql
│   │   ├── connection.js
│   │   ├── init.js
│   │   ├── migrate.js
│   │   ├── repository.js
│   │   └── seed.js
│   │
│   ├── tests/
│   ├── calculator.js
│   ├── circular-engine.js
│   └── server.js
│
├── src/
│   ├── components/
│   ├── api.js
│   ├── App.jsx
│   ├── index.css
│   └── main.jsx
│
├── BACKEND_SPEC.md
├── BACKEND_SPEC_V1.md
├── REFERENCE_DATA_REQUIREMENTS.md
├── package.json
├── package-lock.json
├── vite.config.js
└── README.md
```

---

## 🚀 Running the Project Locally

### Prerequisites

Install:

* Node.js
* npm
* Git

### 1. Clone the repository

```bash
git clone https://github.com/ADI-404-cmd/EcoLoop.git
cd EcoLoop
```

### 2. Install dependencies

```bash
npm install
```

### 3. Initialize the database

```bash
npm run db:init
```

For a demonstration dataset:

```bash
npm run db:init:demo
```

> Database files are intentionally excluded from GitHub. Each local installation creates its own SQLite database.

### 4. Start the application

```bash
npm start
```

The application can then be accessed through the local development server shown by the terminal.

---

## 🧪 Testing

The backend includes automated tests covering:

* Scientific calculations
* Database persistence
* API behavior
* Analytics
* Lifecycle transitions

Run:

```bash
npm test
```

---

## 🔐 Data & Persistence

EcoLoop uses SQLite for local application persistence.

Registered submissions, lifecycle history, calculations, and recovery records are stored in the local database.

The SQLite database itself is **not committed to GitHub**.

This means that different computers running EcoLoop locally have separate databases.

For example:

```text
Computer A
    ↓
EcoLoop
    ↓
SQLite A

Computer B
    ↓
EcoLoop
    ↓
SQLite B
```

To allow multiple users or computers to share the same live data, the backend and database would need to be deployed to a shared server or cloud environment.

---

## 📚 Scientific References

The project methodology and reference data are based on publicly available scientific, governmental, and institutional sources, including resources from organizations such as:

* United Nations Institute for Training and Research (UNITAR)
* International Telecommunication Union (ITU)
* European Commission Joint Research Centre (JRC)
* Central Pollution Control Board (CPCB)
* Ministry of Environment, Forest and Climate Change (MoEFCC)
* United States Environmental Protection Agency (US EPA)
* Peer-reviewed academic research

Detailed reference information is maintained in:

```text
REFERENCE_DATA_V1.md
```

and:

```text
data/scientific-references.json
```

---

## ⚠️ Limitations

EcoLoop is a project-scale digital model and prototype.

Some limitations include:

* Reference data is currently available only for selected device categories.
* Material composition can vary between manufacturers and models.
* Potential recovery represents an estimate and does not guarantee actual recovery.
* Actual recovery requires operational processing data.
* Environmental-impact estimates depend on the availability and applicability of appropriate source data.
* Local development currently uses a SQLite database specific to each installation.
* Collection-center information may represent seed/demo data rather than live operational availability.

Unsupported scientific calculations are intentionally marked as **UNAVAILABLE** instead of being estimated using unsupported assumptions.

---

## 🔮 Future Scope

Possible future enhancements include:

* Cloud-hosted shared database
* User authentication and role-based access
* Integration with authorized recyclers and collection partners
* QR-code-based e-waste tracking
* Mobile application
* Real-time collection-center availability
* Automated device identification
* Image-based device classification
* Advanced analytics and forecasting
* Integration with verified environmental-impact datasets
* Operational recording of actual recovered materials

---

## 👥 Project

**EcoLoop — From E-Waste to New Value**

Developed as part of an academic project on **E-Waste Management and Circular Economy**.

---

## 📄 License

This project is intended primarily for academic and educational purposes.
