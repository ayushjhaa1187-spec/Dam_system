import React, { useState } from 'react';
import {
  Upload,
  FileSpreadsheet,
  Layers,
  Database,
  CheckCircle2,
  FileText,
  X,
  Play,
  Info,
} from 'lucide-react';
import ValidationBadge from './common/ValidationBadge';

const BENCHMARK_DATASETS = [
  {
    id: 'tehri_delft3d_nc',
    name: 'Tehri Dam Delft3D-FM Flexible Mesh Inundation Grid',
    fileName: 'tehri_delft3d_30m_depth.nc',
    format: 'NetCDF (.nc)',
    demSource: 'Copernicus GLO-30 DSM (30m)',
    demResolution: 30.0,
    hydrologySource: 'CWC Bhagirathi Gauge Records & PMF',
    modelName: 'Delft3D Flexible Mesh 2D SWE v1.2.105',
    scenarioId: 'tehri_dam_bhagirathi',
    validationStatus: 'validated',
    fileSize: '48.2 MB',
  },
  {
    id: 'rishi_ganga_sar_tif',
    name: 'Rishi Ganga 2021 Disaster Reconstruction GeoTIFF',
    fileName: 'chamoli_2021_hwm_depth_grid.tif',
    format: 'GeoTIFF (.tif)',
    demSource: 'ALOS World 3D (AW3D30)',
    demResolution: 30.0,
    hydrologySource: 'High-Water Marks & Post-Event Drone LiDAR',
    modelName: 'DualSPHysics 3D Lagrangian Reanalysis',
    scenarioId: 'rishi_ganga_2021',
    validationStatus: 'validated',
    fileSize: '18.4 MB',
  },
  {
    id: 'koteshwar_shapefile_zip',
    name: 'Koteshwar Downstream Flood Wave Polygon Vector',
    fileName: 'koteshwar_flood_contour_poly.zip',
    format: 'Shapefile (.shp in .zip)',
    demSource: 'CartoDEM v3R1 (10m)',
    demResolution: 10.0,
    hydrologySource: 'THDC India Limited Telemetry & Peak Qp',
    modelName: 'Delft3D FM Vectorized Contour Engine',
    scenarioId: 'tehri_dam_bhagirathi',
    validationStatus: 'calibrated',
    fileSize: '6.8 MB',
  },
];

export default function ImportResultModal({
  isOpen,
  onClose,
  onImportComplete,
  selectedPreset,
}) {
  const [selectedBenchmark, setSelectedBenchmark] = useState(BENCHMARK_DATASETS[0].id);
  const [isCustomUpload, setIsCustomUpload] = useState(false);
  const [formData, setFormData] = useState({
    fileName: 'user_uploaded_raster.tif',
    format: 'geotiff',
    modelName: 'Delft3D Flexible Mesh Pre-computed Run',
    demSource: 'Copernicus GLO-30 DSM',
    demResolution: 30.0,
    hydrologySource: 'Central Water Commission Gauge Observations',
    scenarioId: selectedPreset?.id || 'tehri_dam_bhagirathi',
    validationStatus: 'validated',
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isOpen) return null;

  const handleBenchmarkSelect = (b) => {
    setSelectedBenchmark(b.id);
    setIsCustomUpload(false);
    setFormData({
      fileName: b.fileName,
      format: b.format.toLowerCase().includes('tif') ? 'geotiff' : b.format.toLowerCase().includes('nc') ? 'netcdf' : 'shapefile',
      modelName: b.modelName,
      demSource: b.demSource,
      demResolution: b.demResolution,
      hydrologySource: b.hydrologySource,
      scenarioId: b.scenarioId,
      validationStatus: b.validationStatus,
    });
  };

  const handleCustomFileUpload = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      setIsCustomUpload(true);
      setSelectedBenchmark('');
      setFormData((prev) => ({
        ...prev,
        fileName: file.name,
        format: file.name.endsWith('.tif') || file.name.endsWith('.tiff') ? 'geotiff' : file.name.endsWith('.nc') ? 'netcdf' : file.name.endsWith('.kml') ? 'kml' : 'shapefile',
      }));
    }
  };

  const handleSubmit = async () => {
    setIsSubmitting(true);
    try {
      if (onImportComplete) {
        await onImportComplete({
          ...formData,
          simulation_engine: 'imported',
        });
      }
      onClose();
    } catch (err) {
      console.error('Import failed:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-in fade-in duration-200">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-3xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-800 flex items-center justify-between bg-slate-950/60">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400">
              <Upload className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-slate-100">
                Import Hydrodynamic Simulation Result (GeoTIFF / NetCDF / Shapefile)
              </h2>
              <p className="text-xs text-slate-400 mt-0.5">
                Ingest pre-computed hydraulic model outputs with scientific metadata &amp; spatial referencing.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-5">
          {/* File Selection / Upload Area */}
          <div className="space-y-3">
            <label className="text-xs font-bold text-slate-200 block">
              1. Select Pre-Computed Scientific Dataset or Upload External File
            </label>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {BENCHMARK_DATASETS.map((b) => {
                const isSelected = selectedBenchmark === b.id && !isCustomUpload;
                return (
                  <button
                    key={b.id}
                    onClick={() => handleBenchmarkSelect(b)}
                    className={`p-3 rounded-xl text-left border transition flex flex-col justify-between ${
                      isSelected
                        ? 'bg-cyan-950/50 border-cyan-500/80 shadow-md shadow-cyan-500/10'
                        : 'bg-slate-950/60 border-slate-800 hover:border-slate-700'
                    }`}
                  >
                    <div>
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] font-mono text-cyan-400 font-bold">{b.format}</span>
                        <span className="text-[10px] font-mono text-slate-500">{b.fileSize}</span>
                      </div>
                      <span className="text-xs font-bold text-slate-200 block mt-1 leading-snug line-clamp-2">
                        {b.name}
                      </span>
                    </div>
                    <div className="mt-3 flex items-center justify-between">
                      <ValidationBadge status={b.validationStatus} compact showIcon={false} />
                      <span className="text-[10px] font-mono text-slate-400">{b.demResolution}m</span>
                    </div>
                  </button>
                );
              })}
            </div>

            {/* Drag and drop upload box */}
            <div className={`mt-2 border-2 border-dashed rounded-xl p-4 text-center transition ${
              isCustomUpload ? 'border-cyan-500 bg-cyan-950/20' : 'border-slate-800 hover:border-slate-700 bg-slate-950/30'
            }`}>
              <input
                type="file"
                id="hydro-file-upload"
                accept=".tif,.tiff,.nc,.nc4,.zip,.shp,.kml,.json,.geojson"
                onChange={handleCustomFileUpload}
                className="hidden"
              />
              <label
                htmlFor="hydro-file-upload"
                className="cursor-pointer flex flex-col items-center justify-center gap-1.5"
              >
                <Upload className="w-5 h-5 text-cyan-400" />
                <span className="text-xs font-bold text-slate-200">
                  {isCustomUpload ? `Selected: ${formData.fileName}` : 'Or click to upload custom GeoTIFF / NetCDF / Shapefile (.zip)'}
                </span>
                <span className="text-[11px] text-slate-400">
                  Supports EPSG:4326 / UTM GeoTIFFs, Delft3D NetCDF maps, and zipped ESRI Shapefiles
                </span>
              </label>
            </div>
          </div>

          {/* Scientific Metadata Verification */}
          <div className="p-4 rounded-xl bg-slate-950/80 border border-slate-800 space-y-4">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-slate-200 flex items-center gap-2">
                <Database className="w-4 h-4 text-cyan-400" />
                <span>2. Dataset Provenance &amp; Discretization Metadata</span>
              </label>
              <ValidationBadge status={formData.validationStatus} />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
              <div>
                <label className="text-[11px] text-slate-400 block mb-1">Authoritative Model / Engine Name</label>
                <input
                  type="text"
                  value={formData.modelName}
                  onChange={(e) => setFormData({ ...formData, modelName: e.target.value })}
                  className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-slate-200 font-medium focus:outline-none focus:border-cyan-500"
                />
              </div>

              <div>
                <label className="text-[11px] text-slate-400 block mb-1">DEM Topography Source</label>
                <input
                  type="text"
                  value={formData.demSource}
                  onChange={(e) => setFormData({ ...formData, demSource: e.target.value })}
                  className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-slate-200 font-medium focus:outline-none focus:border-cyan-500"
                />
              </div>

              <div>
                <label className="text-[11px] text-slate-400 block mb-1">DEM Grid Resolution (meters)</label>
                <input
                  type="number"
                  step="1"
                  value={formData.demResolution}
                  onChange={(e) => setFormData({ ...formData, demResolution: parseFloat(e.target.value) || 30.0 })}
                  className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-slate-200 font-mono text-cyan-400 focus:outline-none focus:border-cyan-500"
                />
              </div>

              <div>
                <label className="text-[11px] text-slate-400 block mb-1">Hydrological Calibration Source</label>
                <input
                  type="text"
                  value={formData.hydrologySource}
                  onChange={(e) => setFormData({ ...formData, hydrologySource: e.target.value })}
                  className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-slate-200 font-medium focus:outline-none focus:border-cyan-500"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-slate-800 flex items-center justify-between bg-slate-950/80">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-slate-300 transition"
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={isSubmitting}
            className="px-5 py-2 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold text-xs flex items-center gap-2 transition disabled:opacity-50"
          >
            <Play className="w-3.5 h-3.5 fill-slate-950" />
            <span>{isSubmitting ? 'Ingesting Dataset...' : 'Ingest & Render Imported Simulation'}</span>
          </button>
        </div>
      </div>
    </div>
  );
}
