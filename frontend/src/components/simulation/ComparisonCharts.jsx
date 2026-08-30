import React from 'react';
import { TrendingUp, Layers } from 'lucide-react';

export default function ComparisonCharts() {
  // Hydrodynamic time series data (0h to 24h)
  const timePoints = [0, 2, 4, 6, 8, 10, 12, 14, 16, 18, 20, 22, 24];
  
  // Peak Velocity (m/s)
  const sphVel = [0, 8, 24.2, 22.0, 18.5, 14.2, 10.5, 7.8, 5.2, 3.5, 2.1, 1.2, 0.8];
  const delftVel = [0, 5, 19.4, 18.2, 16.0, 13.0, 9.8, 7.2, 5.0, 3.2, 2.0, 1.1, 0.7];

  // Inundation Area Growth (km²)
  const sphArea = [0, 4.2, 12.8, 24.5, 34.0, 41.2, 45.8, 47.5, 48.2, 48.6, 48.7, 48.7, 48.7];
  const delftArea = [0, 3.5, 10.5, 21.0, 30.2, 38.0, 43.5, 46.0, 47.2, 47.9, 48.2, 48.4, 48.5];

  // SVG Chart Dimensions
  const w = 480;
  const h = 160;
  const pad = { top: 20, right: 20, bottom: 25, left: 40 };
  const innerW = w - pad.left - pad.right;
  const innerH = h - pad.top - pad.bottom;

  // Helpers to convert points to SVG polyline
  const makePath = (data, maxVal) => {
    return data
      .map((val, idx) => {
        const x = pad.left + (idx / (data.length - 1)) * innerW;
        const y = pad.top + innerH - (val / maxVal) * innerH;
        return `${x},${y}`;
      })
      .join(' ');
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
      {/* Chart 1: Peak Discharge Velocity */}
      <div className="bg-hc-surface border border-hc-border rounded-2xl p-5 space-y-3 shadow-card-dark">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <TrendingUp className="w-4 h-4 text-cyan-600" />
            <h4 className="text-xs font-bold uppercase tracking-wider text-hc-ink">
              Peak Discharge Velocity (m/s)
            </h4>
          </div>
          <div className="flex items-center space-x-3 text-[10px] font-mono font-bold">
            <span className="flex items-center gap-1 text-cyan-700">
              <span className="w-2.5 h-1 bg-cyan-600 rounded-full" /> SPH
            </span>
            <span className="flex items-center gap-1 text-blue-700">
              <span className="w-2.5 h-1 bg-blue-600 rounded-full" /> Delft3D
            </span>
          </div>
        </div>

        <div className="relative w-full h-44 bg-slate-50 rounded-xl p-2 border border-hc-border shadow-inner">
          <svg viewBox={`0 0 ${w} ${h}`} className="w-full h-full">
            {/* Grid lines */}
            {[0, 0.25, 0.5, 0.75, 1].map((ratio, i) => {
              const y = pad.top + innerH * ratio;
              return (
                <g key={i}>
                  <line x1={pad.left} y1={y} x2={w - pad.right} y2={y} stroke="#E2E8F0" strokeDasharray="3 3" />
                  <text x={pad.left - 6} y={y + 3} fill="#64748B" fontSize="8" textAnchor="end" fontFamily="monospace">
                    {(25 * (1 - ratio)).toFixed(0)}
                  </text>
                </g>
              );
            })}

            {/* Time labels */}
            {[0, 6, 12, 18, 24].map((t, idx) => {
              const x = pad.left + (t / 24) * innerW;
              return (
                <text key={idx} x={x} y={h - 6} fill="#64748B" fontSize="8" textAnchor="middle" fontFamily="monospace">
                  {t}h
                </text>
              );
            })}

            {/* Delft3D Line (Blue) */}
            <polyline
              points={makePath(delftVel, 25)}
              fill="none"
              stroke="#2563EB"
              strokeWidth="2.5"
              strokeLinecap="round"
            />

            {/* SPH Line (Cyan) */}
            <polyline
              points={makePath(sphVel, 25)}
              fill="none"
              stroke="#0284C7"
              strokeWidth="2.5"
              strokeLinecap="round"
            />
          </svg>
        </div>
      </div>

      {/* Chart 2: Inundation Area Growth Over Time */}
      <div className="bg-hc-surface border border-hc-border rounded-2xl p-5 space-y-3 shadow-card-dark">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Layers className="w-4 h-4 text-emerald-600" />
            <h4 className="text-xs font-bold uppercase tracking-wider text-hc-ink">
              Inundation Area Growth Over Time (km²)
            </h4>
          </div>
          <div className="flex items-center space-x-3 text-[10px] font-mono font-bold">
            <span className="flex items-center gap-1 text-cyan-700">
              <span className="w-2.5 h-1 bg-cyan-600 rounded-full" /> SPH (48.7 km²)
            </span>
            <span className="flex items-center gap-1 text-blue-700">
              <span className="w-2.5 h-1 bg-blue-600 rounded-full" /> Delft3D (48.5 km²)
            </span>
          </div>
        </div>

        <div className="relative w-full h-44 bg-slate-50 rounded-xl p-2 border border-hc-border shadow-inner">
          <svg viewBox={`0 0 ${w} ${h}`} className="w-full h-full">
            {/* Grid lines */}
            {[0, 0.25, 0.5, 0.75, 1].map((ratio, i) => {
              const y = pad.top + innerH * ratio;
              return (
                <g key={i}>
                  <line x1={pad.left} y1={y} x2={w - pad.right} y2={y} stroke="#E2E8F0" strokeDasharray="3 3" />
                  <text x={pad.left - 6} y={y + 3} fill="#64748B" fontSize="8" textAnchor="end" fontFamily="monospace">
                    {(50 * (1 - ratio)).toFixed(0)}
                  </text>
                </g>
              );
            })}

            {/* Time labels */}
            {[0, 6, 12, 18, 24].map((t, idx) => {
              const x = pad.left + (t / 24) * innerW;
              return (
                <text key={idx} x={x} y={h - 6} fill="#64748B" fontSize="8" textAnchor="middle" fontFamily="monospace">
                  {t}h
                </text>
              );
            })}

            {/* Delft3D Line (Blue) */}
            <polyline
              points={makePath(delftArea, 50)}
              fill="none"
              stroke="#2563EB"
              strokeWidth="2.5"
              strokeLinecap="round"
            />

            {/* SPH Line (Cyan) */}
            <polyline
              points={makePath(sphArea, 50)}
              fill="none"
              stroke="#0284C7"
              strokeWidth="2.5"
              strokeLinecap="round"
            />
          </svg>
        </div>
      </div>
    </div>
  );
}
