import React, { useState } from 'react';
import {
  Sliders,
  Play,
  Layers,
  Cpu,
  Waves,
  Sparkles,
  CheckCircle2,
  AlertTriangle,
  Info,
  ArrowRight,
  GitCompare,
} from 'lucide-react';
import PageHeader from '../components/common/PageHeader';
import Tooltip from '../components/common/Tooltip';

export default function ModelConfigScreen({
  selectedPreset,
  onRunSimulation,
  onNavigate,
  isSimulating,
}) {
  const [activeTab, setActiveTab] = useState('model_selection'); // 'model_selection', 'hydraulic_params', 'breach_params'
  const [selectedModel, setSelectedModel] = useState('both'); // 'delft3d', 'sph', 'both'
  const [comparisonMode, setComparisonMode] = useState(true);

  // Parameter sliders state
  const [breachType, setBreachType] = useState('instantaneous');
  const [breachWidth, setBreachWidth] = useState(120);
  const [formationTime, setFormationTime] = useState(0.25);
  const [reservoirLevel, setReservoirLevel] = useState(98);
  const [duration, setDuration] = useState(24);

  // Advanced Hydraulic parameters
  const [manningN, setManningN] = useState(0.042);
  const [gridRes, setGridRes] = useState(30);
  const [particleSpacing, setParticleSpacing] = useState(2.5);
  const [boundaryCondition, setBoundaryCondition] = useState('free_outflow');

  const handleLaunch = () => {
    if (onRunSimulation) {
      onRunSimulation({
        solver_type: comparisonMode ? 'coupled' : selectedModel,
        breach_params: {
          breach_type: breachType,
          breach_width_m: breachWidth,
          formation_time_hrs: formationTime,
          reservoir_level_pct: reservoirLevel,
          duration_hrs: duration,
        },
        hydraulic_params: {
          manning_n: manningN,
          grid_resolution_m: gridRes,
          particle_spacing_m: particleSpacing,
          boundary_condition: boundaryCondition,
        }
      });
    }
    if (onNavigate) {
      onNavigate(comparisonMode ? 'scenarios' : 'results');
    }
  };

  return (
    <div className="p-6 sm:p-8 max-w-5xl mx-auto space-y-6 text-hc-ink">
      {/* Header */}
      <PageHeader
        category="HYDRODYNAMIC SOLVER ENGINE &bull; MODEL CONFIGURATION"
        title="Simulation Settings &amp; Solver Setup"
        subtitle="Configure Delft3D Flexible Mesh and Smooth Particle Hydrodynamics (SPH) solver engines, roughness coefficients, and failure parameters."
        status="CONFIGURED"
        statusLabel="SOLVER READY"
        actions={
          <button
            onClick={handleLaunch}
            disabled={isSimulating}
            className="flex items-center gap-1.5 px-5 py-2.5 rounded-xl bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-500 hover:to-cyan-500 text-white font-bold text-xs transition shadow-glow-blue disabled:opacity-50"
          >
            <Play className={`w-4 h-4 fill-white ${isSimulating ? 'animate-spin' : ''}`} />
            <span>{isSimulating ? 'Computing Hydrodynamics...' : 'Run Simulation'}</span>
          </button>
        }
      />

      {/* Tabs Selector Bar */}
      <div className="flex space-x-2 border-b border-hc-border pb-2">
        {[
          { id: 'model_selection', label: 'Model Selection', icon: Cpu },
          { id: 'hydraulic_params', label: 'Hydraulic Params', icon: Waves },
          { id: 'breach_params', label: 'Breach Parameters', icon: Sliders },
        ].map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center space-x-2 px-4 py-2 rounded-xl text-xs font-semibold transition ${
                isActive
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'text-hc-textSecondary hover:text-hc-ink hover:bg-hc-surface'
              }`}
            >
              <Icon className="w-3.5 h-3.5" />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* Main Settings Card */}
      <div className="bg-hc-surface border border-hc-border rounded-2xl p-6 space-y-6 shadow-card-dark">
        {/* 1. Model Selection Tab Content */}
        {activeTab === 'model_selection' && (
          <div className="space-y-6">
            <div className="flex items-center justify-between pb-3 border-b border-hc-border">
              <div>
                <h3 className="text-xs font-bold uppercase tracking-wider text-hc-ink">
                  Select Hydrodynamic Solver Architecture
                </h3>
                <p className="text-[11px] text-hc-textSecondary mt-0.5">
                  Choose between Eulerian shallow-water mesh or Lagrangian particle fluid mechanics.
                </p>
              </div>
              <span className="text-[10px] font-mono text-cyan-800 bg-cyan-50 px-2.5 py-1 rounded-lg border border-cyan-200 font-bold">
                GPU ACCELERATED
              </span>
            </div>

            {/* Two Selectable Model Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Delft3D Card */}
              <div
                onClick={() => setSelectedModel('delft3d')}
                className={`p-5 rounded-2xl border transition cursor-pointer flex flex-col justify-between space-y-4 shadow-sm ${
                  selectedModel === 'delft3d' || comparisonMode
                    ? 'bg-white border-blue-500 ring-1 ring-blue-500/30'
                    : 'bg-white border-hc-border hover:border-slate-300'
                }`}
              >
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <div className="w-8 h-8 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center border border-blue-200">
                        <Waves className="w-4 h-4" />
                      </div>
                      <div>
                        <h4 className="text-sm font-bold text-hc-ink">Delft3D (Flexible Mesh)</h4>
                        <span className="text-[10px] font-mono text-hc-textSecondary">
                          Eulerian 2D/3D Shallow Water Equations
                        </span>
                      </div>
                    </div>
                    <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-blue-50 text-blue-700 border border-blue-200">
                      STABLE FAR-FIELD
                    </span>
                  </div>

                  <p className="text-xs text-hc-textSecondary leading-relaxed">
                    Solves non-linear shallow water equations over an unstructured polygonal flexible grid. Ideal for long downstream flood routing (2–100 km).
                  </p>
                </div>

                <div className="grid grid-cols-2 gap-2 p-2.5 bg-slate-50 rounded-xl border border-slate-200 text-[11px] font-mono text-hc-textSecondary">
                  <div>Grid: <strong className="text-hc-ink font-bold">15m–60m Mesh</strong></div>
                  <div>Turbulence: <strong className="text-hc-ink font-bold">k-ε Model</strong></div>
                </div>
              </div>

              {/* SPH Card */}
              <div
                onClick={() => setSelectedModel('sph')}
                className={`p-5 rounded-2xl border transition cursor-pointer flex flex-col justify-between space-y-4 shadow-sm ${
                  selectedModel === 'sph' || comparisonMode
                    ? 'bg-white border-cyan-500 ring-1 ring-cyan-500/30'
                    : 'bg-white border-hc-border hover:border-slate-300'
                }`}
              >
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <div className="w-8 h-8 rounded-xl bg-cyan-50 text-cyan-700 flex items-center justify-center border border-cyan-200">
                        <Cpu className="w-4 h-4" />
                      </div>
                      <div>
                        <h4 className="text-sm font-bold text-hc-ink">Smooth Particle Hydrodynamics (SPH)</h4>
                        <span className="text-[10px] font-mono text-hc-textSecondary">
                          Lagrangian Mesh-Free Particle Navier-Stokes
                        </span>
                      </div>
                    </div>
                    <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-cyan-50 text-cyan-700 border border-cyan-200">
                      HIGH-IMPACT NEAR-FIELD
                    </span>
                  </div>

                  <p className="text-xs text-hc-textSecondary leading-relaxed">
                    Captures 3D turbulent splashing, supercritical wave front breakout, and gorge wall runup in the immediate 0–2 km dam axis corridor.
                  </p>
                </div>

                <div className="grid grid-cols-2 gap-2 p-2.5 bg-slate-50 rounded-xl border border-slate-200 text-[11px] font-mono text-hc-textSecondary">
                  <div>Particles: <strong className="text-hc-ink font-bold">120,000 Pts</strong></div>
                  <div>Kernel: <strong className="text-hc-ink font-bold">Wendland C2</strong></div>
                </div>
              </div>
            </div>

            {/* Comparison Mode Toggle Switch */}
            <div className="p-4 rounded-xl bg-hc-card border border-hc-border flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="w-9 h-9 rounded-xl bg-purple-100 text-purple-700 flex items-center justify-center border border-purple-300">
                  <GitCompare className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-hc-ink">
                    Comparison Mode – Run Both Models &amp; Compare Results
                  </h4>
                  <p className="text-[11px] text-hc-textSecondary">
                    Executes synchronized multi-scale simulation and generates side-by-side verification analytics.
                  </p>
                </div>
              </div>

              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={comparisonMode}
                  onChange={(e) => setComparisonMode(e.target.checked)}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-slate-300 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600 border border-slate-300"></div>
              </label>
            </div>
          </div>
        )}

        {/* 2. Hydraulic Params Tab */}
        {activeTab === 'hydraulic_params' && (
          <div className="space-y-4">
            <div className="pb-3 border-b border-hc-border">
              <h3 className="text-xs font-bold uppercase tracking-wider text-hc-ink">
                Advanced Hydraulic &amp; Grid Discretization
              </h3>
              <p className="text-[11px] text-hc-textSecondary mt-0.5">
                Adjust Manning bed roughness, boundary friction, and numerical resolution.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-semibold text-hc-textSecondary block mb-1">
                  Manning’s Roughness (n): <span className="text-blue-700 font-mono font-bold">{manningN}</span>
                </label>
                <input
                  type="range"
                  min="0.015"
                  max="0.085"
                  step="0.001"
                  value={manningN}
                  onChange={(e) => setManningN(parseFloat(e.target.value))}
                  className="w-full accent-blue-600"
                />
                <span className="text-[10px] text-hc-textMuted mt-1 block">
                  0.035 (Alluvial plain) &bull; 0.042 (Mountain gorge) &bull; 0.060 (Boulder bed)
                </span>
              </div>

              <div>
                <label className="text-xs font-semibold text-hc-textSecondary block mb-1">
                  Delft3D Flexible Mesh Resolution: <span className="text-blue-700 font-mono font-bold">{gridRes} m</span>
                </label>
                <input
                  type="range"
                  min="10"
                  max="100"
                  step="5"
                  value={gridRes}
                  onChange={(e) => setGridRes(parseInt(e.target.value))}
                  className="w-full accent-blue-600"
                />
                <span className="text-[10px] text-hc-textMuted mt-1 block">
                  Higher resolution increases computation time exponentially.
                </span>
              </div>

              <div>
                <label className="text-xs font-semibold text-hc-textSecondary block mb-1">
                  SPH Initial Particle Spacing: <span className="text-cyan-700 font-mono font-bold">{particleSpacing} m</span>
                </label>
                <input
                  type="range"
                  min="1.0"
                  max="5.0"
                  step="0.1"
                  value={particleSpacing}
                  onChange={(e) => setParticleSpacing(parseFloat(e.target.value))}
                  className="w-full accent-blue-600"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-hc-textSecondary block mb-1">
                  Downstream Boundary Condition
                </label>
                <select
                  value={boundaryCondition}
                  onChange={(e) => setBoundaryCondition(e.target.value)}
                  className="w-full bg-white border border-slate-300 text-xs text-slate-900 rounded-xl px-3.5 py-2 focus:outline-none focus:border-blue-500 shadow-xs"
                >
                  <option value="free_outflow">Free Outflow / Critical Depth</option>
                  <option value="stage_discharge">Rating Curve / Q-h Stage Hydrograph</option>
                  <option value="closed_weir">Closed Dam Barrage Obstruction</option>
                </select>
              </div>
            </div>
          </div>
        )}

        {/* 3. Breach Parameters Tab */}
        {activeTab === 'breach_params' && (
          <div className="space-y-5">
            <div className="pb-3 border-b border-hc-border">
              <h3 className="text-xs font-bold uppercase tracking-wider text-hc-ink">
                Dam Breach &amp; Reservoir Mechanics
              </h3>
              <p className="text-[11px] text-hc-textSecondary mt-0.5">
                Exact slider controls matching Panel 4 in the reference specification.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-semibold text-hc-textSecondary block mb-1">
                  Breach Failure Type
                </label>
                <select
                  value={breachType}
                  onChange={(e) => setBreachType(e.target.value)}
                  className="w-full bg-white border border-slate-300 text-xs text-slate-900 rounded-xl px-3.5 py-2 focus:outline-none focus:border-blue-500 shadow-xs"
                >
                  <option value="instantaneous">Instantaneous Collapse (Full Breach)</option>
                  <option value="overtopping">Progressive Overtopping Breach</option>
                  <option value="piping">Internal Piping Erosion</option>
                </select>
              </div>

              <div>
                <div className="flex justify-between items-center mb-1">
                  <label className="text-xs font-semibold text-hc-textSecondary">
                    Breach Width (m)
                  </label>
                  <span className="text-xs font-mono font-bold text-cyan-700">{breachWidth} m</span>
                </div>
                <input
                  type="range"
                  min="20"
                  max="400"
                  step="5"
                  value={breachWidth}
                  onChange={(e) => setBreachWidth(parseInt(e.target.value))}
                  className="w-full accent-blue-600"
                />
              </div>

              <div>
                <div className="flex justify-between items-center mb-1">
                  <label className="text-xs font-semibold text-hc-textSecondary">
                    Breach Formation Time (hr)
                  </label>
                  <span className="text-xs font-mono font-bold text-amber-700">{formationTime} hr ({(formationTime * 60).toFixed(0)} min)</span>
                </div>
                <input
                  type="range"
                  min="0.1"
                  max="4.0"
                  step="0.05"
                  value={formationTime}
                  onChange={(e) => setFormationTime(parseFloat(e.target.value))}
                  className="w-full accent-blue-600"
                />
              </div>

              <div>
                <div className="flex justify-between items-center mb-1">
                  <label className="text-xs font-semibold text-hc-textSecondary">
                    Reservoir Level (%)
                  </label>
                  <span className="text-xs font-mono font-bold text-blue-700">{reservoirLevel}% FRL</span>
                </div>
                <input
                  type="range"
                  min="50"
                  max="100"
                  step="1"
                  value={reservoirLevel}
                  onChange={(e) => setReservoirLevel(parseInt(e.target.value))}
                  className="w-full accent-blue-600"
                />
              </div>

              <div className="sm:col-span-2">
                <div className="flex justify-between items-center mb-1">
                  <label className="text-xs font-semibold text-hc-textSecondary">
                    Simulation Duration (hr)
                  </label>
                  <span className="text-xs font-mono font-bold text-emerald-700">{duration} Hours</span>
                </div>
                <input
                  type="range"
                  min="1"
                  max="48"
                  step="1"
                  value={duration}
                  onChange={(e) => setDuration(parseInt(e.target.value))}
                  className="w-full accent-blue-600"
                />
              </div>
            </div>
          </div>
        )}

        {/* Footer Actions */}
        <div className="pt-4 border-t border-hc-border flex items-center justify-between">
          <span className="text-[11px] font-mono text-hc-textSecondary">
            Estimated Compute Duration: <strong className="text-hc-ink">~45 mins (Dual-Engine)</strong>
          </span>

          <button
            onClick={handleLaunch}
            disabled={isSimulating}
            className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-500 hover:to-cyan-500 text-white font-bold text-xs flex items-center space-x-2 transition shadow-glow-blue disabled:opacity-50"
          >
            <Play className={`w-3.5 h-3.5 fill-white ${isSimulating ? 'animate-spin' : ''}`} />
            <span>{isSimulating ? 'Queuing Jobs in Celery...' : 'Run Simulation'}</span>
          </button>
        </div>
      </div>
    </div>
  );
}
