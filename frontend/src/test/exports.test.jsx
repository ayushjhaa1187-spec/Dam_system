import React from 'react';
import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import ExportModal from '../components/ExportModal';
import { FALLBACK_PRESETS } from '../services/api';

describe('ExportModal Component', () => {
  it('renders all 8 export formats in modal', () => {
    render(
      <ExportModal
        isOpen={true}
        onClose={vi.fn()}
        simulationResult={{ run_id: 'sim_export_test' }}
        selectedPreset={FALLBACK_PRESETS[0]}
      />
    );

    expect(screen.getByText(/Export Geospatial Layers & HADR Reports/i)).toBeInTheDocument();
    expect(screen.getByText(/Complete Run Package \(\.zip\)/i)).toBeInTheDocument();
    expect(screen.getByText(/Decision-Maker PDF Report \(\.pdf\)/i)).toBeInTheDocument();
    expect(screen.getByText(/ESRI Shapefile Package \(\.zip\)/i)).toBeInTheDocument();
    expect(screen.getByText(/Google Earth KML \(\.kml\)/i)).toBeInTheDocument();
    expect(screen.getByText(/Web GIS GeoJSON \(\.geojson\)/i)).toBeInTheDocument();
    expect(screen.getByText(/GeoTIFF Inundation Depth \(\.tif\)/i)).toBeInTheDocument();
    expect(screen.getByText(/GeoTIFF Surge Velocity \(\.tif\)/i)).toBeInTheDocument();
    expect(screen.getByText(/HADR Exposure Summary \(\.csv\)/i)).toBeInTheDocument();
  });
});
