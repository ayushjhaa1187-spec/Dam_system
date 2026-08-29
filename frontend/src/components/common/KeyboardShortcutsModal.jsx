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
    <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-lg overflow-hidden shadow-2xl space-y-4 p-6 text-slate-100">
        <div className="flex items-center justify-between pb-3 border-b border-slate-800">
          <div className="flex items-center space-x-2.5">
            <div className="w-8 h-8 rounded-lg bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center text-cyan-400">
              <Keyboard className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-100">Accessible Keyboard Shortcuts</h3>
              <p className="text-[11px] text-slate-400">Navigate the 5 screens and simulation controls without mouse</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-slate-800"
            aria-label="Close shortcuts modal"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="space-y-2 max-h-80 overflow-y-auto pr-1">
          {SHORTCUTS.map((s, idx) => (
            <div
              key={idx}
              className="flex items-center justify-between p-2.5 bg-slate-950/80 rounded-xl border border-slate-800/80 text-xs"
            >
              <span className="text-slate-300 font-medium">{s.label}</span>
              <div className="flex items-center space-x-1">
                {s.keys.map((k, kidx) => (
                  <kbd
                    key={kidx}
                    className="px-2 py-1 text-[11px] font-mono font-bold bg-slate-800 border border-slate-700 text-cyan-400 rounded-md shadow-sm"
                  >
                    {k}
                  </kbd>
                ))}
              </div>
            </div>
          ))}
        </div>

        <div className="pt-2 text-right border-t border-slate-800">
          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold"
          >
            Got it
          </button>
        </div>
      </div>
    </div>
  );
}
