import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Sidebar from './components/navigation/Sidebar';
import Topbar from './components/navigation/Topbar';
import MobileWarning from './components/common/MobileWarning';
import TutorialModal from './components/common/TutorialModal';
import KeyboardShortcutsModal from './components/common/KeyboardShortcutsModal';
import ElevationProfileModal from './components/ElevationProfileModal';
import ExportModal from './components/ExportModal';

// Product Screens matching the 3 UI Mockups
import Overview from './pages/Overview'; // Panel 1: Mission Control Dashboard
import HomeScreen from './pages/HomeScreen'; // Panel 2: Landing Page
import CreateScenarioScreen from './pages/CreateScenarioScreen'; // Wizard: Simulation Setup
import DataStudioScreen from './pages/DataStudioScreen'; // Panel 3: Data Input / Upload Panel
import ModelConfigScreen from './pages/ModelConfigScreen'; // Panel 4: Simulation Settings
import ResultsMapScreen from './pages/ResultsMapScreen'; // Panel 5: Results Explorer
import ScenarioComparison from './pages/ScenarioComparison'; // Comparison: SPH vs Delft3D
import SatelliteMonitor from './pages/SatelliteMonitor'; // GEE Monitoring
import AlertsScreen from './pages/AlertsScreen'; // Panel 6: Alerts & Notifications
import HADRDashboard from './pages/HADRDashboard'; // HADR Decision Brief
import ImpactExportScreen from './pages/ImpactExportScreen'; // Panel 7: Reports & Export Hub

import { api, FALLBACK_PRESETS } from './services/api';

const RECENT_RUNS_KEY = 'hydroshield_recent_runs_v2';

export default function App() {
  // Hybrid Navigation State
  const [activeTopTab, setActiveTopTab] = useState('dashboard'); // 'dashboard', 'modeling', 'data', 'scenarios', 'analytics', 'reports'
  const [activeSidebarItem, setActiveSidebarItem] = useState('overview');
  const [activeSubView, setActiveSubView] = useState(null); // 'landing', 'alerts', 'hadr', 'satellite', etc.

  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [presets, setPresets] = useState(FALLBACK_PRESETS);
  const [selectedPreset, setSelectedPreset] = useState(FALLBACK_PRESETS[0]);
  const [simulationResult, setSimulationResult] = useState(null);
  const [isSimulating, setIsSimulating] = useState(false);
  const [recentRuns, setRecentRuns] = useState([]);

  // Modals
  const [isTutorialOpen, setIsTutorialOpen] = useState(false);
  const [isShortcutsOpen, setIsShortcutsOpen] = useState(false);
  const [isDemModalOpen, setIsDemModalOpen] = useState(false);
  const [isExportModalOpen, setIsExportModalOpen] = useState(false);

  // 1. Load presets on mount
  useEffect(() => {
    api.getPresets()
      .then((data) => {
        const list = Array.isArray(data) ? data : data.scenarios || [];
        if (list.length > 0) {
          setPresets(list);
          setSelectedPreset(list[0]);
        }
      })
      .catch((err) => console.error('Failed to load presets:', err));

    try {
      const savedRuns = localStorage.getItem(RECENT_RUNS_KEY);
      if (savedRuns) setRecentRuns(JSON.parse(savedRuns));
    } catch (e) {
      console.warn('Could not read recent runs:', e);
    }
  }, []);

  // 2. Keyboard Navigation Listener (Alt+1..6, ?, Esc)
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (['INPUT', 'TEXTAREA', 'SELECT'].includes(e.target.tagName)) return;

      if (e.altKey && e.key === '1') {
        e.preventDefault();
        handleSelectTopTab('dashboard');
      } else if (e.altKey && e.key === '2') {
        e.preventDefault();
        handleSelectTopTab('modeling');
      } else if (e.altKey && e.key === '3') {
        e.preventDefault();
        handleSelectTopTab('data');
      } else if (e.altKey && e.key === '4') {
        e.preventDefault();
        handleSelectTopTab('scenarios');
      } else if (e.altKey && e.key === '5') {
        e.preventDefault();
        handleSelectTopTab('analytics');
      } else if (e.altKey && e.key === '6') {
        e.preventDefault();
        handleSelectTopTab('reports');
      } else if (e.key === '?') {
        e.preventDefault();
        setIsShortcutsOpen(true);
      } else if (e.key === 'Escape') {
        setIsTutorialOpen(false);
        setIsShortcutsOpen(false);
        setIsDemModalOpen(false);
        setIsExportModalOpen(false);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Unified Top Tab Selector
  const handleSelectTopTab = (tabId) => {
    setActiveTopTab(tabId);
    setActiveSubView(null);

    // Sync corresponding sidebar item
    if (tabId === 'dashboard') setActiveSidebarItem('overview');
    else if (tabId === 'modeling') setActiveSidebarItem('dams');
    else if (tabId === 'data') setActiveSidebarItem('data_sources');
    else if (tabId === 'scenarios') setActiveSidebarItem('simulations');
    else if (tabId === 'analytics') setActiveSidebarItem('hazard_maps');
    else if (tabId === 'reports') setActiveSidebarItem('overview');
  };

  // Unified Sidebar Selector
  const handleSelectSidebarItem = (itemId) => {
    setActiveSidebarItem(itemId);

    if (itemId === 'overview') {
      setActiveTopTab('dashboard');
      setActiveSubView(null);
    } else if (itemId === 'rivers') {
      setActiveTopTab('dashboard');
      setActiveSubView('landing');
    } else if (itemId === 'dams') {
      setActiveTopTab('modeling');
      setActiveSubView('wizard');
    } else if (itemId === 'simulations') {
      setActiveTopTab('scenarios');
      setActiveSubView(null);
    } else if (itemId === 'hazard_maps') {
      setActiveTopTab('analytics');
      setActiveSubView(null);
    } else if (itemId === 'alerts') {
      setActiveSubView('alerts');
    } else if (itemId === 'data_sources') {
      setActiveTopTab('data');
      setActiveSubView(null);
    } else if (itemId === 'settings') {
      setActiveTopTab('modeling');
      setActiveSubView('settings');
    }
  };

  const handleSelectPreset = (presetId) => {
    const found = presets.find((p) => p.id === presetId);
    if (found) setSelectedPreset(found);
  };

  const handleRunSimulation = async (payload = {}) => {
    setIsSimulating(true);
    try {
      const scenarioId = payload.scenario_id || selectedPreset?.id || 'chenab_dam_axis';
      const runPayload = {
        ...payload,
        scenario_id: scenarioId,
        preset_id: scenarioId,
        solver_type: payload.solver_type || 'coupled',
      };
      const res = await api.runSimulation(runPayload);
      setSimulationResult(res);

      const newRun = {
        run_id: res.run_id,
        scenario_id: scenarioId,
        scenario_name: res.scenario_params?.name || selectedPreset?.name || scenarioId,
        peak_discharge_m3s: res.breach_mechanics?.peak_discharge_m3s || 45600,
        timestamp: new Date().toLocaleTimeString(),
        status: 'COMPLETED',
      };
      setRecentRuns((prev) => [newRun, ...prev.filter((r) => r.run_id !== res.run_id)].slice(0, 10));
    } catch (err) {
      console.error('Simulation execution failed:', err);
    } finally {
      setIsSimulating(false);
    }
  };

  return (
    <div className="min-h-screen bg-hc-bg text-hc-ink flex flex-row font-sans selection:bg-hc-active selection:text-black antialiased">
      {/* 1. Left Fixed Sidebar */}
      <Sidebar
        activeSidebarItem={activeSidebarItem}
        onSelectSidebarItem={handleSelectSidebarItem}
        isCollapsed={isSidebarCollapsed}
        onToggleCollapse={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
        onOpenTutorial={() => setIsTutorialOpen(true)}
        onOpenShortcuts={() => setIsShortcutsOpen(true)}
      />

      {/* 2. Main Content Body */}
      <div className="flex-1 flex flex-col min-w-0 h-screen overflow-y-auto">
        <MobileWarning />

        {/* Global Topbar with Top Tabs, Case/Model Badges, Run CTA, and Profile */}
        <Topbar
          activeTopTab={activeTopTab}
          onSelectTopTab={handleSelectTopTab}
          selectedPreset={selectedPreset}
          presets={presets}
          onSelectPreset={handleSelectPreset}
          simulationResult={simulationResult}
          isSimulating={isSimulating}
          onRunSimulation={() => handleRunSimulation()}
          onOpenTutorial={() => setIsTutorialOpen(true)}
          onOpenShortcuts={() => setIsShortcutsOpen(true)}
          onOpenAlerts={() => setActiveSubView('alerts')}
          alertCount={3}
        />

        {/* Screen Content Viewport */}
        <main className="flex-1 pb-8">
          <AnimatePresence mode="wait">
            <motion.div
              key={`${activeTopTab}-${activeSubView}`}
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -6 }}
              transition={{ duration: 0.18, ease: 'easeOut' }}
            >
              {/* Subview Override: Alerts Screen */}
              {activeSubView === 'alerts' && (
                <AlertsScreen onNavigate={handleSelectTopTab} />
              )}

              {/* Subview Override: Landing Page */}
              {activeSubView === 'landing' && (
                <HomeScreen
                  presets={presets}
                  selectedPreset={selectedPreset}
                  onSelectPreset={handleSelectPreset}
                  onRunSimulation={handleRunSimulation}
                  onNavigate={handleSelectTopTab}
                  onOpenTutorial={() => setIsTutorialOpen(true)}
                  isSimulating={isSimulating}
                />
              )}

              {/* Top Tab 1: Dashboard (Mission Control) */}
              {!activeSubView && activeTopTab === 'dashboard' && (
                <Overview
                  selectedPreset={selectedPreset}
                  simulationResult={simulationResult}
                  onNavigate={handleSelectTopTab}
                  onRunSimulation={handleRunSimulation}
                  isSimulating={isSimulating}
                />
              )}

              {/* Top Tab 2: Modeling (Simulation Wizard / Settings) */}
              {!activeSubView && activeTopTab === 'modeling' && (
                <ModelConfigScreen
                  selectedPreset={selectedPreset}
                  onRunSimulation={handleRunSimulation}
                  onNavigate={handleSelectTopTab}
                  isSimulating={isSimulating}
                />
              )}

              {/* Top Tab 3: Data (Data Studio & 3D Layer Stack) */}
              {!activeSubView && activeTopTab === 'data' && (
                <DataStudioScreen
                  onNavigate={handleSelectTopTab}
                  onRunSimulation={handleRunSimulation}
                  isSimulating={isSimulating}
                />
              )}

              {/* Top Tab 4: Scenarios (Dual SPH vs Delft3D Model Comparison & Queue) */}
              {!activeSubView && activeTopTab === 'scenarios' && (
                <ScenarioComparison
                  simulationResult={simulationResult}
                  selectedPreset={selectedPreset}
                  onRunSimulation={handleRunSimulation}
                  isSimulating={isSimulating}
                />
              )}

              {/* Top Tab 5: Analytics (Detailed Results & Inundation Map) */}
              {!activeSubView && activeTopTab === 'analytics' && (
                <ResultsMapScreen
                  simulationResult={simulationResult}
                  selectedPreset={selectedPreset}
                  onRunSimulation={handleRunSimulation}
                  isSimulating={isSimulating}
                  onNavigate={handleSelectTopTab}
                />
              )}

              {/* Top Tab 6: Reports (HADR Decision Brief & 120-Page Report Hub) */}
              {!activeSubView && activeTopTab === 'reports' && (
                <ImpactExportScreen
                  simulationResult={simulationResult}
                  selectedPreset={selectedPreset}
                  onNavigate={handleSelectTopTab}
                />
              )}
            </motion.div>
          </AnimatePresence>
        </main>

        {/* Official Footer Disclaimer */}
        <footer className="mt-auto border-t border-hc-border bg-hc-canvas px-6 py-3 text-center text-[11px] text-hc-textSecondary font-mono">
          <span>
            <strong>Official Notice:</strong> HydroShield Dam Break &amp; Flood Inundation Modelling Platform. Decision-support prototype. Refer to NDMA &amp; CWC directives.
          </span>
        </footer>
      </div>

      {/* Global Modals */}
      <TutorialModal
        isOpen={isTutorialOpen}
        onClose={() => setIsTutorialOpen(false)}
      />

      <KeyboardShortcutsModal
        isOpen={isShortcutsOpen}
        onClose={() => setIsShortcutsOpen(false)}
      />

      <ElevationProfileModal
        isOpen={isDemModalOpen}
        onClose={() => setIsDemModalOpen(false)}
        selectedPreset={selectedPreset}
      />

      <ExportModal
        isOpen={isExportModalOpen}
        onClose={() => setIsExportModalOpen(false)}
        simulationResult={simulationResult}
        selectedPreset={selectedPreset}
      />
    </div>
  );
}
