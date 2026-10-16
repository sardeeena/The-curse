'use client';

import React, { useRef, useState, useEffect } from 'react';
import { Hand, Lightbulb, Zap, Pause } from 'lucide-react';

interface MobileControlsProps {
  onMove: (normX: number, normY: number) => void;
  onRotate: (deltaX: number, deltaY: number) => void;
  onToggleSprint: (sprinting: boolean) => void;
  onInteract: () => void;
  onToggleFlashlight: () => void;
  onPause: () => void;
}

export const MobileControls: React.FC<MobileControlsProps> = ({
  onMove,
  onRotate,
  onToggleSprint,
  onInteract,
  onToggleFlashlight,
  onPause,
}) => {
  const [isTouchDevice, setIsTouchDevice] = useState(false);
  const joystickRef = useRef<HTMLDivElement>(null);
  const touchAreaRightRef = useRef<HTMLDivElement>(null);
  const [knobPos, setKnobPos] = useState({ x: 0, y: 0 });
  const [isSprinting, setIsSprinting] = useState(false);

  useEffect(() => {
    // Detect touch capability or narrow mobile screen
    const checkTouch = () => {
      const hasTouch = 'ontouchstart' in window || navigator.maxTouchPoints > 0 || window.innerWidth < 1024;
      setIsTouchDevice(hasTouch);
    };
    checkTouch();
    window.addEventListener('resize', checkTouch);
    return () => window.removeEventListener('resize', checkTouch);
  }, []);

  // Left Joystick Touch Handling
  const handleJoystickTouch = (e: React.TouchEvent) => {
    if (!joystickRef.current) return;
    const touch = e.touches[0];
    const rect = joystickRef.current.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;

    const deltaX = touch.clientX - centerX;
    const deltaY = touch.clientY - centerY;
    const radius = rect.width / 2;

    const dist = Math.sqrt(deltaX * deltaX + deltaY * deltaY);
    const clampedDist = Math.min(radius, dist);
    const angle = Math.atan2(deltaY, deltaX);

    const normX = clampedDist > 0 ? (Math.cos(angle) * clampedDist) / radius : 0;
    const normY = clampedDist > 0 ? (Math.sin(angle) * clampedDist) / radius : 0;

    setKnobPos({
      x: normX * (radius - 16),
      y: normY * (radius - 16),
    });

    onMove(normX, normY);
  };

  const handleJoystickEnd = () => {
    setKnobPos({ x: 0, y: 0 });
    onMove(0, 0);
  };

  // Right Look Swipe Touch Handling
  const lastTouchRef = useRef<{ x: number; y: number } | null>(null);

  const handleLookTouchStart = (e: React.TouchEvent) => {
    const touch = e.touches[0];
    lastTouchRef.current = { x: touch.clientX, y: touch.clientY };
  };

  const handleLookTouchMove = (e: React.TouchEvent) => {
    if (!lastTouchRef.current) return;
    const touch = e.touches[0];
    const dx = touch.clientX - lastTouchRef.current.x;
    const dy = touch.clientY - lastTouchRef.current.y;
    lastTouchRef.current = { x: touch.clientX, y: touch.clientY };

    onRotate(dx * 1.5, dy * 1.5);
  };

  const handleLookTouchEnd = () => {
    lastTouchRef.current = null;
  };

  if (!isTouchDevice) return null;

  return (
    <div className="absolute inset-0 z-25 pointer-events-none select-none">
      {/* Right-half drag-to-look touch surface */}
      <div
        ref={touchAreaRightRef}
        onTouchStart={handleLookTouchStart}
        onTouchMove={handleLookTouchMove}
        onTouchEnd={handleLookTouchEnd}
        onTouchCancel={handleLookTouchEnd}
        className="absolute right-0 top-16 bottom-24 w-1/2 pointer-events-auto opacity-0"
      />

      {/* Left Virtual Joystick */}
      <div
        ref={joystickRef}
        onTouchStart={handleJoystickTouch}
        onTouchMove={handleJoystickTouch}
        onTouchEnd={handleJoystickEnd}
        onTouchCancel={handleJoystickEnd}
        className="absolute left-6 bottom-24 w-28 h-28 rounded-full border-2 border-amber-500/30 bg-stone-900/60 pointer-events-auto flex items-center justify-center shadow-lg"
      >
        <div
          className="w-12 h-12 rounded-full bg-amber-500/80 border border-amber-300 shadow-md transition-transform"
          style={{
            transform: `translate(${knobPos.x}px, ${knobPos.y}px)`,
          }}
        />
      </div>

      {/* Mobile Action Buttons (Right Side) */}
      <div className="absolute right-6 bottom-24 flex flex-col gap-3 pointer-events-auto">
        <button
          onClick={onInteract}
          aria-label="Interact"
          className="w-13 h-13 rounded-full bg-amber-500 text-stone-950 flex items-center justify-center shadow-[0_0_15px_rgba(245,158,11,0.5)] active:scale-90 transition cursor-pointer"
        >
          <Hand className="w-6 h-6" />
        </button>

        <button
          onClick={onToggleFlashlight}
          aria-label="Toggle Flashlight"
          className="w-11 h-11 rounded-full bg-stone-800 border border-amber-500/40 text-amber-400 flex items-center justify-center active:scale-90 transition cursor-pointer"
        >
          <Lightbulb className="w-5 h-5" />
        </button>

        <button
          onClick={() => {
            const nextSprint = !isSprinting;
            setIsSprinting(nextSprint);
            onToggleSprint(nextSprint);
          }}
          aria-label="Toggle Sprint"
          className={`w-11 h-11 rounded-full border flex items-center justify-center active:scale-90 transition cursor-pointer ${
            isSprinting
              ? 'bg-cyan-500 text-stone-950 border-cyan-300 shadow-[0_0_15px_rgba(6,182,212,0.5)]'
              : 'bg-stone-800 border-stone-700 text-cyan-400'
          }`}
        >
          <Zap className="w-5 h-5" />
        </button>
      </div>

      {/* Mobile Top Pause Button */}
      <button
        onClick={onPause}
        aria-label="Pause"
        className="absolute top-4 left-4 w-10 h-10 rounded-xl bg-stone-900/90 border border-stone-800 text-stone-200 flex items-center justify-center pointer-events-auto active:scale-95 transition cursor-pointer"
      >
        <Pause className="w-5 h-5" />
      </button>
    </div>
  );
};
