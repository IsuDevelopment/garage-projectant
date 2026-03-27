'use client';

import { Home } from 'lucide-react';
import { AccordionSection } from '@/shared/components/AccordionSection';
import { RadioGroup } from '@/shared/components/RadioGroup';
import { ConfigSlider } from '@/shared/components/ConfigSlider';
import { MaterialPicker } from '@/features/materials/components/MaterialPicker';
import { useConfigStore } from '@/store/useConfigStore';
import { DEFAULT_SETTINGS, ROOF_SLOPE_LABELS } from '@/config/settings';
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
  const roof           = useConfigStore(s => s.config.roof);
  const globalMat      = useConfigStore(s => s.config.construction.material);
  const setRoofSlope   = useConfigStore(s => s.setRoofSlope);
  const setRoofPitch   = useConfigStore(s => s.setRoofPitch);
  const setRoofMaterial = useConfigStore(s => s.setRoofMaterial);

  const pitchKey = roof.slopeType === 'double' || roof.slopeType === 'double-front-back' ? 'double' : 'single';
  const roofPitch = DEFAULT_SETTINGS.roofPitch[pitchKey];

  const slopeOptions = DEFAULT_SETTINGS.availableRoofSlopes.map(v => ({
    value: v,
    label: ROOF_SLOPE_LABELS[v] ?? v,
    icon:  SLOPE_ICONS[v],
  }));

  return (
    <AccordionSection title="Dach" icon={<Home size={16} />} defaultOpen maxBodyHeight={360}>
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
        availableTypes={DEFAULT_SETTINGS.availableMaterials}
        onChange={setRoofMaterial}
        allowNull
      />
    </AccordionSection>
  );
}
