import React, { useState } from 'react';
import { HelpCircle, Info } from 'lucide-react';

export const TECHNICAL_GLOSSARY = {
  manning_n: {
    term: "Manning's Roughness Coefficient (n)",
    definition: "An empirical coefficient representing boundary roughness and hydraulic resistance in riverbeds. Values range from 0.025 for smooth gravel to 0.060+ for steep, boulder-strewn Himalayan mountain gorges.",
  },
  breach_time: {
    term: "Breach Formation Time (tf)",
    definition: "The total elapsed duration from initial piping/overtopping breach erosion until complete trapezoidal breach geometry development. Calculated via empirical regressions (e.g. Froehlich 2008, MacDonald & Langridge-Monopolis).",
  },
  hydraulic_head: {
    term: "Hydraulic Head (Hw)",
    definition: "The vertical depth of water stored behind the dam measured from the reservoir water surface to the breach invert elevation (meters). Drives potential energy and peak discharge.",
  },
  return_period: {
    term: "Design Return Period",
    definition: "The statistical recurrence interval (e.g., 1-in-100 year, 1-in-1000 year, or Probable Maximum Flood PMF) representing inflow flood severity entering the reservoir.",
  },
  dem: {
    term: "Digital Elevation Model (DEM)",
    definition: "A georeferenced raster representation of terrain topography. HydroBreach uses 30m Copernicus GLO-30 DSM / SRTM-1 to route 2D shallow water equation waves across valley topography.",
  },
  inundation_depth: {
    term: "Inundation Depth (h)",
    definition: "The maximum simulated flood water depth above natural ground surface (meters) at any downstream cross-section or 2D grid cell.",
  },
  hazard_rating: {
    term: "DEFRA / UK Hazard Rating (HR)",
    definition: "Hydrodynamic hazard index calculated as HR = depth * (velocity + 0.5) + debris_factor. HR > 2.0 indicates extreme danger with complete structural threat.",
  },
  csi: {
    term: "Critical Success Index (CSI)",
    definition: "Spatial overlap metric between model simulation and satellite observation: CSI = Hits / (Hits + False Alarms + Misses). CSI >= 0.70 signifies robust hydrodynamic benchmark validation.",
  },
  sar_backscatter: {
    term: "SAR Radar Backscatter Drop (dB)",
    definition: "Active microwave signal reflection measured by Sentinel-1. Smooth standing water acts like a specular mirror, scattering radar pulses away and causing a sharp backscatter drop (< -15 dB).",
  },
};

export default function Tooltip({ glossaryKey, customTitle, customText, children }) {
  const [isOpen, setIsOpen] = useState(false);
  const info = glossaryKey ? TECHNICAL_GLOSSARY[glossaryKey] : null;
  const title = customTitle || info?.term || 'Technical Parameter';
  const text = customText || info?.definition || '';

  return (
    <div className="relative inline-flex items-center">
      <span
        onMouseEnter={() => setIsOpen(true)}
        onMouseLeave={() => setIsOpen(false)}
        onClick={() => setIsOpen(!isOpen)}
        className="cursor-help inline-flex items-center text-hc-textSecondary hover:text-hc-active transition ml-1"
        aria-label={`Definition: ${title}`}
      >
        {children || <HelpCircle className="w-3.5 h-3.5" />}
      </span>

      {isOpen && (
        <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-64 p-3 bg-hc-surface border border-cyan-500/40 rounded-xl shadow-2xl z-50 pointer-events-none text-left backdrop-blur-md">
          <div className="flex items-center space-x-1.5 mb-1 text-hc-active font-bold text-xs">
            <Info className="w-3 h-3 shrink-0" />
            <span>{title}</span>
          </div>
          <p className="text-[11px] text-hc-textSecondary leading-relaxed font-sans">{text}</p>
          <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-2 h-2 bg-hc-surface border-r border-b border-cyan-500/40 rotate-45" />
        </div>
      )}
    </div>
  );
}
