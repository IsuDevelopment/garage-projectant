'use client';

import { Suspense, useEffect, useRef } from 'react';
import { useSearchParams } from 'next/navigation';
import dynamic from 'next/dynamic';
import { DimensionsPanel } from '@/features/dimensions/components/DimensionsPanel';
import { RoofPanel } from '@/features/roof/components/RoofPanel';
import { GatesPanel } from '@/features/gate/components/GatesPanel';
import { ConstructionPanel } from '@/features/construction/components/ConstructionPanel';
import { GutterPanel } from '@/features/gutters/components/GutterPanel';
import { useConfigStore } from '@/store/useConfigStore';
import { useSettings } from '@/config/useSettings';
import { SettingsProvider } from '@/config/SettingsContext';
import type { ConfiguratorSettings } from '@/config/settings';

// Canvas must be client-only — no SSR
const GarageScene = dynamic(() => import('@/features/garage/components/GarageScene'), {
  ssr: false,
  loading: () => (
    <div className="flex-1 flex items-center justify-center bg-slate-800 text-slate-400 text-sm">
      Ładowanie sceny 3D…
    </div>
  ),
});

function sanitizeConfigToSettings(settings: ConfiguratorSettings) {
  const store = useConfigStore.getState();
  const config = store.config;
  const patches: (() => void)[] = [];

  // Roof slope
  if (!settings.availableRoofSlopes.includes(config.roof.slopeType)) {
    const fallback = settings.availableRoofSlopes[0];
    if (fallback) patches.push(() => store.setRoofSlope(fallback));
  }

  // Construction material
  if (!settings.availableMaterials.includes(config.construction.material.type)) {
    const fallback = settings.availableMaterials[0];
    if (fallback) patches.push(() => store.setConstructionMaterial({ ...config.construction.material, type: fallback }));
  }

  // Profile type
  if (!settings.availableProfiles.includes(config.construction.profileType)) {
    const fallback = settings.availableProfiles[0];
    if (fallback) patches.push(() => store.setProfileType(fallback));
  }

  // Roof material (if set and not available)
  if (config.roof.material && !settings.availableMaterials.includes(config.roof.material.type)) {
    patches.push(() => store.setRoofMaterial(null));
  }

  // Gate types
  config.gates.forEach(gate => {
    if (!settings.availableGateTypes.includes(gate.type)) {
      const fallback = settings.availableGateTypes[0];
      if (fallback) patches.push(() => store.updateGate(gate.id, { type: fallback }));
    }
    if (gate.material && !settings.availableMaterials.includes(gate.material.type)) {
      patches.push(() => store.updateGate(gate.id, { material: null }));
    }
  });

  patches.forEach(fn => fn());
}

function ConfiguratorInner() {
  const searchParams = useSearchParams();
  const apiKey = searchParams.get('key');
  const settings = useSettings(apiKey);
  const sanitized = useRef(false);

  useEffect(() => {
    if (!settings || sanitized.current) return;
    sanitized.current = true;
    sanitizeConfigToSettings(settings);
  }, [settings]);

  const config = useConfigStore(s => s.config);
  const { width: W, height: H, depth: D } = config.dimensions;

  if (!settings) {
    return (
      <div className="flex min-h-[100dvh] w-full items-center justify-center bg-slate-950">
        <div className="flex flex-col items-center gap-3 text-slate-400">
          <div className="w-8 h-8 border-2 border-slate-600 border-t-amber-400 rounded-full animate-spin" />
          <span className="text-sm">Ładowanie konfiguracji…</span>
        </div>
      </div>
    );
  }

  return (
    <SettingsProvider settings={settings}>
    <div className="flex min-h-[100dvh] w-full flex-col bg-slate-950 font-sans lg:h-screen lg:flex-row lg:overflow-hidden">
      {/* ── 3D Viewport ───────────────────────────────────────────── */}
      <main className="order-1 relative h-[52dvh] min-h-[320px] w-full overflow-hidden lg:order-2 lg:h-full lg:flex-1">
        <GarageScene settings={settings} />

        {/* Camera hint overlay */}
        <div className="pointer-events-none absolute bottom-3 left-1/2 hidden -translate-x-1/2 gap-3 sm:flex lg:bottom-4 lg:gap-4">
          {[
            { key: 'Przeciągnij', sub: 'Obróć' },
            { key: 'Scroll', sub: 'Zoom' },
            { key: 'Shift+Drag', sub: 'Pan' },
          ].map(h => (
            <div key={h.key} className="flex flex-col items-center rounded-lg bg-black/40 px-2.5 py-1.5 backdrop-blur-sm lg:px-3">
              <span className="text-[10px] font-semibold text-white/80">{h.key}</span>
              <span className="text-[9px] text-white/50">{h.sub}</span>
            </div>
          ))}
        </div>
      </main>

      {/* ── Left panel ────────────────────────────────────────────── */}
      <aside className="order-2 w-full border-t border-slate-800 bg-slate-950 lg:order-1 lg:h-full lg:min-w-[288px] lg:w-[320px] lg:flex-shrink-0 lg:border-r lg:border-t-0 lg:grid lg:grid-rows-[auto_1fr_auto] lg:overflow-hidden">
        {/* Header */}
        <div className="px-5 py-4 border-b border-slate-800">
          <h1 className="text-base font-bold text-white tracking-tight">
            Konfigurator Garażu
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            {W.toFixed(1)} × {H.toFixed(1)} × {D.toFixed(1)} m
          </p>
        </div>

        {/* Sections — 1fr grid row, fully constrained */}
        <div className="sidebar-scroll flex flex-col gap-2.5 p-3 lg:min-h-0 lg:overflow-y-scroll">
          <DimensionsPanel />
          <RoofPanel />
          <GatesPanel />
          <ConstructionPanel />
          <GutterPanel />
        </div>

        {/* Footer CTA */}
        <div className="px-4 py-4 border-t border-slate-800">
          <button
            onClick={() => {
              const json = JSON.stringify(config, null, 2);
              navigator.clipboard?.writeText(json);
              alert('Konfiguracja skopiowana do schowka!');
            }}
            className="w-full py-2.5 rounded-lg bg-amber-400 hover:bg-amber-300 text-slate-900 font-semibold text-sm transition-colors"
          >
            Zapytaj o cenę →
          </button>
        </div>
      </aside>
    </div>
    </SettingsProvider>
  );
}

export default function ConfiguratorPage() {
  return (
    <Suspense>
      <ConfiguratorInner />
    </Suspense>
  );
}
