'use client';

import { useEffect, useRef, useState } from 'react';
import type { OrbitControls as OrbitControlsImpl } from 'three-stdlib';
import { useUIStore } from '@/store/useUIStore';
import { useConfigStore } from '@/store/useConfigStore';

interface Props {
  controlsRef: React.RefObject<OrbitControlsImpl | null>;
}

const WALL_VIEWS = [
  { label: 'przedniej', azimuth: 0 },
  { label: 'lewej',     azimuth: Math.PI / 2 },
  { label: 'prawej',    azimuth: -Math.PI / 2 },
  { label: 'tylnej',    azimuth: Math.PI },
] as const;

export default function ViewControls({ controlsRef }: Props) {
  const [open, setOpen] = useState(false);
  const panelRef = useRef<HTMLDivElement>(null);

  const hideRoof   = useUIStore(s => s.hideRoof);
  const setHideRoof = useUIStore(s => s.setHideRoof);
  const dim = useConfigStore(s => s.config.dimensions);

  // Close on outside click
  useEffect(() => {
    if (!open) return;
    function onDown(e: MouseEvent) {
      if (panelRef.current && !panelRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener('mousedown', onDown);
    return () => document.removeEventListener('mousedown', onDown);
  }, [open]);

  function centerToWall(azimuth: number) {
    const ctrl = controlsRef.current;
    if (!ctrl) return;

    const { width: W, height: H, depth: D } = dim;
    const dist   = Math.max(W, D) * 2.2 + 2;
    const targetY = H / 2;

    ctrl.target.set(0, targetY, 0);
    ctrl.object.position.set(
      Math.sin(azimuth) * dist,
      H * 0.8,
      Math.cos(azimuth) * dist,
    );
    ctrl.update();
    setOpen(false);
  }

  return (
    <div ref={panelRef} className="absolute bottom-14 left-3 lg:bottom-4 lg:left-4 z-10">
      {/* Popup panel */}
      {open && (
        <div className="mb-2 w-64 rounded-2xl bg-white shadow-xl p-5 text-slate-800 animate-in fade-in slide-in-from-bottom-2 duration-150">
          <p className="text-sm font-semibold mb-3">Pokaż na wizualizacji:</p>

          {/* Checkboxes */}
          <div className="space-y-2 mb-5">
            <label className="flex items-center gap-3 cursor-pointer select-none px-3 py-2 rounded-2xl border border-slate-200 hover:bg-slate-50 transition-colors">
              <input
                type="checkbox"
                checked={hideRoof}
                onChange={e => setHideRoof(e.target.checked)}
                className="w-4 h-4 accent-blue-600 rounded"
              />
              <span className="text-sm font-medium">Ukryj dach</span>
            </label>
          </div>

          {/* Camera centering */}
          <p className="text-sm font-semibold mb-2">Wycentruj do ściany:</p>
          <div className="flex flex-wrap gap-2">
            {WALL_VIEWS.map(v => (
              <button
                key={v.label}
                onClick={() => centerToWall(v.azimuth)}
                className="px-3 py-1.5 rounded-full border border-slate-200 text-sm hover:bg-slate-100 transition-colors"
              >
                {v.label}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Trigger button */}
      <button
        onClick={() => setOpen(o => !o)}
        aria-label="Opcje widoku"
        className="flex items-center gap-2 px-4 py-2.5 rounded-2xl bg-white shadow-lg text-slate-800 text-sm font-medium hover:bg-slate-50 active:scale-95 transition-all"
      >
        {/* sliders icon */}
        <svg className="w-4 h-4 shrink-0" viewBox="0 0 20 20" fill="currentColor">
          <path d="M5 4a1 1 0 00-2 0v7.268a2 2 0 000 3.464V16a1 1 0 102 0v-1.268a2 2 0 000-3.464V4zM11 4a1 1 0 10-2 0v1.268a2 2 0 000 3.464V16a1 1 0 102 0V8.732a2 2 0 000-3.464V4zM16 3a1 1 0 011 1v7.268a2 2 0 010 3.464V16a1 1 0 11-2 0v-1.268a2 2 0 010-3.464V4a1 1 0 011-1z" />
        </svg>
        widok
      </button>
    </div>
  );
}
