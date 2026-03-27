'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';

const schema = z.object({
  name:        z.string().min(2, 'Min. 2 znaki').max(100),
  description: z.string().optional(),
  basePrice:   z.number().min(0, 'Cena nie może być ujemna'),
});
type FormData = z.infer<typeof schema>;

export default function NewPlanPage() {
  const router = useRouter();
  const [serverError, setServerError] = useState<string | null>(null);

  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: { basePrice: 0 },
  });

  async function onSubmit(data: FormData) {
    setServerError(null);
    const res = await fetch('/api/admin/plans', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });

    if (!res.ok) {
      const body = await res.json().catch(() => ({}));
      setServerError(body.error ?? 'Wystąpił błąd');
      return;
    }

    const { id } = await res.json();
    router.push(`/admin/plans/${id}`);
  }

  return (
    <div className="p-8 max-w-lg">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-white mb-1">Nowy plan</h1>
        <p className="text-slate-400">Utwórz marketingowy bundle feature&apos;ów</p>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="bg-slate-900 border border-slate-800 rounded-xl p-6 space-y-5">
        {serverError && (
          <div className="px-4 py-3 rounded-lg bg-red-500/10 border border-red-500/30 text-red-400 text-sm">
            {serverError}
          </div>
        )}

        <div>
          <label className="block text-sm font-medium text-slate-300 mb-1.5" htmlFor="name">
            Nazwa planu
          </label>
          <input
            id="name"
            className="w-full px-3 py-2.5 rounded-lg bg-slate-800 border border-slate-700 text-white placeholder-slate-500 focus:outline-none focus:border-amber-400 focus:ring-1 focus:ring-amber-400 transition-colors"
            placeholder="np. Plan Basic"
            {...register('name')}
          />
          {errors.name && <p className="mt-1 text-xs text-red-400">{errors.name.message}</p>}
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-300 mb-1.5" htmlFor="description">
            Opis <span className="text-slate-500 font-normal">(opcjonalny)</span>
          </label>
          <textarea
            id="description"
            rows={3}
            className="w-full px-3 py-2.5 rounded-lg bg-slate-800 border border-slate-700 text-white placeholder-slate-500 focus:outline-none focus:border-amber-400 focus:ring-1 focus:ring-amber-400 transition-colors resize-none"
            placeholder="Krótki opis planu dla klientów…"
            {...register('description')}
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-300 mb-1.5" htmlFor="basePrice">
            Cena bazowa (PLN)
          </label>
          <input
            id="basePrice"
            type="number"
            step="0.01"
            min="0"
            className="w-full px-3 py-2.5 rounded-lg bg-slate-800 border border-slate-700 text-white placeholder-slate-500 focus:outline-none focus:border-amber-400 focus:ring-1 focus:ring-amber-400 transition-colors"
            placeholder="0.00"
            {...register('basePrice', { valueAsNumber: true })}
          />
          {errors.basePrice && <p className="mt-1 text-xs text-red-400">{errors.basePrice.message}</p>}
        </div>

        <div className="flex gap-3 pt-2">
          <button
            type="submit"
            disabled={isSubmitting}
            className="flex-1 py-2.5 rounded-lg bg-amber-400 hover:bg-amber-300 text-slate-900 font-semibold text-sm transition-colors disabled:opacity-50"
          >
            {isSubmitting ? 'Tworzenie…' : 'Utwórz plan'}
          </button>
          <button
            type="button"
            onClick={() => router.back()}
            className="px-5 py-2.5 rounded-lg border border-slate-700 text-slate-300 hover:border-slate-500 hover:text-white text-sm transition-colors"
          >
            Anuluj
          </button>
        </div>
      </form>
    </div>
  );
}
