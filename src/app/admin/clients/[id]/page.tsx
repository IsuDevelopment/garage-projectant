import { prisma } from '@/lib/db';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import { CopyButton } from '@/features/admin/components/CopyButton';
import { FeatureToggleGrid } from '@/features/admin/components/FeatureToggleGrid';

export default async function ClientDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  const client = await prisma.client.findUnique({
    where: { id },
    include: { clientFeatures: { include: { feature: true } } },
  });
  if (!client) notFound();

  // Get all features and merge with client-specific state
  const allFeatures = await prisma.feature.findMany({ orderBy: { sortOrder: 'asc' } });
  const clientFeatureMap = new Map(client.clientFeatures.map(cf => [cf.featureId, cf]));
  const featuresWithState = allFeatures.map(f => {
    const cf = clientFeatureMap.get(f.id);
    return {
      ...f,
      clientFeature: cf
        ? { ...cf, customPrice: cf.customPrice != null ? cf.customPrice.toNumber() : null }
        : null,
    };
  });

  const enabledCount = client.clientFeatures.filter(cf => cf.enabled).length;
  const previewUrl = `${process.env.NEXTAUTH_URL ?? 'http://localhost:3000'}/?key=${client.apiKey}`;

  return (
    <div className="p-4 md:p-8">
      {/* Header */}
      <div className="flex flex-wrap items-start justify-between gap-4 mb-8">
        <div>
          <div className="flex items-center gap-2 text-sm text-slate-400 mb-2">
            <Link href="/admin/clients" className="hover:text-white transition-colors">Klienci</Link>
            <span>/</span>
            <span className="text-white">{client.name}</span>
          </div>
          <h1 className="text-2xl font-bold text-white mb-1">{client.name}</h1>
          <p className="text-slate-400 text-sm">
            <span className="font-mono text-slate-500">{client.slug}</span>
            {' · '}
            <span className={client.isActive ? 'text-green-400' : 'text-slate-500'}>
              {client.isActive ? 'Aktywny' : 'Nieaktywny'}
            </span>
            {' · '}
            {enabledCount} feature&apos;y włączone
          </p>
        </div>
        <a
          href={previewUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-2 px-4 py-2.5 rounded-lg border border-slate-700 text-slate-300 hover:border-amber-400 hover:text-amber-400 text-sm transition-colors"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
          </svg>
          Podgląd konfiguratora
        </a>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        {/* Feature toggles — main column */}
        <div className="xl:col-span-2 bg-slate-900 border border-slate-800 rounded-xl p-4 md:p-6">
          <h2 className="font-semibold text-white mb-5">Feature&apos;y konfiguratora</h2>
          <FeatureToggleGrid clientId={client.id} features={featuresWithState} />
        </div>

        {/* Side info */}
        <div className="space-y-4">
          {/* API Key */}
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-5">
            <h3 className="font-semibold text-white mb-3">API Key</h3>
            <code className="block text-xs text-slate-300 bg-slate-800 px-3 py-2.5 rounded-lg break-all mb-3 font-mono">
              {client.apiKey}
            </code>
            <div className="flex gap-2">
              <CopyButton value={client.apiKey} />
              <CopyButton value={previewUrl} className="flex-1 justify-center" />
            </div>
            <p className="text-xs text-slate-500 mt-3">
              Link konfiguratora: <code className="text-slate-400">/?key=…</code>
            </p>
          </div>

          {/* Client info */}
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-5">
            <h3 className="font-semibold text-white mb-3">Informacje</h3>
            <dl className="space-y-2 text-sm">
              <div className="flex justify-between">
                <dt className="text-slate-400">Slug</dt>
                <dd className="text-slate-300 font-mono">{client.slug}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-slate-400">Dodany</dt>
                <dd className="text-slate-300">{client.createdAt.toLocaleDateString('pl-PL')}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-slate-400">Zaktualizowany</dt>
                <dd className="text-slate-300">{client.updatedAt.toLocaleDateString('pl-PL')}</dd>
              </div>
            </dl>
            {client.notes && (
              <p className="text-slate-400 text-xs mt-3 pt-3 border-t border-slate-800">{client.notes}</p>
            )}
          </div>

          {/* Quick actions */}
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-5">
            <h3 className="font-semibold text-white mb-3">Akcje</h3>
            <div className="space-y-2">
              <ToggleActiveButton clientId={client.id} isActive={client.isActive} />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// Inline client component for active toggle
function ToggleActiveButton({ clientId, isActive }: { clientId: string; isActive: boolean }) {
  return (
    <form action={async () => {
      'use server';
      await prisma.client.update({ where: { id: clientId }, data: { isActive: !isActive } });
    }}>
      <button
        type="submit"
        className={`w-full py-2 px-3 rounded-lg text-sm font-medium transition-colors ${
          isActive
            ? 'border border-red-500/30 text-red-400 hover:bg-red-500/10'
            : 'border border-green-500/30 text-green-400 hover:bg-green-500/10'
        }`}
      >
        {isActive ? 'Dezaktywuj klienta' : 'Aktywuj klienta'}
      </button>
    </form>
  );
}
