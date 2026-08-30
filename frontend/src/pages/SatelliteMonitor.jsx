import React, { useState, useEffect, useRef } from 'react';
import L from 'leaflet';
import {
  Satellite,
  Download,
  FileText,
  Layers,
  Sparkles,
  CheckCircle2,
  AlertTriangle,
  Play,
  Activity,
  Globe,
  Sliders,
  Calendar,
  Eye,
  Info,
} from 'lucide-react';
import PageHeader from '../components/common/PageHeader';
import MetricCard from '../components/common/MetricCard';
import SimulationQueue from '../components/simulation/SimulationQueue';
import { createBasemapLayer } from '../utils/mapTiles';
import { api } from '../services/api';

export default function SatelliteMonitor({
  selectedPreset,
  simulationResult,
  onNavigate,
  onRunSimulation,
  isSimulating,
}) {
  const mapContainerRef = useRef(null);
  const mapInstanceRef = useRef(null);

  const [activeTab, setActiveTab] = useState('data'); // 'data' or 'controls'
  const [sensor, setSensor] = useState('sentinel_1_sar');
  const [isProcessing, setIsProcessing] = useState(false);
  const [satelliteData, setSatelliteData] = useState(null);

  const [layers, setLayers] = useState({
    floodExtent: true,
    sic: true,
    dockDiary: false,
  });

  const toggleLayer = (key) => {
    setLayers((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  useEffect(() => {
    if (!mapContainerRef.current) return;
    if (mapInstanceRef.current) return;

    const map = L.map(mapContainerRef.current, {
      center: [30.485, 79.738], // Chamoli / Rishi Ganga
      zoom: 11,
      zoomControl: false,
      attributionControl: false,
    });

    createBasemapLayer(map, 'satellite').addTo(map);
    mapInstanceRef.current = map;

    // GEE Detected Flood Polygon (Bright Blue Radar Signature)
    const sarPolygon = [
      [30.495, 79.720],
      [30.510, 79.745],
      [30.490, 79.760],
      [30.470, 79.740],
      [30.480, 79.715],
    ];

    L.polygon(sarPolygon, {
      color: '#0284C7',
      fillColor: '#0284C7',
      fillOpacity: 0.65,
      weight: 2.5,
    }).addTo(map);

    return () => {
      map.remove();
      mapInstanceRef.current = null;
    };
  }, []);

  const handleRunGEE = async () => {
    setIsProcessing(true);
    try {
      const res = await api.runSARAnalysis({
        sensor_type: sensor,
      });
      setSatelliteData(res);
    } catch (err) {
      console.warn('GEE fetch failed:', err);
    } finally {
      setIsProcessing(false);
    }
  };

  const downloadPayload = {
    run_id: simulationResult?.run_id || 'latest_gee_sar',
    scenario_name: 'GEE Sentinel-1 SAR Observed Footprint',
  };

  return (
    <div className="p-6 sm:p-8 max-w-7xl mx-auto space-y-6 text-hc-ink">
      {/* Header */}
      <PageHeader
        category="NEAR-REAL-TIME SURVEILLANCE &bull; GOOGLE EARTH ENGINE"
        title="GEE Monitoring (Sentinel-1 SAR &amp; Sentinel-2)"
        subtitle="Automated cloud-penetrating C-SAR flood extent detection, surface water threshold differencing, and model anomaly alarms."
        status="OPERATIONAL"
        statusLabel="GEE LIVE PIPELINE ACTIVE"
        actions={
          <button
            onClick={handleRunGEE}
            disabled={isProcessing}
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-gradient-to-r from-emerald-600 to-cyan-600 hover:from-emerald-500 hover:to-cyan-500 text-white font-bold text-xs transition shadow-md shadow-emerald-600/20 disabled:opacity-50"
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>{isProcessing ? 'Fetching SAR Tiles...' : 'Fetch Live GEE Pass'}</span>
          </button>
        }
      />

      {/* 3-Column Layout matching Image 2 bottom-right */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* 1. Left 3 cols: GEE Data & Controls */}
        <div className="lg:col-span-3 space-y-4">
          <div className="bg-hc-surface border border-hc-border rounded-2xl p-4 space-y-4 shadow-card-dark">
            {/* Tab switch: GEE Data vs Controls */}
            <div className="flex items-center space-x-1 bg-hc-card p-1 rounded-xl border border-hc-border">
              <button
                onClick={() => setActiveTab('data')}
                className={`flex-1 py-1.5 rounded-lg text-xs font-semibold transition ${
                  activeTab === 'data' ? 'bg-blue-600 text-white shadow-sm' : 'text-hc-textSecondary hover:text-hc-ink'
                }`}
              >
                GEE Data
              </button>
              <button
                onClick={() => setActiveTab('controls')}
                className={`flex-1 py-1.5 rounded-lg text-xs font-semibold transition ${
                  activeTab === 'controls' ? 'bg-blue-600 text-white shadow-sm' : 'text-hc-textSecondary hover:text-hc-ink'
                }`}
              >
                Controls
              </button>
            </div>

            {/* Sensor of Interest */}
            <div className="space-y-1.5">
              <label className="text-[11px] font-semibold text-hc-textSecondary block">
                Current Sensor of Interest:
              </label>
              <select
                value={sensor}
                onChange={(e) => setSensor(e.target.value)}
                className="w-full bg-white border border-slate-300 text-xs text-slate-900 rounded-xl px-3 py-2 focus:outline-none focus:border-blue-500 shadow-xs"
              >
                <option value="sentinel_1_sar">Sentinel-1 C-SAR (Cloud Penetrating)</option>
                <option value="sentinel_2_optical">Sentinel-2 MSI (10m Optical)</option>
              </select>
            </div>

            {/* Layer Checklist */}
            <div className="space-y-2 pt-2 border-t border-hc-border">
              <span className="text-[10px] font-mono font-bold text-hc-textSecondary uppercase block">
                Satellite Layer Overlays
              </span>

              <label className="flex items-center space-x-2.5 p-2 rounded-xl bg-hc-card hover:bg-slate-200/60 border border-hc-border cursor-pointer transition">
                <input
                  type="checkbox"
                  checked={layers.floodExtent}
                  onChange={() => toggleLayer('floodExtent')}
                  className="w-4 h-4 rounded bg-white border-slate-300 text-blue-600 focus:ring-0"
                />
                <span className="text-hc-ink text-xs">Near Real-Time Flood Extent</span>
              </label>

              <label className="flex items-center space-x-2.5 p-2 rounded-xl bg-hc-card hover:bg-slate-200/60 border border-hc-border cursor-pointer transition">
                <input
                  type="checkbox"
                  checked={layers.sic}
                  onChange={() => toggleLayer('sic')}
                  className="w-4 h-4 rounded bg-white border-slate-300 text-blue-600 focus:ring-0"
                />
                <span className="text-hc-ink text-xs">Surface Inundation Change (SIC)</span>
              </label>

              <label className="flex items-center space-x-2.5 p-2 rounded-xl bg-hc-card hover:bg-slate-200/60 border border-hc-border cursor-pointer transition">
                <input
                  type="checkbox"
                  checked={layers.dockDiary}
                  onChange={() => toggleLayer('dockDiary')}
                  className="w-4 h-4 rounded bg-white border-slate-300 text-blue-600 focus:ring-0"
                />
                <span className="text-hc-ink text-xs">Dock Diary / Pass History</span>
              </label>
            </div>
          </div>
        </div>

        {/* 2. Middle 5 cols: Satellite Map + Google Watermark */}
        <div className="lg:col-span-5 space-y-4">
          <div className="relative w-full h-[480px] rounded-2xl overflow-hidden border border-hc-border bg-slate-100 shadow-card-dark">
            <div ref={mapContainerRef} className="absolute inset-0 w-full h-full z-0" />

            {/* Inundation Extent Badge */}
            <div className="absolute top-4 left-4 z-10 bg-white/95 backdrop-blur-md border border-slate-200 p-3 rounded-xl shadow-lg space-y-1 font-mono text-[10px] text-slate-800">
              <div className="flex items-center space-x-2">
                <span className="w-2.5 h-2.5 rounded-full bg-blue-600 animate-pulse" />
                <span className="font-bold text-slate-900">Near Real-Time Flood Extent</span>
              </div>
              <p className="text-hc-textSecondary">Google Earth Engine &bull; Sentinel-1 C-SAR</p>
              <span className="text-blue-700 font-bold block pt-0.5">Observed: 14.8 ha detected water</span>
            </div>

            {/* Google Watermark in bottom-left */}
            <div className="absolute bottom-3 left-3 z-10 bg-white/90 backdrop-blur border border-slate-200 px-2 py-1 rounded text-[10px] font-mono text-slate-800 select-none shadow-sm">
              Google &copy; Earth Engine &bull; Copernicus Sentinel (2026)
            </div>
          </div>
        </div>

        {/* 3. Right 4 cols: Reporting & Export + Simulation Queue */}
        <div className="lg:col-span-4 space-y-5">
          {/* Reporting & Export Card */}
          <div className="bg-hc-surface border border-hc-border rounded-2xl p-5 space-y-3.5 shadow-card-dark">
            <div className="flex items-center justify-between pb-2 border-b border-hc-border">
              <h3 className="text-xs font-bold uppercase tracking-wider text-hc-ink">
                Reporting &amp; Export
              </h3>
              <span className="text-[10px] font-mono text-blue-700 font-bold">GIS READY</span>
            </div>

            <div className="space-y-2">
              <button
                onClick={() => api.downloadPDFReport(downloadPayload)}
                className="w-full py-2.5 px-4 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs transition shadow-sm flex items-center justify-center space-x-2"
              >
                <FileText className="w-3.5 h-3.5" />
                <span>Generate Summary Report (PDF)</span>
              </button>

              <button
                onClick={() => api.downloadShapefile(downloadPayload)}
                className="w-full py-2.5 px-4 rounded-xl bg-hc-card hover:bg-slate-200 border border-hc-border text-hc-ink font-semibold text-xs transition flex items-center justify-center space-x-2 shadow-xs"
              >
                <Download className="w-3.5 h-3.5 text-emerald-600" />
                <span>Export Inundation Layer (.shp)</span>
              </button>

              <button
                onClick={() => api.downloadKML(downloadPayload)}
                className="w-full py-2.5 px-4 rounded-xl bg-hc-card hover:bg-slate-200 border border-hc-border text-hc-ink font-semibold text-xs transition flex items-center justify-center space-x-2 shadow-xs"
              >
                <Download className="w-3.5 h-3.5 text-blue-600" />
                <span>Export Inundation Layer (.kml)</span>
              </button>
            </div>
          </div>

          {/* Embedded Simulation Queue */}
          <SimulationQueue
            onRunSimulation={onRunSimulation}
            isSimulating={isSimulating}
          />
        </div>
      </div>
    </div>
  );
}
