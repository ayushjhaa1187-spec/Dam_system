import React from 'react';
import {
  Play,
  Download,
  ChevronDown,
  Layers,
  Sparkles,
  Keyboard,
  Waves,
  ShieldCheck,
  CheckCircle2,
} from 'lucide-react';

export default function Topbar({
  selectedPreset,
  presets = [],
  onSelectPreset,
  simulationResult,
  isSimulating,
  onRunSimulation,
  onOpenTutorial,
  onOpenShortcuts,
  onOpenExport,
}) {
  const isDemo = Boolean(selectedPreset?.is_hypothetical !== false);
  const runId = simulationResult?.run_id || 'sim_tehri_coupled';

  return (
    <header className="h-16 bg-slate-950/90 backdrop-blur-md border-b border-slate-800/80 px-4 sm:px-6 flex items-center justify-between z-20 sticky top-0">
      {/* Left: Active Scenario Preset Selector */}
      <div className="flex items-center space-x-3">
        <div className="relative">
          <select
            value={selectedPreset?.id || ''}
            onChange={(e) => onSelectPreset && onSelectPreset(e.target.value)}
            className="bg-slate-900 border border-slate-800 text-xs font-bold text-slate-100 rounded-xl pl-3.5 pr-8 py-2 appearance-none focus:outline-none focus:border-cyan-500 cursor-pointer shadow-sm"
          >
            {presets.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name}
              </option>
            ))}
          </select>
          <ChevronDown className="w-3.5 h-3.5 text-slate-400 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
        </div>

        {/* Demo Data Badge */}
        {isDemo ? (
          <span className="hidden sm:inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-amber-500/20 text-amber-300 border border-amber-500/40">
            DEMO DATA ACTIVE
          </span>
        ) : (
          <span className="hidden sm:inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-red-500/20 text-red-300 border border-red-500/40">
            HISTORICAL BENCHMARK
          </span>
        )}
      </div>

      {/* Right: Quick Action Controls */}
      <div className="flex items-center space-x-2.5">
        {/* Run ID Pill */}
        <span className="hidden md:inline-flex items-center space-x-1.5 px-2.5 py-1 rounded-lg bg-slate-900 border border-slate-800 text-[11px] font-mono text-slate-400">
          <span className="w-1.5 h-1.5 rounded-full bg-cyan-400" />
          <span>{runId.slice(0, 14)}</span>
        </span>

        {/* Keyboard Shortcuts Trigger */}
        <button
          onClick={onOpenShortcuts}
          className="p-2 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-400 hover:text-slate-200 transition"
          title="Open Accessible Keyboard Shortcuts (Press ?)"
          aria-label="Keyboard shortcuts"
        >
          <Keyboard className="w-4 h-4 text-amber-400" />
        </button>

        {/* Tutorial Trigger */}
        <button
          onClick={onOpenTutorial}
          className="hidden sm:flex items-center space-x-1.5 px-3 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-800 text-xs font-semibold text-cyan-400 transition"
          title="Open Guided Tutorial"
        >
          <Sparkles className="w-3.5 h-3.5" />
          <span>Tutorial</span>
        </button>

        {/* Export Button */}
        <button
          onClick={onOpenExport}
          className="flex items-center space-x-1.5 px-3 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-800 text-xs font-semibold text-slate-200 transition"
        >
          <Download className="w-3.5 h-3.5" />
          <span className="hidden sm:inline">Export Center</span>
        </button>

        {/* Run Simulation Button */}
        <button
          onClick={onRunSimulation}
          disabled={isSimulating}
          className="flex items-center space-x-1.5 px-4 py-2 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold text-xs transition shadow-md shadow-cyan-500/20 disabled:opacity-50"
        >
          <Play className={`w-3.5 h-3.5 fill-slate-950 ${isSimulating ? 'animate-pulse' : ''}`} />
          <span>{isSimulating ? 'Computing...' : 'Run Simulation'}</span>
        </button>
      </div>
    </header>
  );
}
