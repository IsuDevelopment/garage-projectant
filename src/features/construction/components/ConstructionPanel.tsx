'use client';

import { Wrench } from 'lucide-react';
import { AccordionSection } from '@/shared/components/AccordionSection';
import { RadioGroup } from '@/shared/components/RadioGroup';
import { MaterialPicker } from '@/features/materials/components/MaterialPicker';
import { useConfigStore } from '@/store/useConfigStore';
import { DEFAULT_SETTINGS, PROFILE_LABELS } from '@/config/settings';
import { ProfileType } from '@/store/types';

export function ConstructionPanel() {
  const construction           = useConfigStore(s => s.config.construction);
  const setConstructionMaterial = useConfigStore(s => s.setConstructionMaterial);
  const setProfileType          = useConfigStore(s => s.setProfileType);
  const setGalvanized           = useConfigStore(s => s.setGalvanized);

  const profileOptions = DEFAULT_SETTINGS.availableProfiles.map((v: ProfileType) => ({
    value: v,
    label: PROFILE_LABELS[v] ?? v,
  }));

  return (
    <AccordionSection title="Konstrukcja" icon={<Wrench size={16} />} maxBodyHeight={360}>
      <MaterialPicker
        label="Materiał (globalny)"
        value={construction.material}
        availableTypes={DEFAULT_SETTINGS.availableMaterials}
        onChange={m => m && setConstructionMaterial(m)}
      />

      <div className="flex flex-col gap-1.5">
        <span className="text-xs font-medium text-slate-400 uppercase tracking-wide">Typ profili</span>
        <RadioGroup
          value={construction.profileType}
          options={profileOptions}
          onChange={setProfileType}
          columns={2}
        />
      </div>

      <label className="flex items-center gap-3 cursor-pointer select-none">
        <div className="relative">
          <input
            type="checkbox"
            checked={construction.galvanized}
            onChange={e => setGalvanized(e.target.checked)}
            className="sr-only peer"
          />
          <div className="w-10 h-6 bg-slate-700 rounded-full peer peer-checked:bg-amber-400 transition-colors" />
          <div className="absolute left-1 top-1 w-4 h-4 bg-white rounded-full transition-transform peer-checked:translate-x-4" />
        </div>
        <span className="text-sm text-slate-300">
          Ocynkowanie
          {construction.galvanized && (
            <span className="ml-2 text-xs text-amber-400">Aktywne</span>
          )}
        </span>
      </label>
    </AccordionSection>
  );
}
