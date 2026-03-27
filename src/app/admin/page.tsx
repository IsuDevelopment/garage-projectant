import { prisma } from '@/lib/db';
import Link from 'next/link';

export default async function AdminDashboard() {
  const [clientCount, featureCount, planCount, activeClients] = await Promise.all([
    prisma.client.count(),
    prisma.feature.count(),
    prisma.subscriptionPlan.count(),
    prisma.client.count({ where: { isActive: true } }),
  ]);

  const recentClients = await prisma.client.findMany({
    orderBy: { createdAt: 'desc' },
    take: 5,
    select: { id: true, name: true, isActive: true, createdAt: true, apiKey: true },
  });

  const stats = [
    { label: 'Klientów ogółem',  value: clientCount,   href: '/admin/clients',  color: 'text-amber-400' },
    { label: 'Aktywni klienci',  value: activeClients,  href: '/admin/clients',  color: 'text-green-400' },
    { label: 'Feature\'y',       value: featureCount,   href: '/admin/features', color: 'text-blue-400'  },
    { label: 'Plany subskrypcji',value: planCount,       href: '/admin/plans',    color: 'text-purple-400'},
  ];

  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold text-white mb-2">Dashboard</h1>
      <p className="text-slate-400 mb-8">Przegląd systemu</p>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-10">
        {stats.map(s => (
          <Link key={s.label} href={s.href}
            className="bg-slate-900 border border-slate-800 rounded-xl p-5 hover:border-slate-700 transition-colors">
            <p className="text-sm text-slate-400 mb-1">{s.label}</p>
            <p className={`text-3xl font-bold ${s.color}`}>{s.value}</p>
          </Link>
        ))}
      </div>

      {/* Recent clients */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl">
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800">
          <h2 className="font-semibold text-white">Ostatni klienci</h2>
          <Link href="/admin/clients" className="text-sm text-amber-400 hover:text-amber-300 transition-colors">
            Wszyscy →
          </Link>
        </div>
        {recentClients.length === 0 ? (
          <p className="text-slate-400 text-sm p-6">Brak klientów. <Link href="/admin/clients" className="text-amber-400 hover:underline">Dodaj pierwszego →</Link></p>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="text-slate-500 text-xs uppercase border-b border-slate-800">
                <th className="text-left px-6 py-3 font-medium">Nazwa</th>
                <th className="text-left px-6 py-3 font-medium">API Key</th>
                <th className="text-left px-6 py-3 font-medium">Status</th>
                <th className="text-left px-6 py-3 font-medium">Data</th>
              </tr>
            </thead>
            <tbody>
              {recentClients.map(c => (
                <tr key={c.id} className="border-b border-slate-800/50 hover:bg-slate-800/30 transition-colors">
                  <td className="px-6 py-3">
                    <Link href={`/admin/clients/${c.id}`} className="text-white hover:text-amber-400 transition-colors font-medium">
                      {c.name}
                    </Link>
                  </td>
                  <td className="px-6 py-3">
                    <code className="text-slate-400 text-xs bg-slate-800 px-2 py-1 rounded">
                      {c.apiKey.slice(0, 14)}…
                    </code>
                  </td>
                  <td className="px-6 py-3">
                    <span className={`inline-flex items-center gap-1.5 text-xs px-2.5 py-1 rounded-full font-medium ${
                      c.isActive ? 'bg-green-500/10 text-green-400' : 'bg-slate-800 text-slate-500'
                    }`}>
                      <span className={`w-1.5 h-1.5 rounded-full ${c.isActive ? 'bg-green-400' : 'bg-slate-500'}`} />
                      {c.isActive ? 'Aktywny' : 'Nieaktywny'}
                    </span>
                  </td>
                  <td className="px-6 py-3 text-slate-500">
                    {c.createdAt.toLocaleDateString('pl-PL')}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
