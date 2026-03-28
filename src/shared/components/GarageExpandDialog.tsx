'use client';

import { Expand, X } from 'lucide-react';
import type { ExpandGarageDialogState } from '@/store/useUIStore';

const DIMENSION_LABELS: Record<NonNullable<ExpandGarageDialogState['dimension']>, string> = {
  width:  'szerokość',
  depth:  'głębokość',
  height: 'wysokość (ściany)',
};

function formatMeters(meters: number, dimension: ExpandGarageDialogState['dimension']): string {
  if (dimension === 'height') return `${Math.round(meters * 100)} cm`;
  return `${meters.toFixed(2)} m`;
}

interface GarageExpandDialogProps {
  state:     ExpandGarageDialogState;
  onConfirm: () => void;
  onCancel:  () => void;
}

export function GarageExpandDialog({ state, onConfirm, onCancel }: GarageExpandDialogProps) {
  if (!state.open || !state.dimension) return null;

  const dimLabel     = DIMENSION_LABELS[state.dimension];
  const currentStr   = formatMeters(state.currentMeters, state.dimension);
  const requiredStr  = formatMeters(state.requiredMeters, state.dimension);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="expand-garage-dialog-title"
    >
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={onCancel}
      />

      {/* Panel */}
      <div className="relative z-10 w-full max-w-sm rounded-xl border border-slate-700 bg-slate-900 shadow-2xl">
        {/* Header */}
        <div className="flex items-start gap-3 px-5 pt-5 pb-4">
          <div className="flex-none mt-0.5 rounded-lg bg-amber-400/10 p-2">
            <Expand size={18} className="text-amber-400" />
          </div>
          <div className="flex-1 min-w-0">
            <h2 id="expand-garage-dialog-title" className="text-sm font-semibold text-white">
              Brama nie mieści się w garażu
            </h2>
            <p className="mt-1 text-xs text-slate-400">
              Wybrany typ bramy wymaga, aby{' '}
              <span className="text-slate-200 font-medium">{dimLabel}</span> garażu wynosiła
              co najmniej{' '}
              <span className="text-amber-400 font-semibold font-mono">{requiredStr}</span>
              {' '}(aktualnie{' '}
              <span className="text-slate-300 font-mono">{currentStr}</span>).
            </p>
            <p className="mt-1.5 text-xs text-slate-500">
              Czy automatycznie rozszerzyć garaż i zastosować zmianę?
            </p>
          </div>
          <button
            onClick={onCancel}
            className="flex-none -mt-0.5 p-1 text-slate-500 hover:text-slate-300 transition-colors"
            aria-label="Zamknij"
          >
            <X size={16} />
          </button>
        </div>

        {/* Actions */}
        <div className="flex gap-2 px-5 pb-5">
          <button
            onClick={onCancel}
            className="flex-1 rounded-lg border border-slate-700 py-2 text-sm text-slate-400 hover:text-white hover:border-slate-500 transition-colors"
          >
            Anuluj
          </button>
          <button
            onClick={onConfirm}
            className="flex-1 rounded-lg bg-amber-500 hover:bg-amber-400 py-2 text-sm font-semibold text-slate-900 transition-colors"
          >
            Rozszerz garaż
          </button>
        </div>
      </div>
    </div>
  );
}
