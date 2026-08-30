import React, { useState } from 'react';
import {
  Bell,
  ShieldAlert,
  AlertTriangle,
  CheckCircle2,
  Filter,
  MapPin,
  Clock,
  ArrowRight,
  Waves,
  Search,
} from 'lucide-react';
import PageHeader from '../components/common/PageHeader';

export const INITIAL_ALERTS = [
  {
    id: 'alt_01',
    severity: 'HIGH',
    title: 'High Risk Flood Zone — Ramban District',
    description: 'Modelled inundation depth exceeds 5.0m threshold in low-lying settlement belt.',
    location: 'Ramban, Chenab River Basin',
    timestamp: '10m ago',
    type: 'depth_exceedance',
    targetTab: 'analytics',
  },
  {
    id: 'alt_02',
    severity: 'MEDIUM',
    title: 'Dam Water Level High — Chenab Dam',
    description: 'Reservoir storage elevation reached 98% Full Reservoir Level (FRL).',
    location: 'Chenab Dam Axis, J&K',
    timestamp: '25m ago',
    type: 'storage_alert',
    targetTab: 'dashboard',
  },
  {
    id: 'alt_03',
    severity: 'LOW',
    title: 'Road Inundated — NH-44 Blocked',
    description: 'Expected water level rise on NH-44 highway embankment bypass corridor.',
    location: 'NH-44 Corridor, Km 42.5',
    timestamp: '1h ago',
    type: 'infrastructure_block',
    targetTab: 'reports',
  },
  {
    id: 'alt_04',
    severity: 'HIGH',
    title: 'GLOF Lake Perimeter Expanding — Rishi Ganga Proxy',
    description: 'Sentinel-1 SAR detected 14.8 ha surface water ponding behind landslide blockage.',
    location: 'Chamoli, Uttarakhand',
    timestamp: '2h ago',
    type: 'sar_anomaly',
    targetTab: 'satellite',
  },
  {
    id: 'alt_05',
    severity: 'MEDIUM',
    title: 'Devprayag Confluence Surge Warning',
    description: 'Alaknanda-Bhagirathi sangam stage elevation predicted to rise +8.4m at T+1.2h.',
    location: 'Devprayag Sangam',
    timestamp: '3h ago',
    type: 'surge_wave',
    targetTab: 'analytics',
  },
];

export default function AlertsScreen({ onNavigate }) {
  const [filter, setFilter] = useState('ALL');
  const [searchQuery, setSearchQuery] = useState('');

  const filteredAlerts = INITIAL_ALERTS.filter((a) => {
    if (filter !== 'ALL' && a.severity !== filter) return false;
    if (searchQuery && !a.title.toLowerCase().includes(searchQuery.toLowerCase()) && !a.description.toLowerCase().includes(searchQuery.toLowerCase())) {
      return false;
    }
    return true;
  });

  return (
    <div className="p-6 sm:p-8 max-w-5xl mx-auto space-y-6 text-hc-ink">
      {/* Header */}
      <PageHeader
        category="EARLY WARNING DISPATCH &bull; EMERGENCY OPERATIONS"
        title="Alerts &amp; Real-Time Hazard Notifications"
        subtitle="Automated threshold breach detections, reservoir capacity alarms, and SAR satellite surface water anomaly triggers."
        status="WATCH"
        statusLabel="3 ACTIVE HIGH/MED ALERTS"
      />

      {/* Filter and Search Bar */}
      <div className="bg-hc-surface/90 border border-hc-border rounded-2xl p-4 flex flex-wrap items-center justify-between gap-4">
        {/* Severity Filter Chips */}
        <div className="flex items-center space-x-2">
          <Filter className="w-4 h-4 text-hc-textSecondary" />
          <div className="flex space-x-1">
            {['ALL', 'HIGH', 'MEDIUM', 'LOW'].map((lvl) => {
              const isActive = filter === lvl;
              return (
                <button
                  key={lvl}
                  onClick={() => setFilter(lvl)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition ${
                    isActive
                      ? 'bg-blue-600 text-white shadow-sm'
                      : 'bg-hc-card text-hc-textSecondary hover:text-hc-ink border border-hc-border'
                  }`}
                >
                  {lvl === 'ALL' ? 'All Alerts' : `${lvl}`}
                </button>
              );
            })}
          </div>
        </div>

        {/* Search */}
        <div className="relative w-64">
          <input
            type="text"
            placeholder="Search alerts..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-hc-canvas border border-hc-border text-xs text-hc-ink rounded-xl pl-8 pr-3 py-1.5 focus:outline-none focus:border-cyan-500"
          />
          <Search className="w-3.5 h-3.5 text-hc-textSecondary absolute left-2.5 top-1/2 -translate-y-1/2" />
        </div>
      </div>

      {/* Alerts Feed */}
      <div className="space-y-3.5">
        {filteredAlerts.map((alert) => {
          const isHigh = alert.severity === 'HIGH';
          const isMed = alert.severity === 'MEDIUM';

          return (
            <div
              key={alert.id}
              onClick={() => onNavigate && onNavigate(alert.targetTab || 'analytics')}
              className={`p-4 rounded-2xl border transition cursor-pointer flex items-center justify-between gap-4 ${
                isHigh
                  ? 'bg-red-950/20 border-red-800/60 hover:bg-red-950/30'
                  : isMed
                  ? 'bg-amber-950/20 border-amber-800/60 hover:bg-amber-950/30'
                  : 'bg-emerald-950/20 border-emerald-800/60 hover:bg-emerald-950/30'
              }`}
            >
              <div className="flex items-start space-x-3.5">
                <div
                  className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 border ${
                    isHigh
                      ? 'bg-red-900/40 border-red-700 text-red-400'
                      : isMed
                      ? 'bg-amber-900/40 border-amber-700 text-amber-400'
                      : 'bg-emerald-900/40 border-emerald-700 text-emerald-400'
                  }`}
                >
                  <ShieldAlert className="w-4 h-4" />
                </div>

                <div className="space-y-1">
                  <div className="flex items-center space-x-2.5">
                    <h4 className="text-xs font-bold text-hc-ink">{alert.title}</h4>
                    <span
                      className={`text-[9px] font-mono font-bold px-2 py-0.5 rounded-full ${
                        isHigh
                          ? 'bg-red-950 text-red-300 border border-red-800'
                          : isMed
                          ? 'bg-amber-950 text-amber-300 border border-amber-800'
                          : 'bg-emerald-950 text-emerald-300 border border-emerald-800'
                      }`}
                    >
                      {alert.severity}
                    </span>
                  </div>

                  <p className="text-xs text-hc-textSecondary leading-relaxed">
                    {alert.description}
                  </p>

                  <div className="flex items-center space-x-4 text-[10px] font-mono text-hc-textMuted pt-1">
                    <span className="flex items-center gap-1">
                      <MapPin className="w-3 h-3 text-cyan-400" />
                      {alert.location}
                    </span>
                    <span className="flex items-center gap-1">
                      <Clock className="w-3 h-3 text-amber-400" />
                      {alert.timestamp}
                    </span>
                  </div>
                </div>
              </div>

              <button className="px-3 py-1.5 rounded-xl bg-hc-surface hover:bg-hc-elevated border border-hc-border text-xs font-semibold text-hc-ink shrink-0 flex items-center space-x-1">
                <span>Inspect</span>
                <ArrowRight className="w-3 h-3" />
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
}
