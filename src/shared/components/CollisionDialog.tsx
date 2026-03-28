'use client';

import { AlertTriangle, Trash2, X } from 'lucide-react';

interface ConflictItem {
  id:   string;
  name: string;
}

interface CollisionDialogProps {
  open:      boolean;
  conflicts: ConflictItem[];
  onConfirm: () => void; // remove all + apply dimension
  onCancel:  () => void; // rollback — close dialog only
}

export function CollisionDialog({ open, conflicts, onConfirm, onCancel }: CollisionDialogProps) {
  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="collision-dialog-title"
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
            <AlertTriangle size={18} className="text-amber-400" />
          </div>
          <div className="flex-1 min-w-0">
            <h2 id="collision-dialog-title" className="text-sm font-semibold text-white">
              Wykryto kolizję
            </h2>
            <p className="mt-1 text-xs text-slate-400">
              Poniższe obiekty wychodzą poza nowe wymiary bryły. Usuń je, aby kontynuować, lub anuluj.
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

        {/* Conflict list */}
        <ul className="mx-5 mb-4 flex flex-col gap-1.5">
          {conflicts.map(c => (
            <li
              key={c.id}
              className="flex items-center gap-2 rounded-lg bg-slate-800 px-3 py-2 text-xs text-slate-300"
            >
              <Trash2 size={12} className="flex-none text-red-400" />
              {c.name}
            </li>
          ))}
        </ul>

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
            className="flex-1 rounded-lg bg-red-500/90 hover:bg-red-500 py-2 text-sm font-semibold text-white transition-colors"
          >
            Usuń obiekty
          </button>
        </div>
      </div>
    </div>
  );
}
