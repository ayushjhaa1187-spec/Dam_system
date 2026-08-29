import React, { useState, useEffect } from 'react';
import { X, Mountain, Layers, Activity } from 'lucide-react';
import { api } from '../services/api';

export default function ElevationProfileModal({ isOpen, onClose, selectedPreset }) {
  const [demData, setDemData] = useState(null);
  const [selectedSectionIdx, setSelectedSectionIdx] = useState(0);

  useEffect(() => {
    if (isOpen) {
      const reachKm = selectedPreset?.reach_length_km || 25.0;
      api.getDemProfile(reachKm, 2400.0, 1200.0)
        .then((res) => setDemData(res))
        .catch((err) => console.error('Failed to load DEM:', err));
    }
  }, [isOpen, selectedPreset]);

  if (!isOpen) return null;

  const thalweg = demData?.thalweg_profile;
  const sections = demData?.cross_sections || [];
  const currentSection = sections[selectedSectionIdx] || sections[0];

  // Render Thalweg SVG
  const renderThalwegSVG = () => {
    if (!thalweg?.distance_km?.length) return null;
    const xArr = thalweg.distance_km;
    const zArr = thalweg.elevation_m;
    const minZ = Math.min(...zArr);
    const maxZ = Math.max(...zArr);
    const maxX = Math.max(...xArr);

    const w = 550;
    const h = 140;
    const p = 30;

    const points = xArr.map((x, i) => {
      const px = p + (x / maxX) * (w - 2 * p);
      const py = h - p - ((zArr[i] - minZ) / (maxZ - minZ || 1)) * (h - 2 * p);
      return `${px},${py}`;
    }).join(' ');

    return (
      <div className="bg-hc-bg p-3 rounded-lg border border-hc-border">
        <div className="flex justify-between text-xs text-hc-textSecondary mb-1">
          <span>Upstream: <strong>{maxZ} m</strong></span>
          <span>Thalweg Elevation Profile (Longitudinal River Slope)</span>
          <span>Downstream: <strong>{minZ} m</strong></span>
        </div>
        <svg viewBox={`0 0 ${w} ${h}`} className="w-full h-32">
          <polyline fill="none" stroke="#38bdf8" strokeWidth="2.5" points={points} />
        </svg>
      </div>
    );
  };

  // Render Cross Section SVG
  const renderCrossSectionSVG = () => {
    if (!currentSection?.elevation_m?.length) return null;
    const yArr = currentSection.y_coordinates_m;
    const zArr = currentSection.elevation_m;
    const minZ = Math.min(...zArr);
    const maxZ = Math.max(...zArr);
    const minY = Math.min(...yArr);
    const maxY = Math.max(...yArr);

    const w = 550;
    const h = 140;
    const p = 30;

    const points = yArr.map((y, i) => {
      const px = p + ((y - minY) / (maxY - minY || 1)) * (w - 2 * p);
      const py = h - p - ((zArr[i] - minZ) / (maxZ - minZ || 1)) * (h - 2 * p);
      return `${px},${py}`;
    }).join(' ');

    return (
      <div className="bg-hc-bg p-3 rounded-lg border border-hc-border">
        <div className="flex justify-between text-xs text-hc-textSecondary mb-1">
          <span>Left Valley Bank</span>
          <span>Valley Cross-Section at <strong>Chainage {currentSection.chainage_km} km</strong></span>
          <span>Right Valley Bank</span>
        </div>
        <svg viewBox={`0 0 ${w} ${h}`} className="w-full h-32">
          {/* Valley Cross Profile */}
          <polyline fill="none" stroke="#22d3ee" strokeWidth="2" points={points} />
        </svg>
      </div>
    );
  };

  return (
    <div className="fixed inset-0 z-50 bg-hc-bg/80 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-hc-surface border border-hc-border rounded-2xl w-full max-w-2xl overflow-hidden shadow-2xl space-y-4 p-6">
        <div className="flex items-center justify-between pb-3 border-b border-hc-border">
          <div className="flex items-center space-x-2">
            <Mountain className="w-5 h-5 text-hc-active" />
            <h3 className="text-base font-bold text-hc-ink">
              River Bathymetry & Topographic DEM Profiles
            </h3>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-hc-textSecondary hover:text-hc-ink hover:bg-hc-secondary"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Longitudinal Thalweg Slope */}
        {renderThalwegSVG()}

        {/* Cross Sections */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-hc-textSecondary">Select River Cross-Section Station</span>
            <div className="flex items-center space-x-1">
              {sections.map((sec, idx) => (
                <button
                  key={idx}
                  onClick={() => setSelectedSectionIdx(idx)}
                  className={`px-2 py-1 rounded text-xs font-medium transition ${
                    selectedSectionIdx === idx ? 'bg-hc-active text-hc-ink font-bold' : 'bg-hc-secondary text-hc-textSecondary'
                  }`}
                >
                  {sec.chainage_km} km
                </button>
              ))}
            </div>
          </div>

          {renderCrossSectionSVG()}
        </div>

        <div className="pt-2 text-right">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-hc-secondary hover:bg-hc-border text-hc-ink text-xs font-semibold"
          >
            Close Profile Viewer
          </button>
        </div>
      </div>
    </div>
  );
}
