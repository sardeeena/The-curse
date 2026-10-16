'use client';

import React, { useEffect } from 'react';
import { InspectionData } from '../game/GameState';
import { Scroll, X } from 'lucide-react';

interface InspectionModalProps {
  data: InspectionData;
  onClose: () => void;
}

export const InspectionModal: React.FC<InspectionModalProps> = ({ data, onClose }) => {
  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.code === 'KeyE' || e.code === 'Escape' || e.code === 'Space') {
        e.preventDefault();
        onClose();
      }
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [onClose]);

  return (
    <div className="absolute inset-0 z-40 flex items-center justify-center p-4 bg-stone-950/80 pointer-events-auto select-none animate-in fade-in duration-150">
      <div className="w-full max-w-lg bg-stone-900/95 border-2 border-amber-600/60 rounded-2xl p-6 md:p-8 shadow-[0_0_60px_rgba(0,0,0,0.9)] text-center relative overflow-hidden">
        {/* Egyptian decorative corner ornaments */}
        <div className="absolute top-2 left-2 text-amber-500/60 text-lg">𓋹</div>
        <div className="absolute top-2 right-2 text-amber-500/60 text-lg">𓋹</div>
        <div className="absolute bottom-2 left-2 text-amber-500/60 text-lg">☥</div>
        <div className="absolute bottom-2 right-2 text-amber-500/60 text-lg">☥</div>

        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-1.5 rounded-lg text-stone-400 hover:text-white hover:bg-stone-800 transition cursor-pointer"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="w-12 h-12 rounded-full bg-amber-500/10 border border-amber-500/30 flex items-center justify-center mx-auto mb-3 text-amber-400">
          <Scroll className="w-6 h-6" />
        </div>

        <div className="text-amber-500 font-serif tracking-[0.25em] text-xs uppercase mb-1">
          Ancient Egyptian Inscription
        </div>

        <h3 className="text-xl md:text-2xl font-serif font-bold text-amber-200 tracking-wide mb-4">
          {data.title}
        </h3>

        <div className="p-4 rounded-xl border border-stone-800 bg-stone-950/70 text-stone-300 font-serif italic text-sm md:text-base leading-relaxed mb-6">
          {data.text}
        </div>

        <button
          onClick={onClose}
          className="py-2.5 px-6 rounded-xl bg-amber-500 text-stone-950 font-semibold text-xs uppercase tracking-wider hover:bg-amber-400 transition cursor-pointer shadow-[0_0_15px_rgba(245,158,11,0.3)]"
        >
          Close (E or Esc)
        </button>
      </div>
    </div>
  );
};
