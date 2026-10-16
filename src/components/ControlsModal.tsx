'use client';

import React from 'react';
import { X, ShieldAlert, Compass, Lightbulb, Zap, Hand, Eye } from 'lucide-react';

interface ControlsModalProps {
  onClose: () => void;
}

export const ControlsModal: React.FC<ControlsModalProps> = ({ onClose }) => {
  return (
    <div className="absolute inset-0 z-50 flex items-center justify-center p-4 bg-stone-950/90 pointer-events-auto select-none animate-in fade-in duration-150">
      <div className="w-full max-w-xl bg-stone-900 border border-stone-800 rounded-2xl p-6 md:p-8 shadow-2xl relative max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between border-b border-stone-800 pb-4 mb-6">
          <div className="flex items-center gap-2.5">
            <ShieldAlert className="w-5 h-5 text-amber-500" />
            <h3 className="text-xl font-serif font-bold text-stone-100 tracking-wide uppercase">
              Survival Controls & Lore
            </h3>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-stone-400 hover:text-white hover:bg-stone-800 transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="p-3.5 rounded-xl border border-stone-800 bg-stone-950/60 flex items-start gap-3">
              <Compass className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
              <div>
                <div className="text-xs font-semibold text-stone-200 uppercase tracking-wide">Movement</div>
                <div className="text-xs text-stone-400 mt-1 font-mono">
                  <span className="text-amber-400 font-bold">W, A, S, D</span> or Arrow keys
                </div>
              </div>
            </div>

            <div className="p-3.5 rounded-xl border border-stone-800 bg-stone-950/60 flex items-start gap-3">
              <Eye className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
              <div>
                <div className="text-xs font-semibold text-stone-200 uppercase tracking-wide">Look Around</div>
                <div className="text-xs text-stone-400 mt-1 font-mono">
                  <span className="text-amber-400 font-bold">Mouse Look</span> (Click canvas to lock pointer)
                </div>
              </div>
            </div>

            <div className="p-3.5 rounded-xl border border-stone-800 bg-stone-950/60 flex items-start gap-3">
              <Zap className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
              <div>
                <div className="text-xs font-semibold text-stone-200 uppercase tracking-wide">Sprint</div>
                <div className="text-xs text-stone-400 mt-1 font-mono">
                  Hold <span className="text-amber-400 font-bold">SHIFT</span> (Consumes stamina)
                </div>
              </div>
            </div>

            <div className="p-3.5 rounded-xl border border-stone-800 bg-stone-950/60 flex items-start gap-3">
              <Hand className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
              <div>
                <div className="text-xs font-semibold text-stone-200 uppercase tracking-wide">Interact</div>
                <div className="text-xs text-stone-400 mt-1 font-mono">
                  Press <span className="text-amber-400 font-bold">E</span> on tablets, artifacts, and doors
                </div>
              </div>
            </div>

            <div className="p-3.5 rounded-xl border border-stone-800 bg-stone-950/60 flex items-start gap-3">
              <Lightbulb className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
              <div>
                <div className="text-xs font-semibold text-stone-200 uppercase tracking-wide">Flashlight</div>
                <div className="text-xs text-stone-400 mt-1 font-mono">
                  Press <span className="text-amber-400 font-bold">F</span> to toggle. Conserves battery.
                </div>
              </div>
            </div>

            <div className="p-3.5 rounded-xl border border-stone-800 bg-stone-950/60 flex items-start gap-3">
              <ShieldAlert className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
              <div>
                <div className="text-xs font-semibold text-stone-200 uppercase tracking-wide">Pause Menu</div>
                <div className="text-xs text-stone-400 mt-1 font-mono">
                  Press <span className="text-amber-400 font-bold">ESC</span> to pause anytime
                </div>
              </div>
            </div>
          </div>

          <div className="p-4 rounded-xl border border-amber-900/40 bg-amber-950/20 text-xs text-stone-300 space-y-2 mt-4">
            <div className="font-semibold text-amber-400 uppercase tracking-wider flex items-center gap-1.5">
              <span>Survival Briefing:</span>
            </div>
            <p>
              1. <strong>The Flashlight Battery</strong> drains continuously when turned on. If the battery falls below 20%, it will begin flickering in the gloom. Search the side chambers for spare battery cells.
            </p>
            <p>
              2. <strong>Sacred Inscriptions</strong> carved onto steles provide clues regarding how to awaken the sealed exit mechanism.
            </p>
            <p>
              3. <strong>The Eye of Horus</strong> is placed on the golden pedestal behind the central sarcophagus. Collect it to unseal the Northern Gate.
            </p>
          </div>
        </div>

        <div className="mt-6 pt-4 border-t border-stone-800 flex justify-end">
          <button
            onClick={onClose}
            className="py-2.5 px-6 rounded-xl bg-amber-500 text-stone-950 font-semibold text-sm hover:bg-amber-400 transition cursor-pointer"
          >
            Got it, Return
          </button>
        </div>
      </div>
    </div>
  );
};
