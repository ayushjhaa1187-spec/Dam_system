# FloodLab — Dam-Break & Flash-Flood Decision Support Platform

> **SIH 2026 · Problem Statement 26161**  
> **Primary demonstration:** Tehri Dam — Bhagirathi River, Uttarakhand, India

FloodLab is a generalized Humanitarian Assistance and Disaster Relief (HADR) decision-support platform for dam-break, emergency water-release, river-blockage, and flash-flood scenarios. It combines terrain, hydrology, dam/reservoir information, satellite observations, hydrodynamic modelling, and exposure analysis to answer:

> **Where will water go, how deep and fast will it be, when will it arrive, and who must be protected first?**

The platform is demonstrated on the Tehri Dam–Bhagirathi River system and is designed to be extensible to other Indian dams, rivers, and natural landslide-blockage events.

---

## Contents

- [Core capabilities](#core-capabilities)
- [System workflow](#system-workflow)
- [Action flowchart](#action-flowchart)
- [Modelling workflow](#modelling-workflow)
- [Architecture](#architecture)
- [Repository structure](#repository-structure)
- [Frontend workflow](#frontend-workflow)
- [Backend and worker workflow](#backend-and-worker-workflow)
- [Data flow and provenance](#data-flow-and-provenance)
- [Quick start](#quick-start)
- [Environment configuration](#environment-configuration)
- [API workflow](#api-workflow)
- [Outputs and exports](#outputs-and-exports)
- [Testing and quality workflow](#testing-and-quality-workflow)
- [Deployment architecture](#deployment-architecture)
- [Development roadmap](#development-roadmap)
- [Scientific limitations](#scientific-limitations)

---

## Core capabilities

FloodLab is designed to support the following operational workflow:

1. **Observe** current terrain, rainfall, reservoir, river, and satellite conditions.
2. **Configure** a physically plausible hazard scenario.
3. **Estimate** an inflow/release/breach outflow hydrograph \(Q(t)\).
4. **Simulate** near-field and downstream flood propagation.
5. **Analyze** depth, velocity, inundation extent, and arrival time.
6. **Assess** exposed settlements, population, roads, bridges, hospitals, schools, and agriculture.
7. **Compare** model outputs with alternate scenarios and satellite-derived flood observations.
8. **Prioritize** evacuation and HADR response actions.
9. **Export** GIS-ready and decision-ready products.

### Supported hazard modes

| Hazard mode | Description | Primary output |
|---|---|---|
| Controlled release | Planned, emergency, or spillway release from a reservoir | Release hydrograph and downstream impact |
| Engineered dam breach | Hypothetical breach scenario using physically plausible breach ranges | Breach \(Q(t)\), flood depth, velocity, arrival time |
| Extreme rainfall / cloudburst | Rainfall-runoff event that increases inflow and reservoir stress | Inflow hydrograph and flood scenario |
| Natural blockage / landslide dam | Temporary river blockage, impounded lake, overtopping, and outburst | Outburst hydrograph and downstream impact |

### Decision outputs

- Maximum flood depth
- Maximum flow velocity
- Flood arrival time
- Flood extent and inundated area
- Hazard zones and confidence/probability layers
- Exposed population and affected settlements
- Affected roads, bridges, hospitals, schools, and agriculture
- Evacuation priority and safe-route recommendations
- SHP, KML, GeoJSON, CSV, GeoTIFF, and PDF outputs

---

## System workflow

```mermaid
flowchart LR
    A[Data sources] --> B[Data ingestion and validation]

    A1[DEM / terrain] --> A
    A2[Dam and reservoir data] --> A
    A3[Rainfall and hydrology] --> A
    A4[Land cover and roughness] --> A
    A5[Population and infrastructure] --> A
    A6[Sentinel satellite imagery] --> A

    B --> C[Scenario Builder]
    C --> D[Hydrology and reservoir state]
    D --> E[Breach / release engine]
    E --> F[Outflow hydrograph Q(t)]

    F --> G[Rapid screening model]
    F --> H[DualSPHysics near-field model]
    H --> I[Coupling hydrograph at downstream interface]
    I --> J[Delft3D FM far-field model]

    G --> K[Preliminary flood results]
    J --> L[High-fidelity flood results]

    K --> M[Exposure and HADR engine]
    L --> M

    N[Google Earth Engine / Sentinel-1] --> O[Observed flood / water mask]
    O --> P[Model vs observation comparison]
    L --> P

    M --> Q[Operational dashboard]
    P --> Q
    Q --> R[Exports and HADR reports]
```

### Plain-language workflow

```text
Observe → Configure → Estimate Q(t) → Simulate → Validate → Assess impact → Warn → Evacuate → Export
```

---

## Action flowchart

This is the main action flow for a disaster-management operator or analyst.

```mermaid
flowchart TD
    A[Open FloodLab] --> B[Select dam, river, and study area]
    B --> C{What hazard is being evaluated?}

    C -->|Current condition| D[Load latest available reservoir, rainfall, and river inputs]
    C -->|Emergency release| E[Enter release schedule and reservoir state]
    C -->|Dam breach| F[Choose breach mechanism and plausible parameter ranges]
    C -->|Natural blockage| G[Enter blockage geometry, lake volume, and overtopping state]

    D --> H[Validate inputs and provenance]
    E --> H
    F --> H
    G --> H

    H --> I{Inputs valid?}
    I -->|No| J[Highlight missing, invalid, or incompatible input]
    J --> H
    I -->|Yes| K[Generate inflow / release hydrograph Q(t)]

    K --> L[Run rapid screening preview]
    L --> M{Need high-fidelity model?}

    M -->|No| N[Review screening results with disclaimer]
    M -->|Yes| O[Queue SPH and/or Delft3D job]

    O --> P[Monitor run status, logs, and warnings]
    P --> Q{Run completed?}
    Q -->|Failed| R[Inspect log, correct inputs, retry]
    R --> H
    Q -->|Completed| S[Load depth, velocity, extent, and arrival-time layers]

    S --> T[Intersect with population and infrastructure]
    T --> U[Rank threatened settlements and evacuation priorities]
    U --> V[Compare with satellite observation if available]
    V --> W[Export SHP, KML, GeoJSON, CSV, GeoTIFF, and PDF]
```

---

## Modelling workflow

### 1. Hydrology: rainfall to inflow

```text
Rainfall
  ↓
Losses / infiltration
  ↓
Runoff generation
  ↓
Catchment routing
  ↓
Upstream inflow hydrograph
  ↓
Reservoir state and release condition
```

The MVP hydrology workflow may use transparent methods such as SCS-CN runoff estimation, unit-hydrograph routing, and simplified reservoir routing. Rainfall is **not** converted directly to a flood polygon.

### 2. Breach and release engine

```text
Dam / reservoir state
  +
Failure or release scenario
  +
Breach geometry range
  +
Formation-time range
  ↓
Breach evolution
  ↓
Outflow hydrograph Q(t)
```

The system must model plausible ranges rather than falsely claiming one exact future breach geometry.

Example scenario range:

```text
Breach width: 60–120 m
Formation time: 30–90 min
Reservoir level: observed / reported value ± uncertainty
Manning's n: land-cover-derived baseline ± sensitivity range
```

### 3. Multi-scale hydrodynamics

```mermaid
flowchart LR
    A[Dam / breach / release] --> B[DualSPHysics]
    B --> C[Near-field flow, depth, velocity]
    C --> D[Q(t) at coupling transect]
    D --> E[Delft3D Flexible Mesh]
    E --> F[Far-field depth, velocity, extent, arrival time]
    F --> G[HADR exposure and evacuation intelligence]
```

| Model | Main domain | Purpose | Key outputs |
|---|---|---|---|
| Rapid screening model | Full study area, low cost | Fast scenario preview | Approximate extent, preliminary risk |
| DualSPHysics | Near breach / near field | Violent, transient, highly non-linear release | Local depth, velocity, discharge hydrograph |
| Delft3D FM | River valley / far field | Large-domain 2D flood routing | Depth, velocity, extent, arrival time |

### 4. Uncertainty workflow

```mermaid
flowchart TD
    A[Base scenario] --> B[Select uncertain parameters]
    B --> C[Generate plausible parameter samples]
    C --> D[Run screening or hydrodynamic ensemble]
    D --> E[Aggregate depth, arrival-time, and extent outputs]
    E --> F[Produce P10 / P50 / P90 ranges]
    E --> G[Generate inundation probability map]
    E --> H[Rank parameter sensitivity]
```

Suggested uncertain inputs:

- Breach width
- Breach formation time
- Reservoir water level
- Manning's roughness
- Rainfall intensity
- DEM/mesh resolution

---

## Architecture

```mermaid
flowchart TB
    subgraph Client[Client layer]
        FE[React + Vite dashboard]
        MAP[Leaflet / MapLibre map workspace]
    end

    subgraph Platform[Application platform]
        API[FastAPI REST API]
        DB[(PostgreSQL + PostGIS)]
        STORE[Object storage: DEMs, rasters, exports]
        QUEUE[Redis task queue]
    end

    subgraph Compute[Scientific compute workers]
        HYDRO[Hydrology / breach worker]
        GIS[GDAL / Rasterio / GeoPandas worker]
        SPH[DualSPHysics worker]
        DELFT[Delft3D FM worker]
        GEE[Google Earth Engine worker]
        HADR[Exposure and evacuation worker]
    end

    subgraph External[External data]
        DEM[DEM and terrain sources]
        HYDRODATA[Rainfall / river / reservoir sources]
        EO[Sentinel-1 / Sentinel-2]
        EXPOSURE[OSM / WorldPop / administrative layers]
    end

    FE --> API
    MAP --> API
    API --> DB
    API --> STORE
    API --> QUEUE
    QUEUE --> HYDRO
    QUEUE --> GIS
    QUEUE --> SPH
    QUEUE --> DELFT
    QUEUE --> GEE
    QUEUE --> HADR

    HYDRO --> DB
    GIS --> STORE
    SPH --> STORE
    DELFT --> STORE
    GEE --> STORE
    HADR --> DB

    DEM --> GIS
    HYDRODATA --> HYDRO
    EO --> GEE
    EXPOSURE --> HADR
```

### Deployment principle

- **Vercel:** React/Vite frontend only
- **Backend host:** FastAPI API service
- **Worker host / VM / container service:** GIS, SPH, Delft3D, and long-running jobs
- **PostgreSQL + PostGIS:** scenario metadata, geometry, exposure results, job state
- **Object storage:** large DEMs, GeoTIFFs, NetCDF files, model outputs, exports
- **Redis:** job queue, run progress, retries

> Vercel should not run long hydraulic simulations, large raster jobs, or SPH/Delft3D processing.

---

## Repository structure

```text
Dam_system/
│
├── .github/                    # CI/CD workflows and repository automation
├── .env.example                # Root environment-variable template
├── .gitignore                  # Files excluded from Git
├── LICENSE                      # Project license
├── README.md                    # Project documentation
├── Makefile                     # Common development commands
├── docker-compose.yml           # Local multi-service development stack
├── vercel.json                  # Vercel frontend deployment configuration
├── run_prototype.bat            # Windows prototype launcher
│
├── frontend/                    # React + Vite dashboard
│   ├── .env.example             # Frontend environment template
│   ├── package.json             # Frontend dependencies and scripts
│   ├── vite.config.js           # Vite configuration
│   ├── tailwind.config.js       # Tailwind configuration
│   └── src/
│       ├── App.jsx              # Main application shell
│       ├── FloodLabApp.jsx      # Application entry / composition
│       ├── main.jsx             # React bootstrap
│       ├── index.css            # Global application styling
│       ├── components/          # UI, map, scenario, simulation, chart components
│       ├── pages/               # Page-level views
│       ├── services/            # Backend API client functions
│       ├── utils/               # Shared frontend utilities
│       └── test/                # Frontend test setup and tests
│
├── backend/                     # Python backend service
│   ├── pyproject.toml           # Python tooling/project configuration
│   ├── requirements.txt         # Python dependencies
│   ├── alembic.ini              # Database migration configuration
│   ├── hydrobreach/             # Main backend package
│   │   ├── api/                 # FastAPI entrypoint and routers
│   │   │   └── routers/         # Scenario, simulation, export, GEE, damage APIs
│   │   ├── data/                # Data access and processing services
│   │   └── models/              # Database and domain models
│   ├── floodlab/                # Supporting FloodLab package/modules
│   ├── migrations/              # Database schema migrations
│   └── tests/                   # Backend tests
│
├── workers/                     # Asynchronous/background compute workers
│   ├── hydrology/               # Rainfall, runoff, and reservoir processing
│   ├── gis/                     # Raster/vector preprocessing and export jobs
│   ├── sph/                     # DualSPHysics job orchestration
│   ├── delft3d/                 # Delft3D FM job orchestration
│   ├── gee/                     # Google Earth Engine jobs
│   └── hadr/                    # Exposure, loss, and evacuation analysis
│
├── data/                        # Data inventory and non-secret project datasets
│   ├── raw/                     # Downloaded source data; normally Git-ignored if large
│   ├── processed/               # Cleaned/reprojected datasets
│   ├── derived/                 # Slope, roughness, masks, derived outputs
│   ├── exposure/                # Population, assets, roads, facilities
│   ├── model_inputs/            # Solver-ready inputs
│   └── manifests/               # Dataset sources, CRS, license, date, processing notes
│
├── configs/                     # Scenario, model, solver, and deployment configuration
│   ├── scenarios/               # JSON/YAML scenario definitions
│   ├── hydrology/               # Hydrology model configuration
│   ├── sph/                     # DualSPHysics configuration
│   ├── delft3d/                 # Delft3D FM configuration
│   └── exports/                 # GIS/report export settings
│
├── scripts/                     # One-off, repeatable development/data scripts
├── storage/                     # Local development object-storage mount/output directory
├── infra/                       # Docker, worker, cloud, database, and IaC configuration
├── docs/                        # Research notes, SOPs, data catalog, API docs, diagrams
└── Flood_Predictor/             # Supporting/legacy flood-prediction experimentation module
```

> Large DEMs, satellite rasters, model outputs, and generated GIS files should not be committed to Git. Store them in object storage or a Git-ignored local `data/` / `storage/` directory, while committing manifests, configuration, and reproducible processing scripts.

---

## Frontend workflow

### User flow

```mermaid
flowchart LR
    A[Open FloodLab dashboard] --> B[Select Tehri or another scenario]
    B --> C[Inspect live/latest data and provenance]
    C --> D[Open Scenario Builder]
    D --> E[Configure hazard, reservoir, breach, and solver]
    E --> F[Validate inputs]
    F --> G[Submit simulation]
    G --> H[Track queue and job progress]
    H --> I[View map layers and charts]
    I --> J[Inspect settlements and HADR actions]
    J --> K[Compare scenario/model/satellite layers]
    K --> L[Export outputs]
```

### Frontend responsibilities

The frontend should:

- Display scenarios, data provenance, and model assumptions.
- Validate user input before submitting a job.
- Submit API requests and poll or subscribe to run status.
- Display map layers, legends, units, timestamps, and metadata.
- Clearly distinguish `DEMO`, `SCREENING`, `REAL SOLVER`, and `OBSERVED` data.
- Render depth, velocity, arrival-time, and exposure results.
- Support GIS/report export actions.

The frontend should **not**:

- Store secrets.
- Run heavy geospatial processing.
- Run DualSPHysics or Delft3D directly.
- Claim fixture/fallback data is a real simulation result.

---

## Backend and worker workflow

### Request lifecycle

```mermaid
sequenceDiagram
    participant U as User
    participant FE as React Frontend
    participant API as FastAPI API
    participant DB as PostGIS
    participant Q as Redis Queue
    participant W as Worker
    participant S as Object Storage

    U->>FE: Configure scenario and press Run
    FE->>API: POST /api/simulations/run
    API->>DB: Save scenario and run metadata
    API->>Q: Enqueue job
    API-->>FE: Return run_id and QUEUED status

    W->>Q: Claim queued job
    W->>S: Read DEM, inputs, and configuration
    W->>DB: Update status: PREPROCESSING / RUNNING
    W->>S: Write model outputs and logs
    W->>DB: Save output metadata and COMPLETED status

    FE->>API: GET /api/simulations/{run_id}/status
    API-->>FE: Return progress and status
    FE->>API: GET /api/simulations/{run_id}
    API-->>FE: Return result metadata and output URLs
```

### Standard run states

```text
DRAFT
→ VALIDATING
→ QUEUED
→ PREPROCESSING
→ RUNNING_HYDROLOGY
→ RUNNING_SPH
→ RUNNING_DELFT3D
→ POSTPROCESSING
→ EXPOSURE_ANALYSIS
→ EXPORTING
→ COMPLETED
```

Alternative terminal states:

```text
FAILED
CANCELLED
INVALID
```

### Worker responsibilities

| Worker | Responsibility |
|---|---|
| Hydrology worker | Rainfall/runoff, inflow hydrograph, reservoir routing |
| Breach worker | Breach/release parameterization and \(Q(t)\) generation |
| GIS worker | CRS handling, DEM clipping, slope, roughness, raster/vector preprocessing |
| SPH worker | DualSPHysics setup, execution, near-field outputs, coupling hydrograph |
| Delft3D worker | Mesh/model setup, boundary files, simulation, raster/vector outputs |
| GEE worker | Sentinel retrieval, flood-mask processing, observed-layer export |
| HADR worker | Exposure intersections, settlement ranking, evacuation network analysis |
| Export worker | SHP, KML, GeoJSON, CSV, GeoTIFF, PDF generation |

---

## Data flow and provenance

Every value or layer displayed in FloodLab must carry provenance.

| Label | Meaning | Example |
|---|---|---|
| `OBSERVED` | Direct sensor or satellite observation | Sentinel-1 water/flood mask |
| `REPORTED` | Official or public reported value | Dam height, FRL, reservoir specification |
| `MODEL_ESTIMATE` | Generated by a documented model | Breach peak discharge, depth, velocity |
| `SCENARIO_ASSUMPTION` | Analyst-selected hypothetical input | Breach-width range |
| `DERIVED` | Computed transformation of a source dataset | Slope raster, Manning’s roughness raster |
| `DEMO_FIXTURE` | Presentation/testing fallback data | Built-in sample result |

### Data lifecycle

```text
Raw source
  ↓ metadata + license + timestamp
Validated and reprojected source
  ↓ documented processing script
Derived model input
  ↓ solver configuration + run ID
Model output
  ↓ exposure / comparison / export processing
Dashboard-ready layer and report
```

### Mandatory metadata for model outputs

```json
{
  "run_id": "sim_2026_001",
  "scenario_id": "tehri_breach_high",
  "status": "COMPLETED",
  "result_type": "MODEL_ESTIMATE",
  "solver": "Delft3D FM",
  "solver_version": "<version>",
  "working_crs": "EPSG:32644",
  "dem_source": "Copernicus DEM GLO-30",
  "resolution_m": 30,
  "created_at": "<ISO-8601 timestamp>",
  "assumptions": ["..."],
  "limitations": ["..."]
}
```

---

## Quick start

### Prerequisites

For the dashboard/prototype:

- Node.js 18+
- npm
- Python 3.10+ for backend development
- Git

For the complete scientific stack:

- Docker and Docker Compose
- PostgreSQL with PostGIS
- Redis
- GDAL-compatible GIS environment
- DualSPHysics installation/container
- Delft3D FM installation/container
- Google Earth Engine service account for real GEE analysis

### Clone the repository

```bash
git clone https://github.com/ayushjhaa1187-spec/Dam_system.git
cd Dam_system
```

### Start the frontend

```bash
cd frontend
npm install
npm run dev
```

The Vite development server typically runs at:

```text
http://localhost:5173
```

### Start the backend

```bash
cd backend
python -m venv .venv
```

Activate the environment:

```bash
# Windows PowerShell
.venv\Scripts\Activate.ps1

# macOS / Linux
source .venv/bin/activate
```

Install dependencies and start FastAPI:

```bash
pip install -r requirements.txt
uvicorn hydrobreach.api.main:app --reload --host 0.0.0.0 --port 8000
```

Backend API target:

```text
http://localhost:8000
```

### Start with Docker Compose

When the Compose configuration is fully configured for local development:

```bash
docker compose up --build
```

Use detached mode for background services:

```bash
docker compose up --build -d
```

Stop services:

```bash
docker compose down
```

---

## Environment configuration

Copy templates before adding local values:

```bash
cp .env.example .env
cp frontend/.env.example frontend/.env
```

On Windows, create copies manually if `cp` is unavailable.

### Frontend environment variables

```env
# Public backend URL. VITE_ variables are exposed in the browser.
VITE_API_BASE_URL=http://localhost:8000

# Optional public monitoring/auth configuration.
# VITE_SUPABASE_URL=
# VITE_SUPABASE_ANON_KEY=
# VITE_SENTRY_DSN=
```

### Backend environment variables

```env
APP_ENV=development
LOG_LEVEL=INFO
CORS_ORIGINS=http://localhost:5173,https://dam-system.vercel.app

# Database and job queue
DATABASE_URL=postgresql+psycopg://USER:PASSWORD@localhost:5432/floodlab
REDIS_URL=redis://localhost:6379/0

# Object storage: choose an S3-compatible provider or equivalent
S3_BUCKET=floodlab-data
S3_REGION=ap-south-1
AWS_ACCESS_KEY_ID=
AWS_SECRET_ACCESS_KEY=
S3_ENDPOINT_URL=

# Google Earth Engine: backend only; never expose through VITE_ variables
GEE_PROJECT_ID=
GEE_SERVICE_ACCOUNT_EMAIL=
GEE_PRIVATE_KEY=
# Preferred alternative for a service-account JSON secret:
# GOOGLE_APPLICATION_CREDENTIALS_JSON=

# Optional monitoring
SENTRY_DSN=
```

### Secret safety

Never commit `.env` files. Never expose the following through `VITE_*` variables:

```text
DATABASE_URL
REDIS_URL
GEE_PRIVATE_KEY
GOOGLE_APPLICATION_CREDENTIALS_JSON
AWS_SECRET_ACCESS_KEY
SUPABASE_SERVICE_ROLE_KEY
```

---

## API workflow

The API should expose versioned, documented routes such as:

| Method | Route | Purpose |
|---|---|---|
| `GET` | `/health` | Service health check |
| `GET` | `/api/scenarios/presets` | List example and saved scenario presets |
| `GET` | `/api/scenarios/{scenario_id}` | Read one scenario |
| `POST` | `/api/scenarios/calculate-breach` | Calculate breach/release parameters and \(Q(t)\) |
| `POST` | `/api/hydrology/calculate` | Generate rainfall-runoff/inflow results |
| `POST` | `/api/simulations/run` | Create and queue a simulation run |
| `GET` | `/api/simulations/{run_id}/status` | Read job status/progress/log summary |
| `GET` | `/api/simulations/{run_id}` | Read run metadata and result layers |
| `POST` | `/api/uncertainty/run` | Run ensemble/sensitivity workflow |
| `GET` | `/api/satellite/alerts` | Read detected water/blockage alerts |
| `POST` | `/api/satellite/analyse` | Trigger Sentinel/GEE analysis |
| `GET` | `/api/export/{run_id}/shapefile` | Download SHP ZIP |
| `GET` | `/api/export/{run_id}/kml` | Download KML/KMZ |
| `GET` | `/api/export/{run_id}/csv` | Download HADR CSV report |
| `GET` | `/api/export/{run_id}/manifest` | Download model/export manifest |

### Example simulation request

```json
{
  "scenario_id": "tehri_breach_high",
  "solver_type": "coupled",
  "breach_model": "froehlich_2008",
  "custom_params": {
    "reservoir_level_m": 830.0,
    "breach_width_min_m": 60,
    "breach_width_max_m": 120,
    "formation_time_min": 60,
    "manning_n": 0.042
  }
}
```

### Example simulation response

```json
{
  "run_id": "sim_2026_001",
  "scenario_id": "tehri_breach_high",
  "status": "QUEUED",
  "provenance": "SCENARIO_ASSUMPTION",
  "created_at": "2026-08-30T00:00:00Z"
}
```

---

## Outputs and exports

### Raster outputs

| File | Meaning |
|---|---|
| `max_depth.tif` | Maximum simulated water depth in metres |
| `max_velocity.tif` | Maximum simulated flow velocity in m/s |
| `arrival_time.tif` | Time to flood arrival in minutes/hours |
| `inundation_probability.tif` | Ensemble flood probability |

### Vector outputs

| File | Meaning |
|---|---|
| `flood_extent.geojson` | Flood/inundation boundary |
| `hazard_zones.geojson` | Depth/velocity hazard classification |
| `exposed_assets.geojson` | Affected population and infrastructure |
| `evacuation_routes.geojson` | Time-aware recommended routes |

### Decision outputs

| File | Meaning |
|---|---|
| `settlement_risk.csv` | Settlement arrival, depth, population, priority |
| `hadr_situation_report.csv` | Exposure and response summary |
| `simulation_report.pdf` | Human-readable scenario report |
| `run_manifest.json` | Inputs, outputs, versions, provenance, assumptions |

### Shapefile ZIP requirement

A shapefile export ZIP must include:

```text
.shp
.shx
.dbf
.prj
.cpg
```

---

## Testing and quality workflow

### Development workflow

```mermaid
flowchart LR
    A[Create feature branch] --> B[Implement focused change]
    B --> C[Run lint and unit tests]
    C --> D[Run build]
    D --> E[Run GIS/API integration tests]
    E --> F[Open Vercel preview]
    F --> G[Review map, accessibility, and error states]
    G --> H[Merge after checks pass]
```

### Minimum checks

Frontend:

```bash
cd frontend
npm run lint
npm run test
npm run build
```

Backend:

```bash
cd backend
pytest
```

Recommended quality checks:

```text
- Validate GeoJSON geometry
- Validate CRS and unit compatibility
- Test invalid/large upload behaviour
- Test job failure and retry flow
- Verify map legends and output units
- Verify SHP ZIP components
- Verify provenance labels are present
- Verify no secret is committed
```

### Pull request convention

Use focused branches:

```text
feat/tehri-data-catalog
feat/breach-release-engine
feat/delft3d-job-runner
feat/gee-sentinel-flood-mask
feat/hadr-exposure-engine
feat/light-ui-redesign
fix/export-shapefile-prj
 test/gis-crs-validation
```

A pull request should include:

- What changed
- Why it changed
- Screenshots for frontend work
- Test evidence
- Data/CRS impact
- Assumptions and limitations

---

## Deployment architecture

```mermaid
flowchart LR
    U[User browser] --> V[Vercel: React/Vite frontend]
    V --> API[FastAPI backend host]
    API --> DB[(PostgreSQL + PostGIS)]
    API --> R[Redis]
    API --> O[Object storage]
    R --> W[Docker / VM compute workers]
    W --> SPH[DualSPHysics]
    W --> D3D[Delft3D FM]
    W --> GIS[GDAL / Rasterio / GeoPandas]
    W --> GEE[Google Earth Engine]
    W --> O
```

### Recommended deployment split

| Layer | Recommended deployment role |
|---|---|
| Frontend | Vercel |
| API | Render, Railway, Fly.io, Cloud Run, VM, or container platform |
| Database | Supabase PostgreSQL/PostGIS or managed PostgreSQL/PostGIS |
| Storage | Supabase Storage, Cloudflare R2, S3, or equivalent |
| Queue | Managed Redis or Redis container |
| Heavy workers | Docker VM, Cloud Run job, HPC, or dedicated compute service |

---

## Development roadmap

### Phase 1 — Reliable prototype foundation

- Shared scenario/result schemas
- Data provenance labels
- Clear demo versus real-run status
- CI, linting, unit tests, export tests
- API health and error states

### Phase 2 — Tehri GIS base

- Versioned Tehri data manifest
- DEM, slope, reservoir, river, and catchment layers
- Working CRS validation
- Land-cover-based Manning’s roughness
- Population and infrastructure layers

### Phase 3 — Hydrology and release engine

- Rainfall ingestion
- SCS-CN / unit-hydrograph MVP
- Reservoir state
- Controlled release
- Engineered breach
- Natural blockage/outburst mode
- Auditable \(Q(t)\) output

### Phase 4 — Real hydrodynamics

- DualSPHysics benchmark and near-field setup
- Delft3D FM downstream setup
- SPH \(Q(t)\) to Delft3D coupling
- Depth, velocity, extent, and arrival-time products

### Phase 5 — HADR intelligence

- Exposure intersections
- Settlement priority ranking
- Flood-aware evacuation routing
- Critical infrastructure analysis
- GIS/report exports

### Phase 6 — Observation and uncertainty

- GEE Sentinel-1 workflow
- Observed versus simulated flood comparison
- Ensemble uncertainty workflow
- P10/P50/P90 arrival-time ranges
- Sensitivity ranking and confidence maps

---

## Scientific limitations

FloodLab is a decision-support and research platform. It is not an official flood-warning system unless validated, calibrated, operationally governed, and used with authorized data sources.

### Important statements

- A catastrophic Tehri breach scenario is a **what-if emergency-planning scenario**; it must not be presented as historically validated.
- Satellite flood mapping is **near-real-time**, not second-by-second real-time sensing.
- Exact future breach geometry cannot be known; model plausible ranges and uncertainty.
- DEM-derived river bathymetry may be incomplete and should be documented as a limitation.
- Economic loss should not be reported with false precision without a documented and validated damage function.
- Fixture/demo outputs must be visibly labelled and must not be confused with real solver products.

---

## References and data sources

- Tehri technical data: [THDC India](https://thdc.co.in/en/node/258)
- Sentinel-1 GRD in GEE: [COPERNICUS/S1_GRD](https://developers.google.com/earth-engine/datasets/catalog/COPERNICUS_S1_GRD)
- Copernicus Data Space / DEM: [Copernicus Data Space Ecosystem](https://dataspace.copernicus.eu/)
- ISRO Bhuvan: [Bhuvan](https://bhuvan.nrsc.gov.in/)
- OpenStreetMap: [OpenStreetMap](https://www.openstreetmap.org/)
- WorldPop: [WorldPop](https://www.worldpop.org/)
- Google Earth Engine: [Google Earth Engine](https://earthengine.google.com/)
- DualSPHysics: [DualSPHysics](https://dual.sphysics.org/)
- Delft3D FM: [Delft3D Flexible Mesh](https://www.deltares.nl/software-and-data/products/delft3d-fm-suite)

---

## Team workflow summary

```text
Researcher / GIS analyst
  → prepares and documents datasets

Hydrology / modelling developer
  → creates Q(t), SPH, Delft3D, validation outputs

Backend developer
  → builds APIs, job queue, storage, export workflow

Frontend developer
  → builds scenario, map, HADR, comparison, and report UX

Reviewer / tester
  → verifies physics labels, test coverage, CRS, exports, and credibility claims
```

---

## Project philosophy

FloodLab is not only a flood-map generator.

```text
Real and documented data
  +
Transparent physics and assumptions
  +
GIS-based impact analysis
  +
Actionable HADR intelligence
  =
Decision support for flood preparedness and response
```

**Observe → Anticipate → Simulate → Validate → Warn → Evacuate**
