import { prisma } from '@/lib/db';
import Link from 'next/link';

export default async function PlansPage() {
  const plans = await prisma.subscriptionPlan.findMany({
    orderBy: { sortOrder: 'asc' },
    include: { _count: { select: { planFeatures: true } } },
  });

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-white mb-1">Plany subskrypcji</h1>
          <p className="text-slate-400">Marketingowe bundle&apos;e feature&apos;ów</p>
        </div>
        <Link
          href="/admin/plans/new"
          className="flex items-center gap-2 px-4 py-2.5 rounded-lg bg-amber-400 hover:bg-amber-300 text-slate-900 font-semibold text-sm transition-colors"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
          </svg>
          Nowy plan
        </Link>
      </div>

      {plans.length === 0 ? (
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-12 text-center">
          <p className="text-slate-400 mb-4">Brak planów. Możesz przypisywać feature&apos;y bezpośrednio do klientów bez planów.</p>
          <Link href="/admin/plans/new" className="text-amber-400 hover:text-amber-300 text-sm font-medium transition-colors">
            Utwórz pierwszy plan →
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {plans.map(p => (
            <Link
              key={p.id}
              href={`/admin/plans/${p.id}`}
              className="bg-slate-900 border border-slate-800 rounded-xl p-6 hover:border-slate-700 transition-colors"
            >
              <div className="flex items-start justify-between mb-3">
                <h2 className="font-semibold text-white">{p.name}</h2>
                <span className={`text-xs px-2 py-0.5 rounded-full ${
                  p.isActive ? 'bg-green-500/10 text-green-400' : 'bg-slate-800 text-slate-500'
                }`}>
                  {p.isActive ? 'Aktywny' : 'Nieaktywny'}
                </span>
              </div>
              {p.description && <p className="text-sm text-slate-400 mb-4">{p.description}</p>}
              <div className="flex items-end justify-between">
                <span className="text-2xl font-bold text-amber-400">
                  {Number(p.basePrice).toFixed(2)} PLN
                </span>
                <span className="text-xs text-slate-500">{p._count.planFeatures} feature&apos;ów</span>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
