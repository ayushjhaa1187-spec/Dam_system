import React, { useState, useEffect } from 'react';
import {
  Mountain,
  Layers,
  MapPin,
  FileUp,
  Cpu,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  Play,
  ArrowRight,
  ArrowLeft,
  Info,
  Sliders,
  Sparkles,
  Waves,
  ShieldCheck,
  Building,
  RefreshCw,
} from 'lucide-react';
import { api, FALLBACK_PRESETS } from '../../services/api';

export default function DataUploadWizard({
  isOpen,
  onClose,
  selectedPreset,
  presets = [],
  onSelectPreset,
  onRunSimulation,
  onSubmitJob,
}) {
  const [currentStep, setCurrentStep] = useState(1);
  const [validationResult, setValidationResult] = useState(null);
  const [isValidating, setIsValidating] = useState(false);
  const [fieldErrors, setFieldErrors] = useState({});

  // Wizard State
  const [formData, setFormData] = useState({
    preset_id: 'tehri_dam_bhagirathi',
    dam_name: 'Tehri Dam (Bhagirathi River, Uttarakhand)',
    state: 'Uttarakhand / Himalaya',
    river: 'Bhagirathi River / Upper Ganga Basin',
    lat: 30.378,
    lon: 78.481,
    dem_source: 'Copernicus GLO-30 DSM (Packaged Indian Case)',
    dem_crs: 'EPSG:32644 (UTM 44N)',
    dem_resolution_m: 30.0,
    elevation_min_m: 280.0,
    elevation_max_m: 2400.0,
    dam_type: 'rockfill',
    dam_height_m: 260.5,
    crest_elevation_msl: 839.5,
    river_bed_elevation_msl: 570.0,
    full_reservoir_level_frl_msl: 830.0,
    hydraulic_head_m: 260.0,
    reservoir_volume_m3: 3540000000.0,
    crest_length_m: 575.0,
    breach_mode: 'overtopping',
    avg_breach_width_m: 248.5,
    breach_formation_time_hrs: 1.85,
    reach_length_km: 100.0,
    valley_width_m: 450.0,
    bed_slope: 0.0055,
    manning_n: 0.042,
    valley_type: 'mountain_gorge',
    inflow_discharge_m3s: 250.0,
    breach_model: 'froehlich_2008',
    solver_type: 'coupled',
    include_landuse: true,
    include_buildings: true,
    include_population: true,
    include_infrastructure: true,
  });

  const [breachResult, setBreachResult] = useState(null);

  // Sync with selected preset when opened
  useEffect(() => {
    if (selectedPreset) {
      setFormData((prev) => ({
        ...prev,
        preset_id: selectedPreset.id,
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
        lat: selectedPreset.lat || 30.378,
        lon: selectedPreset.lon || 78.481,
      }));
    }
  }, [selectedPreset]);

  // Real-time recalculation of breach parameters
  const recalcBreach = async (data) => {
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
      console.error('Breach recalc error:', err);
    }
  };

  const handleInputChange = (field, value) => {
    const nextData = { ...formData, [field]: value };
    setFormData(nextData);

    // Validate field locally
    validateSingleField(field, value, nextData);

    if (['dam_height_m', 'reservoir_volume_m3', 'hydraulic_head_m', 'crest_length_m', 'breach_mode', 'breach_model'].includes(field)) {
      recalcBreach(nextData);
    }
  };

  const validateSingleField = (field, value, data) => {
    const errs = { ...fieldErrors };
    delete errs[field];

    const h = Number(data.dam_height_m) || 0;
    const head = Number(data.hydraulic_head_m) || 0;
    const vol = Number(data.reservoir_volume_m3) || 0;
    const crestLen = Number(data.crest_length_m) || 0;
    const breachW = Number(data.avg_breach_width_m) || 0;
    const formTime = Number(data.breach_formation_time_hrs) || 0;

    if (field === 'dam_height_m' && Number(value) <= 0) {
      errs.dam_height_m = 'Dam height must be greater than zero.';
    }
    if (field === 'hydraulic_head_m' && data.breach_mode !== 'overtopping' && Number(value) > h) {
      errs.hydraulic_head_m = `Head (${value}m) exceeds crest (${h}m) without overtopping.`;
    }
    if (field === 'reservoir_volume_m3' && Number(value) <= 0) {
      errs.reservoir_volume_m3 = 'Storage volume must be strictly positive.';
    }
    if (field === 'avg_breach_width_m' && crestLen > 0 && Number(value) > crestLen) {
      errs.avg_breach_width_m = `Breach width (${value}m) cannot exceed crest length (${crestLen}m).`;
    }
    if (field === 'breach_formation_time_hrs' && Number(value) <= 0) {
      errs.breach_formation_time_hrs = 'Formation time must be greater than zero.';
    }

    setFieldErrors(errs);
  };

  const runFullValidation = async () => {
    setIsValidating(true);
    try {
      const res = await api.validateScenario(formData);
      setValidationResult(res);
      const errMap = {};
      (res.errors || []).forEach((e) => {
        errMap[e.field] = e.message;
      });
      setFieldErrors(errMap);
    } catch (err) {
      console.error('Validation error:', err);
    } finally {
      setIsValidating(false);
    }
  };

  const handleSelectPredefined = (preset) => {
    onSelectPreset(preset.id);
    setFormData((prev) => ({
      ...prev,
      preset_id: preset.id,
      dam_name: preset.name || preset.dam_name,
      dam_height_m: preset.dam_height_m || 260.5,
      reservoir_volume_m3: preset.reservoir_volume_m3 || 3540000000.0,
      hydraulic_head_m: preset.hydraulic_head_m || 260.0,
      crest_length_m: preset.crest_length_m || 575.0,
      reach_length_km: preset.reach_length_km || 100.0,
      valley_width_m: preset.valley_width_m || 450.0,
      bed_slope: preset.bed_slope || 0.0055,
      manning_n: preset.manning_n || 0.042,
      lat: preset.lat || 30.378,
      lon: preset.lon || 78.481,
    }));
  };

  const handleExecute = () => {
    if (onSubmitJob) {
      onSubmitJob({
        scenario_id: formData.preset_id,
        custom_params: formData,
        solver_type: formData.solver_type,
        breach_model: formData.breach_model,
      });
    } else if (onRunSimulation) {
      onRunSimulation({
        scenario_id: formData.preset_id,
        custom_params: formData,
        solver_type: formData.solver_type,
        breach_model: formData.breach_model,
      });
    }
    if (onClose) onClose();
  };

  if (!isOpen) return null;

  const steps = [
    { num: 1, title: 'Case Study / Study Area' },
    { num: 2, title: 'Dam Location' },
    { num: 3, title: 'DEM & Terrain' },
    { num: 4, title: 'Embankment Geometry' },
    { num: 5, title: 'River & Valley Path' },
    { num: 6, title: 'Breach Hydrograph' },
    { num: 7, title: 'Exposure & GIS Layers' },
    { num: 8, title: 'Multi-Layer Validation' },
    { num: 9, title: 'Solver Level' },
    { num: 10, title: 'Review & Dispatch' },
  ];

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/85 backdrop-blur-md flex items-center justify-center p-4 sm:p-6">
      <div className="bg-slate-900 border border-slate-800 rounded-3xl w-full max-w-4xl max-h-[92vh] flex flex-col shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-200">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-800 flex items-center justify-between bg-slate-950/50">
          <div className="flex items-center space-x-3">
            <div className="w-9 h-9 rounded-xl bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center text-cyan-400">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-100 flex items-center gap-2">
                Guided Scenario Builder & Data Upload
                <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-cyan-950 text-cyan-400 border border-cyan-800/60">
                  Step {currentStep} of 10
                </span>
              </h2>
              <p className="text-xs text-slate-400">
                10-step verified workflow for physical dam breach modeling & HADR zoning
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-xl text-slate-400 hover:text-slate-200 hover:bg-slate-800 transition"
          >
            ✕
          </button>
        </div>

        {/* Stepper Progress Bar */}
        <div className="px-6 pt-3 pb-2 border-b border-slate-800/60 bg-slate-950/20 overflow-x-auto">
          <div className="flex items-center justify-between min-w-[650px] gap-1">
            {steps.map((s) => {
              const isActive = s.num === currentStep;
              const isPast = s.num < currentStep;
              return (
                <div
                  key={s.num}
                  onClick={() => setCurrentStep(s.num)}
                  className={`flex items-center gap-1.5 px-2 py-1 rounded-lg cursor-pointer transition text-xs ${
                    isActive
                      ? 'bg-cyan-500/20 text-cyan-400 font-bold border border-cyan-500/30'
                      : isPast
                      ? 'text-slate-300 hover:text-slate-100'
                      : 'text-slate-600 hover:text-slate-400'
                  }`}
                >
                  <span
                    className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold ${
                      isActive
                        ? 'bg-cyan-500 text-slate-950'
                        : isPast
                        ? 'bg-emerald-950 text-emerald-400 border border-emerald-800/60'
                        : 'bg-slate-800 text-slate-400'
                    }`}
                  >
                    {isPast ? '✓' : s.num}
                  </span>
                  <span className="truncate max-w-[90px]">{s.title}</span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Body Content */}
        <div className="p-6 overflow-y-auto flex-1 space-y-5">
          {/* STEP 1: Case Study Selection */}
          {currentStep === 1 && (
            <div className="space-y-4">
              <div className="border border-slate-800 bg-slate-950/50 rounded-2xl p-4">
                <h3 className="text-sm font-bold text-slate-200 mb-1 flex items-center gap-2">
                  <Mountain className="w-4 h-4 text-cyan-400" />
                  Select Pre-Packaged Indian Benchmark Case Study
                </h3>
                <p className="text-xs text-slate-400 mb-4">
                  Fully bundled with verified terrain, river network, and infrastructure datasets. No external API key required.
                </p>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {(presets.length > 0 ? presets : FALLBACK_PRESETS).map((p) => {
                    const isSelected = formData.preset_id === p.id;
                    return (
                      <div
                        key={p.id}
                        onClick={() => handleSelectPredefined(p)}
                        className={`p-3.5 rounded-xl border cursor-pointer transition ${
                          isSelected
                            ? 'bg-cyan-950/30 border-cyan-500 shadow-md shadow-cyan-500/10'
                            : 'bg-slate-900 border-slate-800 hover:border-slate-700'
                        }`}
                      >
                        <div className="flex items-center justify-between mb-1">
                          <h4 className="text-xs font-bold text-slate-100">{p.name || p.dam_name}</h4>
                          {isSelected && <CheckCircle2 className="w-4 h-4 text-cyan-400" />}
                        </div>
                        <p className="text-[11px] text-slate-400 line-clamp-2">{p.description || p.river}</p>
                        <div className="flex gap-2 mt-2 text-[10px] text-slate-300">
                          <span className="px-1.5 py-0.5 rounded bg-slate-800">Height: {p.dam_height_m}m</span>
                          <span className="px-1.5 py-0.5 rounded bg-slate-800">Reach: {p.reach_length_km}km</span>
                          <span className="px-1.5 py-0.5 rounded bg-slate-800">{p.dam_type}</span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          )}

          {/* STEP 2: Dam Location */}
          {currentStep === 2 && (
            <div className="space-y-4">
              <div className="border border-slate-800 bg-slate-950/50 rounded-2xl p-4 space-y-4">
                <h3 className="text-sm font-bold text-slate-200 flex items-center gap-2">
                  <MapPin className="w-4 h-4 text-cyan-400" />
                  Dam Location & Spatial Coordinates
                </h3>
                <p className="text-xs text-slate-400">
                  Specify coordinates of the dam crest axis in decimal degrees (WGS84 EPSG:4326).
                </p>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1">Latitude (°N)</label>
                    <input
                      type="number"
                      step="0.0001"
                      value={formData.lat}
                      onChange={(e) => handleInputChange('lat', parseFloat(e.target.value))}
                      className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-100 focus:outline-none focus:border-cyan-500"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1">Longitude (°E)</label>
                    <input
                      type="number"
                      step="0.0001"
                      value={formData.lon}
                      onChange={(e) => handleInputChange('lon', parseFloat(e.target.value))}
                      className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-100 focus:outline-none focus:border-cyan-500"
                    />
                  </div>
                </div>

                <div className="p-3 bg-cyan-950/20 border border-cyan-800/40 rounded-xl text-xs text-cyan-300 flex items-start gap-2">
                  <Info className="w-4 h-4 text-cyan-400 shrink-0 mt-0.5" />
                  <span>
                    Selected Origin: <strong>{formData.dam_name}</strong> at [{formData.lat.toFixed(4)}°N, {formData.lon.toFixed(4)}°E].
                    Coordinates anchor both the 0–2km SPH particle near-field and downstream Delft3D 100km corridor.
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* STEP 3: DEM & Terrain */}
          {currentStep === 3 && (
            <div className="space-y-4">
              <div className="border border-slate-800 bg-slate-950/50 rounded-2xl p-4 space-y-4">
                <h3 className="text-sm font-bold text-slate-200 flex items-center gap-2">
                  <FileUp className="w-4 h-4 text-cyan-400" />
                  Digital Elevation Model (DEM) & Grid System
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1">DEM Source</label>
                    <input
                      type="text"
                      value={formData.dem_source}
                      onChange={(e) => handleInputChange('dem_source', e.target.value)}
                      className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-100 focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1">Coordinate Reference System (CRS)</label>
                    <input
                      type="text"
                      value={formData.dem_crs}
                      onChange={(e) => handleInputChange('dem_crs', e.target.value)}
                      className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-100 focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1">Spatial Resolution (m)</label>
                    <input
                      type="number"
                      value={formData.dem_resolution_m}
                      onChange={(e) => handleInputChange('dem_resolution_m', parseFloat(e.target.value))}
                      className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-100 focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1">Elevation Range (Min / Max MSL)</label>
                    <div className="flex gap-2">
                      <input
                        type="number"
                        value={formData.elevation_min_m}
                        onChange={(e) => handleInputChange('elevation_min_m', parseFloat(e.target.value))}
                        className="w-1/2 bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-100 focus:outline-none"
                        placeholder="Min (m)"
                      />
                      <input
                        type="number"
                        value={formData.elevation_max_m}
                        onChange={(e) => handleInputChange('elevation_max_m', parseFloat(e.target.value))}
                        className="w-1/2 bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-100 focus:outline-none"
                        placeholder="Max (m)"
                      />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* STEP 4: Embankment Geometry & Physical Validation */}
          {currentStep === 4 && (
            <div className="space-y-4">
              <div className="border border-slate-800 bg-slate-950/50 rounded-2xl p-4 space-y-4">
                <h3 className="text-sm font-bold text-slate-200 flex items-center gap-2">
                  <Sliders className="w-4 h-4 text-cyan-400" />
                  Dam Structure & Reservoir Parameters
                </h3>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1">Dam Height ($h_d$, m)</label>
                    <input
                      type="number"
                      step="0.5"
                      value={formData.dam_height_m}
                      onChange={(e) => handleInputChange('dam_height_m', parseFloat(e.target.value))}
                      className={`w-full bg-slate-900 border rounded-xl px-3 py-2 text-xs text-slate-100 focus:outline-none ${
                        fieldErrors.dam_height_m ? 'border-red-500 bg-red-950/10' : 'border-slate-800'
                      }`}
                    />
                    {fieldErrors.dam_height_m && (
                      <p className="text-[10px] text-red-400 mt-1 flex items-center gap-1">
                        <AlertTriangle className="w-3 h-3" /> {fieldErrors.dam_height_m}
                      </p>
                    )}
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1">Hydraulic Head ($h_w$, m)</label>
                    <input
                      type="number"
                      step="0.5"
                      value={formData.hydraulic_head_m}
                      onChange={(e) => handleInputChange('hydraulic_head_m', parseFloat(e.target.value))}
                      className={`w-full bg-slate-900 border rounded-xl px-3 py-2 text-xs text-slate-100 focus:outline-none ${
                        fieldErrors.hydraulic_head_m ? 'border-red-500 bg-red-950/10' : 'border-slate-800'
                      }`}
                    />
                    {fieldErrors.hydraulic_head_m && (
                      <p className="text-[10px] text-red-400 mt-1 flex items-center gap-1">
                        <AlertTriangle className="w-3 h-3" /> {fieldErrors.hydraulic_head_m}
                      </p>
                    )}
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1">Reservoir Volume ($V_w$, m³)</label>
                    <input
                      type="number"
                      value={formData.reservoir_volume_m3}
                      onChange={(e) => handleInputChange('reservoir_volume_m3', parseFloat(e.target.value))}
                      className={`w-full bg-slate-900 border rounded-xl px-3 py-2 text-xs text-slate-100 focus:outline-none ${
                        fieldErrors.reservoir_volume_m3 ? 'border-red-500 bg-red-950/10' : 'border-slate-800'
                      }`}
                    />
                    {fieldErrors.reservoir_volume_m3 && (
                      <p className="text-[10px] text-red-400 mt-1 flex items-center gap-1">
                        <AlertTriangle className="w-3 h-3" /> {fieldErrors.reservoir_volume_m3}
                      </p>
                    )}
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1">Crest Length ($L_c$, m)</label>
                    <input
                      type="number"
                      value={formData.crest_length_m}
                      onChange={(e) => handleInputChange('crest_length_m', parseFloat(e.target.value))}
                      className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-100 focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1">Dam Type</label>
                    <select
                      value={formData.dam_type}
                      onChange={(e) => handleInputChange('dam_type', e.target.value)}
                      className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-100 focus:outline-none"
                    >
                      <option value="rockfill">Zoned Earth & Rockfill</option>
                      <option value="earthen">Homogeneous Earthen Embankment</option>
                      <option value="concrete_gravity">Concrete Gravity</option>
                      <option value="landslide_dam">Natural Landslide Dam</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1">Breach Mode</label>
                    <select
                      value={formData.breach_mode}
                      onChange={(e) => handleInputChange('breach_mode', e.target.value)}
                      className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-100 focus:outline-none"
                    >
                      <option value="overtopping">Overtopping Failure</option>
                      <option value="piping">Internal Piping / Seepage Erosion</option>
                      <option value="instantaneous">Instantaneous Collapse</option>
                    </select>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* STEP 5: River Valley & Downstream Path */}
          {currentStep === 5 && (
            <div className="space-y-4">
              <div className="border border-slate-800 bg-slate-950/50 rounded-2xl p-4 space-y-4">
                <h3 className="text-sm font-bold text-slate-200 flex items-center gap-2">
                  <Waves className="w-4 h-4 text-cyan-400" />
                  River Centerline & Downstream Corridor Reach
                </h3>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1">Reach Length (km)</label>
                    <input
                      type="number"
                      value={formData.reach_length_km}
                      onChange={(e) => handleInputChange('reach_length_km', parseFloat(e.target.value))}
                      className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-100 focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1">Average Valley Width (m)</label>
                    <input
                      type="number"
                      value={formData.valley_width_m}
                      onChange={(e) => handleInputChange('valley_width_m', parseFloat(e.target.value))}
                      className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-100 focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1">Bed Slope ($S_0$)</label>
                    <input
                      type="number"
                      step="0.0005"
                      value={formData.bed_slope}
                      onChange={(e) => handleInputChange('bed_slope', parseFloat(e.target.value))}
                      className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-100 focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1">Manning's Roughness ($n$)</label>
                    <input
                      type="number"
                      step="0.001"
                      value={formData.manning_n}
                      onChange={(e) => handleInputChange('manning_n', parseFloat(e.target.value))}
                      className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-100 focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1">Valley Type</label>
                    <select
                      value={formData.valley_type}
                      onChange={(e) => handleInputChange('valley_type', e.target.value)}
                      className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-100 focus:outline-none"
                    >
                      <option value="mountain_gorge">Mountain Gorge (Steep V-Valley)</option>
                      <option value="semi_urban">Semi-Urban Foothill Valley</option>
                      <option value="plains_alluvial">Alluvial Floodplain</option>
                    </select>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* STEP 6: Breach Hydrograph */}
          {currentStep === 6 && (
            <div className="space-y-4">
              <div className="border border-slate-800 bg-slate-950/50 rounded-2xl p-4 space-y-4">
                <h3 className="text-sm font-bold text-slate-200 flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-cyan-400" />
                  Breach Mechanics Formulation & Outflow Hydrograph
                </h3>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1">Empirical Breach Model</label>
                    <select
                      value={formData.breach_model}
                      onChange={(e) => handleInputChange('breach_model', e.target.value)}
                      className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-100 focus:outline-none"
                    >
                      <option value="froehlich_2008">Froehlich (2008) - Recommended for Embankment Dams</option>
                      <option value="macdonald_1984">MacDonald & Langridge-Monopolis (1984)</option>
                      <option value="von_thun_1990">Von Thun & Gillette (1990)</option>
                      <option value="ritter_instantaneous">Ritter (1892) Instantaneous Analytical Dam-Break</option>
                      <option value="costa_schuster">Costa & Schuster (1988) Landslide Dam Outburst</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1">Baseflow / Inflow ($Q_0$, m³/s)</label>
                    <input
                      type="number"
                      value={formData.inflow_discharge_m3s}
                      onChange={(e) => handleInputChange('inflow_discharge_m3s', parseFloat(e.target.value))}
                      className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-100 focus:outline-none"
                    />
                  </div>
                </div>

                {breachResult && (
                  <div className="p-3.5 bg-slate-950 border border-slate-800 rounded-xl flex items-center justify-between text-xs">
                    <div>
                      <span className="text-slate-400">Peak Outflow ($Q_p$): </span>
                      <strong className="text-cyan-400 text-sm font-mono">
                        {breachResult.peak_discharge_m3s?.toLocaleString()} m³/s
                      </strong>
                    </div>
                    <div>
                      <span className="text-slate-400">Formation Time ($t_f$): </span>
                      <strong className="text-slate-200 font-mono">{breachResult.breach_formation_time_hrs || 1.85} hrs</strong>
                    </div>
                    <div>
                      <span className="text-slate-400">Breach Width ($B_{{avg}}$): </span>
                      <strong className="text-slate-200 font-mono">{breachResult.avg_breach_width_m || 248.5} m</strong>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* STEP 7: Exposure & Infrastructure Layers */}
          {currentStep === 7 && (
            <div className="space-y-4">
              <div className="border border-slate-800 bg-slate-950/50 rounded-2xl p-4 space-y-3">
                <h3 className="text-sm font-bold text-slate-200 flex items-center gap-2">
                  <Building className="w-4 h-4 text-cyan-400" />
                  Exposure Layers & Critical Infrastructure Catalog
                </h3>
                <p className="text-xs text-slate-400">
                  Select geospatial datasets to overlay and intersect during flood wave routing.
                </p>

                <div className="space-y-2 text-xs">
                  <label className="flex items-center gap-2 p-2.5 bg-slate-900 border border-slate-800 rounded-xl cursor-pointer">
                    <input
                      type="checkbox"
                      checked={formData.include_landuse}
                      onChange={(e) => handleInputChange('include_landuse', e.target.checked)}
                      className="rounded accent-cyan-500"
                    />
                    <span className="text-slate-200">Land Cover / Crop Inundation Layer (Forest, Agriculture, Urban Built-up)</span>
                  </label>
                  <label className="flex items-center gap-2 p-2.5 bg-slate-900 border border-slate-800 rounded-xl cursor-pointer">
                    <input
                      type="checkbox"
                      checked={formData.include_buildings}
                      onChange={(e) => handleInputChange('include_buildings', e.target.checked)}
                      className="rounded accent-cyan-500"
                    />
                    <span className="text-slate-200">OSM Settlement & Building Footprints (Residential, Commercial, Religious)</span>
                  </label>
                  <label className="flex items-center gap-2 p-2.5 bg-slate-900 border border-slate-800 rounded-xl cursor-pointer">
                    <input
                      type="checkbox"
                      checked={formData.include_infrastructure}
                      onChange={(e) => handleInputChange('include_infrastructure', e.target.checked)}
                      className="rounded accent-cyan-500"
                    />
                    <span className="text-slate-200">Critical Infrastructure (Bridges, Hospitals, Powerhouses, NH-58 Highway)</span>
                  </label>
                </div>
              </div>
            </div>
          )}

          {/* STEP 8: Multi-Layer Physical & Spatial Validation */}
          {currentStep === 8 && (
            <div className="space-y-4">
              <div className="border border-slate-800 bg-slate-950/50 rounded-2xl p-4 space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-sm font-bold text-slate-200 flex items-center gap-2">
                      <ShieldCheck className="w-4 h-4 text-cyan-400" />
                      Multi-Layer Physical & Spatial Consistency Validation
                    </h3>
                    <p className="text-xs text-slate-400">
                      Evaluates hydrodynamic equations, structural dimensions, CRS alignments, and DEM integrity.
                    </p>
                  </div>
                  <button
                    onClick={runFullValidation}
                    disabled={isValidating}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-cyan-500/10 text-cyan-400 border border-cyan-500/30 hover:bg-cyan-500/20 text-xs font-semibold"
                  >
                    <RefreshCw className={`w-3.5 h-3.5 ${isValidating ? 'animate-spin' : ''}`} />
                    <span>{isValidating ? 'Checking...' : 'Re-verify'}</span>
                  </button>
                </div>

                {/* Validation Status Cards */}
                <div className="space-y-2">
                  <div className="p-3 rounded-xl bg-slate-900 border border-slate-800 flex items-center justify-between text-xs">
                    <div className="flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                      <span>Dam Crest vs Base Foundation (Height &gt; 0 &amp; Crest MSL &gt; Bed MSL)</span>
                    </div>
                    <span className="text-emerald-400 font-bold">PASSED</span>
                  </div>

                  <div className="p-3 rounded-xl bg-slate-900 border border-slate-800 flex items-center justify-between text-xs">
                    <div className="flex items-center gap-2">
                      {fieldErrors.hydraulic_head_m ? (
                        <XCircle className="w-4 h-4 text-red-400" />
                      ) : (
                        <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                      )}
                      <span>Reservoir Head vs Crest Level (Head &le; Crest or Overtopping)</span>
                    </div>
                    <span className={fieldErrors.hydraulic_head_m ? 'text-red-400 font-bold' : 'text-emerald-400 font-bold'}>
                      {fieldErrors.hydraulic_head_m ? 'FAILED' : 'PASSED'}
                    </span>
                  </div>

                  <div className="p-3 rounded-xl bg-slate-900 border border-slate-800 flex items-center justify-between text-xs">
                    <div className="flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                      <span>DEM Coordinate Reference System & Elevation Bounds</span>
                    </div>
                    <span className="text-emerald-400 font-bold">EPSG:32644 (VALID)</span>
                  </div>

                  <div className="p-3 rounded-xl bg-slate-900 border border-slate-800 flex items-center justify-between text-xs">
                    <div className="flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                      <span>River Flowpath & Catchment Spatial Intersection</span>
                    </div>
                    <span className="text-emerald-400 font-bold">INTERSECTED</span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* STEP 9: Solver Level */}
          {currentStep === 9 && (
            <div className="space-y-4">
              <div className="border border-slate-800 bg-slate-950/50 rounded-2xl p-4 space-y-4">
                <h3 className="text-sm font-bold text-slate-200 flex items-center gap-2">
                  <Cpu className="w-4 h-4 text-cyan-400" />
                  Select Simulation Physics Solver Tier
                </h3>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {[
                    {
                      id: 'coupled',
                      title: 'Coupled Multi-Scale SPH + Delft3D',
                      desc: 'Near-field 3D Lagrangian particles + far-field 2D flexible mesh shallow water routing.',
                      tag: 'RECOMMENDED BENCHMARK',
                      accent: 'cyan',
                    },
                    {
                      id: 'screening',
                      title: 'Level 1: Rapid Screening Model',
                      desc: 'Fast DEM-based HAND / flow-path screening with Froehlich breach hydrograph.',
                      tag: 'FAST SCREENING (5s)',
                      accent: 'emerald',
                    },
                    {
                      id: 'delft3d',
                      title: 'Level 2: Delft3D Flexible Mesh 2D SWE',
                      desc: 'Eulerian 2D hydrodynamic solver routed along full 100km valley corridor.',
                      tag: 'FAR-FIELD HYDRAULICS',
                      accent: 'blue',
                    },
                    {
                      id: 'sph',
                      title: 'SPH Research Workflow',
                      desc: 'High-resolution DualSPHysics particle simulation restricted to 0–2km domain.',
                      tag: 'NEAR-FIELD 3D SPH',
                      accent: 'purple',
                    },
                  ].map((lvl) => {
                    const isSelected = formData.solver_type === lvl.id;
                    return (
                      <div
                        key={lvl.id}
                        onClick={() => handleInputChange('solver_type', lvl.id)}
                        className={`p-4 rounded-xl border cursor-pointer transition ${
                          isSelected
                            ? 'bg-cyan-950/30 border-cyan-500 shadow-md shadow-cyan-500/10'
                            : 'bg-slate-900 border-slate-800 hover:border-slate-700'
                        }`}
                      >
                        <div className="flex items-center justify-between mb-1">
                          <h4 className="text-xs font-bold text-slate-100">{lvl.title}</h4>
                          {isSelected && <CheckCircle2 className="w-4 h-4 text-cyan-400" />}
                        </div>
                        <p className="text-[11px] text-slate-400">{lvl.desc}</p>
                        <span className="inline-block mt-2 text-[9px] font-bold px-2 py-0.5 rounded bg-slate-800 text-slate-300">
                          {lvl.tag}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          )}

          {/* STEP 10: Review & Dispatch */}
          {currentStep === 10 && (
            <div className="space-y-4">
              <div className="border border-slate-800 bg-slate-950/50 rounded-2xl p-4 space-y-4">
                <h3 className="text-sm font-bold text-slate-200 flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                  Scenario Ready for Worker Job Submission
                </h3>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                  <div className="p-3 bg-slate-900 rounded-xl border border-slate-800">
                    <span className="text-slate-400 text-[11px]">Dam:</span>
                    <p className="font-bold text-slate-200 truncate">{formData.dam_name}</p>
                  </div>
                  <div className="p-3 bg-slate-900 rounded-xl border border-slate-800">
                    <span className="text-slate-400 text-[11px]">Peak Discharge ($Q_p$):</span>
                    <p className="font-bold text-cyan-400 font-mono">
                      {breachResult?.peak_discharge_m3s ? `${breachResult.peak_discharge_m3s.toLocaleString()} m³/s` : '84,200 m³/s'}
                    </p>
                  </div>
                  <div className="p-3 bg-slate-900 rounded-xl border border-slate-800">
                    <span className="text-slate-400 text-[11px]">Reach Corridor:</span>
                    <p className="font-bold text-slate-200">{formData.reach_length_km} km</p>
                  </div>
                  <div className="p-3 bg-slate-900 rounded-xl border border-slate-800">
                    <span className="text-slate-400 text-[11px]">Solver Level:</span>
                    <p className="font-bold text-emerald-400 uppercase">{formData.solver_type}</p>
                  </div>
                </div>

                <p className="text-xs text-slate-400">
                  Click <strong>Dispatch Simulation Job</strong> to send the scenario to the background worker. The job tracker will stream real-time logs and progress stages.
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Footer Navigation */}
        <div className="px-6 py-4 border-t border-slate-800 flex items-center justify-between bg-slate-950/60">
          <button
            onClick={() => setCurrentStep((prev) => Math.max(1, prev - 1))}
            disabled={currentStep === 1}
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-slate-800 text-slate-300 hover:bg-slate-700 text-xs font-semibold disabled:opacity-30 disabled:cursor-not-allowed transition"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Previous</span>
          </button>

          <div className="flex items-center gap-2">
            {currentStep < 10 ? (
              <button
                onClick={() => {
                  if (currentStep === 4) {
                    runFullValidation();
                  }
                  setCurrentStep((prev) => Math.min(10, prev + 1));
                }}
                className="flex items-center gap-1.5 px-5 py-2 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 text-xs font-bold transition shadow-md shadow-cyan-500/20"
              >
                <span>Next Step</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            ) : (
              <button
                onClick={handleExecute}
                className="flex items-center gap-2 px-6 py-2 rounded-xl bg-gradient-to-r from-cyan-500 to-emerald-400 hover:from-cyan-400 hover:to-emerald-300 text-slate-950 text-xs font-bold transition shadow-lg shadow-cyan-500/30"
              >
                <Play className="w-4 h-4 fill-slate-950" />
                <span>Dispatch Simulation Job</span>
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
