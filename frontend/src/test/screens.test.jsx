import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';

import HomeScreen from '../pages/HomeScreen';
import CreateScenarioScreen from '../pages/CreateScenarioScreen';
import RunMonitorScreen from '../pages/RunMonitorScreen';
import ResultsMapScreen from '../pages/ResultsMapScreen';
import ImpactExportScreen from '../pages/ImpactExportScreen';
import TutorialModal from '../components/common/TutorialModal';
import KeyboardShortcutsModal from '../components/common/KeyboardShortcutsModal';
import MobileWarning from '../components/common/MobileWarning';
import { FALLBACK_PRESETS } from '../services/api';

describe('Screen 1: Home & Case Studies', () => {
  it('renders home screen title, case study cards, and telemetry status', () => {
    const onSelectPreset = vi.fn();
    const onRunSimulation = vi.fn();

    render(
      <HomeScreen
        presets={FALLBACK_PRESETS}
        selectedPreset={FALLBACK_PRESETS[0]}
        onSelectPreset={onSelectPreset}
        onRunSimulation={onRunSimulation}
        onNavigate={vi.fn()}
      />
    );

    expect(screen.getByText(/Home & Indian River Case Studies/i)).toBeInTheDocument();
    expect(screen.getByText(/Tehri Dam \(Bhagirathi River, Uttarakhand\)/i)).toBeInTheDocument();
    expect(screen.getByText(/DEMO DATA ACTIVE/i)).toBeInTheDocument();
    expect(screen.getByText(/PostGIS Spatial DB/i)).toBeInTheDocument();
    expect(screen.getByText(/Copernicus Sentinel-1 SAR/i)).toBeInTheDocument();
  });
});

describe('Screen 2: Create Scenario Wizard', () => {
  it('renders step 1 inputs and validates required fields', () => {
    render(
      <CreateScenarioScreen
        onRunSimulation={vi.fn()}
        onNavigate={vi.fn()}
        isSimulating={false}
      />
    );

    expect(screen.getByText(/1\. Dam Identity & Structural Context/i)).toBeInTheDocument();
    const titleInput = screen.getByPlaceholderText(/Tehri Dam PMF Outflow Scenario/i);
    expect(titleInput).toBeInTheDocument();

    // Advance to next step
    const continueBtn = screen.getByText(/^Continue$/i);
    fireEvent.click(continueBtn);

    // Should move to step 2
    expect(screen.getByText(/2\. Reservoir Storage & Hydraulic Head/i)).toBeInTheDocument();
  });
});

describe('Screen 3: Run Monitor', () => {
  it('renders progress bar, 5-stage phase tracker, and console logs', () => {
    const sampleResult = {
      run_id: 'sim_test_01',
      status: 'COMPLETED',
      scientific_metadata: {
        reproducibility_id: 'REP-COU-TEST',
        compute_duration_s: 2.5,
      },
    };

    render(
      <RunMonitorScreen
        simulationResult={sampleResult}
        selectedPreset={FALLBACK_PRESETS[0]}
        onRunSimulation={vi.fn()}
        onNavigate={vi.fn()}
        isSimulating={false}
      />
    );

    expect(screen.getByText(/Hydrodynamic Job Progress & Compute Telemetry/i)).toBeInTheDocument();
    expect(screen.getByText(/Execution Log Stream/i)).toBeInTheDocument();
    expect(screen.getByText(/REP-COU-TEST/i)).toBeInTheDocument();
  });
});

describe('Screen 4: Results Map', () => {
  it('renders metrics, colorblind palette selectors, and station cards', () => {
    render(
      <ResultsMapScreen
        simulationResult={null}
        selectedPreset={FALLBACK_PRESETS[0]}
        onRunSimulation={vi.fn()}
        onNavigate={vi.fn()}
        isSimulating={false}
      />
    );

    expect(screen.getByText(/Interactive Hydrodynamic Simulation Map/i)).toBeInTheDocument();
    expect(screen.getByText(/Cividis \(Colorblind-Safe\)/i)).toBeInTheDocument();
    expect(screen.getByText(/Viridis \(Perceptual\)/i)).toBeInTheDocument();
  });
});

describe('Screen 5: Impact & Export Center', () => {
  it('renders damage assessment metrics and download cards', () => {
    render(
      <ImpactExportScreen
        simulationResult={null}
        selectedPreset={FALLBACK_PRESETS[0]}
        onNavigate={vi.fn()}
      />
    );

    expect(screen.getByText(/HADR Damage Assessment & Standard GIS Downloads/i)).toBeInTheDocument();
    expect(screen.getByText(/ESRI Shapefile Package \(\.zip\)/i)).toBeInTheDocument();
    expect(screen.getByText(/Google Earth OGC KML \(\.kml\)/i)).toBeInTheDocument();
    expect(screen.getByText(/Web GIS GeoJSON \(\.geojson\)/i)).toBeInTheDocument();
    expect(screen.getByText(/Executive Decision-Maker PDF Report \(\.pdf\)/i)).toBeInTheDocument();
    expect(screen.getByText(/GeoTIFF Inundation Depth Raster \(\.tif\)/i)).toBeInTheDocument();
  });
});

describe('Global Modals & Utilities', () => {
  it('renders TutorialModal steps correctly', () => {
    const onClose = vi.fn();
    render(<TutorialModal isOpen={true} onClose={onClose} />);

    expect(screen.getByText(/Welcome to FLOODLAB \(HydroBreach\)/i)).toBeInTheDocument();
    const nextBtn = screen.getByText(/^Next$/i);
    fireEvent.click(nextBtn);
    expect(screen.getByText(/Screen 1: Home & Case Studies/i)).toBeInTheDocument();
  });

  it('renders KeyboardShortcutsModal with shortcut list', () => {
    render(<KeyboardShortcutsModal isOpen={true} onClose={vi.fn()} />);

    expect(screen.getByText(/Accessible Keyboard Shortcuts/i)).toBeInTheDocument();
    expect(screen.getByText(/Switch to Screen 1: Home & Case Studies/i)).toBeInTheDocument();
  });
});
