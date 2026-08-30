import React from 'react';

const STATUS_CONFIGS = {
  COMPLETED: {
    bg: 'bg-emerald-50',
    text: 'text-emerald-700',
    border: 'border-emerald-200',
    dot: 'bg-emerald-500',
    label: 'COMPLETED',
  },
  COMPLETED_ADAPTER: {
    bg: 'bg-emerald-50',
    text: 'text-emerald-700',
    border: 'border-emerald-200',
    dot: 'bg-emerald-500',
    label: 'COMPLETED',
  },
  RUNNING: {
    bg: 'bg-sky-50',
    text: 'text-sky-700',
    border: 'border-sky-200',
    dot: 'bg-sky-500 animate-pulse',
    label: 'RUNNING',
  },
  NOT_STARTED: {
    bg: 'bg-slate-50',
    text: 'text-slate-600',
    border: 'border-slate-200',
    dot: 'bg-slate-400',
    label: 'NOT STARTED',
  },
  NOT_RUN: {
    bg: 'bg-slate-50',
    text: 'text-slate-600',
    border: 'border-slate-200',
    dot: 'bg-slate-400',
    label: 'NOT RUN',
  },
  DATA_UNAVAILABLE: {
    bg: 'bg-slate-50',
    text: 'text-slate-600',
    border: 'border-slate-200',
    dot: 'bg-slate-400',
    label: 'DATA UNAVAILABLE',
  },
  FAILED: {
    bg: 'bg-red-50',
    text: 'text-red-700',
    border: 'border-red-200',
    dot: 'bg-red-500',
    label: 'FAILED',
  },
  INVALID: {
    bg: 'bg-amber-50',
    text: 'text-amber-800',
    border: 'border-amber-200',
    dot: 'bg-amber-500',
    label: 'INVALID',
  },
  WATCH: {
    bg: 'bg-amber-50',
    text: 'text-amber-800',
    border: 'border-amber-200',
    dot: 'bg-amber-500',
    label: 'WATCH',
  },
  HIGH: {
    bg: 'bg-red-50',
    text: 'text-red-700',
    border: 'border-red-200',
    dot: 'bg-red-500 animate-pulse',
    label: 'HIGH ALERT',
  },
  NORMAL: {
    bg: 'bg-emerald-50',
    text: 'text-emerald-700',
    border: 'border-emerald-200',
    dot: 'bg-emerald-500',
    label: 'NORMAL',
  },
  'DEMO / FIXTURE': {
    bg: 'bg-slate-100',
    text: 'text-slate-700',
    border: 'border-slate-300',
    dot: 'bg-slate-500',
    label: 'DEMO / FIXTURE',
  },
  'SCREENING MODEL': {
    bg: 'bg-amber-50',
    text: 'text-amber-800',
    border: 'border-amber-200',
    dot: 'bg-amber-500',
    label: 'SCREENING MODEL',
  },
  'REAL SPH RUN': {
    bg: 'bg-purple-50',
    text: 'text-purple-700',
    border: 'border-purple-200',
    dot: 'bg-purple-500 animate-pulse',
    label: 'REAL SPH RUN',
  },
  'REAL DELFT3D RUN': {
    bg: 'bg-blue-50',
    text: 'text-blue-700',
    border: 'border-blue-200',
    dot: 'bg-blue-500 animate-pulse',
    label: 'REAL DELFT3D RUN',
  },
  'OBSERVED SATELLITE': {
    bg: 'bg-cyan-50',
    text: 'text-cyan-800',
    border: 'border-cyan-200',
    dot: 'bg-cyan-500',
    label: 'OBSERVED SATELLITE',
  },
  'WHAT-IF SCENARIO': {
    bg: 'bg-rose-50',
    text: 'text-rose-700',
    border: 'border-rose-200',
    dot: 'bg-rose-500',
    label: 'WHAT-IF SCENARIO',
  },
};

export default function StatusBadge({ status = 'NOT_RUN', label, className = '' }) {
  const norm = (status || 'NOT_RUN').toUpperCase();
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
