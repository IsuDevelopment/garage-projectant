'use client';

import { Suspense, useCallback, useEffect, useRef, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import dynamic from 'next/dynamic';
import { DimensionsPanel } from '@/features/dimensions/components/DimensionsPanel';
import { RoofPanel } from '@/features/roof/components/RoofPanel';
import { GatesPanel } from '@/features/gate/components/GatesPanel';
import { DoorsPanel } from '@/features/doors/components/DoorsPanel';
import { ConstructionPanel } from '@/features/construction/components/ConstructionPanel';
import { GutterPanel } from '@/features/gutters/components/GutterPanel';
import { AdditionalServicesPanel } from '@/features/additional-services/components/AdditionalServicesPanel';
import { useConfigStore } from '@/store/useConfigStore';
import { useSettings } from '@/config/useSettings';
import { useUIStore } from '@/store/useUIStore';
import { SettingsProvider } from '@/config/SettingsContext';
import { CollisionDialog } from '@/shared/components/CollisionDialog';
import { GarageExpandDialog } from '@/shared/components/GarageExpandDialog';
import { getAvailableProfiles, getAvailableRoofSlopes, getElementBinding, getGateTypes } from '@/config/settings';
import type { ConfiguratorSettings } from '@/config/settings';
import { getDoorTypes } from '@/config/settings';
import type { GateType, MaterialType } from '@/store/types';

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
  const materialMap = new Map(settings.materials.map(m => [m.slug, m]));
  const roofSlopes = getAvailableRoofSlopes(settings);
  const profiles = getAvailableProfiles(settings);
  const gateTypes = getGateTypes(settings).map(t => t.slug);
    const doorTypes = getDoorTypes(settings).map(t => t.slug);
  const wallsBinding = getElementBinding(settings, 'walls');
  const roofBinding = getElementBinding(settings, 'roof');
  const gatesBinding = getElementBinding(settings, 'gates');

  const firstFor = (element: 'walls' | 'roof' | 'gates') =>
    settings.materials.find(m => getElementBinding(settings, element).allowedMaterials.includes(m.slug));

  const firstRoofForSlope = () =>
    settings.materials.find(m =>
      roofBinding.allowedMaterials.includes(m.slug) && (!m.allowedSlopes || m.allowedSlopes.includes(config.roof.slopeType)),
    );

  const materialFromDef = (def: ConfiguratorSettings['materials'][number]) => ({
    type: def.slug,
    color: def.defaultColor,
    customSpriteUrl: def.texture,
    subOptions: def.subFeatures?.reduce((acc, sf) => {
      acc[sf.slug] = sf.default;
      return acc;
    }, {} as Record<string, string | number>),
  });

  const normalizeColor = (type: MaterialType, color: string) => {
    const def = materialMap.get(type);
    if (!def) return color;
    if (!def.allowColors) return def.defaultColor;
    if (def.colorSet?.length) {
      const allowed = def.colorSet.map(c => c.color.toLowerCase());
      if (!allowed.includes(color.toLowerCase())) return def.defaultColor;
    }
    return color;
  };

  const setAdditionalFeature = store.setAdditionalFeature;

  // Roof slope
  if (!roofSlopes.includes(config.roof.slopeType)) {
    const fallback = roofSlopes[0];
    if (fallback) patches.push(() => store.setRoofSlope(fallback));
  }

  // Construction material (walls)
  const constructionDef = materialMap.get(config.construction.material.type);
  if (!constructionDef || !wallsBinding.allowedMaterials.includes(constructionDef.slug)) {
    const fallback = firstFor('walls');
    if (fallback) {
      patches.push(() => store.setConstructionMaterial({
        type: fallback.slug,
        color: fallback.defaultColor,
        customSpriteUrl: fallback.texture,
      }));
    }
  } else {
    const normalizedColor = normalizeColor(config.construction.material.type, config.construction.material.color);
    if (normalizedColor !== config.construction.material.color) {
      patches.push(() => store.setConstructionMaterial({
        ...config.construction.material,
        color: normalizedColor,
      }));
    }
  }

  // Profile type
  if (!profiles.includes(config.construction.profileType)) {
    const fallback = profiles[0];
    if (fallback) patches.push(() => store.setProfileType(fallback));
  }

  // Roof material (if set and disallowed)
  if (config.roof.material) {
    const roofMaterial = config.roof.material;
    const roofDef = materialMap.get(roofMaterial.type);
    const roofAllowed = roofDef
      && roofBinding.allowedMaterials.includes(roofDef.slug)
      && (!roofDef.allowedSlopes || roofDef.allowedSlopes.includes(config.roof.slopeType));

    if (!roofAllowed) {
      patches.push(() => store.setRoofMaterial(null));
    } else {
      const normalizedColor = normalizeColor(roofMaterial.type, roofMaterial.color);
      if (normalizedColor !== roofMaterial.color) {
        patches.push(() => store.setRoofMaterial({ ...roofMaterial, color: normalizedColor }));
      }
    }
  } else {
    const inheritedDef = materialMap.get(config.construction.material.type);
    const inheritedAllowed = inheritedDef
      && roofBinding.allowedMaterials.includes(inheritedDef.slug)
      && (!inheritedDef.allowedSlopes || inheritedDef.allowedSlopes.includes(config.roof.slopeType));
    if (!inheritedAllowed) {
      const fallback = firstRoofForSlope();
      if (fallback) patches.push(() => store.setRoofMaterial(materialFromDef(fallback)));
    }
  }

  // Gate types
  config.gates.forEach(gate => {
    if (!gateTypes.includes(gate.type)) {
      const fallback = gateTypes[0];
      if (fallback) patches.push(() => store.updateGate(gate.id, { type: fallback }));
    }
    if (gate.material) {
      const gateMaterial = gate.material;
      const gateDef = materialMap.get(gateMaterial.type);
      if (!gateDef || !gatesBinding.allowedMaterials.includes(gateDef.slug)) {
        patches.push(() => store.updateGate(gate.id, { material: null }));
      } else {
        const normalizedColor = normalizeColor(gateMaterial.type, gateMaterial.color);
        if (normalizedColor !== gateMaterial.color) {
          patches.push(() => store.updateGate(gate.id, { material: { ...gateMaterial, color: normalizedColor } }));
        }
      }
    } else {
      const inheritedDef = materialMap.get(config.construction.material.type);
      const inheritedAllowed = inheritedDef && gatesBinding.allowedMaterials.includes(inheritedDef.slug);
      if (!inheritedAllowed) {
        const fallback = firstFor('gates');
        if (fallback) {
          patches.push(() => store.updateGate(gate.id, { material: materialFromDef(fallback) }));
        }
      }
    }
  });

  // Additional services
  const additionalSettings = (settings.additionalFeatures ?? []).filter(feature => feature.enabled !== false);

    // Door types
    config.doors?.forEach(door => {
      if (doorTypes.length && !doorTypes.includes(door.typeSlug)) {
        const fallback = doorTypes[0];
        if (fallback) patches.push(() => store.updateDoor(door.id, { typeSlug: fallback }));
      }
    });

  const additionalMap = new Map(additionalSettings.map(f => [f.slug, f]));

  Object.entries(config.additionalFeatures).forEach(([slug]) => {
    if (!additionalMap.has(slug)) {
      patches.push(() => setAdditionalFeature(slug, { enabled: false }));
    }
  });

  additionalSettings.forEach(feature => {
    const current = config.additionalFeatures[feature.slug];
    const firstOption = feature.options?.[0];
    const selectedSlug = current?.selectedOptionSlug ?? firstOption?.slug ?? null;
    const selectedOption = feature.options?.find(o => o.slug === selectedSlug) ?? firstOption;

    if (!current) {
      patches.push(() => setAdditionalFeature(feature.slug, {
        enabled: false,
        selectedOptionSlug: selectedOption?.slug ?? null,
        optionColor: selectedOption?.defaultColor ?? '#8f969f',
      }));
      return;
    }

    if (selectedSlug && !feature.options?.some(o => o.slug === selectedSlug)) {
      patches.push(() => setAdditionalFeature(feature.slug, {
        selectedOptionSlug: selectedOption?.slug ?? null,
      }));
    }

    if (selectedOption?.allowColor === false && current.optionColor !== (selectedOption.defaultColor ?? '#8f969f')) {
      patches.push(() => setAdditionalFeature(feature.slug, {
        optionColor: selectedOption.defaultColor ?? '#8f969f',
      }));
    }
  });

  patches.forEach(fn => fn());
}

function ConfiguratorInner() {
  const searchParams = useSearchParams();
  const apiKey = searchParams.get('key');
  const settings = useSettings(apiKey);
  const sanitized = useRef(false);

  // ── Resizable sidebar (desktop only) ────────────────────────────────────
  const [sidebarWidth, setSidebarWidth] = useState(460);
  const resizing = useRef(false);

  const startResize = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    resizing.current = true;
    document.body.style.cursor = 'col-resize';
    document.body.style.userSelect = 'none';

    const onMove = (ev: MouseEvent) => {
      if (!resizing.current) return;
      const maxW = window.innerWidth * 0.4;
      setSidebarWidth(Math.min(Math.max(ev.clientX, 340), maxW));
    };
    const onUp = () => {
      resizing.current = false;
      document.body.style.cursor = '';
      document.body.style.userSelect = '';
      window.removeEventListener('mousemove', onMove);
      window.removeEventListener('mouseup', onUp);
    };
    window.addEventListener('mousemove', onMove);
    window.addEventListener('mouseup', onUp);
  }, []);

  useEffect(() => {
    if (!settings || sanitized.current) return;
    sanitized.current = true;
    sanitizeConfigToSettings(settings);
  }, [settings]);

  const config = useConfigStore(s => s.config);
  const applyPendingDimensions = useConfigStore(s => s.applyPendingDimensions);
  const removeGate = useConfigStore(s => s.removeGate);
    const removeDoor = useConfigStore(s => s.removeDoor);
  const setWidth  = useConfigStore(s => s.setWidth);
  const setDepth  = useConfigStore(s => s.setDepth);
  const setHeight = useConfigStore(s => s.setHeight);
  const updateGate = useConfigStore(s => s.updateGate);
  const collisionDialog = useUIStore(s => s.collisionDialog);
  const closeCollisionDialog = useUIStore(s => s.closeCollisionDialog);
  const expandGarageDialog = useUIStore(s => s.expandGarageDialog);
  const closeExpandGarageDialog = useUIStore(s => s.closeExpandGarageDialog);
  const hasAdditionalServices = ((settings?.additionalFeatures ?? []).filter(feature => feature.enabled !== false).length ?? 0) > 0;
  const { width: W, height: H, depth: D } = config.dimensions;

  function handleCollisionConfirm() {
    if (!collisionDialog.pendingDimensions) return;
    collisionDialog.conflicts.forEach(c => {
      removeGate(c.id);
      removeDoor(c.id);
    });
    applyPendingDimensions(collisionDialog.pendingDimensions);
    closeCollisionDialog();
  }

  function handleExpandGarageConfirm() {
    const { dimension, requiredMeters, gateId, pendingGateType, pendingGateWidth, pendingGateHeight } = expandGarageDialog;
    if (!dimension) return;
    if (dimension === 'width')  setWidth(requiredMeters);
    if (dimension === 'depth')  setDepth(requiredMeters);
    if (dimension === 'height') setHeight(requiredMeters);
    if (gateId) {
      updateGate(gateId, {
        ...(pendingGateType  ? { type: pendingGateType as GateType } : {}),
        ...(pendingGateWidth  != null ? { width:  pendingGateWidth  } : {}),
        ...(pendingGateHeight != null ? { height: pendingGateHeight } : {}),
      });
    }
    closeExpandGarageDialog();
  }

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
      <CollisionDialog
        open={collisionDialog.open}
        conflicts={collisionDialog.conflicts}
        onConfirm={handleCollisionConfirm}
        onCancel={closeCollisionDialog}
      />
      <GarageExpandDialog
        state={expandGarageDialog}
        onConfirm={handleExpandGarageConfirm}
        onCancel={closeExpandGarageDialog}
      />
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
      <aside
        className="configurator-sidebar order-2 relative border-t border-slate-800 bg-slate-950 lg:order-1 lg:h-full lg:border-r lg:border-t-0 lg:grid lg:grid-rows-[auto_1fr_auto] lg:overflow-hidden"
        style={{ '--sidebar-w': `${sidebarWidth}px` } as React.CSSProperties}
      >
        {/* Drag handle — desktop only */}
        <div
          className="sidebar-resize-handle hidden lg:block"
          onMouseDown={startResize}
        />
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
                    <DoorsPanel />
          <GutterPanel />
          {hasAdditionalServices && <AdditionalServicesPanel />}
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
