import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Sidebar from './components/navigation/Sidebar';
import Topbar from './components/navigation/Topbar';
import MobileWarning from './components/common/MobileWarning';
import TutorialModal from './components/common/TutorialModal';
import KeyboardShortcutsModal from './components/common/KeyboardShortcutsModal';
import ElevationProfileModal from './components/ElevationProfileModal';
import ExportModal from './components/ExportModal';

// 5 Main Product Screens
import HomeScreen from './pages/HomeScreen';
import CreateScenarioScreen from './pages/CreateScenarioScreen';
import RunMonitorScreen from './pages/RunMonitorScreen';
import ResultsMapScreen from './pages/ResultsMapScreen';
import ImpactExportScreen from './pages/ImpactExportScreen';

import { api, FALLBACK_PRESETS } from './services/api';

const RECENT_RUNS_KEY = 'hydrobreach_recent_runs_v1';

export default function App() {
  const [activeTab, setActiveTab] = useState('home'); // 'home', 'create', 'monitor', 'results', 'impact'
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [presets, setPresets] = useState(FALLBACK_PRESETS);
  const [selectedPreset, setSelectedPreset] = useState(FALLBACK_PRESETS[0]);
  const [simulationResult, setSimulationResult] = useState(null);
  const [isSimulating, setIsSimulating] = useState(false);
  const [recentRuns, setRecentRuns] = useState([]);

  // Modals State
  const [isTutorialOpen, setIsTutorialOpen] = useState(false);
  const [isShortcutsOpen, setIsShortcutsOpen] = useState(false);
  const [isDemModalOpen, setIsDemModalOpen] = useState(false);
  const [isExportModalOpen, setIsExportModalOpen] = useState(false);

  // 1. Load initial presets and recent runs on mount
  useEffect(() => {
    api.getPresets()
      .then((data) => {
        const list = Array.isArray(data) ? data : data.scenarios || [];
        if (list.length > 0) {
          setPresets(list);
          setSelectedPreset(list[0]);
          handleRunSimulation({
            scenario_id: list[0].id,
            preset_id: list[0].id,
            solver_type: 'coupled',
          }, false); // don't switch screen on initial mount
        }
      })
      .catch((err) => console.error('Failed to load presets:', err));

    try {
      const savedRuns = localStorage.getItem(RECENT_RUNS_KEY);
      if (savedRuns) {
        setRecentRuns(JSON.parse(savedRuns));
      }
    } catch (e) {
      console.warn('Could not read recent runs:', e);
    }
  }, []);

  // 2. Global Keyboard Navigation Listener
  useEffect(() => {
    const handleKeyDown = (e) => {
      // Don't trigger shortcuts if user is typing in an input/textarea/select
      if (['INPUT', 'TEXTAREA', 'SELECT'].includes(e.target.tagName)) return;

      if (e.altKey && e.key === '1') {
        e.preventDefault();
        setActiveTab('home');
      } else if (e.altKey && e.key === '2') {
        e.preventDefault();
        setActiveTab('create');
      } else if (e.altKey && e.key === '3') {
        e.preventDefault();
        setActiveTab('monitor');
      } else if (e.altKey && e.key === '4') {
        e.preventDefault();
        setActiveTab('results');
      } else if (e.altKey && e.key === '5') {
        e.preventDefault();
        setActiveTab('impact');
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

  const handleSelectPreset = (presetId) => {
    const found = presets.find((p) => p.id === presetId);
    if (found) {
      setSelectedPreset(found);
    }
  };

  const handleRunSimulation = async (payload = {}, navigateToMonitor = true) => {
    setIsSimulating(true);
    if (navigateToMonitor) {
      setActiveTab('monitor');
    }
    try {
      const scenarioId =
        payload.scenario_id || payload.preset_id || selectedPreset?.id || 'tehri_dam_bhagirathi';
      const runPayload = {
        ...payload,
        scenario_id: scenarioId,
        preset_id: scenarioId,
        solver_type: payload.solver_type || 'coupled',
      };
      const res = await api.runSimulation(runPayload);
      setSimulationResult(res);

      // Save to recent runs
      const newRunItem = {
        run_id: res.run_id,
        scenario_id: scenarioId,
        scenario_name: res.scenario_params?.name || selectedPreset?.name || scenarioId,
        peak_discharge_m3s: res.breach_mechanics?.peak_discharge_m3s || 84200,
        timestamp: new Date().toLocaleString(),
        status: res.status || 'COMPLETED',
      };
      setRecentRuns((prev) => {
        const updated = [newRunItem, ...prev.filter((r) => r.run_id !== res.run_id)].slice(0, 10);
        try {
          localStorage.setItem(RECENT_RUNS_KEY, JSON.stringify(updated));
        } catch (e) {
          console.warn('Could not save recent run:', e);
        }
        return updated;
      });
    } catch (err) {
      console.error('Simulation execution failed:', err);
    } finally {
      setIsSimulating(false);
    }
  };

  const handleDeleteRecentRun = (runId) => {
    setRecentRuns((prev) => {
      const updated = prev.filter((r) => r.run_id !== runId);
      try {
        localStorage.setItem(RECENT_RUNS_KEY, JSON.stringify(updated));
      } catch (e) {
        console.warn('Could not update recent runs:', e);
      }
      return updated;
    });
  };

  const handleLoadRecentRun = (run) => {
    const foundPreset = presets.find((p) => p.id === run.scenario_id);
    if (foundPreset) {
      setSelectedPreset(foundPreset);
    }
    setActiveTab('results');
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-row font-sans selection:bg-cyan-500 selection:text-slate-950 antialiased">
      {/* 1. Left Fixed Navigation Sidebar */}
      <Sidebar
        activeTab={activeTab}
        onSelectTab={setActiveTab}
        isCollapsed={isSidebarCollapsed}
        onToggleCollapse={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
        onOpenDem={() => setIsDemModalOpen(true)}
        onOpenTutorial={() => setIsTutorialOpen(true)}
        onOpenShortcuts={() => setIsShortcutsOpen(true)}
      />

      {/* 2. Main Application Body */}
      <div className="flex-1 flex flex-col min-w-0 h-screen overflow-y-auto">
        {/* Mobile Warning Banner */}
        <MobileWarning />

        {/* Global Topbar */}
        <Topbar
          selectedPreset={selectedPreset}
          presets={presets}
          onSelectPreset={handleSelectPreset}
          simulationResult={simulationResult}
          isSimulating={isSimulating}
          onRunSimulation={() =>
            handleRunSimulation({
              scenario_id: selectedPreset?.id,
              preset_id: selectedPreset?.id,
              solver_type: 'coupled',
            }, true)
          }
          onOpenTutorial={() => setIsTutorialOpen(true)}
          onOpenShortcuts={() => setIsShortcutsOpen(true)}
          onOpenExport={() => setIsExportModalOpen(true)}
        />

        {/* Screen Content Container */}
        <main className="flex-1 pb-8">
          <AnimatePresence mode="wait">
            <motion.div
              key={activeTab}
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -6 }}
              transition={{ duration: 0.18, ease: 'easeOut' }}
            >
              {/* Screen 1: Home / Case Studies */}
              {activeTab === 'home' && (
                <HomeScreen
                  presets={presets}
                  selectedPreset={selectedPreset}
                  onSelectPreset={handleSelectPreset}
                  onRunSimulation={handleRunSimulation}
                  onNavigate={setActiveTab}
                  onOpenTutorial={() => setIsTutorialOpen(true)}
                  recentRuns={recentRuns}
                  onDeleteRecentRun={handleDeleteRecentRun}
                  onLoadRecentRun={handleLoadRecentRun}
                  isSimulating={isSimulating}
                />
              )}

              {/* Screen 2: Create Scenario Wizard */}
              {activeTab === 'create' && (
                <CreateScenarioScreen
                  onRunSimulation={handleRunSimulation}
                  onNavigate={setActiveTab}
                  isSimulating={isSimulating}
                />
              )}

              {/* Screen 3: Run Monitor */}
              {activeTab === 'monitor' && (
                <RunMonitorScreen
                  simulationResult={simulationResult}
                  selectedPreset={selectedPreset}
                  onRunSimulation={handleRunSimulation}
                  onNavigate={setActiveTab}
                  isSimulating={isSimulating}
                />
              )}

              {/* Screen 4: Results Map */}
              {activeTab === 'results' && (
                <ResultsMapScreen
                  simulationResult={simulationResult}
                  selectedPreset={selectedPreset}
                  onRunSimulation={() =>
                    handleRunSimulation({
                      scenario_id: selectedPreset?.id,
                      preset_id: selectedPreset?.id,
                      solver_type: 'coupled',
                    }, false)
                  }
                  isSimulating={isSimulating}
                  onNavigate={setActiveTab}
                />
              )}

              {/* Screen 5: Impact & Export */}
              {activeTab === 'impact' && (
                <ImpactExportScreen
                  simulationResult={simulationResult}
                  selectedPreset={selectedPreset}
                  onNavigate={setActiveTab}
                />
              )}
            </motion.div>
          </AnimatePresence>
        </main>

        {/* Persistent Prototype Disclaimer Footer */}
        <footer className="mt-auto border-t border-slate-900 bg-slate-950/80 px-6 py-3 text-center text-[11px] text-slate-500 font-sans">
          <span>
            <strong>Official Notice:</strong> Decision-support prototype; not a replacement for official flood-warning or emergency-management systems. Refer exclusively to NDMA, CWC &amp; SEOC directives.
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
