'use client';

import dynamic from 'next/dynamic';
import { DimensionsPanel } from '@/features/dimensions/components/DimensionsPanel';
import { RoofPanel } from '@/features/roof/components/RoofPanel';
import { GatesPanel } from '@/features/gate/components/GatesPanel';
import { ConstructionPanel } from '@/features/construction/components/ConstructionPanel';
import { useConfigStore } from '@/store/useConfigStore';

// Canvas must be client-only — no SSR
const GarageScene = dynamic(() => import('@/features/garage/components/GarageScene'), {
  ssr: false,
  loading: () => (
    <div className="flex-1 flex items-center justify-center bg-slate-800 text-slate-400 text-sm">
      Ładowanie sceny 3D…
    </div>
  ),
});

export default function ConfiguratorPage() {
  const config = useConfigStore(s => s.config);
  const { width: W, height: H, depth: D } = config.dimensions;

  return (
    <div style={{ display: 'flex', height: '100vh', width: '100vw', overflow: 'hidden' }} className="bg-slate-950 font-sans">
      {/* ── Left panel ────────────────────────────────────────────── */}
      <aside style={{ width: '320px', minWidth: '288px', height: '100vh', display: 'grid', gridTemplateRows: 'auto 1fr auto', overflow: 'hidden', flexShrink: 0 }} className="bg-slate-950 border-r border-slate-800">
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
        <div style={{ overflowY: 'scroll', minHeight: 0 }} className="p-3 flex flex-col gap-2.5 sidebar-scroll">
          <DimensionsPanel />
          <RoofPanel />
          <GatesPanel />
          <ConstructionPanel />
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

      {/* ── 3D Viewport ───────────────────────────────────────────── */}
      <main style={{ flex: 1, position: 'relative', overflow: 'hidden' }}>
        <GarageScene />

        {/* Camera hint overlay */}
        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-4 pointer-events-none">
          {[
            { key: 'Przeciągnij', sub: 'Obróć' },
            { key: 'Scroll', sub: 'Zoom' },
            { key: 'Shift+Drag', sub: 'Pan' },
          ].map(h => (
            <div key={h.key} className="flex flex-col items-center bg-black/40 backdrop-blur-sm px-3 py-1.5 rounded-lg">
              <span className="text-[10px] font-semibold text-white/80">{h.key}</span>
              <span className="text-[9px] text-white/50">{h.sub}</span>
            </div>
          ))}
        </div>
      </main>
    </div>
  );
}
