'use client';

import { Ruler } from 'lucide-react';
import { AccordionSection } from '@/shared/components/AccordionSection';
import { ConfigSlider } from '@/shared/components/ConfigSlider';
import { useConfigStore } from '@/store/useConfigStore';
import { useSettingsContext } from '@/config/SettingsContext';
import { cmToMeters, getConstructionSizeValuesCm, metersToCm } from '@/config/settings';

export function DimensionsPanel() {
  const dim      = useConfigStore(s => s.config.dimensions);
  const setWidth  = useConfigStore(s => s.setWidth);
  const setHeight = useConfigStore(s => s.setHeight);
  const setDepth  = useConfigStore(s => s.setDepth);

  const { dimensions: limits } = useSettingsContext();
  const settings = useSettingsContext();

  const widthValuesMeters = getConstructionSizeValuesCm(settings, 'width').map(cmToMeters);
  const depthValuesMeters = getConstructionSizeValuesCm(settings, 'depth').map(cmToMeters);
  const heightValuesCm = getConstructionSizeValuesCm(settings, 'height');

  return (
    <AccordionSection title="Wymiary" icon={<Ruler size={16} />} defaultOpen maxBodyHeight={260}>
      <ConfigSlider
        label={limits.width.label}
        value={dim.width}
        values={widthValuesMeters}
        unit={limits.width.unit}
        onChange={setWidth}
      />
      <ConfigSlider
        label={`${limits.height.label} (cm)`}
        value={metersToCm(dim.height)}
        values={heightValuesCm}
        unit="cm"
        onChange={(heightCm) => setHeight(cmToMeters(heightCm))}
      />
      <ConfigSlider
        label={limits.depth.label}
        value={dim.depth}
        values={depthValuesMeters}
        unit={limits.depth.unit}
        onChange={setDepth}
      />
    </AccordionSection>
  );
}
