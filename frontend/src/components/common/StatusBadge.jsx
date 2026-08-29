import React from 'react';

const STATUS_CONFIGS = {
  COMPLETED: {
    bg: 'bg-emerald-950/60',
    text: 'text-emerald-400',
    border: 'border-emerald-800/60',
    dot: 'bg-emerald-400',
    label: 'COMPLETED',
  },
  COMPLETED_ADAPTER: {
    bg: 'bg-emerald-950/60',
    text: 'text-emerald-400',
    border: 'border-emerald-800/60',
    dot: 'bg-emerald-400',
    label: 'COMPLETED',
  },
  RUNNING: {
    bg: 'bg-cyan-950/60',
    text: 'text-cyan-400',
    border: 'border-cyan-800/60',
    dot: 'bg-cyan-400 animate-pulse',
    label: 'RUNNING',
  },
  NOT_STARTED: {
    bg: 'bg-slate-900',
    text: 'text-slate-400',
    border: 'border-slate-800',
    dot: 'bg-slate-500',
    label: 'NOT STARTED',
  },
  NOT_RUN: {
    bg: 'bg-slate-900',
    text: 'text-slate-400',
    border: 'border-slate-800',
    dot: 'bg-slate-500',
    label: 'NOT RUN',
  },
  DATA_UNAVAILABLE: {
    bg: 'bg-slate-900',
    text: 'text-slate-500',
    border: 'border-slate-800',
    dot: 'bg-slate-600',
    label: 'DATA UNAVAILABLE',
  },
  FAILED: {
    bg: 'bg-red-950/60',
    text: 'text-red-400',
    border: 'border-red-800/60',
    dot: 'bg-red-400',
    label: 'FAILED',
  },
  INVALID: {
    bg: 'bg-amber-950/60',
    text: 'text-amber-400',
    border: 'border-amber-800/60',
    dot: 'bg-amber-400',
    label: 'INVALID',
  },
  WATCH: {
    bg: 'bg-amber-950/60',
    text: 'text-amber-400',
    border: 'border-amber-800/60',
    dot: 'bg-amber-400',
    label: 'WATCH',
  },
  HIGH: {
    bg: 'bg-red-950/60',
    text: 'text-red-400',
    border: 'border-red-800/60',
    dot: 'bg-red-400 animate-pulse',
    label: 'HIGH ALERT',
  },
  NORMAL: {
    bg: 'bg-emerald-950/60',
    text: 'text-emerald-400',
    border: 'border-emerald-800/60',
    dot: 'bg-emerald-400',
    label: 'NORMAL',
  },
  // Phase 1: Explicit Provenance Labels
  'DEMO / FIXTURE': {
    bg: 'bg-slate-800/80',
    text: 'text-slate-300',
    border: 'border-slate-600',
    dot: 'bg-slate-400',
    label: 'DEMO / FIXTURE',
  },
  'SCREENING MODEL': {
    bg: 'bg-amber-950/80',
    text: 'text-amber-400',
    border: 'border-amber-700/80',
    dot: 'bg-amber-400',
    label: 'SCREENING MODEL',
  },
  'REAL SPH RUN': {
    bg: 'bg-purple-950/80',
    text: 'text-purple-400',
    border: 'border-purple-700/80',
    dot: 'bg-purple-400 animate-pulse',
    label: 'REAL SPH RUN',
  },
  'REAL DELFT3D RUN': {
    bg: 'bg-indigo-950/80',
    text: 'text-indigo-400',
    border: 'border-indigo-700/80',
    dot: 'bg-indigo-400 animate-pulse',
    label: 'REAL DELFT3D RUN',
  },
  'OBSERVED SATELLITE': {
    bg: 'bg-sky-950/80',
    text: 'text-sky-400',
    border: 'border-sky-700/80',
    dot: 'bg-sky-400',
    label: 'OBSERVED SATELLITE',
  },
  'WHAT-IF SCENARIO': {
    bg: 'bg-rose-950/80',
    text: 'text-rose-400',
    border: 'border-rose-700/80',
    dot: 'bg-rose-400',
    label: 'WHAT-IF SCENARIO',
  },
};

export default function StatusBadge({ status = 'NOT_RUN', label, className = '' }) {
  const norm = (status || 'NOT_RUN').toUpperCase();
  // Try exact match first, then uppercase match
  const cfg = STATUS_CONFIGS[status] || STATUS_CONFIGS[norm] || STATUS_CONFIGS.NOT_RUN;

  const displayLabel = label || cfg.label;

  return (
    <span
      className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-mono font-medium border ${cfg.bg} ${cfg.text} ${cfg.border} ${className}`}
    >
      <span className={`w-1.5 h-1.5 rounded-full ${cfg.dot}`} />
      <span>{displayLabel}</span>
    </span>
  );
}
