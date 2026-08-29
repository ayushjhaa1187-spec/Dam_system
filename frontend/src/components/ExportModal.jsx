import React from 'react';
import { X, Download, FileText, Globe, Layers, Archive, FileCheck } from 'lucide-react';
import { api } from '../services/api';

export default function ExportModal({ isOpen, onClose, simulationResult, selectedPreset }) {
  if (!isOpen) return null;

  const params = simulationResult?.scenario_params || selectedPreset || {};
  const payload = {
    run_id: simulationResult?.run_id || 'sim_latest',
    scenario_name: params.name || 'HydroBreach_Simulation',
    lat: params.lat || 30.378,
    lon: params.lon || 78.481,
    reach_length_km: params.reach_length_km || 100.0,
  };

  const EXPORT_ITEMS = [
    {
      title: 'Complete Run Package (.zip)',
      desc: 'All parameters, outputs, rasters, vectors, PDF report & citations',
      icon: Archive,
      color: 'cyan',
      action: () => api.downloadRunPackage(payload),
    },
    {
      title: 'Decision-Maker PDF Report (.pdf)',
      desc: 'Executive summary with breach mechanics and NDRF logistics tables',
      icon: FileText,
      color: 'red',
      action: () => api.downloadPDFReport(payload),
    },
    {
      title: 'ESRI Shapefile Package (.zip)',
      desc: 'Inundation polygons (.shp, .shx, .dbf, .prj WGS84, .cpg UTF-8)',
      icon: Layers,
      color: 'blue',
      action: () => api.downloadShapefile(payload),
    },
    {
      title: 'Google Earth KML (.kml)',
      desc: '3D extruded hazard polygons with elevation tags and gauges',
      icon: Globe,
      color: 'emerald',
      action: () => api.downloadKML(payload),
    },
    {
      title: 'Web GIS GeoJSON (.geojson)',
      desc: 'Standard WGS 84 FeatureCollection with CRS & metadata',
      icon: FileCheck,
      color: 'purple',
      action: () => api.downloadGeoJSON(payload),
    },
    {
      title: 'GeoTIFF Inundation Depth (.tif)',
      desc: 'Float32 georeferenced flood depth raster in meters (EPSG:4326)',
      icon: Layers,
      color: 'cyan',
      action: () => api.downloadGeoTIFF(payload, 'depth'),
    },
    {
      title: 'GeoTIFF Surge Velocity (.tif)',
      desc: 'Float32 georeferenced flow velocity raster in m/s (EPSG:4326)',
      icon: Layers,
      color: 'amber',
      action: () => api.downloadGeoTIFF(payload, 'velocity'),
    },
    {
      title: 'HADR Exposure Summary (.csv)',
      desc: 'Tabulated population exposure, building damage & resource units',
      icon: FileText,
      color: 'slate',
      action: () => api.downloadCSVReport(payload),
    },
  ];

  return (
    <div className="fixed inset-0 z-50 bg-hc-bg/80 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-hc-surface border border-hc-border rounded-3xl w-full max-w-2xl overflow-hidden shadow-2xl space-y-4 p-6 animate-in fade-in zoom-in duration-200">
        <div className="flex items-center justify-between pb-3 border-b border-hc-border">
          <div className="flex items-center space-x-2">
            <Download className="w-5 h-5 text-hc-active" />
            <div>
              <h3 className="text-base font-bold text-hc-ink">
                Export Geospatial Layers &amp; HADR Reports
              </h3>
              <p className="text-[11px] text-hc-textSecondary">
                Scenario: <strong>{payload.scenario_name}</strong> &bull; Run: <span className="font-mono text-hc-active">{payload.run_id}</span>
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-hc-textSecondary hover:text-hc-ink hover:bg-hc-secondary"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-h-96 overflow-y-auto pr-1">
          {EXPORT_ITEMS.map((item, idx) => {
            const Icon = item.icon;
            return (
              <div
                key={idx}
                onClick={item.action}
                className="p-3 bg-hc-bg hover:bg-hc-secondary/80 border border-hc-border hover:border-cyan-500/40 rounded-xl cursor-pointer transition flex items-center justify-between group"
              >
                <div className="flex items-center space-x-3 overflow-hidden">
                  <div className="w-8 h-8 rounded-lg bg-hc-surface text-hc-active flex items-center justify-center border border-hc-border shrink-0">
                    <Icon className="w-4 h-4" />
                  </div>
                  <div className="truncate">
                    <h4 className="text-xs font-bold text-hc-ink group-hover:text-hc-active transition truncate">
                      {item.title}
                    </h4>
                    <p className="text-[10px] text-hc-textSecondary truncate">{item.desc}</p>
                  </div>
                </div>
                <Download className="w-4 h-4 text-hc-textSecondary group-hover:text-hc-active shrink-0 ml-2" />
              </div>
            );
          })}
        </div>

        <div className="pt-2 text-right border-t border-hc-border">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-hc-secondary hover:bg-hc-border text-hc-ink text-xs font-semibold"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
}
