import React from 'react';
import { AlertTriangle, Zap, Microscope, CheckCircle2 } from 'lucide-react';

export const VALIDATION_CONFIGS = {
  demo: {
    label: 'DEMO (ILLUSTRATIVE ONLY)',
    shortLabel: 'DEMO',
    bg: 'bg-rose-500/10',
    text: 'text-rose-400',
    border: 'border-rose-500/30',
    dot: 'bg-rose-500',
    icon: AlertTriangle,
    description: 'Illustrative mock data — NEVER use for operational flood warnings or life-safety planning.',
  },
  screening: {
    label: 'SCREENING MODEL',
    shortLabel: 'SCREENING',
    bg: 'bg-sky-500/10',
    text: 'text-sky-400',
    border: 'border-sky-500/30',
    dot: 'bg-sky-400',
    icon: Zap,
    description: 'Simplified shallow-water / empirical estimate for fast scenario exploration.',
  },
  calibrated: {
    label: 'CALIBRATED BENCHMARK',
    shortLabel: 'CALIBRATED',
    bg: 'bg-hc-assumption/10',
    text: 'text-hc-assumption',
    border: 'border-purple-500/30',
    dot: 'bg-purple-400',
    icon: Microscope,
    description: 'Lagrangian SPH or hydraulic solver calibrated against physical lab/analytical benchmarks.',
  },
  validated: {
    label: 'VALIDATED OPERATIONAL',
    shortLabel: 'VALIDATED',
    bg: 'bg-hc-success/10',
    text: 'text-hc-success',
    border: 'border-hc-success/30',
    dot: 'bg-emerald-400',
    icon: CheckCircle2,
    description: 'Rigorous hydrodynamic simulation compliant with CWC / NDMA operational guidelines.',
  },
};

export default function ValidationBadge({
  status = 'screening',
  compact = false,
  className = '',
  showIcon = true,
}) {
  const norm = (status || 'screening').toLowerCase();
  const cfg = VALIDATION_CONFIGS[norm] || VALIDATION_CONFIGS.screening;
  const Icon = cfg.icon;

  return (
    <span
      className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-mono font-semibold border ${cfg.bg} ${cfg.text} ${cfg.border} ${className}`}
      title={cfg.description}
    >
      {showIcon && <Icon className="w-3.5 h-3.5 shrink-0" />}
      {!showIcon && <span className={`w-1.5 h-1.5 rounded-full ${cfg.dot}`} />}
      <span>{compact ? cfg.shortLabel : cfg.label}</span>
    </span>
  );
}
