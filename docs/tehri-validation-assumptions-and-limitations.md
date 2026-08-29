# Tehri Validation Assumptions & Limitations

This document serves as the formal assumptions register and dataset manifest for the **HydroBreach** Tehri Dam validation testbed. 

## 1. Dataset Manifest

All geospatial operations, hydrodynamic models, and exposure estimations utilize the following explicitly defined datasets:

| Data Type | Source | Resolution | Coverage | Role |
| --- | --- | --- | --- | --- |
| **DEM / Topography** | Copernicus GLO-30 DSM | 30m | Tehri to Haridwar | Mesh generation, 2D shallow water routing, and hazard extraction. |
| **Land Cover / Manning's n** | ESA WorldCover 2021 | 10m | Tehri to Haridwar | Assignment of surface roughness ($n$) for momentum equations. |
| **Hydrology / Rainfall** | IMD 24h PMP (Gridded) | 0.25° | Bhagirathi Basin | Extreme rainfall-runoff forcing for combined reservoir flood routing. |
| **River Gauge Records** | CWC Devprayag / Rishikesh | Point | Specific cross-sections | Validation data for historical baseline calibration. |
| **Population Exposure** | WorldPop (Unconstrained) | 100m | Valley Corridor | Intersected with flood depth/velocity layers to calculate HADR population at risk. |
| **Building Footprints** | OpenStreetMap (OSM) | Vector | Valley Corridor | Extracted for property damage assessment and structural exposure calculations. |
| **Road Network** | OpenStreetMap (OSM) | Vector | Valley Corridor | Evacuation routing and network disruption mapping. |
| **Satellite Imagery** | Sentinel-1 C-Band SAR | 10m | Region-wide | Real-time observation pipeline for detecting surface water anomalies. |

## 2. Core Assumptions

### Hydrodynamics & Breach Mechanics
1. **Breach Geometry**: Driven by Froehlich (2008) for earthen/rockfill parameterization unless overriden by DualSPHysics 3D solver. Assumes trapezoidal formulation.
2. **2D Flow Solver (Delft3D FM)**: Solves the depth-averaged shallow water equations (SWE). Assumes hydrostatic pressure distribution (vertical accelerations are negligible) downstream of the immediate breach near-field.
3. **Coupling**: The transition from 3D Navier-Stokes (SPH) to 2D SWE (Delft3D) assumes mass and momentum conservation at the designated boundary cross-section.
4. **Sediment Transport**: Current iteration runs clear-water hydrodynamics; sediment bulking and debris flow mechanics (crucial in Himalayan valleys) are estimated via bulk density modifiers but not fully morphodynamically solved.

### Exposure & Evacuation
1. **Damage Curves**: Utilizes depth-damage curves adapted from JRC (2017) and CWC guidelines, mapped to Indian rural/semi-urban structures. 
2. **Evacuation Routing**: Uses Dijkstra's algorithm on the OSM road graph. Assumes a uniform walking speed of 1.5 m/s for pedestrian evacuation, and 30 km/h for vehicular escape where roads remain passable.
3. **Priority Formula**: Deterministic, transparent scoring weighting Arrival Time (35%), Hazard (30%), Population (25%), and Critical Assets (10%).

## 3. Limitations & Uncertainties

1. **Near-field Turbulence**: While SPH captures near-field 3D splash and turbulence, transferring this exact turbulence spectrum into the 2D mesh involves numerical dissipation.
2. **DEM Artifacts**: GLO-30 may contain vegetation or urban canopy artifacts that artificially resist flow in the 2D solver.
3. **Observation Limitations (Sentinel-1)**: SAR C-band is highly effective at penetrating clouds but suffers from severe layover and foreshortening in the steep V-shaped Himalayan valleys, potentially obscuring valley-bottom inundation in certain orbit passes.
4. **Data Latency**: Sentinel-1 repeat cycle is 12 days (6 days with constellation), meaning the "real-time" observation module is limited by orbital pass timing.

## 4. Scenario Applicability (The 4 SIH Runs)

1. **Current-condition Controlled Release**: Fully applicable. High confidence in routing standard spillway releases.
2. **Moderate Engineered Breach**: Moderate confidence. Highly sensitive to the assumed breach formation time (Monte Carlo ensemble recommended).
3. **Severe Engineered Breach (Worst-Case)**: Serves as a theoretical upper bound for HADR logistics. PMF + Seismic collapse represents a highly improbable but necessary readiness limit.
4. **Natural Landslide Blockage Outburst (Rishi Ganga style)**: Applicable framework, but highly dependent on the initial volume of the landslide dam, which must be inferred from satellite/SAR observations.

*(End of Register)*
