import React, { useState } from 'react';
import {
  Upload,
  CheckCircle2,
  FileCode,
  Satellite,
  Mountain,
  Waves,
  Trees,
  CloudRain,
  Database,
  ArrowRight,
  Sparkles,
  AlertTriangle,
  Layers,
  FolderUp,
} from 'lucide-react';
import PageHeader from '../components/common/PageHeader';
import LayerStack3D from '../components/data/LayerStack3D';

export default function DataStudioScreen({
  onNavigate,
  onRunSimulation,
  isSimulating,
}) {
  const [datasets, setDatasets] = useState([
    {
      id: 'dem',
      title: 'DEM (Terrain)',
      format: 'GeoTIFF (.tif)',
      status: 'uploaded',
      source: 'Copernicus GLO-30 DSM (30m)',
      icon: Mountain,
      color: '#D97706',
      size: '42.5 MB',
    },
    {
      id: 'river',
      title: 'River Network',
      format: 'Shapefile (.shp / .zip)',
      status: 'uploaded',
      source: 'OpenStreetMap / WRIS Vector Reach',
      icon: Waves,
      color: '#0284C7',
      size: '18.2 MB',
    },
    {
      id: 'lulc',
      title: 'Land Use / Land Cover',
      format: 'Raster (.tif)',
      status: 'uploaded',
      source: 'ESA WorldCover 10m',
      icon: Trees,
      color: '#059669',
      size: '31.0 MB',
    },
    {
      id: 'dam',
      title: 'Reservoir / Dam Data',
      format: 'CSV (.csv)',
      status: 'uploaded',
      source: 'CWC Dam Database Capacity Curves',
      icon: Database,
      color: '#7C3AED',
      size: '2.4 MB',
    },
    {
      id: 'rainfall',
      title: 'Rainfall Data',
      format: 'NetCDF (.nc)',
      status: 'pending',
      source: 'IMD Gridded Daily PMP Rainfall',
      icon: CloudRain,
      color: '#0284C7',
      size: '—',
    },
    {
      id: 'satellite',
      title: 'Satellite Imagery',
      format: 'Sentinel-2 / Sentinel-1 SAR',
      status: 'uploaded',
      source: 'Google Earth Engine (GEE) Live Feed',
      icon: Satellite,
      color: '#DB2777',
      size: 'Live Feed',
    },
  ]);

  const [uploadToast, setUploadToast] = useState(null);

  const handleSimulateUpload = (id) => {
    setDatasets((prev) =>
      prev.map((d) => (d.id === id ? { ...d, status: 'uploaded', size: '15.8 MB' } : d))
    );
    setUploadToast(`Dataset verified and projected into EPSG:4326.`);
    setTimeout(() => setUploadToast(null), 3000);
  };

  return (
    <div className="p-6 sm:p-8 max-w-7xl mx-auto space-y-6 text-hc-ink">
      {/* Header */}
      <PageHeader
        category="GEOSPATIAL DATA STUDIO &bull; HYDROSHIELD DATA PIPELINE"
        title="Data Input &amp; Dataset Upload Hub"
        subtitle="Ingest high-resolution terrain DEMs, river centerline shapefiles, reservoir capacity tables, and live GEE satellite feeds with automatic CRS reprojection."
        status="OPERATIONAL"
        statusLabel="CRS: EPSG:4326 VALIDATED"
        actions={
          <div className="flex items-center space-x-2">
            <button
              onClick={() => onNavigate && onNavigate('satellite')}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-emerald-50 border border-emerald-200 hover:bg-emerald-100 text-emerald-800 font-semibold text-xs transition shadow-sm"
            >
              <Satellite className="w-3.5 h-3.5" />
              <span>GEE Satellite Sync</span>
            </button>
            <button
              onClick={() => onNavigate && onNavigate('modeling')}
              className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-500 hover:to-cyan-500 text-white font-bold text-xs transition shadow-glow-blue"
            >
              <span>Continue to Model Setup</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        }
      />

      {/* 5-Step Workflow Tracker */}
      <div className="bg-hc-surface border border-hc-border rounded-2xl p-4 shadow-card-dark">
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
          {[
            { step: 1, label: '1. Project Info', done: true },
            { step: 2, label: '2. Upload Datasets', active: true },
            { step: 3, label: '3. Model Setup', pending: true },
            { step: 4, label: '4. Boundary Conditions', pending: true },
            { step: 5, label: '5. Run Simulation', pending: true },
          ].map((s) => (
            <div
              key={s.step}
              className={`p-2.5 rounded-xl border text-center font-mono text-xs transition ${
                s.active
                  ? 'bg-blue-50 border-blue-500 text-blue-800 font-bold ring-1 ring-blue-500/30'
                  : s.done
                  ? 'bg-emerald-50 border-emerald-200 text-emerald-800 font-semibold'
                  : 'bg-slate-50 border-slate-200 text-slate-500'
              }`}
            >
              <span className="block font-bold">{s.label}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Toast */}
      {uploadToast && (
        <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-xs text-emerald-800 flex items-center gap-2 shadow-sm">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>{uploadToast}</span>
        </div>
      )}

      {/* Main 60/40 Grid: Upload Cards + 3D Isometric Layer Preview */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left 7 cols: 6 Dataset Upload Cards */}
        <div className="lg:col-span-7 space-y-4">
          <div className="bg-hc-surface border border-hc-border rounded-2xl p-5 space-y-4 shadow-card-dark">
            <div className="flex items-center justify-between pb-3 border-b border-hc-border">
              <div>
                <h3 className="text-xs font-bold uppercase tracking-wider text-hc-ink">
                  Upload Required Simulation Datasets
                </h3>
                <p className="text-[11px] text-hc-textSecondary mt-0.5">
                  Supported formats: GeoTIFF (.tif), ESRI Shapefile (.shp), NetCDF (.nc), CSV (.csv), KML (.kml)
                </p>
              </div>
              <span className="text-[10px] font-mono text-emerald-800 bg-emerald-50 px-2.5 py-0.5 rounded border border-emerald-200 font-bold">
                5 / 6 READY
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
              {datasets.map((d) => {
                const Icon = d.icon;
                const isUploaded = d.status === 'uploaded';

                return (
                  <div
                    key={d.id}
                    className="p-4 bg-hc-card rounded-xl border border-hc-border hover:border-slate-300 transition flex flex-col justify-between space-y-3"
                  >
                    <div>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-2.5">
                          <div
                            className="w-8 h-8 rounded-lg flex items-center justify-center border"
                            style={{
                              backgroundColor: `${d.color}15`,
                              borderColor: `${d.color}40`,
                              color: d.color,
                            }}
                          >
                            <Icon className="w-4 h-4" />
                          </div>
                          <div>
                            <h4 className="text-xs font-bold text-hc-ink">{d.title}</h4>
                            <span className="text-[10px] font-mono text-hc-textSecondary block">
                              {d.format}
                            </span>
                          </div>
                        </div>

                        {isUploaded ? (
                          <span className="inline-flex items-center gap-1 text-[10px] font-mono font-bold text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                            <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                            Uploaded
                          </span>
                        ) : (
                          <span className="text-[10px] font-mono font-bold text-amber-800 bg-amber-50 px-2 py-0.5 rounded-full border border-amber-200">
                            Pending
                          </span>
                        )}
                      </div>

                      <p className="text-[11px] text-hc-textSecondary mt-2.5 leading-tight">
                        Source: {d.source}
                      </p>
                    </div>

                    <div className="pt-2 border-t border-hc-border/80 flex items-center justify-between text-xs">
                      <span className="text-[10px] font-mono text-hc-textMuted font-medium">{d.size}</span>
                      <button
                        onClick={() => handleSimulateUpload(d.id)}
                        className={`px-3 py-1 rounded-lg text-xs font-semibold flex items-center space-x-1.5 transition ${
                          isUploaded
                            ? 'bg-white hover:bg-slate-100 text-slate-700 border border-slate-200 shadow-xs'
                            : 'bg-blue-600 hover:bg-blue-500 text-white font-bold shadow-sm'
                        }`}
                      >
                        <Upload className="w-3 h-3" />
                        <span>{isUploaded ? 'Replace' : 'Upload File'}</span>
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Right 5 cols: 3D Isometric Layer Preview */}
        <div className="lg:col-span-5">
          <LayerStack3D />
        </div>
      </div>
    </div>
  );
}
