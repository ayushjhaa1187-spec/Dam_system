import React, { useState } from 'react';
import {
  Bell,
  AlertTriangle,
  ShieldAlert,
  Clock,
  MapPin,
  CheckCircle2,
  Filter,
  Search,
  ExternalLink,
  ChevronRight,
  Sparkles,
} from 'lucide-react';
import PageHeader from '../components/common/PageHeader';

export const INITIAL_ALERTS = [
  {
    id: 'alt_01',
    severity: 'HIGH',
    title: 'High Risk Flood Zone — Ramban District',
    description: 'Modelled inundation depth exceeds 5.0 m threshold. Estimated arrival T+35 min from Chenab breach. Immediate evacuation required.',
    location: 'Ramban District, Chenab River Basin, J&K',
    timestamp: '10m ago',
    type: 'depth_exceedance',
    targetTab: 'analytics',
  },
  {
    id: 'alt_02',
    severity: 'HIGH',
    title: 'Dam Water Level High — Chenab Dam',
    description: 'Reservoir storage elevation near Full Reservoir Level (98% capacity). Real-time telemetry breach warning triggered.',
    location: 'Chenab Dam Axis, Kishtwar Sector, J&K',
    timestamp: '25m ago',
    type: 'storage_alert',
    targetTab: 'dashboard',
  },
  {
    id: 'alt_03',
    severity: 'HIGH',
    title: 'Kishtwar Sector — High Velocity Surge Alert',
    description: 'SPH 3D solver detects wave propagation velocity exceeding 18.5 m/s. NH-44 highway bridge structural danger.',
    location: 'Kishtwar Sector, Chenab Valley',
    timestamp: '30m ago',
    type: 'velocity_risk',
    targetTab: 'analytics',
  },
  {
    id: 'alt_04',
    severity: 'MEDIUM',
    title: 'Sentinel-1 SAR Surface Water Anomaly Alert',
    description: 'Automated change detection identified +420 ha surface water expansion in Doda flood plain relative to pre-flood baseline.',
    location: 'Doda Township, Chenab River Basin',
    timestamp: '1h ago',
    type: 'sar_anomaly',
    targetTab: 'data',
  },
  {
    id: 'alt_05',
    severity: 'LOW',
    title: 'Catchment Monsoonal Rainfall Inflow Watch',
    description: 'IMD GFS ensemble projects 65 mm / 24h precipitation in upper Himalayan headwaters over next 48 hours.',
    location: 'Upper Chenab Himalayan Catchment',
    timestamp: '2h ago',
    type: 'rainfall_watch',
    targetTab: 'modeling',
  },
];

export default function AlertsScreen({ onNavigate }) {
  const [alerts, setAlerts] = useState(INITIAL_ALERTS);
  const [filterSeverity, setFilterSeverity] = useState('ALL');
  const [searchQuery, setSearchQuery] = useState('');

  const filteredAlerts = alerts.filter((a) => {
    const matchesSeverity = filterSeverity === 'ALL' || a.severity === filterSeverity;
    const matchesSearch =
      a.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      a.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      a.location.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesSeverity && matchesSearch;
  });

  return (
    <div className="p-6 sm:p-8 max-w-5xl mx-auto space-y-6 text-hc-ink">
      {/* Header */}
      <PageHeader
        category="EARLY WARNING DISPATCH &bull; EMERGENCY OPERATIONS"
        title="Alerts &amp; Real-Time Hazard Notifications"
        subtitle="Automated threshold breach detections, reservoir capacity alarms, and SAR satellite surface water anomaly triggers."
        status="ACTIVE"
        statusLabel="3 ACTIVE HIGH/MED ALERTS"
      />

      {/* Filter and Search Bar */}
      <div className="bg-hc-surface border border-hc-border rounded-2xl p-4 flex flex-wrap items-center justify-between gap-4 shadow-card-dark">
        <div className="flex items-center space-x-2">
          <Filter className="w-4 h-4 text-hc-textSecondary" />
          <div className="flex space-x-1">
            {['ALL', 'HIGH', 'MEDIUM', 'LOW'].map((sev) => (
              <button
                key={sev}
                onClick={() => setFilterSeverity(sev)}
                className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition ${
                  filterSeverity === sev
                    ? 'bg-blue-600 text-white shadow-sm'
                    : 'bg-hc-card text-hc-textSecondary hover:text-hc-ink border border-hc-border'
                }`}
              >
                {sev === 'ALL' ? 'All Alerts' : sev}
              </button>
            ))}
          </div>
        </div>

        <div className="relative w-64">
          <input
            type="text"
            placeholder="Search alerts..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-white border border-slate-300 text-xs text-slate-900 rounded-xl pl-8 pr-3 py-1.5 focus:outline-none focus:border-blue-500 shadow-xs"
          />
          <Search className="w-3.5 h-3.5 text-hc-textSecondary absolute left-2.5 top-1/2 -translate-y-1/2" />
        </div>
      </div>

      {/* Alerts Feed */}
      <div className="space-y-3.5">
        {filteredAlerts.map((alt) => {
          const isHigh = alt.severity === 'HIGH';
          const isMed = alt.severity === 'MEDIUM';

          return (
            <div
              key={alt.id}
              onClick={() => onNavigate && onNavigate(alt.targetTab)}
              className={`p-4 rounded-2xl border transition cursor-pointer flex items-center justify-between gap-4 shadow-card-dark ${
                isHigh
                  ? 'bg-red-50/70 border-red-200 hover:bg-red-100/70'
                  : isMed
                  ? 'bg-amber-50/70 border-amber-200 hover:bg-amber-100/70'
                  : 'bg-hc-surface border-hc-border hover:border-slate-300'
              }`}
            >
              <div className="flex items-start space-x-3.5">
                <div
                  className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 border ${
                    isHigh
                      ? 'bg-red-100 border-red-300 text-red-600'
                      : isMed
                      ? 'bg-amber-100 border-amber-300 text-amber-600'
                      : 'bg-blue-100 border-blue-300 text-blue-600'
                  }`}
                >
                  <ShieldAlert className="w-4 h-4" />
                </div>

                <div className="space-y-1">
                  <div className="flex items-center space-x-2">
                    <span
                      className={`text-[9px] font-mono font-bold px-1.5 py-0.5 rounded border ${
                        isHigh
                          ? 'bg-red-100 text-red-700 border-red-300'
                          : isMed
                          ? 'bg-amber-100 text-amber-800 border-amber-300'
                          : 'bg-blue-100 text-blue-800 border-blue-300'
                      }`}
                    >
                      {alt.severity}
                    </span>
                    <h3 className="text-xs font-bold text-hc-ink">{alt.title}</h3>
                  </div>

                  <p className="text-xs text-hc-textSecondary leading-relaxed">{alt.description}</p>

                  <div className="flex items-center space-x-4 text-[10px] font-mono text-hc-textMuted pt-1">
                    <span className="flex items-center space-x-1">
                      <MapPin className="w-3 h-3 text-hc-textSecondary" />
                      <span>{alt.location}</span>
                    </span>
                    <span className="flex items-center space-x-1">
                      <Clock className="w-3 h-3 text-hc-textSecondary" />
                      <span>{alt.timestamp}</span>
                    </span>
                  </div>
                </div>
              </div>

              <div className="flex items-center space-x-1.5 text-xs font-semibold text-blue-700 shrink-0">
                <span>Inspect</span>
                <ChevronRight className="w-4 h-4 text-blue-600" />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
