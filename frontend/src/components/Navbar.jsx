import React from 'react';
import { Waves, Activity, SplitSquareVertical, AlertTriangle, Satellite, Mountain, Download, Play, CloudRain, Dice5 } from 'lucide-react';

export default function Navbar({
  activeTab,
  setActiveTab,
  selectedPreset,
  presets,
  onSelectPreset,
  onOpenDem,
  onOpenExport,
  isSimulating,
  onQuickRun
}) {
  const [healthStatus, setHealthStatus] = React.useState('checking');

  React.useEffect(() => {
    fetch('http://localhost:8000/health')
      .then(res => res.ok ? setHealthStatus('online') : setHealthStatus('error'))
      .catch(() => setHealthStatus('offline'));
  }, []);

  return (
    <header className="bg-hc-surface/90 backdrop-blur-md border-b border-hc-border sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo & Brand */}
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-cyan-600 via-sky-500 to-blue-700 flex items-center justify-center shadow-lg shadow-cyan-500/20">
              <Waves className="w-6 h-6 text-white" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <span className="font-extrabold text-lg tracking-tight bg-gradient-to-r from-cyan-400 via-sky-300 to-blue-400 bg-clip-text text-transparent">
                  HYDRO COMMAND
                </span>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-cyan-950 text-hc-active border border-cyan-800/50">
                  SIH 2026 PS 26161
                </span>
                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                  healthStatus === 'online' ? 'bg-emerald-950 text-hc-success border-emerald-800/50' : 
                  healthStatus === 'checking' ? 'bg-amber-950 text-amber-400 border-amber-800/50' : 
                  'bg-red-950 text-hc-critical border-red-800/50'
                }`}>
                  API: {healthStatus.toUpperCase()}
                </span>
              </div>
              <p className="text-xs text-hc-textSecondary font-medium">Tehri Dam Decision-Support Platform</p>
            </div>
          </div>

          {/* Navigation Tabs */}
          <nav className="hidden lg:flex items-center space-x-1">
            <button
              onClick={() => setActiveTab('builder')}
              className={`px-2.5 py-1.5 rounded-lg text-xs font-medium transition-all flex items-center space-x-1.5 ${
                activeTab === 'builder'
                  ? 'bg-hc-active/10 text-hc-active border border-cyan-500/30'
                  : 'text-hc-textSecondary hover:text-hc-ink hover:bg-hc-secondary/60'
              }`}
            >
              <Mountain className="w-3.5 h-3.5" />
              <span>Scenario Builder</span>
            </button>

            <button
              onClick={() => setActiveTab('hydrology')}
              className={`px-2.5 py-1.5 rounded-lg text-xs font-medium transition-all flex items-center space-x-1.5 ${
                activeTab === 'hydrology'
                  ? 'bg-sky-500/10 text-sky-400 border border-sky-500/30'
                  : 'text-hc-textSecondary hover:text-hc-ink hover:bg-hc-secondary/60'
              }`}
            >
              <CloudRain className="w-3.5 h-3.5" />
              <span>SCS-CN Hydrology</span>
            </button>

            <button
              onClick={() => setActiveTab('viewer')}
              className={`px-2.5 py-1.5 rounded-lg text-xs font-medium transition-all flex items-center space-x-1.5 ${
                activeTab === 'viewer'
                  ? 'bg-hc-active/10 text-hc-active border border-cyan-500/30'
                  : 'text-hc-textSecondary hover:text-hc-ink hover:bg-hc-secondary/60'
              }`}
            >
              <Activity className="w-3.5 h-3.5" />
              <span>Hydrodynamics</span>
            </button>

            <button
              onClick={() => setActiveTab('uncertainty')}
              className={`px-2.5 py-1.5 rounded-lg text-xs font-medium transition-all flex items-center space-x-1.5 ${
                activeTab === 'uncertainty'
                  ? 'bg-hc-assumption/10 text-hc-assumption border border-purple-500/30'
                  : 'text-hc-textSecondary hover:text-hc-ink hover:bg-hc-secondary/60'
              }`}
            >
              <Dice5 className="w-3.5 h-3.5" />
              <span>Uncertainty</span>
            </button>

            <button
              onClick={() => setActiveTab('comparison')}
              className={`px-2.5 py-1.5 rounded-lg text-xs font-medium transition-all flex items-center space-x-1.5 ${
                activeTab === 'comparison'
                  ? 'bg-hc-active/10 text-hc-active border border-cyan-500/30'
                  : 'text-hc-textSecondary hover:text-hc-ink hover:bg-hc-secondary/60'
              }`}
            >
              <SplitSquareVertical className="w-3.5 h-3.5" />
              <span>SPH vs Delft3D</span>
            </button>

            <button
              onClick={() => setActiveTab('damage')}
              className={`px-2.5 py-1.5 rounded-lg text-xs font-medium transition-all flex items-center space-x-1.5 ${
                activeTab === 'damage'
                  ? 'bg-hc-critical/10 text-hc-critical border border-hc-critical/30'
                  : 'text-hc-textSecondary hover:text-hc-ink hover:bg-hc-secondary/60'
              }`}
            >
              <AlertTriangle className="w-3.5 h-3.5" />
              <span>HADR Evacuation</span>
            </button>

            <button
              onClick={() => setActiveTab('gee')}
              className={`px-2.5 py-1.5 rounded-lg text-xs font-medium transition-all flex items-center space-x-1.5 ${
                activeTab === 'gee'
                  ? 'bg-hc-success/10 text-hc-success border border-hc-success/30'
                  : 'text-hc-textSecondary hover:text-hc-ink hover:bg-hc-secondary/60'
              }`}
            >
              <Satellite className="w-3.5 h-3.5" />
              <span>Sentinel-1 SAR</span>
            </button>
          </nav>

          {/* Quick Actions & Preset Selector */}
          <div className="flex items-center space-x-2">
            <select
              value={selectedPreset?.id || ''}
              onChange={(e) => onSelectPreset(e.target.value)}
              className="bg-hc-secondary text-hc-ink text-xs rounded-lg px-2.5 py-1.5 border border-hc-border focus:outline-none focus:border-cyan-500"
            >
              {presets && presets.map((p) => {
                const label = p?.name || p?.id || 'Scenario';
                return (
                  <option key={p?.id || label} value={p?.id || ''}>
                    {label.length > 32 ? label.substring(0, 30) + '...' : label}
                  </option>
                );
              })}
            </select>

            <button
              onClick={onOpenDem}
              title="View River DEM & Cross Sections"
              className="p-1.5 rounded-lg bg-hc-secondary text-hc-textSecondary hover:text-hc-active hover:bg-hc-border border border-hc-border transition"
            >
              <Mountain className="w-4 h-4" />
            </button>

            <button
              onClick={onOpenExport}
              title="Export Shapefile / KML / Reports"
              className="p-1.5 rounded-lg bg-hc-secondary text-hc-textSecondary hover:text-hc-active hover:bg-hc-border border border-hc-border transition"
            >
              <Download className="w-4 h-4" />
            </button>

            <button
              onClick={onQuickRun}
              disabled={isSimulating}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center space-x-1.5 shadow-md transition ${
                isSimulating
                  ? 'bg-hc-border text-hc-textSecondary cursor-not-allowed'
                  : 'bg-hc-active hover:bg-hc-active text-hc-ink font-bold glow-cyan'
              }`}
            >
              <Play className={`w-3.5 h-3.5 ${isSimulating ? 'animate-spin' : 'fill-hc-ink'}`} />
              <span>{isSimulating ? 'Simulating...' : 'Run Scenario'}</span>
            </button>
          </div>
        </div>
      </div>
    </header>
  );
}
