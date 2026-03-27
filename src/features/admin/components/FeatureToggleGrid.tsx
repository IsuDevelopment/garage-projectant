'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import type { Feature } from '@prisma/client';

// Serialized version of ClientFeature — customPrice is number|null (not Decimal)
export type SerializedClientFeature = {
  id: string;
  clientId: string;
  featureId: string;
  enabled: boolean;
  customPrice: number | null;
  createdAt: Date;
  updatedAt: Date;
};

type FeatureWithClientFeature = Feature & { clientFeature: SerializedClientFeature | null };
type GroupedFeatures = Record<string, FeatureWithClientFeature[]>;

const CATEGORY_LABELS: Record<string, string> = {
  MATERIAL:     'Materiały',
  ROOF:         'Typy dachu',
  GATE:         'Bramy',
  CONSTRUCTION: 'Konstrukcja',
  ADVANCED:     'Zaawansowane',
};

interface Props {
  clientId: string;
  features: FeatureWithClientFeature[];
}

export function FeatureToggleGrid({ clientId, features }: Props) {
  const router = useRouter();
  const [pending, setPending] = useState<Set<string>>(new Set());
  const [prices, setPrices] = useState<Record<string, string>>(() => {
    const init: Record<string, string> = {};
    features.forEach(f => {
      if (f.clientFeature?.customPrice != null) {
        init[f.id] = String(f.clientFeature.customPrice);
      }
    });
    return init;
  });

  const grouped: GroupedFeatures = {};
  for (const f of features) {
    const cat = f.category as string;
    if (!grouped[cat]) grouped[cat] = [];
    grouped[cat].push(f);
  }

  async function toggleFeature(featureId: string, enabled: boolean) {
    setPending(prev => new Set([...prev, featureId]));
    await fetch(`/api/admin/clients/${clientId}/features`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ featureId, enabled }),
    });
    setPending(prev => { const next = new Set(prev); next.delete(featureId); return next; });
    router.refresh();
  }

  async function savePrice(featureId: string) {
    const price = prices[featureId];
    await fetch(`/api/admin/clients/${clientId}/features`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ featureId, customPrice: price ? parseFloat(price) : null }),
    });
    router.refresh();
  }

  return (
    <div className="space-y-6">
      {Object.entries(CATEGORY_LABELS).map(([cat, label]) => {
        const catFeatures = grouped[cat];
        if (!catFeatures?.length) return null;
        return (
          <div key={cat}>
            <h3 className="text-xs uppercase font-semibold text-slate-500 tracking-wider mb-3">{label}</h3>
            <div className="space-y-2">
              {catFeatures.map(f => {
                const isEnabled = f.clientFeature?.enabled ?? false;
                const isPending = pending.has(f.id);
                return (
                  <div key={f.id} className={`flex flex-wrap items-center gap-x-4 gap-y-2 p-3 rounded-lg border transition-colors ${
                    isEnabled ? 'bg-amber-400/5 border-amber-400/20' : 'bg-slate-800/50 border-slate-800'
                  }`}>
                    {/* Toggle */}
                    <button
                      onClick={() => toggleFeature(f.id, !isEnabled)}
                      disabled={isPending}
                      aria-label={`Toggle ${f.name}`}
                      className={`relative w-10 h-6 rounded-full transition-colors shrink-0 ${
                        isEnabled ? 'bg-amber-400' : 'bg-slate-700'
                      } ${isPending ? 'opacity-50' : ''}`}
                    >
                      <span className={`absolute top-1 w-4 h-4 rounded-full bg-white transition-transform ${
                        isEnabled ? 'translate-x-5' : 'translate-x-1'
                      }`} />
                    </button>

                    {/* Name */}
                    <div className="flex-1 min-w-0">
                      <p className={`text-sm font-medium truncate ${isEnabled ? 'text-white' : 'text-slate-400'}`}>{f.name}</p>
                      <p className="text-xs text-slate-600 font-mono truncate">{f.key}</p>
                    </div>

                    {/* Custom price */}
                    <div className="flex items-center gap-2 shrink-0 ml-auto">
                      <input
                        type="number"
                        step="0.01"
                        min="0"
                        placeholder="Cena"
                        aria-label={`Cena za ${f.name}`}
                        value={prices[f.id] ?? ''}
                        onChange={e => setPrices(prev => ({ ...prev, [f.id]: e.target.value }))}
                        onBlur={() => savePrice(f.id)}
                        className="w-20 px-2 py-1.5 rounded bg-slate-800 border border-slate-700 text-white text-xs focus:outline-none focus:border-amber-400 transition-colors"
                      />
                      <span className="text-xs text-slate-500">PLN</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        );
      })}
    </div>
  );
}
