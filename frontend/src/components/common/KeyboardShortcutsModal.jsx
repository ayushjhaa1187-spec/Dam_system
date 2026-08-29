import React from 'react';
import { X, Keyboard, Command } from 'lucide-react';

const SHORTCUTS = [
  { keys: ['Alt', '1'], label: 'Switch to Screen 1: Home & Case Studies' },
  { keys: ['Alt', '2'], label: 'Switch to Screen 2: Create Scenario Wizard' },
  { keys: ['Alt', '3'], label: 'Switch to Screen 3: Run Monitor' },
  { keys: ['Alt', '4'], label: 'Switch to Screen 4: Results Map' },
  { keys: ['Alt', '5'], label: 'Switch to Screen 5: Impact & Export' },
  { keys: ['Space'], label: 'Play / Pause Simulation Time Slider (on Map screen)' },
  { keys: ['Left Arrow'], label: 'Step Backward 5 minutes' },
  { keys: ['Right Arrow'], label: 'Step Forward 5 minutes' },
  { keys: ['Esc'], label: 'Close open modals, drawers, or exit fullscreen' },
  { keys: ['?'], label: 'Open Keyboard Shortcuts Guide' },
];

export default function KeyboardShortcutsModal({ isOpen, onClose }) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-hc-bg/80 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-hc-surface border border-hc-border rounded-2xl w-full max-w-lg overflow-hidden shadow-2xl space-y-4 p-6 text-hc-ink">
        <div className="flex items-center justify-between pb-3 border-b border-hc-border">
          <div className="flex items-center space-x-2.5">
            <div className="w-8 h-8 rounded-lg bg-hc-active/10 border border-cyan-500/30 flex items-center justify-center text-hc-active">
              <Keyboard className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-base font-bold text-hc-ink">Accessible Keyboard Shortcuts</h3>
              <p className="text-[11px] text-hc-textSecondary">Navigate the 5 screens and simulation controls without mouse</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-hc-textSecondary hover:text-hc-ink hover:bg-hc-secondary"
            aria-label="Close shortcuts modal"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="space-y-2 max-h-80 overflow-y-auto pr-1">
          {SHORTCUTS.map((s, idx) => (
            <div
              key={idx}
              className="flex items-center justify-between p-2.5 bg-hc-bg/80 rounded-xl border border-hc-border/80 text-xs"
            >
              <span className="text-hc-textSecondary font-medium">{s.label}</span>
              <div className="flex items-center space-x-1">
                {s.keys.map((k, kidx) => (
                  <kbd
                    key={kidx}
                    className="px-2 py-1 text-[11px] font-mono font-bold bg-hc-secondary border border-hc-border text-hc-active rounded-md shadow-sm"
                  >
                    {k}
                  </kbd>
                ))}
              </div>
            </div>
          ))}
        </div>

        <div className="pt-2 text-right border-t border-hc-border">
          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded-xl bg-hc-secondary hover:bg-hc-border text-hc-ink text-xs font-semibold"
          >
            Got it
          </button>
        </div>
      </div>
    </div>
  );
}
