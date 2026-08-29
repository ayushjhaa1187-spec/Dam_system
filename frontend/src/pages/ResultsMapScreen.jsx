import React, { useState, useEffect } from 'react';
import {
  Map,
  Play,
  Pause,
  RotateCcw,
  Layers,
  Clock,
  Compass,
  Maximize2,
  TrendingUp,
  Activity,
  Waves,
  Eye,
  Sliders,
  ShieldAlert,
  ChevronRight,
  Info,
  MapPin,
  Sparkles,
} from 'lucide-react';
import PageHeader from '../components/common/PageHeader';
import MetricCard from '../components/common/MetricCard';
import GeospatialSimulationMap, {
  CORRIDOR_STATIONS,
  RIVER_CORRIDOR_COORDS,
} from '../components/map/GeospatialSimulationMap';
import HydrographChart from '../components/charts/HydrographChart';
import DownstreamHazardChart from '../components/charts/DownstreamHazardChart';
import ArrivalTimelineChart from '../components/charts/ArrivalTimelineChart';
import ElevationProfileModal from '../components/ElevationProfileModal';
import { formatFinite } from '../utils/units';
import { formatMinutes } from '../utils/formatters';

const COLORBLIND_PALETTES = [
  { id: 'cividis', name: 'Cividis (Colorblind-Safe)', gradient: 'from-blue-900 via-yellow-600 to-yellow-200' },
  { id: 'viridis', name: 'Viridis (Perceptual)', gradient: 'from-purple-900 via-emerald-600 to-yellow-300' },
  { id: 'magma', name: 'Magma (High Contrast)', gradient: 'from-slate-950 via-red-800 to-orange-300' },
  { id: 'plasma', name: 'Plasma (Vibrant)', gradient: 'from-indigo-900 via-pink-600 to-yellow-400' },
];

export default function ResultsMapScreen({
  simulationResult,
  selectedPreset,
  onRunSimulation,
  isSimulating,
  onNavigate,
}) {
  const [currentTimeMin, setCurrentTimeMin] = useState(30);
  const [isPlaying, setIsPlaying] = useState(false);
  const [playbackSpeed, setPlaybackSpeed] = useState(1);
  const [isFullScreen, setIsFullScreen] = useState(false);
  const [selectedPalette, setSelectedPalette] = useState('cividis');
  const [isDemModalOpen, setIsDemModalOpen] = useState(false);
  const [inspectedLocation, setInspectedLocation] = useState(null);

  // Animation Loop (0 to 180 minutes)
  useEffect(() => {
    let interval = null;
    if (isPlaying) {
      interval = setInterval(() => {
        setCurrentTimeMin((prev) => {
          if (prev >= 180) {
            setIsPlaying(false);
            return 180;
          }
          return prev + 1;
        });
      }, 100 / playbackSpeed);
    }
    return () => clearInterval(interval);
  }, [isPlaying, playbackSpeed]);

  const breach = simulationResult?.breach_mechanics || {};
  const peakFlow = breach.peak_discharge_m3s || 84200.0;
  const hydroTimes = breach.hydrograph_times || [0, 0.5, 1.0, 1.5, 2.0, 2.5, 3.0, 4.0, 5.0, 6.0];
  const hydroFlows = breach.hydrograph_flows || [0, 12000, 48000, 84200, 62000, 38000, 21000, 8500, 2400, 500];
  const currentTimeHrs = currentTimeMin / 60.0;

  return (
    <div className="p-6 sm:p-8 max-w-7xl mx-auto space-y-6 text-slate-100">
      {/* Header */}
      <PageHeader
        category="GEOSPATIAL RESULTS MAP &bull; SCREEN 4 OF 5"
        title="Interactive Hydrodynamic Simulation Map"
        subtitle="Multi-scale flood wave propagation with colorblind-safe palettes, location click inspector, elevation profile, and synchronized time slider."
        status={isSimulating ? 'RUNNING' : 'COMPLETED'}
        statusLabel={isSimulating ? 'SOLVER COMPUTING...' : 'LAYER MESH READY'}
        actions={
          <div className="flex items-center space-x-2">
            <button
              onClick={() => setIsDemModalOpen(true)}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-slate-900 border border-slate-800 hover:bg-slate-800 text-xs font-semibold text-slate-200 transition"
              title="View Riverbed Elevation Profile & Cross-Sections"
            >
              <Layers className="w-3.5 h-3.5 text-purple-400" />
              <span>Elevation Profile</span>
            </button>
            <button
              onClick={() => setIsFullScreen(!isFullScreen)}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-slate-900 border border-slate-800 hover:bg-slate-800 text-xs font-semibold text-slate-200 transition"
              title="Toggle Fullscreen Map Mode"
            >
              <Maximize2 className="w-3.5 h-3.5 text-cyan-400" />
              <span>{isFullScreen ? 'Exit Fullscreen' : 'Fullscreen'}</span>
            </button>
            <button
              onClick={() => onNavigate('impact')}
              className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold text-xs transition shadow-md shadow-cyan-500/20"
            >
              <span>Impact &amp; Export</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>
        }
      />

      {/* Top 4 Operational Metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricCard
          title="Peak Outflow (Qp)"
          value={formatFinite(peakFlow, 0)}
          unit="m³/s"
          subtitle="Hydrodynamic Breach Wave Peak"
          provenance="MODELLED"
          accentColor="cyan"
          icon={TrendingUp}
        />
        <MetricCard
          title="Near-Field Velocity (SPH)"
          value="22.4"
          unit="m/s"
          subtitle="Lagrangian Transect (0–2 km)"
          provenance="MODELLED"
          accentColor="purple"
          icon={Activity}
        />
        <MetricCard
          title="Far-Field Footprint (Delft3D)"
          value="26.5"
          unit="km²"
          subtitle="Eulerian Flexible Mesh Footprint"
          provenance="MODELLED"
          accentColor="emerald"
          icon={Waves}
        />
        <MetricCard
          title="Playback Timeline"
          value={`T+${currentTimeMin}m`}
          subtitle={`Advancement: ${currentTimeHrs.toFixed(2)}h / 3.0h`}
          provenance="DERIVED"
          accentColor="amber"
          icon={Clock}
        />
      </div>

      {/* Palette Selector Bar */}
      <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-3 flex flex-wrap items-center justify-between gap-3 text-xs">
        <div className="flex items-center space-x-2">
          <Sliders className="w-3.5 h-3.5 text-cyan-400" />
          <span className="font-bold text-slate-200">High-Contrast Colorblind Map Palette:</span>
        </div>

        <div className="flex flex-wrap gap-2">
          {COLORBLIND_PALETTES.map((p) => (
            <button
              key={p.id}
              onClick={() => setSelectedPalette(p.id)}
              className={`px-3 py-1.5 rounded-lg border text-xs font-semibold flex items-center space-x-2 transition ${
                selectedPalette === p.id
                  ? 'bg-slate-800 border-cyan-500 text-cyan-300 shadow-sm'
                  : 'bg-slate-950/60 border-slate-800 text-slate-400 hover:text-slate-200'
              }`}
            >
              <span className={`w-3 h-3 rounded-full bg-gradient-to-r ${p.gradient}`} />
              <span>{p.name}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Main Interactive Leaflet Map Container */}
      <div className="relative w-full">
        <GeospatialSimulationMap
          currentTimeMin={currentTimeMin}
          onTimeChange={setCurrentTimeMin}
          isPlaying={isPlaying}
          onTogglePlay={() => setIsPlaying(!isPlaying)}
          onReset={() => {
            setIsPlaying(false);
            setCurrentTimeMin(0);
          }}
          playbackSpeed={playbackSpeed}
          onSpeedChange={setPlaybackSpeed}
          scenarioParams={selectedPreset}
          isFullScreen={isFullScreen}
          onToggleFullScreen={() => setIsFullScreen(!isFullScreen)}
        />
      </div>

      {/* Location Inspector & Probe Tool (Collapsible Info Box) */}
      <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-5 space-y-3">
        <div className="flex items-center justify-between pb-2 border-b border-slate-800">
          <div className="flex items-center space-x-2">
            <MapPin className="w-4 h-4 text-cyan-400" />
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-200">
              Interactive Location Probe &amp; Downstream Gauge Telemetry
            </h3>
          </div>
          <span className="text-[11px] text-slate-400 font-mono">
            Click any corridor marker to query hydraulic head
          </span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
          {CORRIDOR_STATIONS.map((st) => (
            <div
              key={st.id}
              onClick={() => setInspectedLocation(st)}
              className="p-3 bg-slate-950 rounded-xl border border-slate-800/80 hover:border-cyan-500/40 cursor-pointer transition space-y-1"
            >
              <div className="flex items-center justify-between text-[10px] font-mono text-slate-400">
                <span>{st.km} km</span>
                <span className="text-amber-400 font-bold">T+{st.arrivalMin}m</span>
              </div>
              <h4 className="text-xs font-bold text-slate-200 truncate">{st.name}</h4>
              <div className="flex items-baseline justify-between pt-1 text-[11px]">
                <span className="text-slate-400">Peak Depth:</span>
                <span className="text-cyan-400 font-bold font-mono">{st.depth} m</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* 3 Analytics Charts Strip */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        <HydrographChart
          times={hydroTimes}
          flows={hydroFlows}
          currentTimeHrs={currentTimeHrs}
          peakDischarge={peakFlow}
          timeToPeakHrs={1.5}
        />
        <DownstreamHazardChart
          stations={CORRIDOR_STATIONS.map((s) => ({
            name: s.name,
            km: s.km,
            depth: s.depth,
            vel: s.type === 'dam' ? 22.4 : Math.max(5.0, 22.0 - s.km * 0.17),
          }))}
        />
        <ArrivalTimelineChart
          currentTimeMin={currentTimeMin}
          stations={CORRIDOR_STATIONS}
        />
      </div>

      {/* Elevation Profile Modal */}
      <ElevationProfileModal
        isOpen={isDemModalOpen}
        onClose={() => setIsDemModalOpen(false)}
        selectedPreset={selectedPreset}
      />
    </div>
  );
}
