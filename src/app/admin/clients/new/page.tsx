'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';

const schema = z.object({
  name: z.string().min(2, 'Min. 2 znaki').max(100),
  slug: z.string()
    .min(2)
    .max(60)
    .regex(/^[a-z0-9-]+$/, 'Tylko małe litery, cyfry i myślniki'),
  notes: z.string().optional(),
});
type FormData = z.infer<typeof schema>;

export default function NewClientPage() {
  const router = useRouter();
  const [serverError, setServerError] = useState<string | null>(null);

  const { register, handleSubmit, setValue, watch, formState: { errors, isSubmitting } } = useForm<FormData>({
    resolver: zodResolver(schema),
  });

  const name = watch('name') ?? '';

  function autoSlug() {
    const slug = name.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');
    setValue('slug', slug, { shouldValidate: true });
  }

  async function onSubmit(data: FormData) {
    setServerError(null);
    const res = await fetch('/api/admin/clients', {
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
    router.push(`/admin/clients/${id}`);
  }

  return (
    <div className="p-8 max-w-lg">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-white mb-1">Nowy klient</h1>
        <p className="text-slate-400">Podaj podstawowe dane firmy</p>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="bg-slate-900 border border-slate-800 rounded-xl p-6 space-y-5">
        {serverError && (
          <div className="px-4 py-3 rounded-lg bg-red-500/10 border border-red-500/30 text-red-400 text-sm">
            {serverError}
          </div>
        )}

        <div>
          <label className="block text-sm font-medium text-slate-300 mb-1.5" htmlFor="name">
            Nazwa firmy
          </label>
          <input
            id="name"
            className="w-full px-3 py-2.5 rounded-lg bg-slate-800 border border-slate-700 text-white placeholder-slate-500 focus:outline-none focus:border-amber-400 focus:ring-1 focus:ring-amber-400 transition-colors"
            placeholder="np. Garaże Kowalski"
            {...register('name')}
            onBlur={autoSlug}
          />
          {errors.name && <p className="mt-1 text-xs text-red-400">{errors.name.message}</p>}
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-300 mb-1.5" htmlFor="slug">
            Slug (identyfikator URL)
          </label>
          <input
            id="slug"
            className="w-full px-3 py-2.5 rounded-lg bg-slate-800 border border-slate-700 text-white placeholder-slate-500 focus:outline-none focus:border-amber-400 focus:ring-1 focus:ring-amber-400 transition-colors font-mono"
            placeholder="garaze-kowalski"
            {...register('slug')}
          />
          {errors.slug && <p className="mt-1 text-xs text-red-400">{errors.slug.message}</p>}
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-300 mb-1.5" htmlFor="notes">
            Notatki <span className="text-slate-500 font-normal">(opcjonalne)</span>
          </label>
          <textarea
            id="notes"
            rows={3}
            className="w-full px-3 py-2.5 rounded-lg bg-slate-800 border border-slate-700 text-white placeholder-slate-500 focus:outline-none focus:border-amber-400 focus:ring-1 focus:ring-amber-400 transition-colors resize-none"
            placeholder="Wewnętrzne notatki o kliencie…"
            {...register('notes')}
          />
        </div>

        <div className="flex gap-3 pt-2">
          <button
            type="submit"
            disabled={isSubmitting}
            className="flex-1 py-2.5 rounded-lg bg-amber-400 hover:bg-amber-300 text-slate-900 font-semibold text-sm transition-colors disabled:opacity-50"
          >
            {isSubmitting ? 'Tworzenie…' : 'Utwórz klienta'}
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
