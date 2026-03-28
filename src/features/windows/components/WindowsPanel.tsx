'use client';

import { Plus, Trash2, ChevronDown, ChevronUp, RectangleHorizontal } from 'lucide-react';
import { useMemo, useState } from 'react';
import { AccordionSection } from '@/shared/components/AccordionSection';
import { RadioGroup } from '@/shared/components/RadioGroup';
import { ConfigSlider } from '@/shared/components/ConfigSlider';
import { useConfigStore } from '@/store/useConfigStore';
import { useUIStore } from '@/store/useUIStore';
import {
  cmToMeters,
  getWindowFinishes,
  getWindowGlazings,
  getWindowMaxCount,
  getWindowMaxSillHeightCm,
  getWindowMinSillHeightCm,
  getWindowTypeDefinition,
  getWindowTypes,
  metersToCm,
} from '@/config/settings';
import { useSettingsContext } from '@/config/SettingsContext';
import { WindowConfig, WallSide } from '@/store/types';
import {
  SIDE_MARGIN,
  WALL_LABELS,
  WallObjectBounds,
  wallWidthForSide,
  computePositionBounds,
  snapToNearestValid,
  gatesFitOnWall,
} from '@/store/wallCollision';

const WALL_OPTIONS: { value: WallSide; label: string }[] = [
  { value: 'front', label: 'Przód' },
  { value: 'back',  label: 'Tył' },
  { value: 'left',  label: 'Lewo' },
  { value: 'right', label: 'Prawo' },
];

function WindowEditor({ windowObj }: { windowObj: WindowConfig }) {
  const updateWindow = useConfigStore(s => s.updateWindow);
  const removeWindow = useConfigStore(s => s.removeWindow);
  const dimensions = useConfigStore(s => s.config.dimensions);
  const gates = useConfigStore(s => s.config.gates);
  const doors = useConfigStore(s => s.config.doors);
  const windows = useConfigStore(s => s.config.windows);
  const { setSelectedWindow } = useUIStore();

  const [open, setOpen] = useState(true);
  const gs = useSettingsContext();

  const windowTypes = getWindowTypes(gs);
  const typeDef = getWindowTypeDefinition(gs, windowObj.typeSlug);
  const finishes = getWindowFinishes(gs);
  const glazings = getWindowGlazings(gs);

  const typeOptions = windowTypes.map(t => ({ value: t.slug, label: t.name }));
  const sizeOptions = (typeDef?.sizes ?? []).map(s => ({
    value: `${s.width}x${s.height}`,
    label: s.name ?? `${s.width}×${s.height}`,
  }));
  const activeSizeValue = `${Math.round(windowObj.width * 100)}x${Math.round(windowObj.height * 100)}`;

  const activeFinish = finishes.find(f => f.slug === windowObj.finish) ?? finishes[0];
  const finishOptions = finishes.map(f => ({ value: f.slug, label: f.name }));
  const glazingOptions = glazings.map(g => ({
    value: g.slug,
    label: g.price && g.price > 0 ? `${g.name} (+${g.price})` : g.name,
  }));
  const colorOptions = (activeFinish?.colors ?? []).map(c => ({
    value: c.slug,
    label: c.name,
    icon: <span className="inline-block w-3 h-3 rounded-full border border-slate-500" style={{ backgroundColor: c.color }} />,
  }));

  const minSillCm = getWindowMinSillHeightCm(gs);
  const configuredMaxSillCm = getWindowMaxSillHeightCm(gs);
  const maxSillCmFromWall = metersToCm(Math.max(0, dimensions.height - windowObj.height - 0.2));
  const maxSillCm = Math.max(minSillCm, Math.min(configuredMaxSillCm, maxSillCmFromWall));

  const wallW = wallWidthForSide(dimensions, windowObj.wall);
  const allWallObjs: WallObjectBounds[] = [
    ...gates.filter(g => g.wall === windowObj.wall).map(g => ({ id: g.id, positionX: g.positionX, width: g.width, height: g.height, wall: g.wall })),
    ...doors.filter(d => d.wall === windowObj.wall).map(d => ({ id: d.id, positionX: d.positionX, width: d.width, height: d.height, wall: d.wall })),
    ...windows.filter(w => w.wall === windowObj.wall).map(w => ({ id: w.id, positionX: w.positionX, width: w.width, height: w.height, wall: w.wall })),
  ];
  const { min: posMin, max: posMax, blockedRanges } =
    computePositionBounds(wallW, windowObj.width, allWallObjs, windowObj.id);

  function onTypeChange(nextTypeSlug: string) {
    const nextDef = getWindowTypeDefinition(gs, nextTypeSlug);
    if (!nextDef || !nextDef.sizes.length) return;
    const firstSize = nextDef.sizes[0];
    const nextWidth = cmToMeters(firstSize.width);
    const nextHeight = cmToMeters(firstSize.height);

    const { min, max, blockedRanges: br } = computePositionBounds(wallW, nextWidth, allWallObjs, windowObj.id);
    if (max < min) return;
    const newPosX = snapToNearestValid(windowObj.positionX, br, min, max);
    const nextMaxSillCm = Math.max(minSillCm, Math.min(configuredMaxSillCm, metersToCm(Math.max(0, dimensions.height - nextHeight - 0.2))));
    const currentSillCm = metersToCm(windowObj.sillHeight);

    updateWindow(windowObj.id, {
      typeSlug: nextTypeSlug,
      width: nextWidth,
      height: nextHeight,
      positionX: newPosX,
      sillHeight: cmToMeters(Math.min(currentSillCm, nextMaxSillCm)),
    });
  }

  function onSizeChange(sizeValue: string) {
    const [wCm, hCm] = sizeValue.split('x').map(Number);
    if (isNaN(wCm) || isNaN(hCm)) return;
    const newWidth = cmToMeters(wCm);
    const newHeight = cmToMeters(hCm);

    const { min, max, blockedRanges: br } = computePositionBounds(wallW, newWidth, allWallObjs, windowObj.id);
    if (max < min) return;
    const newPosX = snapToNearestValid(windowObj.positionX, br, min, max);
    const nextMaxSillCm = Math.max(minSillCm, Math.min(configuredMaxSillCm, metersToCm(Math.max(0, dimensions.height - newHeight - 0.2))));
    const currentSillCm = metersToCm(windowObj.sillHeight);

    updateWindow(windowObj.id, {
      width: newWidth,
      height: newHeight,
      positionX: newPosX,
      sillHeight: cmToMeters(Math.min(currentSillCm, nextMaxSillCm)),
    });
  }

  function onFinishChange(nextFinish: WindowConfig['finish']) {
    const finish = finishes.find(f => f.slug === nextFinish);
    const fallbackColor = finish?.colors[0]?.slug ?? windowObj.colorSlug;
    updateWindow(windowObj.id, {
      finish: nextFinish,
      colorSlug: finish?.colors.some(c => c.slug === windowObj.colorSlug)
        ? windowObj.colorSlug
        : fallbackColor,
    });
  }

  function tryUpdateWall(newWall: WallSide) {
    if (newWall === windowObj.wall) return;
    const newWallW = wallWidthForSide(dimensions, newWall);
    const objs: WallObjectBounds[] = [
      ...gates.filter(g => g.wall === newWall).map(g => ({ id: g.id, positionX: g.positionX, width: g.width, height: g.height, wall: g.wall })),
      ...doors.filter(d => d.wall === newWall).map(d => ({ id: d.id, positionX: d.positionX, width: d.width, height: d.height, wall: d.wall })),
      ...windows.filter(w => w.wall === newWall).map(w => ({ id: w.id, positionX: w.positionX, width: w.width, height: w.height, wall: w.wall })),
    ];
    const existingWidths = objs.map(o => o.width);
    if (!gatesFitOnWall(dimensions, newWall, existingWidths, windowObj.width)) return;

    const { min, max, blockedRanges: br } = computePositionBounds(newWallW, windowObj.width, objs, windowObj.id);
    if (max < min) return;
    const newPosX = snapToNearestValid(SIDE_MARGIN, br, min, max);
    updateWindow(windowObj.id, { wall: newWall, positionX: newPosX });
  }

  const typeLabel = typeDef?.name ?? windowObj.typeSlug;
  const sillCm = metersToCm(windowObj.sillHeight);

  return (
    <div className="border border-slate-700 rounded-lg">
      <div className="flex items-center justify-between px-3 py-2 bg-slate-800">
        <button
          className="flex items-center gap-2 text-sm font-medium text-slate-300 hover:text-white"
          onClick={() => setOpen(o => !o)}
        >
          {open ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
          {typeLabel}
          <span className="text-xs text-slate-500 font-mono">
            {(windowObj.width * 100).toFixed(0)}×{(windowObj.height * 100).toFixed(0)} cm
          </span>
        </button>
        <button
          onClick={() => {
            removeWindow(windowObj.id);
            setSelectedWindow(null);
          }}
          className="p-1 text-slate-500 hover:text-red-400 transition-colors"
        >
          <Trash2 size={14} />
        </button>
      </div>

      {open && (
        <div className="p-3 flex flex-col gap-3 bg-slate-900">
          <RadioGroup
            value={windowObj.typeSlug}
            options={typeOptions}
            onChange={onTypeChange}
            columns={2}
          />

          <div className="flex flex-col gap-1.5">
            <span className="text-xs text-slate-400">Ściana</span>
            <RadioGroup
              value={windowObj.wall}
              options={WALL_OPTIONS}
              onChange={tryUpdateWall}
              columns={4}
            />
          </div>

          {sizeOptions.length > 0 && (
            <div className="flex flex-col gap-1.5">
              <span className="text-xs text-slate-400">Rozmiar</span>
              <RadioGroup
                value={activeSizeValue}
                options={sizeOptions}
                onChange={onSizeChange}
                columns={3}
              />
            </div>
          )}

          {posMax > posMin && (
            <ConfigSlider
              label={`Pozycja (od lewej — ${WALL_LABELS[windowObj.wall]})`}
              value={windowObj.positionX}
              min={posMin}
              max={posMax}
              step={0.05}
              unit="m"
              onChange={(x) => updateWindow(windowObj.id, { positionX: snapToNearestValid(x, blockedRanges, posMin, posMax) })}
            />
          )}

          <ConfigSlider
            label="Wysokość osadzenia (od podłoża)"
            value={sillCm}
            min={minSillCm}
            max={maxSillCm}
            step={5}
            unit="cm"
            onChange={(v) => updateWindow(windowObj.id, { sillHeight: cmToMeters(v) })}
          />

          <div className="flex flex-col gap-1.5">
            <span className="text-xs text-slate-400">Wykończenie</span>
            <RadioGroup
              value={windowObj.finish}
              options={finishOptions}
              onChange={(v) => onFinishChange(v as WindowConfig['finish'])}
              columns={2}
            />
          </div>

          {glazingOptions.length > 0 && (
            <div className="flex flex-col gap-1.5">
              <span className="text-xs text-slate-400">Szklenie</span>
              <RadioGroup
                value={windowObj.glazingSlug}
                options={glazingOptions}
                onChange={(v) => updateWindow(windowObj.id, { glazingSlug: v })}
                columns={2}
              />
            </div>
          )}

          {colorOptions.length > 0 && (
            <div className="flex flex-col gap-1.5">
              <span className="text-xs text-slate-400">Kolor</span>
              <RadioGroup
                value={windowObj.colorSlug}
                options={colorOptions}
                onChange={(v) => updateWindow(windowObj.id, { colorSlug: v })}
                columns={3}
              />
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export function WindowsPanel() {
  const addWindow = useConfigStore(s => s.addWindow);
  const windows = useConfigStore(s => s.config.windows);
  const gs = useSettingsContext();
  const maxCount = getWindowMaxCount(gs);
  const canAdd = windows.length < maxCount;

  const canAddOnAnyWall = useMemo(() => {
    const firstType = getWindowTypes(gs)[0];
    const firstSize = firstType?.sizes[0];
    if (!firstSize) return false;
    const width = cmToMeters(firstSize.width);
    const state = useConfigStore.getState();
    return ['front', 'back', 'left', 'right'].some(w => state.canAddWindow(w as WallSide, width));
  }, [gs]);

  return (
    <AccordionSection
      title="Okna"
      icon={<RectangleHorizontal size={16} />}
      defaultOpen={false}
    >
      <div className="flex flex-col gap-2">
        {windows.map(windowObj => (
          <WindowEditor key={windowObj.id} windowObj={windowObj} />
        ))}

        {canAdd && canAddOnAnyWall && (
          <button
            onClick={() => addWindow('front')}
            className="flex items-center justify-center gap-2 w-full py-2 rounded-lg border border-dashed border-slate-600 text-slate-400 hover:border-amber-400 hover:text-amber-400 transition-colors text-sm"
          >
            <Plus size={14} />
            Dodaj okno
          </button>
        )}

        {(!canAdd || !canAddOnAnyWall) && (
          <p className="text-xs text-slate-500 text-center py-1">
            Brak miejsca na kolejne okno lub osiągnięto limit ({maxCount})
          </p>
        )}
      </div>
    </AccordionSection>
  );
}
