'use client';

import { Plus, Trash2, ChevronDown, ChevronUp, DoorOpen } from 'lucide-react';
import { useState } from 'react';
import { AccordionSection } from '@/shared/components/AccordionSection';
import { RadioGroup } from '@/shared/components/RadioGroup';
import { ConfigSlider } from '@/shared/components/ConfigSlider';
import { MaterialPicker } from '@/features/materials/components/MaterialPicker';
import { useConfigStore } from '@/store/useConfigStore';
import { useUIStore } from '@/store/useUIStore';
import { cmToMeters, getDoorMaxCount, getDoorTypeDefinition, getDoorTypes } from '@/config/settings';
import { useSettingsContext } from '@/config/SettingsContext';
import { DoorConfig, WallSide } from '@/store/types';
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
  { value: 'back',  label: 'Tył'   },
  { value: 'left',  label: 'Lewo'  },
  { value: 'right', label: 'Prawo' },
];

function DoorEditor({ door }: { door: DoorConfig }) {
  const updateDoor = useConfigStore(s => s.updateDoor);
  const removeDoor = useConfigStore(s => s.removeDoor);
  const globalMat  = useConfigStore(s => s.config.construction.material);
  const dimensions = useConfigStore(s => s.config.dimensions);
  const gates      = useConfigStore(s => s.config.gates);
  const doors      = useConfigStore(s => s.config.doors);
  const { setSelectedDoor } = useUIStore();

  const [open, setOpen] = useState(true);
  const gs = useSettingsContext();

  const doorTypes = getDoorTypes(gs);
  const typeDef   = getDoorTypeDefinition(gs, door.typeSlug);

  const typeOptions = doorTypes.map(t => ({ value: t.slug, label: t.name }));

  // Size presets for this door type
  const sizeOptions = (typeDef?.sizes ?? []).map(s => ({
    value: `${s.width}x${s.height}`,
    label: s.name ?? `${s.width}×${s.height}`,
  }));
  const activeSizeValue = `${Math.round(door.width * 100)}x${Math.round(door.height * 100)}`;

  // ── Position bounds ──────────────────────────────────────────────────
  const wallW = wallWidthForSide(dimensions, door.wall);
  const allWallObjs: WallObjectBounds[] = [
    ...gates.filter(g => g.wall === door.wall).map(g => ({ id: g.id, positionX: g.positionX, width: g.width, height: g.height, wall: g.wall })),
    ...doors.filter(d => d.wall === door.wall).map(d => ({ id: d.id, positionX: d.positionX, width: d.width, height: d.height, wall: d.wall })),
  ];
  const { min: posMin, max: posMax, blockedRanges } =
    computePositionBounds(wallW, door.width, allWallObjs, door.id);

  function onTypeChange(nextTypeSlug: string) {
    const nextDef = getDoorTypeDefinition(gs, nextTypeSlug);
    if (!nextDef || !nextDef.sizes.length) return;
    const firstSize = nextDef.sizes[0];
    updateDoor(door.id, {
      typeSlug: nextTypeSlug,
      width:    cmToMeters(firstSize.width),
      height:   cmToMeters(firstSize.height),
    });
  }

  function onSizeChange(sizeValue: string) {
    const [wCm, hCm] = sizeValue.split('x').map(Number);
    if (isNaN(wCm) || isNaN(hCm)) return;
    const newWidth = cmToMeters(wCm);
    const { min, max, blockedRanges: br } =
      computePositionBounds(wallW, newWidth, allWallObjs, door.id);
    if (max < min) return;
    const newPosX = snapToNearestValid(door.positionX, br, min, max);
    updateDoor(door.id, { width: newWidth, height: cmToMeters(hCm), positionX: newPosX });
  }

  function tryUpdateWall(newWall: WallSide) {
    if (newWall === door.wall) return;
    const newWallW = wallWidthForSide(dimensions, newWall);
    const objs: WallObjectBounds[] = [
      ...gates.filter(g => g.wall === newWall).map(g => ({ id: g.id, positionX: g.positionX, width: g.width, height: g.height, wall: g.wall })),
      ...doors.filter(d => d.wall === newWall).map(d => ({ id: d.id, positionX: d.positionX, width: d.width, height: d.height, wall: d.wall })),
    ];
    const existingWidths = objs.map(o => o.width);
    if (!gatesFitOnWall(dimensions, newWall, existingWidths, door.width)) return;

    const { min, max, blockedRanges: br } = computePositionBounds(newWallW, door.width, objs, door.id);
    if (max < min) return;
    const newPosX = snapToNearestValid(SIDE_MARGIN, br, min, max);
    updateDoor(door.id, { wall: newWall, positionX: newPosX });
  }

  function tryUpdatePosition(rawX: number) {
    const snapped = snapToNearestValid(rawX, blockedRanges, posMin, posMax);
    updateDoor(door.id, { positionX: snapped });
  }

  const typeLabel = typeDef?.name ?? door.typeSlug;

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
            {(door.width * 100).toFixed(0)}×{(door.height * 100).toFixed(0)} cm
          </span>
        </button>
        <button
          onClick={() => {
            removeDoor(door.id);
            setSelectedDoor(null);
          }}
          className="p-1 text-slate-500 hover:text-red-400 transition-colors"
        >
          <Trash2 size={14} />
        </button>
      </div>

      {open && (
        <div className="p-3 flex flex-col gap-3 bg-slate-900">
          {/* Type selector */}
          <RadioGroup
            value={door.typeSlug}
            options={typeOptions}
            onChange={onTypeChange}
            columns={2}
          />

          {/* Wall selector */}
          <div className="flex flex-col gap-1.5">
            <span className="text-xs text-slate-400">Ściana</span>
            <RadioGroup
              value={door.wall}
              options={WALL_OPTIONS}
              onChange={tryUpdateWall}
              columns={4}
            />
          </div>

          {/* Size presets */}
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

          {/* Position slider — only when there is room to move */}
          {posMax > posMin && (
            <ConfigSlider
              label={`Pozycja (od lewej — ${WALL_LABELS[door.wall]})`}
              value={door.positionX}
              min={posMin}
              max={posMax}
              step={0.05}
              unit="m"
              onChange={tryUpdatePosition}
            />
          )}

          <MaterialPicker
            label="Materiał drzwi"
            value={door.material}
            globalMaterial={globalMat}
            element="gates"
            onChange={m => updateDoor(door.id, { material: m, ...(m ? { color: m.color } : {}) })}
            allowNull
          />
        </div>
      )}
    </div>
  );
}

export function DoorsPanel() {
  const addDoor  = useConfigStore(s => s.addDoor);
  const doors    = useConfigStore(s => s.config.doors);
  const gs       = useSettingsContext();
  const maxCount = getDoorMaxCount(gs);
  const canAdd   = doors.length < maxCount;

  return (
    <AccordionSection
      title="Drzwi"
      icon={<DoorOpen size={16} />}
      defaultOpen={false}
    >
      <div className="flex flex-col gap-2">
        {doors.map(door => (
          <DoorEditor key={door.id} door={door} />
        ))}

        {canAdd && (
          <button
            onClick={() => addDoor('front')}
            className="flex items-center justify-center gap-2 w-full py-2 rounded-lg border border-dashed border-slate-600 text-slate-400 hover:border-amber-400 hover:text-amber-400 transition-colors text-sm"
          >
            <Plus size={14} />
            Dodaj drzwi
          </button>
        )}

        {!canAdd && (
          <p className="text-xs text-slate-500 text-center py-1">
            Maksymalna liczba drzwi: {maxCount}
          </p>
        )}
      </div>
    </AccordionSection>
  );
}
