import React from 'react';
import {
  Waves,
  Play,
  Bell,
  ChevronDown,
  Layers,
  Sparkles,
  Keyboard,
  User,
  Activity,
  CheckCircle2,
} from 'lucide-react';

export const TOP_TABS = [
  { id: 'dashboard', label: 'Dashboard' },
  { id: 'predictor', label: 'AI Predictor' },
  { id: 'modeling', label: 'Modeling' },
  { id: 'data', label: 'Data' },
  { id: 'scenarios', label: 'Scenarios' },
  { id: 'analytics', label: 'Analytics' },
  { id: 'reports', label: 'Reports' },
];

export default function Topbar({
  activeTopTab = 'dashboard',
  onSelectTopTab,
  selectedPreset,
  presets = [],
  onSelectPreset,
  simulationResult,
  isSimulating,
  onRunSimulation,
  onOpenTutorial,
  onOpenShortcuts,
  onOpenAlerts,
  alertCount = 3,
}) {
  const modelType = simulationResult?.scenario_params?.solver_type || selectedPreset?.solver_type || 'DELFT3D';

  return (
    <header className="h-16 bg-hc-bg/95 backdrop-blur-md border-b border-hc-border px-4 sm:px-6 flex items-center justify-between z-20 sticky top-0 gap-4">
      {/* 1. Left: Brand & Top View Navigation Tabs */}
      <div className="flex items-center space-x-6">
        {/* Brand */}
        <div className="flex items-center space-x-3 cursor-pointer" onClick={() => onSelectTopTab && onSelectTopTab('dashboard')}>
          <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-blue-600 to-cyan-500 flex items-center justify-center text-white shadow-glow-cyan">
            <Waves className="w-4 h-4" />
          </div>
          <div className="hidden lg:flex flex-col">
            <span className="font-extrabold text-sm tracking-wider text-hc-ink flex items-center gap-1 font-mono">
              Hydro<span className="text-hc-active">Shield</span>
            </span>
            <span className="text-[9px] text-hc-textSecondary tracking-wider font-medium uppercase">
              Dam Break Inundation Modelling
            </span>
          </div>
        </div>

        {/* 6 Top Navigation Tabs */}
        <nav className="hidden md:flex items-center space-x-1 bg-hc-surface/80 p-1 rounded-xl border border-hc-border/80">
          {TOP_TABS.map((tab) => {
            const isActive = activeTopTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => onSelectTopTab && onSelectTopTab(tab.id)}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                  isActive
                    ? 'bg-hc-primary text-white shadow-sm shadow-blue-500/30'
                    : 'text-hc-textSecondary hover:text-hc-ink hover:bg-hc-elevated/60'
                }`}
              >
                {tab.label}
              </button>
            );
          })}
        </nav>
      </div>

      {/* 2. Middle: Scenario Preset & Case/Model Badges */}
      <div className="hidden xl:flex items-center space-x-3">
        {/* Preset Selector */}
        <div className="relative">
          <select
            value={selectedPreset?.id || ''}
            onChange={(e) => onSelectPreset && onSelectPreset(e.target.value)}
            className="bg-hc-surface border border-hc-border text-xs font-bold text-hc-ink rounded-xl pl-3 pr-7 py-1.5 appearance-none focus:outline-none focus:border-hc-active cursor-pointer shadow-sm"
          >
            {presets.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name || p.dam_name}
              </option>
            ))}
          </select>
          <ChevronDown className="w-3.5 h-3.5 text-hc-textSecondary absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none" />
        </div>

        {/* Case Badge */}
        <span className="px-2.5 py-1 rounded-lg bg-hc-surface border border-hc-border text-[11px] font-mono text-hc-textSecondary">
          Case: <strong className="text-hc-ink">Dam Break</strong>
        </span>

        {/* Model Badge */}
        <span className="px-2.5 py-1 rounded-lg bg-blue-950/60 border border-blue-800/60 text-[11px] font-mono text-blue-300">
          Model: <strong className="text-cyan-300 uppercase">{modelType}</strong>
        </span>
      </div>

      {/* 3. Right: Simulation CTA, Alert Bell, User Avatar Card */}
      <div className="flex items-center space-x-3">
        {/* Run Simulation Primary Action */}
        <button
          onClick={onRunSimulation}
          disabled={isSimulating}
          className="flex items-center space-x-1.5 px-4 py-2 rounded-xl bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-500 hover:to-cyan-500 text-white font-bold text-xs transition shadow-glow-blue disabled:opacity-50"
        >
          <Play className={`w-3.5 h-3.5 fill-white ${isSimulating ? 'animate-spin' : ''}`} />
          <span>{isSimulating ? 'Computing...' : 'Run Simulation'}</span>
        </button>

        {/* Notification Bell */}
        <button
          onClick={onOpenAlerts}
          className="relative p-2 rounded-xl bg-hc-surface hover:bg-hc-elevated border border-hc-border text-hc-textSecondary hover:text-hc-ink transition"
          title="Active System & Inundation Alerts"
        >
          <Bell className="w-4 h-4 text-hc-textSecondary" />
          {alertCount > 0 && (
            <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-hc-critical text-white text-[9px] font-bold flex items-center justify-center font-mono ring-2 ring-hc-bg">
              {alertCount}
            </span>
          )}
        </button>

        {/* User Profile Card (Ayush Jha - Project Analyst) */}
        <div className="flex items-center space-x-2.5 pl-2 border-l border-hc-border">
          <div className="relative">
            <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-cyan-600 to-indigo-600 flex items-center justify-center text-white font-bold text-xs border border-cyan-400/40">
              AJ
            </div>
            <span className="absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full bg-emerald-400 ring-2 ring-hc-bg" />
          </div>
          <div className="hidden sm:flex flex-col text-left">
            <span className="text-xs font-bold text-hc-ink leading-tight">Ayush Jha</span>
            <span className="text-[10px] text-hc-textSecondary font-medium flex items-center gap-1">
              <span>Project Analyst</span>
              <span className="text-emerald-400 font-mono text-[9px]">&bull; Online</span>
            </span>
          </div>
        </div>
      </div>
    </header>
  );
}

