import React, { useState } from 'react';
import { Layers, Eye, EyeOff, Satellite, Mountain, Trees, Waves } from 'lucide-react';

export default function LayerStack3D({
  demStatus = 'uploaded',
  riverStatus = 'uploaded',
  lulcStatus = 'uploaded',
  imageryStatus = 'uploaded',
}) {
  const [layers, setLayers] = useState([
    { id: 'imagery', name: 'Satellite Imagery (Sentinel-2)', icon: Satellite, color: '#38BDF8', active: true, zOffset: 120 },
    { id: 'river', name: 'River Network & Flow Vector', icon: Waves, color: '#0EA5E9', active: true, zOffset: 80 },
    { id: 'lulc', name: 'Land Use / Land Cover (LULC)', icon: Trees, color: '#10B981', active: true, zOffset: 40 },
    { id: 'dem', name: 'Digital Elevation Model (DEM 30m)', icon: Mountain, color: '#F59E0B', active: true, zOffset: 0 },
  ]);

  const toggleLayer = (id) => {
    setLayers((prev) =>
      prev.map((l) => (l.id === id ? { ...l, active: !l.active } : l))
    );
  };

  return (
    <div className="bg-hc-surface/90 border border-hc-border rounded-2xl p-5 space-y-4 flex flex-col h-full">
      <div className="flex items-center justify-between pb-3 border-b border-hc-border">
        <div className="flex items-center space-x-2">
          <Layers className="w-4 h-4 text-hc-active" />
          <h3 className="text-xs font-bold uppercase tracking-wider text-hc-ink">
            3D Spatial Layer Stack Preview
          </h3>
        </div>
        <span className="text-[10px] font-mono text-hc-active bg-cyan-950 px-2 py-0.5 rounded border border-cyan-800/40">
          CO-REGISTERED (WGS84)
        </span>
      </div>

      {/* 3D Perspective Isometric Projection Box */}
      <div className="relative w-full h-72 rounded-xl bg-hc-canvas border border-hc-border/80 flex items-center justify-center overflow-hidden p-4">
        {/* Ambient Grid Floor */}
        <div
          className="absolute inset-0 opacity-15"
          style={{
            backgroundImage: `radial-gradient(#38BDF8 1px, transparent 1px)`,
            backgroundSize: '16px 16px',
          }}
        />

        {/* 3D Stack container with isometric transform */}
        <div
          className="relative w-56 h-36 transition-transform duration-500 ease-out"
          style={{
            transform: 'rotateX(58deg) rotateZ(-38deg) translateY(-20px)',
            transformStyle: 'preserve-3d',
          }}
        >
          {/* Layer 1: DEM Terrain (Bottom) */}
          <div
            className={`absolute inset-0 rounded-xl border-2 transition-all duration-300 ${
              layers.find((l) => l.id === 'dem')?.active
                ? 'bg-amber-950/40 border-amber-500/80 shadow-lg shadow-amber-500/20'
                : 'opacity-20 border-dashed border-gray-600'
            }`}
            style={{
              transform: 'translateZ(0px)',
            }}
          >
            <div className="p-3 text-[10px] font-mono text-amber-300 font-bold flex items-center justify-between">
              <span>DEM TERRAIN</span>
              <span>30m</span>
            </div>
            {/* Topographic Contour Lines SVG */}
            <svg viewBox="0 0 100 60" className="w-full h-20 opacity-40">
              <path d="M 0,30 Q 30,10 60,35 T 100,20" fill="none" stroke="#F59E0B" strokeWidth="1.5" />
              <path d="M 0,45 Q 40,25 70,50 T 100,35" fill="none" stroke="#F59E0B" strokeWidth="1.5" />
            </svg>
          </div>

          {/* Layer 2: LULC (Middle 1) */}
          <div
            className={`absolute inset-0 rounded-xl border-2 transition-all duration-300 ${
              layers.find((l) => l.id === 'lulc')?.active
                ? 'bg-emerald-950/40 border-emerald-500/80 shadow-lg shadow-emerald-500/20'
                : 'opacity-20 border-dashed border-gray-600'
            }`}
            style={{
              transform: 'translateZ(36px)',
            }}
          >
            <div className="p-3 text-[10px] font-mono text-emerald-300 font-bold flex items-center justify-between">
              <span>LAND USE (LULC)</span>
              <span>10m</span>
            </div>
            {/* Land Cover Polygons */}
            <svg viewBox="0 0 100 60" className="w-full h-20 opacity-30">
              <polygon points="10,10 45,15 35,45 15,40" fill="#10B981" />
              <polygon points="55,20 85,25 80,50 50,45" fill="#059669" />
            </svg>
          </div>

          {/* Layer 3: River Network (Middle 2) */}
          <div
            className={`absolute inset-0 rounded-xl border-2 transition-all duration-300 ${
              layers.find((l) => l.id === 'river')?.active
                ? 'bg-cyan-950/40 border-cyan-400 shadow-lg shadow-cyan-500/30'
                : 'opacity-20 border-dashed border-gray-600'
            }`}
            style={{
              transform: 'translateZ(72px)',
            }}
          >
            <div className="p-3 text-[10px] font-mono text-cyan-300 font-bold flex items-center justify-between">
              <span>RIVER NETWORK</span>
              <span>VECTOR</span>
            </div>
            {/* River corridor path */}
            <svg viewBox="0 0 100 60" className="w-full h-20">
              <path
                d="M 10,15 Q 40,40 60,25 T 95,50"
                fill="none"
                stroke="#00E5FF"
                strokeWidth="3.5"
                strokeLinecap="round"
                className="animate-pulse"
              />
            </svg>
          </div>

          {/* Layer 4: Satellite Imagery (Top) */}
          <div
            className={`absolute inset-0 rounded-xl border-2 transition-all duration-300 ${
              layers.find((l) => l.id === 'imagery')?.active
                ? 'bg-blue-900/40 border-blue-400 shadow-xl shadow-blue-500/40 backdrop-blur-xs'
                : 'opacity-20 border-dashed border-gray-600'
            }`}
            style={{
              transform: 'translateZ(108px)',
            }}
          >
            <div className="p-3 text-[10px] font-mono text-blue-200 font-bold flex items-center justify-between">
              <span>SATELLITE IMAGERY</span>
              <span>SENTINEL-2</span>
            </div>
            <div className="absolute inset-0 bg-gradient-to-tr from-cyan-500/10 via-transparent to-blue-500/20 pointer-events-none rounded-xl" />
          </div>
        </div>
      </div>

      {/* Layer Toggle Strip */}
      <div className="space-y-2 pt-1">
        <span className="text-[10px] font-mono text-hc-textMuted uppercase block">
          Layer Visibility &amp; Spatial Alignment
        </span>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          {layers.map((l) => {
            const Icon = l.icon;
            return (
              <button
                key={l.id}
                onClick={() => toggleLayer(l.id)}
                className={`p-2.5 rounded-xl border text-xs font-semibold flex items-center justify-between transition ${
                  l.active
                    ? 'bg-hc-card border-hc-border text-hc-ink'
                    : 'bg-hc-canvas/60 border-hc-border/40 text-hc-textMuted'
                }`}
              >
                <div className="flex items-center space-x-2">
                  <Icon className="w-3.5 h-3.5" style={{ color: l.active ? l.color : '#64748b' }} />
                  <span className="truncate">{l.name.split(' (')[0]}</span>
                </div>
                {l.active ? (
                  <Eye className="w-3.5 h-3.5 text-hc-active" />
                ) : (
                  <EyeOff className="w-3.5 h-3.5 text-hc-textMuted" />
                )}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
