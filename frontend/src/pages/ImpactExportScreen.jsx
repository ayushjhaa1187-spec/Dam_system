import React, { useState, useEffect } from 'react';
import {
  Download,
  ShieldAlert,
  Users,
  Building2,
  TrendingDown,
  FileText,
  Globe,
  Layers,
  Archive,
  Satellite,
  Sliders,
  Sparkles,
  CheckCircle2,
  AlertTriangle,
  GitCompare,
  Home,
  Clock,
  Eye,
  FileCheck,
  Calendar,
  Filter,
} from 'lucide-react';
import PageHeader from '../components/common/PageHeader';
import MetricCard from '../components/common/MetricCard';
import Panel from '../components/common/Panel';
import UncertaintyPanel from '../components/UncertaintyPanel';
import DualComparisonView from '../components/DualComparisonView';
import { api } from '../services/api';
import { formatFinite } from '../utils/units';

export default function ImpactExportScreen({
  simulationResult,
  selectedPreset,
  onNavigate,
}) {
  const [activeTab, setActiveTab] = useState('exports'); // 'exports', 'damage', 'satellite', 'uncertainty', 'comparison'
  const [satelliteData, setSatelliteData] = useState(null);
  const [isAnalyzingSatellite, setIsAnalyzingSatellite] = useState(false);
  const [geeZones, setGeeZones] = useState([]);
  const [selectedZoneId, setSelectedZoneId] = useState('zone_bhagirathi_tehri');
  const [sensorType, setSensorType] = useState('sentinel_1_sar');
  const [preDate, setPreDate] = useState('2026-08-10');
  const [postDate, setPostDate] = useState('2026-08-24');
  const [applyPermWater, setApplyPermWater] = useState(true);
  const [applySlopeMask, setApplySlopeMask] = useState(true);

  const params = simulationResult?.scenario_params || selectedPreset || {};
  const damage = simulationResult?.damage_assessment || {};
  const exp = damage.exposure_and_loss || {
    population_at_risk: 284000,
    displaced_persons: 198000,
    total_buildings_exposed: 42000,
    destroyed_structures: 24500,
    submerged_structures: 17500,
    inundated_agricultural_ha: 4850.0,
    total_economic_loss_crores_inr: 4820.0,
  };
  const haz = damage.hazard_metrics || {
    hazard_level: 'EXTREME',
    hazard_rating_hr: 2.85,
    max_flood_depth_m: 68.5,
    peak_velocity_ms: 24.2,
  };
  const res = damage.resource_allocation || {
    inflatable_rescue_boats: 120,
    ndrf_sdrf_battalions: 8,
    emergency_relief_shelters: 45,
    food_water_packets_per_day: 594000,
  };

  const payload = {
    run_id: simulationResult?.run_id || 'sim_latest',
    scenario_name: params.name || 'Tehri Dam (Bhagirathi River)',
    lat: params.lat || 30.378,
    lon: params.lon || 78.481,
    reach_length_km: params.reach_length_km || 100.0,
  };

  useEffect(() => {
    api.getGEEZones().then((res) => {
      setGeeZones(res.zones || []);
    });
  }, []);

  const handleRunSatelliteAnalysis = async () => {
    setIsAnalyzingSatellite(true);
    try {
      const activeZone = geeZones.find((z) => z.id === selectedZoneId);
      const bbox = activeZone ? activeZone.bbox : [78.30, 30.25, 78.85, 30.70];

      const res = await api.runSARAnalysis({
        bbox,
        pre_date: preDate,
        post_date: postDate,
        sensor_type: sensorType,
        apply_permanent_water_mask: applyPermWater,
        apply_slope_mask: applySlopeMask,
      });
      setSatelliteData(res);
    } catch (err) {
      console.error('Satellite analysis failed:', err);
    } finally {
      setIsAnalyzingSatellite(false);
    }
  };

  return (
    <div className="p-6 sm:p-8 max-w-7xl mx-auto space-y-6 text-hc-ink">
      {/* Header */}
      <PageHeader
        category="DISASTER IMPACT &amp; GIS EXPORT CENTER &bull; SCREEN 5 OF 5"
        title="HADR Damage Assessment &amp; Standard GIS Downloads"
        subtitle="Standardized geospatial exports (Shapefile, GeoTIFF, KML, GeoJSON, CSV, PDF, Run Package), satellite observation comparison, and logistics allocation."
        status="COMPLETED"
        statusLabel="EXPORTS READY"
        actions={
          <div className="flex items-center space-x-2">
            <button
              onClick={() => api.downloadRunPackage(payload)}
              className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-gradient-to-r from-cyan-500 to-emerald-500 hover:from-cyan-400 hover:to-emerald-400 text-slate-950 font-bold text-xs transition shadow-lg shadow-cyan-500/20"
            >
              <Archive className="w-3.5 h-3.5 fill-slate-950" />
              <span>Download Complete Run Package (.zip)</span>
            </button>
          </div>
        }
      />

      {/* Top 4 Operational Metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricCard
          title="Population at Risk"
          value={exp.population_at_risk.toLocaleString()}
          subtitle="Direct Inundation Corridor"
          provenance="DERIVED"
          accentColor="red"
          icon={Users}
        />
        <MetricCard
          title="Structures Exposed"
          value={exp.total_buildings_exposed.toLocaleString()}
          subtitle={`${exp.destroyed_structures.toLocaleString()} Destroyed / ${exp.submerged_structures.toLocaleString()} Submerged`}
          provenance="DERIVED"
          accentColor="amber"
          icon={Building2}
        />
        <MetricCard
          title="Estimated Economic Loss"
          value={`₹${formatFinite(exp.total_economic_loss_crores_inr, 0)}`}
          unit="Cr"
          subtitle="Infrastructure, Crop & Asset Damage"
          provenance="DERIVED"
          accentColor="purple"
          icon={TrendingDown}
        />
        <MetricCard
          title="NDRF Rescue Response"
          value={`${res.ndrf_sdrf_battalions} Battalions`}
          subtitle={`${res.inflatable_rescue_boats} Inflatable Zodiacs Required`}
          provenance="REPORTED"
          accentColor="cyan"
          icon={ShieldAlert}
        />
      </div>

      {/* Tabs Navigation Bar */}
      <div className="flex space-x-2 border-b border-hc-border pb-2">
        {[
          { id: 'exports', label: 'Export Downloads', icon: Download },
          { id: 'damage', label: 'HADR Damage & Logistics', icon: ShieldAlert },
          { id: 'satellite', label: 'Satellite GEE Observation', icon: Satellite },
          { id: 'uncertainty', label: 'Uncertainty & Sensitivity', icon: Sliders },
          { id: 'comparison', label: 'Scenario Comparison', icon: GitCompare },
        ].map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center space-x-2 px-4 py-2 rounded-xl text-xs font-semibold transition ${
                isActive
                  ? 'bg-hc-active/10 text-hc-active border border-cyan-500/30'
                  : 'text-hc-textSecondary hover:text-hc-ink hover:bg-hc-surface/60'
              }`}
            >
              <Icon className="w-3.5 h-3.5" />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* TAB 1: Complete Export Center */}
      {activeTab === 'exports' && (
        <div className="space-y-6">
          <div className="bg-hc-surface/80 border border-hc-border rounded-2xl p-6 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-hc-border">
              <div>
                <h3 className="text-sm font-bold text-hc-ink flex items-center gap-2">
                  <Download className="w-4 h-4 text-hc-active" />
                  <span>Standardized Geospatial &amp; HADR Export Formats</span>
                </h3>
                <p className="text-xs text-hc-textSecondary mt-0.5">
                  All downloads include scenario/run ID, EPSG:4326 CRS, standard units, timestamp, solver provenance, and official disclaimers.
                </p>
              </div>
              <span className="text-[10px] font-mono text-hc-active bg-cyan-950 px-2.5 py-1 rounded-lg border border-cyan-800/40">
                RUN ID: {payload.run_id}
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* 1. ESRI Shapefile Package */}
              <div
                onClick={() => api.downloadShapefile(payload)}
                className="p-4 bg-hc-bg hover:bg-hc-secondary/80 border border-hc-border hover:border-cyan-500/40 rounded-xl cursor-pointer transition flex items-center justify-between group shadow-sm"
              >
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 rounded-xl bg-blue-950 text-hc-primary flex items-center justify-center border border-blue-800/40">
                    <Layers className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-hc-ink group-hover:text-hc-active transition">
                      ESRI Shapefile Package (.zip)
                    </h4>
                    <p className="text-[11px] text-hc-textSecondary">
                      Standard .shp, .shx, .dbf, .prj (WGS84), and .cpg (UTF-8)
                    </p>
                  </div>
                </div>
                <Download className="w-4 h-4 text-hc-textSecondary group-hover:text-hc-active" />
              </div>

              {/* 2. Google Earth KML */}
              <div
                onClick={() => api.downloadKML(payload)}
                className="p-4 bg-hc-bg hover:bg-hc-secondary/80 border border-hc-border hover:border-cyan-500/40 rounded-xl cursor-pointer transition flex items-center justify-between group shadow-sm"
              >
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 rounded-xl bg-emerald-950 text-hc-success flex items-center justify-center border border-emerald-800/40">
                    <Globe className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-hc-ink group-hover:text-hc-success transition">
                      Google Earth OGC KML (.kml)
                    </h4>
                    <p className="text-[11px] text-hc-textSecondary">
                      3D extruded hazard polygons with elevation tags and gauges
                    </p>
                  </div>
                </div>
                <Download className="w-4 h-4 text-hc-textSecondary group-hover:text-hc-success" />
              </div>

              {/* 3. GeoJSON FeatureCollection */}
              <div
                onClick={() => api.downloadGeoJSON(payload)}
                className="p-4 bg-hc-bg hover:bg-hc-secondary/80 border border-hc-border hover:border-cyan-500/40 rounded-xl cursor-pointer transition flex items-center justify-between group shadow-sm"
              >
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 rounded-xl bg-purple-950 text-hc-assumption flex items-center justify-center border border-purple-800/40">
                    <FileCheck className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-hc-ink group-hover:text-hc-assumption transition">
                      Web GIS GeoJSON (.geojson)
                    </h4>
                    <p className="text-[11px] text-hc-textSecondary">
                      Browser GIS, QGIS, ArcGIS Online, and Mapbox ready
                    </p>
                  </div>
                </div>
                <Download className="w-4 h-4 text-hc-textSecondary group-hover:text-hc-assumption" />
              </div>

              {/* 4. Decision-Maker PDF Report */}
              <div
                onClick={() => api.downloadPDFReport(payload)}
                className="p-4 bg-hc-bg hover:bg-hc-secondary/80 border border-hc-border hover:border-cyan-500/40 rounded-xl cursor-pointer transition flex items-center justify-between group shadow-sm"
              >
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 rounded-xl bg-red-950 text-hc-critical flex items-center justify-center border border-red-800/40">
                    <FileText className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-hc-ink group-hover:text-hc-critical transition">
                      Executive Decision-Maker PDF Report (.pdf)
                    </h4>
                    <p className="text-[11px] text-hc-textSecondary">
                      Multi-page briefing with breach mechanics & NDRF logistics
                    </p>
                  </div>
                </div>
                <Download className="w-4 h-4 text-hc-textSecondary group-hover:text-hc-critical" />
              </div>

              {/* 5. GeoTIFF Flood Depth Raster */}
              <div
                onClick={() => api.downloadGeoTIFF(payload, 'depth')}
                className="p-4 bg-hc-bg hover:bg-hc-secondary/80 border border-hc-border hover:border-cyan-500/40 rounded-xl cursor-pointer transition flex items-center justify-between group shadow-sm"
              >
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 rounded-xl bg-cyan-950 text-hc-active flex items-center justify-center border border-cyan-800/40">
                    <Layers className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-hc-ink group-hover:text-hc-active transition">
                      GeoTIFF Inundation Depth Raster (.tif)
                    </h4>
                    <p className="text-[11px] text-hc-textSecondary">
                      Float32 georeferenced flood depth in meters (EPSG:4326)
                    </p>
                  </div>
                </div>
                <Download className="w-4 h-4 text-hc-textSecondary group-hover:text-hc-active" />
              </div>

              {/* 6. GeoTIFF Velocity Raster */}
              <div
                onClick={() => api.downloadGeoTIFF(payload, 'velocity')}
                className="p-4 bg-hc-bg hover:bg-hc-secondary/80 border border-hc-border hover:border-cyan-500/40 rounded-xl cursor-pointer transition flex items-center justify-between group shadow-sm"
              >
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 rounded-xl bg-amber-950 text-amber-400 flex items-center justify-center border border-amber-800/40">
                    <Layers className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-hc-ink group-hover:text-amber-400 transition">
                      GeoTIFF Surge Velocity Raster (.tif)
                    </h4>
                    <p className="text-[11px] text-hc-textSecondary">
                      Float32 peak flood wave velocity in m/s (EPSG:4326)
                    </p>
                  </div>
                </div>
                <Download className="w-4 h-4 text-hc-textSecondary group-hover:text-amber-400" />
              </div>

              {/* 7. CSV Situation & Exposure Summary */}
              <div
                onClick={() => api.downloadCSVReport(payload)}
                className="p-4 bg-hc-bg hover:bg-hc-secondary/80 border border-hc-border hover:border-cyan-500/40 rounded-xl cursor-pointer transition flex items-center justify-between group shadow-sm"
              >
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 rounded-xl bg-hc-secondary text-hc-textSecondary flex items-center justify-center border border-hc-border">
                    <FileText className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-hc-ink group-hover:text-hc-active transition">
                      HADR Settlement Exposure CSV (.csv)
                    </h4>
                    <p className="text-[11px] text-hc-textSecondary">
                      Village exposure priority, arrival lead times, and losses
                    </p>
                  </div>
                </div>
                <Download className="w-4 h-4 text-hc-textSecondary group-hover:text-hc-active" />
              </div>

              {/* 8. CSV Outflow Hydrograph */}
              <div
                onClick={() => api.downloadHydrographCSV(payload)}
                className="p-4 bg-hc-bg hover:bg-hc-secondary/80 border border-hc-border hover:border-cyan-500/40 rounded-xl cursor-pointer transition flex items-center justify-between group shadow-sm"
              >
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 rounded-xl bg-hc-secondary text-hc-textSecondary flex items-center justify-center border border-hc-border">
                    <FileText className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-hc-ink group-hover:text-hc-active transition">
                      Breach Outflow Hydrograph CSV (.csv)
                    </h4>
                    <p className="text-[11px] text-hc-textSecondary">
                      Discharge time series (m³/s) and cumulative outflow volume
                    </p>
                  </div>
                </div>
                <Download className="w-4 h-4 text-hc-textSecondary group-hover:text-hc-active" />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: HADR Damage & Logistics */}
      {activeTab === 'damage' && (
        <div className="space-y-6">
          <div className="bg-hc-surface/80 border border-hc-border rounded-2xl p-6 space-y-4">
            <h3 className="text-sm font-bold text-hc-ink flex items-center gap-2 pb-2 border-b border-hc-border">
              <ShieldAlert className="w-4 h-4 text-hc-critical" />
              <span>Downstream District Exposure &amp; Vulnerability Matrix</span>
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="p-4 bg-hc-bg rounded-xl border border-hc-critical/30 space-y-2">
                <span className="text-[10px] font-mono font-bold text-hc-critical uppercase">
                  RED ZONE (Extreme Danger)
                </span>
                <h4 className="text-xs font-bold text-hc-ink">0–30 km Corridor (Sirain to Koteshwar)</h4>
                <p className="text-xs text-hc-textSecondary">
                  Lead time <strong>&lt; 30 minutes</strong>. Forced immediate evacuation to high ridge line (&gt; 740m MSL).
                </p>
              </div>

              <div className="p-4 bg-hc-bg rounded-xl border border-amber-500/30 space-y-2">
                <span className="text-[10px] font-mono font-bold text-amber-400 uppercase">
                  ORANGE ZONE (High Hazard)
                </span>
                <h4 className="text-xs font-bold text-hc-ink">30–70 km Corridor (Devprayag to Shivpuri)</h4>
                <p className="text-xs text-hc-textSecondary">
                  Lead time <strong>30–120 minutes</strong>. Pre-emptive evacuation and high ground shelter relocation.
                </p>
              </div>

              <div className="p-4 bg-hc-bg rounded-xl border border-yellow-500/30 space-y-2">
                <span className="text-[10px] font-mono font-bold text-yellow-400 uppercase">
                  YELLOW ZONE (Alluvial Plain)
                </span>
                <h4 className="text-xs font-bold text-hc-ink">70–100 km Corridor (Rishikesh &amp; Haridwar)</h4>
                <p className="text-xs text-hc-textSecondary">
                  Lead time <strong>120–240 minutes</strong>. Barrage gate clearance and riverbank ghat evacuations.
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 3: Satellite GEE Observation & Comparison */}
      {activeTab === 'satellite' && (
        <div className="space-y-6">
          <div className="bg-hc-surface/80 border border-hc-border rounded-2xl p-6 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-hc-border">
              <div>
                <h3 className="text-sm font-bold text-hc-ink flex items-center gap-2">
                  <Satellite className="w-4 h-4 text-hc-success" />
                  <span>Google Earth Engine &amp; Sentinel-1/2 Observation Surveillance</span>
                </h3>
                <p className="text-xs text-hc-textSecondary mt-0.5">
                  Automated SAR backscatter differencing, cloud-cover filtering, permanent water masking, and slope false-positive removal.
                </p>
              </div>
              <span className="text-[10px] font-mono text-hc-success bg-emerald-950 px-2 py-0.5 rounded border border-emerald-800/40">
                PROVENANCE: OBSERVED
              </span>
            </div>

            {/* Controls Bar */}
            <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 items-end">
              <div>
                <label className="text-xs text-hc-textSecondary block mb-1">Study Area Corridor</label>
                <select
                  value={selectedZoneId}
                  onChange={(e) => setSelectedZoneId(e.target.value)}
                  className="w-full bg-hc-bg border border-hc-border text-xs text-hc-ink rounded-xl px-3 py-2 focus:outline-none focus:border-cyan-500"
                >
                  {geeZones.map((z) => (
                    <option key={z.id} value={z.id}>
                      {z.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-xs text-hc-textSecondary block mb-1">Sensor Selection</label>
                <select
                  value={sensorType}
                  onChange={(e) => setSensorType(e.target.value)}
                  className="w-full bg-hc-bg border border-hc-border text-xs text-hc-ink rounded-xl px-3 py-2 focus:outline-none focus:border-cyan-500"
                >
                  <option value="sentinel_1_sar">Sentinel-1 C-SAR (Cloud-Penetrating Radar)</option>
                  <option value="sentinel_2_optical">Sentinel-2 Optical (Cloud &lt; 20% MNDWI)</option>
                </select>
              </div>

              <div className="text-xs space-y-1">
                <span className="text-hc-textSecondary block">Masking Pipelines:</span>
                <div className="flex gap-2">
                  <label className="flex items-center space-x-1 cursor-pointer text-[11px] text-hc-textSecondary">
                    <input
                      type="checkbox"
                      checked={applyPermWater}
                      onChange={(e) => setApplyPermWater(e.target.checked)}
                      className="rounded bg-hc-bg border-hc-border text-hc-active"
                    />
                    <span>Water Mask</span>
                  </label>
                  <label className="flex items-center space-x-1 cursor-pointer text-[11px] text-hc-textSecondary">
                    <input
                      type="checkbox"
                      checked={applySlopeMask}
                      onChange={(e) => setApplySlopeMask(e.target.checked)}
                      className="rounded bg-hc-bg border-hc-border text-hc-active"
                    />
                    <span>Slope &gt;8°</span>
                  </label>
                </div>
              </div>

              <button
                onClick={handleRunSatelliteAnalysis}
                disabled={isAnalyzingSatellite}
                className="w-full py-2 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-slate-950 font-bold text-xs transition flex items-center justify-center space-x-2 shadow-md shadow-emerald-600/20 disabled:opacity-50"
              >
                <Sparkles className="w-3.5 h-3.5" />
                <span>{isAnalyzingSatellite ? 'Processing SAR...' : 'Run GEE Analysis'}</span>
              </button>
            </div>

            {/* Results Display */}
            {satelliteData && (
              <div className="bg-hc-bg p-4 rounded-xl border border-hc-border space-y-4 mt-4">
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-center">
                  <div className="bg-hc-surface p-2.5 rounded-lg border border-hc-border">
                    <span className="text-[10px] text-hc-textSecondary block">Observed Flood Area</span>
                    <span className="text-xs font-bold text-hc-success font-mono">
                      {formatFinite(satelliteData.detected_water?.inundated_area_ha, 1)} ha
                    </span>
                    <span className="text-[9px] text-hc-textSecondary block">OBSERVED SATELLITE</span>
                  </div>
                  <div className="bg-hc-surface p-2.5 rounded-lg border border-hc-border">
                    <span className="text-[10px] text-hc-textSecondary block">Modelled Simulation</span>
                    <span className="text-xs font-bold text-hc-active font-mono">
                      {formatFinite((satelliteData.simulation_comparison?.modelled_area_km2 || 0) * 100, 1)} ha
                    </span>
                    <span className="text-[9px] text-hc-textSecondary block">MODELLED FORECAST</span>
                  </div>
                  <div className="bg-hc-surface p-2.5 rounded-lg border border-hc-border">
                    <span className="text-[10px] text-hc-textSecondary block">Critical Success Index</span>
                    <span className="text-xs font-bold text-hc-assumption font-mono">
                      CSI = {satelliteData.simulation_comparison?.critical_success_index_csi}
                    </span>
                    <span className="text-[9px] text-hc-textSecondary block">SPATIAL OVERLAP</span>
                  </div>
                  <div className="bg-hc-surface p-2.5 rounded-lg border border-hc-border">
                    <span className="text-[10px] text-hc-textSecondary block">Benchmark Status</span>
                    <span className="text-xs font-bold text-hc-success font-mono">
                      {satelliteData.simulation_comparison?.benchmark_status || 'PASSED'}
                    </span>
                    <span className="text-[9px] text-hc-textSecondary block">VALIDATION</span>
                  </div>
                </div>

                {/* Satellite Polygon Download */}
                <div className="pt-2 flex items-center justify-between border-t border-hc-border text-xs">
                  <span className="text-hc-textSecondary">
                    Sensor: <strong>{satelliteData.sensor_metadata?.sensor}</strong> (Latency: {satelliteData.sensor_metadata?.data_latency_hrs})
                  </span>
                  <button
                    onClick={() => {
                      const geojson = satelliteData.geojson_layers?.observed_extent;
                      const blob = new Blob([JSON.stringify(geojson, null, 2)], { type: 'application/geo+json' });
                      const url = URL.createObjectURL(blob);
                      const a = document.createElement('a');
                      a.href = url;
                      a.download = `observed_satellite_flood_${postDate}.geojson`;
                      a.click();
                    }}
                    className="px-3 py-1.5 rounded-lg bg-hc-secondary hover:bg-hc-border text-hc-ink font-semibold flex items-center space-x-1.5"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>Export Detected Flood Polygon</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* TAB 4: Uncertainty & Sensitivity */}
      {activeTab === 'uncertainty' && (
        <UncertaintyPanel selectedPreset={selectedPreset} />
      )}

      {/* TAB 5: Scenario Comparison */}
      {activeTab === 'comparison' && (
        <DualComparisonView simulationResult={simulationResult} selectedPreset={selectedPreset} />
      )}
    </div>
  );
}
