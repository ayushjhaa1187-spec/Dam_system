import React from 'react';
import { Layers, Play, AlertCircle, FileQuestion } from 'lucide-react';

export default function EmptyState({
  title = 'No Data Available',
  description = 'There is currently no active simulation or data stream loaded for this view.',
  icon: Icon = FileQuestion,
  action = null,
  className = '',
}) {
  return (
    <div
      className={`bg-hc-surface/40 border border-hc-border/80 rounded-2xl p-12 text-center flex flex-col items-center justify-center max-w-lg mx-auto space-y-4 my-8 ${className}`}
    >
      <div className="w-14 h-14 rounded-2xl bg-hc-bg border border-hc-border flex items-center justify-center text-hc-textSecondary">
        <Icon className="w-7 h-7" />
      </div>
      <div className="space-y-1.5">
        <h3 className="text-base font-semibold text-hc-ink">{title}</h3>
        <p className="text-xs text-hc-textSecondary max-w-md leading-relaxed">{description}</p>
      </div>
      {action && <div className="pt-2">{action}</div>}
    </div>
  );
}
