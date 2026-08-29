import React from 'react';

export function MapSkeleton({ className = "h-[450px]" }) {
  return (
    <div className={`w-full rounded-2xl bg-hc-surface border border-hc-border animate-pulse flex flex-col items-center justify-center relative overflow-hidden ${className}`}>
      <div className="absolute inset-0 bg-gradient-to-r from-slate-900 via-slate-800/60 to-slate-900 animate-[shimmer_2s_infinite]" />
      <div className="z-10 text-center space-y-2 p-6">
        <div className="w-10 h-10 rounded-xl bg-hc-secondary border border-hc-border mx-auto flex items-center justify-center text-hc-textSecondary">
          <svg className="w-5 h-5 animate-spin" viewBox="0 0 24 24" fill="none" stroke="currentColor">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
        </div>
        <h4 className="text-xs font-bold text-hc-textSecondary">Rendering Geospatial Tile Engine</h4>
        <p className="text-[11px] text-hc-textSecondary">Loading Copernicus GLO-30 DEM, hydrodynamic mesh and vector layers...</p>
      </div>
    </div>
  );
}

export function CardSkeleton({ count = 4 }) {
  return (
    <div className={`grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-${count} gap-4`}>
      {Array.from({ length: count }).map((_, idx) => (
        <div key={idx} className="p-4 bg-hc-surface/80 border border-hc-border rounded-xl space-y-3 animate-pulse">
          <div className="flex justify-between items-center">
            <div className="h-3 w-24 bg-hc-secondary rounded"></div>
            <div className="w-6 h-6 rounded-lg bg-hc-secondary"></div>
          </div>
          <div className="h-7 w-32 bg-hc-secondary rounded"></div>
          <div className="h-2.5 w-40 bg-hc-secondary/60 rounded"></div>
        </div>
      ))}
    </div>
  );
}

export function TableSkeleton({ rows = 5 }) {
  return (
    <div className="w-full bg-hc-surface border border-hc-border rounded-xl overflow-hidden animate-pulse">
      <div className="h-10 bg-hc-bg border-b border-hc-border px-4 flex items-center gap-4">
        <div className="h-3 w-1/4 bg-hc-secondary rounded"></div>
        <div className="h-3 w-1/4 bg-hc-secondary rounded"></div>
        <div className="h-3 w-1/4 bg-hc-secondary rounded"></div>
        <div className="h-3 w-1/4 bg-hc-secondary rounded"></div>
      </div>
      <div className="p-4 space-y-3">
        {Array.from({ length: rows }).map((_, idx) => (
          <div key={idx} className="h-8 bg-hc-bg/60 rounded flex items-center px-4 gap-4">
            <div className="h-2.5 w-1/4 bg-hc-secondary/80 rounded"></div>
            <div className="h-2.5 w-1/4 bg-hc-secondary/80 rounded"></div>
            <div className="h-2.5 w-1/4 bg-hc-secondary/80 rounded"></div>
            <div className="h-2.5 w-1/4 bg-hc-secondary/80 rounded"></div>
          </div>
        ))}
      </div>
    </div>
  );
}
