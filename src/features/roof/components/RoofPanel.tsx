'use client';

import Image from 'next/image';
import { Home } from 'lucide-react';
import { AccordionSection } from '@/shared/components/AccordionSection';
import { RadioGroup } from '@/shared/components/RadioGroup';
import { ConfigSlider } from '@/shared/components/ConfigSlider';
import { MaterialPicker } from '@/features/materials/components/MaterialPicker';
import { useConfigStore } from '@/store/useConfigStore';
import { getAvailableRoofSlopes, getRoofPitchLimits, ROOF_SLOPE_LABELS } from '@/config/settings';
import { useSettingsContext } from '@/config/SettingsContext';
import { RoofSlopeType } from '@/store/types';

const SLOPE_ICONS: Record<RoofSlopeType, string> = {
  double: '⬍',
  'double-front-back': '⬌',
  right:  '◪',
  left:   '◩',
  front:  '▽',
  back:   '△',
};

export function RoofPanel() {
  const roof            = useConfigStore(s => s.config.roof);
  const globalMat       = useConfigStore(s => s.config.construction.material);
  const feltRoof        = useConfigStore(s => s.config.feltRoof);
  const setRoofSlope    = useConfigStore(s => s.setRoofSlope);
  const setRoofPitch    = useConfigStore(s => s.setRoofPitch);
  const setRoofMaterial = useConfigStore(s => s.setRoofMaterial);
  const setFeltRoof     = useConfigStore(s => s.setFeltRoof);

  const s = useSettingsContext();
  const pitchKey = roof.slopeType === 'double' || roof.slopeType === 'double-front-back' ? 'double' : 'single';
  const roofPitch = getRoofPitchLimits(s, pitchKey);

  const slopeOptions = getAvailableRoofSlopes(s).map(v => ({
    value: v,
    label: ROOF_SLOPE_LABELS[v] ?? v,
    icon:  SLOPE_ICONS[v],
  }));

  return (
    <AccordionSection title="Dach" icon={<Home size={16} />} defaultOpen maxBodyHeight={480}>
      <div className="flex flex-col gap-1.5">
        <span className="text-xs font-medium text-slate-400 uppercase tracking-wide">Rodzaj spadku</span>
        <RadioGroup
          value={roof.slopeType}
          options={slopeOptions}
          onChange={setRoofSlope}
          columns={2}
        />
      </div>

      <ConfigSlider
        label={roofPitch.label}
        value={roof.pitch}
        unit={roofPitch.unit}
        onChange={setRoofPitch}
        {...(roofPitch.mode === 'values'
          ? { values: roofPitch.values }
          : { min: roofPitch.min, max: roofPitch.max, step: 1 }
        )}
      />

      <MaterialPicker
        label="Materiał dachu"
        value={roof.material}
        globalMaterial={globalMat}
        element="roof"
        roofSlopeType={roof.slopeType}
        onChange={setRoofMaterial}
        allowNull
      />

      {/* Roof felt toggle — only shown when the feature is enabled in settings */}
      {s.roofFelt?.enabled && (
        <div className="flex flex-col gap-2 pt-1 border-t border-slate-700/50">
          <div className="flex items-center gap-3">
            {/* Preview thumbnail */}
            {s.roofFelt.previewImage && (
              <div className="relative flex-shrink-0 w-14 h-14 rounded overflow-hidden border border-slate-600">
                <Image
                  src={s.roofFelt.previewImage}
                  alt="Filc dachowy"
                  fill
                  sizes="56px"
                  className="object-cover"
                />
              </div>
            )}

            <div className="flex flex-col gap-1 flex-1 min-w-0">
              {/* Toggle row */}
              <label className="flex items-center gap-2 cursor-pointer select-none">
                <div className="relative flex-shrink-0">
                  <input
                    type="checkbox"
                    checked={feltRoof.enabled}
                    onChange={e => setFeltRoof({ enabled: e.target.checked })}
                    className="sr-only peer"
                    aria-label="Filc dachowy"
                  />
                  <div className="w-10 h-6 bg-slate-700 rounded-full peer peer-checked:bg-amber-400 transition-colors" />
                  <div className="absolute left-1 top-1 w-4 h-4 bg-white rounded-full transition-transform peer-checked:translate-x-4" />
                </div>
                <span className="text-sm text-slate-300">
                  Filc dachowy
                  {feltRoof.enabled && <span className="ml-2 text-xs text-amber-400">Aktywny</span>}
                </span>
              </label>

              {/* Description */}
              {s.roofFelt.description && (
                <p className="text-xs text-slate-500 leading-snug">
                  {s.roofFelt.description}
                </p>
              )}
            </div>
          </div>
        </div>
      )}
    </AccordionSection>
  );
}
