import { prisma } from '@/lib/db';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import { PlanFeatureEditor } from '@/features/admin/components/PlanFeatureEditor';

export default async function PlanDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  const [plan, allFeatures] = await Promise.all([
    prisma.subscriptionPlan.findUnique({
      where: { id },
      include: { planFeatures: { include: { feature: true } } },
    }),
    prisma.feature.findMany({ orderBy: [{ category: 'asc' }, { sortOrder: 'asc' }] }),
  ]);
  if (!plan) notFound();

  const enabledFeatureIds = new Set(plan.planFeatures.map(pf => pf.featureId));

  return (
    <div className="p-8">
      {/* Header */}
      <div className="flex items-start justify-between mb-8">
        <div>
          <div className="flex items-center gap-2 text-sm text-slate-400 mb-2">
            <Link href="/admin/plans" className="hover:text-white transition-colors">Plany</Link>
            <span>/</span>
            <span className="text-white">{plan.name}</span>
          </div>
          <h1 className="text-2xl font-bold text-white mb-1">{plan.name}</h1>
          <p className="text-slate-400 text-sm">
            <span className="text-amber-400 font-semibold">{Number(plan.basePrice).toFixed(2)} PLN</span>
            {' · '}
            {plan.planFeatures.length} feature&apos;ów
            {' · '}
            <span className={plan.isActive ? 'text-green-400' : 'text-slate-500'}>
              {plan.isActive ? 'Aktywny' : 'Nieaktywny'}
            </span>
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Feature selection */}
        <div className="lg:col-span-2 bg-slate-900 border border-slate-800 rounded-xl p-6">
          <h2 className="font-semibold text-white mb-1">Feature&apos;y w planie</h2>
          <p className="text-xs text-slate-500 mb-5">Zaznacz które feature&apos;y są zawarte w tym planie</p>
          <PlanFeatureEditor
            planId={plan.id}
            allFeatures={allFeatures}
            enabledFeatureIds={[...enabledFeatureIds]}
          />
        </div>

        {/* Plan info */}
        <div className="space-y-4">
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-5">
            <h3 className="font-semibold text-white mb-3">Szczegóły planu</h3>
            {plan.description && (
              <p className="text-sm text-slate-400 mb-3 pb-3 border-b border-slate-800">{plan.description}</p>
            )}
            <dl className="space-y-2 text-sm">
              <div className="flex justify-between">
                <dt className="text-slate-400">Cena bazowa</dt>
                <dd className="text-amber-400 font-semibold">{Number(plan.basePrice).toFixed(2)} PLN</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-slate-400">Status</dt>
                <dd className={plan.isActive ? 'text-green-400' : 'text-slate-500'}>
                  {plan.isActive ? 'Aktywny' : 'Nieaktywny'}
                </dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-slate-400">Feature&apos;y</dt>
                <dd className="text-slate-300">{plan.planFeatures.length}</dd>
              </div>
            </dl>
          </div>

          <div className="bg-slate-900 border border-slate-800 rounded-xl p-5">
            <h3 className="font-semibold text-white mb-3">Akcje</h3>
            <p className="text-xs text-slate-500 mb-3">
              Zastosowanie planu do klienta włączy wszystkie zaznaczone feature&apos;y
            </p>
            <Link
              href="/admin/clients"
              className="flex items-center justify-center gap-2 w-full py-2 px-3 rounded-lg border border-slate-700 text-slate-300 hover:border-amber-400 hover:text-amber-400 text-sm transition-colors"
            >
              Przypisz do klienta →
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
