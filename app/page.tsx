'use client';

import React, { useEffect, useRef, useState, useCallback } from 'react';
import { Game, GameHUDData } from '../src/game/Game';
import { GameMode, GameSettings, InspectionData } from '../src/game/GameState';
import { TitleScreen } from '../src/components/TitleScreen';
import { GameHUD } from '../src/components/GameHUD';
import { PauseMenu } from '../src/components/PauseMenu';
import { SettingsModal } from '../src/components/SettingsModal';
import { ControlsModal } from '../src/components/ControlsModal';
import { InspectionModal } from '../src/components/InspectionModal';
import { VictoryModal } from '../src/components/VictoryModal';
import { GameOverModal } from '../src/components/GameOverModal';
import { MobileControls } from '../src/components/MobileControls';

export default function GamePage() {
  const canvasMountRef = useRef<HTMLDivElement>(null);
  const gameRef = useRef<Game | null>(null);

  const [mode, setMode] = useState<GameMode>('MENU');
  const [hudData, setHudData] = useState<GameHUDData>({
    health: 100,
    maxHealth: 100,
    battery: 100,
    flashlightOn: true,
    stamina: 100,
    interactionTarget: null,
    mode: 'MENU',
    objective: 'Explore the tomb corridors and investigate the Scribe\'s Archive.',
    guardianState: 'DORMANT',
    isChased: false,
  });
  const [hasArtifact, setHasArtifact] = useState(false);
  const [hasCheckpoint, setHasCheckpoint] = useState(false);
  const [damageFlash, setDamageFlash] = useState(false);
  const [inspection, setInspection] = useState<InspectionData | null>(null);
  const [notification, setNotification] = useState<string | null>(null);
  const [showSettings, setShowSettings] = useState(false);
  const [showControls, setShowControls] = useState(false);
  const [settings, setSettings] = useState<GameSettings>({
    sensitivity: 1.0,
    volume: 0.7,
    graphicsQuality: 'HIGH',
    invertY: false,
  });

  // Damage flash effect timeout
  const damageFlashTimeout = useRef<NodeJS.Timeout | null>(null);

  // Toast notification auto-dismiss
  const notifyTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const triggerNotification = useCallback((msg: string) => {
    setNotification(msg);
    if (notifyTimeoutRef.current) clearTimeout(notifyTimeoutRef.current);
    notifyTimeoutRef.current = setTimeout(() => {
      setNotification(null);
    }, 3500);
  }, []);

  useEffect(() => {
    if (!canvasMountRef.current) return;

    // Initialize 3D game instance once
    const game = new Game(canvasMountRef.current);
    gameRef.current = game;
    setSettings(game.state.settings);

    // Subscribe to Game HUD updates
    game.onHUDUpdate = (data) => {
      setHudData({ ...data });
    };

    // Subscribe to Game State changes
    game.state.addListener({
      onModeChange: (newMode) => {
        setMode(newMode);
        if (game.state.checkpointSaved) {
          setHasCheckpoint(true);
        }
      },
      onInventoryUpdate: (inv) => setHasArtifact(inv.hasArtifact),
      onInspection: (data) => setInspection(data),
      onNotification: (msg) => triggerNotification(msg),
      onDamageTaken: () => {
        setDamageFlash(true);
        if (damageFlashTimeout.current) clearTimeout(damageFlashTimeout.current);
        damageFlashTimeout.current = setTimeout(() => {
          setDamageFlash(false);
        }, 320);
      },
      onSettingsChange: (s) => setSettings(s),
    });

    return () => {
      game.destroy();
      gameRef.current = null;
    };
  }, [triggerNotification]);

  // Action Handlers
  const handleStartGame = () => {
    gameRef.current?.startGame();
  };

  const handlePauseGame = () => {
    gameRef.current?.pause();
  };

  const handleResumeGame = () => {
    gameRef.current?.resume();
  };

  const handleRestartGame = () => {
    gameRef.current?.restart(false);
  };

  const handleRespawnCheckpoint = () => {
    gameRef.current?.restart(true);
  };

  const handleQuitToMenu = () => {
    if (gameRef.current) {
      gameRef.current.state.setMode('MENU');
      gameRef.current.player.unlockPointer();
    }
  };

  const handleToggleFlashlight = () => {
    gameRef.current?.flashlight.toggle();
  };

  const handleInteract = () => {
    if (inspection) {
      gameRef.current?.state.showInspection(null);
      return;
    }
    gameRef.current?.interaction.interact();
  };

  const handleUpdateSettings = (partial: Partial<GameSettings>) => {
    gameRef.current?.state.updateSettings(partial);
  };

  return (
    <main className="relative w-screen h-screen overflow-hidden bg-black select-none">
      {/* 3D WebGL Canvas isolated container */}
      <div
        ref={canvasMountRef}
        className="absolute inset-0 w-full h-full cursor-crosshair z-0"
      />

      {/* Screen 1: Title Screen (During MENU state) */}
      {mode === 'MENU' && (
        <TitleScreen
          onStart={handleStartGame}
          onOpenSettings={() => setShowSettings(true)}
          onOpenControls={() => setShowControls(true)}
        />
      )}

      {/* Screen 2: In-Game HUD (During PLAYING or PAUSED) */}
      {(mode === 'PLAYING' || mode === 'PAUSED') && (
        <>
          <GameHUD
            hudData={hudData}
            hasArtifact={hasArtifact}
            notification={notification}
            damageFlash={damageFlash}
            onPause={handlePauseGame}
            onToggleFlashlight={handleToggleFlashlight}
            onInteract={handleInteract}
          />

          <MobileControls
            onMove={(nx, ny) => {
              if (gameRef.current) {
                gameRef.current.player.virtualMove.set(nx, ny);
              }
            }}
            onRotate={(dx, dy) => {
              gameRef.current?.player.rotate(dx, dy);
            }}
            onToggleSprint={(sprinting) => {
              if (gameRef.current) {
                gameRef.current.player.input.sprint = sprinting;
              }
            }}
            onInteract={handleInteract}
            onToggleFlashlight={handleToggleFlashlight}
            onPause={handlePauseGame}
          />
        </>
      )}

      {/* Screen 3: Pause Menu */}
      {mode === 'PAUSED' && (
        <PauseMenu
          hasCheckpoint={hasCheckpoint}
          onResume={handleResumeGame}
          onRestart={handleRestartGame}
          onRespawnCheckpoint={handleRespawnCheckpoint}
          onOpenSettings={() => setShowSettings(true)}
          onOpenControls={() => setShowControls(true)}
          onQuitToMenu={handleQuitToMenu}
        />
      )}

      {/* Screen 4: Victory Modal */}
      {mode === 'VICTORY' && (
        <VictoryModal
          onRestart={handleRestartGame}
          onQuitToMenu={handleQuitToMenu}
        />
      )}

      {/* Screen 5: Death / Game Over Modal */}
      {mode === 'GAMEOVER' && (
        <GameOverModal
          hasCheckpoint={hasCheckpoint}
          onRespawnCheckpoint={handleRespawnCheckpoint}
          onRestartChapter={handleRestartGame}
          onQuitToMenu={handleQuitToMenu}
        />
      )}

      {/* Overlay: Inspection Reader */}
      {inspection && (
        <InspectionModal
          data={inspection}
          onClose={() => gameRef.current?.state.showInspection(null)}
        />
      )}

      {/* Overlay: Settings Modal */}
      {showSettings && (
        <SettingsModal
          settings={settings}
          onUpdate={handleUpdateSettings}
          onClose={() => setShowSettings(false)}
        />
      )}

      {/* Overlay: Controls Modal */}
      {showControls && (
        <ControlsModal onClose={() => setShowControls(false)} />
      )}
    </main>
  );
}
