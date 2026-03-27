'use client';

import { Droplets } from 'lucide-react';
import { AccordionSection } from '@/shared/components/AccordionSection';
import { RadioGroup } from '@/shared/components/RadioGroup';
import { ColorPicker } from '@/shared/components/ColorPicker';
import { useConfigStore } from '@/store/useConfigStore';
import { useSettingsContext } from '@/config/SettingsContext';
import type { GutterDrainSide, GutterDownspout } from '@/store/types';

const DRAIN_SIDE_OPTIONS: { value: GutterDrainSide; label: string; icon: string }[] = [
  { value: 'front', label: 'Przód', icon: '↑' },
  { value: 'back',  label: 'Tył',   icon: '↓' },
];

const DOWNSPOUT_OPTIONS: { value: GutterDownspout; label: string; icon: string }[] = [
  { value: 'both',  label: 'Podwójny', icon: '⬌' },
  { value: 'left',  label: 'Lewo',     icon: '←' },
  { value: 'right', label: 'Prawo',    icon: '→' },
];

export function GutterPanel() {
  const gutters    = useConfigStore(s => s.config.gutters);
  const setGutters = useConfigStore(s => s.setGutters);
  const slopeType  = useConfigStore(s => s.config.roof.slopeType);
  const { colors } = useSettingsContext();

  // Double-pitched roofs have two independent eaves — downspout is always "both"
  const isDouble = slopeType === 'double' || slopeType === 'double-front-back';

  return (
    <AccordionSection title="Rynny" icon={<Droplets size={16} />} maxBodyHeight={360}>
      {/* Toggle */}
      <label className="flex items-center gap-3 cursor-pointer select-none">
        <div className="relative">
          <input
            type="checkbox"
            checked={gutters.enabled}
            onChange={e => setGutters({ enabled: e.target.checked })}
            className="sr-only peer"
            aria-label="Rynny"
          />
          <div className="w-10 h-6 bg-slate-700 rounded-full peer peer-checked:bg-amber-400 transition-colors" />
          <div className="absolute left-1 top-1 w-4 h-4 bg-white rounded-full transition-transform peer-checked:translate-x-4" />
        </div>
        <span className="text-sm text-slate-300">
          Rynny
          {gutters.enabled && <span className="ml-2 text-xs text-amber-400">Aktywne</span>}
        </span>
      </label>

      {gutters.enabled && (
        <>
          {/* Color */}
          <ColorPicker
            value={gutters.color}
            onChange={c => setGutters({ color: c })}
            presets={colors.set}
            allowCustomColor={colors.allowCustomColor}
          />

          {/* Drain side — only for double-pitch roofs (front/back drain end) */}
          {isDouble && (
            <div className="flex flex-col gap-1.5">
              <span className="text-xs font-medium text-slate-400 uppercase tracking-wide">Pozycja odpływu</span>
              <RadioGroup
                value={gutters.drainSide}
                options={DRAIN_SIDE_OPTIONS}
                onChange={v => setGutters({ drainSide: v })}
                columns={2}
              />
            </div>
          )}

          {/* Downspout — only for single-pitch roofs (one eave, choose end) */}
          {!isDouble && (
            <div className="flex flex-col gap-1.5">
              <span className="text-xs font-medium text-slate-400 uppercase tracking-wide">Spust (rura)</span>
              <RadioGroup
                value={gutters.downspout}
                options={DOWNSPOUT_OPTIONS}
                onChange={v => setGutters({ downspout: v })}
                columns={3}
              />
            </div>
          )}
        </>
      )}
    </AccordionSection>
  );
}
