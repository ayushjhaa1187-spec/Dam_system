import React, { useState, useEffect, useRef } from 'react';
import L from 'leaflet';
import {
  ShieldAlert,
  Waves,
  TrendingUp,
  MapPin,
  Clock,
  Play,
  Pause,
  ArrowRight,
  Activity,
  Layers,
  Compass,
  AlertTriangle,
  Building2,
  Users,
  IndianRupee,
} from 'lucide-react';
import PageHeader from '../components/common/PageHeader';
import MetricCard from '../components/common/MetricCard';
import { createBasemapLayer } from '../utils/mapTiles';

export const CHENAB_STATIONS = [
  { name: 'Chenab Dam Axis', lat: 33.145, lon: 75.760, depth: '12.6 m', type: 'dam' },
  { name: 'Critical Zone (Gorge)', lat: 33.160, lon: 75.680, depth: '10.8 m', type: 'critical' },
  { name: 'Kishtwar Sector', lat: 33.310, lon: 75.766, depth: '8.4 m', type: 'settlement' },
  { name: 'Doda Township', lat: 33.143, lon: 75.546, depth: '6.2 m', type: 'settlement' },
  { name: 'Ramban District', lat: 33.242, lon: 75.244, depth: '4.8 m', type: 'settlement' },
];

export default function Overview({
  selectedPreset,
  simulationResult,
  onNavigate,
  onRunSimulation,
  isSimulating,
}) {
  const mapContainerRef = useRef(null);
  const mapInstanceRef = useRef(null);

  const [currentTimeHr, setCurrentTimeHr] = useState(12.0);
  const [isPlaying, setIsPlaying] = useState(false);

  // Timeline scrubber loop
  useEffect(() => {
    let interval = null;
    if (isPlaying) {
      interval = setInterval(() => {
        setCurrentTimeHr((prev) => {
          if (prev >= 24) {
            setIsPlaying(false);
            return 24;
          }
          return parseFloat((prev + 0.5).toFixed(1));
        });
      }, 300);
    }
    return () => clearInterval(interval);
  }, [isPlaying]);

  useEffect(() => {
    if (!mapContainerRef.current) return;
    if (mapInstanceRef.current) return;

    const map = L.map(mapContainerRef.current, {
      center: [33.180, 75.580],
      zoom: 10,
      zoomControl: false,
      attributionControl: false,
    });

    createBasemapLayer(map, 'satellite').addTo(map);
    mapInstanceRef.current = map;

    // Chenab Gorge River Path
    const riverCoords = [
      [33.310, 75.766], // Kishtwar
      [33.220, 75.720],
      [33.145, 75.760], // Dam Axis
      [33.160, 75.680], // Critical Zone
      [33.143, 75.546], // Doda
      [33.190, 75.400],
      [33.242, 75.244], // Ramban
    ];

    // River centerline
    L.polyline(riverCoords, {
      color: '#00E5FF',
      weight: 3.5,
      opacity: 0.8,
    }).addTo(map);

    // Multi-color Inundation Plume Polygon (Blue to Red)
    const plumePolygon = [
      [33.320, 75.775],
      [33.230, 75.735],
      [33.155, 75.770],
      [33.175, 75.690],
      [33.155, 75.555],
      [33.205, 75.410],
      [33.255, 75.250],
      [33.230, 75.240],
      [33.175, 75.390],
      [33.130, 75.535],
      [33.145, 75.670],
      [33.135, 75.750],
      [33.210, 75.705],
      [33.300, 75.755],
    ];

    L.polygon(plumePolygon, {
      color: '#EF4444',
      fillColor: '#F97316',
      fillOpacity: 0.45,
      weight: 2,
    }).addTo(map);

    // Add High-Fidelity Settlement & Hazard Markers
    CHENAB_STATIONS.forEach((st) => {
      const isDam = st.type === 'dam';
      const isCrit = st.type === 'critical';

      const icon = L.divIcon({
        className: 'custom-poi-marker',
        html: `
          <div style="
            background: ${isDam ? '#2563EB' : isCrit ? '#EF4444' : '#101B33'};
            border: 1.5px solid ${isDam ? '#60A5FA' : isCrit ? '#FCA5A5' : '#38BDF8'};
            color: #FFFFFF;
            border-radius: 8px;
            padding: 3px 8px;
            font-size: 10px;
            font-weight: 700;
            font-family: monospace;
            white-space: nowrap;
            box-shadow: 0 4px 12px rgba(0,0,0,0.6);
            display: flex;
            align-items: center;
            gap: 5px;
          ">
            <span style="width: 6px; height: 6px; border-radius: 50%; background: ${isDam ? '#93C5FD' : isCrit ? '#FEF08A' : '#34D399'}; display: inline-block;"></span>
            <span>${st.name}</span>
          </div>
        `,
        iconSize: [120, 24],
        iconAnchor: [60, 12],
      });

      L.marker([st.lat, st.lon], { icon }).addTo(map);
    });

    return () => {
      map.remove();
      mapInstanceRef.current = null;
    };
  }, []);

  return (
    <div className="p-6 sm:p-8 max-w-7xl mx-auto space-y-6 text-hc-ink">
      {/* 1. Header Banner */}
      <div className="flex flex-wrap items-center justify-between gap-4 bg-hc-surface/90 border border-hc-border rounded-2xl p-5">
        <div>
          <div className="flex items-center space-x-2.5">
            <h2 className="text-base font-extrabold text-hc-ink font-mono tracking-tight">
              Chenab River Basin
            </h2>
            <span className="px-2 py-0.5 rounded-md text-[10px] font-mono font-bold bg-blue-950 text-blue-300 border border-blue-800">
              JAMMU &amp; KASHMIR, INDIA
            </span>
          </div>
          <p className="text-xs text-hc-textSecondary mt-0.5 flex items-center gap-2">
            <span>Case: <strong>Dam Break (Full Breach)</strong></span>
            <span>&bull;</span>
            <span>Model: <strong className="text-cyan-300">DELFT3D FM</strong></span>
          </p>
        </div>

        <div className="flex items-center space-x-3">
          <button
            onClick={() => onRunSimulation && onRunSimulation()}
            disabled={isSimulating}
            className="flex items-center space-x-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-500 hover:to-cyan-500 text-white font-bold text-xs transition shadow-glow-blue disabled:opacity-50"
          >
            <Play className={`w-4 h-4 fill-white ${isSimulating ? 'animate-spin' : ''}`} />
            <span>{isSimulating ? 'Computing Simulation...' : 'Run Simulation'}</span>
          </button>
        </div>
      </div>

      {/* 2. Top Warning Alert Banner */}
      <div className="p-3.5 rounded-xl bg-red-950/40 border border-red-800 flex items-center justify-between text-xs text-red-200">
        <div className="flex items-center gap-2.5">
          <AlertTriangle className="w-4 h-4 text-red-400 shrink-0 animate-pulse" />
          <span>
            <strong>Active Alerts: 3</strong> &bull; High Risk Flood Zone in Ramban District — Inundation depth &gt; 5.0m. Immediate evacuation required.
          </span>
        </div>
        <button
          onClick={() => onNavigate && onNavigate('alerts')}
          className="text-[11px] font-bold text-red-300 hover:underline flex items-center gap-1 shrink-0"
        >
          <span>View Alerts</span>
          <ArrowRight className="w-3 h-3" />
        </button>
      </div>

      {/* 3. Main Dashboard Grid (Map + 5 Stat Cards) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left 8 cols: 3D Terrain Map + Scrubber + Scenario Box */}
        <div className="lg:col-span-8 space-y-4">
          {/* Main Map Container */}
          <div className="relative w-full h-[460px] rounded-2xl overflow-hidden border border-hc-border bg-hc-canvas shadow-card-dark">
            <div ref={mapContainerRef} className="absolute inset-0 w-full h-full z-0" />

            {/* Depth Legend Floating Overlay */}
            <div className="absolute top-4 left-4 z-10 bg-hc-surface/90 backdrop-blur-md border border-hc-border p-3 rounded-xl shadow-lg space-y-1.5 font-mono text-[10px]">
              <span className="font-bold text-hc-ink block text-[11px]">Inundation Depth (m)</span>
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="w-3 h-3 rounded bg-red-600" />
                  <span>&gt; 10.0 m (Extreme)</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="w-3 h-3 rounded bg-orange-500" />
                  <span>5.0 – 10.0 m (Severe)</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="w-3 h-3 rounded bg-amber-500" />
                  <span>2.0 – 5.0 m (Moderate)</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="w-3 h-3 rounded bg-cyan-400" />
                  <span>0.5 – 2.0 m (Shallow)</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="w-3 h-3 rounded bg-blue-600" />
                  <span>0 – 0.5 m (Trace)</span>
                </div>
              </div>
            </div>

            {/* 3D Compass / Tilt Badge */}
            <div className="absolute top-4 right-4 z-10 bg-hc-surface/90 backdrop-blur-md border border-hc-border px-3 py-1.5 rounded-xl text-xs font-mono text-cyan-300 shadow-lg flex items-center gap-1.5">
              <Compass className="w-3.5 h-3.5 text-cyan-400 animate-spin" style={{ animationDuration: '10s' }} />
              <span>3D TERRAIN TILT</span>
            </div>

            {/* Flow Direction Indicator */}
            <div className="absolute bottom-4 right-4 z-10 bg-hc-surface/90 backdrop-blur-md border border-hc-border px-3 py-1.5 rounded-xl text-[10px] font-mono text-emerald-300 shadow-lg flex items-center gap-1.5">
              <Waves className="w-3.5 h-3.5 text-emerald-400" />
              <span>FLOW DIRECTION: SOUTH-WEST</span>
            </div>
          </div>

          {/* Simulation Timeline Scrubber (0h to 24h) */}
          <div className="bg-hc-surface/90 border border-hc-border rounded-2xl p-4 flex items-center justify-between gap-4">
            <div className="flex items-center space-x-3">
              <button
                onClick={() => setIsPlaying(!isPlaying)}
                className="w-9 h-9 rounded-xl bg-blue-600 hover:bg-blue-500 text-white flex items-center justify-center transition shadow-glow-blue"
              >
                {isPlaying ? <Pause className="w-4 h-4 fill-white" /> : <Play className="w-4 h-4 fill-white" />}
              </button>
              <div>
                <span className="text-xs font-bold text-hc-ink block">Simulation Timeline</span>
                <span className="text-[10px] font-mono text-cyan-400 font-bold">
                  Time: {currentTimeHr.toFixed(1)} hr / 24.0 hr
                </span>
              </div>
            </div>

            <div className="flex-1 px-4">
              <input
                type="range"
                min="0"
                max="24"
                step="0.5"
                value={currentTimeHr}
                onChange={(e) => setCurrentTimeHr(parseFloat(e.target.value))}
                className="w-full accent-cyan-500 cursor-pointer"
              />
              <div className="flex justify-between text-[9px] font-mono text-hc-textMuted mt-1">
                <span>0h (Breach Start)</span>
                <span>6h</span>
                <span>12h (Current Frame)</span>
                <span>18h</span>
                <span>24h (Max Inundation)</span>
              </div>
            </div>
          </div>

          {/* Scenario Quick Specs Box */}
          <div className="bg-hc-surface/90 border border-hc-border rounded-2xl p-4 flex flex-wrap items-center justify-between gap-3 text-xs font-mono">
            <div className="flex items-center space-x-2">
              <ShieldAlert className="w-4 h-4 text-amber-400" />
              <span className="font-bold text-hc-ink">Scenario: Worst Case (Full Breach)</span>
            </div>
            <div className="flex items-center space-x-4 text-hc-textSecondary">
              <span>Breach Width: <strong className="text-hc-ink font-bold">120 m</strong></span>
              <span>Reservoir Level: <strong className="text-cyan-400 font-bold">98%</strong></span>
              <span>Breach Time: <strong className="text-amber-400 font-bold">00:15 hr</strong></span>
            </div>
          </div>
        </div>

        {/* Right 4 cols: 5 Operational KPI Stat Cards */}
        <div className="lg:col-span-4 space-y-3.5">
          {/* 1. Max Inundation Depth (Blue) */}
          <div className="p-4 bg-hc-surface border border-blue-500/40 rounded-2xl shadow-sm space-y-1">
            <div className="flex items-center justify-between text-xs text-blue-300 font-medium">
              <span>Max Inundation Depth</span>
              <Waves className="w-4 h-4 text-blue-400" />
            </div>
            <div className="flex items-baseline space-x-1.5">
              <span className="text-2xl font-extrabold font-mono text-white">12.6</span>
              <span className="text-xs font-mono text-blue-300">m</span>
            </div>
            <span className="text-[10px] font-mono text-blue-300/80 block">At Downstream Dam Axis</span>
          </div>

          {/* 2. Affected Area (Green) */}
          <div className="p-4 bg-hc-surface border border-emerald-500/40 rounded-2xl shadow-sm space-y-1">
            <div className="flex items-center justify-between text-xs text-emerald-300 font-medium">
              <span>Affected Area</span>
              <Layers className="w-4 h-4 text-emerald-400" />
            </div>
            <div className="flex items-baseline space-x-1.5">
              <span className="text-2xl font-extrabold font-mono text-white">48.7</span>
              <span className="text-xs font-mono text-emerald-300">km²</span>
            </div>
            <span className="text-[10px] font-mono text-emerald-300/80 block">Total Wetted Perimeter</span>
          </div>

          {/* 3. Population At Risk (Orange) */}
          <div className="p-4 bg-hc-surface border border-amber-500/40 rounded-2xl shadow-sm space-y-1">
            <div className="flex items-center justify-between text-xs text-amber-300 font-medium">
              <span>Population At Risk</span>
              <Users className="w-4 h-4 text-amber-400" />
            </div>
            <div className="flex items-baseline space-x-1.5">
              <span className="text-2xl font-extrabold font-mono text-white">25,340</span>
              <span className="text-xs font-mono text-amber-300">People</span>
            </div>
            <span className="text-[10px] font-mono text-amber-300/80 block">Direct Inundation Corridor</span>
          </div>

          {/* 4. Estimated Damage (Red) */}
          <div className="p-4 bg-hc-surface border border-red-500/40 rounded-2xl shadow-sm space-y-1">
            <div className="flex items-center justify-between text-xs text-red-300 font-medium">
              <span>Estimated Damage</span>
              <Building2 className="w-4 h-4 text-red-400" />
            </div>
            <div className="flex items-baseline space-x-1.5">
              <span className="text-2xl font-extrabold font-mono text-white">₹ 1,240</span>
              <span className="text-xs font-mono text-red-300">Cr</span>
            </div>
            <span className="text-[10px] font-mono text-red-300/80 block">Potential Economic Loss</span>
          </div>

          {/* 5. Peak Discharge (Cyan with Sparkline) */}
          <div className="p-4 bg-hc-surface border border-cyan-500/40 rounded-2xl shadow-sm space-y-2">
            <div className="flex items-center justify-between text-xs text-cyan-300 font-medium">
              <span>Peak Discharge</span>
              <TrendingUp className="w-4 h-4 text-cyan-400" />
            </div>
            <div className="flex items-baseline space-x-1.5">
              <span className="text-2xl font-extrabold font-mono text-white">45,600</span>
              <span className="text-xs font-mono text-cyan-300">m³/s</span>
            </div>
            {/* Outflow Sparkline */}
            <svg viewBox="0 0 100 24" className="w-full h-7">
              <path
                d="M 0,22 Q 25,2 40,3 T 70,18 T 100,22"
                fill="none"
                stroke="#06B6D4"
                strokeWidth="2"
                strokeLinecap="round"
              />
            </svg>
          </div>
        </div>
      </div>
    </div>
  );
}
