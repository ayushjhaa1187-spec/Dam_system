import React, { useState } from 'react';
import {
  Download,
  FileText,
  Globe,
  Layers,
  Archive,
  CheckCircle2,
  FileSpreadsheet,
  Printer,
  Sparkles,
  ShieldAlert,
} from 'lucide-react';
import PageHeader from '../components/common/PageHeader';
import { api } from '../services/api';

export default function ImpactExportScreen({
  simulationResult,
  selectedPreset,
  onNavigate,
}) {
  const payload = {
    run_id: simulationResult?.run_id || 'sim_latest',
    scenario_name: selectedPreset?.name || 'Chenab River Basin Simulation Report',
  };

  const [activeFormat, setActiveFormat] = useState('pdf');

  const reportContents = [
    { title: 'Executive Summary', desc: 'Disaster management briefing and critical event timeline' },
    { title: 'Model Configuration', desc: 'SPH Lagrangian and Delft3D Flexible Mesh numerical settings' },
    { title: 'Inundation Maps', desc: 'Full-reach 0–100 km color-graded flood depth and surge velocity footprints' },
    { title: 'Hydrographs', desc: 'Peak discharge (45,600 m³/s), stage height, and wave arrival curves' },
    { title: 'Impact Assessment', desc: 'Critical roads (NH-44), bridges, hospitals, and power substations' },
    { title: 'Population at Risk', desc: 'Settlement-by-settlement demographic exposure (25,340 people)' },
    { title: 'Loss & Damage Estimation', desc: '₹ 1,240 Cr estimated infrastructure and economic loss' },
  ];

  return (
    <div className="p-6 sm:p-8 max-w-6xl mx-auto space-y-6 text-hc-ink">
      {/* Header */}
      <PageHeader
        category="DISASTER REPORTING HUB &bull; SCREEN 6 OF HYDROSHIELD"
        title="Reports / Export Center"
        subtitle="Automated generation of publication-ready Dam Break Inundation Reports, GIS Shapefiles, Google Earth KMLs, and analytical CSV datasets."
        status="COMPLETED"
        statusLabel="REPORT COMPILED (120 PAGES)"
        actions={
          <button
            onClick={() => api.downloadPDFReport(payload)}
            className="flex items-center gap-1.5 px-5 py-2.5 rounded-xl bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-500 hover:to-cyan-500 text-white font-bold text-xs transition shadow-glow-blue"
          >
            <Printer className="w-4 h-4" />
            <span>Generate Summary Report (PDF)</span>
          </button>
        }
      />

      {/* Main Grid: Report Preview Card + Report Contents Checklist matching Panel 7 of Image 3 */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left 6 cols: Executive Report Preview Card */}
        <div className="lg:col-span-6 space-y-4">
          <div className="bg-hc-surface border border-hc-border rounded-2xl p-6 space-y-5 shadow-card-dark">
            <div className="flex items-center justify-between pb-3 border-b border-hc-border">
              <span className="text-xs font-bold uppercase tracking-wider text-hc-textSecondary">
                Executive Publication Dossier
              </span>
              <span className="text-[10px] font-mono text-blue-800 bg-blue-50 px-2.5 py-1 rounded-lg border border-blue-200 font-bold">
                OFFICIAL REPORT
              </span>
            </div>

            {/* Document Thumbnail / Cover representation */}
            <div className="relative w-full h-64 rounded-xl overflow-hidden border border-blue-300 bg-gradient-to-br from-blue-900 via-blue-800 to-indigo-900 flex flex-col justify-between p-6 shadow-md">
              <div className="flex justify-between items-start">
                <div className="space-y-1">
                  <span className="text-[10px] font-mono uppercase tracking-widest text-cyan-300 font-bold">
                    HYDROSHIELD TECHNICAL DOSSIER
                  </span>
                  <h3 className="text-lg font-extrabold text-white font-mono leading-tight">
                    Dam Break Inundation Report
                  </h3>
                  <p className="text-xs text-blue-100">
                    {selectedPreset?.name || 'Chenab River Basin Simulation Report'}
                  </p>
                </div>

                <div className="w-10 h-10 rounded-xl bg-red-600 text-white flex flex-col items-center justify-center font-bold text-[10px] shadow-md">
                  <span>PDF</span>
                  <span className="text-[8px] font-mono">120p</span>
                </div>
              </div>

              <div className="pt-4 border-t border-blue-700/60 flex items-center justify-between text-[11px] font-mono text-blue-200">
                <span>Generated: 29 Aug 2026</span>
                <span>Document: REP-CH-2026-v1</span>
              </div>
            </div>

            <div className="flex items-center justify-between pt-2">
              <span className="text-xs text-hc-textSecondary">
                Complete multi-scale hydraulic and HADR loss estimation package.
              </span>
              <button
                onClick={() => api.downloadPDFReport(payload)}
                className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs transition shadow-sm flex items-center space-x-1.5"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Download PDF</span>
              </button>
            </div>
          </div>
        </div>

        {/* Right 6 cols: Report Contents Checklist */}
        <div className="lg:col-span-6 space-y-4">
          <div className="bg-hc-surface border border-hc-border rounded-2xl p-6 space-y-4 shadow-card-dark">
            <div className="flex items-center justify-between pb-3 border-b border-hc-border">
              <h3 className="text-xs font-bold uppercase tracking-wider text-hc-ink">
                Report Contents &amp; Technical Chapters
              </h3>
              <span className="text-[10px] font-mono text-emerald-700 font-bold">
                ALL 7 SECTIONS VERIFIED
              </span>
            </div>

            <div className="space-y-2.5">
              {reportContents.map((item, idx) => (
                <div
                  key={idx}
                  className="p-3 bg-hc-card rounded-xl border border-hc-border flex items-start space-x-3 transition hover:border-slate-300"
                >
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                  <div className="space-y-0.5">
                    <h4 className="text-xs font-bold text-hc-ink">{item.title}</h4>
                    <p className="text-[11px] text-hc-textSecondary">{item.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* 4 Dedicated Export Format Buttons matching Panel 7 in Image 3 */}
      <div className="bg-hc-surface border border-hc-border rounded-2xl p-6 space-y-4 shadow-card-dark">
        <span className="text-xs font-bold uppercase tracking-wider text-hc-textSecondary block">
          Select Dedicated Geospatial &amp; Tabular Export Format
        </span>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* 1. PDF Report */}
          <button
            onClick={() => api.downloadPDFReport(payload)}
            className="p-4 bg-white hover:bg-slate-50 border border-slate-200 rounded-xl transition flex items-center space-x-3 group shadow-xs hover:shadow-sm"
          >
            <div className="w-10 h-10 rounded-xl bg-red-100 text-red-600 flex items-center justify-center border border-red-200 shrink-0 group-hover:scale-105 transition">
              <FileText className="w-5 h-5" />
            </div>
            <div className="text-left">
              <span className="text-xs font-bold text-hc-ink block group-hover:text-red-700 transition">PDF Report</span>
              <span className="text-[10px] text-hc-textSecondary">Executive Dossier (120p)</span>
            </div>
          </button>

          {/* 2. KML File */}
          <button
            onClick={() => api.downloadKML(payload)}
            className="p-4 bg-white hover:bg-slate-50 border border-slate-200 rounded-xl transition flex items-center space-x-3 group shadow-xs hover:shadow-sm"
          >
            <div className="w-10 h-10 rounded-xl bg-cyan-100 text-cyan-700 flex items-center justify-center border border-cyan-200 shrink-0 group-hover:scale-105 transition">
              <Globe className="w-5 h-5" />
            </div>
            <div className="text-left">
              <span className="text-xs font-bold text-hc-ink block group-hover:text-cyan-700 transition">KML File</span>
              <span className="text-[10px] text-hc-textSecondary">Google Earth 3D Polygons</span>
            </div>
          </button>

          {/* 3. Shapefile (SHP) */}
          <button
            onClick={() => api.downloadShapefile(payload)}
            className="p-4 bg-white hover:bg-slate-50 border border-slate-200 rounded-xl transition flex items-center space-x-3 group shadow-xs hover:shadow-sm"
          >
            <div className="w-10 h-10 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center border border-emerald-200 shrink-0 group-hover:scale-105 transition">
              <Layers className="w-5 h-5" />
            </div>
            <div className="text-left">
              <span className="text-xs font-bold text-hc-ink block group-hover:text-emerald-700 transition">Shapefile (SHP)</span>
              <span className="text-[10px] text-hc-textSecondary">ESRI GIS Vector Bundle</span>
            </div>
          </button>

          {/* 4. CSV Data */}
          <button
            onClick={() => api.downloadCSVReport(payload)}
            className="p-4 bg-white hover:bg-slate-50 border border-slate-200 rounded-xl transition flex items-center space-x-3 group shadow-xs hover:shadow-sm"
          >
            <div className="w-10 h-10 rounded-xl bg-blue-100 text-blue-700 flex items-center justify-center border border-blue-200 shrink-0 group-hover:scale-105 transition">
              <FileSpreadsheet className="w-5 h-5" />
            </div>
            <div className="text-left">
              <span className="text-xs font-bold text-hc-ink block group-hover:text-blue-700 transition">CSV Data</span>
              <span className="text-[10px] text-hc-textSecondary">Gauge Hydrographs &amp; Loss</span>
            </div>
          </button>
        </div>
      </div>
    </div>
  );
}
