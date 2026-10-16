'use client';

import React from 'react';
import { Skull, RotateCcw, Bookmark, Home } from 'lucide-react';

interface GameOverModalProps {
  hasCheckpoint: boolean;
  onRespawnCheckpoint: () => void;
  onRestartChapter: () => void;
  onQuitToMenu: () => void;
}

export const GameOverModal: React.FC<GameOverModalProps> = ({
  hasCheckpoint,
  onRespawnCheckpoint,
  onRestartChapter,
  onQuitToMenu,
}) => {
  return (
    <div className="absolute inset-0 z-50 flex items-center justify-center p-4 bg-red-950/85 pointer-events-auto select-none animate-in fade-in duration-300">
      <div className="w-full max-w-md bg-stone-950 border-2 border-red-700/80 rounded-2xl p-6 md:p-8 shadow-[0_0_80px_rgba(220,38,38,0.5)] text-center relative overflow-hidden">
        {/* Glow icon */}
        <div className="w-16 h-16 rounded-full bg-red-950/80 border-2 border-red-600 flex items-center justify-center mx-auto mb-4 text-red-500 shadow-[0_0_30px_rgba(239,68,68,0.6)]">
          <Skull className="w-8 h-8" />
        </div>

        <div className="text-red-500 font-serif tracking-[0.25em] text-xs uppercase mb-1">
          𓋹 Consumed By The Curse 𓋹
        </div>

        <h2 className="text-3xl md:text-4xl font-serif font-black text-red-100 tracking-wider uppercase mb-3 drop-shadow-[0_2px_10px_rgba(0,0,0,0.9)]">
          You Died
        </h2>

        <p className="text-stone-300 text-sm leading-relaxed mb-6 font-light">
          The Pharaoh&apos;s ancient Guardian caught you in the shadows of the tomb. Your soul has been claimed by the sands of eternity.
        </p>

        <div className="flex flex-col gap-3">
          {hasCheckpoint && (
            <button
              onClick={onRespawnCheckpoint}
              className="flex items-center justify-center gap-2.5 w-full py-3.5 px-4 rounded-xl bg-gradient-to-r from-amber-600 to-amber-500 text-stone-950 font-semibold tracking-wider uppercase text-sm shadow-[0_0_20px_rgba(245,158,11,0.4)] hover:scale-105 active:scale-95 transition cursor-pointer"
            >
              <Bookmark className="w-4 h-4 fill-current" />
              <span>Resume from Checkpoint</span>
            </button>
          )}

          <button
            onClick={onRestartChapter}
            className={`flex items-center justify-center gap-2.5 w-full py-3.5 px-4 rounded-xl text-stone-100 font-semibold tracking-wider uppercase text-sm transition cursor-pointer ${
              hasCheckpoint
                ? 'border border-stone-800 bg-stone-900/80 hover:border-stone-600'
                : 'bg-gradient-to-r from-red-700 to-red-600 shadow-[0_0_20px_rgba(220,38,38,0.4)] hover:scale-105 active:scale-95'
            }`}
          >
            <RotateCcw className="w-4 h-4" />
            <span>Restart Chapter from Start</span>
          </button>

          <button
            onClick={onQuitToMenu}
            className="flex items-center justify-center gap-2 w-full py-3 px-4 rounded-xl border border-stone-900 bg-stone-950/80 text-stone-400 hover:text-stone-200 text-xs font-medium tracking-wide transition cursor-pointer"
          >
            <Home className="w-3.5 h-3.5" />
            <span>Quit to Title Screen</span>
          </button>
        </div>
      </div>
    </div>
  );
};
