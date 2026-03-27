'use client';

import { useEffect, useRef } from 'react';
import { MaterialConfig, MaterialType } from '@/store/types';
import { MATERIAL_LABELS } from '@/config/settings';

const PRESET_COLORS = [
  '#c0c8d0', // galwanizowana
  '#8b7355', // brązowa
  '#2d4a2d', // ciemnozielona
  '#b22222', // ceglasta
  '#1a1a2e', // granatowa
  '#4a4a4a', // antracyt
  '#f5f0e8', // kremowa
  '#ffffff', // biała
];

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

      {/* Color picker */}
      <div className="flex flex-col gap-1.5">
        <span className="text-xs text-slate-400">Kolor</span>
        <div className="flex flex-wrap gap-1.5">
          {PRESET_COLORS.map(c => (
            <button
              key={c}
              onClick={() => setColor(c)}
              style={{ backgroundColor: c }}
              className={`w-6 h-6 rounded-full border-2 transition-all ${
                effective.color === c ? 'border-amber-400 scale-110' : 'border-transparent hover:scale-105'
              }`}
              title={c}
            />
          ))}
          {/* Custom color input */}
          <label className="w-6 h-6 rounded-full border-2 border-dashed border-slate-500 cursor-pointer overflow-hidden hover:border-slate-300 transition-colors">
            <input
              type="color"
              value={effective.color}
              onChange={e => setColor(e.target.value)}
              className="opacity-0 w-full h-full cursor-pointer"
              aria-label="Własny kolor"
            />
          </label>
        </div>
      </div>
    </div>
  );
}
