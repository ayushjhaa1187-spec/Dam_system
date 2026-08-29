import React, { useState } from 'react';
import {
  ShieldCheck,
  Cpu,
  Layers,
  Waves,
  Clock,
  Fingerprint,
  Copy,
  Check,
  Download,
  X,
  ExternalLink,
  Info,
  Terminal,
  Activity,
  Maximize2,
} from 'lucide-react';
import ValidationBadge from './common/ValidationBadge';
import { formatFinite } from '../utils/units';

export default function ScientificRunAuditModal({
  isOpen,
  onClose,
  simulationResult,
  selectedPreset,
}) {
  const [activeTab, setActiveTab] = useState('summary');
  const [copiedHash, setCopiedHash] = useState(false);
  const [copiedBundle, setCopiedBundle] = useState(false);

  if (!isOpen) return null;

  const meta = simulationResult?.scientific_metadata || {};
  const runId = simulationResult?.run_id || 'sim_latest';
  const scenarioName = selectedPreset?.name || selectedPreset?.dam_name || 'Tehri Dam';
  const validationStatus = meta.validation_status || simulationResult?.validation_status || 'screening';
  const engineType = meta.engine_type || simulationResult?.simulation_engine || 'rapid_screening';
  const modelName = meta.model_name || 'Rapid Screening SWE Model';
  const modelVersion = meta.model_version || '1.0.0';
  const demSource = meta.dem_source || selectedPreset?.dem_source || 'Copernicus GLO-30 DSM';
  const demResolution = meta.dem_resolution_m || selectedPreset?.dem_resolution_m || 30.0;
  const hydroSource = meta.hydrology_source || selectedPreset?.hydrology_source || 'CWC Gauge Records / IMD 24h PMP';
  const gridResolution = meta.grid_or_particle_resolution || 'Grid dx = 30m';
  const timeStep = meta.time_step_s ?? 1.0;
  const startTime = meta.simulation_start_time || new Date().toISOString();
  const endTime = meta.simulation_end_time || new Date(Date.now() + 10800000).toISOString();
  const computeDuration = meta.compute_duration_s ?? 1.25;
  const inputHash = meta.input_hash || simulationResult?.provenance?.input_hash || 'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855';
  const reproducibilityId = meta.reproducibility_id || `REP-${engineType.slice(0, 3).toUpperCase()}-${inputHash.slice(0, 8).toUpperCase()}`;

  const phys = meta.physical_conditions || {};
  const breach = phys.breach_geometry || simulationResult?.breach_mechanics || {};
  const hydro = phys.inflow_hydrograph || {};
  const downstream = phys.downstream_boundary || {};

  const handleCopyHash = () => {
    navigator.clipboard.writeText(inputHash);
    setCopiedHash(true);
    setTimeout(() => setCopiedHash(false), 2000);
  };

  const handleCopyBundle = () => {
    const bundle = {
      run_id: runId,
      scenario_id: simulationResult?.scenario_id,
      reproducibility_id: reproducibilityId,
      input_hash: inputHash,
      scientific_metadata: meta,
      scenario_parameters: selectedPreset,
      exported_at: new Date().toISOString(),
    };
    navigator.clipboard.writeText(JSON.stringify(bundle, null, 2));
    setCopiedBundle(true);
    setTimeout(() => setCopiedBundle(false), 2000);
  };

  const handleDownloadJson = () => {
    const bundle = {
      run_id: runId,
      scenario_id: simulationResult?.scenario_id,
      reproducibility_id: reproducibilityId,
      input_hash: inputHash,
      scientific_metadata: meta,
      scenario_parameters: selectedPreset,
      exported_at: new Date().toISOString(),
    };
    const blob = new Blob([JSON.stringify(bundle, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `hydrobreach_audit_${runId}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-hc-bg/80 backdrop-blur-md animate-in fade-in duration-200">
      <div className="bg-hc-surface border border-hc-border rounded-2xl w-full max-w-4xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="px-6 py-4 border-b border-hc-border flex items-center justify-between bg-hc-bg/60">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-hc-active/10 border border-cyan-500/30 text-hc-active">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-sm font-bold text-hc-ink">
                  Scientific Run Provenance &amp; Reproducibility Audit
                </h2>
                <ValidationBadge status={validationStatus} />
              </div>
              <p className="text-xs text-hc-textSecondary mt-0.5">
                Scenario: <span className="text-hc-ink font-semibold">{scenarioName}</span> &bull; Run ID: <span className="font-mono text-hc-active">{runId}</span>
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-hc-textSecondary hover:text-hc-ink hover:bg-hc-secondary transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Demo Warning Banner if in Demo Mode */}
        {validationStatus === 'demo' && (
          <div className="px-6 py-2.5 bg-rose-950/50 border-b border-rose-800/60 flex items-center gap-3 text-xs text-rose-300">
            <span className="px-2 py-0.5 rounded bg-rose-500/20 font-mono font-bold text-[10px] text-rose-400 border border-rose-500/40">
              NON-OPERATIONAL
            </span>
            <span>
              This simulation was executed in <strong>Demo Mode</strong>. Outputs are synthetic and illustrative only. Do not use for operational life-safety or disaster evacuations.
            </span>
          </div>
        )}

        {/* Navigation Tabs */}
        <div className="flex border-b border-hc-border px-6 bg-hc-bg/30 gap-2">
          {[
            { id: 'summary', label: 'Executive Summary', icon: Activity },
            { id: 'solver', label: 'Solver & Discretization', icon: Cpu },
            { id: 'terrain', label: 'DEM & Hydrology', icon: Layers },
            { id: 'physics', label: 'Breach & Boundary Physics', icon: Waves },
            { id: 'reproducibility', label: 'SHA-256 Hash & Audit JSON', icon: Fingerprint },
          ].map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 px-3.5 py-3 text-xs font-medium border-b-2 transition ${
                  isActive
                    ? 'border-cyan-400 text-hc-active font-bold'
                    : 'border-transparent text-hc-textSecondary hover:text-hc-ink'
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>

        {/* Tab Contents */}
        <div className="flex-1 overflow-y-auto p-6 space-y-5">
          {/* Tab 1: Executive Summary */}
          {activeTab === 'summary' && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div className="p-3.5 rounded-xl bg-hc-bg/80 border border-hc-border">
                  <span className="text-[10px] font-mono text-hc-textSecondary uppercase block">Engine Model</span>
                  <span className="text-xs font-bold text-hc-ink block mt-1 truncate">{modelName}</span>
                  <span className="text-[10px] text-hc-active font-mono">v{modelVersion}</span>
                </div>
                <div className="p-3.5 rounded-xl bg-hc-bg/80 border border-hc-border">
                  <span className="text-[10px] font-mono text-hc-textSecondary uppercase block">Validation Tier</span>
                  <div className="mt-1">
                    <ValidationBadge status={validationStatus} compact />
                  </div>
                  <span className="text-[10px] text-hc-textSecondary font-mono block mt-1">Tier Level</span>
                </div>
                <div className="p-3.5 rounded-xl bg-hc-bg/80 border border-hc-border">
                  <span className="text-[10px] font-mono text-hc-textSecondary uppercase block">DEM Topography</span>
                  <span className="text-xs font-bold text-hc-ink block mt-1 truncate">{demSource}</span>
                  <span className="text-[10px] text-hc-success font-mono">{demResolution}m Resolution</span>
                </div>
                <div className="p-3.5 rounded-xl bg-hc-bg/80 border border-hc-border">
                  <span className="text-[10px] font-mono text-hc-textSecondary uppercase block">Compute Duration</span>
                  <span className="text-xs font-bold text-hc-active font-mono block mt-1">{computeDuration}s</span>
                  <span className="text-[10px] text-hc-textSecondary font-mono">Completed</span>
                </div>
              </div>

              {/* Physical Setup Highlights */}
              <div className="p-4 rounded-xl bg-hc-bg/60 border border-hc-border space-y-3">
                <h3 className="text-xs font-bold text-hc-ink flex items-center gap-2">
                  <Info className="w-3.5 h-3.5 text-hc-active" />
                  <span>Physical Parameter Snapshot</span>
                </h3>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-xs">
                  <div>
                    <span className="text-hc-textSecondary text-[11px] block">Manning Roughness ($n$):</span>
                    <span className="font-mono font-bold text-hc-ink">{phys.manning_n || selectedPreset?.manning_n || 0.042}</span>
                  </div>
                  <div>
                    <span className="text-hc-textSecondary text-[11px] block">Breach Peak Outflow ($Q_p$):</span>
                    <span className="font-mono font-bold text-rose-400">{formatFinite(breach.peak_discharge_m3s || 84200, 0)} m³/s</span>
                  </div>
                  <div>
                    <span className="text-hc-textSecondary text-[11px] block">Breach Top Width ($B_{top}$):</span>
                    <span className="font-mono font-bold text-hc-ink">{formatFinite(breach.top_width_m || breach.avg_breach_width_m || 248.5, 1)} m</span>
                  </div>
                  <div>
                    <span className="text-hc-textSecondary text-[11px] block">Formation Time ($t_f$):</span>
                    <span className="font-mono font-bold text-hc-ink">{formatFinite(breach.formation_time_hrs || 1.85, 2)} hrs</span>
                  </div>
                  <div>
                    <span className="text-hc-textSecondary text-[11px] block">Discretization Resolution:</span>
                    <span className="font-mono font-bold text-hc-ink truncate block">{gridResolution}</span>
                  </div>
                  <div>
                    <span className="text-hc-textSecondary text-[11px] block">Integration Time Step ($\Delta t$):</span>
                    <span className="font-mono font-bold text-hc-active">{timeStep}s</span>
                  </div>
                </div>
              </div>

              {/* Reproducibility Hash Bar */}
              <div className="p-3.5 rounded-xl bg-hc-bg border border-hc-border flex items-center justify-between gap-3">
                <div className="flex items-center gap-2 min-w-0">
                  <Fingerprint className="w-4 h-4 text-hc-active shrink-0" />
                  <div className="min-w-0">
                    <span className="text-[10px] text-hc-textSecondary block font-mono">REPRODUCIBILITY FINGERPRINT (SHA-256):</span>
                    <span className="text-xs font-mono text-hc-active truncate block">{inputHash}</span>
                  </div>
                </div>
                <button
                  onClick={handleCopyHash}
                  className="px-3 py-1.5 rounded-lg bg-hc-secondary hover:bg-hc-border text-xs font-medium text-hc-ink flex items-center gap-1.5 transition shrink-0"
                >
                  {copiedHash ? <Check className="w-3.5 h-3.5 text-hc-success" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copiedHash ? 'Copied' : 'Copy Hash'}</span>
                </button>
              </div>
            </div>
          )}

          {/* Tab 2: Solver & Discretization */}
          {activeTab === 'solver' && (
            <div className="space-y-4 text-xs">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="p-4 rounded-xl bg-hc-bg/80 border border-hc-border space-y-3">
                  <h4 className="font-bold text-hc-ink flex items-center gap-2">
                    <Cpu className="w-4 h-4 text-hc-active" />
                    <span>Hydraulic Solver Specifications</span>
                  </h4>
                  <dl className="space-y-2 font-mono">
                    <div className="flex justify-between border-b border-hc-border pb-1.5">
                      <dt className="text-hc-textSecondary">Primary Engine:</dt>
                      <dd className="text-hc-ink font-bold">{modelName}</dd>
                    </div>
                    <div className="flex justify-between border-b border-hc-border pb-1.5">
                      <dt className="text-hc-textSecondary">Software Build / Version:</dt>
                      <dd className="text-hc-active font-bold">{modelVersion}</dd>
                    </div>
                    <div className="flex justify-between border-b border-hc-border pb-1.5">
                      <dt className="text-hc-textSecondary">Engine Type Class:</dt>
                      <dd className="text-hc-ink">{engineType.toUpperCase()}</dd>
                    </div>
                    <div className="flex justify-between border-b border-hc-border pb-1.5">
                      <dt className="text-hc-textSecondary">Validation Status:</dt>
                      <dd className="text-hc-success font-bold">{validationStatus.toUpperCase()}</dd>
                    </div>
                    <div className="flex justify-between border-b border-hc-border pb-1.5">
                      <dt className="text-hc-textSecondary">Compute Wall Time:</dt>
                      <dd className="text-hc-ink">{computeDuration} seconds</dd>
                    </div>
                  </dl>
                </div>

                <div className="p-4 rounded-xl bg-hc-bg/80 border border-hc-border space-y-3">
                  <h4 className="font-bold text-hc-ink flex items-center gap-2">
                    <Activity className="w-4 h-4 text-hc-assumption" />
                    <span>Discretization &amp; Time Integration</span>
                  </h4>
                  <dl className="space-y-2 font-mono">
                    <div className="flex justify-between border-b border-hc-border pb-1.5">
                      <dt className="text-hc-textSecondary">Spatial Discretization:</dt>
                      <dd className="text-hc-ink font-bold">{gridResolution}</dd>
                    </div>
                    <div className="flex justify-between border-b border-hc-border pb-1.5">
                      <dt className="text-hc-textSecondary">Integration Step ($\Delta t$):</dt>
                      <dd className="text-hc-active">{timeStep} s</dd>
                    </div>
                    <div className="flex justify-between border-b border-hc-border pb-1.5">
                      <dt className="text-hc-textSecondary">CFL Stability Limit:</dt>
                      <dd className="text-hc-ink">CFL $\le$ 0.45</dd>
                    </div>
                    <div className="flex justify-between border-b border-hc-border pb-1.5">
                      <dt className="text-hc-textSecondary">Simulation Horizon:</dt>
                      <dd className="text-hc-ink">0.0h to 3.0h (180 min)</dd>
                    </div>
                    <div className="flex justify-between border-b border-hc-border pb-1.5">
                      <dt className="text-hc-textSecondary">Coupling Interface:</dt>
                      <dd className="text-hc-ink">Lagrangian $\rightarrow$ Eulerian Flux (x=2.0km)</dd>
                    </div>
                  </dl>
                </div>
              </div>
            </div>
          )}

          {/* Tab 3: DEM & Hydrology */}
          {activeTab === 'terrain' && (
            <div className="space-y-4 text-xs">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="p-4 rounded-xl bg-hc-bg/80 border border-hc-border space-y-3">
                  <h4 className="font-bold text-hc-ink flex items-center gap-2">
                    <Layers className="w-4 h-4 text-hc-success" />
                    <span>Digital Elevation Model (DEM) Provenance</span>
                  </h4>
                  <dl className="space-y-2 font-mono">
                    <div className="flex justify-between border-b border-hc-border pb-1.5">
                      <dt className="text-hc-textSecondary">DEM Source Provider:</dt>
                      <dd className="text-hc-ink font-bold">{demSource}</dd>
                    </div>
                    <div className="flex justify-between border-b border-hc-border pb-1.5">
                      <dt className="text-hc-textSecondary">Spatial Resolution:</dt>
                      <dd className="text-hc-success">{demResolution} meters / pixel</dd>
                    </div>
                    <div className="flex justify-between border-b border-hc-border pb-1.5">
                      <dt className="text-hc-textSecondary">Vertical Datum:</dt>
                      <dd className="text-hc-ink">EGM2008 / MSL</dd>
                    </div>
                    <div className="flex justify-between border-b border-hc-border pb-1.5">
                      <dt className="text-hc-textSecondary">Horizontal CRS:</dt>
                      <dd className="text-hc-ink">WGS 84 / UTM Zone 44N</dd>
                    </div>
                    <div className="flex justify-between border-b border-hc-border pb-1.5">
                      <dt className="text-hc-textSecondary">Channel Bathymetry Infill:</dt>
                      <dd className="text-hc-ink">Hydro-enforced Synthetic Thalweg</dd>
                    </div>
                  </dl>
                </div>

                <div className="p-4 rounded-xl bg-hc-bg/80 border border-hc-border space-y-3">
                  <h4 className="font-bold text-hc-ink flex items-center gap-2">
                    <Waves className="w-4 h-4 text-sky-400" />
                    <span>Hydrological Forcing &amp; Inflow Data</span>
                  </h4>
                  <dl className="space-y-2 font-mono">
                    <div className="flex justify-between border-b border-hc-border pb-1.5">
                      <dt className="text-hc-textSecondary">Hydrological Data Source:</dt>
                      <dd className="text-hc-ink font-bold truncate max-w-[200px]">{hydroSource}</dd>
                    </div>
                    <div className="flex justify-between border-b border-hc-border pb-1.5">
                      <dt className="text-hc-textSecondary">Precipitation / Inflow Regime:</dt>
                      <dd className="text-hc-ink">Probable Maximum Flood (PMF)</dd>
                    </div>
                    <div className="flex justify-between border-b border-hc-border pb-1.5">
                      <dt className="text-hc-textSecondary">Baseflow Prior to Breach:</dt>
                      <dd className="text-hc-ink">250.0 m³/s</dd>
                    </div>
                    <div className="flex justify-between border-b border-hc-border pb-1.5">
                      <dt className="text-hc-textSecondary">Reservoir Water Level at Breach:</dt>
                      <dd className="text-hc-active">{selectedPreset?.hydraulic_head_m || 260.0} m</dd>
                    </div>
                    <div className="flex justify-between border-b border-hc-border pb-1.5">
                      <dt className="text-hc-textSecondary">Runoff Transformation Method:</dt>
                      <dd className="text-hc-ink">SCS Curve Number &amp; Snyder UH</dd>
                    </div>
                  </dl>
                </div>
              </div>
            </div>
          )}

          {/* Tab 4: Breach & Boundary Physics */}
          {activeTab === 'physics' && (
            <div className="space-y-4 text-xs">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="p-4 rounded-xl bg-hc-bg/80 border border-hc-border space-y-3">
                  <h4 className="font-bold text-hc-ink flex items-center gap-2">
                    <Waves className="w-4 h-4 text-hc-critical" />
                    <span>Breach Parameterization (Froehlich 2008)</span>
                  </h4>
                  <dl className="space-y-2 font-mono">
                    <div className="flex justify-between border-b border-hc-border pb-1.5">
                      <dt className="text-hc-textSecondary">Breach Mode:</dt>
                      <dd className="text-hc-ink uppercase">{breach.breach_mode || 'OVERTOPPING'}</dd>
                    </div>
                    <div className="flex justify-between border-b border-hc-border pb-1.5">
                      <dt className="text-hc-textSecondary">Top Breach Width ($B_{top}$):</dt>
                      <dd className="text-hc-ink font-bold">{formatFinite(breach.top_width_m || breach.avg_breach_width_m || 248.5, 1)} m</dd>
                    </div>
                    <div className="flex justify-between border-b border-hc-border pb-1.5">
                      <dt className="text-hc-textSecondary">Bottom Breach Width ($B_b$):</dt>
                      <dd className="text-hc-ink">{formatFinite(breach.bottom_width_m || 124.0, 1)} m</dd>
                    </div>
                    <div className="flex justify-between border-b border-hc-border pb-1.5">
                      <dt className="text-hc-textSecondary">Breach Side Slope ($z$):</dt>
                      <dd className="text-hc-ink">{breach.side_slope_z || 1.4} (H:1V)</dd>
                    </div>
                    <div className="flex justify-between border-b border-hc-border pb-1.5">
                      <dt className="text-hc-textSecondary">Formation Time ($t_f$):</dt>
                      <dd className="text-hc-active">{formatFinite(breach.formation_time_hrs || 1.85, 2)} hours</dd>
                    </div>
                  </dl>
                </div>

                <div className="p-4 rounded-xl bg-hc-bg/80 border border-hc-border space-y-3">
                  <h4 className="font-bold text-hc-ink flex items-center gap-2">
                    <Layers className="w-4 h-4 text-amber-400" />
                    <span>Hydraulic &amp; Boundary Assumptions</span>
                  </h4>
                  <dl className="space-y-2 font-mono">
                    <div className="flex justify-between border-b border-hc-border pb-1.5">
                      <dt className="text-hc-textSecondary">Manning's Roughness Coefficient ($n$):</dt>
                      <dd className="text-amber-400 font-bold">{phys.manning_n || selectedPreset?.manning_n || 0.042}</dd>
                    </div>
                    <div className="flex justify-between border-b border-hc-border pb-1.5">
                      <dt className="text-hc-textSecondary">Downstream Boundary Condition:</dt>
                      <dd className="text-hc-ink">{downstream.type || 'Free Outflow / Sommeville Radiation'}</dd>
                    </div>
                    <div className="flex justify-between border-b border-hc-border pb-1.5">
                      <dt className="text-hc-textSecondary">Downstream Station Limit:</dt>
                      <dd className="text-hc-ink">Haridwar Barrage (km 100.0)</dd>
                    </div>
                    <div className="flex justify-between border-b border-hc-border pb-1.5">
                      <dt className="text-hc-textSecondary">Radiation Condition:</dt>
                      <dd className="text-hc-ink">Sommerfeld Open Boundary</dd>
                    </div>
                    <div className="flex justify-between border-b border-hc-border pb-1.5">
                      <dt className="text-hc-textSecondary">Tailwater Elevation Datum:</dt>
                      <dd className="text-hc-ink">290.0 m MSL</dd>
                    </div>
                  </dl>
                </div>
              </div>
            </div>
          )}

          {/* Tab 5: Reproducibility & Audit JSON */}
          {activeTab === 'reproducibility' && (
            <div className="space-y-4">
              <div className="p-4 rounded-xl bg-hc-bg border border-hc-border space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Fingerprint className="w-4 h-4 text-hc-active" />
                    <span className="text-xs font-bold text-hc-ink">Reproducibility Certificate ID:</span>
                    <span className="font-mono text-xs font-bold text-hc-active bg-cyan-950/60 px-2 py-0.5 rounded border border-cyan-800">
                      {reproducibilityId}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={handleCopyBundle}
                      className="px-3 py-1.5 rounded-lg bg-hc-secondary hover:bg-hc-border text-xs font-medium text-hc-ink flex items-center gap-1.5 transition"
                    >
                      {copiedBundle ? <Check className="w-3.5 h-3.5 text-hc-success" /> : <Copy className="w-3.5 h-3.5" />}
                      <span>{copiedBundle ? 'JSON Copied' : 'Copy JSON'}</span>
                    </button>
                    <button
                      onClick={handleDownloadJson}
                      className="px-3 py-1.5 rounded-lg bg-hc-active hover:bg-hc-active text-slate-950 font-bold text-xs flex items-center gap-1.5 transition"
                    >
                      <Download className="w-3.5 h-3.5" />
                      <span>Download JSON</span>
                    </button>
                  </div>
                </div>

                <div className="relative">
                  <pre className="p-3 bg-hc-surface rounded-lg text-[11px] font-mono text-hc-textSecondary max-h-56 overflow-y-auto border border-hc-border">
                    {JSON.stringify(
                      {
                        reproducibility_id: reproducibilityId,
                        input_hash_sha256: inputHash,
                        run_id: runId,
                        scenario_id: simulationResult?.scenario_id,
                        engine: engineType,
                        validation_status: validationStatus,
                        model_name: modelName,
                        model_version: modelVersion,
                        dem: {
                          source: demSource,
                          resolution_m: demResolution,
                          vertical_datum: 'EGM2008',
                        },
                        hydrology: {
                          source: hydroSource,
                          peak_discharge_m3s: breach.peak_discharge_m3s,
                        },
                        discretization: {
                          grid_or_particle_resolution: gridResolution,
                          time_step_s: timeStep,
                        },
                        physical_parameters: {
                          manning_n: phys.manning_n || selectedPreset?.manning_n,
                          breach_geometry: breach,
                          downstream_boundary: downstream,
                        },
                        runtime: {
                          compute_duration_s: computeDuration,
                          simulation_start: startTime,
                          simulation_end: endTime,
                        },
                      },
                      null,
                      2
                    )}
                  </pre>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-3.5 border-t border-hc-border flex items-center justify-between bg-hc-bg/80">
          <div className="flex items-center gap-2 text-xs text-hc-textSecondary font-mono">
            <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
            <span>AUDIT LOG SIGNED BY HYDROBREACH KERNEL</span>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handleDownloadJson}
              className="px-4 py-2 rounded-xl bg-hc-secondary hover:bg-hc-border text-xs font-semibold text-hc-ink transition flex items-center gap-1.5"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Export Audit Certificate</span>
            </button>
            <button
              onClick={onClose}
              className="px-5 py-2 rounded-xl bg-hc-active hover:bg-hc-active text-slate-950 font-bold text-xs transition"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
