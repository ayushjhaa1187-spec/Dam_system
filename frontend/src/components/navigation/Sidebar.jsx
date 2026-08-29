import React from 'react';
import { motion } from 'framer-motion';
import {
  LayoutDashboard,
  PlusCircle,
  Activity,
  Map,
  Download,
  Layers,
  Sparkles,
  Keyboard,
  ChevronLeft,
  ChevronRight,
  Waves,
} from 'lucide-react';

const MAIN_NAV = [
  { id: 'home', label: '1. Home / Case Studies', icon: LayoutDashboard },
  { id: 'create', label: '2. Create Scenario', icon: PlusCircle },
  { id: 'monitor', label: '3. Run Monitor', icon: Activity },
  { id: 'results', label: '4. Results Map', icon: Map },
  { id: 'impact', label: '5. Impact & Export', icon: Download },
];

export default function Sidebar({
  activeTab,
  onSelectTab,
  isCollapsed,
  onToggleCollapse,
  onOpenDem,
  onOpenTutorial,
  onOpenShortcuts,
}) {
  return (
    <motion.aside
      animate={{ width: isCollapsed ? 72 : 240 }}
      transition={{ duration: 0.2, ease: 'easeInOut' }}
      className="h-screen bg-hc-bg border-r border-hc-border/80 flex flex-col justify-between shrink-0 select-none z-30 sticky top-0"
    >
      {/* Brand Header */}
      <div>
        <div className="h-16 px-4 flex items-center justify-between border-b border-hc-border/80">
          <div className="flex items-center gap-3 overflow-hidden">
            <div className="w-8 h-8 rounded-xl bg-hc-active/10 border border-cyan-500/30 flex items-center justify-center text-hc-active shrink-0">
              <Waves className="w-4 h-4" />
            </div>
            {!isCollapsed && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="flex flex-col"
              >
                <span className="font-bold text-sm tracking-wide text-hc-ink font-mono">
                  HYDRO<span className="text-hc-active">COMMAND</span>
                </span>
                <span className="text-[10px] text-hc-textSecondary tracking-wider uppercase font-medium">
                  Gov / HADR Dashboard
                </span>
              </motion.div>
            )}
          </div>
        </div>

        {/* 5 Product Screens Navigation List */}
        <div className="p-3 space-y-1">
          <div className="px-3 py-1.5 text-[10px] font-mono uppercase tracking-wider text-hc-textSecondary font-semibold">
            {!isCollapsed && 'Product Screens'}
          </div>
          {MAIN_NAV.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => onSelectTab(item.id)}
                title={isCollapsed ? item.label : undefined}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-medium transition-colors ${
                  isActive
                    ? 'bg-hc-active/10 text-hc-active border border-cyan-500/20 font-semibold shadow-sm'
                    : 'text-hc-textSecondary hover:text-hc-ink hover:bg-hc-surface/60'
                }`}
              >
                <Icon className={`w-4 h-4 shrink-0 ${isActive ? 'text-hc-active' : 'text-hc-textSecondary'}`} />
                {!isCollapsed && <span className="truncate">{item.label}</span>}
              </button>
            );
          })}
        </div>

        {/* Secondary Utilities */}
        <div className="p-3 space-y-1 border-t border-hc-border">
          <div className="px-3 py-1.5 text-[10px] font-mono uppercase tracking-wider text-hc-textSecondary font-semibold">
            {!isCollapsed && 'System Utilities'}
          </div>

          <button
            onClick={onOpenTutorial}
            title={isCollapsed ? 'Tutorial Guide' : undefined}
            className="w-full flex items-center gap-3 px-3 py-2 rounded-xl text-xs font-medium text-hc-textSecondary hover:text-hc-ink hover:bg-hc-surface/60 transition-colors"
          >
            <Sparkles className="w-4 h-4 shrink-0 text-hc-active" />
            {!isCollapsed && <span className="truncate">Tutorial Guide</span>}
          </button>

          <button
            onClick={onOpenDem}
            title={isCollapsed ? 'Terrain & DEM' : undefined}
            className="w-full flex items-center gap-3 px-3 py-2 rounded-xl text-xs font-medium text-hc-textSecondary hover:text-hc-ink hover:bg-hc-surface/60 transition-colors"
          >
            <Layers className="w-4 h-4 shrink-0 text-hc-assumption" />
            {!isCollapsed && <span className="truncate">Terrain Profile</span>}
          </button>

          <button
            onClick={onOpenShortcuts}
            title={isCollapsed ? 'Keyboard Shortcuts' : undefined}
            className="w-full flex items-center gap-3 px-3 py-2 rounded-xl text-xs font-medium text-hc-textSecondary hover:text-hc-ink hover:bg-hc-surface/60 transition-colors"
          >
            <Keyboard className="w-4 h-4 shrink-0 text-amber-400" />
            {!isCollapsed && <span className="truncate">Keyboard Shortcuts</span>}
          </button>
        </div>
      </div>

      {/* Footer Collapse Toggle & Telemetry */}
      <div className="p-3 border-t border-hc-border/80 bg-hc-bg space-y-2">
        {!isCollapsed && (
          <div className="p-2.5 rounded-xl bg-hc-surface/60 border border-hc-border/80 space-y-1">
            <div className="flex items-center justify-between text-[10px]">
              <span className="text-hc-textSecondary font-mono">TELEMETRY LINK</span>
              <span className="inline-flex items-center gap-1 text-hc-success font-mono">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                ACTIVE
              </span>
            </div>
            <p className="text-[11px] text-hc-textSecondary font-medium">Himalayan Reach PostGIS</p>
          </div>
        )}

        <button
          onClick={onToggleCollapse}
          className="w-full flex items-center justify-center p-2 rounded-xl bg-hc-surface hover:bg-hc-secondary text-hc-textSecondary hover:text-hc-ink transition text-xs"
          title={isCollapsed ? 'Expand Sidebar' : 'Collapse Sidebar'}
        >
          {isCollapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
        </button>
      </div>
    </motion.aside>
  );
}
