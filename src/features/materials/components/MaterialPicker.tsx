'use client';

import { useEffect, useMemo, useRef } from 'react';
import { MaterialConfig, MaterialElement, MaterialType, RoofSlopeType } from '@/store/types';
import { MATERIAL_LABELS } from '@/config/settings';
import { useSettingsContext } from '@/config/SettingsContext';
import { ColorPicker } from '@/shared/components/ColorPicker';

interface MaterialPickerProps {
  label: string;
  value: MaterialConfig | null;
  globalMaterial?: MaterialConfig;
  element: MaterialElement;
  roofSlopeType?: RoofSlopeType;
  onChange: (m: MaterialConfig | null) => void;
  allowNull?: boolean; // allow "use global"
}

export function MaterialPicker({
  label,
  value,
  globalMaterial,
  element,
  roofSlopeType,
  onChange,
  allowNull = false,
}: MaterialPickerProps) {
  const effective = value ?? globalMaterial ?? { type: 'trapez' as MaterialType, color: '#c0c8d0' };
  const ref = useRef<HTMLDivElement>(null);
  const { colors, materials } = useSettingsContext();

  const availableMaterials = useMemo(
    () => materials.filter(m => {
      if (!m.appliesTo.includes(element)) return false;
      if (element === 'roof' && roofSlopeType && m.allowedSlopes?.length) {
        return m.allowedSlopes.includes(roofSlopeType);
      }
      return true;
    }),
    [materials, element, roofSlopeType],
  );

  const activeDef = useMemo(
    () => materials.find(m => m.slug === effective.type),
    [materials, effective.type],
  );

  useEffect(() => {
    // placeholder for click-outside (no dropdown currently open)
    return () => {};
  }, []);

  function setMaterialType(t: MaterialType) {
    const def = materials.find(m => m.slug === t);
    const subOptions = def?.subFeatures?.reduce((acc, sf) => {
      acc[sf.slug] = sf.default;
      return acc;
    }, {} as Record<string, string | number>);

    onChange({
      ...effective,
      type: t,
      color: def?.defaultColor ?? effective.color,
      customSpriteUrl: def?.texture ?? effective.customSpriteUrl,
      subOptions,
    });
  }

  function setColor(c: string) {
    onChange({ ...effective, color: c });
  }

  function setSubOption(slug: string, val: string | number) {
    onChange({
      ...effective,
      subOptions: {
        ...(effective.subOptions ?? {}),
        [slug]: val,
      },
    });
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
        {availableMaterials.map(m => (
          <button
            key={m.slug}
            onClick={() => setMaterialType(m.slug)}
            className={`py-1.5 px-2 rounded text-[11px] font-medium border transition-all
              ${effective.type === m.slug
                ? 'border-amber-400 bg-amber-400/10 text-amber-400'
                : 'border-slate-600 bg-slate-800 text-slate-400 hover:border-slate-500'
              }`}
          >
            <span>{MATERIAL_LABELS[m.slug] ?? m.slug}</span>
            {m.isPremium && <span className="ml-1 text-[9px] uppercase">Premium</span>}
          </button>
        ))}
      </div>

      {activeDef?.subFeatures?.length ? (
        <div className="flex flex-col gap-2">
          {activeDef.subFeatures.map(sf => (
            <div key={sf.slug} className="flex flex-col gap-1">
              <span className="text-xs text-slate-400">{sf.name}</span>
              {sf.type === 'select' ? (
                <select
                  value={String(effective.subOptions?.[sf.slug] ?? sf.default)}
                  onChange={e => setSubOption(sf.slug, e.target.value)}
                  className="rounded bg-slate-800 border border-slate-700 text-slate-200 text-xs px-2 py-1.5"
                >
                  {(sf.options ?? []).map(o => (
                    <option key={o.value} value={o.value}>{o.label}</option>
                  ))}
                </select>
              ) : (
                <div className="flex items-center gap-2">
                  <input
                    type="range"
                    min={sf.min ?? 0}
                    max={sf.max ?? 100}
                    step={sf.step ?? 1}
                    value={Number(effective.subOptions?.[sf.slug] ?? sf.default)}
                    onChange={e => setSubOption(sf.slug, Number(e.target.value))}
                    className="w-full"
                  />
                  <span className="text-[11px] text-slate-400 min-w-10 text-right">
                    {String(effective.subOptions?.[sf.slug] ?? sf.default)}{sf.unit ?? ''}
                  </span>
                </div>
              )}
            </div>
          ))}
        </div>
      ) : null}

      {/* Color picker — presets from settings, filtered by material type */}
      <ColorPicker
        value={effective.color}
        onChange={setColor}
        presets={activeDef?.colorSet?.length ? activeDef.colorSet : colors.set}
        allowCustomColor={Boolean(activeDef?.allowColors) && colors.allowCustomColor}
        activeMaterial={effective.type}
      />
    </div>
  );
}
