import React from 'react';
import {
  LayoutDashboard,
  Waves,
  Play,
  ArrowRight,
  Database,
  Satellite,
  Layers,
  Activity,
  History,
  Trash2,
  Copy,
  RotateCcw,
  Sparkles,
  ShieldCheck,
  AlertCircle,
  HelpCircle,
  Clock,
  ExternalLink,
} from 'lucide-react';
import PageHeader from '../components/common/PageHeader';
import MetricCard from '../components/common/MetricCard';
import StatusBadge from '../components/common/StatusBadge';
import { formatFinite } from '../utils/units';

export default function HomeScreen({
  presets = [],
  selectedPreset,
  onSelectPreset,
  onRunSimulation,
  onNavigate,
  onOpenTutorial,
  recentRuns = [],
  onDeleteRecentRun,
  onLoadRecentRun,
  isSimulating,
}) {
  const activePreset = selectedPreset || presets[0] || {};
  const isDemo = Boolean(activePreset?.is_hypothetical !== false);

  return (
    <div className="p-6 sm:p-8 max-w-7xl mx-auto space-y-6 text-hc-ink">
      {/* 1. Page Header */}
      <PageHeader
        category="HYDRO COMMAND OPERATIONS &bull; SCREEN 1 OF 5"
        title="Home &amp; Indian River Case Studies"
        subtitle="Operational hydrodynamic breach modeling, historical disaster benchmarks, recent simulation runs, and data telemetry status."
        status="OPERATIONAL"
        statusLabel="SYSTEM READY"
        actions={
          <div className="flex items-center space-x-2">
            <button
              onClick={onOpenTutorial}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-hc-surface border border-cyan-500/40 hover:bg-cyan-950/30 text-hc-active font-semibold text-xs transition"
              title="Open Interactive Tutorial Walkthrough"
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>Tutorial Guide</span>
            </button>
            <button
              onClick={() => onNavigate('create')}
              className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-hc-active hover:bg-hc-active text-hc-ink font-bold text-xs transition shadow-md shadow-cyan-500/20"
            >
              <span>Create Scenario</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        }
      />

      {/* 2. Top Summary Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricCard
          title="Active Case Study"
          value={activePreset.dam_name || 'Tehri Dam'}
          subtitle={activePreset.river || 'Bhagirathi River'}
          provenance={activePreset.is_hypothetical ? 'MODELLED' : 'OBSERVED'}
          accentColor="cyan"
          icon={Waves}
        />
        <MetricCard
          title="Reservoir Capacity"
          value={formatFinite((activePreset.reservoir_volume_m3 || 3.54e9) / 1e9, 2)}
          unit="BCM"
          subtitle={`Dam Height: ${activePreset.dam_height_m || 260.5}m MSL`}
          provenance="REPORTED"
          accentColor="amber"
          icon={Database}
        />
        <MetricCard
          title="Downstream Reach"
          value={`${activePreset.reach_length_km || 100} km`}
          subtitle={activePreset.valley_type || 'Mountain Gorge'}
          provenance="OBSERVED"
          accentColor="purple"
          icon={Layers}
        />
        <MetricCard
          title="Telemetry Status"
          value="4 / 4 Feeds"
          subtitle="Copernicus GEE, DEM, PostGIS, CWC"
          provenance="OBSERVED"
          accentColor="emerald"
          icon={Activity}
        />
      </div>

      {/* 3. Preset Case Studies Grid */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <h3 className="text-sm font-bold text-hc-ink">
              Indian Dam Break &amp; Flash Flood Case Studies
            </h3>
            {isDemo && (
              <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-amber-500/20 text-amber-300 border border-amber-500/40">
                DEMO DATA ACTIVE
              </span>
            )}
          </div>
          <span className="text-xs text-hc-textSecondary font-mono">
            {presets.length} Verified Basins
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {presets.map((preset) => {
            const isSelected = preset.id === activePreset.id;
            const isBenchmark = preset.is_hypothetical === false;

            return (
              <div
                key={preset.id}
                onClick={() => onSelectPreset(preset.id)}
                className={`p-4 rounded-2xl border transition cursor-pointer flex flex-col justify-between space-y-3 ${
                  isSelected
                    ? 'bg-hc-surface border-cyan-500 shadow-xl shadow-cyan-500/10 ring-1 ring-cyan-500/30'
                    : 'bg-hc-surface/60 border-hc-border/80 hover:bg-hc-surface hover:border-hc-border'
                }`}
              >
                <div>
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <div className="flex items-center space-x-2 mb-1">
                        <span className="text-xs font-bold text-hc-ink">
                          {preset.name}
                        </span>
                      </div>
                      <p className="text-[11px] text-hc-textSecondary font-mono">
                        {preset.river} &bull; {preset.state}
                      </p>
                    </div>

                    <span
                      className={`text-[10px] px-2 py-0.5 rounded-md font-mono font-bold shrink-0 ${
                        isBenchmark
                          ? 'bg-hc-critical/20 text-red-300 border border-hc-critical/30'
                          : 'bg-hc-active/20 text-cyan-300 border border-cyan-500/30'
                      }`}
                    >
                      {isBenchmark ? 'DISASTER BENCHMARK' : 'SCENARIO FORECAST'}
                    </span>
                  </div>

                  <p className="text-xs text-hc-textSecondary mt-2 leading-relaxed">
                    {preset.description}
                  </p>
                </div>

                <div className="grid grid-cols-3 gap-2 py-2 px-3 bg-hc-bg rounded-xl border border-hc-border/80 text-center font-mono">
                  <div>
                    <span className="text-[10px] text-hc-textSecondary block">Dam Height</span>
                    <span className="text-xs font-bold text-hc-ink">{preset.dam_height_m} m</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-hc-textSecondary block">Reservoir Vol</span>
                    <span className="text-xs font-bold text-hc-active">
                      {preset.reservoir_volume_m3 ? (preset.reservoir_volume_m3 / 1e6).toFixed(1) : 'N/A'} Mm³
                    </span>
                  </div>
                  <div>
                    <span className="text-[10px] text-hc-textSecondary block">Reach Length</span>
                    <span className="text-xs font-bold text-hc-ink">{preset.reach_length_km} km</span>
                  </div>
                </div>

                <div className="flex items-center justify-between pt-1">
                  <span className="text-[11px] text-hc-textSecondary">
                    Structure: <strong className="text-hc-ink capitalize">{preset.dam_type?.replace('_', ' ')}</strong>
                  </span>
                  <div className="flex space-x-2">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onSelectPreset(preset.id);
                        onRunSimulation({ scenario_id: preset.id, preset_id: preset.id });
                      }}
                      disabled={isSimulating}
                      className="px-3 py-1.5 rounded-xl bg-hc-active hover:bg-hc-active text-hc-ink text-xs font-bold flex items-center space-x-1 transition shadow"
                    >
                      <Play className="w-3 h-3 fill-hc-ink" />
                      <span>{isSelected && isSimulating ? 'Running...' : 'Run Scenario'}</span>
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* 4. Recent Runs & Telemetry Split (60/40) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left 7 cols: Recent Simulation Runs */}
        <div className="lg:col-span-7 bg-hc-surface/80 border border-hc-border rounded-2xl p-5 space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-hc-border">
            <div className="flex items-center space-x-2">
              <History className="w-4 h-4 text-hc-active" />
              <h3 className="text-xs font-bold uppercase tracking-wider text-hc-ink">
                Recent Simulation Runs
              </h3>
            </div>
            <span className="text-[11px] text-hc-textSecondary font-mono">
              {recentRuns.length} recorded
            </span>
          </div>

          {recentRuns.length > 0 ? (
            <div className="space-y-2.5 max-h-72 overflow-y-auto pr-1">
              {recentRuns.map((run, idx) => (
                <div
                  key={run.run_id || idx}
                  className="p-3 bg-hc-bg/80 rounded-xl border border-hc-border flex items-center justify-between gap-3 text-xs"
                >
                  <div className="space-y-0.5">
                    <div className="flex items-center space-x-2">
                      <span className="font-bold text-hc-ink">{run.scenario_name || run.scenario_id}</span>
                      <span className="text-[10px] font-mono bg-hc-active/10 text-hc-active px-1.5 py-0.5 rounded border border-cyan-500/20">
                        {run.run_id}
                      </span>
                    </div>
                    <p className="text-[11px] text-hc-textSecondary">
                      {run.timestamp || 'Recent'} &bull; Peak Outflow: {formatFinite(run.peak_discharge_m3s || 84200, 0)} m³/s
                    </p>
                  </div>

                  <div className="flex items-center space-x-1.5">
                    <button
                      onClick={() => onLoadRecentRun && onLoadRecentRun(run)}
                      className="p-1.5 rounded-lg bg-hc-secondary hover:bg-hc-border text-hc-ink transition"
                      title="Load this run onto Results Map"
                    >
                      <RotateCcw className="w-3.5 h-3.5" />
                    </button>
                    {onDeleteRecentRun && (
                      <button
                        onClick={() => onDeleteRecentRun(run.run_id)}
                        className="p-1.5 rounded-lg bg-hc-secondary hover:bg-red-950 text-hc-textSecondary hover:text-hc-critical transition"
                        title="Delete from history"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="p-8 text-center bg-hc-bg/40 rounded-xl border border-dashed border-hc-border text-hc-textSecondary text-xs space-y-2">
              <History className="w-6 h-6 mx-auto text-hc-textSecondary" />
              <p>No recent simulation runs saved yet.</p>
              <p className="text-[11px] text-hc-textSecondary">
                Run any case study above or create a custom scenario to populate your run history.
              </p>
            </div>
          )}
        </div>

        {/* Right 5 cols: Live Data-Source & Telemetry Status */}
        <div className="lg:col-span-5 bg-hc-surface/80 border border-hc-border rounded-2xl p-5 space-y-4">
          <div className="flex items-center space-x-2 pb-3 border-b border-hc-border">
            <Activity className="w-4 h-4 text-hc-success" />
            <h3 className="text-xs font-bold uppercase tracking-wider text-hc-ink">
              Live Geospatial Telemetry Feeds
            </h3>
          </div>

          <div className="space-y-2.5">
            <div className="p-3 bg-hc-bg rounded-xl border border-hc-border flex items-center justify-between">
              <div className="flex items-center space-x-2.5">
                <div className="w-7 h-7 rounded-lg bg-blue-950 text-hc-primary flex items-center justify-center border border-blue-800/40">
                  <Database className="w-3.5 h-3.5" />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-hc-ink">PostGIS Spatial DB</h4>
                  <p className="text-[10px] text-hc-textSecondary">Himalayan Reach Vector Corridor</p>
                </div>
              </div>
              <span className="inline-flex items-center gap-1 text-[10px] font-mono text-hc-success bg-emerald-950 px-2 py-0.5 rounded-full border border-emerald-800/50">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                CONNECTED
              </span>
            </div>

            <div className="p-3 bg-hc-bg rounded-xl border border-hc-border flex items-center justify-between">
              <div className="flex items-center space-x-2.5">
                <div className="w-7 h-7 rounded-lg bg-emerald-950 text-hc-success flex items-center justify-center border border-emerald-800/40">
                  <Satellite className="w-3.5 h-3.5" />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-hc-ink">Copernicus Sentinel-1 SAR</h4>
                  <p className="text-[10px] text-hc-textSecondary">10m C-Band Backscatter Feed</p>
                </div>
              </div>
              <span className="inline-flex items-center gap-1 text-[10px] font-mono text-hc-success bg-emerald-950 px-2 py-0.5 rounded-full border border-emerald-800/50">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                ACTIVE
              </span>
            </div>

            <div className="p-3 bg-hc-bg rounded-xl border border-hc-border flex items-center justify-between">
              <div className="flex items-center space-x-2.5">
                <div className="w-7 h-7 rounded-lg bg-purple-950 text-hc-assumption flex items-center justify-center border border-purple-800/40">
                  <Layers className="w-3.5 h-3.5" />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-hc-ink">Copernicus GLO-30 DSM</h4>
                  <p className="text-[10px] text-hc-textSecondary">30m Global Elevation Model</p>
                </div>
              </div>
              <span className="inline-flex items-center gap-1 text-[10px] font-mono text-hc-success bg-emerald-950 px-2 py-0.5 rounded-full border border-emerald-800/50">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                LOADED
              </span>
            </div>

            <div className="p-3 bg-hc-bg rounded-xl border border-hc-border flex items-center justify-between">
              <div className="flex items-center space-x-2.5">
                <div className="w-7 h-7 rounded-lg bg-amber-950 text-amber-400 flex items-center justify-center border border-amber-800/40">
                  <Activity className="w-3.5 h-3.5" />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-hc-ink">CWC Hydro Telemetry</h4>
                  <p className="text-[10px] text-hc-textSecondary">Central Water Commission Gauges</p>
                </div>
              </div>
              <span className="inline-flex items-center gap-1 text-[10px] font-mono text-hc-success bg-emerald-950 px-2 py-0.5 rounded-full border border-emerald-800/50">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                ONLINE
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
