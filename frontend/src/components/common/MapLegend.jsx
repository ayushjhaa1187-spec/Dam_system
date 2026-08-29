import React from 'react';

export default function MapLegend({
  title = 'Legend',
  items = [],
  className = '',
}) {
  if (!items || items.length === 0) return null;

  return (
    <div
      className={`bg-hc-bg/90 border border-hc-border/90 rounded-xl p-3.5 backdrop-blur-md text-xs shadow-lg space-y-2 ${className}`}
    >
      <div className="font-semibold text-hc-textSecondary text-[11px] uppercase tracking-wider">
        {title}
      </div>
      <div className="space-y-1.5 font-mono text-[11px]">
        {items.map((item, idx) => (
          <div key={idx} className="flex items-center gap-2">
            {item.color ? (
              <span
                className="w-3 h-3 rounded-xs shrink-0 border border-hc-border"
                style={{ backgroundColor: item.color }}
              />
            ) : item.icon ? (
              <span className="shrink-0">{item.icon}</span>
            ) : null}
            <span className="text-hc-textSecondary font-sans text-xs">{item.label}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
