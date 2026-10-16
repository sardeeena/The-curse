'use client';

import React, { useEffect } from 'react';
import { Volume2, VolumeX, Settings, ShieldAlert, Play } from 'lucide-react';
import { soundManager } from '../game/audio/SoundEffects';

interface TitleScreenProps {
  onStart: () => void;
  onOpenSettings: () => void;
  onOpenControls: () => void;
}

export const TitleScreen: React.FC<TitleScreenProps> = ({
  onStart,
  onOpenSettings,
  onOpenControls,
}) => {
  const [muted, setMuted] = React.useState(false);

  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.code === 'Enter' || e.code === 'Space') {
        e.preventDefault();
        onStart();
      }
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [onStart]);

  const toggleSound = () => {
    const isNowMuted = soundManager.toggleMute();
    setMuted(isNowMuted);
  };

  return (
    <div className="absolute inset-0 z-30 flex flex-col justify-between p-6 md:p-12 pointer-events-auto bg-gradient-to-t from-stone-950/85 via-stone-950/40 to-stone-950/70 select-none">
      {/* Top Header bar */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2.5 text-amber-500/80 font-mono text-xs tracking-widest uppercase">
          <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse" />
          <span>Valley of the Kings · 13th Dynasty Tomb</span>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={toggleSound}
            aria-label="Toggle Sound"
            className="p-2.5 rounded-lg border border-stone-800 bg-stone-900/80 text-stone-300 hover:text-amber-400 hover:border-amber-500/50 transition cursor-pointer"
          >
            {muted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4 text-amber-400" />}
          </button>
          <button
            onClick={onOpenSettings}
            aria-label="Settings"
            className="p-2.5 rounded-lg border border-stone-800 bg-stone-900/80 text-stone-300 hover:text-amber-400 hover:border-amber-500/50 transition cursor-pointer"
          >
            <Settings className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Center Title Lockup */}
      <div className="flex flex-col items-center justify-center text-center max-w-3xl mx-auto my-auto py-8">
        {/* Ancient Winged Scarab & Eye Emblem */}
        <div className="mb-4 text-amber-400 drop-shadow-[0_0_25px_rgba(234,179,8,0.35)]">
          <svg className="w-20 h-20 md:w-24 md:h-24 mx-auto" viewBox="0 0 100 100" fill="none">
            {/* Sun Disc */}
            <circle cx="50" cy="24" r="10" fill="url(#goldGrad)" stroke="#b45309" strokeWidth="1.5" />
            {/* Wing Left */}
            <path
              d="M44 32 C30 22 10 26 2 40 C14 42 28 38 42 42 C30 46 16 52 8 62 C22 58 34 52 44 48 Z"
              fill="url(#goldGrad)"
              stroke="#78350f"
              strokeWidth="1"
            />
            {/* Wing Right */}
            <path
              d="M56 32 C70 22 90 26 98 40 C86 42 72 38 58 42 C70 46 84 52 92 62 C78 58 66 52 56 48 Z"
              fill="url(#goldGrad)"
              stroke="#78350f"
              strokeWidth="1"
            />
            {/* Scarab Body */}
            <ellipse cx="50" cy="46" rx="9" ry="14" fill="#1c1917" stroke="#eab308" strokeWidth="1.5" />
            <path d="M50 32 L50 60" stroke="#ca8a04" strokeWidth="1.2" />
            {/* Ankh symbol on scarab */}
            <circle cx="50" cy="42" r="3" stroke="#eab308" strokeWidth="1.2" />
            <line x1="50" y1="45" x2="50" y2="53" stroke="#eab308" strokeWidth="1.2" />
            <line x1="46" y1="48" x2="54" y2="48" stroke="#eab308" strokeWidth="1.2" />
            {/* Base pedestal */}
            <path d="M38 64 L62 64 L56 70 L44 70 Z" fill="#b45309" />
            <defs>
              <linearGradient id="goldGrad" x1="0" y1="0" x2="1" y2="1">
                <stop offset="0%" stopColor="#fef08a" />
                <stop offset="50%" stopColor="#eab308" />
                <stop offset="100%" stopColor="#854d0e" />
              </linearGradient>
            </defs>
          </svg>
        </div>

        <div className="text-amber-500/90 font-serif tracking-[0.35em] text-xs md:text-sm uppercase mb-2">
          An Ancient Subterranean Nightmare
        </div>

        <h1 className="text-4xl md:text-6xl lg:text-7xl font-serif font-black tracking-wider text-transparent bg-clip-text bg-gradient-to-b from-amber-100 via-amber-300 to-amber-600 drop-shadow-[0_4px_16px_rgba(0,0,0,0.9)] uppercase mb-4">
          The Curse of the Pharaoh
        </h1>

        <p className="text-stone-300/80 text-sm md:text-base max-w-xl mx-auto leading-relaxed mb-8 font-light">
          Trapped deep beneath the desert sands, ancient guardians stir in the dark.
          Conserve your flashlight, investigate sacred inscriptions, and recover the Eye of Horus to break the seal.
        </p>

        {/* Primary Start CTA */}
        <div className="flex flex-col sm:flex-row items-center gap-4">
          <button
            onClick={onStart}
            className="flex items-center gap-3 px-8 py-4 rounded-xl bg-gradient-to-r from-amber-600 via-amber-500 to-amber-600 text-stone-950 font-semibold tracking-wider uppercase text-sm md:text-base shadow-[0_0_30px_rgba(245,158,11,0.4)] hover:shadow-[0_0_45px_rgba(245,158,11,0.65)] hover:scale-105 active:scale-95 transition-all duration-200 cursor-pointer"
          >
            <Play className="w-5 h-5 fill-current" />
            <span>Enter the Tomb</span>
          </button>

          <button
            onClick={onOpenControls}
            className="flex items-center gap-2 px-6 py-4 rounded-xl border border-stone-700 bg-stone-900/80 text-stone-200 hover:text-amber-400 hover:border-amber-500/50 text-sm font-medium tracking-wide uppercase transition cursor-pointer"
          >
            <ShieldAlert className="w-4 h-4" />
            <span>Controls & Rules</span>
          </button>
        </div>
      </div>

      {/* Bottom Hint Line */}
      <div className="border-t border-stone-800/80 pt-4 flex flex-col md:flex-row items-center justify-between text-xs text-stone-400 font-mono tracking-wider gap-2">
        <div className="flex items-center gap-4 flex-wrap justify-center">
          <span><span className="text-amber-400">WASD</span> Move</span>
          <span>·</span>
          <span><span className="text-amber-400">Mouse</span> Look</span>
          <span>·</span>
          <span><span className="text-amber-400">Shift</span> Sprint</span>
          <span>·</span>
          <span><span className="text-amber-400">E</span> Interact</span>
          <span>·</span>
          <span><span className="text-amber-400">F</span> Flashlight</span>
          <span>·</span>
          <span><span className="text-amber-400">Esc</span> Pause</span>
        </div>

        <div className="text-stone-300">
          Press <span className="text-amber-400 font-semibold">ENTER</span> or <span className="text-amber-400 font-semibold">SPACE</span> to Start
        </div>
      </div>
    </div>
  );
};
