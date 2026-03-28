'use client';

import { useMemo, useState } from 'react';
import { CircleHelp, ShieldPlus } from 'lucide-react';
import { AccordionSection } from '@/shared/components/AccordionSection';
import { ColorPicker } from '@/shared/components/ColorPicker';
import { useConfigStore } from '@/store/useConfigStore';
import { useSettingsContext } from '@/config/SettingsContext';

function formatPrice(price?: number): string | null {
  if (!price || price <= 0) return null;
  return `${price.toLocaleString('pl-PL')} zł`;
}

export function AdditionalServicesPanel() {
  const [detailsSlug, setDetailsSlug] = useState<string | null>(null);
  const additionalConfig = useConfigStore(s => s.config.additionalFeatures);
  const setAdditionalFeature = useConfigStore(s => s.setAdditionalFeature);
  const settings = useSettingsContext();

  const features = (settings.additionalFeatures ?? []).filter(feature => feature.enabled !== false);

  const detailsFeature = useMemo(
    () => features.find(feature => feature.slug === detailsSlug),
    [features, detailsSlug],
  );

  if (features.length === 0) return null;

  return (
    <>
      <AccordionSection title="Uslugi dodatkowe" icon={<ShieldPlus size={16} />} maxBodyHeight={520}>
        <div className="flex flex-col gap-3">
          {features.map(feature => {
            const featureState = additionalConfig[feature.slug] ?? {
              enabled: false,
              selectedOptionSlug: feature.options?.[0]?.slug ?? null,
              optionColor: feature.options?.[0]?.defaultColor ?? '#8f969f',
            };

            const selectedOption = feature.options?.find(option => option.slug === featureState.selectedOptionSlug)
              ?? feature.options?.[0];

            const featurePrice = formatPrice(feature.price);
            const optionPrice = formatPrice(selectedOption?.price);

            return (
              <div key={feature.slug} className="rounded-lg border border-slate-700 bg-slate-800/30 p-3">
                <label className="flex items-center gap-3 cursor-pointer select-none">
                  <div className="relative">
                    <input
                      type="checkbox"
                      checked={featureState.enabled}
                      onChange={e => setAdditionalFeature(feature.slug, {
                        enabled: e.target.checked,
                        selectedOptionSlug: featureState.selectedOptionSlug ?? feature.options?.[0]?.slug ?? null,
                      })}
                      className="sr-only peer"
                      aria-label={feature.name}
                    />
                    <div className="w-10 h-6 bg-slate-700 rounded-full peer peer-checked:bg-amber-400 transition-colors" />
                    <div className="absolute left-1 top-1 w-4 h-4 bg-white rounded-full transition-transform peer-checked:translate-x-4" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium text-slate-200">{feature.name}</span>
                      {featureState.enabled && <span className="text-[11px] text-amber-400">Aktywne</span>}
                    </div>
                    {(featurePrice || optionPrice) && (
                      <p className="text-xs text-slate-400">
                        {[featurePrice, optionPrice].filter(Boolean).join(' + ')}
                      </p>
                    )}
                  </div>
                </label>

                {feature.description && (
                  <p className="mt-2 text-xs leading-snug text-slate-500">{feature.description}</p>
                )}

                {!!feature.details?.trim() && (
                  <button
                    type="button"
                    onClick={() => setDetailsSlug(feature.slug)}
                    className="mt-2 inline-flex items-center gap-1 rounded-md border border-slate-600 px-2 py-1 text-[11px] text-slate-300 hover:border-slate-500 hover:text-white transition-colors"
                  >
                    <CircleHelp size={12} />
                    Poznaj szczegoly
                  </button>
                )}

                {featureState.enabled && (
                  <div className="mt-3 flex flex-col gap-3 border-t border-slate-700/60 pt-3">
                    {!!feature.options?.length && (
                      <label className="flex flex-col gap-1.5">
                        <span className="text-xs font-medium uppercase tracking-wide text-slate-400">Wariant</span>
                        <select
                          value={selectedOption?.slug ?? ''}
                          onChange={e => {
                            const nextOption = feature.options?.find(option => option.slug === e.target.value);
                            setAdditionalFeature(feature.slug, {
                              selectedOptionSlug: nextOption?.slug ?? null,
                              optionColor: nextOption?.defaultColor ?? featureState.optionColor,
                            });
                          }}
                          className="h-9 rounded-md border border-slate-600 bg-slate-800 px-2 text-sm text-slate-200 outline-none transition-colors focus:border-amber-400"
                          aria-label={`Wariant dla ${feature.name}`}
                        >
                          {feature.options?.map(option => (
                            <option key={option.slug} value={option.slug}>
                              {option.name}
                            </option>
                          ))}
                        </select>
                      </label>
                    )}

                    {selectedOption?.allowColor && (
                      <ColorPicker
                        value={featureState.optionColor}
                        onChange={hex => setAdditionalFeature(feature.slug, { optionColor: hex })}
                        presets={settings.colors.set}
                        allowCustomColor={settings.colors.allowCustomColor}
                      />
                    )}

                    {selectedOption?.info && (
                      <p className="rounded-md border border-slate-700 bg-slate-800/60 px-2.5 py-2 text-xs leading-snug text-slate-400">
                        {selectedOption.info}
                      </p>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </AccordionSection>

      {detailsFeature && (
        <div className="fixed inset-0 z-[90] flex items-center justify-center bg-black/60 p-4">
          <div className="w-full max-w-lg rounded-xl border border-slate-700 bg-slate-900 shadow-2xl">
            <div className="flex items-start justify-between gap-3 border-b border-slate-700 px-4 py-3">
              <div>
                <h3 className="text-base font-semibold text-white">{detailsFeature.name}</h3>
                <p className="text-xs text-slate-500">Szczegoly uslugi</p>
              </div>
              <button
                type="button"
                onClick={() => setDetailsSlug(null)}
                className="rounded-md border border-slate-600 px-2 py-1 text-xs text-slate-300 hover:border-slate-500 hover:text-white transition-colors"
              >
                Zamknij
              </button>
            </div>
            <div className="max-h-[50dvh] overflow-y-auto px-4 py-3">
              <p className="whitespace-pre-wrap text-sm leading-relaxed text-slate-300">{detailsFeature.details}</p>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
