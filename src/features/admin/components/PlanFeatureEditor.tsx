'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import type { Feature } from '@prisma/client';

const CATEGORY_LABELS: Record<string, string> = {
  MATERIAL:     'Materiały',
  ROOF:         'Typy dachu',
  GATE:         'Bramy',
  CONSTRUCTION: 'Konstrukcja',
  ADVANCED:     'Zaawansowane',
};

interface Props {
  planId: string;
  allFeatures: Feature[];
  enabledFeatureIds: string[];
}

export function PlanFeatureEditor({ planId, allFeatures, enabledFeatureIds }: Props) {
  const router = useRouter();
  const [selected, setSelected] = useState<Set<string>>(new Set(enabledFeatureIds));
  const [saving, setSaving] = useState(false);

  const grouped: Record<string, Feature[]> = {};
  for (const f of allFeatures) {
    if (!grouped[f.category]) grouped[f.category] = [];
    grouped[f.category].push(f);
  }

  function toggle(id: string) {
    setSelected(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  }

  async function save() {
    setSaving(true);
    await fetch(`/api/admin/plans/${planId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ featureIds: [...selected] }),
    });
    setSaving(false);
    router.refresh();
  }

  const hasChanges = JSON.stringify([...selected].sort()) !== JSON.stringify([...enabledFeatureIds].sort());

  return (
    <div className="space-y-5">
      {Object.entries(CATEGORY_LABELS).map(([cat, label]) => {
        const catFeatures = grouped[cat];
        if (!catFeatures?.length) return null;
        return (
          <div key={cat}>
            <h3 className="text-xs uppercase font-semibold text-slate-500 tracking-wider mb-2">{label}</h3>
            <div className="space-y-1.5">
              {catFeatures.map(f => {
                const isOn = selected.has(f.id);
                return (
                  <label key={f.id} className={`flex items-center gap-3 p-3 rounded-lg cursor-pointer border transition-colors ${
                    isOn ? 'bg-amber-400/5 border-amber-400/20' : 'bg-slate-800/50 border-slate-800 hover:border-slate-700'
                  }`}>
                    <input
                      type="checkbox"
                      checked={isOn}
                      onChange={() => toggle(f.id)}
                      className="w-4 h-4 accent-amber-400 shrink-0"
                      aria-label={f.name}
                    />
                    <div className="flex-1 min-w-0">
                      <p className={`text-sm font-medium ${isOn ? 'text-white' : 'text-slate-400'}`}>{f.name}</p>
                      <p className="text-xs text-slate-600 font-mono">{f.key}</p>
                    </div>
                  </label>
                );
              })}
            </div>
          </div>
        );
      })}

      <div className="pt-4 border-t border-slate-800">
        <button
          onClick={save}
          disabled={saving || !hasChanges}
          className="px-5 py-2.5 rounded-lg bg-amber-400 hover:bg-amber-300 text-slate-900 font-semibold text-sm transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
        >
          {saving ? 'Zapisywanie…' : hasChanges ? 'Zapisz zmiany' : 'Zapisano'}
        </button>
      </div>
    </div>
  );
}
