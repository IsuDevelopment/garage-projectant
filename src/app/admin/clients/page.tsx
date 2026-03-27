import { prisma } from '@/lib/db';
import Link from 'next/link';

export default async function ClientsPage() {
  const clients = await prisma.client.findMany({
    orderBy: { createdAt: 'desc' },
    include: {
      _count: { select: { clientFeatures: { where: { enabled: true } } } },
    },
  });

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-white mb-1">Klienci</h1>
          <p className="text-slate-400">Zarządzaj dostępem i feature&apos;ami</p>
        </div>
        <Link
          href="/admin/clients/new"
          className="flex items-center gap-2 px-4 py-2.5 rounded-lg bg-amber-400 hover:bg-amber-300 text-slate-900 font-semibold text-sm transition-colors"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
          </svg>
          Nowy klient
        </Link>
      </div>

      {clients.length === 0 ? (
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-12 text-center">
          <p className="text-slate-400 mb-4">Brak klientów</p>
          <Link href="/admin/clients/new" className="text-amber-400 hover:text-amber-300 text-sm font-medium transition-colors">
            Dodaj pierwszego klienta →
          </Link>
        </div>
      ) : (
        <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-slate-500 text-xs uppercase border-b border-slate-800">
                <th className="text-left px-6 py-3 font-medium">Nazwa / Slug</th>
                <th className="text-left px-6 py-3 font-medium">API Key</th>
                <th className="text-left px-6 py-3 font-medium">Feature&apos;y</th>
                <th className="text-left px-6 py-3 font-medium">Status</th>
                <th className="text-left px-6 py-3 font-medium">Dodany</th>
                <th className="px-6 py-3" />
              </tr>
            </thead>
            <tbody>
              {clients.map(c => (
                <tr key={c.id} className="border-b border-slate-800/50 hover:bg-slate-800/30 transition-colors">
                  <td className="px-6 py-3">
                    <div>
                      <p className="font-medium text-white">{c.name}</p>
                      <p className="text-slate-500 text-xs mt-0.5">{c.slug}</p>
                    </div>
                  </td>
                  <td className="px-6 py-3">
                    <code className="text-slate-400 text-xs bg-slate-800 px-2 py-1 rounded">
                      {c.apiKey.slice(0, 16)}…
                    </code>
                  </td>
                  <td className="px-6 py-3 text-slate-300">
                    {c._count.clientFeatures} aktywnych
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
                  <td className="px-6 py-3 text-right">
                    <Link
                      href={`/admin/clients/${c.id}`}
                      className="text-xs text-slate-400 hover:text-amber-400 transition-colors"
                    >
                      Zarządzaj →
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
