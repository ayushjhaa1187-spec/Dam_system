import React, { useState, useEffect, useRef } from 'react';
import L from 'leaflet';
import {
  ShieldAlert,
  Users,
  Navigation,
  CheckCircle2,
  AlertTriangle,
  Building2,
  Download,
  Flame,
  Home,
  Clock,
  ArrowRight,
  FileText,
  Globe,
  FileSpreadsheet,
} from 'lucide-react';
import PageHeader from '../components/common/PageHeader';
import MetricCard from '../components/common/MetricCard';
import { createBasemapLayer } from '../utils/mapTiles';
import { api } from '../services/api';

export default function HADRDashboard({
  selectedPreset,
  simulationResult,
  onNavigate,
}) {
  const mapContainerRef = useRef(null);
  const mapInstanceRef = useRef(null);

  const payload = {
    run_id: simulationResult?.run_id || 'hadr_latest_brief',
    scenario_name: selectedPreset?.name || 'Tehri Dam — Bhagirathi River',
  };

  useEffect(() => {
    if (!mapContainerRef.current) return;
    if (mapInstanceRef.current) return;

    const map = L.map(mapContainerRef.current, {
      center: [30.25, 78.45], // Tehri Dam — Bhagirathi River, Uttarakhand
      zoom: 8,
      zoomControl: false,
      attributionControl: false,
    });

    createBasemapLayer(map, 'bright').addTo(map);
    mapInstanceRef.current = map;

    // Tehri downstream flood corridor: Tehri → Koteshwar → Devprayag → Rishikesh → Haridwar
    const tehriCorridor = [
      [30.390, 78.510], [30.330, 78.440], [30.315, 78.380],
      [30.250, 78.500], [30.155, 78.610], [30.165, 78.700],
      [30.130, 78.510], [30.100, 78.290], [29.950, 78.175],
      [29.920, 78.130], [29.960, 78.120], [30.110, 78.255],
      [30.145, 78.490], [30.235, 78.470], [30.310, 78.360],
      [30.370, 78.465], [30.390, 78.510],
    ];

    L.polygon(tehriCorridor, {
      color: '#DC2626',
      fillColor: '#EA580C',
      fillOpacity: 0.45,
      weight: 2,
    }).addTo(map);

    // Bhagirathi river centerline
    L.polyline([
      [30.378,78.481],[30.312,78.367],[30.148,78.596],
      [30.087,78.268],[29.945,78.164],
    ], { color: '#00E5FF', weight: 3, opacity: 0.8 }).addTo(map);

    return () => {
      map.remove();
      mapInstanceRef.current = null;
    };
  }, []);


  return (
    <div className="p-6 sm:p-8 max-w-7xl mx-auto space-y-6 text-hc-ink">
      {/* Header */}
      <PageHeader
        category="HUMANITARIAN ASSISTANCE &amp; DISASTER RELIEF &bull; EXPERT VIEW"
        title="HADR Decision Brief &amp; Exposure Mapping"
        subtitle="National and basin-level population exposure choropleth, critical lifeline vulnerability, and instant multi-format dispatch downloads."
        status="WATCH"
        statusLabel="EVACUATION DIRECTIVES ACTIVE"
      />

      {/* Top 4 Operational Metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricCard
          title="Total Population Exposure"
          value="511,000"
          unit="PPL"
          subtitle="24h Downstream Corridor Reach"
          provenance="DERIVED"
          accentColor="red"
          icon={Users}
        />
        <MetricCard
          title="Immediate Red Zone"
          value="28,400"
          unit="PPL"
          subtitle="Lead Time < 30 Minutes"
          provenance="MODELLED"
          accentColor="amber"
          icon={Flame}
        />
        <MetricCard
          title="NDRF Rescue Response"
          value="8 Battalions"
          subtitle="120 Inflatable Zodiacs Deployed"
          provenance="REPORTED"
          accentColor="cyan"
          icon={ShieldAlert}
        />
        <MetricCard
          title="Designated Safe Shelters"
          value="45 Hubs"
          subtitle="High-Ground Ridge Lines (> 720m MSL)"
          provenance="OBSERVED"
          accentColor="emerald"
          icon={Home}
        />
      </div>

      {/* Main Grid: Choropleth Exposure Map + Population Exposure Stats */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left 8 cols: National / Basin Exposure Map */}
        <div className="lg:col-span-8 space-y-4">
          <div className="relative w-full h-[420px] rounded-2xl overflow-hidden border border-hc-border bg-slate-100 shadow-card-dark">
            <div ref={mapContainerRef} className="absolute inset-0 w-full h-full z-0" />

            <div className="absolute top-4 left-4 z-10 bg-white/95 backdrop-blur border border-slate-200 p-3 rounded-xl shadow-lg space-y-1 font-mono text-[10px] text-slate-800">
              <span className="font-bold text-slate-900 block text-[11px]">Population Exposure Intensity</span>
              <div className="flex items-center gap-1.5"><span className="w-3 h-3 bg-red-600 rounded" /> &gt; 100,000 People (Critical)</div>
              <div className="flex items-center gap-1.5"><span className="w-3 h-3 bg-amber-500 rounded" /> 25,000 – 100,000 (Severe)</div>
              <div className="flex items-center gap-1.5"><span className="w-3 h-3 bg-yellow-400 rounded" /> &lt; 25,000 (Moderate)</div>
            </div>
          </div>
        </div>

        {/* Right 4 cols: Population Exposure Curve & Summary */}
        <div className="lg:col-span-4 space-y-4">
          <div className="bg-hc-surface border border-hc-border rounded-2xl p-5 space-y-4 shadow-card-dark">
            <div className="flex items-center justify-between pb-2 border-b border-hc-border">
              <h3 className="text-xs font-bold uppercase tracking-wider text-hc-ink">
                Population Exposure Summary
              </h3>
              <span className="text-[10px] font-mono text-red-700 font-bold">511,000 EXPOSED</span>
            </div>

            <p className="text-xs text-hc-textSecondary leading-relaxed">
              Based on the 24-hour flood propagation wave from the breach axis to downstream confluences, an estimated <strong>511,000 residents</strong> and <strong>42,000 building units</strong> lie within the direct hazard boundary.
            </p>

            <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 space-y-2 font-mono text-xs shadow-inner">
              <div className="flex justify-between">
                <span className="text-hc-textSecondary">0–30 km Corridor:</span>
                <strong className="text-red-600">28,400 PPL</strong>
              </div>
              <div className="flex justify-between">
                <span className="text-hc-textSecondary">30–70 km Corridor:</span>
                <strong className="text-amber-800">198,600 PPL</strong>
              </div>
              <div className="flex justify-between">
                <span className="text-hc-textSecondary">70–100 km Plain:</span>
                <strong className="text-blue-700">284,000 PPL</strong>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 3 Prominent Color-Coded Download Buttons matching Image 1 Panel 6 */}
      <div className="bg-hc-surface border border-hc-border rounded-2xl p-6 space-y-3 shadow-card-dark">
        <span className="text-xs font-bold uppercase tracking-wider text-hc-textSecondary block">
          Download Field-Ready Decision Brief Package
        </span>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {/* 1. Download CSV (Blue) */}
          <button
            onClick={() => api.downloadCSVReport(payload)}
            className="py-3.5 px-5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs transition shadow-sm flex items-center justify-center space-x-2"
          >
            <FileSpreadsheet className="w-4 h-4" />
            <span>Download CSV Data</span>
          </button>

          {/* 2. Download KML (Cyan) */}
          <button
            onClick={() => api.downloadKML(payload)}
            className="py-3.5 px-5 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white font-bold text-xs transition shadow-sm flex items-center justify-center space-x-2"
          >
            <Globe className="w-4 h-4" />
            <span>Download KML File</span>
          </button>

          {/* 3. Download PDF (Red) */}
          <button
            onClick={() => api.downloadPDFReport(payload)}
            className="py-3.5 px-5 rounded-xl bg-red-600 hover:bg-red-500 text-white font-bold text-xs transition shadow-sm flex items-center justify-center space-x-2"
          >
            <FileText className="w-4 h-4" />
            <span>Download Official PDF Brief</span>
          </button>
        </div>
      </div>
    </div>
  );
}
