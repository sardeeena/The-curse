'use client';

import React from 'react';
import {
  Heart,
  BatteryCharging,
  BatteryWarning,
  BatteryMedium,
  Zap,
  Pause,
  Volume2,
  VolumeX,
  AlertTriangle,
} from 'lucide-react';
import { GameHUDData } from '../game/Game';
import { soundManager } from '../game/audio/SoundEffects';

interface GameHUDProps {
  hudData: GameHUDData;
  hasArtifact: boolean;
  notification: string | null;
  damageFlash: boolean;
  onPause: () => void;
  onToggleFlashlight: () => void;
  onInteract: () => void;
}

export const GameHUD: React.FC<GameHUDProps> = ({
  hudData,
  hasArtifact,
  notification,
  damageFlash,
  onPause,
  onToggleFlashlight,
  onInteract,
}) => {
  const [muted, setMuted] = React.useState(false);

  const toggleSound = () => {
    const isNowMuted = soundManager.toggleMute();
    setMuted(isNowMuted);
  };

  const isLowBattery = hudData.battery < 20;
  const isLowHealth = hudData.health < 30;

  return (
    <div className="absolute inset-0 z-20 pointer-events-none flex flex-col justify-between p-4 md:p-6 select-none overflow-hidden">
      {/* ======================================================== */}
      {/* DAMAGE HIT FLASH & HORROR VIGNETTE                       */}
      {/* ======================================================== */}
      <div
        className={`absolute inset-0 pointer-events-none transition-opacity duration-150 ${
          damageFlash
            ? 'opacity-85 bg-red-950/70'
            : isLowHealth
            ? 'opacity-40 shadow-[inset_0_0_100px_rgba(239,68,68,0.65)]'
            : hudData.isChased
            ? 'opacity-30 shadow-[inset_0_0_80px_rgba(180,83,9,0.5)]'
            : 'opacity-0'
        }`}
      />

      {/* ======================================================== */}
      {/* TOP BAR: Objective & Controls & Health                   */}
      {/* ======================================================== */}
      <div className="flex items-start justify-between w-full">
        {/* Left: Health and Objective cluster */}
        <div className="flex flex-col gap-2 max-w-md">
          {/* Health Bar Cluster */}
          <div className="flex items-center gap-3 px-3.5 py-2 rounded-xl bg-stone-900/90 border border-stone-800 text-stone-200 shadow-md">
            <Heart
              className={`w-4 h-4 shrink-0 transition-colors ${
                isLowHealth ? 'text-red-500 fill-red-500 animate-pulse' : 'text-red-400 fill-red-400'
              }`}
            />
            <div className="flex flex-col flex-1 min-w-[120px]">
              <div className="flex justify-between text-[10px] font-mono mb-1">
                <span className="text-stone-400">VITALS</span>
                <span className={`tabular-nums font-bold ${isLowHealth ? 'text-red-400' : 'text-stone-200'}`}>
                  {hudData.health} / {hudData.maxHealth}
                </span>
              </div>
              <div className="w-full h-1.5 rounded-full bg-stone-950 overflow-hidden border border-stone-800">
                <div
                  className={`h-full transition-all duration-300 ${
                    hudData.health > 60
                      ? 'bg-green-500'
                      : hudData.health > 30
                      ? 'bg-amber-400'
                      : 'bg-red-500 shadow-[0_0_8px_rgba(239,68,68,0.8)]'
                  }`}
                  style={{ width: `${hudData.health}%` }}
                />
              </div>
            </div>
          </div>

          {/* Objective Pill */}
          <div className="flex items-center gap-2.5 px-3.5 py-2 rounded-xl bg-stone-900/90 border border-stone-800 text-stone-200 shadow-lg">
            <span className="text-amber-500 text-sm">𓁐</span>
            <div className="flex flex-col">
              <span className="text-[9px] font-mono text-amber-500 uppercase tracking-widest font-semibold">
                Objective
              </span>
              <span className="text-xs font-medium tracking-wide text-stone-200 leading-snug">
                {hudData.objective}
              </span>
            </div>
          </div>
        </div>

        {/* Center / Top Chase Alarm */}
        {hudData.isChased && (
          <div className="px-4 py-1.5 rounded-full bg-red-950/90 border border-red-500/80 text-red-200 shadow-[0_0_20px_rgba(239,68,68,0.5)] flex items-center gap-2 text-xs font-mono uppercase tracking-widest animate-pulse">
            <AlertTriangle className="w-4 h-4 text-red-400" />
            <span>GUARDIAN PURSUING</span>
          </div>
        )}

        {/* Top Right Controls (Pause, Mute) */}
        <div className="flex items-center gap-2 pointer-events-auto">
          <button
            onClick={toggleSound}
            aria-label="Toggle Sound"
            className="p-2.5 rounded-xl border border-stone-800 bg-stone-900/85 text-stone-300 hover:text-amber-400 hover:border-amber-500/50 transition cursor-pointer shadow-md"
          >
            {muted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4 text-amber-400" />}
          </button>
          <button
            onClick={onPause}
            aria-label="Pause Game"
            className="flex items-center gap-2 px-3 py-2 rounded-xl border border-stone-800 bg-stone-900/85 text-stone-300 hover:text-amber-400 hover:border-amber-500/50 transition cursor-pointer shadow-md"
          >
            <Pause className="w-4 h-4" />
            <span className="text-xs font-mono hidden sm:inline">ESC</span>
          </button>
        </div>
      </div>

      {/* ======================================================== */}
      {/* TOAST NOTIFICATION                                       */}
      {/* ======================================================== */}
      {notification && (
        <div className="self-center -mt-8 px-5 py-2.5 rounded-xl bg-amber-500 text-stone-950 border border-amber-300 shadow-[0_0_30px_rgba(245,158,11,0.5)] font-serif font-bold text-xs md:text-sm tracking-wide uppercase animate-in slide-in-from-top-4 duration-200 pointer-events-none">
          {notification}
        </div>
      )}

      {/* ======================================================== */}
      {/* CENTER RETICLE & INTERACTION PROMPT                      */}
      {/* ======================================================== */}
      <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
        {/* Subtle center reticle */}
        <div
          className={`w-2 h-2 rounded-full transition-all duration-150 ${
            hudData.interactionTarget
              ? 'w-4 h-4 bg-amber-400 border border-amber-200 scale-125 shadow-[0_0_15px_rgba(245,158,11,0.9)]'
              : hudData.isChased
              ? 'bg-red-400'
              : 'bg-stone-300/60'
          }`}
        />

        {/* Interaction Prompt */}
        {hudData.interactionTarget && (
          <div className="mt-8 flex flex-col items-center gap-1.5 animate-in fade-in duration-150 pointer-events-auto">
            <button
              onClick={onInteract}
              className="flex items-center gap-2.5 px-4 py-2 rounded-xl bg-stone-900/95 border border-amber-500/70 text-amber-300 shadow-[0_0_25px_rgba(245,158,11,0.35)] cursor-pointer hover:bg-stone-800 transition active:scale-95"
            >
              <kbd className="px-2 py-0.5 rounded bg-amber-500 text-stone-950 font-mono font-bold text-xs shadow-sm">
                E
              </kbd>
              <span className="text-xs md:text-sm font-medium tracking-wide">
                {hudData.interactionTarget.promptText}
              </span>
            </button>
          </div>
        )}
      </div>

      {/* ======================================================== */}
      {/* BOTTOM CLUSTERS: Battery, Stamina & Inventory            */}
      {/* ======================================================== */}
      <div className="flex items-end justify-between w-full">
        {/* Flashlight Battery Cluster */}
        <div className="flex flex-col gap-1.5 p-3 rounded-2xl bg-stone-900/90 border border-stone-800 shadow-lg min-w-[170px]">
          <div className="flex items-center justify-between text-xs">
            <div className="flex items-center gap-1.5 text-stone-300 font-medium">
              {isLowBattery ? (
                <BatteryWarning className="w-4 h-4 text-red-500" />
              ) : hudData.flashlightOn ? (
                <BatteryCharging className="w-4 h-4 text-amber-400" />
              ) : (
                <BatteryMedium className="w-4 h-4 text-stone-400" />
              )}
              <span className="text-[11px] font-mono tracking-wider">LANTERN</span>
            </div>

            <button
              onClick={onToggleFlashlight}
              className="pointer-events-auto px-1.5 py-0.5 rounded border border-stone-700 bg-stone-800 hover:border-amber-500/50 text-[10px] font-mono text-stone-300 hover:text-amber-300 cursor-pointer transition"
            >
              [F] {hudData.flashlightOn ? 'ON' : 'OFF'}
            </button>
          </div>

          <div className="w-full h-2 rounded-full bg-stone-950 overflow-hidden border border-stone-800">
            <div
              className={`h-full transition-all duration-300 ${
                isLowBattery
                  ? 'bg-red-500 shadow-[0_0_8px_rgba(239,68,68,0.7)]'
                  : hudData.flashlightOn
                  ? 'bg-amber-400 shadow-[0_0_8px_rgba(245,158,11,0.4)]'
                  : 'bg-stone-500'
              }`}
              style={{ width: `${hudData.battery}%` }}
            />
          </div>

          <div className="flex justify-between items-center text-[10px] font-mono text-stone-400">
            <span>POWER</span>
            <span className={`tabular-nums font-semibold ${isLowBattery ? 'text-red-400' : 'text-stone-200'}`}>
              {hudData.battery}%
            </span>
          </div>
        </div>

        {/* Center Desktop Controls reminder */}
        <div className="hidden lg:block text-[11px] font-mono text-stone-400 tracking-wider bg-stone-900/60 px-3 py-1 rounded-full border border-stone-800/60">
          Click screen to lock cursor · WASD Move · Shift Sprint · E Interact
        </div>

        {/* Stamina & Inventory Cluster */}
        <div className="flex items-center gap-3">
          {/* Stamina Bar */}
          <div className="flex flex-col gap-1.5 p-3 rounded-2xl bg-stone-900/90 border border-stone-800 shadow-lg min-w-[140px]">
            <div className="flex items-center justify-between text-xs text-stone-300">
              <div className="flex items-center gap-1">
                <Zap className="w-3.5 h-3.5 text-cyan-400" />
                <span className="text-[11px] font-mono tracking-wider">STAMINA</span>
              </div>
              <span className="text-[10px] font-mono text-stone-400 tabular-nums">
                {hudData.stamina}%
              </span>
            </div>

            <div className="w-full h-2 rounded-full bg-stone-950 overflow-hidden border border-stone-800">
              <div
                className="h-full bg-cyan-500 transition-all duration-150"
                style={{ width: `${hudData.stamina}%` }}
              />
            </div>
          </div>

          {/* Inventory Slot: Eye of Horus Amulet */}
          <div
            className={`w-14 h-14 rounded-2xl border flex flex-col items-center justify-center p-1 transition-all ${
              hasArtifact
                ? 'bg-amber-950/40 border-amber-500 shadow-[0_0_20px_rgba(245,158,11,0.35)]'
                : 'bg-stone-900/80 border-stone-800 text-stone-700'
            }`}
            title={hasArtifact ? 'Eye of Horus Golden Amulet' : 'Sacred Artifact Slot (Empty)'}
          >
            {hasArtifact ? (
              <>
                <span className="text-xl text-amber-400 leading-none">𓁐</span>
                <span className="text-[9px] font-mono text-amber-300 font-bold tracking-tight mt-1">
                  HORUS
                </span>
              </>
            ) : (
              <span className="text-xl opacity-30">☥</span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
