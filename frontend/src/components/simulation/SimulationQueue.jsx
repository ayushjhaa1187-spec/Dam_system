import React, { useState } from 'react';
import { Activity, CheckCircle2, Clock, Play, RotateCcw, AlertTriangle, Terminal, ChevronDown, ChevronUp } from 'lucide-react';

export const INITIAL_QUEUE = [
  {
    id: 'sim_chenab_coupled_01',
    name: 'Chenab River (Worst Case Full Breach)',
    model: 'Delft3D + SPH Coupled',
    status: 'COMPLETED',
    progress: 100,
    elapsed: '4m 12s',
    timestamp: '10m ago',
    peakFlow: '45,600 m³/s',
    csi: 0.88,
  },
  {
    id: 'sim_tehri_sph_02',
    name: 'Tehri Dam High-Head Overtopping',
    model: 'Smooth Particle Hydrodynamics (SPH)',
    status: 'COMPLETED',
    progress: 100,
    elapsed: '2m 45s',
    timestamp: '25m ago',
    peakFlow: '84,200 m³/s',
    csi: 0.86,
  },
  {
    id: 'sim_rishiganga_glof_03',
    name: 'Rishi Ganga GLOF / Landslide Dam',
    model: 'Delft3D Flexible Mesh 2D',
    status: 'RUNNING',
    progress: 68,
    elapsed: '1m 20s',
    timestamp: 'Active Now',
    peakFlow: '12,400 m³/s',
    csi: null,
  },
];

export default function SimulationQueue({
  onRunSimulation,
  isSimulating,
  onSelectRun,
}) {
  const [queue, setQueue] = useState(INITIAL_QUEUE);
  const [expandedRunId, setExpandedRunId] = useState(null);

  const toggleExpand = (id) => {
    setExpandedRunId((prev) => (prev === id ? null : id));
  };

  return (
    <div className="bg-hc-surface border border-hc-border rounded-2xl p-5 space-y-4 shadow-card-dark">
      <div className="flex items-center justify-between pb-3 border-b border-hc-border">
        <div className="flex items-center space-x-2">
          <Activity className="w-4 h-4 text-hc-active" />
          <h3 className="text-xs font-bold uppercase tracking-wider text-hc-ink">
            Asynchronous Simulation Queue
          </h3>
        </div>
        <span className="text-[10px] font-mono text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200 font-semibold">
          CELERY + REDIS ONLINE
        </span>
      </div>

      {/* Queue Items */}
      <div className="space-y-3">
        {queue.map((item) => {
          const isRunning = item.status === 'RUNNING' || (isSimulating && item.id.includes('03'));
          const isCompleted = item.status === 'COMPLETED' && !isRunning;
          const isExpanded = expandedRunId === item.id;

          return (
            <div
              key={item.id}
              className={`p-3.5 rounded-xl border transition cursor-pointer ${
                isRunning
                  ? 'bg-sky-50/60 border-sky-400 ring-1 ring-sky-400/30'
                  : 'bg-hc-card border-hc-border hover:border-hc-borderLight'
              }`}
              onClick={() => toggleExpand(item.id)}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2.5">
                  {isRunning ? (
                    <div className="w-6 h-6 rounded-lg bg-cyan-100 text-cyan-700 flex items-center justify-center border border-cyan-300">
                      <Activity className="w-3.5 h-3.5 animate-spin" />
                    </div>
                  ) : isCompleted ? (
                    <div className="w-6 h-6 rounded-lg bg-emerald-100 text-emerald-700 flex items-center justify-center border border-emerald-300">
                      <CheckCircle2 className="w-3.5 h-3.5" />
                    </div>
                  ) : (
                    <div className="w-6 h-6 rounded-lg bg-red-100 text-red-700 flex items-center justify-center border border-red-300">
                      <AlertTriangle className="w-3.5 h-3.5" />
                    </div>
                  )}

                  <div>
                    <h4 className="text-xs font-bold text-hc-ink">{item.name}</h4>
                    <span className="text-[10px] font-mono text-hc-textSecondary block">
                      {item.model} &bull; {item.timestamp}
                    </span>
                  </div>
                </div>

                <div className="flex items-center space-x-3 text-right">
                  <div>
                    <span className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded ${
                      isRunning ? 'bg-cyan-100 text-cyan-800 border border-cyan-300' : 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                    }`}>
                      {isRunning ? `${item.progress}% RUNNING` : 'COMPLETED'}
                    </span>
                    <span className="text-[10px] font-mono text-hc-textSecondary block mt-0.5">
                      Elapsed: {item.elapsed}
                    </span>
                  </div>

                  {isExpanded ? (
                    <ChevronUp className="w-4 h-4 text-hc-textSecondary" />
                  ) : (
                    <ChevronDown className="w-4 h-4 text-hc-textSecondary" />
                  )}
                </div>
              </div>

              {/* Progress bar if running */}
              {isRunning && (
                <div className="w-full h-1.5 bg-slate-200 rounded-full overflow-hidden mt-3 border border-hc-border">
                  <div
                    className="h-full bg-gradient-to-r from-cyan-500 to-emerald-500 animate-pulse"
                    style={{ width: `${item.progress}%` }}
                  />
                </div>
              )}

              {/* Expanded Details Drawer */}
              {isExpanded && (
                <div className="mt-3 pt-3 border-t border-hc-border text-xs space-y-2 font-mono text-hc-textSecondary">
                  <div className="grid grid-cols-3 gap-2 bg-hc-canvas p-2.5 rounded-lg border border-hc-border">
                    <div>
                      <span className="text-[9px] text-hc-textMuted block">Run ID:</span>
                      <span className="text-[10px] text-hc-ink truncate block font-semibold">{item.id}</span>
                    </div>
                    <div>
                      <span className="text-[9px] text-hc-textMuted block">Peak Qp:</span>
                      <span className="text-[10px] text-red-600 font-bold">{item.peakFlow}</span>
                    </div>
                    <div>
                      <span className="text-[9px] text-hc-textMuted block">Validation CSI:</span>
                      <span className="text-[10px] text-emerald-600 font-bold">{item.csi ? `CSI = ${item.csi}` : 'Computing...'}</span>
                    </div>
                  </div>
                  <div className="text-[10px] text-hc-textMuted">
                    Logs: Initialized DualSPHysics 3D solver -&gt; Coupled to Delft3D-FM 2D flexible grid -&gt; GeoTIFF generated.
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
