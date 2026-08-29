import React from 'react';
import ProvenanceBadge from './ProvenanceBadge';

export default function MetricCard({
  title,
  value,
  unit = '',
  subtitle = '',
  provenance = null,
  icon: Icon = null,
  trend = null, // { direction: 'up'|'down'|'neutral', label: string }
  accentColor = 'cyan', // 'cyan', 'emerald', 'red', 'amber', 'purple', 'slate'
  className = '',
}) {
  const accentTextColors = {
    cyan: 'text-hc-active',
    emerald: 'text-hc-success',
    red: 'text-hc-critical',
    amber: 'text-amber-400',
    purple: 'text-hc-assumption',
    slate: 'text-hc-ink',
  };

  return (
    <div
      className={`bg-hc-surface/70 border border-hc-border/80 rounded-2xl p-5 flex flex-col justify-between hover:border-hc-border/80 transition-all ${className}`}
    >
      <div className="flex items-center justify-between gap-2 mb-2">
        <span className="text-xs font-medium text-hc-textSecondary tracking-wide">{title}</span>
        <div className="flex items-center gap-1.5">
          {provenance && <ProvenanceBadge level={provenance} />}
          {Icon && (
            <div className="w-7 h-7 rounded-lg bg-hc-bg border border-hc-border flex items-center justify-center text-hc-textSecondary">
              <Icon className="w-3.5 h-3.5" />
            </div>
          )}
        </div>
      </div>

      <div className="my-1">
        <div className="flex items-baseline gap-1.5">
          <span className={`text-2xl sm:text-3xl font-semibold tracking-tight ${accentTextColors[accentColor] || 'text-hc-ink'}`}>
            {value}
          </span>
          {unit && <span className="text-xs font-mono text-hc-textSecondary">{unit}</span>}
        </div>
      </div>

      {(subtitle || trend) && (
        <div className="flex items-center justify-between text-[11px] text-hc-textSecondary pt-1 border-t border-hc-border/50 mt-2">
          <span>{subtitle}</span>
          {trend && (
            <span
              className={`font-mono font-medium ${
                trend.direction === 'up'
                  ? 'text-hc-critical'
                  : trend.direction === 'down'
                  ? 'text-hc-success'
                  : 'text-hc-textSecondary'
              }`}
            >
              {trend.label}
            </span>
          )}
        </div>
      )}
    </div>
  );
}
