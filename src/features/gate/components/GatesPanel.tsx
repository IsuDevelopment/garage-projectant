'use client';

import { DoorOpen, Plus, Trash2, ChevronDown, ChevronUp } from 'lucide-react';
import { useState } from 'react';
import { AccordionSection } from '@/shared/components/AccordionSection';
import { RadioGroup } from '@/shared/components/RadioGroup';
import { ConfigSlider } from '@/shared/components/ConfigSlider';
import { MaterialPicker } from '@/features/materials/components/MaterialPicker';
import { useConfigStore } from '@/store/useConfigStore';
import { useUIStore } from '@/store/useUIStore';
import { cmToMeters, getConstructionSizeValuesCm, getGateMaxCount, getGateTypeDefinition, getGateTypes, metersToCm } from '@/config/settings';
import { useSettingsContext } from '@/config/SettingsContext';
import { GateConfig, GateType, OpenDirection, WallSide } from '@/store/types';
import {
  SIDE_MARGIN,
  WALL_LABELS,
  WallObjectBounds,
  wallWidthForSide,
  computePositionBounds,
  snapToNearestValid,
  gatesFitOnWall,
} from '@/store/wallCollision';

const GATE_TYPE_ICONS: Record<GateType, string> = {
  tilt:          '⬆',
  'double-wing': '⬌',
  sectional:     '▤',
};

const GATE_TYPE_SHORT_LABELS: Record<GateType, string> = {
  tilt: 'Uchylna',
  'double-wing': 'Dwuskrz.',
  sectional: 'Segment.',
};

const WALL_OPTIONS: { value: WallSide; label: string }[] = [
  { value: 'front', label: 'Przód' },
  { value: 'back',  label: 'Tył' },
  { value: 'left',  label: 'Lewo' },
  { value: 'right', label: 'Prawo' },
];

function GateEditor({ gate }: { gate: GateConfig }) {
  const updateGate   = useConfigStore(s => s.updateGate);
  const removeGate   = useConfigStore(s => s.removeGate);
  const globalMat    = useConfigStore(s => s.config.construction.material);
  const dimensions   = useConfigStore(s => s.config.dimensions);
  const gates        = useConfigStore(s => s.config.gates);
  const { setSelectedGate, showExpandGarageDialog } = useUIStore();

  const [open, setOpen] = useState(true);

  const gs     = useSettingsContext();
  const gateTypes = getGateTypes(gs);
  const limits = gs.gate;

  const gateTypeOptions = gateTypes.map(v => ({
    value: v.slug,
    label: v.name,
    icon:  GATE_TYPE_ICONS[v.slug],
  }));

  const gateTypeDef = getGateTypeDefinition(gs, gate.type);
  const widthValuesMeters = (gateTypeDef?.sizes.width ?? []).map(cmToMeters);
  const heightValuesCm = gateTypeDef?.sizes.height ?? [];

  const openDirOptions: { value: OpenDirection; label: string; icon: string }[] = [
    { value: 'left',  label: 'Lewo',  icon: '←' },
    { value: 'right', label: 'Prawo', icon: '→' },
  ];

  // ── Position bounds for the gate on its current wall ──────────────────
  const wallW = wallWidthForSide(dimensions, gate.wall);
  const wallObjs: WallObjectBounds[] = gates
    .filter(g => g.wall === gate.wall)
    .map(g => ({ id: g.id, positionX: g.positionX, width: g.width, height: g.height, wall: g.wall }));
  const { min: posMin, max: posMax, blockedRanges } =
    computePositionBounds(wallW, gate.width, wallObjs, gate.id);

  // ── Max slider bounds ──────────────────────────────────────────────────
  const maxWidth  = Math.min(limits.width.max, wallW);
  const maxHeight = Math.min(limits.height.max, dimensions.height - 0.2);
  const gateHeightCm = metersToCm(gate.height);

  const allowedWidthValues = widthValuesMeters.filter(w => w <= maxWidth);
  const allowedHeightValuesCm = heightValuesCm.filter(hCm => cmToMeters(hCm) <= maxHeight);

  const widthSliderValues = allowedWidthValues.length
    ? allowedWidthValues
    : [Math.min(maxWidth, Math.max(0.6, gate.width))];
  const heightSliderValuesCm = allowedHeightValuesCm.length
    ? allowedHeightValuesCm
    : [metersToCm(Math.min(maxHeight, Math.max(1.0, gate.height)))];

  function onTypeChange(nextType: GateType) {
    const nextTypeDef = getGateTypeDefinition(gs, nextType);
    const allWidthsMeters = (nextTypeDef?.sizes.width ?? []).map(cmToMeters);
    const allHeightsCm    = nextTypeDef?.sizes.height ?? [];

    const fittingWidths    = allWidthsMeters.filter(w => w <= maxWidth);
    const fittingHeightsCm = allHeightsCm.filter(hCm => cmToMeters(hCm) <= maxHeight);

    // Gate fits — apply directly
    if (fittingWidths.length > 0 && fittingHeightsCm.length > 0) {
      updateGate(gate.id, {
        type: nextType,
        width:  nearestNumber(fittingWidths, gate.width),
        height: cmToMeters(nearestNumber(fittingHeightsCm, gateHeightCm)),
      });
      return;
    }

    // Gate requires larger garage — propose expansion
    const minWidthMeters  = allWidthsMeters[0];
    const minHeightCm     = allHeightsCm[0] ?? metersToCm(gate.height);
    const minHeightMeters = cmToMeters(minHeightCm);

    const needsWidthExpand  = fittingWidths.length === 0 && minWidthMeters != null;
    const needsHeightExpand = fittingHeightsCm.length === 0;

    const dimensionAxis = (gate.wall === 'front' || gate.wall === 'back') ? 'width' : 'depth';
    const currentWallW  = dimensionAxis === 'width' ? dimensions.width : dimensions.depth;

    if (needsWidthExpand) {
      const requiredWallW     = minWidthMeters + SIDE_MARGIN * 2;
      const constructionSizes = getConstructionSizeValuesCm(gs, dimensionAxis).map(cmToMeters);
      const requiredGarageW   = constructionSizes.find(v => v >= requiredWallW) ?? requiredWallW;

      // Pick a height that fits in the expanded garage (height unchanged)
      const pendingH = fittingHeightsCm.length > 0
        ? cmToMeters(nearestNumber(fittingHeightsCm, gateHeightCm))
        : minHeightMeters;

      showExpandGarageDialog({
        dimension:         dimensionAxis as 'width' | 'depth',
        requiredMeters:    requiredGarageW,
        currentMeters:     currentWallW,
        gateId:            gate.id,
        pendingGateType:   nextType,
        pendingGateWidth:  minWidthMeters,
        pendingGateHeight: pendingH,
      });
      return;
    }

    if (needsHeightExpand) {
      const requiredH      = minHeightMeters + 0.2;
      const constructionH  = getConstructionSizeValuesCm(gs, 'height').map(cmToMeters);
      const requiredGarageH = constructionH.find(v => v >= requiredH) ?? requiredH;

      showExpandGarageDialog({
        dimension:         'height',
        requiredMeters:    requiredGarageH,
        currentMeters:     dimensions.height,
        gateId:            gate.id,
        pendingGateType:   nextType,
        pendingGateWidth:  fittingWidths.length > 0 ? nearestNumber(fittingWidths, gate.width) : minWidthMeters,
        pendingGateHeight: minHeightMeters,
      });
    }
  }

  function tryUpdateWidth(w: number) {
    const { min, max, blockedRanges: br } =
      computePositionBounds(wallW, w, wallObjs, gate.id);
    if (max < min) return;
    const newPosX = snapToNearestValid(gate.positionX, br, min, max);
    updateGate(gate.id, { width: w, positionX: newPosX });
  }

  function tryUpdatePosition(rawX: number) {
    const snapped = snapToNearestValid(rawX, blockedRanges, posMin, posMax);
    updateGate(gate.id, { positionX: snapped });
  }

  function tryUpdateWall(newWall: WallSide) {
    if (newWall === gate.wall) return;
    const newWallW = wallWidthForSide(dimensions, newWall);
    const existingWidths = gates
      .filter(g => g.wall === newWall)
      .map(g => g.width);
    if (!gatesFitOnWall(dimensions, newWall, existingWidths, gate.width)) return;

    const newWallObjs: WallObjectBounds[] = gates
      .filter(g => g.wall === newWall)
      .map(g => ({ id: g.id, positionX: g.positionX, width: g.width, height: g.height, wall: g.wall }));
    const { min, max, blockedRanges: br } =
      computePositionBounds(newWallW, gate.width, newWallObjs, gate.id);
    if (max < min) return;
    const newPosX = snapToNearestValid(SIDE_MARGIN, br, min, max);
    updateGate(gate.id, { wall: newWall, positionX: newPosX });
  }

  return (
    <div className="border border-slate-700 rounded-lg">
      <div className="flex items-center justify-between px-3 py-2 bg-slate-800">
        <button
          className="flex items-center gap-2 text-sm font-medium text-slate-300 hover:text-white"
          onClick={() => setOpen(o => !o)}
        >
          {open ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
          Brama {GATE_TYPE_SHORT_LABELS[gate.type]}
          <span className="text-xs text-slate-500 font-mono">
            {gate.width.toFixed(1)}×{gate.height.toFixed(1)}m
          </span>
        </button>
        <button
          onClick={() => {
            removeGate(gate.id);
            setSelectedGate(null);
          }}
          className="p-1 text-slate-500 hover:text-red-400 transition-colors"
        >
          <Trash2 size={14} />
        </button>
      </div>

      {open && (
        <div className="p-3 flex flex-col gap-3 bg-slate-900">
          <RadioGroup
            value={gate.type}
            options={gateTypeOptions}
            onChange={onTypeChange}
            columns={3}
          />

          {/* Wall selector */}
          <div className="flex flex-col gap-1.5">
            <span className="text-xs text-slate-400">Ściana</span>
            <RadioGroup
              value={gate.wall}
              options={WALL_OPTIONS}
              onChange={tryUpdateWall}
              columns={4}
            />
          </div>

          <ConfigSlider
            label={limits.width.label}
            value={gate.width}
            values={widthSliderValues}
            unit={limits.width.unit}
            onChange={tryUpdateWidth}
          />
          <ConfigSlider
            label={`${limits.height.label} (cm)`}
            value={gateHeightCm}
            values={heightSliderValuesCm}
            unit="cm"
            onChange={hCm => updateGate(gate.id, { height: cmToMeters(hCm) })}
          />

          {/* Position slider — only useful when there is room to move */}
          {posMax > posMin && (
            <ConfigSlider
              label={`Pozycja (od lewej — ${WALL_LABELS[gate.wall]})`}
              value={gate.positionX}
              min={posMin}
              max={posMax}
              step={0.05}
              unit="m"
              onChange={tryUpdatePosition}
            />
          )}

          <div className="flex flex-col gap-1.5">
            <span className="text-xs text-slate-400">Kierunek otwierania</span>
            <RadioGroup
              value={gate.openDirection}
              options={openDirOptions}
              onChange={v => updateGate(gate.id, { openDirection: v })}
              columns={2}
            />
          </div>

          <MaterialPicker
            label="Materiał bramy"
            value={gate.material}
            globalMaterial={globalMat}
            element="gates"
            onChange={m => updateGate(gate.id, { material: m })}
            allowNull
          />
        </div>
      )}
    </div>
  );
}

export function GatesPanel() {
  const gates    = useConfigStore(s => s.config.gates);
  const addGate  = useConfigStore(s => s.addGate);
  const canAdd   = useConfigStore(s => s.canAddGate);
  const settings = useSettingsContext();
  const gateTypes = getGateTypes(settings);
  const maxCount = getGateMaxCount(settings);
  const defaultGateWidth = cmToMeters(gateTypes[0]?.sizes.width[0] ?? Math.round(settings.gate.width.default * 100));

  const canAddAnother = gates.length < maxCount && canAdd('front', defaultGateWidth);

  return (
    <AccordionSection title="Bramy" icon={<DoorOpen size={16} />} maxBodyHeight={480}>
      <div className="flex flex-col gap-3">
        {gates.length === 0 && (
          <p className="text-xs text-slate-500 text-center py-2">Brak bram &mdash; kliknij &bdquo;Dodaj bram&#x0119;&rdquo;</p>
        )}
        {gates.map(gate => (
          <GateEditor key={gate.id} gate={gate} />
        ))}

        <button
          onClick={() => addGate('front')}
          disabled={!canAddAnother}
          className={`flex items-center justify-center gap-2 py-2.5 rounded-lg border text-sm font-medium transition-all
            ${canAddAnother
              ? 'border-amber-400/50 text-amber-400 hover:bg-amber-400/10 hover:border-amber-400'
              : 'border-slate-700 text-slate-600 cursor-not-allowed'
            }`}
        >
          <Plus size={16} />
          Dodaj bramę
          {!canAddAnother && gates.length >= maxCount && (
            <span className="text-xs">(max {maxCount})</span>
          )}
          {!canAddAnother && gates.length < maxCount && (
            <span className="text-xs">(za mało miejsca)</span>
          )}
        </button>
      </div>
    </AccordionSection>
  );
}

function nearestNumber(values: number[], target: number): number {
  return values.reduce((best, current) => {
    if (Math.abs(current - target) < Math.abs(best - target)) {
      return current;
    }
    return best;
  });
}
