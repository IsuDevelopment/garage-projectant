'use client';

import { useEffect, useMemo, useRef } from 'react';
import { MaterialConfig, MaterialElement, MaterialType, RoofSlopeType } from '@/store/types';
import { getElementBinding, getElementColorPresets, MATERIAL_LABELS } from '@/config/settings';
import { useSettingsContext } from '@/config/SettingsContext';
import { ColorPicker } from '@/shared/components/ColorPicker';
import type { ElementMaterialBinding } from '@/store/types';

interface MaterialPickerProps {
  label: string;
  value: MaterialConfig | null;
  globalMaterial?: MaterialConfig;
  element: MaterialElement;
  elementBinding?: ElementMaterialBinding;
  roofSlopeType?: RoofSlopeType;
  onChange: (m: MaterialConfig | null) => void;
  allowNull?: boolean; // allow "use global"
}

export function MaterialPicker({
  label,
  value,
  globalMaterial,
  element,
  elementBinding,
  roofSlopeType,
  onChange,
  allowNull = false,
}: MaterialPickerProps) {
  const effective = value ?? globalMaterial ?? { type: 'trapez' as MaterialType, color: '#c0c8d0' };
  const ref = useRef<HTMLDivElement>(null);
  const settings = useSettingsContext();
  const { colors, materials } = settings;
  const binding = elementBinding ?? getElementBinding(settings, element);

  // forcedSubValues for the currently-active material type (used in setSubOption)
  const forcedSubValues = binding.materialOverrides?.[effective.type as MaterialType]?.forcedValues ?? {};

  const availableMaterials = useMemo(
    () => materials.filter(m => {
      if (!binding.allowedMaterials.includes(m.slug)) return false;
      if (element === 'roof' && roofSlopeType && m.allowedSlopes?.length) {
        return m.allowedSlopes.includes(roofSlopeType);
      }
      return true;
    }),
    [materials, binding.allowedMaterials, element, roofSlopeType],
  );

  const activeDef = useMemo(
    () => materials.find(m => m.slug === effective.type),
    [materials, effective.type],
  );

  useEffect(() => {
    return () => {};
  }, []);

  function setMaterialType(t: MaterialType) {
    const def = materials.find(m => m.slug === t);
    const newOverride = binding.materialOverrides?.[t];
    const newForced   = newOverride?.forcedValues ?? {};

    let subOptions = def?.subFeatures?.reduce((acc, sf) => {
      acc[sf.slug] = sf.default;
      return acc;
    }, {} as Record<string, string | number>);

    // Apply binding forced values on top of defaults
    if (Object.keys(newForced).length > 0) {
      subOptions = { ...(subOptions ?? {}), ...newForced };
    }

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
    // Ignore changes to sub-features that are forced by the element binding
    if (forcedSubValues[slug] !== undefined) return;

    onChange({
      ...effective,
      subOptions: {
        ...(effective.subOptions ?? {}),
        [slug]: val,
      },
    });
  }

  const visibleSubFeatures = useMemo(() => {
    const subFeatures = activeDef?.subFeatures;
    if (!subFeatures?.length) return [];
    const override = binding.materialOverrides?.[effective.type as MaterialType];
    const forced = override?.forcedValues;
    const disabled = override?.disabledSubFeatures;
    return subFeatures.filter(sf => {
      if (disabled?.includes(sf.slug)) return false;
      if (forced && sf.slug in forced) return false;
      return true;
    });
  }, [activeDef?.subFeatures, binding.materialOverrides, effective.type]);

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
      <div className="flex flex-col gap-1">
        {availableMaterials.map(m => (
          <button
            key={m.slug}
            onClick={() => setMaterialType(m.slug)}
            className={`flex items-center justify-between gap-2 px-3 py-2 rounded text-[11px] font-medium border transition-all
              ${m.isPremium
                ? effective.type === m.slug
                  ? 'border-amber-400 bg-amber-400/15 text-amber-300'
                  : 'border-amber-700/60 bg-amber-950/30 text-amber-200/70 hover:border-amber-500 hover:text-amber-200'
                : effective.type === m.slug
                  ? 'border-amber-400 bg-amber-400/10 text-amber-400'
                  : 'border-slate-600 bg-slate-800 text-slate-400 hover:border-slate-500'
              }`}
          >
            <span className="leading-tight text-left">{MATERIAL_LABELS[m.slug] ?? m.slug}</span>
            {m.isPremium && (
              <span className="flex-shrink-0 flex items-center gap-0.5 bg-amber-500 text-slate-950 text-[8px] font-bold uppercase px-1.5 py-0.5 rounded-full leading-none whitespace-nowrap">
                ✦ Premium
              </span>
            )}
          </button>
        ))}
      </div>

      {visibleSubFeatures.length ? (
        <div className="flex flex-col gap-2">
          {visibleSubFeatures.map(sf => (
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
        presets={activeDef?.colorSet?.length ? activeDef.colorSet : getElementColorPresets(settings, element)}
        allowCustomColor={Boolean(activeDef?.allowColors) && colors.allowCustomColor}
        activeMaterial={effective.type}
      />
    </div>
  );
}
