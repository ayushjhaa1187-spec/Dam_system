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
  Waves,
  Layers,
  Database,
  Cpu,
  Sliders,
  MapPin,
  Mountain,
  Satellite,
  Info,
} from 'lucide-react';
import PageHeader from '../components/common/PageHeader';
import { api } from '../services/api';

const AUTOSAVE_KEY = 'hydroshield_scenario_draft_v2';

const INITIAL_FORM = {
  name: 'Chenab Dam Full Breach Simulation',
  dam_name: 'Chenab Dam Axis',
  dam_type: 'rockfill',
  dam_height_m: 120.0,
  reservoir_volume_m3: 502000000.0, // 502 MCM
  hydraulic_head_m: 110.0,
  crest_length_m: 350.0,
  reach_length_km: 78.0,
  valley_width_m: 320.0,
  bed_slope: 0.0055,
  manning_n: 0.042,
  valley_type: 'mountain_gorge',
  breach_mode: 'instantaneous',
  breach_width_m: 120,
  time_of_failure_hrs: 0.25,
  estimate_unknown_time: false,
  selected_model: 'both', // 'sph', 'delft3d', 'both'
  state: 'Jammu & Kashmir / Himalaya',
  river: 'Chenab River Basin',
  lat: 33.145,
  lon: 75.760,
};

export default function CreateScenarioScreen({
  onRunSimulation,
  onNavigate,
  isSimulating,
}) {
  const [currentStep, setCurrentStep] = useState(1);
  const [formData, setFormData] = useState(INITIAL_FORM);
  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Restore draft
  useEffect(() => {
    try {
      const saved = localStorage.getItem(AUTOSAVE_KEY);
      if (saved) setFormData(JSON.parse(saved));
    } catch (e) {
      console.warn('Could not restore draft:', e);
    }
  }, []);

  // Autosave
  useEffect(() => {
    try {
      localStorage.setItem(AUTOSAVE_KEY, JSON.stringify(formData));
    } catch (e) {
      console.warn('Autosave failed:', e);
    }
  }, [formData]);

  const handleChange = (field, value) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: null }));
    }
  };

  const validateStep = (step) => {
    const errs = {};
    if (step === 1) {
      if (!formData.name.trim()) errs.name = 'Scenario title is required';
      if (!formData.river.trim()) errs.river = 'River basin is required';
    } else if (step === 2) {
      if (Number(formData.dam_height_m) <= 0) errs.dam_height_m = 'Dam height must be > 0';
      if (Number(formData.reservoir_volume_m3) <= 0) errs.reservoir_volume_m3 = 'Volume must be > 0';
    }
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleNext = () => {
    if (validateStep(currentStep)) {
      setCurrentStep((prev) => Math.min(prev + 1, 4));
    }
  };

  const handleBack = () => {
    setCurrentStep((prev) => Math.max(prev - 1, 1));
  };

  const handleSubmit = async () => {
    if (isSubmitting || isSimulating) return;
    setIsSubmitting(true);

    const payload = {
      id: `scenario_${Date.now().toString(16)}`,
      ...formData,
      dam_height_m: Number(formData.dam_height_m),
      reservoir_volume_m3: Number(formData.reservoir_volume_m3),
      hydraulic_head_m: Number(formData.hydraulic_head_m),
      solver_type: formData.selected_model === 'both' ? 'coupled' : formData.selected_model,
    };

    try {
      if (onRunSimulation) {
        await onRunSimulation({
          scenario_id: payload.id,
          custom_params: payload,
          solver_type: payload.solver_type,
        });
      }
      if (onNavigate) onNavigate('scenarios');
    } catch (err) {
      console.error('Launch failed:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="p-6 sm:p-8 max-w-5xl mx-auto space-y-6 text-hc-ink">
      {/* Header */}
      <PageHeader
        category="SCENARIO SETUP WIZARD &bull; HYDROSHIELD"
        title="New Dam Break Simulation Wizard"
        subtitle="Step-by-step setup: study area definition, dam geometry, dual SPH & Delft3D model selection, and breach trigger mechanics."
        status="CONFIGURING"
        statusLabel={`STEP ${currentStep} OF 4`}
      />

      {/* Step Progress Indicator matching Image 2 top-right */}
      <div className="bg-hc-surface border border-hc-border rounded-2xl p-4 shadow-card-dark">
        <div className="grid grid-cols-4 gap-3 text-center font-mono text-xs">
          {[
            { step: 1, title: '1. Study Area Selection' },
            { step: 2, title: '2. Dam Parameters' },
            { step: 3, title: '3. Model Selection' },
            { step: 4, title: '4. Breach Scenario' },
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
                  ? 'bg-blue-50 border-blue-500 text-blue-800 font-bold ring-1 ring-blue-500/30'
                  : currentStep > s.step
                  ? 'bg-emerald-50 border-emerald-200 text-emerald-800 font-semibold'
                  : 'bg-slate-50 border-slate-200 text-slate-500'
              }`}
            >
              <div className="flex items-center justify-center gap-1.5">
                {currentStep > s.step && <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />}
                <span>{s.title}</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Form Steps Body */}
      <div className="bg-hc-surface border border-hc-border rounded-2xl p-6 space-y-6 shadow-card-dark">
        {/* STEP 1: Study Area Selection */}
        {currentStep === 1 && (
          <div className="space-y-4">
            <div className="pb-3 border-b border-hc-border">
              <h3 className="text-xs font-bold uppercase tracking-wider text-hc-ink flex items-center gap-2">
                <MapPin className="w-4 h-4 text-blue-600" />
                <span>1. Study Area &amp; River Basin Selection</span>
              </h3>
              <p className="text-[11px] text-hc-textSecondary mt-0.5">
                Define the river reach bounding polygon or select an Indian basin.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-semibold text-hc-textSecondary block mb-1">
                  Simulation Scenario Title *
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => handleChange('name', e.target.value)}
                  className="w-full bg-white border border-slate-300 text-xs text-slate-900 rounded-xl px-3.5 py-2.5 focus:outline-none focus:border-blue-500 shadow-xs"
                />
                {errors.name && <span className="text-[10px] text-red-600 mt-1">{errors.name}</span>}
              </div>

              <div>
                <label className="text-xs font-semibold text-hc-textSecondary block mb-1">
                  River Basin / Stream Name *
                </label>
                <input
                  type="text"
                  value={formData.river}
                  onChange={(e) => handleChange('river', e.target.value)}
                  className="w-full bg-white border border-slate-300 text-xs text-slate-900 rounded-xl px-3.5 py-2.5 focus:outline-none focus:border-blue-500 shadow-xs"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-hc-textSecondary block mb-1">
                  State / Geographic Region
                </label>
                <input
                  type="text"
                  value={formData.state}
                  onChange={(e) => handleChange('state', e.target.value)}
                  className="w-full bg-white border border-slate-300 text-xs text-slate-900 rounded-xl px-3.5 py-2.5 focus:outline-none focus:border-blue-500 shadow-xs"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-hc-textSecondary block mb-1">
                  Downstream Reach Length (km)
                </label>
                <input
                  type="number"
                  value={formData.reach_length_km}
                  onChange={(e) => handleChange('reach_length_km', e.target.value)}
                  className="w-full bg-white border border-slate-300 text-xs text-slate-900 rounded-xl px-3.5 py-2.5 focus:outline-none focus:border-blue-500 shadow-xs"
                />
              </div>
            </div>
          </div>
        )}

        {/* STEP 2: Dam Parameters */}
        {currentStep === 2 && (
          <div className="space-y-4">
            <div className="pb-3 border-b border-hc-border">
              <h3 className="text-xs font-bold uppercase tracking-wider text-hc-ink flex items-center gap-2">
                <Database className="w-4 h-4 text-amber-600" />
                <span>2. Dam Structure &amp; Reservoir Parameters</span>
              </h3>
              <p className="text-[11px] text-hc-textSecondary mt-0.5">
                Dam embankment specs and stored potential energy.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-semibold text-hc-textSecondary block mb-1">
                  Dam Structure Name *
                </label>
                <input
                  type="text"
                  value={formData.dam_name}
                  onChange={(e) => handleChange('dam_name', e.target.value)}
                  className="w-full bg-white border border-slate-300 text-xs text-slate-900 rounded-xl px-3.5 py-2.5 focus:outline-none focus:border-blue-500 shadow-xs"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-hc-textSecondary block mb-1">
                  Embankment Type
                </label>
                <select
                  value={formData.dam_type}
                  onChange={(e) => handleChange('dam_type', e.target.value)}
                  className="w-full bg-white border border-slate-300 text-xs text-slate-900 rounded-xl px-3.5 py-2.5 focus:outline-none focus:border-blue-500 shadow-xs"
                >
                  <option value="rockfill">Earth &amp; Rockfill Embankment</option>
                  <option value="earthen">Homogeneous Earthen Embankment</option>
                  <option value="concrete_gravity">Concrete Gravity Monolith</option>
                  <option value="landslide_dam">Landslide / Moraine Blockage (GLOF)</option>
                </select>
              </div>

              <div>
                <label className="text-xs font-semibold text-hc-textSecondary block mb-1">
                  Dam Height (m) *
                </label>
                <input
                  type="number"
                  value={formData.dam_height_m}
                  onChange={(e) => handleChange('dam_height_m', e.target.value)}
                  className="w-full bg-white border border-slate-300 text-xs text-slate-900 rounded-xl px-3.5 py-2.5 focus:outline-none focus:border-blue-500 shadow-xs"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-hc-textSecondary block mb-1">
                  Reservoir Storage Volume (m³) *
                </label>
                <input
                  type="number"
                  value={formData.reservoir_volume_m3}
                  onChange={(e) => handleChange('reservoir_volume_m3', e.target.value)}
                  className="w-full bg-white border border-slate-300 text-xs text-slate-900 rounded-xl px-3.5 py-2.5 focus:outline-none focus:border-blue-500 shadow-xs"
                />
                <span className="text-[10px] font-mono text-blue-700 mt-1 block font-bold">
                  = {(Number(formData.reservoir_volume_m3) / 1e6).toFixed(1)} Million m³ (MCM)
                </span>
              </div>
            </div>
          </div>
        )}

        {/* STEP 3: Model Selection matching Image 2 top-right */}
        {currentStep === 3 && (
          <div className="space-y-4">
            <div className="pb-3 border-b border-hc-border">
              <h3 className="text-xs font-bold uppercase tracking-wider text-hc-ink flex items-center gap-2">
                <Cpu className="w-4 h-4 text-blue-600" />
                <span>3. Hydrodynamic Model Selection</span>
              </h3>
              <p className="text-[11px] text-hc-textSecondary mt-0.5">
                Select SPH, Delft3D, or run both in comparison mode.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* SPH Card */}
              <div
                onClick={() => handleChange('selected_model', 'sph')}
                className={`p-4 rounded-xl border cursor-pointer transition space-y-2 shadow-sm ${
                  formData.selected_model === 'sph' || formData.selected_model === 'both'
                    ? 'bg-white border-cyan-500 ring-1 ring-cyan-500/30'
                    : 'bg-white border-hc-border hover:border-slate-300'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-hc-ink">Smooth Particle Hydrodynamics (SPH)</span>
                  <span className="text-[9px] font-mono text-cyan-800 bg-cyan-50 px-1.5 py-0.5 rounded border border-cyan-200 font-bold">3D Solver</span>
                </div>
                <p className="text-[11px] text-hc-textSecondary">
                  Lagrangian mesh-free particle Navier-Stokes for supercritical near-field splash and wave runup.
                </p>
              </div>

              {/* Delft3D Card */}
              <div
                onClick={() => handleChange('selected_model', 'delft3d')}
                className={`p-4 rounded-xl border cursor-pointer transition space-y-2 shadow-sm ${
                  formData.selected_model === 'delft3d' || formData.selected_model === 'both'
                    ? 'bg-white border-blue-500 ring-1 ring-blue-500/30'
                    : 'bg-white border-hc-border hover:border-slate-300'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-hc-ink">Delft3D Flexible Mesh (FM)</span>
                  <span className="text-[9px] font-mono text-blue-800 bg-blue-50 px-1.5 py-0.5 rounded border border-blue-200 font-bold">2D SWE</span>
                </div>
                <p className="text-[11px] text-hc-textSecondary">
                  Eulerian shallow water equations over unstructured polygonal mesh for long downstream corridor routing.
                </p>
              </div>
            </div>

            <div className="p-3 bg-hc-card rounded-xl border border-hc-border flex items-center justify-between">
              <span className="text-xs text-hc-textSecondary">Run in Comparison Mode (Dual Solvers)</span>
              <button
                onClick={() => handleChange('selected_model', formData.selected_model === 'both' ? 'delft3d' : 'both')}
                className={`px-3 py-1 rounded-lg text-xs font-bold transition ${
                  formData.selected_model === 'both'
                    ? 'bg-blue-600 text-white shadow-sm'
                    : 'bg-white border border-slate-300 text-slate-700'
                }`}
              >
                {formData.selected_model === 'both' ? 'Comparison Mode: ON' : 'Comparison Mode: OFF'}
              </button>
            </div>
          </div>
        )}

        {/* STEP 4: Breach Scenario */}
        {currentStep === 4 && (
          <div className="space-y-4">
            <div className="pb-3 border-b border-hc-border">
              <h3 className="text-xs font-bold uppercase tracking-wider text-hc-ink flex items-center gap-2">
                <Sliders className="w-4 h-4 text-red-600" />
                <span>4. Breach Trigger Scenario &amp; Formation Mechanics</span>
              </h3>
              <p className="text-[11px] text-hc-textSecondary mt-0.5">
                Configure breach width, failure timeline, or enable empirical Froehlich estimation.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-semibold text-hc-textSecondary block mb-1">
                  Failure Type
                </label>
                <select
                  value={formData.breach_mode}
                  onChange={(e) => handleChange('breach_mode', e.target.value)}
                  className="w-full bg-white border border-slate-300 text-xs text-slate-900 rounded-xl px-3.5 py-2.5 focus:outline-none focus:border-blue-500 shadow-xs"
                >
                  <option value="instantaneous">Instantaneous Collapse</option>
                  <option value="overtopping">Progressive Overtopping</option>
                  <option value="piping">Internal Piping Erosion</option>
                </select>
              </div>

              <div>
                <div className="flex justify-between items-center mb-1">
                  <label className="text-xs font-semibold text-hc-textSecondary">Breach Width (m)</label>
                  <span className="text-xs font-mono font-bold text-cyan-700">{formData.breach_width_m} m</span>
                </div>
                <input
                  type="range"
                  min="20"
                  max="400"
                  step="5"
                  value={formData.breach_width_m}
                  onChange={(e) => handleChange('breach_width_m', parseInt(e.target.value))}
                  className="w-full accent-blue-600"
                />
              </div>

              <div>
                <div className="flex justify-between items-center mb-1">
                  <label className="text-xs font-semibold text-hc-textSecondary">Time of Failure (hrs)</label>
                  <span className="text-xs font-mono font-bold text-amber-800">{formData.time_of_failure_hrs} hrs</span>
                </div>
                <input
                  type="range"
                  min="0.1"
                  max="5.0"
                  step="0.05"
                  value={formData.time_of_failure_hrs}
                  onChange={(e) => handleChange('time_of_failure_hrs', parseFloat(e.target.value))}
                  className="w-full accent-blue-600"
                />
              </div>

              <div className="flex items-center pt-5">
                <label className="flex items-center space-x-2 text-xs text-hc-textSecondary cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.estimate_unknown_time}
                    onChange={(e) => handleChange('estimate_unknown_time', e.target.checked)}
                    className="w-4 h-4 rounded bg-white border-slate-300 text-blue-600 focus:ring-0"
                  />
                  <span>Time of failure unknown → estimate from Froehlich (2008) formula</span>
                </label>
              </div>
            </div>
          </div>
        )}

        {/* Footer Navigation */}
        <div className="pt-4 border-t border-hc-border flex items-center justify-between">
          {currentStep > 1 ? (
            <button
              onClick={handleBack}
              className="px-4 py-2 rounded-xl bg-white hover:bg-slate-100 border border-slate-200 text-slate-800 text-xs font-semibold flex items-center space-x-1.5 shadow-xs"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Back</span>
            </button>
          ) : <div />}

          <div className="flex space-x-3">
            {currentStep < 4 ? (
              <button
                onClick={handleNext}
                className="px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs flex items-center space-x-1.5 shadow-sm"
              >
                <span>Continue</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            ) : (
              <button
                onClick={handleSubmit}
                disabled={isSubmitting || isSimulating}
                className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-500 hover:to-cyan-500 text-white font-bold text-xs flex items-center space-x-2 shadow-glow-blue disabled:opacity-50"
              >
                <Sparkles className="w-4 h-4 fill-white" />
                <span>{isSubmitting || isSimulating ? 'Submitting to Queue...' : 'Launch Simulation'}</span>
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
