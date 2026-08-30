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
    scenario_name: selectedPreset?.name || 'Chenab River Basin',
  };

  useEffect(() => {
    if (!mapContainerRef.current) return;
    if (mapInstanceRef.current) return;

    const map = L.map(mapContainerRef.current, {
      center: [23.5937, 78.9629], // India Center
      zoom: 5,
      zoomControl: false,
      attributionControl: false,
    });

    createBasemapLayer(map, 'dark').addTo(map);
    mapInstanceRef.current = map;

    // Major River Basin Exposure Polygons (Indus, Ganga, Brahmaputra)
    const northCorridor = [
      [34.5, 74.0], [33.0, 76.5], [30.5, 78.5], [28.5, 79.5],
      [27.0, 84.0], [25.5, 87.5], [23.5, 88.5], [26.0, 85.0],
      [29.0, 77.0], [32.5, 74.5],
    ];

    L.polygon(northCorridor, {
      color: '#EF4444',
      fillColor: '#F97316',
      fillOpacity: 0.55,
      weight: 2,
    }).addTo(map);

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
          <div className="relative w-full h-[420px] rounded-2xl overflow-hidden border border-hc-border bg-hc-canvas shadow-card-dark">
            <div ref={mapContainerRef} className="absolute inset-0 w-full h-full z-0" />

            <div className="absolute top-4 left-4 z-10 bg-hc-surface/90 backdrop-blur border border-hc-border p-3 rounded-xl shadow-lg space-y-1 font-mono text-[10px]">
              <span className="font-bold text-hc-ink block text-[11px]">Population Exposure Intensity</span>
              <div className="flex items-center gap-1.5"><span className="w-3 h-3 bg-red-600 rounded" /> &gt; 100,000 People (Critical)</div>
              <div className="flex items-center gap-1.5"><span className="w-3 h-3 bg-amber-500 rounded" /> 25,000 – 100,000 (Severe)</div>
              <div className="flex items-center gap-1.5"><span className="w-3 h-3 bg-yellow-400 rounded" /> &lt; 25,000 (Moderate)</div>
            </div>
          </div>
        </div>

        {/* Right 4 cols: Population Exposure Curve & Summary */}
        <div className="lg:col-span-4 space-y-4">
          <div className="bg-hc-surface/90 border border-hc-border rounded-2xl p-5 space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-hc-border">
              <h3 className="text-xs font-bold uppercase tracking-wider text-hc-ink">
                Population Exposure Summary
              </h3>
              <span className="text-[10px] font-mono text-red-400 font-bold">511,000 EXPOSED</span>
            </div>

            <p className="text-xs text-hc-textSecondary leading-relaxed">
              Based on the 24-hour flood propagation wave from the breach axis to downstream confluences, an estimated <strong>511,000 residents</strong> and <strong>42,000 building units</strong> lie within the direct hazard boundary.
            </p>

            <div className="p-3 bg-hc-canvas rounded-xl border border-hc-border space-y-2 font-mono text-xs">
              <div className="flex justify-between">
                <span className="text-hc-textSecondary">0–30 km Corridor:</span>
                <strong className="text-red-400">28,400 PPL</strong>
              </div>
              <div className="flex justify-between">
                <span className="text-hc-textSecondary">30–70 km Corridor:</span>
                <strong className="text-amber-400">198,600 PPL</strong>
              </div>
              <div className="flex justify-between">
                <span className="text-hc-textSecondary">70–100 km Plain:</span>
                <strong className="text-cyan-400">284,000 PPL</strong>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 3 Prominent Color-Coded Download Buttons matching Image 1 Panel 6 */}
      <div className="bg-hc-surface/90 border border-hc-border rounded-2xl p-6 space-y-3">
        <span className="text-xs font-bold uppercase tracking-wider text-hc-textSecondary block">
          Download Field-Ready Decision Brief Package
        </span>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {/* 1. Download CSV (Teal/Blue) */}
          <button
            onClick={() => api.downloadCSVReport(payload)}
            className="py-3.5 px-5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs transition shadow-md flex items-center justify-center space-x-2"
          >
            <FileSpreadsheet className="w-4 h-4" />
            <span>Download CSV Data</span>
          </button>

          {/* 2. Download KML (Cyan) */}
          <button
            onClick={() => api.downloadKML(payload)}
            className="py-3.5 px-5 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white font-bold text-xs transition shadow-md flex items-center justify-center space-x-2"
          >
            <Globe className="w-4 h-4" />
            <span>Download KML File</span>
          </button>

          {/* 3. Download PDF (Red) */}
          <button
            onClick={() => api.downloadPDFReport(payload)}
            className="py-3.5 px-5 rounded-xl bg-red-600 hover:bg-red-500 text-white font-bold text-xs transition shadow-md flex items-center justify-center space-x-2"
          >
            <FileText className="w-4 h-4" />
            <span>Download Official PDF Brief</span>
          </button>
        </div>
      </div>
    </div>
  );
}
