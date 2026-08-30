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
      <div className="bg-hc-surface border border-hc-border rounded-2xl p-4 flex flex-wrap items-center justify-between gap-4 shadow-card-dark">
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
            className="w-full bg-white border border-slate-300 text-xs text-slate-900 rounded-xl pl-8 pr-3 py-1.5 focus:outline-none focus:border-blue-500 shadow-xs"
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
              className={`p-4 rounded-2xl border transition cursor-pointer flex items-center justify-between gap-4 shadow-card-dark ${
                isHigh
                  ? 'bg-red-50/70 border-red-200 hover:bg-red-100/70'
                  : isMed
                  ? 'bg-amber-50/70 border-amber-200 hover:bg-amber-100/70'
                  : 'bg-emerald-50/70 border-emerald-200 hover:bg-emerald-100/70'
              }`}
            >
              <div className="flex items-start space-x-3.5">
                <div
                  className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 border ${
                    isHigh
                      ? 'bg-red-100 border-red-300 text-red-600'
                      : isMed
                      ? 'bg-amber-100 border-amber-300 text-amber-800'
                      : 'bg-emerald-100 border-emerald-300 text-emerald-700'
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
                          ? 'bg-red-100 text-red-800 border border-red-300'
                          : isMed
                          ? 'bg-amber-100 text-amber-800 border border-amber-300'
                          : 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                      }`}
                    >
                      {alert.severity}
                    </span>
                  </div>

                  <p className="text-xs text-hc-textSecondary leading-relaxed">
                    {alert.description}
                  </p>

                  <div className="flex items-center space-x-4 text-[10px] font-mono text-hc-textMuted pt-1">
                    <span className="flex items-center gap-1 font-semibold">
                      <MapPin className="w-3 h-3 text-blue-600" />
                      {alert.location}
                    </span>
                    <span className="flex items-center gap-1 font-semibold">
                      <Clock className="w-3 h-3 text-amber-700" />
                      {alert.timestamp}
                    </span>
                  </div>
                </div>
              </div>

              <button className="px-3 py-1.5 rounded-xl bg-white hover:bg-slate-100 border border-slate-200 text-xs font-semibold text-slate-900 shrink-0 flex items-center space-x-1 shadow-xs">
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
