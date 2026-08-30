import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';

import HomeScreen from '../pages/HomeScreen';
import Overview from '../pages/Overview';
import CreateScenarioScreen from '../pages/CreateScenarioScreen';
import DataStudioScreen from '../pages/DataStudioScreen';
import ModelConfigScreen from '../pages/ModelConfigScreen';
import ResultsMapScreen from '../pages/ResultsMapScreen';
import ScenarioComparison from '../pages/ScenarioComparison';
import SatelliteMonitor from '../pages/SatelliteMonitor';
import AlertsScreen from '../pages/AlertsScreen';
import HADRDashboard from '../pages/HADRDashboard';
import ImpactExportScreen from '../pages/ImpactExportScreen';
import { FALLBACK_PRESETS } from '../services/api';

describe('HydroShield Product Screens', () => {
  it('Screen 1: Landing Page / HomeScreen renders Predict. Prepare. Protect. and live stats strip', () => {
    render(
      <HomeScreen
        presets={FALLBACK_PRESETS}
        selectedPreset={FALLBACK_PRESETS[0]}
        onSelectPreset={vi.fn()}
        onRunSimulation={vi.fn()}
        onNavigate={vi.fn()}
        onOpenTutorial={vi.fn()}
        isSimulating={false}
      />
    );

    expect(screen.getByText(/Predict\. Prepare\./i)).toBeInTheDocument();
    expect(screen.getByText(/Simulations Run/i)).toBeInTheDocument();
    expect(screen.getByText(/River Basins Covered/i)).toBeInTheDocument();
    expect(screen.getByText(/Lives Protected/i)).toBeInTheDocument();
  });

  it('Screen 2: Mission Control Dashboard / Overview renders 5 KPI cards and Chenab Basin', () => {
    render(
      <Overview
        selectedPreset={FALLBACK_PRESETS[0]}
        simulationResult={null}
        onNavigate={vi.fn()}
        onRunSimulation={vi.fn()}
        isSimulating={false}
      />
    );

    expect(screen.getByText(/Chenab River Basin/i)).toBeInTheDocument();
    expect(screen.getByText(/Max Inundation Depth/i)).toBeInTheDocument();
    expect(screen.getByText(/Affected Area/i)).toBeInTheDocument();
    expect(screen.getByText(/Population At Risk/i)).toBeInTheDocument();
    expect(screen.getByText(/Estimated Damage/i)).toBeInTheDocument();
    expect(screen.getByText(/Peak Discharge/i)).toBeInTheDocument();
  });

  it('Screen 3: New Simulation Wizard renders multi-step setup', () => {
    render(
      <CreateScenarioScreen
        onRunSimulation={vi.fn()}
        onNavigate={vi.fn()}
        isSimulating={false}
      />
    );

    expect(screen.getByText(/New Dam Break Simulation Wizard/i)).toBeInTheDocument();
    expect(screen.getByText(/1\. Study Area Selection/i)).toBeInTheDocument();

    const continueBtn = screen.getByText(/^Continue$/i);
    fireEvent.click(continueBtn);

    expect(screen.getByText(/2\. Dam Structure & Reservoir Parameters/i)).toBeInTheDocument();
  });

  it('Screen 4: Data Studio renders 6 upload cards and 3D layer preview', () => {
    render(
      <DataStudioScreen
        onNavigate={vi.fn()}
        onRunSimulation={vi.fn()}
        isSimulating={false}
      />
    );

    expect(screen.getByText(/Data Input & Dataset Upload Hub/i)).toBeInTheDocument();
    expect(screen.getByText(/DEM \(Terrain\)/i)).toBeInTheDocument();
    expect(screen.getAllByText(/River Network/i).length).toBeGreaterThan(0);
    expect(screen.getByText(/3D Spatial Layer Stack Preview/i)).toBeInTheDocument();
  });

  it('Screen 5: Model Config & Simulation Settings renders SPH, Delft3D, and sliders', () => {
    render(
      <ModelConfigScreen
        selectedPreset={FALLBACK_PRESETS[0]}
        onRunSimulation={vi.fn()}
        onNavigate={vi.fn()}
        isSimulating={false}
      />
    );

    expect(screen.getByText(/Simulation Settings & Solver Setup/i)).toBeInTheDocument();
    expect(screen.getByText(/Delft3D \(Flexible Mesh\)/i)).toBeInTheDocument();
    expect(screen.getAllByText(/Smooth Particle Hydrodynamics \(SPH\)/i).length).toBeGreaterThan(0);
    expect(screen.getByText(/Comparison Mode – Run Both Models & Compare Results/i)).toBeInTheDocument();
  });

  it('Screen 6: Results & Inundation Map Detailed renders layer controls and tabs', () => {
    render(
      <ResultsMapScreen
        simulationResult={null}
        selectedPreset={FALLBACK_PRESETS[0]}
        onRunSimulation={vi.fn()}
        onNavigate={vi.fn()}
        isSimulating={false}
      />
    );

    expect(screen.getByText(/Results & Inundation Map \(Detailed\)/i)).toBeInTheDocument();
    expect(screen.getByText(/Layer Control/i)).toBeInTheDocument();
    expect(screen.getByText(/Export KML/i)).toBeInTheDocument();
    expect(screen.getByText(/Export Shapefile/i)).toBeInTheDocument();
  });

  it('Screen 7: Model Comparison & Analysis renders dual SPH vs Delft3D stats', () => {
    render(
      <ScenarioComparison
        simulationResult={null}
        selectedPreset={FALLBACK_PRESETS[0]}
        onRunSimulation={vi.fn()}
        isSimulating={false}
      />
    );

    expect(screen.getByText(/Model Comparison & Analysis \(SPH vs Delft3D\)/i)).toBeInTheDocument();
    expect(screen.getByText(/Critical Success Index \(CSI\)/i)).toBeInTheDocument();
    expect(screen.getByText(/Inter-Model Hydrodynamic Comparison Table/i)).toBeInTheDocument();
  });

  it('Screen 8: GEE Monitoring renders satellite SAR controls and queue', () => {
    render(
      <SatelliteMonitor
        selectedPreset={FALLBACK_PRESETS[0]}
        simulationResult={null}
        onNavigate={vi.fn()}
        onRunSimulation={vi.fn()}
        isSimulating={false}
      />
    );

    expect(screen.getByText(/GEE Monitoring \(Sentinel-1 SAR & Sentinel-2\)/i)).toBeInTheDocument();
    expect(screen.getAllByText(/Near Real-Time Flood Extent/i).length).toBeGreaterThan(0);
    expect(screen.getByText(/Asynchronous Simulation Queue/i)).toBeInTheDocument();
  });

  it('Screen 9: Alerts & Notifications renders active hazard list', () => {
    render(<AlertsScreen onNavigate={vi.fn()} />);

    expect(screen.getByText(/Alerts & Real-Time Hazard Notifications/i)).toBeInTheDocument();
    expect(screen.getByText(/High Risk Flood Zone — Ramban District/i)).toBeInTheDocument();
    expect(screen.getByText(/Dam Water Level High — Chenab Dam/i)).toBeInTheDocument();
  });

  it('Screen 10: HADR Decision Brief renders 3 download buttons', () => {
    render(
      <HADRDashboard
        selectedPreset={FALLBACK_PRESETS[0]}
        simulationResult={null}
        onNavigate={vi.fn()}
      />
    );

    expect(screen.getByText(/HADR Decision Brief & Exposure Mapping/i)).toBeInTheDocument();
    expect(screen.getByText(/Download CSV Data/i)).toBeInTheDocument();
    expect(screen.getByText(/Download KML File/i)).toBeInTheDocument();
    expect(screen.getByText(/Download Official PDF Brief/i)).toBeInTheDocument();
  });

  it('Screen 11: Reports / Export Hub renders 120-page preview and checklist', () => {
    render(
      <ImpactExportScreen
        simulationResult={null}
        selectedPreset={FALLBACK_PRESETS[0]}
        onNavigate={vi.fn()}
      />
    );

    expect(screen.getByText(/Reports \/ Export Center/i)).toBeInTheDocument();
    expect(screen.getAllByText(/Dam Break Inundation Report/i).length).toBeGreaterThan(0);
    expect(screen.getByText(/Executive Summary/i)).toBeInTheDocument();
    expect(screen.getByText(/PDF Report/i)).toBeInTheDocument();
  });
});
