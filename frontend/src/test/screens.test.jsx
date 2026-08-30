import React from 'react';
import { render, screen } from '@testing-library/react';
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
    expect(screen.getByText(/2\. Dam Parameters/i)).toBeInTheDocument();
    expect(screen.getByText(/3\. Model Selection/i)).toBeInTheDocument();
    expect(screen.getByText(/4\. Breach Scenario/i)).toBeInTheDocument();
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
    expect(screen.getAllByText(/DEM \(Terrain\)/i).length).toBeGreaterThan(0);
    expect(screen.getAllByText(/River Network/i).length).toBeGreaterThan(0);
    expect(screen.getAllByText(/Land Use \/ Land Cover/i).length).toBeGreaterThan(0);
    expect(screen.getAllByText(/Reservoir \/ Dam Data/i).length).toBeGreaterThan(0);
    expect(screen.getAllByText(/Satellite Imagery/i).length).toBeGreaterThan(0);
  });

  it('Screen 5: Model Config renders SPH vs Delft3D settings and sliders', () => {
    render(
      <ModelConfigScreen
        selectedPreset={FALLBACK_PRESETS[0]}
        onRunSimulation={vi.fn()}
        onNavigate={vi.fn()}
        isSimulating={false}
      />
    );

    expect(screen.getByText(/Simulation Settings & Solver Setup/i)).toBeInTheDocument();
    expect(screen.getAllByText(/Delft3D/i).length).toBeGreaterThan(0);
    expect(screen.getAllByText(/Smooth Particle Hydrodynamics/i).length).toBeGreaterThan(0);
    expect(screen.getAllByText(/Model Selection/i).length).toBeGreaterThan(0);
    expect(screen.getAllByText(/Hydraulic Params/i).length).toBeGreaterThan(0);
  });

  it('Screen 6: Results Map renders map layer controls, hydrographs, and gauges', () => {
    render(
      <ResultsMapScreen
        simulationResult={null}
        selectedPreset={FALLBACK_PRESETS[0]}
        onRunSimulation={vi.fn()}
        isSimulating={false}
        onNavigate={vi.fn()}
      />
    );

    expect(screen.getByText(/Results & Inundation Map \(Detailed\)/i)).toBeInTheDocument();
    expect(screen.getByText(/Layer Control/i)).toBeInTheDocument();
    expect(screen.getAllByText(/Inundation Depth/i).length).toBeGreaterThan(0);
    expect(screen.getByText(/Flow Velocity/i)).toBeInTheDocument();
  });

  it('Screen 7: Scenario Comparison renders dual SPH vs Delft3D viewports and CSI score', () => {
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
    expect(screen.getByText(/Probability of Detection \(POD\)/i)).toBeInTheDocument();
  });

  it('Screen 8: Satellite Monitor renders GEE Sentinel-1 SAR controls', () => {
    render(<SatelliteMonitor onNavigate={vi.fn()} />);

    expect(screen.getByText(/GEE Monitoring \(Sentinel-1 SAR & Sentinel-2\)/i)).toBeInTheDocument();
    expect(screen.getByText(/Satellite Layer Overlays/i)).toBeInTheDocument();
    expect(screen.getByText(/Fetch Live GEE Pass/i)).toBeInTheDocument();
  });

  it("Screen 9: Alerts & Notifications renders active hazard list", () => {
    render(<AlertsScreen onNavigate={vi.fn()} />);

    expect(screen.getByText(/Alerts & Real-Time Hazard Notifications/i)).toBeInTheDocument();
    expect(screen.getByText(/High Risk Flood Zone.*Rishikesh/i)).toBeInTheDocument();
    expect(screen.getByText(/Tehri Reservoir Level Critical/i)).toBeInTheDocument();
  });

  it("Screen 10: HADR Decision Brief renders 3 download buttons", () => {
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

  it("Screen 11: Reports / Export Hub renders export options and checklist", () => {
    render(
      <ImpactExportScreen
        simulationResult={null}
        selectedPreset={FALLBACK_PRESETS[0]}
        onNavigate={vi.fn()}
      />
    );

    expect(screen.getByText(/Reports \/ Export Center/i)).toBeInTheDocument();
    expect(screen.getAllByText(/Dam Break Inundation Report/i).length).toBeGreaterThan(0);
    expect(screen.getByText(/Executive Publication Dossier/i)).toBeInTheDocument();
    expect(screen.getAllByText(/PDF Report/i).length).toBeGreaterThan(0);
    expect(screen.getByText(/Shapefile \(SHP\)/i)).toBeInTheDocument();
    expect(screen.getAllByText(/CSV Data/i).length).toBeGreaterThan(0);
  });
});
