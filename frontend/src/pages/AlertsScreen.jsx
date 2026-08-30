import React, { useState } from "react";
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
} from "lucide-react";
import PageHeader from "../components/common/PageHeader";

export const INITIAL_ALERTS = [
  {
    id: "alt_01",
    severity: "HIGH",
    title: "High Risk Flood Zone — Rishikesh Town",
    description: "Modelled inundation depth exceeds 5.0 m threshold. Estimated arrival T+118 min from Tehri breach. Immediate preparedness required.",
    location: "Rishikesh Town, Bhagirathi River, Uttarakhand",
    timestamp: "10m ago",
    type: "depth_exceedance",
    targetTab: "analytics",
  },
  {
    id: "alt_02",
    severity: "HIGH",
    title: "Tehri Reservoir Level Critical — 95% FRL",
    description: "Reservoir storage elevation near Full Reservoir Level (FRL). What-if breach scenario activated. HADR on standby.",
    location: "Tehri Dam, Bhagirathi River, Uttarakhand",
    timestamp: "25m ago",
    type: "storage_alert",
    targetTab: "dashboard",
  },
  {
    id: "alt_03",
    severity: "HIGH",
    title: "Koteshwar Dam — Cascade Risk Alert",
    description: "Koteshwar Dam (22 km downstream) in direct inundation path. Estimated flood wave arrival: T+32 min. Max depth: 42 m.",
    location: "Koteshwar Dam, Bhagirathi River",
    timestamp: "30m ago",
    type: "cascade_risk",
    targetTab: "analytics",
  },
  {
    id: "alt_04",
    severity: "MEDIUM",
    title: "Devprayag Confluence Surge Warning",
    description: "Alaknanda-Bhagirathi sangam stage elevation predicted to rise +28.5 m at T+68 min. Population: ~4,500 at risk.",
    location: "Devprayag Sangam, Uttarakhand",
    timestamp: "1h ago",
    type: "surge_wave",
    targetTab: "analytics",
  },
  {
    id: "alt_05",
    severity: "LOW",
    title: "Haridwar Plains — Advance Warning",
    description: "Flood wave expected at Haridwar at T+175 min. Depth: 9.4 m. Advance evacuation of riverbank areas recommended.",
    location: "Haridwar, Uttarakhand",
    timestamp: "2h ago",
    type: "advance_warning",
    targetTab: "reports",
  },
];

export default function AlertsScreen({ onNavigate }) {
  const [filter, setFilter] = useState("ALL");
  const [searchQuery, setSearchQuery] = useState("");

  const filteredAlerts = INITIAL_ALERTS.filter((a) => {
    if (filter !== "ALL" && a.severity !== filter) return false;
    if (
      searchQuery &&
      !a.title.toLowerCase().includes(searchQuery.toLowerCase()) &&
      !a.description.toLowerCase().includes(searchQuery.toLowerCase())
    ) {
      return false;
    }
    return true;
  });

  return (
    <div className="p-6 sm:p-8 max-w-5xl mx-auto space-y-6 text-hc-ink">
      <PageHeader
        category="INCIDENT RESPONSE &bull; NOTIFICATION CENTER"
        title="Alerts &amp; Real-Time Hazard Notifications"
        subtitle="Automated warning dispatches triggered by telemetry thresholds, SPH/Delft3D inundation depth exceedances, and GEE anomalies."
        status="ACTIVE"
        statusLabel="5 UNRESOLVED ALERTS"
      />

      {/* Filter and Search Bar */}
      <div className="flex flex-wrap items-center justify-between gap-4 bg-hc-surface border border-hc-border rounded-2xl p-4 shadow-card-dark">
        <div className="flex items-center space-x-2">
          <Filter className="w-4 h-4 text-hc-textSecondary" />
          <span className="text-xs font-bold uppercase tracking-wider text-hc-textSecondary">Severity:</span>
          {["ALL", "HIGH", "MEDIUM", "LOW"].map((lvl) => (
            <button
              key={lvl}
              onClick={() => setFilter(lvl)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition ${
                filter === lvl
                  ? lvl === "HIGH"
                    ? "bg-red-600 text-white"
                    : lvl === "MEDIUM"
                    ? "bg-amber-600 text-white"
                    : lvl === "LOW"
                    ? "bg-blue-600 text-white"
                    : "bg-hc-active text-black"
                  : "bg-hc-card hover:bg-slate-200 border border-hc-border text-hc-textSecondary"
              }`}
            >
              {lvl}
            </button>
          ))}
        </div>

        <div className="relative flex-1 max-w-xs">
          <Search className="w-4 h-4 text-hc-textSecondary absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search alerts..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-4 py-1.5 rounded-xl bg-hc-card border border-hc-border text-xs text-hc-ink focus:outline-none focus:border-hc-active placeholder-hc-textMuted"
          />
        </div>
      </div>

      {/* Alert Feed Cards */}
      <div className="space-y-3.5">
        {filteredAlerts.map((alt) => {
          const isHigh = alt.severity === "HIGH";
          const isMed = alt.severity === "MEDIUM";

          return (
            <div
              key={alt.id}
              onClick={() => alt.targetTab && onNavigate && onNavigate(alt.targetTab)}
              className={`p-4 rounded-2xl border transition cursor-pointer flex items-center justify-between gap-4 shadow-card-dark ${
                isHigh
                  ? "bg-red-50/70 border-red-200 hover:bg-red-100/70"
                  : isMed
                  ? "bg-amber-50/70 border-amber-200 hover:bg-amber-100/70"
                  : "bg-hc-surface border-hc-border hover:bg-hc-card"
              }`}
            >
              <div className="flex items-start space-x-3.5">
                <div
                  className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 border ${
                    isHigh
                      ? "bg-red-100 border-red-300 text-red-600"
                      : isMed
                      ? "bg-amber-100 border-amber-300 text-amber-600"
                      : "bg-blue-100 border-blue-300 text-blue-600"
                  }`}
                >
                  {isHigh ? (
                    <ShieldAlert className="w-4 h-4" />
                  ) : (
                    <AlertTriangle className="w-4 h-4" />
                  )}
                </div>

                <div className="space-y-1">
                  <div className="flex items-center space-x-2.5">
                    <span
                      className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded-md uppercase ${
                        isHigh
                          ? "bg-red-600 text-white"
                          : isMed
                          ? "bg-amber-600 text-white"
                          : "bg-blue-600 text-white"
                      }`}
                    >
                      {alt.severity} RISK
                    </span>
                    <h3 className="text-xs font-bold text-hc-ink">{alt.title}</h3>
                  </div>

                  <p className="text-xs text-hc-textSecondary leading-relaxed">
                    {alt.description}
                  </p>

                  <div className="flex items-center space-x-4 text-[10px] font-mono text-hc-textMuted pt-1">
                    <span className="flex items-center space-x-1">
                      <MapPin className="w-3 h-3 text-hc-active" />
                      <span>{alt.location}</span>
                    </span>
                    <span className="flex items-center space-x-1">
                      <Clock className="w-3 h-3" />
                      <span>{alt.timestamp}</span>
                    </span>
                  </div>
                </div>
              </div>

              <div className="flex items-center space-x-2 text-hc-textSecondary shrink-0">
                <span className="text-[11px] font-semibold hidden sm:inline">Inspect</span>
                <ChevronRight className="w-4 h-4" />
              </div>
            </div>
          );
        })}

        {filteredAlerts.length === 0 && (
          <div className="p-8 text-center bg-hc-surface border border-hc-border rounded-2xl space-y-2">
            <CheckCircle2 className="w-8 h-8 text-emerald-600 mx-auto" />
            <p className="text-xs font-bold text-hc-ink">No alerts found matching filter criteria.</p>
          </div>
        )}
      </div>
    </div>
  );
}
