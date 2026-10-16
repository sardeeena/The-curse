'use client';

import React from 'react';
import { Trophy, RotateCcw, Home } from 'lucide-react';

interface VictoryModalProps {
  onRestart: () => void;
  onQuitToMenu: () => void;
}

export const VictoryModal: React.FC<VictoryModalProps> = ({
  onRestart,
  onQuitToMenu,
}) => {
  return (
    <div className="absolute inset-0 z-50 flex items-center justify-center p-4 bg-stone-950/90 pointer-events-auto select-none animate-in fade-in duration-300">
      <div className="w-full max-w-lg bg-stone-900 border-2 border-amber-500/80 rounded-2xl p-6 md:p-8 shadow-[0_0_80px_rgba(245,158,11,0.35)] text-center relative overflow-hidden">
        {/* Glow backdrop */}
        <div className="w-16 h-16 rounded-full bg-amber-500/20 border border-amber-500/40 flex items-center justify-center mx-auto mb-4 text-amber-400 shadow-[0_0_30px_rgba(245,158,11,0.5)]">
          <Trophy className="w-8 h-8" />
        </div>

        <div className="text-amber-500 font-serif tracking-[0.3em] text-xs uppercase mb-1">
          𓋹 Seal Broken · Stage Complete 𓋹
        </div>

        <h2 className="text-3xl md:text-4xl font-serif font-black text-amber-300 tracking-wider uppercase mb-4">
          Tomb Escaped!
        </h2>

        <p className="text-stone-300 text-sm md:text-base leading-relaxed mb-6 font-light">
          You successfully recovered the sacred <strong>Eye of Horus Golden Amulet</strong>, placed it into the ancient mechanism, and passed through the Northern Portal into daylight before the tomb collapsed.
        </p>

        <div className="p-4 rounded-xl border border-stone-800 bg-stone-950/70 mb-6 text-xs text-stone-400 font-mono space-y-1">
          <div className="flex justify-between text-stone-300">
            <span>Primary Objective:</span>
            <span className="text-amber-400 font-bold">COMPLETED</span>
          </div>
          <div className="flex justify-between text-stone-300">
            <span>Artifacts Recovered:</span>
            <span className="text-amber-400 font-bold">Eye of Horus (1/1)</span>
          </div>
          <div className="flex justify-between text-stone-300">
            <span>Tomb Seal:</span>
            <span className="text-green-400 font-bold">UNSEALED</span>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row items-center gap-3">
          <button
            onClick={onRestart}
            className="flex items-center justify-center gap-2.5 w-full py-3.5 px-4 rounded-xl bg-gradient-to-r from-amber-600 to-amber-500 text-stone-950 font-semibold tracking-wider uppercase text-sm shadow-[0_0_20px_rgba(245,158,11,0.4)] hover:scale-105 active:scale-95 transition cursor-pointer"
          >
            <RotateCcw className="w-4 h-4" />
            <span>Play Again</span>
          </button>

          <button
            onClick={onQuitToMenu}
            className="flex items-center justify-center gap-2 w-full py-3.5 px-4 rounded-xl border border-stone-700 bg-stone-800/80 text-stone-200 hover:text-amber-400 text-sm font-medium tracking-wide transition cursor-pointer"
          >
            <Home className="w-4 h-4" />
            <span>Title Screen</span>
          </button>
        </div>
      </div>
    </div>
  );
};
