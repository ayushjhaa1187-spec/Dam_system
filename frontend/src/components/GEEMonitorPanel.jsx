import React, { useState, useEffect } from 'react';
import {
  Satellite,
  AlertCircle,
  Play,
  Layers,
  Sparkles,
  CheckCircle,
  Calendar,
  Waves,
  MapPin,
  RefreshCw,
  FileQuestion,
} from 'lucide-react';
import { api } from '../services/api';
import { formatFinite, isFiniteNumber } from '../utils/units';

export default function GEEMonitorPanel({ onTriggerScenarioFromLake }) {
  const [alerts, setAlerts] = useState([]);
  const [zones, setZones] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedZone, setSelectedZone] = useState(null);
  const [sarAnalysisResult, setSarAnalysisResult] = useState(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setIsLoading(true);
    try {
      const [alertsRes, zonesRes] = await Promise.all([api.getGEEAlerts(), api.getGEEZones()]);
      const validAlerts = (alertsRes.alerts || []).filter(
        (a) =>
          a &&
          isFiniteNumber(a.impounded_area_ha) &&
          a.impounded_area_ha > 0 &&
          isFiniteNumber(a.confidence) &&
          a.confidence > 0.3
      );
      setAlerts(validAlerts);
      setZones(zonesRes.zones || []);
      if (zonesRes.zones?.length) {
        setSelectedZone(zonesRes.zones[0]);
      }
    } catch (err) {
      console.error('Failed to load GEE data:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleRunCustomSAR = async () => {
    if (!selectedZone) return;
    setIsAnalyzing(true);
    try {
      const bbox = [
        selectedZone.lon - 0.05,
        selectedZone.lat - 0.05,
        selectedZone.lon + 0.05,
        selectedZone.lat + 0.05,
      ];
      const res = await api.runSARAnalysis(bbox, '2026-08-10', '2026-08-24', 'VV');
      setSarAnalysisResult(res);
    } catch (err) {
      console.error('SAR analysis failed:', err);
    } finally {
      setIsAnalyzing(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
      {/* Header Banner */}
      <div className="bg-hc-surface/80 border border-hc-border rounded-xl p-5">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <div className="flex items-center space-x-2 mb-1">
              <Satellite className="w-5 h-5 text-hc-success" />
              <h2 className="text-base font-bold text-hc-ink">
                Satellite Sentinel-1 C-Band SAR Surveillance
              </h2>
              <span className="text-xs bg-emerald-950 text-hc-success border border-emerald-800/60 px-2 py-0.5 rounded-full font-semibold">
                Backscatter Amplitude Change
              </span>
            </div>
            <p className="text-xs text-hc-textSecondary">
              Surveillance of C-band SAR backscatter reduction (specular reflection over standing water) and Otsu thresholding across vulnerable Himalayan corridors.
            </p>
          </div>

          <button
            onClick={loadData}
            disabled={isLoading}
            className="p-2 rounded-lg bg-hc-secondary hover:bg-hc-border text-hc-textSecondary transition flex items-center space-x-1.5 text-xs font-semibold"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
            <span>Refresh SAR Pass</span>
          </button>
        </div>
      </div>

      {/* Active Satellite Early Warning Alerts Feed */}
      <div className="space-y-3">
        <h3 className="text-sm font-bold text-hc-ink flex items-center space-x-2">
          <AlertCircle className="w-4 h-4 text-hc-success" />
          <span>Observed Surface Water &amp; Impoundment Alerts</span>
        </h3>

        {alerts.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {alerts.map((alt) => (
              <div
                key={alt.alert_id || alt.id}
                className="bg-hc-surface/80 border border-emerald-500/40 rounded-xl p-4 space-y-3 shadow-lg shadow-emerald-950/20"
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-hc-success flex items-center space-x-1.5">
                    <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping"></span>
                    <span>{alt.zone_name}</span>
                  </span>
                  <span className="text-[10px] bg-red-950 text-hc-critical border border-red-800 px-2 py-0.5 rounded-full font-mono font-bold">
                    {alt.severity || 'WATCH'} ALERT
                  </span>
                </div>

                <p className="text-xs text-hc-textSecondary">
                  {alt.risk_type || 'Surface water expansion'} detected along <strong>{alt.river}</strong> via Sentinel-1 SAR change detection.
                </p>

                <div className="grid grid-cols-3 gap-2 bg-hc-bg p-2.5 rounded-lg border border-hc-border text-center">
                  <div>
                    <span className="text-[10px] text-hc-textSecondary block">Water Area</span>
                    <span className="text-xs font-bold text-hc-ink font-mono">
                      {formatFinite(alt.impounded_area_ha, 1)} ha
                    </span>
                    <span className="text-[9px] text-hc-textSecondary block">OBSERVED</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-hc-textSecondary block">Est. Depth</span>
                    <span className="text-xs font-bold text-hc-ink font-mono">
                      {formatFinite(alt.estimated_depth_m, 1)} m
                    </span>
                    <span className="text-[9px] text-hc-textSecondary block">DERIVED</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-hc-textSecondary block">Est. Volume</span>
                    <span className="text-xs font-bold text-hc-active font-mono">
                      {formatFinite((alt.estimated_volume_m3 || 0) / 1e6, 2)} Mm³
                    </span>
                    <span className="text-[9px] text-hc-textSecondary block">MODELLED</span>
                  </div>
                </div>

                <div className="flex items-center justify-between pt-1 text-[11px] text-hc-textSecondary">
                  <span>
                    Confidence: <strong>{formatFinite((alt.confidence || 0) * 100, 0)}%</strong>
                  </span>
                  {onTriggerScenarioFromLake && (
                    <button
                      onClick={() => onTriggerScenarioFromLake(alt)}
                      className="px-3 py-1.5 rounded-lg bg-hc-active hover:bg-hc-active text-slate-950 text-xs font-bold flex items-center space-x-1 transition shadow"
                    >
                      <Play className="w-3 h-3 fill-slate-950" />
                      <span>Simulate Outburst</span>
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="bg-hc-surface border border-hc-border rounded-xl p-8 text-center text-hc-textSecondary text-xs">
            No confirmed active water impoundment anomalies detected in latest SAR passes.
          </div>
        )}
      </div>

      {/* On-Demand Sentinel-1 SAR Processing */}
      <div className="bg-hc-surface/80 border border-hc-border rounded-xl p-5 space-y-4">
        <h3 className="text-sm font-bold text-hc-ink flex items-center space-x-2 pb-2 border-b border-hc-border">
          <Layers className="w-4 h-4 text-hc-active" />
          <span>On-Demand SAR Backscatter Differencing Analysis</span>
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 items-end">
          <div>
            <label className="text-xs text-hc-textSecondary block mb-1">Target Monitoring Zone</label>
            <select
              value={selectedZone?.id || ''}
              onChange={(e) => {
                const z = zones.find((item) => item.id === e.target.value);
                setSelectedZone(z);
              }}
              className="w-full bg-hc-bg border border-hc-border text-xs text-hc-ink rounded-lg px-3 py-2 focus:outline-none focus:border-cyan-500"
            >
              {zones.map((z) => (
                <option key={z.id} value={z.id}>
                  {z.name}
                </option>
              ))}
            </select>
          </div>

          <div className="text-xs text-hc-textSecondary space-y-1">
            <span>Observation Window:</span>
            <div className="font-mono text-[11px] text-hc-active bg-hc-bg px-2.5 py-1.5 rounded border border-hc-border">
              Pre: 2026-08-10 | Post: 2026-08-24 (VV)
            </div>
          </div>

          <button
            onClick={handleRunCustomSAR}
            disabled={isAnalyzing}
            className="w-full py-2 px-4 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-slate-950 font-bold text-xs transition flex items-center justify-center space-x-2 disabled:opacity-50"
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>{isAnalyzing ? 'Extracting Backscatter...' : 'Run SAR Detection'}</span>
          </button>
        </div>

        {sarAnalysisResult && (
          <div className="bg-hc-bg p-4 rounded-xl border border-hc-border space-y-3 mt-4">
            <div className="flex items-center justify-between text-xs pb-2 border-b border-hc-border/80">
              <span className="font-bold text-hc-ink">Analysis Summary</span>
              <span className="font-mono text-hc-success bg-emerald-950/40 px-2 py-0.5 rounded border border-emerald-900/50">
                PROVENANCE: {sarAnalysisResult.source_label || 'OBSERVED'}
              </span>
            </div>
            
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-center mb-3">
              <div className="bg-hc-surface p-2.5 rounded-lg border border-hc-border">
                <span className="text-[10px] text-hc-textSecondary block">Acquisition Date</span>
                <span className="text-xs font-bold text-hc-ink">
                  {sarAnalysisResult.acquisition_date || '2026-08-24'}
                </span>
              </div>
              <div className="bg-hc-surface p-2.5 rounded-lg border border-hc-border">
                <span className="text-[10px] text-hc-textSecondary block">Orbit Direction</span>
                <span className="text-xs font-bold text-hc-ink">
                  {sarAnalysisResult.orbit_direction || 'ASCENDING'}
                </span>
              </div>
              <div className="bg-hc-surface p-2.5 rounded-lg border border-hc-border">
                <span className="text-[10px] text-hc-textSecondary block">Polarization</span>
                <span className="text-xs font-bold text-hc-ink">
                  {sarAnalysisResult.polarization || 'VV/VH'}
                </span>
              </div>
              <div className="bg-hc-surface p-2.5 rounded-lg border border-hc-border">
                <span className="text-[10px] text-hc-textSecondary block">Threshold</span>
                <span className="text-xs font-bold text-hc-active">
                  {formatFinite(sarAnalysisResult.processing_threshold || -1.5, 1)} dB
                </span>
              </div>
            </div>

            <div className="text-[11px] text-hc-textSecondary bg-hc-surface/50 p-3 rounded-lg border border-hc-border flex items-start gap-2">
              <CheckCircle className="w-4 h-4 text-hc-success shrink-0 mt-0.5" />
              <div>
                <span className="text-hc-textSecondary font-medium">Sensor Limitations:</span> {sarAnalysisResult.cloud_radar_limitations || 'None, SAR penetrates clouds. Subject to layover/foreshortening in steep terrain.'}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
