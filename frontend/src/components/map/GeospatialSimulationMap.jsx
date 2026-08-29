import React, { useEffect, useRef, useState } from 'react';
import L from 'leaflet';
import {
  Play,
  Pause,
  RotateCcw,
  Layers,
  MapPin,
  Clock,
  Compass,
  Maximize2,
  Minimize2,
  Activity,
  Sliders,
  Eye,
  EyeOff,
  Navigation,
  Globe,
} from 'lucide-react';
import { createBasemapLayer } from '../../utils/mapTiles';
import { formatMinutes } from '../../utils/formatters';
import { formatFinite } from '../../utils/units';

// Real coordinates along Bhagirathi-Ganga river corridor (Tehri Dam to Haridwar)
export const RIVER_CORRIDOR_COORDS = [
  [30.378, 78.481], // Tehri Dam Axis (0 km)
  [30.362, 78.490], // Sirain Village (4.2 km)
  [30.335, 78.498], // Tipri Riverside (9.5 km)
  [30.312, 78.502], // Pangarh (14.8 km)
  [30.283, 78.504], // Koteshwar Dam (22 km)
  [30.220, 78.545], // Bagwan Hamlet (31 km)
  [30.146, 78.598], // Devprayag Sangam (42 km)
  [30.113, 78.396], // Shivpuri Gorge (62 km)
  [30.086, 78.267], // Rishikesh Town (78 km)
  [30.015, 78.210], // Raiwala (89 km)
  [29.945, 78.164], // Haridwar Bhimgoda (100 km)
];

export const CORRIDOR_STATIONS = [
  { id: 'tehri_axis', name: 'Tehri Dam Axis', lat: 30.378, lon: 78.481, km: 0.0, arrivalMin: 0, depth: 68.5, type: 'dam' },
  { id: 'sirain', name: 'Sirain Village', lat: 30.362, lon: 78.490, km: 4.2, arrivalMin: 8, depth: 34.0, type: 'village', pop: 840 },
  { id: 'tipri', name: 'Tipri Riverside', lat: 30.335, lon: 78.498, km: 9.5, arrivalMin: 18, depth: 28.5, type: 'village', pop: 1250 },
  { id: 'pangarh', name: 'Pangarh', lat: 30.312, lon: 78.502, km: 14.8, arrivalMin: 26, depth: 24.0, type: 'village', pop: 620 },
  { id: 'koteshwar', name: 'Koteshwar Dam', lat: 30.283, lon: 78.504, km: 22.0, arrivalMin: 32, depth: 42.0, type: 'dam', pop: 3400 },
  { id: 'bagwan', name: 'Bagwan Hamlet', lat: 30.220, lon: 78.545, km: 31.0, arrivalMin: 48, depth: 26.0, type: 'village', pop: 980 },
  { id: 'devprayag', name: 'Devprayag Sangam', lat: 30.146, lon: 78.598, km: 42.0, arrivalMin: 68, depth: 28.5, type: 'town', pop: 6500 },
  { id: 'shivpuri', name: 'Shivpuri Gorge', lat: 30.113, lon: 78.396, km: 62.0, arrivalMin: 92, depth: 22.0, type: 'town', pop: 2100 },
  { id: 'rishikesh', name: 'Rishikesh Town', lat: 30.086, lon: 78.267, km: 78.0, arrivalMin: 118, depth: 15.2, type: 'city', pop: 102000 },
  { id: 'haridwar', name: 'Haridwar Plains', lat: 29.945, lon: 78.164, km: 100.0, arrivalMin: 175, depth: 9.4, type: 'city', pop: 228000 },
];

export default function GeospatialSimulationMap({
  currentTimeMin = 60,
  onTimeChange,
  isPlaying,
  onTogglePlay,
  onReset,
  playbackSpeed = 1,
  onSpeedChange,
  scenarioParams = {},
  isFullScreen = false,
  onToggleFullScreen,
  onSelectStation,
}) {
  const mapContainerRef = useRef(null);
  const mapInstanceRef = useRef(null);
  const layersRef = useRef({
    riverLine: null,
    sphCircle: null,
    couplingLine: null,
    floodPolys: [],
    wavefrontMarker: null,
    markers: [],
  });

  const [viewMode, setViewMode] = useState('immediate'); // 'immediate' | 'corridor' | 'basin'
  const [followWavefront, setFollowWavefront] = useState(false);
  const [showLayerDrawer, setShowLayerDrawer] = useState(false);
  const [cursorCoords, setCursorCoords] = useState({ lat: 30.378, lon: 78.481, elev: 570 });

  // Toggleable Layers
  const [layerVisibility, setLayerVisibility] = useState({
    depth: true,
    sph_nearfield: true,
    coupling_transect: true,
    delft3d_farfield: true,
    wavefront: true,
    settlements: true,
    velocity_vectors: false,
  });

  const toggleLayer = (key) => {
    setLayerVisibility((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  // 1. Initialize Leaflet Map
  useEffect(() => {
    if (!mapContainerRef.current) return;
    if (mapInstanceRef.current) return;

    const map = L.map(mapContainerRef.current, {
      center: [30.340, 78.490],
      zoom: 12,
      zoomControl: false,
      attributionControl: false,
    });

    // Add Robust Basemap Layer with Fallback
    createBasemapLayer(map).addTo(map);

    // Add Leaflet Scale Bar Control
    L.control.scale({ metric: true, imperial: false, position: 'bottomleft' }).addTo(map);

    // Mouse movement coordinate tracking
    map.on('mousemove', (e) => {
      const lat = e.latlng.lat;
      const lon = e.latlng.lng;
      // Approximate Himalayan elevation estimate from lat gradient
      const approxElev = Math.max(280, Math.min(2600, Math.round(570 + (lat - 30.378) * 1500 - (lon - 78.481) * 800)));
      setCursorCoords({ lat: parseFloat(lat.toFixed(4)), lon: parseFloat(lon.toFixed(4)), elev: approxElev });
    });

    mapInstanceRef.current = map;

    // Add River Baseline Path
    const riverLine = L.polyline(RIVER_CORRIDOR_COORDS, {
      color: '#0284c7',
      weight: 3.5,
      opacity: 0.6,
      dashArray: '3,3',
    }).addTo(map);
    layersRef.current.riverLine = riverLine;

    // DualSPHysics Near-Field Domain (0–2km Circle around Tehri Dam)
    const sphCircle = L.circle([30.378, 78.481], {
      radius: 2000,
      color: '#06b6d4',
      fillColor: '#06b6d4',
      fillOpacity: 0.25,
      weight: 2,
      dashArray: '4,4',
    }).addTo(map);
    layersRef.current.sphCircle = sphCircle;

    // Coupling Transect Line (x = 2.0 km)
    const couplingLine = L.polyline(
      [
        [30.368, 78.472],
        [30.368, 78.502],
      ],
      {
        color: '#c084fc',
        weight: 3,
        dashArray: '5,5',
      }
    ).addTo(map);
    layersRef.current.couplingLine = couplingLine;

    // Add Settlement Markers
    CORRIDOR_STATIONS.forEach((st) => {
      const isDam = st.type === 'dam';
      const iconHtml = `
        <div class="flex items-center justify-center w-6 h-6 rounded-full border-2 ${
          isDam ? 'bg-cyan-500 border-white shadow-cyan-500/50' : 'bg-slate-900 border-cyan-400'
        } shadow-lg text-[10px] font-bold text-white">
          ${isDam ? '⚡' : '📍'}
        </div>
      `;
      const customIcon = L.divIcon({
        html: iconHtml,
        className: 'custom-station-marker',
        iconSize: [24, 24],
        iconAnchor: [12, 12],
      });

      const m = L.marker([st.lat, st.lon], { icon: customIcon }).addTo(map);
      m.bindPopup(`
        <div style="font-family: sans-serif; font-size: 12px; color: #0f172a; padding: 4px;">
          <strong>${st.name}</strong><br/>
          Chainage: <b>${st.km} km</b><br/>
          Wave Arrival: <b>${st.arrivalMin} min</b><br/>
          Peak Depth: <b>${st.depth} m</b>
        </div>
      `);
      if (onSelectStation) {
        m.on('click', () => onSelectStation(st));
      }
      layersRef.current.markers.push(m);
    });

    return () => {
      map.remove();
      mapInstanceRef.current = null;
    };
  }, []);

  // Update dynamic flood polygons as currentTimeMin changes
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map) return;

    // Clear previous flood polygons
    layersRef.current.floodPolys.forEach((p) => map.removeLayer(p));
    layersRef.current.floodPolys = [];

    if (layersRef.current.wavefrontMarker) {
      map.removeLayer(layersRef.current.wavefrontMarker);
      layersRef.current.wavefrontMarker = null;
    }

    if (!layerVisibility.depth && !layerVisibility.delft3d_farfield) return;

    // Calculate flood front progression
    const totalKm = 100.0;
    const progressKm = Math.min(totalKm, (currentTimeMin / 175.0) * totalKm);

    // Build inundated polygon corridor up to progressKm
    const coordsCount = RIVER_CORRIDOR_COORDS.length;
    const currentCoordIdx = Math.min(
      coordsCount - 1,
      Math.floor((progressKm / totalKm) * (coordsCount - 1))
    );

    const activeReachCoords = RIVER_CORRIDOR_COORDS.slice(0, currentCoordIdx + 1);

    if (activeReachCoords.length >= 2) {
      // Left bank and right bank polygon offsets
      const leftBank = [];
      const rightBank = [];
      const bufferDeg = 0.006; // ~600m width

      activeReachCoords.forEach(([lat, lon], idx) => {
        const factor = 1.0 + (idx / coordsCount) * 1.5;
        leftBank.push([lat + bufferDeg * factor, lon - bufferDeg * factor]);
        rightBank.unshift([lat - bufferDeg * factor, lon + bufferDeg * factor]);
      });

      const poly = L.polygon([...leftBank, ...rightBank], {
        color: '#0284c7',
        fillColor: '#38bdf8',
        fillOpacity: 0.55,
        weight: 1.5,
      }).addTo(map);

      layersRef.current.floodPolys.push(poly);

      // Add Wavefront Marker
      if (layerVisibility.wavefront && currentCoordIdx > 0) {
        const [wLat, wLon] = RIVER_CORRIDOR_COORDS[currentCoordIdx];
        const wfIcon = L.divIcon({
          html: `<div class="w-4 h-4 rounded-full bg-red-500 border-2 border-white animate-ping"></div>`,
          className: 'wavefront-marker',
          iconSize: [16, 16],
          iconAnchor: [8, 8],
        });
        const wf = L.marker([wLat, wLon], { icon: wfIcon }).addTo(map);
        layersRef.current.wavefrontMarker = wf;

        if (followWavefront) {
          map.panTo([wLat, wLon]);
        }
      }
    }
  }, [currentTimeMin, layerVisibility, followWavefront]);

  // Adjust map viewport on viewMode switch
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map) return;
    if (viewMode === 'immediate') {
      map.flyTo([30.365, 78.485], 13);
    } else if (viewMode === 'corridor') {
      map.flyTo([30.150, 78.400], 10);
    } else if (viewMode === 'basin') {
      map.flyTo([30.150, 78.350], 9);
    }
  }, [viewMode]);

  return (
    <div className="relative w-full h-[580px] bg-slate-950 rounded-2xl overflow-hidden border border-slate-800 flex flex-col">
      {/* 1. Map Leaflet Container */}
      <div ref={mapContainerRef} className="w-full flex-1 z-0 relative" />

      {/* 2. Top Header Overlays (Camera controls & Layers) */}
      <div className="absolute top-4 left-4 right-4 z-10 flex items-center justify-between pointer-events-none">
        {/* View Mode Toggle Buttons */}
        <div className="flex items-center gap-1 bg-slate-950/90 backdrop-blur border border-slate-800 p-1 rounded-xl shadow-lg pointer-events-auto">
          <button
            onClick={() => setViewMode('immediate')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
              viewMode === 'immediate'
                ? 'bg-cyan-500 text-slate-950 shadow-sm'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            0–2 KM SPH
          </button>
          <button
            onClick={() => setViewMode('corridor')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
              viewMode === 'corridor'
                ? 'bg-cyan-500 text-slate-950 shadow-sm'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            100 KM CORRIDOR
          </button>
          <button
            onClick={() => setViewMode('basin')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
              viewMode === 'basin'
                ? 'bg-cyan-500 text-slate-950 shadow-sm'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            FULL BASIN
          </button>
        </div>

        {/* Right Tools: North Arrow, Coordinates, Layers & Fullscreen */}
        <div className="flex items-center gap-2 pointer-events-auto">
          {/* North Arrow Widget */}
          <div className="p-2 rounded-xl bg-slate-950/95 border border-slate-800 text-cyan-400 flex items-center justify-center shadow-lg" title="North Reference">
            <Navigation className="w-4 h-4 transform -rotate-45" />
          </div>

          {/* Real-time Coordinate Readout */}
          <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-950/95 border border-slate-800 text-[11px] font-mono text-slate-300 shadow-lg">
            <Globe className="w-3.5 h-3.5 text-cyan-400" />
            <span>{cursorCoords.lat}°N, {cursorCoords.lon}°E</span>
            <span className="text-slate-500">|</span>
            <span className="text-emerald-400">{cursorCoords.elev}m MSL</span>
          </div>

          <button
            onClick={() => setFollowWavefront(!followWavefront)}
            className={`px-3 py-1.5 rounded-xl border text-xs font-mono transition flex items-center gap-1.5 shadow-lg ${
              followWavefront
                ? 'bg-amber-500/20 border-amber-500/50 text-amber-300'
                : 'bg-slate-950/95 border-slate-800 text-slate-400 hover:text-slate-200'
            }`}
          >
            <Compass className="w-3.5 h-3.5" />
            <span>Follow Front</span>
          </button>

          <button
            onClick={() => setShowLayerDrawer(!showLayerDrawer)}
            className="px-3 py-1.5 rounded-xl bg-slate-950/95 border border-slate-800 text-slate-300 hover:text-white text-xs font-semibold transition flex items-center gap-1.5 shadow-lg"
          >
            <Layers className="w-3.5 h-3.5 text-cyan-400" />
            <span>Layers</span>
          </button>

          {onToggleFullScreen && (
            <button
              onClick={onToggleFullScreen}
              className="p-2 rounded-xl bg-slate-950/95 border border-slate-800 text-slate-300 hover:text-white transition shadow-lg"
              title={isFullScreen ? 'Exit Fullscreen' : 'Enter Fullscreen Simulation Mode'}
            >
              {isFullScreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
            </button>
          )}
        </div>
      </div>

      {/* Layer Control Dropdown Popover */}
      {showLayerDrawer && (
        <div className="absolute top-16 right-4 z-20 bg-slate-950/95 backdrop-blur border border-slate-800 p-3.5 rounded-2xl shadow-2xl text-xs space-y-2.5 w-60 font-mono">
          <div className="flex items-center justify-between pb-1.5 border-b border-slate-800 text-slate-300 font-bold">
            <span>MAP LAYERS</span>
            <button onClick={() => setShowLayerDrawer(false)} className="text-slate-400 hover:text-white">✕</button>
          </div>
          {[
            { id: 'sph_nearfield', label: 'SPH Near-Field (0–2km)' },
            { id: 'coupling_transect', label: 'Coupling Transect (x=2km)' },
            { id: 'delft3d_farfield', label: 'Delft3D Flexible Mesh' },
            { id: 'wavefront', label: 'Advancing Wave Front' },
            { id: 'settlements', label: 'Settlements & Checkpoints' },
          ].map((l) => (
            <label key={l.id} className="flex items-center justify-between cursor-pointer text-slate-300 hover:text-white">
              <span>{l.label}</span>
              <input
                type="checkbox"
                checked={layerVisibility[l.id]}
                onChange={() => toggleLayer(l.id)}
                className="accent-cyan-400 cursor-pointer rounded"
              />
            </label>
          ))}
        </div>
      )}

      {/* 3. Floating Bottom-Left: Map Legend Overlay & Attribution */}
      <div className="relative z-10 px-4 pb-3 pointer-events-none flex items-end justify-between">
        <div className="pointer-events-auto inline-flex flex-col gap-1.5 bg-slate-950/90 backdrop-blur border border-slate-800 p-3 rounded-xl shadow-lg text-[11px] font-mono">
          <div className="flex items-center justify-between gap-4">
            <span className="text-slate-200 font-bold uppercase tracking-wider text-[10px]">
              Inundation Depth & Velocity Legend
            </span>
            <span className="text-[9px] text-slate-400">CRS: EPSG:4326</span>
          </div>
          <div className="grid grid-cols-2 gap-x-4 gap-y-1">
            <div className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded bg-sky-400/80 inline-block" />
              <span className="text-slate-300">0.5 – 3.0 m (Moderate)</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded bg-sky-800 inline-block" />
              <span className="text-slate-300">&gt; 3.0 m (High Depth)</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-cyan-400 inline-block" />
              <span className="text-cyan-300">SPH Domain (0–2km)</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-red-500 inline-block" />
              <span className="text-red-300">Monitored Station</span>
            </div>
          </div>
        </div>

        {/* Cartographic Attribution Badge */}
        <div className="pointer-events-auto hidden md:block bg-slate-950/90 backdrop-blur border border-slate-800 px-2.5 py-1 rounded-lg text-[10px] text-slate-400 font-mono">
          DEM: Copernicus GLO-30 | Survey: THDC Tehri | Hydrology: CWC
        </div>
      </div>

      {/* 4. Bottom Scrubber & Playback Control Bar */}
      <div className="relative z-10 bg-slate-950/95 backdrop-blur border-t border-slate-800/90 px-5 py-3.5 flex flex-wrap items-center justify-between gap-4">
        {/* Play/Pause & Reset */}
        <div className="flex items-center gap-2">
          <button
            onClick={onTogglePlay}
            className="p-2.5 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold transition shadow-md shadow-cyan-500/20"
            title={isPlaying ? 'Pause Simulation' : 'Play Simulation'}
          >
            {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4 fill-slate-950" />}
          </button>
          <button
            onClick={onReset}
            className="p-2.5 rounded-xl bg-slate-900 border border-slate-800 hover:bg-slate-800 text-slate-300 transition"
            title="Reset to T+0h"
          >
            <RotateCcw className="w-4 h-4" />
          </button>

          {/* Time Display */}
          <div className="px-3 py-1.5 bg-slate-900 border border-slate-800 rounded-xl text-xs font-mono flex items-center gap-2">
            <Clock className="w-3.5 h-3.5 text-cyan-400" />
            <span className="text-slate-300">
              T+{formatMinutes(currentTimeMin)} ({(currentTimeMin / 60).toFixed(2)}h)
            </span>
          </div>
        </div>

        {/* Scrubbing Slider (0h to 3h / 180 min) */}
        <div className="flex-1 min-w-[240px] flex items-center gap-3">
          <span className="text-[11px] font-mono text-slate-400">0h</span>
          <input
            type="range"
            min="0"
            max="180"
            step="1"
            value={currentTimeMin}
            onChange={(e) => onTimeChange(parseInt(e.target.value))}
            className="w-full accent-cyan-400 h-1.5 bg-slate-800 rounded-lg cursor-pointer"
          />
          <span className="text-[11px] font-mono text-slate-400">3h</span>
        </div>

        {/* Playback Speed Toggles */}
        <div className="flex items-center gap-1 bg-slate-900 border border-slate-800 p-1 rounded-xl text-xs font-mono">
          {[1, 2, 4].map((speed) => (
            <button
              key={speed}
              onClick={() => onSpeedChange(speed)}
              className={`px-2.5 py-1 rounded-lg transition ${
                playbackSpeed === speed
                  ? 'bg-cyan-500 text-slate-950 font-bold'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              {speed}x
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
