'use client';

import React, { useEffect } from 'react';
import { Play, RotateCcw, Settings, Home, ShieldAlert } from 'lucide-react';

interface PauseMenuProps {
  onResume: () => void;
  onRestart: () => void;
  onOpenSettings: () => void;
  onOpenControls: () => void;
  onQuitToMenu: () => void;
}

export const PauseMenu: React.FC<PauseMenuProps> = ({
  onResume,
  onRestart,
  onOpenSettings,
  onOpenControls,
  onQuitToMenu,
}) => {
  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.code === 'Escape') {
        e.preventDefault();
        onResume();
      }
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [onResume]);

  return (
    <div className="absolute inset-0 z-40 flex items-center justify-center p-4 bg-stone-950/85 pointer-events-auto select-none animate-in fade-in duration-200">
      <div className="w-full max-w-md bg-stone-900 border border-amber-600/40 rounded-2xl p-6 md:p-8 shadow-[0_0_50px_rgba(0,0,0,0.85)] text-center relative overflow-hidden">
        {/* Subtle decorative Egyptian hieroglyph border top */}
        <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-amber-700 via-amber-400 to-amber-700" />

        <div className="text-amber-500 font-serif tracking-[0.25em] text-xs uppercase mb-1">
          𓋹 Tomb Suspended 𓋹
        </div>
        <h2 className="text-2xl md:text-3xl font-serif font-bold text-stone-100 tracking-wider uppercase mb-6">
          Game Paused
        </h2>

        <div className="flex flex-col gap-3">
          <button
            onClick={onResume}
            className="flex items-center justify-center gap-2.5 w-full py-3.5 px-4 rounded-xl bg-gradient-to-r from-amber-600 to-amber-500 text-stone-950 font-semibold tracking-wider uppercase text-sm shadow-[0_0_20px_rgba(245,158,11,0.3)] hover:scale-[1.02] active:scale-[0.98] transition cursor-pointer"
          >
            <Play className="w-4 h-4 fill-current" />
            <span>Resume Game (Esc)</span>
          </button>

          <button
            onClick={onRestart}
            className="flex items-center justify-center gap-2.5 w-full py-3 px-4 rounded-xl border border-stone-700 bg-stone-800/80 text-stone-200 hover:text-amber-300 hover:border-amber-500/50 text-sm font-medium tracking-wide transition cursor-pointer"
          >
            <RotateCcw className="w-4 h-4" />
            <span>Restart Chapter</span>
          </button>

          <button
            onClick={onOpenSettings}
            className="flex items-center justify-center gap-2.5 w-full py-3 px-4 rounded-xl border border-stone-700 bg-stone-800/80 text-stone-200 hover:text-amber-300 hover:border-amber-500/50 text-sm font-medium tracking-wide transition cursor-pointer"
          >
            <Settings className="w-4 h-4" />
            <span>Graphics & Audio Settings</span>
          </button>

          <button
            onClick={onOpenControls}
            className="flex items-center justify-center gap-2.5 w-full py-3 px-4 rounded-xl border border-stone-700 bg-stone-800/80 text-stone-200 hover:text-amber-300 hover:border-amber-500/50 text-sm font-medium tracking-wide transition cursor-pointer"
          >
            <ShieldAlert className="w-4 h-4" />
            <span>View Controls</span>
          </button>

          <button
            onClick={onQuitToMenu}
            className="flex items-center justify-center gap-2.5 w-full py-3 px-4 rounded-xl border border-stone-800 bg-stone-950/60 text-stone-400 hover:text-red-400 hover:border-red-500/40 text-sm font-medium tracking-wide transition cursor-pointer mt-2"
          >
            <Home className="w-4 h-4" />
            <span>Quit to Title Screen</span>
          </button>
        </div>

        <div className="mt-6 pt-4 border-t border-stone-800 text-xs text-stone-300 font-mono">
          Press <span className="text-amber-400 font-semibold">ESC</span> to return to the tomb
        </div>
      </div>
    </div>
  );
};
