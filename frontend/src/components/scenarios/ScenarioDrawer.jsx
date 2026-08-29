import React, { useState, useEffect } from 'react';
import {
  Mountain,
  Layers,
  Gauge,
  Cpu,
  CheckCircle2,
  Play,
  RefreshCw,
  Info,
  Zap,
  Waves,
  Globe,
  Upload,
  FlaskConical,
  Compass,
} from 'lucide-react';
import Drawer from '../common/Drawer';
import ProvenanceBadge from '../common/ProvenanceBadge';
import ValidationBadge from '../common/ValidationBadge';
import { api } from '../../services/api';
import { formatFinite } from '../../utils/units';

export default function ScenarioDrawer({
  isOpen,
  onClose,
  selectedPreset,
  presets = [],
  onSelectPreset,
  simulationEngine = 'rapid_screening',
  onSelectEngine,
  onRunSimulation,
  isSimulating,
}) {
  const [activeTab, setActiveTab] = useState('engine');
  const [formData, setFormData] = useState({
    dam_name: 'Tehri Dam (Bhagirathi River)',
    dam_type: 'rockfill',
    dam_height_m: 260.5,
    reservoir_volume_m3: 3540000000.0,
    hydraulic_head_m: 260.0,
    crest_length_m: 575.0,
    breach_mode: 'overtopping',
    reach_length_km: 100.0,
    valley_width_m: 450.0,
    bed_slope: 0.0055,
    manning_n: 0.042,
    valley_type: 'mountain_gorge',
    solver_type: 'coupled',
    breach_model: 'auto',
    simulation_engine: 'rapid_screening',
    dem_source: 'Copernicus GLO-30 DSM',
    dem_resolution_m: 30.0,
    hydrology_source: 'CWC Gauge Records / IMD 24h PMP',
    time_step_s: 1.0,
    grid_or_particle_resolution: 'Cell dx = 30m',
    downstream_boundary: 'Free Outflow / Stage-Discharge Rating Curve',
  });

  const [breachResult, setBreachResult] = useState(null);
  const [isCalculatingBreach, setIsCalculatingBreach] = useState(false);

  useEffect(() => {
    if (selectedPreset) {
      const updated = {
        dam_name: selectedPreset.name || selectedPreset.dam_name || 'Tehri Dam',
        dam_type: selectedPreset.dam_type || 'rockfill',
        dam_height_m: selectedPreset.dam_height_m || 260.5,
        reservoir_volume_m3: selectedPreset.reservoir_volume_m3 || 3540000000.0,
        hydraulic_head_m: selectedPreset.hydraulic_head_m || 260.0,
        crest_length_m: selectedPreset.crest_length_m || 575.0,
        breach_mode: selectedPreset.breach_mode || 'overtopping',
        reach_length_km: selectedPreset.reach_length_km || 100.0,
        valley_width_m: selectedPreset.valley_width_m || 450.0,
        bed_slope: selectedPreset.bed_slope || 0.0055,
        manning_n: selectedPreset.manning_n || 0.042,
        valley_type: selectedPreset.valley_type || 'mountain_gorge',
        solver_type: 'coupled',
        breach_model: 'auto',
        simulation_engine: simulationEngine || 'rapid_screening',
        dem_source: selectedPreset.dem_source || 'Copernicus GLO-30 DSM',
        dem_resolution_m: selectedPreset.dem_resolution_m || 30.0,
        hydrology_source: selectedPreset.hydrology_source || 'CWC Gauge Records / IMD 24h PMP',
        time_step_s: simulationEngine === 'sph' ? 0.025 : simulationEngine === 'delft3d' ? 1.0 : 5.0,
        grid_or_particle_resolution: simulationEngine === 'sph' ? 'Particle Spacing dx = 2.5m' : 'Grid dx = 30m',
        downstream_boundary: 'Free Outflow / Stage-Discharge Rating Curve',
      };
      setFormData(updated);
      recalcBreach(updated);
    }
  }, [selectedPreset, simulationEngine]);

  const recalcBreach = async (data) => {
    setIsCalculatingBreach(true);
    try {
      const res = await api.calculateBreach({
        dam_name: data.dam_name,
        dam_type: data.dam_type,
        dam_height_m: Number(data.dam_height_m),
        reservoir_volume_m3: Number(data.reservoir_volume_m3),
        hydraulic_head_m: Number(data.hydraulic_head_m),
        crest_length_m: Number(data.crest_length_m),
        breach_mode: data.breach_mode,
        model_override: data.breach_model,
      });
      setBreachResult(res);
    } catch (err) {
      console.error('Breach calculation error:', err);
    } finally {
      setIsCalculatingBreach(false);
    }
  };

  const handleInputChange = (field, value) => {
    const nextData = { ...formData, [field]: value };
    setFormData(nextData);
    if (
      [
        'dam_height_m',
        'reservoir_volume_m3',
        'hydraulic_head_m',
        'crest_length_m',
        'breach_mode',
        'dam_type',
        'breach_model',
      ].includes(field)
    ) {
      recalcBreach(nextData);
    }
  };

  const handleRun = () => {
    if (onSelectEngine && formData.simulation_engine) {
      onSelectEngine(formData.simulation_engine);
    }
    onRunSimulation({
      scenario_id: selectedPreset?.id,
      preset_id: selectedPreset?.id,
      simulation_engine: formData.simulation_engine,
      custom_params: formData,
      solver_type: formData.solver_type,
      breach_model: formData.breach_model,
      dem_source: formData.dem_source,
      dem_resolution_m: formData.dem_resolution_m,
      hydrology_source: formData.hydrology_source,
      time_step_s: formData.time_step_s,
      grid_or_particle_resolution: formData.grid_or_particle_resolution,
      downstream_boundary: formData.downstream_boundary,
    });
    onClose();
  };

  return (
    <Drawer
      isOpen={isOpen}
      onClose={onClose}
      title="Scenario &amp; Scientific Physics Configuration"
      subtitle="Configure hydrodynamic simulation engine, DEM topography, discretization, and breach mechanics."
      width="max-w-2xl"
      footer={
        <>
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-medium text-slate-300 transition"
          >
            Cancel
          </button>
          <button
            onClick={handleRun}
            disabled={isSimulating}
            className="px-5 py-2 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold text-xs flex items-center gap-2 transition disabled:opacity-50"
          >
            {isSimulating ? (
              <>
                <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                <span>Running Solver...</span>
              </>
            ) : (
              <>
                <Play className="w-3.5 h-3.5 fill-slate-950" />
                <span>Execute Scenario</span>
              </>
            )}
          </button>
        </>
      }
    >
      <div className="space-y-6">
        {/* Preset Selector */}
        <div>
          <label className="text-xs font-semibold text-slate-300 block mb-1.5">
            Base Scenario Preset
          </label>
          <select
            value={selectedPreset?.id || ''}
            onChange={(e) => onSelectPreset(e.target.value)}
            className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 text-xs font-medium text-slate-200 focus:outline-none focus:border-cyan-500 transition"
          >
            {presets.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name} ({p.river || 'Himalayan Basin'})
              </option>
            ))}
          </select>
        </div>

        {/* Tab Navigation */}
        <div className="flex border-b border-slate-800 gap-1">
          {[
            { id: 'engine', label: 'Engine & Discretization', icon: Cpu },
            { id: 'geometry', label: 'Dam Structure', icon: Mountain },
            { id: 'hydraulics', label: 'Valley & Friction', icon: Layers },
            { id: 'breach', label: 'Breach Mechanics', icon: Gauge },
          ].map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-1.5 px-3 py-2 text-xs font-medium border-b-2 transition ${
                  isActive
                    ? 'border-cyan-400 text-cyan-400 font-bold'
                    : 'border-transparent text-slate-400 hover:text-slate-200'
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>

        {/* Tab 0: Simulation Engine & Scientific Discretization */}
        {activeTab === 'engine' && (
          <div className="space-y-4">
            <div>
              <label className="text-xs font-bold text-slate-200 block mb-1.5">
                Simulation Engine Selection
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                {[
                  {
                    id: 'rapid_screening',
                    name: 'Rapid Screening Model',
                    desc: 'Simplified SWE / empirical kinematic estimate for fast scenario exploration',
                    tier: 'screening',
                    icon: Zap,
                  },
                  {
                    id: 'sph',
                    name: 'SPH Lagrangian Model',
                    desc: 'DualSPHysics 3D/2D particle solver capturing near-field wave fronts',
                    tier: 'calibrated',
                    icon: Waves,
                  },
                  {
                    id: 'delft3d',
                    name: 'Delft3D / D-Flow FM',
                    desc: 'Eulerian flexible-mesh 2D shallow water hydrodynamic propagation',
                    tier: 'validated',
                    icon: Globe,
                  },
                  {
                    id: 'imported',
                    name: 'Imported Result Grid',
                    desc: 'Pre-computed external GeoTIFF, NetCDF, or Shapefile dataset',
                    tier: 'validated',
                    icon: Upload,
                  },
                  {
                    id: 'demo',
                    name: 'Demo Mode (Illustrative)',
                    desc: 'Fast synthetic demo preview — strictly non-operational',
                    tier: 'demo',
                    icon: FlaskConical,
                  },
                ].map((eng) => {
                  const isSelected = formData.simulation_engine === eng.id;
                  const Icon = eng.icon;
                  return (
                    <button
                      key={eng.id}
                      type="button"
                      onClick={() => handleInputChange('simulation_engine', eng.id)}
                      className={`p-3 rounded-xl text-left border transition flex flex-col justify-between ${
                        isSelected
                          ? 'bg-cyan-950/40 border-cyan-500 text-slate-100 shadow-md shadow-cyan-500/10'
                          : 'bg-slate-950 border-slate-800 text-slate-300 hover:border-slate-700'
                      }`}
                    >
                      <div className="flex items-center justify-between mb-1">
                        <div className="flex items-center gap-1.5 font-bold text-xs text-slate-100">
                          <Icon className="w-3.5 h-3.5 text-cyan-400" />
                          <span>{eng.name}</span>
                        </div>
                        <ValidationBadge status={eng.tier} compact showIcon={false} />
                      </div>
                      <p className="text-[10px] text-slate-400 leading-snug">{eng.desc}</p>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* DEM Topography & Hydrology Source */}
            <div className="grid grid-cols-2 gap-4 pt-2 border-t border-slate-800/80">
              <div>
                <label className="text-xs text-slate-400 block mb-1">DEM Topography Source</label>
                <select
                  value={formData.dem_source}
                  onChange={(e) => {
                    const src = e.target.value;
                    const res = src.includes('10m') ? 10.0 : src.includes('1m') ? 1.0 : 30.0;
                    setFormData({ ...formData, dem_source: src, dem_resolution_m: res });
                  }}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-200"
                >
                  <option value="Copernicus GLO-30 DSM">Copernicus GLO-30 DSM (30m)</option>
                  <option value="SRTM 1 Arc-Sec (30m)">NASA SRTM 1-ArcSec (30m)</option>
                  <option value="ALOS World 3D (AW3D30)">JAXA ALOS AW3D30 (30m)</option>
                  <option value="CartoDEM v3R1 (10m)">ISRO CartoDEM v3R1 (10m)</option>
                  <option value="Drone LiDAR DEM (1m)">Custom Drone LiDAR DEM (1m)</option>
                </select>
              </div>

              <div>
                <label className="text-xs text-slate-400 block mb-1">Hydrological Data Source</label>
                <select
                  value={formData.hydrology_source}
                  onChange={(e) => handleInputChange('hydrology_source', e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-200"
                >
                  <option value="CWC Gauge Records / IMD 24h PMP">CWC Gauge Records / IMD 24h PMP</option>
                  <option value="SCS Curve Number &amp; Snyder UH">SCS Curve Number &amp; Snyder UH</option>
                  <option value="ERA5-Land Hourly Hydrograph">ERA5-Land Hourly Hydrograph</option>
                  <option value="Observed High-Water Marks">Observed High-Water Marks (Benchmark)</option>
                </select>
              </div>

              <div>
                <label className="text-xs text-slate-400 block mb-1">Integration Time Step ($\Delta t$) [s]</label>
                <input
                  type="number"
                  step="0.01"
                  value={formData.time_step_s}
                  onChange={(e) => handleInputChange('time_step_s', parseFloat(e.target.value) || 1.0)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs font-mono text-cyan-400"
                />
              </div>

              <div>
                <label className="text-xs text-slate-400 block mb-1">Downstream Boundary Condition</label>
                <select
                  value={formData.downstream_boundary}
                  onChange={(e) => handleInputChange('downstream_boundary', e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-200"
                >
                  <option value="Free Outflow / Stage-Discharge Rating Curve">Free Outflow / Rating Curve</option>
                  <option value="Normal Depth (Bed Slope S0 = 0.0055)">Normal Depth (Bed Slope S0)</option>
                  <option value="Sommerfeld Open Radiation Condition">Sommerfeld Open Radiation</option>
                </select>
              </div>
            </div>
          </div>
        )}

        {/* Tab 1: Dam & Reservoir Geometry */}
        {activeTab === 'geometry' && (
          <div className="space-y-4">
            <div>
              <label className="text-xs text-slate-400 block mb-1">Dam Structure Name</label>
              <input
                type="text"
                value={formData.dam_name}
                onChange={(e) => handleInputChange('dam_name', e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-cyan-500"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-xs text-slate-400 block mb-1">
                  Dam Type <ProvenanceBadge level="REPORTED" />
                </label>
                <select
                  value={formData.dam_type}
                  onChange={(e) => handleInputChange('dam_type', e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-200"
                >
                  <option value="rockfill">Embankment (Earth / Rockfill)</option>
                  <option value="concrete_gravity">Concrete Gravity Dam</option>
                  <option value="arch_dam">Concrete Arch Dam</option>
                  <option value="landslide_dam">Natural Landslide Dam</option>
                </select>
              </div>

              <div>
                <label className="text-xs text-slate-400 block mb-1">
                  Structural Height ($h_d$) [m]
                </label>
                <input
                  type="number"
                  step="0.5"
                  value={formData.dam_height_m}
                  onChange={(e) => handleInputChange('dam_height_m', parseFloat(e.target.value))}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs font-mono text-cyan-400"
                />
              </div>

              <div>
                <label className="text-xs text-slate-400 block mb-1">
                  Hydraulic Head ($h_w$) [m]
                </label>
                <input
                  type="number"
                  step="0.5"
                  value={formData.hydraulic_head_m}
                  onChange={(e) => handleInputChange('hydraulic_head_m', parseFloat(e.target.value))}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs font-mono text-cyan-400"
                />
              </div>

              <div>
                <label className="text-xs text-slate-400 block mb-1">
                  Reservoir Storage (Vw) [m³]
                </label>
                <input
                  type="number"
                  step="1000000"
                  value={formData.reservoir_volume_m3}
                  onChange={(e) => handleInputChange('reservoir_volume_m3', parseFloat(e.target.value))}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs font-mono text-cyan-400"
                />
                <span className="text-[10px] text-slate-400 mt-0.5 block">
                  {formatFinite(formData.reservoir_volume_m3 / 1e9, 2)} BCM
                </span>
              </div>
            </div>
          </div>
        )}

        {/* Tab 2: Hydraulics & Valley Friction */}
        {activeTab === 'hydraulics' && (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-xs text-slate-400 block mb-1">
                  Reach Length [km]
                </label>
                <input
                  type="number"
                  value={formData.reach_length_km}
                  onChange={(e) => handleInputChange('reach_length_km', parseFloat(e.target.value))}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs font-mono text-cyan-400"
                />
              </div>

              <div>
                <label className="text-xs text-slate-400 block mb-1">
                  Mean Valley Width [m]
                </label>
                <input
                  type="number"
                  value={formData.valley_width_m}
                  onChange={(e) => handleInputChange('valley_width_m', parseFloat(e.target.value))}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs font-mono text-cyan-400"
                />
              </div>

              <div>
                <label className="text-xs text-slate-400 block mb-1">
                  Bed Slope (S0) [m/m]
                </label>
                <input
                  type="number"
                  step="0.001"
                  value={formData.bed_slope}
                  onChange={(e) => handleInputChange('bed_slope', parseFloat(e.target.value))}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs font-mono text-cyan-400"
                />
              </div>

              <div>
                <label className="text-xs text-slate-400 block mb-1">
                  Manning Friction Roughness (n) <ProvenanceBadge level="ASSUMED" />
                </label>
                <input
                  type="number"
                  step="0.002"
                  value={formData.manning_n}
                  onChange={(e) => handleInputChange('manning_n', parseFloat(e.target.value))}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs font-mono text-cyan-400"
                />
              </div>
            </div>
          </div>
        )}

        {/* Tab 3: Breach Mechanics */}
        {activeTab === 'breach' && (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-xs text-slate-400 block mb-1">Breach Mode</label>
                <select
                  value={formData.breach_mode}
                  onChange={(e) => handleInputChange('breach_mode', e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-200"
                >
                  <option value="overtopping">Overtopping Failure</option>
                  <option value="piping">Internal Erosion / Piping</option>
                  <option value="instantaneous">Instantaneous Collapse (Ritter)</option>
                  <option value="landslide_outburst">Landslide Outburst</option>
                </select>
              </div>

              <div>
                <label className="text-xs text-slate-400 block mb-1">Breach Formulation</label>
                <select
                  value={formData.breach_model}
                  onChange={(e) => handleInputChange('breach_model', e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-200"
                >
                  <option value="auto">Auto-Select (Froehlich 2008)</option>
                  <option value="froehlich">Froehlich (2008)</option>
                  <option value="macdonald">MacDonald &amp; Langridge (1984)</option>
                  <option value="von_thun">Von Thun &amp; Gillette (1990)</option>
                  <option value="ritter">Ritter (1892) Instantaneous</option>
                </select>
              </div>
            </div>

            {/* Dynamic Breach Calculation Card */}
            {breachResult && (
              <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-3">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-semibold text-slate-200">
                    Empirical Breach Estimates ({breachResult.model_used})
                  </span>
                  <ProvenanceBadge level="MODELLED" />
                </div>
                <div className="grid grid-cols-3 gap-2 text-center">
                  <div className="p-2 rounded-lg bg-slate-900 border border-slate-800">
                    <span className="text-[10px] text-slate-400 block">Breach Width</span>
                    <span className="text-xs font-mono font-bold text-cyan-400">
                      {formatFinite(breachResult.avg_breach_width_m, 1)} m
                    </span>
                  </div>
                  <div className="p-2 rounded-lg bg-slate-900 border border-slate-800">
                    <span className="text-[10px] text-slate-400 block">Formation Time</span>
                    <span className="text-xs font-mono font-bold text-cyan-400">
                      {formatFinite(breachResult.formation_time_hrs || breachResult.breach_formation_time_hrs, 2)} hrs
                    </span>
                  </div>
                  <div className="p-2 rounded-lg bg-slate-900 border border-slate-800">
                    <span className="text-[10px] text-slate-400 block">Peak Qp</span>
                    <span className="text-xs font-mono font-bold text-red-400">
                      {formatFinite(breachResult.peak_discharge_m3s, 0)} m³/s
                    </span>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </Drawer>
  );
}
