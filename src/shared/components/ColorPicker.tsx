'use client';

import type { ColorPreset } from '@/config/settings';
import type { MaterialType } from '@/store/types';

interface ColorPickerProps {
  value: string;
  onChange: (hex: string) => void;
  presets: ColorPreset[];
  allowCustomColor: boolean;
  /** When set, only presets compatible with this material type are shown */
  activeMaterial?: MaterialType;
}

export function ColorPicker({
  value,
  onChange,
  presets,
  allowCustomColor,
  activeMaterial,
}: ColorPickerProps) {
  const visible = presets.filter(
    p => !p.textures || p.textures.length === 0 || (activeMaterial && p.textures.includes(activeMaterial)),
  );

  return (
    <div className="flex flex-col gap-1.5">
      <span className="text-xs text-slate-400">Kolor</span>
      <div className="flex flex-wrap gap-1.5">
        {visible.map(p => (
          <button
            key={p.color}
            onClick={() => onChange(p.color)}
            style={{ backgroundColor: p.color }}
            title={p.name}
            className={`w-6 h-6 rounded-full border-2 transition-all ${
              value === p.color
                ? 'border-amber-400 scale-110'
                : 'border-transparent hover:scale-105'
            }`}
          />
        ))}
        {allowCustomColor && (
          <label
            className="w-6 h-6 rounded-full border-2 border-dashed border-slate-500 cursor-pointer overflow-hidden hover:border-slate-300 transition-colors"
            title="Własny kolor"
          >
            <input
              type="color"
              value={value}
              onChange={e => onChange(e.target.value)}
              className="opacity-0 w-full h-full cursor-pointer"
              aria-label="Własny kolor"
            />
          </label>
        )}
      </div>
    </div>
  );
}
