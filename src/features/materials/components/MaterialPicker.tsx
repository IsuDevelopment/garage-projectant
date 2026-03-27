'use client';

import { useEffect, useRef } from 'react';
import { MaterialConfig, MaterialType } from '@/store/types';
import { MATERIAL_LABELS } from '@/config/settings';
import { useSettingsContext } from '@/config/SettingsContext';
import { ColorPicker } from '@/shared/components/ColorPicker';

interface MaterialPickerProps {
  label: string;
  value: MaterialConfig | null;
  globalMaterial?: MaterialConfig;
  availableTypes: MaterialType[];
  onChange: (m: MaterialConfig | null) => void;
  allowNull?: boolean; // allow "use global"
}

export function MaterialPicker({
  label,
  value,
  globalMaterial,
  availableTypes,
  onChange,
  allowNull = false,
}: MaterialPickerProps) {
  const effective = value ?? globalMaterial ?? { type: 'trapez' as MaterialType, color: '#c0c8d0' };
  const ref = useRef<HTMLDivElement>(null);
  const { colors } = useSettingsContext();

  useEffect(() => {
    // placeholder for click-outside (no dropdown currently open)
    return () => {};
  }, []);

  function setMaterialType(t: MaterialType) {
    onChange({ ...effective, type: t });
  }

  function setColor(c: string) {
    onChange({ ...effective, color: c });
  }

  return (
    <div className="flex flex-col gap-2" ref={ref}>
      <div className="flex items-center justify-between">
        <span className="text-sm font-medium text-slate-300">{label}</span>
        {allowNull && (
          <button
            onClick={() => onChange(null)}
            className={`text-[10px] px-2 py-0.5 rounded border transition-colors ${
              value === null
                ? 'border-amber-400 text-amber-400 bg-amber-400/10'
                : 'border-slate-600 text-slate-500 hover:border-slate-400'
            }`}
          >
            Globalny
          </button>
        )}
      </div>

      {/* Texture selector */}
      <div className="grid grid-cols-3 gap-1.5">
        {availableTypes.map(t => (
          <button
            key={t}
            onClick={() => setMaterialType(t)}
            className={`py-1.5 px-2 rounded text-[11px] font-medium border transition-all
              ${effective.type === t
                ? 'border-amber-400 bg-amber-400/10 text-amber-400'
                : 'border-slate-600 bg-slate-800 text-slate-400 hover:border-slate-500'
              }`}
          >
            {MATERIAL_LABELS[t] ?? t}
          </button>
        ))}
      </div>

      {/* Color picker — presets from settings, filtered by material type */}
      <ColorPicker
        value={effective.color}
        onChange={setColor}
        presets={colors.set}
        allowCustomColor={colors.allowCustomColor}
        activeMaterial={effective.type}
      />
    </div>
  );
}
