import React from 'react';

export default function Panel({
  title,
  subtitle,
  icon: Icon,
  actions,
  children,
  className = '',
  bodyClassName = 'p-5',
  headerClassName = 'px-5 py-4',
  noPadding = false,
}) {
  return (
    <div
      className={`bg-hc-surface/70 border border-hc-border/80 rounded-2xl overflow-hidden shadow-sm backdrop-blur-xs flex flex-col ${className}`}
    >
      {(title || subtitle || Icon || actions) && (
        <div
          className={`border-b border-hc-border/80 flex flex-wrap items-center justify-between gap-3 bg-hc-bg/40 ${headerClassName}`}
        >
          <div className="flex items-center gap-2.5">
            {Icon && (
              <div className="w-8 h-8 rounded-lg bg-hc-surface border border-hc-border flex items-center justify-center text-hc-active">
                <Icon className="w-4 h-4" />
              </div>
            )}
            <div>
              {title && <h3 className="text-sm sm:text-base font-semibold text-hc-ink">{title}</h3>}
              {subtitle && <p className="text-xs text-hc-textSecondary">{subtitle}</p>}
            </div>
          </div>
          {actions && <div className="flex items-center gap-2">{actions}</div>}
        </div>
      )}
      <div className={noPadding ? '' : bodyClassName}>{children}</div>
    </div>
  );
}
