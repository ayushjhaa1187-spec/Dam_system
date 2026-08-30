import React from 'react';
import {
  Waves,
  Play,
  ArrowRight,
  Database,
  Satellite,
  Layers,
  Activity,
  Sparkles,
  ShieldCheck,
  CheckCircle2,
  MapPin,
  Flame,
  Globe,
} from 'lucide-react';
import StatusBadge from '../components/common/StatusBadge';

export default function HomeScreen({
  presets = [],
  selectedPreset,
  onSelectPreset,
  onRunSimulation,
  onNavigate,
  onOpenTutorial,
  isSimulating,
}) {
  return (
    <div className="space-y-12 pb-12 text-hc-ink">
      {/* 1. Hero Section matching Panel 2 of Image 3 */}
      <div className="relative min-h-[500px] rounded-3xl overflow-hidden border border-hc-border bg-gradient-to-br from-hc-surface via-hc-bg to-hc-canvas mx-4 sm:mx-8 p-8 sm:p-14 flex flex-col justify-between shadow-2xl">
        {/* Background Overlay Visual */}
        <div
          className="absolute inset-0 opacity-20 pointer-events-none"
          style={{
            backgroundImage: `radial-gradient(circle at 70% 30%, #0284C7 0%, transparent 60%), radial-gradient(circle at 20% 80%, #06B6D4 0%, transparent 50%)`,
          }}
        />

        {/* Ambient Top Nav in Hero */}
        <div className="relative z-10 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <span className="font-extrabold text-base tracking-wider text-hc-ink font-mono">
              Hydro<span className="text-hc-active">Shield</span>
            </span>
          </div>

          <div className="hidden md:flex items-center space-x-6 text-xs font-semibold text-hc-textSecondary">
            <a href="#features" className="hover:text-hc-ink transition">Features</a>
            <a href="#models" className="hover:text-hc-ink transition">Dual Solvers</a>
            <a href="#benchmarks" className="hover:text-hc-ink transition">Indian Basins</a>
            <a href="#about" className="hover:text-hc-ink transition">About</a>
          </div>

          <button
            onClick={() => onNavigate && onNavigate('dashboard')}
            className="px-4 py-2 rounded-xl bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-500 hover:to-cyan-500 text-white font-bold text-xs transition shadow-glow-blue"
          >
            Get Started
          </button>
        </div>

        {/* Main Headline Block */}
        <div className="relative z-10 max-w-2xl my-8 space-y-4">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-950/80 border border-blue-800 text-cyan-300 text-xs font-mono font-bold">
            <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
            <span>Next-Gen Dam Breach &amp; Inundation Platform</span>
          </div>

          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight text-white leading-tight font-sans">
            Predict. Prepare. <br />
            <span className="bg-gradient-to-r from-cyan-400 via-sky-400 to-blue-500 bg-clip-text text-transparent">
              Protect.
            </span>
          </h1>

          <p className="text-sm sm:text-base text-hc-textSecondary leading-relaxed">
            Advanced Hydrodynamic Modelling for Dam Break &amp; Flood Inundation Analysis using <strong>Smooth Particle Hydrodynamics (SPH)</strong> and <strong>Delft3D Flexible Mesh</strong>.
          </p>

          <div className="flex flex-wrap items-center gap-3 pt-2">
            <button
              onClick={() => onNavigate && onNavigate('dashboard')}
              className="px-6 py-3 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs flex items-center space-x-2 transition shadow-glow-blue"
            >
              <span>Explore Live Map</span>
              <ArrowRight className="w-4 h-4" />
            </button>

            <button
              onClick={onOpenTutorial}
              className="px-5 py-3 rounded-xl bg-hc-surface hover:bg-hc-elevated border border-hc-border text-hc-ink font-semibold text-xs transition flex items-center space-x-2"
            >
              <Play className="w-3.5 h-3.5 fill-hc-ink" />
              <span>Watch Interactive Demo</span>
            </button>
          </div>
        </div>

        {/* Live Stat Strip matching Panel 2 of Image 3 */}
        <div className="relative z-10 grid grid-cols-2 sm:grid-cols-4 gap-4 pt-6 border-t border-hc-border/80">
          <div className="p-3 bg-hc-surface/80 rounded-2xl border border-hc-border text-center">
            <span className="text-2xl font-extrabold font-mono text-cyan-400 block">100+</span>
            <span className="text-xs text-hc-textSecondary font-medium">Simulations Run</span>
          </div>
          <div className="p-3 bg-hc-surface/80 rounded-2xl border border-hc-border text-center">
            <span className="text-2xl font-extrabold font-mono text-emerald-400 block">50+</span>
            <span className="text-xs text-hc-textSecondary font-medium">River Basins Covered</span>
          </div>
          <div className="p-3 bg-hc-surface/80 rounded-2xl border border-hc-border text-center">
            <span className="text-2xl font-extrabold font-mono text-amber-400 block">15+</span>
            <span className="text-xs text-hc-textSecondary font-medium">Geospatial Datasets</span>
          </div>
          <div className="p-3 bg-hc-surface/80 rounded-2xl border border-hc-border text-center">
            <span className="text-2xl font-extrabold font-mono text-blue-400 block">10K+</span>
            <span className="text-xs text-hc-textSecondary font-medium">Lives Protected</span>
          </div>
        </div>
      </div>

      {/* 2. Indian River Case Studies Grid */}
      <div className="max-w-7xl mx-auto px-4 sm:px-8 space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-base font-bold text-hc-ink">
              Verified Indian Dam Break &amp; Flood Inundation Benchmarks
            </h3>
            <p className="text-xs text-hc-textSecondary mt-0.5">
              Select any national river basin or emergency scenario to inspect hydrodynamic flood wave routing.
            </p>
          </div>
          <span className="text-xs text-hc-textSecondary font-mono">
            {presets.length} Basins Configured
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {presets.map((preset) => {
            const isSelected = preset.id === selectedPreset?.id;
            const isBenchmark = preset.is_hypothetical === false;

            return (
              <div
                key={preset.id}
                onClick={() => {
                  if (onSelectPreset) onSelectPreset(preset.id);
                }}
                className={`p-5 rounded-2xl border transition cursor-pointer flex flex-col justify-between space-y-4 ${
                  isSelected
                    ? 'bg-hc-surface border-cyan-400 shadow-glow-cyan ring-1 ring-cyan-400/30'
                    : 'bg-hc-surface/70 border-hc-border hover:border-hc-borderLight hover:bg-hc-surface'
                }`}
              >
                <div>
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <h4 className="text-sm font-bold text-hc-ink">{preset.name}</h4>
                      <p className="text-xs text-hc-textSecondary font-mono mt-0.5">
                        {preset.river} &bull; {preset.state}
                      </p>
                    </div>

                    <span
                      className={`text-[10px] px-2.5 py-0.5 rounded-full font-mono font-bold shrink-0 ${
                        isBenchmark
                          ? 'bg-red-950 text-red-300 border border-red-800'
                          : 'bg-blue-950 text-blue-300 border border-blue-800'
                      }`}
                    >
                      {isBenchmark ? 'DISASTER BENCHMARK' : 'SCENARIO FORECAST'}
                    </span>
                  </div>

                  <p className="text-xs text-hc-textSecondary mt-2.5 leading-relaxed">
                    {preset.description}
                  </p>
                </div>

                <div className="grid grid-cols-3 gap-2 py-2 px-3 bg-hc-canvas rounded-xl border border-hc-border text-center font-mono">
                  <div>
                    <span className="text-[10px] text-hc-textMuted block">Dam Height</span>
                    <span className="text-xs font-bold text-hc-ink">{preset.dam_height_m} m</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-hc-textMuted block">Storage Volume</span>
                    <span className="text-xs font-bold text-cyan-400">
                      {preset.reservoir_volume_m3 ? (preset.reservoir_volume_m3 / 1e6).toFixed(1) : 'N/A'} Mm³
                    </span>
                  </div>
                  <div>
                    <span className="text-[10px] text-hc-textMuted block">Reach Length</span>
                    <span className="text-xs font-bold text-hc-ink">{preset.reach_length_km} km</span>
                  </div>
                </div>

                <div className="flex items-center justify-between pt-1">
                  <span className="text-[11px] text-hc-textSecondary">
                    Structure: <strong className="text-hc-ink capitalize">{preset.dam_type?.replace('_', ' ')}</strong>
                  </span>

                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      if (onSelectPreset) onSelectPreset(preset.id);
                      if (onRunSimulation) onRunSimulation({ scenario_id: preset.id });
                    }}
                    disabled={isSimulating}
                    className="px-4 py-2 rounded-xl bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-500 hover:to-cyan-500 text-white text-xs font-bold flex items-center space-x-1.5 transition shadow-sm disabled:opacity-50"
                  >
                    <Play className="w-3.5 h-3.5 fill-white" />
                    <span>{isSelected && isSimulating ? 'Running...' : 'Run Scenario'}</span>
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
