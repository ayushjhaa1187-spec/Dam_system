import React, { useState, useEffect, useRef } from 'react';
import L from 'leaflet';
import {
  Map,
  Play,
  Pause,
  RotateCcw,
  Layers,
  Clock,
  Compass,
  Maximize2,
  TrendingUp,
  Activity,
  Waves,
  Eye,
  Sliders,
  ShieldAlert,
  ChevronRight,
  Download,
  FileText,
  FileCode,
  MapPin,
  Sparkles,
  Table as TableIcon,
  PieChart,
} from 'lucide-react';
import PageHeader from '../components/common/PageHeader';
import { getModeFromResult, ExecutionModeBadge, ExecutionModeBanner } from '../utils/executionMode';
import { createBasemapLayer } from '../utils/mapTiles';
import { api } from '../services/api';

export const RESULTS_STATIONS = [
  { id: 'st_01', name: 'Village A (Near Dam Axis)', km: 4.2, depth: '12.6 m', vel: '22.4 m/s', arrival: 'T+8m', lat: 33.155, lon: 75.740, risk: 'High' },
  { id: 'st_02', name: 'Village B (Gorge Bend)', km: 18.5, depth: '9.8 m', vel: '18.2 m/s', arrival: 'T+24m', lat: 33.165, lon: 75.650, risk: 'High' },
  { id: 'st_03', name: 'Village C (Valley Confluence)', km: 38.0, depth: '6.4 m', vel: '12.0 m/s', arrival: 'T+52m', lat: 33.148, lon: 75.520, risk: 'Medium' },
  { id: 'st_04', name: 'Downstream Plain Sector', km: 65.0, depth: '3.8 m', vel: '7.5 m/s', arrival: 'T+95m', lat: 33.230, lon: 75.260, risk: 'Low' },
];

export default function ResultsMapScreen({
  simulationResult,
  selectedPreset,
  onRunSimulation,
  isSimulating,
  onNavigate,
}) {
  const mapContainerRef = useRef(null);
  const mapInstanceRef = useRef(null);

  const [currentTimeHr, setCurrentTimeHr] = useState(12.0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [activeRightTab, setActiveRightTab] = useState('graph'); // 'graph', 'statistics', 'table'

  // Layer Checkboxes
  const [layerVisibility, setLayerVisibility] = useState({
    depth: true,
    velocity: true,
    waterLevel: false,
    arrivalTime: true,
    buildings: true,
    roads: false,
    population: true,
  });

  const toggleLayer = (key) => {
    setLayerVisibility((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  // Timeline Animation Loop
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
      }, 250);
    }
    return () => clearInterval(interval);
  }, [isPlaying]);

  // Leaflet Map Initialization
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

    // River centerline
    const riverCoords = [
      [33.310, 75.766],
      [33.220, 75.720],
      [33.145, 75.760],
      [33.160, 75.680],
      [33.143, 75.546],
      [33.190, 75.400],
      [33.242, 75.244],
    ];

    L.polyline(riverCoords, {
      color: '#0284C7',
      weight: 3.5,
      opacity: 0.9,
    }).addTo(map);

    // Inundation Plume Polygon
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
      color: '#DC2626',
      fillColor: '#EA580C',
      fillOpacity: 0.5,
      weight: 2,
    }).addTo(map);

    // Add Settlement Markers (Village A, Village B, Village C)
    RESULTS_STATIONS.forEach((st) => {
      const isHigh = st.risk === 'High';
      const icon = L.divIcon({
        className: 'result-station-marker',
        html: `
          <div style="
            background: ${isHigh ? '#DC2626' : '#0F172A'};
            border: 1.5px solid ${isHigh ? '#FCA5A5' : '#94A3B8'};
            color: #FFFFFF;
            border-radius: 8px;
            padding: 3px 8px;
            font-size: 10px;
            font-weight: 700;
            font-family: monospace;
            white-space: nowrap;
            box-shadow: 0 4px 12px rgba(15,23,42,0.3);
            display: flex;
            align-items: center;
            gap: 4px;
          ">
            <span style="width: 6px; height: 6px; border-radius: 50%; background: ${isHigh ? '#FEF08A' : '#6EE7B7'};"></span>
            <span>${st.name.split(' (')[0]}</span>
          </div>
        `,
        iconSize: [90, 24],
        iconAnchor: [45, 12],
      });

      L.marker([st.lat, st.lon], { icon }).addTo(map);
    });

    return () => {
      map.remove();
      mapInstanceRef.current = null;
    };
  }, []);

  const downloadPayload = {
    run_id: simulationResult?.run_id || 'sim_latest',
    scenario_name: selectedPreset?.name || 'Chenab River Basin',
  };

  return (
    <div className="p-6 sm:p-8 max-w-7xl mx-auto space-y-6 text-hc-ink">
      {/* Header */}
      <PageHeader
        category="DETAILED RESULTS EXPLORER &bull; SCREEN 5 OF HYDROSHIELD"
        title="Results &amp; Inundation Map (Detailed)"
        subtitle="3D perspective terrain tilt, dynamic flood wave progression timeline, multi-layer GIS overlay, and gauge hydrograph analytics."
        status="COMPLETED"
        statusLabel="DYNAMIC WAVE MESH READY"
        actions={
          <div className="flex items-center space-x-2">
            <button
              onClick={() => onNavigate && onNavigate('reports')}
              className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-500 hover:to-cyan-500 text-white font-bold text-xs transition shadow-glow-blue"
            >
              <FileText className="w-3.5 h-3.5" />
              <span>Generate Decision Brief</span>
            </button>
          </div>
        }
      />

      {/* 3-Column Layout: Left Layer Control (2.5 cols) + Center 3D Map (5.5 cols) + Right Tabbed Analytics (4 cols) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* 1. Left: Layer Control Panel (3 cols) */}
        <div className="lg:col-span-3 space-y-4">
          <div className="bg-hc-surface border border-hc-border rounded-2xl p-4 space-y-4 shadow-card-dark">
            <div className="flex items-center justify-between pb-2 border-b border-hc-border">
              <div className="flex items-center space-x-2">
                <Layers className="w-4 h-4 text-hc-active" />
                <h3 className="text-xs font-bold uppercase tracking-wider text-hc-ink">
                  Layer Control
                </h3>
              </div>
              <span className="text-[9px] font-mono text-blue-700 font-bold">7 LAYERS</span>
            </div>

            {/* Checkbox toggles */}
            <div className="space-y-2 text-xs font-medium">
              {[
                { id: 'depth', label: 'Inundation Depth' },
                { id: 'velocity', label: 'Flow Velocity' },
                { id: 'waterLevel', label: 'Water Level (m MSL)' },
                { id: 'arrivalTime', label: 'Arrival Time (Contours)' },
                { id: 'buildings', label: 'Affected Buildings' },
                { id: 'roads', label: 'Roads & Bridges (NH-44)' },
                { id: 'population', label: 'Population Density Exposure' },
              ].map((layer) => (
                <label
                  key={layer.id}
                  className="flex items-center space-x-2.5 p-2 rounded-xl bg-hc-card hover:bg-slate-200/60 border border-hc-border cursor-pointer transition"
                >
                  <input
                    type="checkbox"
                    checked={layerVisibility[layer.id]}
                    onChange={() => toggleLayer(layer.id)}
                    className="w-4 h-4 rounded bg-white border-slate-300 text-blue-600 focus:ring-0"
                  />
                  <span className="text-hc-ink text-xs">{layer.label}</span>
                </label>
              ))}
            </div>

            {/* Velocity / Depth Legend */}
            <div className="pt-3 border-t border-hc-border space-y-2">
              <span className="text-[10px] font-mono font-bold text-hc-textSecondary uppercase block">
                Velocity Gradient (m/s)
              </span>
              <div className="h-3 w-full rounded-full bg-gradient-to-r from-blue-600 via-cyan-400 via-amber-400 to-red-600 border border-hc-border" />
              <div className="flex justify-between text-[9px] font-mono text-hc-textMuted font-medium">
                <span>0 m/s</span>
                <span>5 m/s</span>
                <span>12 m/s</span>
                <span>&gt; 20 m/s</span>
              </div>
            </div>
          </div>
        </div>

        {/* 2. Center: 3D Map + Timeline Scrubber (5 cols) */}
        <div className="lg:col-span-5 space-y-4">
          <div className="relative w-full h-[400px] rounded-2xl overflow-hidden border border-hc-border bg-slate-100 shadow-card-dark">
            <div ref={mapContainerRef} className="absolute inset-0 w-full h-full z-0" />

            <div className="absolute top-3 right-3 z-10 bg-white/95 backdrop-blur border border-slate-200 px-3 py-1.5 rounded-xl text-xs font-mono text-blue-700 shadow-lg flex items-center gap-1.5 font-bold">
              <Compass className="w-3.5 h-3.5 text-blue-600 animate-spin" style={{ animationDuration: '10s' }} />
              <span>3D PERSPECTIVE</span>
            </div>
          </div>

          {/* Timeline Scrubber */}
          <div className="bg-hc-surface border border-hc-border rounded-2xl p-4 flex items-center justify-between gap-3 shadow-card-dark">
            <button
              onClick={() => setIsPlaying(!isPlaying)}
              className="w-8 h-8 rounded-xl bg-blue-600 hover:bg-blue-500 text-white flex items-center justify-center shrink-0 shadow-glow-blue"
            >
              {isPlaying ? <Pause className="w-3.5 h-3.5 fill-white" /> : <Play className="w-3.5 h-3.5 fill-white" />}
            </button>

            <div className="flex-1 px-2">
              <div className="flex justify-between items-center text-[10px] font-mono font-bold mb-1">
                <span className="text-hc-textSecondary">Simulation Timeline</span>
                <span className="text-cyan-700">{currentTimeHr.toFixed(1)} hr / 24.0 hr</span>
              </div>
              <input
                type="range"
                min="0"
                max="24"
                step="0.5"
                value={currentTimeHr}
                onChange={(e) => setCurrentTimeHr(parseFloat(e.target.value))}
                className="w-full accent-cyan-600 cursor-pointer"
              />
            </div>
          </div>
        </div>

        {/* 3. Right: Tabbed Analysis (Graph / Statistics / Table) + Heatmap (4 cols) */}
        <div className="lg:col-span-4 space-y-4">
          <div className="bg-hc-surface border border-hc-border rounded-2xl p-4 space-y-3.5 shadow-card-dark">
            {/* Tabs Header */}
            <div className="flex items-center space-x-1 bg-hc-card p-1 rounded-xl border border-hc-border">
              {[
                { id: 'graph', label: 'Graph', icon: TrendingUp },
                { id: 'statistics', label: 'Statistics', icon: PieChart },
                { id: 'table', label: 'Table', icon: TableIcon },
              ].map((tab) => {
                const Icon = tab.icon;
                const isActive = activeRightTab === tab.id;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveRightTab(tab.id)}
                    className={`flex-1 py-1.5 rounded-lg text-xs font-semibold flex items-center justify-center space-x-1.5 transition ${
                      isActive
                        ? 'bg-blue-600 text-white shadow-sm'
                        : 'text-hc-textSecondary hover:text-hc-ink'
                    }`}
                  >
                    <Icon className="w-3.5 h-3.5" />
                    <span>{tab.label}</span>
                  </button>
                );
              })}
            </div>

            {/* TAB 1: Hydrograph Chart */}
            {activeRightTab === 'graph' && (
              <div className="space-y-2">
                <div className="flex justify-between items-center text-[11px] font-mono text-hc-textSecondary">
                  <span>Water Level (m) Over Time</span>
                  <div className="flex items-center space-x-2 text-[9px] font-bold">
                    <span className="text-cyan-700">&bull; Upstream</span>
                    <span className="text-blue-700">&bull; Midstream</span>
                  </div>
                </div>

                <div className="h-40 bg-slate-50 rounded-xl border border-hc-border p-2 shadow-inner">
                  <svg viewBox="0 0 300 130" className="w-full h-full">
                    {/* Grid */}
                    <line x1="25" y1="20" x2="290" y2="20" stroke="#E2E8F0" strokeDasharray="2 2" />
                    <line x1="25" y1="65" x2="290" y2="65" stroke="#E2E8F0" strokeDasharray="2 2" />
                    <line x1="25" y1="110" x2="290" y2="110" stroke="#E2E8F0" />

                    {/* Upstream Hydrograph (Cyan) */}
                    <path
                      d="M 25,110 Q 60,15 120,50 T 290,105"
                      fill="none"
                      stroke="#0284C7"
                      strokeWidth="2.5"
                    />
                    {/* Midstream Hydrograph (Blue) */}
                    <path
                      d="M 25,110 Q 100,45 160,75 T 290,108"
                      fill="none"
                      stroke="#2563EB"
                      strokeWidth="2"
                    />
                  </svg>
                </div>
              </div>
            )}

            {/* TAB 2: Inundated Area Donut Chart */}
            {activeRightTab === 'statistics' && (
              <div className="space-y-3">
                <div className="flex items-center justify-between text-xs font-bold text-hc-ink">
                  <span>Inundated Area Distribution</span>
                  <span className="text-cyan-700 font-mono">48.7 kmÂ²</span>
                </div>

                <div className="flex items-center justify-between gap-4 p-2 bg-slate-50 rounded-xl border border-hc-border shadow-inner">
                  {/* SVG Donut Chart */}
                  <svg viewBox="0 0 100 100" className="w-24 h-24 shrink-0">
                    {/* High Risk (Red - 37%) */}
                    <circle cx="50" cy="50" r="35" fill="transparent" stroke="#DC2626" strokeWidth="18" strokeDasharray="81 138" strokeDashoffset="0" />
                    {/* Med Risk (Amber - 36%) */}
                    <circle cx="50" cy="50" r="35" fill="transparent" stroke="#D97706" strokeWidth="18" strokeDasharray="79 140" strokeDashoffset="-81" />
                    {/* Low Risk (Green/Blue - 27%) */}
                    <circle cx="50" cy="50" r="35" fill="transparent" stroke="#0284C7" strokeWidth="18" strokeDasharray="59 160" strokeDashoffset="-160" />
                  </svg>

                  <div className="space-y-1.5 text-xs font-mono">
                    <div className="flex items-center justify-between gap-4">
                      <span className="flex items-center gap-1 text-red-700">
                        <span className="w-2 h-2 rounded-full bg-red-600" /> High Risk:
                      </span>
                      <strong className="text-slate-900">18.2 kmÂ²</strong>
                    </div>
                    <div className="flex items-center justify-between gap-4">
                      <span className="flex items-center gap-1 text-amber-800">
                        <span className="w-2 h-2 rounded-full bg-amber-500" /> Med Risk:
                      </span>
                      <strong className="text-slate-900">17.6 kmÂ²</strong>
                    </div>
                    <div className="flex items-center justify-between gap-4">
                      <span className="flex items-center gap-1 text-cyan-700">
                        <span className="w-2 h-2 rounded-full bg-cyan-600" /> Low Risk:
                      </span>
                      <strong className="text-slate-900">12.9 kmÂ²</strong>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* TAB 3: Gauge Station Table */}
            {activeRightTab === 'table' && (
              <div className="space-y-2 overflow-x-auto">
                <table className="w-full text-left font-mono text-[10px]">
                  <thead>
                    <tr className="border-b border-hc-border text-hc-textSecondary">
                      <th className="py-1">Station</th>
                      <th className="py-1">Peak Depth</th>
                      <th className="py-1">Velocity</th>
                      <th className="py-1">Arrival</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-hc-border/60">
                    {RESULTS_STATIONS.map((st) => (
                      <tr key={st.id}>
                        <td className="py-1.5 text-hc-ink font-bold">{st.name.split(' (')[0]}</td>
                        <td className="py-1.5 text-red-600 font-bold">{st.depth}</td>
                        <td className="py-1.5 text-cyan-700 font-bold">{st.vel}</td>
                        <td className="py-1.5 text-amber-800 font-bold">{st.arrival}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {/* Risk Heatmap (Population) Mini-Box */}
            <div className="pt-2 border-t border-hc-border space-y-1.5">
              <div className="flex items-center justify-between text-[11px] font-mono text-hc-textSecondary">
                <span>Risk Heatmap (Population Exposure)</span>
                <span className="text-amber-800 font-bold">25,340 PPL</span>
              </div>
              <div className="h-14 bg-gradient-to-r from-blue-100 via-amber-100 to-red-100 rounded-xl border border-red-200 flex items-center justify-center text-[10px] font-mono text-red-800 font-bold">
                <span>CRITICAL ZONE: RAMBAN &amp; DODA</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom Action Bar: Export KML Â· Export Shapefile Â· Generate Report */}
      <div className="bg-hc-surface border border-hc-border rounded-2xl p-4 flex flex-wrap items-center justify-between gap-4 shadow-card-dark">
        <div className="flex items-center space-x-2 text-xs text-hc-textSecondary font-mono">
          <span>Simulation Run: <strong className="text-hc-ink">Chenab_WorstCase_Coupled_v1</strong></span>
          <span>&bull;</span>
          <span>CRS: <strong className="text-blue-700">EPSG:4326</strong></span>
        </div>

        <div className="flex items-center space-x-3">
          <button
            onClick={() => api.downloadKML(downloadPayload)}
            className="px-4 py-2 rounded-xl bg-hc-card hover:bg-slate-200 border border-hc-border text-xs font-semibold text-cyan-800 transition flex items-center space-x-1.5 shadow-xs"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Export KML</span>
          </button>

          <button
            onClick={() => api.downloadShapefile(downloadPayload)}
            className="px-4 py-2 rounded-xl bg-hc-card hover:bg-slate-200 border border-hc-border text-xs font-semibold text-emerald-800 transition flex items-center space-x-1.5 shadow-xs"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Export Shapefile</span>
          </button>

          <button
            onClick={() => onNavigate && onNavigate('reports')}
            className="px-5 py-2 rounded-xl bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-500 hover:to-cyan-500 text-white font-bold text-xs transition shadow-glow-blue flex items-center space-x-1.5"
          >
            <FileText className="w-3.5 h-3.5" />
            <span>Generate Report</span>
          </button>
        </div>
      </div>
    </div>
  );
}
