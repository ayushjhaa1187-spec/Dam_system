import React from 'react';
import {
  MapPin,
  Clock,
  Users,
  ShieldAlert,
  Navigation,
  CheckCircle2,
  AlertTriangle,
  Building,
  ArrowRight,
} from 'lucide-react';
import Drawer from '../common/Drawer';
import StatusBadge from '../common/StatusBadge';
import ProvenanceBadge from '../common/ProvenanceBadge';
import { formatFinite } from '../../utils/units';

export default function SettlementDetailsDrawer({
  isOpen,
  onClose,
  settlement,
  onSelectRoute,
}) {
  if (!settlement) return null;

  return (
    <Drawer
      isOpen={isOpen}
      onClose={onClose}
      title={settlement.settlement_name || settlement.name || 'Settlement Exposure'}
      subtitle={`Chainage: ${formatFinite(settlement.chainage_km || 22.0, 1)} km &bull; Valley Gorge Sector`}
      width="max-w-lg"
    >
      <div className="space-y-6 text-xs">
        {/* Core Risk Banner */}
        <div className="p-4 rounded-xl bg-hc-bg border border-hc-border space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-hc-textSecondary">Tactical Risk Level</span>
            <span className="font-mono font-bold text-hc-critical">
              {settlement.risk_level || 'CRITICAL'} (Rank #{settlement.priority_rank || 1})
            </span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-hc-textSecondary">Flood Wave Arrival Window</span>
            <span className="font-mono text-amber-400 font-semibold">
              {settlement.expected_arrival_window || settlement.lead_time_min || '< 35 min'}
            </span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-hc-textSecondary">Peak Modelled Depth Range</span>
            <span className="font-mono text-hc-active">
              {settlement.max_depth_range_m || settlement.depth_range || '18.0 – 28.5 m'}
            </span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-hc-textSecondary">Exposed Population</span>
            <span className="font-mono font-semibold text-hc-ink">
              {formatFinite(settlement.exposed_population || settlement.population_exposed || 4200, 0)} residents
            </span>
          </div>
        </div>

        {/* Tactical Evacuation Directive */}
        <div className="p-4 rounded-xl bg-red-950/20 border border-red-800/40 space-y-1.5">
          <div className="flex items-center gap-1.5 text-hc-critical font-semibold">
            <ShieldAlert className="w-4 h-4" />
            <span>Evacuation Directive</span>
          </div>
          <p className="text-hc-textSecondary leading-relaxed">
            {settlement.action_required || settlement.action || 'Execute forced evacuation to high-elevation ridge shelters.'}
          </p>
        </div>

        {/* Assigned Relief Shelters */}
        <div className="space-y-2">
          <span className="font-semibold text-hc-ink uppercase font-mono text-[11px] block">
            Designated High-Ground Safe Shelters
          </span>
          <div className="space-y-2">
            {[
              { name: 'Government Intermediate College Ridge', cap: '1,500 persons', elev: '+140m MSL relative', dist: '1.4 km' },
              { name: 'Block Community Development Center', cap: '2,800 persons', elev: '+95m MSL relative', dist: '2.1 km' },
            ].map((sh, idx) => (
              <div
                key={idx}
                className="p-3 rounded-xl bg-hc-bg/70 border border-hc-border flex items-start justify-between gap-2"
              >
                <div>
                  <span className="font-medium text-hc-ink block">{sh.name}</span>
                  <span className="text-[11px] text-hc-textSecondary font-mono">{sh.elev} &bull; Capacity: {sh.cap}</span>
                </div>
                <span className="text-hc-active font-mono text-[11px] shrink-0">{sh.dist}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Road Inundation Thresholds */}
        <div className="p-3.5 rounded-xl bg-hc-bg/70 border border-hc-border space-y-2">
          <span className="font-semibold text-hc-ink uppercase font-mono text-[11px] block">
            Lifeline Highway Traversability (NH-58)
          </span>
          <div className="flex items-center justify-between text-[11px]">
            <span className="text-hc-textSecondary">Primary Highway Link</span>
            <span className="text-hc-critical font-mono font-semibold">INUNDATED (&gt; 1.5m depth)</span>
          </div>
          <div className="flex items-center justify-between text-[11px]">
            <span className="text-hc-textSecondary">Secondary Ridge Bypass</span>
            <span className="text-hc-success font-mono font-semibold">CLEAR (Safe Corridor)</span>
          </div>
        </div>
      </div>
    </Drawer>
  );
}
