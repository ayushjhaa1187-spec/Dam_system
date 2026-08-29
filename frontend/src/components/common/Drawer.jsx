import React, { useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X } from 'lucide-react';

export default function Drawer({
  isOpen,
  onClose,
  title,
  subtitle,
  children,
  width = 'max-w-xl',
  footer = null,
}) {
  // Prevent body scroll when drawer is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 overflow-hidden flex justify-end">
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            onClick={onClose}
            className="fixed inset-0 bg-hc-bg/70 backdrop-blur-xs"
          />

          {/* Drawer Slide-Over */}
          <motion.div
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 28, stiffness: 280 }}
            className={`relative w-full ${width} bg-hc-surface border-l border-hc-border shadow-2xl z-10 flex flex-col h-full overflow-hidden`}
          >
            {/* Header */}
            <div className="px-6 py-5 border-b border-hc-border flex items-center justify-between bg-hc-bg/50">
              <div>
                {title && <h2 className="text-base sm:text-lg font-semibold text-hc-ink">{title}</h2>}
                {subtitle && <p className="text-xs text-hc-textSecondary mt-0.5">{subtitle}</p>}
              </div>
              <button
                onClick={onClose}
                className="w-8 h-8 rounded-lg bg-hc-secondary/80 hover:bg-hc-border text-hc-textSecondary hover:text-hc-ink flex items-center justify-center transition"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Scrollable Content */}
            <div className="flex-1 overflow-y-auto p-6 space-y-6">{children}</div>

            {/* Optional Footer */}
            {footer && (
              <div className="px-6 py-4 border-t border-hc-border bg-hc-bg/60 flex items-center justify-end gap-3">
                {footer}
              </div>
            )}
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
