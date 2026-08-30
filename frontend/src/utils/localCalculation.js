/**
 * localCalculation.js
 * Real variable-dependent local calculation engine for FloodLab.
 *
 * Uses Froehlich (2008) empirical breach equations.
 * Changing any input MUST change the output values — no static fixtures.
 *
 * References:
 *   Froehlich, D.C. (2008). "Embankment Dam Breach Parameters and Their
 *   Uncertainties." Journal of Hydraulic Engineering, 134(12), 1708-1721.
 */

// --- Tehri Downstream Corridor ---
export const TEHRI_CORRIDOR_STATIONS = [
  { id: "tehri_axis",   name: "Tehri Dam Axis",     chainage_km: 0.0,  lat: 30.378, lon: 78.481, population: 0,     type: "dam"       },
  { id: "koteshwar",    name: "Koteshwar Dam",       chainage_km: 22.0, lat: 30.312, lon: 78.367, population: 1200,  type: "dam"       },
  { id: "devprayag",    name: "Devprayag Sangam",    chainage_km: 42.0, lat: 30.148, lon: 78.596, population: 4500,  type: "town"      },
  { id: "shivpuri",     name: "Shivpuri Gorge",      chainage_km: 62.0, lat: 30.164, lon: 78.689, population: 800,   type: "village"   },
  { id: "rishikesh",    name: "Rishikesh Town",       chainage_km: 78.0, lat: 30.087, lon: 78.268, population: 102000,"type": "city"   },
  { id: "haridwar",     name: "Haridwar Plains",      chainage_km: 100.0,lat: 29.945, lon: 78.164, population: 228000,"type": "city"   },
];

// Tehri Dam default parameters
const TEHRI_DEFAULTS = {
  dam_height_m:       260.5,
  reservoir_volume_m3: 3.54e9,
  crest_length_m:     575.0,
  valley_width_m:     450.0,
  bed_slope:          0.0055,
  manning_n:          0.042,
};

/**
 * Froehlich (2008) peak breach discharge.
 * Q_p = 0.607 * V_w^0.295 * H_w^1.24
 * Then scaled by (actual_breach_width / froehlich_predicted_width).
 */
function froehlichPeakDischarge(H_w, V_w, breach_width_m) {
  const Q_p_base   = 0.607 * Math.pow(V_w, 0.295) * Math.pow(H_w, 1.24);
  // Froehlich predicted average breach width
  const B_avg_pred  = 0.27 * Math.pow(V_w, 0.32) * Math.pow(H_w, 0.04);
  // Scale based on user breach width vs predicted
  const scale = Math.min(2.5, Math.max(0.4, breach_width_m / Math.max(B_avg_pred, 10)));
  // Apply scaling with dampening (physical — wider breach → higher Q but not linear)
  return Q_p_base * Math.pow(scale, 0.6);
}

/**
 * Froehlich (2008) breach formation time.
 * t_f = 0.0179 * V_w^0.36 / H_w^0.33  [hours]
 * But user can override with formation_time_hr.
 */
function froehlichFormationTime(H_w, V_w, user_formation_time_hr) {
  if (user_formation_time_hr && user_formation_time_hr > 0) return user_formation_time_hr;
  return 0.0179 * Math.pow(V_w, 0.36) / Math.pow(H_w, 0.33);
}

/**
 * Estimate arrival time at a given chainage using wave speed empirical formula.
 * Wave celerity ~ Q^0.4 * channel_factor
 */
function estimateArrivalTime(chainage_km, Q_p, manning_n, valley_width_m, bed_slope) {
  // Empirical flood wave celerity (m/s) based on peak discharge and channel geometry
  const A = (Q_p / (valley_width_m * Math.pow(Q_p / (valley_width_m * Math.pow(valley_width_m * bed_slope, 0.5) / manning_n), 0.6))) || 1;
  const wave_celerity_ms = (1.5 / manning_n) * Math.pow(bed_slope, 0.5) * Math.pow(Q_p / valley_width_m, 0.4);
  const celerity = Math.min(Math.max(wave_celerity_ms, 2.0), 25.0); // physical bounds
  const arrival_min = (chainage_km * 1000) / celerity / 60.0;
  return Math.round(arrival_min * 10) / 10;
}

/**
 * Estimate peak depth at a station using Manning's equation + attenuation.
 */
function estimatePeakDepth(Q_p, chainage_km, manning_n, valley_width_m, bed_slope) {
  // Attenuate Q with distance (empirical attenuation factor)
  const Q_local = Q_p * Math.exp(-0.008 * chainage_km);
  // Manning: Q = (1/n) * A * R^(2/3) * S^(1/2)
  // Simplified rectangular channel: R ≈ d for wide channel
  const d = Math.pow((Q_local * manning_n) / (valley_width_m * Math.pow(bed_slope, 0.5)), 0.6);
  return Math.round(d * 10) / 10;
}

/**
 * Classify settlement priority based on arrival time and depth.
 */
function classifyPriority(arrival_min, max_depth_m) {
  if (arrival_min < 30 || max_depth_m > 8) return "CRITICAL";
  if (arrival_min < 60 || max_depth_m > 4) return "HIGH";
  if (arrival_min < 120 || max_depth_m > 2) return "MEDIUM";
  return "LOW";
}

/**
 * Main local calculation function.
 * Computes all outputs from scenario inputs. Different inputs → different outputs.
 *
 * @param {object} params
 * @param {number} [params.reservoir_level_pct=95]  - reservoir fill level (%)
 * @param {number} [params.breach_width_m=90]       - user-specified breach width (m)
 * @param {number} [params.formation_time_hr=1.5]   - breach formation time (hours)
 * @param {number} [params.manning_n=0.042]          - Manning's roughness
 * @param {number} [params.dam_height_m]             - dam height override
 * @param {number} [params.reservoir_volume_m3]      - reservoir volume override
 * @returns {object} Full calculation result
 */
export function runLocalCalculation(params = {}) {
  const {
    reservoir_level_pct = 95,
    breach_width_m      = 90,
    formation_time_hr   = 1.5,
    manning_n           = TEHRI_DEFAULTS.manning_n,
    dam_height_m        = TEHRI_DEFAULTS.dam_height_m,
    reservoir_volume_m3 = TEHRI_DEFAULTS.reservoir_volume_m3,
    valley_width_m      = TEHRI_DEFAULTS.valley_width_m,
    bed_slope           = TEHRI_DEFAULTS.bed_slope,
  } = params;

  // Effective head based on fill level
  const H_w = dam_height_m * (reservoir_level_pct / 100);
  // Effective volume at given fill level (simplified proportional)
  const V_w = reservoir_volume_m3 * Math.pow(reservoir_level_pct / 100, 1.2);

  // Breach calculations
  const Q_p    = froehlichPeakDischarge(H_w, V_w, breach_width_m);
  const t_f    = froehlichFormationTime(H_w, V_w, formation_time_hr);
  const t_peak = t_f * 0.4; // time to peak as fraction of formation time

  // Hydrograph (simplified trapezoidal-gamma)
  const hydro_times = [0, t_peak * 0.5, t_peak, t_f, t_f * 1.5, t_f * 2.5, t_f * 4.0];
  const hydro_flows = [
    0,
    Math.round(Q_p * 0.35),
    Math.round(Q_p),
    Math.round(Q_p * 0.55),
    Math.round(Q_p * 0.28),
    Math.round(Q_p * 0.08),
    0,
  ];

  // Affected area (empirical inundation scaling)
  const affected_area_km2 = Math.round(0.18 * Math.pow(Q_p, 0.58) * 10) / 10;

  // Station-by-station impact
  const settlements = TEHRI_CORRIDOR_STATIONS
    .filter(st => st.chainage_km > 0)
    .map(st => {
      const arrival_min  = estimateArrivalTime(st.chainage_km, Q_p, manning_n, valley_width_m, bed_slope);
      const max_depth_m  = estimatePeakDepth(Q_p, st.chainage_km, manning_n, valley_width_m, bed_slope);
      const priority     = classifyPriority(arrival_min, max_depth_m);
      const pop_exposed  = Math.round(st.population * (max_depth_m > 2 ? 0.65 : 0.3));
      return {
        name:             st.name,
        chainage_km:      st.chainage_km,
        lat:              st.lat,
        lon:              st.lon,
        arrival_time_min: arrival_min,
        max_depth_m:      max_depth_m,
        priority,
        population_exposed: pop_exposed,
        type:             st.type,
      };
    });

  const run_id = `local_${Date.now().toString(16)}`;
  const now_iso = new Date().toISOString();

  return {
    run_id,
    scenario_id:          params.scenario_id || "tehri_moderate_breach",
    mode:                 "LOCAL_CALCULATION",
    status:               "COMPLETED (LOCAL_CALCULATION)",
    computed_at:          now_iso,

    // Core hydraulic outputs
    peak_discharge_m3s:   Math.round(Q_p),
    breach_formation_time_hrs: Math.round(t_f * 100) / 100,
    effective_head_m:     Math.round(H_w * 10) / 10,
    affected_area_km2,

    // Hydrograph
    hydrograph: {
      times_hrs:     hydro_times.map(t => Math.round(t * 100) / 100),
      flows_m3s:     hydro_flows,
    },

    // Settlement impact
    settlements,

    // Provenance — always honest
    provenance: {
      level:       "LOCAL_CALCULATION",
      method:      "Froehlich (2008) empirical breach equations",
      disclaimer:  "Prototype estimate. Not a DualSPHysics or Delft3D production run.",
      breach_model: "Froehlich 2008",
      inputs: {
        reservoir_level_pct,
        breach_width_m,
        formation_time_hr,
        manning_n,
        dam_height_m,
      },
    },

    // Input echo for verification
    scenario_params: {
      name:              params.name || "Tehri Dam — Local Calculation",
      dam_name:          params.dam_name || "Tehri Dam",
      dam_height_m,
      reservoir_volume_m3,
      hydraulic_head_m:  H_w,
      manning_n,
      breach_width_m,
      formation_time_hr: t_f,
      valley_width_m,
      bed_slope,
    },

    // Damage summary (derived from Q_p)
    damage_assessment: {
      scenario_name: "Tehri Dam Downstream Impact (Local Estimate)",
      hazard_metrics: {
        max_flood_depth_m:   estimatePeakDepth(Q_p, 0.1, manning_n, valley_width_m, bed_slope),
        peak_velocity_ms:    Math.round(Math.pow(Q_p / valley_width_m, 0.4) * 1.8 * 10) / 10,
        hazard_level:        Q_p > 60000 ? "EXTREME" : Q_p > 30000 ? "HIGH" : "MODERATE",
      },
      exposure_and_loss: {
        population_at_risk:     settlements.reduce((s, st) => s + (st.population_exposed || 0), 0),
        total_economic_loss_crores_inr: Math.round(Q_p / 45000 * 4820 * 10) / 10,
      },
    },

    // Scientific metadata
    scientific_metadata: {
      model_name:         "Froehlich (2008) Empirical Breach + Kinematic Wave Propagation",
      validation_status:  "LOCAL_CALCULATION",
      dem_source:         "Copernicus GLO-30 DSM (planned integration)",
      hydrology_source:   "Empirical breach equations",
      note:               "All values are estimates from empirical equations. Not a calibrated numerical model.",
    },
  };
}

// --- CSV and GeoJSON export utilities ---

/**
 * Generate a CSV string from local calculation result settlements.
 */
export function generateCSV(result) {
  if (!result || !result.settlements) return "";
  const headers = ["settlement", "chainage_km", "arrival_time_min", "max_depth_m", "priority", "population_exposed"];
  const rows = result.settlements.map(s =>
    [s.name, s.chainage_km, s.arrival_time_min, s.max_depth_m, s.priority, s.population_exposed || 0].join(",")
  );
  const meta = [
    `# FloodLab Simulation Result — ${result.run_id}`,
    `# Mode: ${result.mode}`,
    `# Scenario: ${result.scenario_id}`,
    `# Peak Discharge: ${result.peak_discharge_m3s} m3/s`,
    `# Affected Area: ${result.affected_area_km2} km2`,
    `# Generated: ${result.computed_at}`,
    `# ${result.provenance?.disclaimer || ""}`,
    "",
  ];
  return [...meta, headers.join(","), ...rows].join("\n");
}

/**
 * Generate a GeoJSON FeatureCollection from local calculation result.
 */
export function generateGeoJSON(result) {
  if (!result) return null;

  const settlementFeatures = (result.settlements || []).map(s => ({
    type: "Feature",
    geometry: { type: "Point", coordinates: [s.lon, s.lat] },
    properties: {
      name:              s.name,
      chainage_km:       s.chainage_km,
      arrival_time_min:  s.arrival_time_min,
      max_depth_m:       s.max_depth_m,
      priority:          s.priority,
      population_exposed: s.population_exposed || 0,
      type:              s.type,
    },
  }));

  // Tehri corridor approximate flood extent polygon
  const floodExtent = {
    type: "Feature",
    geometry: {
      type: "Polygon",
      coordinates: [[
        [78.481, 30.378], [78.390, 30.340], [78.367, 30.312],
        [78.400, 30.200], [78.596, 30.148], [78.650, 30.165],
        [78.689, 30.164], [78.280, 30.090], [78.268, 30.087],
        [78.200, 30.010], [78.164, 29.945], [78.100, 29.920],
        [78.120, 29.900], [78.160, 29.940], [78.220, 30.020],
        [78.310, 30.100], [78.720, 30.180], [78.720, 30.180],
        [78.650, 30.200], [78.640, 30.160], [78.480, 30.300],
        [78.481, 30.378],
      ]],
    },
    properties: {
      name:            "Tehri Dam Flood Extent (Prototype Estimate)",
      scenario_id:     result.scenario_id,
      run_id:          result.run_id,
      peak_discharge:  result.peak_discharge_m3s,
      affected_area_km2: result.affected_area_km2,
      mode:            result.mode,
      disclaimer:      result.provenance?.disclaimer || "",
    },
  };

  return {
    type: "FeatureCollection",
    name: `FloodLab_Result_${result.run_id}`,
    crs: { type: "name", properties: { name: "urn:ogc:def:crs:OGC:1.3:CRS84" } },
    metadata: {
      run_id:        result.run_id,
      mode:          result.mode,
      generated_at:  result.computed_at,
      peak_discharge_m3s: result.peak_discharge_m3s,
      affected_area_km2:  result.affected_area_km2,
      disclaimer:    result.provenance?.disclaimer || "",
    },
    features: [floodExtent, ...settlementFeatures],
  };
}

/**
 * Trigger browser download of CSV file.
 */
export function downloadCSV(result, filename) {
  const csv = generateCSV(result);
  if (!csv) return;
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const url  = URL.createObjectURL(blob);
  const a    = document.createElement("a");
  a.href     = url;
  a.download = filename || `floodlab_${result?.run_id || "result"}_settlements.csv`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

/**
 * Trigger browser download of GeoJSON file.
 */
export function downloadGeoJSON(result, filename) {
  const gj = generateGeoJSON(result);
  if (!gj) return;
  const blob = new Blob([JSON.stringify(gj, null, 2)], { type: "application/geo+json" });
  const url  = URL.createObjectURL(blob);
  const a    = document.createElement("a");
  a.href     = url;
  a.download = filename || `floodlab_${result?.run_id || "result"}_flood_extent.geojson`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
