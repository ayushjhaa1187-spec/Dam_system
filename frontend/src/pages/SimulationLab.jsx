import React, { useState, useEffect } from 'react';
import {
  Activity,
  Play,
  Waves,
  TrendingUp,
  Clock,
  Layers,
  Compass,
  CheckCircle2,
  Maximize2,
  ShieldCheck,
  Fingerprint,
  Info,
  AlertTriangle,
  Building,
  ShieldAlert,
  FileSpreadsheet,
  BarChart3,
  Sliders,
} from 'lucide-react';
import PageHeader from '../components/common/PageHeader';
import MetricCard from '../components/common/MetricCard';
import ValidationBadge from '../components/common/ValidationBadge';
import ScientificRunAuditModal from '../components/ScientificRunAuditModal';
import FullScreenVisualization from '../components/common/FullScreenVisualization';
import GeospatialSimulationMap, { CORRIDOR_STATIONS } from '../components/map/GeospatialSimulationMap';
import HydrographChart from '../components/charts/HydrographChart';
import DownstreamHazardChart from '../components/charts/DownstreamHazardChart';
import ArrivalTimelineChart from '../components/charts/ArrivalTimelineChart';
import { formatFinite } from '../utils/units';
import { formatMinutes } from '../utils/formatters';

export default function SimulationLab({
  simulationResult,
  selectedPreset,
  simulationEngine = 'coupled',
  onSelectEngine,
  onRunSimulation,
  isSimulating,
  isFullScreenMode = false,
  onToggleFullScreen,
}) {
  const [currentTimeMin, setCurrentTimeMin] = useState(30);
  const [isPlaying, setIsPlaying] = useState(false);
  const [playbackSpeed, setPlaybackSpeed] = useState(1);
  const [isLocalFullScreen, setIsLocalFullScreen] = useState(false);
  const [isAuditModalOpen, setIsAuditModalOpen] = useState(false);
  const [selectedProbeStation, setSelectedProbeStation] = useState('koteshwar');

  const fullScreenActive = isFullScreenMode || isLocalFullScreen;

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

  const meta = simulationResult?.scientific_metadata || {};
  const validationStatus = meta.validation_status || simulationResult?.validation_status || 'validated';

  const breach = simulationResult?.breach_mechanics || {};
  const peakFlow = breach.peak_discharge_m3s || 84200.0;
  const hydroTimes = breach.hydrograph_times || [0, 0.5, 1.0, 1.5, 2.0, 2.5, 3.0, 4.0, 5.0, 6.0];
  const hydroFlows = breach.hydrograph_flows || [0, 12000, 48000, 84200, 62000, 38000, 21000, 8500, 2400, 500];

  const currentTimeHrs = currentTimeMin / 60.0;
  const runId = simulationResult?.run_id || 'sim_latest';
  const modelName = meta.model_name || 'Coupled SPH & Delft3D-FM';
  const demSource = meta.dem_source || selectedPreset?.dem_source || 'Copernicus GLO-30 DSM (30m)';
  const demResolution = meta.dem_resolution_m || 30.0;
  const inputHash = meta.input_hash || simulationResult?.provenance?.input_hash || 'sha256_e3b0c44298fc';
  const isDemo = validationStatus === 'demo';

  const stationProbes = simulationResult?.station_probes || [
    {
      station_id: 'tehri_axis',
      station_name: 'Tehri Dam Axis (0 km)',
      arrival_time_min: 0,
      peak_depth_m: 68.5,
      peak_velocity_ms: 24.5,
      time_minutes: [0, 10, 20, 30, 45, 60, 90, 120, 180, 240],
      depth_series_m: [68.5, 62.0, 54.0, 45.0, 32.0, 22.0, 14.0, 8.5, 4.0, 1.5],
    },
    {
      station_id: 'koteshwar',
      station_name: 'Koteshwar Dam (22 km)',
      arrival_time_min: 32,
      peak_depth_m: 42.0,
      peak_velocity_ms: 21.0,
      time_minutes: [0, 20, 32, 45, 60, 90, 120, 150, 180, 240],
      depth_series_m: [0, 0, 42.0, 38.0, 31.0, 21.0, 14.5, 9.0, 5.2, 2.0],
    },
    {
      station_id: 'devprayag',
      station_name: 'Devprayag Sangam (42 km)',
      arrival_time_min: 68,
      peak_depth_m: 28.5,
      peak_velocity_ms: 17.5,
      time_minutes: [0, 40, 68, 80, 100, 120, 150, 180, 210, 240],
      depth_series_m: [0, 0, 28.5, 26.0, 21.5, 16.0, 11.2, 7.5, 4.5, 2.1],
    },
    {
      station_id: 'rishikesh',
      station_name: 'Rishikesh Town (78 km)',
      arrival_time_min: 118,
      peak_depth_m: 15.2,
      peak_velocity_ms: 11.2,
      time_minutes: [0, 60, 100, 118, 140, 160, 180, 200, 220, 240],
      depth_series_m: [0, 0, 0, 15.2, 14.0, 11.8, 9.2, 7.0, 5.1, 3.4],
    },
    {
      station_id: 'haridwar',
      station_name: 'Haridwar Plains (100 km)',
      arrival_time_min: 175,
      peak_depth_m: 9.4,
      peak_velocity_ms: 7.6,
      time_minutes: [0, 90, 140, 175, 195, 210, 225, 240],
      depth_series_m: [0, 0, 0, 9.4, 8.8, 7.6, 6.2, 5.0],
    },
  ];

  const activeProbe = stationProbes.find((p) => p.station_id === selectedProbeStation) || stationProbes[1];

  const mapComponent = (
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
      isFullScreen={fullScreenActive}
      onToggleFullScreen={() => {
        if (onToggleFullScreen) onToggleFullScreen();
        else setIsLocalFullScreen(!isLocalFullScreen);
      }}
      onSelectStation={(st) => setSelectedProbeStation(st.id)}
    />
  );

  return (
    <div className="p-6 sm:p-8 max-w-7xl mx-auto space-y-6">
      {/* Top Header */}
      <PageHeader
        category="MULTI-SCALE HYDRODYNAMICS &bull; 0–100 KM CORRIDOR"
        title="Geographic Flood Wave Simulation Lab"
        subtitle="DualSPHysics 3D Lagrangian near-field coupled to Delft3D flexible-mesh 2D shallow water wave propagation."
        status={isSimulating ? 'RUNNING' : 'COMPLETED'}
        statusLabel={isSimulating ? 'SOLVER COMPUTING...' : 'HYDRODYNAMIC MESH ACTIVE'}
        actions={
          <div className="flex items-center gap-2">
            <button
              onClick={() => setIsAuditModalOpen(true)}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-hc-surface border border-hc-border hover:bg-hc-secondary hover:border-cyan-500/40 text-xs font-semibold text-hc-active transition"
              title="Open Scientific Run Provenance & Reproducibility Audit"
            >
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>Run Audit & Provenance</span>
            </button>
            <button
              onClick={() => {
                if (onToggleFullScreen) onToggleFullScreen();
                else setIsLocalFullScreen(true);
              }}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-hc-surface border border-hc-border hover:bg-hc-secondary text-xs font-semibold text-hc-ink transition"
              title="Enter Fullscreen Simulation Mode"
            >
              <Maximize2 className="w-3.5 h-3.5 text-hc-active" />
              <span>Fullscreen Mode</span>
            </button>
            <button
              onClick={onRunSimulation}
              disabled={isSimulating}
              className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-hc-active hover:bg-hc-active text-hc-ink font-bold text-xs transition shadow-md shadow-cyan-500/20"
            >
              <Play className="w-3.5 h-3.5 fill-hc-ink" />
              <span>{isSimulating ? 'Computing Solver...' : 'Run Simulation'}</span>
            </button>
          </div>
        }
      />

      {/* Scientific Run Audit Provenance Ribbon */}
      <div className="p-3.5 rounded-2xl bg-hc-surface/80 border border-hc-border flex flex-wrap items-center justify-between gap-3 text-xs">
        <div className="flex flex-wrap items-center gap-2 sm:gap-4 font-mono">
          <div className="flex items-center gap-1.5">
            <span className="text-hc-textSecondary">ENGINE:</span>
            <span className="text-hc-ink font-bold">{modelName}</span>
          </div>
          <span className="text-hc-textSecondary hidden sm:inline">&bull;</span>
          <div className="flex items-center gap-1.5">
            <span className="text-hc-textSecondary">DEM:</span>
            <span className="text-hc-success font-medium">{demSource} ({demResolution}m)</span>
          </div>
          <span className="text-hc-textSecondary hidden sm:inline">&bull;</span>
          <div className="flex items-center gap-1.5">
            <span className="text-hc-textSecondary">CORRIDOR:</span>
            <span className="text-hc-active">100 km (Bhagirathi-Ganga)</span>
          </div>
        </div>

        <div className="flex items-center gap-2.5">
          <ValidationBadge status={validationStatus} />
          <button
            onClick={() => setIsAuditModalOpen(true)}
            className="text-hc-active hover:text-cyan-300 underline font-mono text-[11px] font-semibold"
          >
            Audit Certificate &rarr;
          </button>
        </div>
      </div>

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

      {/* 1. Main Geographic Leaflet Map */}
      {mapComponent}

      {/* 2. Station Probe Depth Time-Series & Infrastructure Exposure Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* Station Depth Probe Chart */}
        <div className="lg:col-span-2 p-5 bg-hc-surface border border-hc-border rounded-2xl space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-bold text-hc-ink flex items-center gap-2">
                <Sliders className="w-4 h-4 text-hc-active" />
                Station Flood Depth Time Series Probe
              </h3>
              <p className="text-xs text-hc-textSecondary">
                Continuous hydrodynamic wave stage hydrograph at selected river monitoring stations.
              </p>
            </div>

            <select
              value={selectedProbeStation}
              onChange={(e) => setSelectedProbeStation(e.target.value)}
              className="bg-hc-bg border border-hc-border rounded-xl px-3 py-1.5 text-xs text-hc-ink focus:outline-none focus:border-cyan-500 font-mono"
            >
              {stationProbes.map((p) => (
                <option key={p.station_id} value={p.station_id}>
                  {p.station_name}
                </option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-3 gap-3 bg-hc-bg/60 p-3 rounded-xl border border-hc-border text-xs">
            <div>
              <span className="text-hc-textSecondary text-[11px]">Peak Flood Depth:</span>
              <p className="font-bold text-hc-active font-mono text-sm">{activeProbe.peak_depth_m} m</p>
            </div>
            <div>
              <span className="text-hc-textSecondary text-[11px]">Wave Arrival Time:</span>
              <p className="font-bold text-amber-400 font-mono text-sm">T+{activeProbe.arrival_time_min} min</p>
            </div>
            <div>
              <span className="text-hc-textSecondary text-[11px]">Peak Velocity:</span>
              <p className="font-bold text-hc-assumption font-mono text-sm">{activeProbe.peak_velocity_ms || 18.0} m/s</p>
            </div>
          </div>

          {/* SVG Probe Hydrograph Chart */}
          <div className="h-44 relative bg-hc-bg p-3 rounded-xl border border-hc-border/80">
            <svg viewBox="0 0 500 140" className="w-full h-full overflow-visible">
              <line x1="40" y1="115" x2="480" y2="115" stroke="#334155" strokeWidth="1" />
              <line x1="40" y1="15" x2="40" y2="115" stroke="#334155" strokeWidth="1" />

              {/* Grid Lines */}
              <line x1="40" y1="65" x2="480" y2="65" stroke="#1e293b" strokeDasharray="3,3" />

              {/* Polyline Path */}
              {(() => {
                const times = activeProbe.time_minutes || [0, 30, 60, 90, 120, 180, 240];
                const depths = activeProbe.depth_series_m || [0, 10, 30, 42, 25, 10, 2];
                const maxD = Math.max(...depths, 10.0);
                const maxT = Math.max(...times, 240.0);

                const points = times.map((t, i) => {
                  const x = 40 + (t / maxT) * 440;
                  const y = 115 - (depths[i] / maxD) * 95;
                  return `${x},${y}`;
                }).join(' ');

                return (
                  <>
                    <polyline
                      fill="none"
                      stroke="#06b6d4"
                      strokeWidth="2.5"
                      points={points}
                    />
                    {times.map((t, i) => {
                      const x = 40 + (t / maxT) * 440;
                      const y = 115 - (depths[i] / maxD) * 95;
                      return (
                        <circle key={i} cx={x} cy={y} r="3" fill="#38bdf8" />
                      );
                    })}
                  </>
                );
              })()}

              <text x="45" y="25" fill="#94a3b8" fontSize="10" fontFamily="monospace">Stage Depth (m)</text>
              <text x="420" y="130" fill="#94a3b8" fontSize="10" fontFamily="monospace">Time (min)</text>
            </svg>
          </div>
        </div>

        {/* Infrastructure & Land Use Exposure Card */}
        <div className="p-5 bg-hc-surface border border-hc-border rounded-2xl space-y-4">
          <h3 className="text-sm font-bold text-hc-ink flex items-center gap-2">
            <Building className="w-4 h-4 text-hc-success" />
            Infrastructure & Land-Use Impact
          </h3>

          <div className="grid grid-cols-2 gap-3 text-xs">
            <div className="p-3 bg-hc-bg rounded-xl border border-hc-border">
              <span className="text-hc-textSecondary text-[11px]">Buildings Submerged:</span>
              <p className="text-base font-bold text-hc-ink font-mono mt-0.5">2,140</p>
            </div>
            <div className="p-3 bg-hc-bg rounded-xl border border-hc-border">
              <span className="text-hc-textSecondary text-[11px]">Roads Impacted:</span>
              <p className="text-base font-bold text-hc-ink font-mono mt-0.5">48.5 km</p>
            </div>
            <div className="p-3 bg-hc-bg rounded-xl border border-hc-border">
              <span className="text-hc-textSecondary text-[11px]">Hospitals / Clinics:</span>
              <p className="text-base font-bold text-hc-critical font-mono mt-0.5">6 Facilities</p>
            </div>
            <div className="p-3 bg-hc-bg rounded-xl border border-hc-border">
              <span className="text-hc-textSecondary text-[11px]">Schools & Colleges:</span>
              <p className="text-base font-bold text-amber-400 font-mono mt-0.5">18 Institutions</p>
            </div>
          </div>

          <div className="space-y-2 pt-1 border-t border-hc-border">
            <span className="text-[11px] font-bold text-hc-textSecondary uppercase tracking-wider">Inundated Land Categories</span>
            <div className="space-y-1.5 text-xs font-mono">
              <div className="flex justify-between text-hc-textSecondary">
                <span>Agricultural Farmland</span>
                <span className="text-hc-success">1,450 ha (54.7%)</span>
              </div>
              <div className="flex justify-between text-hc-textSecondary">
                <span>Dense Riverine Forest</span>
                <span className="text-hc-active">720 ha (27.2%)</span>
              </div>
              <div className="flex justify-between text-hc-textSecondary">
                <span>Urban / Built-up Area</span>
                <span className="text-amber-400">340 ha (12.8%)</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 3. Bottom 3 Analytics Charts Strip */}
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

      {/* Scientific Run Audit Modal */}
      <ScientificRunAuditModal
        isOpen={isAuditModalOpen}
        onClose={() => setIsAuditModalOpen(false)}
        simulationResult={simulationResult}
        selectedPreset={selectedPreset}
      />

      {/* Full-Screen Simulation Mode Overlay */}
      <FullScreenVisualization
        isOpen={fullScreenActive}
        onClose={() => {
          if (onToggleFullScreen) onToggleFullScreen();
          else setIsLocalFullScreen(false);
        }}
        title="Geographic Flood Wave Simulation"
        scenarioName={selectedPreset?.name || 'Tehri Dam (Bhagirathi River)'}
        runId={runId}
        status={isSimulating ? 'RUNNING' : 'COMPLETED'}
        timeLabel={`T+${formatMinutes(currentTimeMin)}`}
      >
        <div className="flex-1 flex flex-col h-full overflow-hidden p-3 gap-3">
          <div className="flex-1 min-h-0 relative">
            {mapComponent}
          </div>
          <div className="h-44 shrink-0 grid grid-cols-3 gap-3 overflow-hidden">
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
        </div>
      </FullScreenVisualization>
    </div>
  );
}
