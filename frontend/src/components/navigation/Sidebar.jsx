import React from 'react';
import { motion } from 'framer-motion';
import {
  LayoutDashboard,
  Waves,
  Database,
  Activity,
  Map,
  ShieldAlert,
  FolderGit2,
  Sliders,
  ChevronLeft,
  ChevronRight,
  Sparkles,
  Layers,
  Keyboard,
} from 'lucide-react';

export const SIDEBAR_NAV = [
  { id: 'overview', label: 'Overview', icon: LayoutDashboard },
  { id: 'predictor', label: 'AI Predictor', icon: Sparkles },
  { id: 'rivers', label: 'River Basins', icon: Waves },
  { id: 'dams', label: 'Dam & Reservoirs', icon: Database },
  { id: 'simulations', label: 'Simulations', icon: Activity },
  { id: 'hazard_maps', label: 'Hazard Maps', icon: Map },
  { id: 'alerts', label: 'Alerts', icon: ShieldAlert },
  { id: 'data_sources', label: 'Data Sources', icon: FolderGit2 },
  { id: 'settings', label: 'Settings', icon: Sliders },
];

export default function Sidebar({
  activeSidebarItem = 'overview',
  onSelectSidebarItem,
  isCollapsed,
  onToggleCollapse,
  onOpenTutorial,
  onOpenShortcuts,
}) {
  return (
    <motion.aside
      animate={{ width: isCollapsed ? 68 : 230 }}
      transition={{ duration: 0.2, ease: 'easeInOut' }}
      className="h-screen bg-hc-canvas border-r border-hc-border flex flex-col justify-between shrink-0 select-none z-30 sticky top-0"
    >
      {/* Brand & Navigation List */}
      <div>
        {/* Sidebar Brand Top */}
        <div className="h-16 px-4 flex items-center justify-between border-b border-hc-border">
          <div className="flex items-center gap-3 overflow-hidden">
            <div className="w-8 h-8 rounded-xl bg-blue-600/20 border border-blue-500/30 flex items-center justify-center text-hc-active shrink-0 shadow-sm">
              <Waves className="w-4 h-4" />
            </div>
            {!isCollapsed && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="flex flex-col"
              >
                <span className="font-extrabold text-xs tracking-wider text-hc-ink font-mono">
                  HYDRO<span className="text-hc-active">SHIELD</span>
                </span>
                <span className="text-[9px] text-hc-textSecondary tracking-wider uppercase font-medium">
                  Modelling Platform
                </span>
              </motion.div>
            )}
          </div>
        </div>

        {/* 8 Core Sidebar Navigation Items */}
        <div className="p-3 space-y-1">
          <div className="px-3 py-1 text-[10px] font-mono uppercase tracking-wider text-hc-textMuted font-semibold">
            {!isCollapsed && 'Navigation'}
          </div>

          {SIDEBAR_NAV.map((item) => {
            const Icon = item.icon;
            const isActive = activeSidebarItem === item.id;
            return (
              <button
                key={item.id}
                onClick={() => onSelectSidebarItem(item.id)}
                title={isCollapsed ? item.label : undefined}
                className={`w-full flex items-center gap-3 px-3 py-2 rounded-xl text-xs font-medium transition-all ${
                  isActive
                    ? 'bg-blue-600 text-white font-semibold shadow-glow-blue'
                    : 'text-hc-textSecondary hover:text-hc-ink hover:bg-hc-card'
                }`}
              >
                <Icon className={`w-4 h-4 shrink-0 ${isActive ? 'text-white' : 'text-hc-textSecondary'}`} />
                {!isCollapsed && <span className="truncate">{item.label}</span>}
              </button>
            );
          })}
        </div>
      </div>

      {/* Footer Collapse Toggle & Telemetry */}
      <div className="p-3 border-t border-hc-border bg-hc-canvas space-y-2">
        {!isCollapsed && (
          <div className="p-2.5 rounded-xl bg-hc-card border border-hc-border space-y-1">
            <div className="flex items-center justify-between text-[10px]">
              <span className="text-hc-textSecondary font-mono">TELEMETRY LINK</span>
              <span className="inline-flex items-center gap-1 text-emerald-600 font-mono text-[9px] font-bold">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                ACTIVE
              </span>
            </div>
            <p className="text-[10px] text-hc-textSecondary font-mono truncate">Himalayan Reach PostGIS</p>
          </div>
        )}

        <button
          onClick={onToggleCollapse}
          className="w-full flex items-center justify-center p-2 rounded-xl bg-hc-surface hover:bg-hc-elevated text-hc-textSecondary hover:text-hc-ink transition text-xs border border-hc-border"
          title={isCollapsed ? 'Expand Sidebar' : 'Collapse Sidebar'}
        >
          {isCollapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
        </button>
      </div>
    </motion.aside>
  );
}

