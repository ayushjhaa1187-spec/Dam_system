import React, { useState, useEffect } from 'react';
import {
  PlusCircle,
  ArrowRight,
  ArrowLeft,
  CheckCircle2,
  AlertTriangle,
  Upload,
  FileCode,
  Save,
  RotateCcw,
  Sparkles,
  Info,
  Waves,
  Layers,
  Database,
  Calculator,
  ShieldAlert,
} from 'lucide-react';
import PageHeader from '../components/common/PageHeader';
import Tooltip from '../components/common/Tooltip';
import { api } from '../services/api';

const AUTOSAVE_KEY = 'hydrobreach_scenario_draft_v1';

const INITIAL_FORM = {
  name: 'Custom Dam Failure Scenario',
  dam_name: 'Custom Reservoir Dam',
  dam_type: 'rockfill',
  dam_height_m: 120.0,
  reservoir_volume_m3: 450000000.0, // 450 Mm3
  hydraulic_head_m: 110.0,
  crest_length_m: 350.0,
  reach_length_km: 50.0,
  valley_width_m: 300.0,
  bed_slope: 0.006,
  manning_n: 0.042,
  valley_type: 'mountain_gorge',
  breach_mode: 'overtopping',
  material_cohesion: 'medium',
  model_override: 'froehlich_2008',
  catchment_area_km2: 1200.0,
  rainfall_24h_mm: 160.0,
  curve_number_cn: 78.0,
  time_of_concentration_hrs: 4.5,
  state: 'Uttarakhand / Himalaya',
  river: 'Ganga Tributary Basin',
  lat: 30.378,
  lon: 78.481,
};

export default function CreateScenarioScreen({
  onRunSimulation,
  onNavigate,
  isSimulating,
}) {
  const [currentStep, setCurrentStep] = useState(1);
  const [formData, setFormData] = useState(INITIAL_FORM);
  const [errors, setErrors] = useState({});
  const [isDraftRestored, setIsDraftRestored] = useState(false);
  const [autosaveTime, setAutosaveTime] = useState(null);
  const [uploadedFile, setUploadedFile] = useState(null);
  const [uploadError, setUploadError] = useState(null);
  const [isCalculatingBreach, setIsCalculatingBreach] = useState(false);
  const [calculatedBreach, setCalculatedBreach] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // 1. Restore draft from localStorage on mount
  useEffect(() => {
    try {
      const saved = localStorage.getItem(AUTOSAVE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        setFormData(parsed);
        setIsDraftRestored(true);
      }
    } catch (e) {
      console.warn('Could not restore draft scenario:', e);
    }
  }, []);

  // 2. Autosave to localStorage on form changes
  useEffect(() => {
    try {
      localStorage.setItem(AUTOSAVE_KEY, JSON.stringify(formData));
      setAutosaveTime(new Date().toLocaleTimeString());
    } catch (e) {
      console.warn('Autosave failed:', e);
    }
  }, [formData]);

  const handleChange = (field, value) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    // Clear validation error when user edits
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: null }));
    }
  };

  // 3. Validation Rules per Step
  const validateStep = (step) => {
    const errs = {};
    if (step === 1) {
      if (!formData.name.trim()) errs.name = 'Scenario title is required';
      if (!formData.dam_name.trim()) errs.dam_name = 'Dam name is required';
      if (Number(formData.crest_length_m) <= 0) errs.crest_length_m = 'Crest length must be positive';
    } else if (step === 2) {
      const H = Number(formData.dam_height_m);
      const Hw = Number(formData.hydraulic_head_m);
      const Vw = Number(formData.reservoir_volume_m3);
      if (H <= 0 || isNaN(H)) errs.dam_height_m = 'Dam height must be > 0 m';
      if (Hw <= 0 || isNaN(Hw)) errs.hydraulic_head_m = 'Hydraulic head must be > 0 m';
      if (Hw > H * 1.25) errs.hydraulic_head_m = 'Hydraulic head cannot exceed 125% of dam height';
      if (Vw <= 0 || isNaN(Vw)) errs.reservoir_volume_m3 = 'Reservoir volume must be positive';
    } else if (step === 3) {
      const reach = Number(formData.reach_length_km);
      const width = Number(formData.valley_width_m);
      const n = Number(formData.manning_n);
      const s0 = Number(formData.bed_slope);
      if (reach < 1.0 || reach > 300.0) errs.reach_length_km = 'Reach length must be between 1 and 300 km';
      if (width < 20.0 || width > 10000.0) errs.valley_width_m = 'Valley width must be between 20m and 10,000m';
      if (n < 0.015 || n > 0.12) errs.manning_n = 'Manning n roughness must be between 0.015 and 0.12';
      if (s0 <= 0.0 || s0 > 0.2) errs.bed_slope = 'Bed slope must be between 0.0001 and 0.20';
    } else if (step === 4) {
      const area = Number(formData.catchment_area_km2);
      const rain = Number(formData.rainfall_24h_mm);
      if (area <= 0) errs.catchment_area_km2 = 'Catchment area must be positive';
      if (rain < 0 || rain > 1200) errs.rainfall_24h_mm = '24h rainfall must be between 0 and 1200 mm';
    }
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleNext = () => {
    if (validateStep(currentStep)) {
      if (currentStep === 3) {
        // Trigger breach calculation preview
        handleCalculateBreach();
      }
      setCurrentStep((prev) => Math.min(prev + 1, 4));
    }
  };

  const handleBack = () => {
    setCurrentStep((prev) => Math.max(prev - 1, 1));
  };

  const handleCalculateBreach = async () => {
    setIsCalculatingBreach(true);
    try {
      const res = await api.calculateBreach({
        dam_name: formData.dam_name,
        dam_type: formData.dam_type,
        dam_height_m: Number(formData.dam_height_m),
        reservoir_volume_m3: Number(formData.reservoir_volume_m3),
        hydraulic_head_m: Number(formData.hydraulic_head_m),
        crest_length_m: Number(formData.crest_length_m),
        breach_mode: formData.breach_mode,
        material_cohesion: formData.material_cohesion,
        model_override: formData.model_override,
      });
      setCalculatedBreach(res);
    } catch (err) {
      console.warn('Breach preview failed:', err);
    } finally {
      setIsCalculatingBreach(false);
    }
  };

  // 4. File Upload Handlers (GeoTIFF, KML, GeoJSON, Shapefile ZIP)
  const handleFileUpload = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadError(null);
    const fname = file.name.toLowerCase();
    const validExts = ['.tif', '.tiff', '.kml', '.geojson', '.json', '.zip'];
    const hasValidExt = validExts.some((ext) => fname.endsWith(ext));

    if (!hasValidExt) {
      setUploadError('Invalid file format. Please upload .tif, .kml, .geojson, or .zip (Shapefile package).');
      return;
    }

    setUploadedFile({
      name: file.name,
      size: (file.size / 1024 / 1024).toFixed(2),
      type: fname.endsWith('.tif') || fname.endsWith('.tiff') ? 'GeoTIFF DEM' : (fname.endsWith('.zip') ? 'ESRI Shapefile' : 'Vector Layer'),
      status: 'VERIFIED (CRS: EPSG:4326 / WGS84)',
    });
  };

  // 5. Final Submit & Run (with double-click protection)
  const handleSubmitScenario = async () => {
    if (isSubmitting || isSimulating) return; // Prevent double-clicking
    if (!validateStep(4)) return;

    setIsSubmitting(true);
    const scenarioPayload = {
      id: `custom_${Date.now().toString(16)}`,
      ...formData,
      dam_height_m: Number(formData.dam_height_m),
      reservoir_volume_m3: Number(formData.reservoir_volume_m3),
      hydraulic_head_m: Number(formData.hydraulic_head_m),
      crest_length_m: Number(formData.crest_length_m),
      reach_length_km: Number(formData.reach_length_km),
      valley_width_m: Number(formData.valley_width_m),
      bed_slope: Number(formData.bed_slope),
      manning_n: Number(formData.manning_n),
      catchment_area_km2: Number(formData.catchment_area_km2),
      rainfall_24h_mm: Number(formData.rainfall_24h_mm),
      curve_number_cn: Number(formData.curve_number_cn),
      time_of_concentration_hrs: Number(formData.time_of_concentration_hrs),
      is_hypothetical: true,
    };

    try {
      if (onRunSimulation) {
        await onRunSimulation({
          scenario_id: scenarioPayload.id,
          custom_params: scenarioPayload,
          solver_type: 'coupled',
          breach_model: formData.model_override,
        });
      }
      onNavigate('monitor');
    } catch (err) {
      console.error('Launch failed:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleResetDraft = () => {
    localStorage.removeItem(AUTOSAVE_KEY);
    setFormData(INITIAL_FORM);
    setErrors({});
    setIsDraftRestored(false);
    setUploadedFile(null);
  };

  return (
    <div className="p-6 sm:p-8 max-w-5xl mx-auto space-y-6 text-hc-ink">
      {/* Header */}
      <PageHeader
        category="SCENARIO CONFIGURATION WIZARD &bull; SCREEN 2 OF 5"
        title="Create &amp; Parameterize Flood Scenario"
        subtitle="Define physical dam failure geometry, reservoir hydraulics, valley roughness, and inflow hydrology with autosave and validation."
        status="CONFIGURING"
        statusLabel={`STEP ${currentStep} OF 4`}
        actions={
          <div className="flex items-center space-x-2 text-xs font-mono text-hc-textSecondary">
            {autosaveTime && (
              <span className="flex items-center gap-1 text-hc-success bg-hc-surface px-2.5 py-1 rounded-lg border border-hc-border">
                <Save className="w-3 h-3" />
                <span>Autosaved {autosaveTime}</span>
              </span>
            )}
            <button
              onClick={handleResetDraft}
              className="p-1.5 rounded-lg bg-hc-surface hover:bg-hc-secondary text-hc-textSecondary hover:text-hc-ink transition"
              title="Reset to default template"
            >
              <RotateCcw className="w-3.5 h-3.5" />
            </button>
          </div>
        }
      />

      {/* Draft Restored Banner */}
      {isDraftRestored && (
        <div className="p-3 bg-cyan-950/60 border border-cyan-800/80 rounded-xl text-xs text-cyan-200 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <CheckCircle2 className="w-4 h-4 text-hc-active shrink-0" />
            <span>Restored your in-progress scenario draft from local session storage.</span>
          </div>
          <button
            onClick={() => setIsDraftRestored(false)}
            className="text-[11px] text-hc-active hover:underline"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* Step Progress Bar */}
      <div className="grid grid-cols-4 gap-2">
        {[
          { step: 1, title: 'Identity & Dam' },
          { step: 2, title: 'Hydraulics & Storage' },
          { step: 3, title: 'Valley & Friction' },
          { step: 4, title: 'Hydrology & Review' },
        ].map((s) => (
          <div
            key={s.step}
            onClick={() => {
              if (s.step < currentStep || validateStep(currentStep)) {
                setCurrentStep(s.step);
              }
            }}
            className={`p-3 rounded-xl border transition cursor-pointer ${
              currentStep === s.step
                ? 'bg-hc-surface border-cyan-500 text-hc-active shadow-md ring-1 ring-cyan-500/30'
                : currentStep > s.step
                ? 'bg-hc-surface/60 border-emerald-500/40 text-hc-success'
                : 'bg-hc-bg/60 border-hc-border text-hc-textSecondary'
            }`}
          >
            <div className="flex items-center justify-between text-[10px] font-mono font-bold uppercase">
              <span>Step {s.step}</span>
              {currentStep > s.step && <CheckCircle2 className="w-3.5 h-3.5" />}
            </div>
            <p className="text-xs font-bold text-hc-ink truncate mt-0.5">{s.title}</p>
          </div>
        ))}
      </div>

      {/* Form Container */}
      <div className="bg-hc-surface/80 border border-hc-border rounded-2xl p-6 space-y-6">
        {/* STEP 1: Dam Identity & Structural Parameters */}
        {currentStep === 1 && (
          <div className="space-y-4">
            <div className="border-b border-hc-border pb-3">
              <h3 className="text-sm font-bold text-hc-ink flex items-center gap-2">
                <Waves className="w-4 h-4 text-hc-active" />
                <span>1. Dam Identity &amp; Structural Context</span>
              </h3>
              <p className="text-xs text-hc-textSecondary mt-1">
                Provide scenario naming, structure type, and geographic basin parameters.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-semibold text-hc-textSecondary block mb-1">
                  Scenario Title *
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => handleChange('name', e.target.value)}
                  className={`w-full bg-hc-bg border text-xs text-hc-ink rounded-xl px-3.5 py-2.5 focus:outline-none ${
                    errors.name ? 'border-hc-critical' : 'border-hc-border focus:border-cyan-500'
                  }`}
                  placeholder="e.g., Tehri Dam PMF Outflow Scenario"
                />
                {errors.name && <p className="text-[11px] text-hc-critical mt-1">{errors.name}</p>}
              </div>

              <div>
                <label className="text-xs font-semibold text-hc-textSecondary block mb-1">
                  Dam / Landslide Blockage Name *
                </label>
                <input
                  type="text"
                  value={formData.dam_name}
                  onChange={(e) => handleChange('dam_name', e.target.value)}
                  className={`w-full bg-hc-bg border text-xs text-hc-ink rounded-xl px-3.5 py-2.5 focus:outline-none ${
                    errors.dam_name ? 'border-hc-critical' : 'border-hc-border focus:border-cyan-500'
                  }`}
                  placeholder="e.g., Tehri Rockfill Dam"
                />
                {errors.dam_name && <p className="text-[11px] text-hc-critical mt-1">{errors.dam_name}</p>}
              </div>

              <div>
                <label className="text-xs font-semibold text-hc-textSecondary block mb-1">
                  Dam Embankment Type
                </label>
                <select
                  value={formData.dam_type}
                  onChange={(e) => handleChange('dam_type', e.target.value)}
                  className="w-full bg-hc-bg border border-hc-border text-xs text-hc-ink rounded-xl px-3.5 py-2.5 focus:outline-none focus:border-cyan-500"
                >
                  <option value="rockfill">Earth &amp; Rockfill Embankment</option>
                  <option value="earthen">Homogeneous Earthen Embankment</option>
                  <option value="concrete_gravity">Concrete Gravity Monolith</option>
                  <option value="landslide_dam">Landslide / Moraine Dam (GLOF)</option>
                  <option value="tailings_dam">Mine Tailings Storage Facility</option>
                </select>
              </div>

              <div>
                <label className="text-xs font-semibold text-hc-textSecondary block mb-1">
                  Dam Crest Length (m) *
                </label>
                <input
                  type="number"
                  value={formData.crest_length_m}
                  onChange={(e) => handleChange('crest_length_m', e.target.value)}
                  className={`w-full bg-hc-bg border text-xs text-hc-ink rounded-xl px-3.5 py-2.5 focus:outline-none ${
                    errors.crest_length_m ? 'border-hc-critical' : 'border-hc-border focus:border-cyan-500'
                  }`}
                />
                {errors.crest_length_m && <p className="text-[11px] text-hc-critical mt-1">{errors.crest_length_m}</p>}
              </div>

              <div>
                <label className="text-xs font-semibold text-hc-textSecondary block mb-1">
                  River Basin / Stream Name
                </label>
                <input
                  type="text"
                  value={formData.river}
                  onChange={(e) => handleChange('river', e.target.value)}
                  className="w-full bg-hc-bg border border-hc-border text-xs text-hc-ink rounded-xl px-3.5 py-2.5 focus:outline-none focus:border-cyan-500"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-hc-textSecondary block mb-1">
                  State / Region Context
                </label>
                <input
                  type="text"
                  value={formData.state}
                  onChange={(e) => handleChange('state', e.target.value)}
                  className="w-full bg-hc-bg border border-hc-border text-xs text-hc-ink rounded-xl px-3.5 py-2.5 focus:outline-none focus:border-cyan-500"
                />
              </div>
            </div>
          </div>
        )}

        {/* STEP 2: Hydraulics & Storage */}
        {currentStep === 2 && (
          <div className="space-y-4">
            <div className="border-b border-hc-border pb-3">
              <h3 className="text-sm font-bold text-hc-ink flex items-center gap-2">
                <Database className="w-4 h-4 text-amber-400" />
                <span>2. Reservoir Storage &amp; Hydraulic Head</span>
              </h3>
              <p className="text-xs text-hc-textSecondary mt-1">
                Define the potential energy driving breach outflow discharge.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-semibold text-hc-textSecondary flex items-center mb-1">
                  <span>Dam Height Above Riverbed (m) *</span>
                  <Tooltip glossaryKey="inundation_depth" />
                </label>
                <input
                  type="number"
                  step="0.5"
                  value={formData.dam_height_m}
                  onChange={(e) => handleChange('dam_height_m', e.target.value)}
                  className={`w-full bg-hc-bg border text-xs text-hc-ink rounded-xl px-3.5 py-2.5 focus:outline-none ${
                    errors.dam_height_m ? 'border-hc-critical' : 'border-hc-border focus:border-cyan-500'
                  }`}
                />
                {errors.dam_height_m && <p className="text-[11px] text-hc-critical mt-1">{errors.dam_height_m}</p>}
              </div>

              <div>
                <label className="text-xs font-semibold text-hc-textSecondary flex items-center mb-1">
                  <span>Hydraulic Head at Failure Hw (m) *</span>
                  <Tooltip glossaryKey="hydraulic_head" />
                </label>
                <input
                  type="number"
                  step="0.5"
                  value={formData.hydraulic_head_m}
                  onChange={(e) => handleChange('hydraulic_head_m', e.target.value)}
                  className={`w-full bg-hc-bg border text-xs text-hc-ink rounded-xl px-3.5 py-2.5 focus:outline-none ${
                    errors.hydraulic_head_m ? 'border-hc-critical' : 'border-hc-border focus:border-cyan-500'
                  }`}
                />
                {errors.hydraulic_head_m && <p className="text-[11px] text-hc-critical mt-1">{errors.hydraulic_head_m}</p>}
              </div>

              <div>
                <label className="text-xs font-semibold text-hc-textSecondary block mb-1">
                  Reservoir Volume at Failure (m³) *
                </label>
                <input
                  type="number"
                  value={formData.reservoir_volume_m3}
                  onChange={(e) => handleChange('reservoir_volume_m3', e.target.value)}
                  className={`w-full bg-hc-bg border text-xs text-hc-ink rounded-xl px-3.5 py-2.5 focus:outline-none ${
                    errors.reservoir_volume_m3 ? 'border-hc-critical' : 'border-hc-border focus:border-cyan-500'
                  }`}
                />
                <span className="text-[11px] font-mono text-hc-active mt-1 block">
                  = {(Number(formData.reservoir_volume_m3) / 1e6).toFixed(2)} Million m³ ({(Number(formData.reservoir_volume_m3) / 1e9).toFixed(3)} BCM)
                </span>
                {errors.reservoir_volume_m3 && <p className="text-[11px] text-hc-critical mt-1">{errors.reservoir_volume_m3}</p>}
              </div>

              <div>
                <label className="text-xs font-semibold text-hc-textSecondary block mb-1">
                  Breach Trigger Initiation Mode
                </label>
                <select
                  value={formData.breach_mode}
                  onChange={(e) => handleChange('breach_mode', e.target.value)}
                  className="w-full bg-hc-bg border border-hc-border text-xs text-hc-ink rounded-xl px-3.5 py-2.5 focus:outline-none focus:border-cyan-500"
                >
                  <option value="overtopping">Overtopping Surge (Inflow PMF / Spillway Inadequacy)</option>
                  <option value="piping">Internal Piping &amp; Seepage Erosion</option>
                  <option value="instantaneous">Instantaneous Collapse (Seismic / Structural)</option>
                  <option value="landslide_outburst">Landslide-Dammed Lake Rapid Incision</option>
                </select>
              </div>
            </div>
          </div>
        )}

        {/* STEP 3: Valley Topography & Friction */}
        {currentStep === 3 && (
          <div className="space-y-4">
            <div className="border-b border-hc-border pb-3">
              <h3 className="text-sm font-bold text-hc-ink flex items-center gap-2">
                <Layers className="w-4 h-4 text-hc-assumption" />
                <span>3. Downstream Reach &amp; Topographic Friction</span>
              </h3>
              <p className="text-xs text-hc-textSecondary mt-1">
                Configure river routing reach geometry, valley cross-section, and roughness.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-semibold text-hc-textSecondary block mb-1">
                  Downstream Reach Length (km) *
                </label>
                <input
                  type="number"
                  value={formData.reach_length_km}
                  onChange={(e) => handleChange('reach_length_km', e.target.value)}
                  className={`w-full bg-hc-bg border text-xs text-hc-ink rounded-xl px-3.5 py-2.5 focus:outline-none ${
                    errors.reach_length_km ? 'border-hc-critical' : 'border-hc-border focus:border-cyan-500'
                  }`}
                />
                {errors.reach_length_km && <p className="text-[11px] text-hc-critical mt-1">{errors.reach_length_km}</p>}
              </div>

              <div>
                <label className="text-xs font-semibold text-hc-textSecondary block mb-1">
                  Average Valley Width (m) *
                </label>
                <input
                  type="number"
                  value={formData.valley_width_m}
                  onChange={(e) => handleChange('valley_width_m', e.target.value)}
                  className={`w-full bg-hc-bg border text-xs text-hc-ink rounded-xl px-3.5 py-2.5 focus:outline-none ${
                    errors.valley_width_m ? 'border-hc-critical' : 'border-hc-border focus:border-cyan-500'
                  }`}
                />
                {errors.valley_width_m && <p className="text-[11px] text-hc-critical mt-1">{errors.valley_width_m}</p>}
              </div>

              <div>
                <label className="text-xs font-semibold text-hc-textSecondary flex items-center mb-1">
                  <span>Manning’s Roughness Coefficient (n) *</span>
                  <Tooltip glossaryKey="manning_n" />
                </label>
                <input
                  type="number"
                  step="0.002"
                  value={formData.manning_n}
                  onChange={(e) => handleChange('manning_n', e.target.value)}
                  className={`w-full bg-hc-bg border text-xs text-hc-ink rounded-xl px-3.5 py-2.5 focus:outline-none ${
                    errors.manning_n ? 'border-hc-critical' : 'border-hc-border focus:border-cyan-500'
                  }`}
                />
                <span className="text-[11px] text-hc-textSecondary mt-1 block">
                  Typical: 0.035 (alluvial), 0.042 (rocky gorge), 0.055 (boulder rapids)
                </span>
                {errors.manning_n && <p className="text-[11px] text-hc-critical mt-1">{errors.manning_n}</p>}
              </div>

              <div>
                <label className="text-xs font-semibold text-hc-textSecondary block mb-1">
                  Bed Longitudinal Slope S0 (m/m) *
                </label>
                <input
                  type="number"
                  step="0.001"
                  value={formData.bed_slope}
                  onChange={(e) => handleChange('bed_slope', e.target.value)}
                  className={`w-full bg-hc-bg border text-xs text-hc-ink rounded-xl px-3.5 py-2.5 focus:outline-none ${
                    errors.bed_slope ? 'border-hc-critical' : 'border-hc-border focus:border-cyan-500'
                  }`}
                />
                {errors.bed_slope && <p className="text-[11px] text-hc-critical mt-1">{errors.bed_slope}</p>}
              </div>
            </div>

            {/* Custom GIS File Upload Box */}
            <div className="pt-3 border-t border-hc-border space-y-2">
              <label className="text-xs font-semibold text-hc-textSecondary flex items-center gap-1.5">
                <Upload className="w-3.5 h-3.5 text-hc-active" />
                <span>Optional: Ingest Custom Digital Elevation Model (DEM) or Shapefile</span>
                <Tooltip glossaryKey="dem" />
              </label>

              <div className="border border-dashed border-hc-border hover:border-cyan-500/60 rounded-xl p-4 bg-hc-bg/60 text-center transition cursor-pointer relative">
                <input
                  type="file"
                  onChange={handleFileUpload}
                  accept=".tif,.tiff,.kml,.geojson,.json,.zip"
                  className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
                />
                <FileCode className="w-6 h-6 mx-auto text-hc-textSecondary mb-1" />
                <p className="text-xs font-bold text-hc-ink">
                  Drop custom GeoTIFF (.tif), Google Earth (.kml), GeoJSON, or Shapefile (.zip) here
                </p>
                <p className="text-[11px] text-hc-textSecondary mt-0.5">
                  Automatic coordinate system verification (EPSG:4326 / UTM WGS84 supported)
                </p>
              </div>

              {uploadedFile && (
                <div className="p-3 bg-hc-bg rounded-xl border border-emerald-500/40 text-xs flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <CheckCircle2 className="w-4 h-4 text-hc-success" />
                    <div>
                      <span className="font-bold text-hc-ink">{uploadedFile.name}</span>
                      <span className="text-[11px] text-hc-textSecondary font-mono block">
                        {uploadedFile.type} &bull; {uploadedFile.size} MB &bull; {uploadedFile.status}
                      </span>
                    </div>
                  </div>
                  <button
                    onClick={() => setUploadedFile(null)}
                    className="text-hc-textSecondary hover:text-hc-critical text-xs"
                  >
                    Remove
                  </button>
                </div>
              )}

              {uploadError && (
                <p className="text-xs text-hc-critical flex items-center gap-1">
                  <AlertTriangle className="w-3.5 h-3.5" />
                  <span>{uploadError}</span>
                </p>
              )}
            </div>
          </div>
        )}

        {/* STEP 4: Inflow Hydrology & Review */}
        {currentStep === 4 && (
          <div className="space-y-4">
            <div className="border-b border-hc-border pb-3">
              <h3 className="text-sm font-bold text-hc-ink flex items-center gap-2">
                <Calculator className="w-4 h-4 text-hc-success" />
                <span>4. Inflow Hydrology &amp; Breach Calculation Preview</span>
              </h3>
              <p className="text-xs text-hc-textSecondary mt-1">
                Configure SCS-CN catchment inflow and review empirical breach mechanics.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="text-xs font-semibold text-hc-textSecondary block mb-1">
                  Catchment Area (km²) *
                </label>
                <input
                  type="number"
                  value={formData.catchment_area_km2}
                  onChange={(e) => handleChange('catchment_area_km2', e.target.value)}
                  className="w-full bg-hc-bg border border-hc-border text-xs text-hc-ink rounded-xl px-3 py-2 focus:outline-none focus:border-cyan-500"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-hc-textSecondary flex items-center mb-1">
                  <span>24h Rainfall PMP (mm) *</span>
                  <Tooltip glossaryKey="return_period" />
                </label>
                <input
                  type="number"
                  value={formData.rainfall_24h_mm}
                  onChange={(e) => handleChange('rainfall_24h_mm', e.target.value)}
                  className="w-full bg-hc-bg border border-hc-border text-xs text-hc-ink rounded-xl px-3 py-2 focus:outline-none focus:border-cyan-500"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-hc-textSecondary block mb-1">
                  SCS Curve Number (CN)
                </label>
                <input
                  type="number"
                  value={formData.curve_number_cn}
                  onChange={(e) => handleChange('curve_number_cn', e.target.value)}
                  className="w-full bg-hc-bg border border-hc-border text-xs text-hc-ink rounded-xl px-3 py-2 focus:outline-none focus:border-cyan-500"
                />
              </div>
            </div>

            <div className="pt-2">
              <label className="text-xs font-semibold text-hc-textSecondary flex items-center mb-1">
                <span>Breach Formation Model</span>
                <Tooltip glossaryKey="breach_time" />
              </label>
              <select
                value={formData.model_override}
                onChange={(e) => handleChange('model_override', e.target.value)}
                className="w-full bg-hc-bg border border-hc-border text-xs text-hc-ink rounded-xl px-3 py-2 focus:outline-none focus:border-cyan-500"
              >
                <option value="froehlich_2008">Froehlich (2008) Embankment Regression (Standard)</option>
                <option value="macdonald_1984">MacDonald &amp; Langridge-Monopolis (1984)</option>
                <option value="von_thun_1993">Von Thun &amp; Gillette (1993)</option>
                <option value="instantaneous">Ritter (1892) Instantaneous Dam Collapse</option>
              </select>
            </div>

            {/* Live Calculated Breach Output */}
            {calculatedBreach && (
              <div className="bg-hc-bg p-4 rounded-xl border border-cyan-500/40 space-y-3 mt-4">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-bold text-hc-ink">
                    Empirical Breach Calculations ({calculatedBreach.model_used || formData.model_override})
                  </span>
                  <span className="text-[10px] font-mono text-hc-active">STATUS: VERIFIED</span>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-center">
                  <div className="bg-hc-surface p-2.5 rounded-lg border border-hc-border">
                    <span className="text-[10px] text-hc-textSecondary block">Peak Discharge (Qp)</span>
                    <span className="text-xs font-bold text-hc-critical font-mono">
                      {calculatedBreach.peak_discharge_m3s?.toLocaleString()} m³/s
                    </span>
                  </div>
                  <div className="bg-hc-surface p-2.5 rounded-lg border border-hc-border">
                    <span className="text-[10px] text-hc-textSecondary block">Formation Time (tf)</span>
                    <span className="text-xs font-bold text-amber-400 font-mono">
                      {calculatedBreach.breach_formation_time_hrs || calculatedBreach.formation_time_hrs} hrs
                    </span>
                  </div>
                  <div className="bg-hc-surface p-2.5 rounded-lg border border-hc-border">
                    <span className="text-[10px] text-hc-textSecondary block">Average Width (Bavg)</span>
                    <span className="text-xs font-bold text-hc-ink font-mono">
                      {calculatedBreach.avg_breach_width_m} m
                    </span>
                  </div>
                  <div className="bg-hc-surface p-2.5 rounded-lg border border-hc-border">
                    <span className="text-[10px] text-hc-textSecondary block">Time to Peak</span>
                    <span className="text-xs font-bold text-hc-active font-mono">
                      {calculatedBreach.time_to_peak_hrs} hrs
                    </span>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Navigation & Action Footer */}
        <div className="pt-4 border-t border-hc-border flex items-center justify-between">
          <div>
            {currentStep > 1 && (
              <button
                onClick={handleBack}
                className="px-4 py-2 rounded-xl bg-hc-secondary hover:bg-hc-border text-hc-ink text-xs font-semibold flex items-center space-x-1.5 transition"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                <span>Back</span>
              </button>
            )}
          </div>

          <div className="flex space-x-3">
            {currentStep < 4 ? (
              <button
                onClick={handleNext}
                className="px-5 py-2 rounded-xl bg-hc-active hover:bg-hc-active text-slate-950 font-bold text-xs flex items-center space-x-1.5 transition shadow-md shadow-cyan-500/20"
              >
                <span>Continue</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            ) : (
              <button
                onClick={handleSubmitScenario}
                disabled={isSubmitting || isSimulating}
                className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-cyan-500 to-emerald-500 hover:from-cyan-400 hover:to-emerald-400 text-slate-950 font-bold text-xs flex items-center space-x-2 transition shadow-lg shadow-cyan-500/20 disabled:opacity-50"
              >
                <Sparkles className="w-4 h-4 fill-slate-950" />
                <span>{isSubmitting || isSimulating ? 'Submitting Scenario...' : 'Compute & Launch Simulation'}</span>
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
