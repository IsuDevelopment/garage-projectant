'use client';

import { DoorOpen, Plus, Trash2, ChevronDown, ChevronUp } from 'lucide-react';
import { useState } from 'react';
import { AccordionSection } from '@/shared/components/AccordionSection';
import { RadioGroup } from '@/shared/components/RadioGroup';
import { ConfigSlider } from '@/shared/components/ConfigSlider';
import { MaterialPicker } from '@/features/materials/components/MaterialPicker';
import { ColorPicker } from '@/shared/components/ColorPicker';
import { useConfigStore } from '@/store/useConfigStore';
import { useUIStore } from '@/store/useUIStore';
import { GATE_TYPE_LABELS } from '@/config/settings';
import { useSettingsContext } from '@/config/SettingsContext';
import { GateConfig, GateType, OpenDirection } from '@/store/types';

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

function GateEditor({ gate }: { gate: GateConfig }) {
  const updateGate  = useConfigStore(s => s.updateGate);
  const removeGate  = useConfigStore(s => s.removeGate);
  const globalMat   = useConfigStore(s => s.config.construction.material);
  const canAddGate  = useConfigStore(s => s.canAddGate);
  const { setSelectedGate } = useUIStore();

  const [open, setOpen] = useState(true);

  const gs = useSettingsContext();
  const limits = gs.gate;

  const gateTypeOptions = gs.availableGateTypes.map(v => ({
    value: v,
    label: GATE_TYPE_LABELS[v] ?? v,
    icon:  GATE_TYPE_ICONS[v],
  }));

  const openDirOptions: { value: OpenDirection; label: string; icon: string }[] = [
    { value: 'left',  label: 'Lewo',  icon: '←' },
    { value: 'right', label: 'Prawo', icon: '→' },
  ];

  function tryUpdateWidth(w: number) {
    const fits = canAddGate(gate.wall, w, gate.id);
    if (fits) updateGate(gate.id, { width: w });
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
            onChange={v => updateGate(gate.id, { type: v })}
            columns={3}
          />

          <ConfigSlider
            label={limits.width.label}
            value={gate.width}
            min={limits.width.min}
            max={Math.min(limits.width.max, useConfigStore.getState().config.dimensions.width - 0.6)}
            step={limits.width.step}
            unit={limits.width.unit}
            onChange={tryUpdateWidth}
          />
          <ConfigSlider
            label={limits.height.label}
            value={gate.height}
            min={limits.height.min}
            max={Math.min(limits.height.max, useConfigStore.getState().config.dimensions.height - 0.2)}
            step={limits.height.step}
            unit={limits.height.unit}
            onChange={v => updateGate(gate.id, { height: v })}
          />

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

          {/* Color per gate */}
          <ColorPicker
            value={gate.color}
            onChange={c => updateGate(gate.id, { color: c })}
            presets={gs.colors.set}
            allowCustomColor={gs.colors.allowCustomColor}
            activeMaterial={(gate.material ?? globalMat).type}
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

  const canAddAnother = gates.length < settings.gate.maxCount && canAdd('front', settings.gate.width.default);

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
          {!canAddAnother && gates.length >= settings.gate.maxCount && (
            <span className="text-xs">(max {settings.gate.maxCount})</span>
          )}
          {!canAddAnother && gates.length < settings.gate.maxCount && (
            <span className="text-xs">(za mało miejsca)</span>
          )}
        </button>
      </div>
    </AccordionSection>
  );
}
