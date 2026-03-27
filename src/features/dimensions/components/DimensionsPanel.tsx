'use client';

import { Ruler } from 'lucide-react';
import { AccordionSection } from '@/shared/components/AccordionSection';
import { ConfigSlider } from '@/shared/components/ConfigSlider';
import { useConfigStore } from '@/store/useConfigStore';
import { DEFAULT_SETTINGS } from '@/config/settings';

export function DimensionsPanel() {
  const dim      = useConfigStore(s => s.config.dimensions);
  const setWidth  = useConfigStore(s => s.setWidth);
  const setHeight = useConfigStore(s => s.setHeight);
  const setDepth  = useConfigStore(s => s.setDepth);

  const { dimensions: limits } = DEFAULT_SETTINGS;

  return (
    <AccordionSection title="Wymiary" icon={<Ruler size={16} />} defaultOpen maxBodyHeight={260}>
      <ConfigSlider
        label={limits.width.label}
        value={dim.width}
        min={limits.width.min}
        max={limits.width.max}
        step={limits.width.step}
        unit={limits.width.unit}
        onChange={setWidth}
      />
      <ConfigSlider
        label={limits.height.label}
        value={dim.height}
        min={limits.height.min}
        max={limits.height.max}
        step={limits.height.step}
        unit={limits.height.unit}
        onChange={setHeight}
      />
      <ConfigSlider
        label={limits.depth.label}
        value={dim.depth}
        min={limits.depth.min}
        max={limits.depth.max}
        step={limits.depth.step}
        unit={limits.depth.unit}
        onChange={setDepth}
      />
    </AccordionSection>
  );
}
