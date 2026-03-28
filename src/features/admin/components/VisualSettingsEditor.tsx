'use client';

import { useMemo, useState } from 'react';
import type { VisualEnvironmentConfig } from '@/config/settings';

interface VisualSettingsEditorProps {
  title: string;
  description: string;
  endpoint: string;
  initialSettings: VisualEnvironmentConfig;
  resetLabel: string;
  inheritedHint?: string;
}

function prettyJson(value: unknown) {
  return JSON.stringify(value, null, 2);
}

export function VisualSettingsEditor({
  title,
  description,
  endpoint,
  initialSettings,
  resetLabel,
  inheritedHint,
}: VisualSettingsEditorProps) {
  const initialClouds = useMemo(() => prettyJson(initialSettings.clouds), [initialSettings.clouds]);
  const initialTrees = useMemo(() => prettyJson(initialSettings.trees), [initialSettings.trees]);

  const [backgroundColor, setBackgroundColor] = useState(initialSettings.backgroundColor);
  const [radius, setRadius] = useState(String(initialSettings.sky.radius));
  const [topColor, setTopColor] = useState(initialSettings.sky.topColor);
  const [midColor, setMidColor] = useState(initialSettings.sky.midColor);
  const [horizonColor, setHorizonColor] = useState(initialSettings.sky.horizonColor);
  const [cloudsText, setCloudsText] = useState(initialClouds);
  const [treesText, setTreesText] = useState(initialTrees);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  async function save(visualSettings: VisualEnvironmentConfig | null, successMessage: string) {
    setIsSaving(true);
    setError(null);
    setSuccess(null);

    try {
      const res = await fetch(endpoint, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ visualSettings }),
      });

      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        setError(body.error ?? 'Nie udało się zapisać ustawień');
        return;
      }

      setSuccess(successMessage);
      if (visualSettings === null) {
        window.location.reload();
      }
    } finally {
      setIsSaving(false);
    }
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    let clouds: unknown;
    let trees: unknown;

    try {
      clouds = JSON.parse(cloudsText);
    } catch {
      setError('Lista chmur musi być poprawnym JSON-em');
      return;
    }

    try {
      trees = JSON.parse(treesText);
    } catch {
      setError('Lista drzew musi być poprawnym JSON-em');
      return;
    }

    const visualSettings: VisualEnvironmentConfig = {
      backgroundColor,
      sky: {
        radius: Number(radius),
        topColor,
        midColor,
        horizonColor,
      },
      clouds: clouds as VisualEnvironmentConfig['clouds'],
      trees: trees as VisualEnvironmentConfig['trees'],
    };

    await save(visualSettings, 'Ustawienia zapisane');
  }

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 md:p-6">
      <div className="mb-5">
        <h2 className="font-semibold text-white mb-1">{title}</h2>
        <p className="text-sm text-slate-400">{description}</p>
        {inheritedHint && <p className="text-xs text-amber-400 mt-2">{inheritedHint}</p>}
      </div>

      <form onSubmit={handleSubmit} className="space-y-5">
        {error && (
          <div className="px-4 py-3 rounded-lg bg-red-500/10 border border-red-500/30 text-red-400 text-sm">
            {error}
          </div>
        )}
        {success && (
          <div className="px-4 py-3 rounded-lg bg-green-500/10 border border-green-500/30 text-green-400 text-sm">
            {success}
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <label className="block">
            <span className="block text-sm font-medium text-slate-300 mb-1.5">Kolor tła</span>
            <input value={backgroundColor} onChange={e => setBackgroundColor(e.target.value)} className="w-full px-3 py-2.5 rounded-lg bg-slate-800 border border-slate-700 text-white font-mono" />
          </label>
          <label className="block">
            <span className="block text-sm font-medium text-slate-300 mb-1.5">Promień kopuły</span>
            <input value={radius} onChange={e => setRadius(e.target.value)} type="number" min="1" step="1" className="w-full px-3 py-2.5 rounded-lg bg-slate-800 border border-slate-700 text-white" />
          </label>
          <label className="block">
            <span className="block text-sm font-medium text-slate-300 mb-1.5">Kolor zenitu</span>
            <input value={topColor} onChange={e => setTopColor(e.target.value)} className="w-full px-3 py-2.5 rounded-lg bg-slate-800 border border-slate-700 text-white font-mono" />
          </label>
          <label className="block">
            <span className="block text-sm font-medium text-slate-300 mb-1.5">Kolor środkowy</span>
            <input value={midColor} onChange={e => setMidColor(e.target.value)} className="w-full px-3 py-2.5 rounded-lg bg-slate-800 border border-slate-700 text-white font-mono" />
          </label>
          <label className="block md:col-span-2">
            <span className="block text-sm font-medium text-slate-300 mb-1.5">Kolor horyzontu</span>
            <input value={horizonColor} onChange={e => setHorizonColor(e.target.value)} className="w-full px-3 py-2.5 rounded-lg bg-slate-800 border border-slate-700 text-white font-mono" />
          </label>
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-300 mb-1.5">Chmury (JSON)</label>
          <textarea value={cloudsText} onChange={e => setCloudsText(e.target.value)} rows={12} className="w-full px-3 py-2.5 rounded-lg bg-slate-800 border border-slate-700 text-white font-mono text-xs resize-y" />
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-300 mb-1.5">Drzewa (JSON)</label>
          <textarea value={treesText} onChange={e => setTreesText(e.target.value)} rows={14} className="w-full px-3 py-2.5 rounded-lg bg-slate-800 border border-slate-700 text-white font-mono text-xs resize-y" />
        </div>

        <div className="flex flex-wrap gap-3 pt-2">
          <button type="submit" disabled={isSaving} className="px-4 py-2.5 rounded-lg bg-amber-400 hover:bg-amber-300 text-slate-900 font-semibold text-sm transition-colors disabled:opacity-50">
            {isSaving ? 'Zapisywanie…' : 'Zapisz ustawienia'}
          </button>
          <button
            type="button"
            disabled={isSaving}
            onClick={() => void save(null, 'Przywrócono ustawienia domyślne')}
            className="px-4 py-2.5 rounded-lg border border-slate-700 text-slate-300 hover:border-slate-500 hover:text-white text-sm transition-colors disabled:opacity-50"
          >
            {resetLabel}
          </button>
        </div>
      </form>
    </div>
  );
}