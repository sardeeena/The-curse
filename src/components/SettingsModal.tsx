'use client';

import React from 'react';
import { X, Sliders, Volume2, Monitor, Eye } from 'lucide-react';
import { GameSettings, GraphicsQuality } from '../game/GameState';

interface SettingsModalProps {
  settings: GameSettings;
  onUpdate: (partial: Partial<GameSettings>) => void;
  onClose: () => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({
  settings,
  onUpdate,
  onClose,
}) => {
  return (
    <div className="absolute inset-0 z-50 flex items-center justify-center p-4 bg-stone-950/90 pointer-events-auto select-none animate-in fade-in duration-150">
      <div className="w-full max-w-lg bg-stone-900 border border-stone-800 rounded-2xl p-6 md:p-8 shadow-2xl relative">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-stone-800 pb-4 mb-6">
          <div className="flex items-center gap-2.5">
            <Sliders className="w-5 h-5 text-amber-500" />
            <h3 className="text-xl font-serif font-bold text-stone-100 tracking-wide uppercase">
              Tomb Settings
            </h3>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-stone-400 hover:text-white hover:bg-stone-800 transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="space-y-6">
          {/* Graphics Preset */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-sm font-medium text-stone-200 flex items-center gap-2">
                <Monitor className="w-4 h-4 text-amber-500" />
                <span>Graphics Quality Preset</span>
              </label>
              <span className="text-xs text-amber-400 font-mono uppercase font-semibold">
                {settings.graphicsQuality}
              </span>
            </div>
            <div className="grid grid-cols-3 gap-2">
              {(['LOW', 'MEDIUM', 'HIGH'] as GraphicsQuality[]).map((q) => (
                <button
                  key={q}
                  onClick={() => onUpdate({ graphicsQuality: q })}
                  className={`py-2 px-3 rounded-lg text-xs font-semibold tracking-wider uppercase transition cursor-pointer border ${
                    settings.graphicsQuality === q
                      ? 'bg-amber-500 text-stone-950 border-amber-400 shadow-[0_0_12px_rgba(245,158,11,0.3)]'
                      : 'bg-stone-800 text-stone-300 border-stone-700 hover:border-stone-500'
                  }`}
                >
                  {q}
                </button>
              ))}
            </div>
            <p className="text-[11px] text-stone-300 mt-1.5">
              {settings.graphicsQuality === 'LOW' && 'Maximum FPS: disables shadow maps and caps render resolution.'}
              {settings.graphicsQuality === 'MEDIUM' && 'Balanced performance: standard shadows and medium resolution.'}
              {settings.graphicsQuality === 'HIGH' && 'Maximum fidelity: soft PCF shadows, full PBR reflections, and high resolution.'}
            </p>
          </div>

          {/* Mouse Sensitivity */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-sm font-medium text-stone-200 flex items-center gap-2">
                <Eye className="w-4 h-4 text-amber-500" />
                <span>Mouse Sensitivity</span>
              </label>
              <span className="text-xs text-stone-400 font-mono tabular-nums">
                {settings.sensitivity.toFixed(1)}x
              </span>
            </div>
            <input
              type="range"
              min="0.4"
              max="2.5"
              step="0.1"
              value={settings.sensitivity}
              onChange={(e) => onUpdate({ sensitivity: parseFloat(e.target.value) })}
              className="w-full h-2 bg-stone-800 rounded-lg appearance-none cursor-pointer accent-amber-500"
            />
          </div>

          {/* Master Audio Volume */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-sm font-medium text-stone-200 flex items-center gap-2">
                <Volume2 className="w-4 h-4 text-amber-500" />
                <span>Master Volume</span>
              </label>
              <span className="text-xs text-stone-400 font-mono tabular-nums">
                {Math.round(settings.volume * 100)}%
              </span>
            </div>
            <input
              type="range"
              min="0"
              max="1"
              step="0.05"
              value={settings.volume}
              onChange={(e) => onUpdate({ volume: parseFloat(e.target.value) })}
              className="w-full h-2 bg-stone-800 rounded-lg appearance-none cursor-pointer accent-amber-500"
            />
          </div>
        </div>

        {/* Footer */}
        <div className="mt-8 pt-4 border-t border-stone-800 flex justify-end">
          <button
            onClick={onClose}
            className="py-2.5 px-6 rounded-xl bg-amber-500 text-stone-950 font-semibold text-sm hover:bg-amber-400 transition cursor-pointer"
          >
            Apply & Close
          </button>
        </div>
      </div>
    </div>
  );
};
