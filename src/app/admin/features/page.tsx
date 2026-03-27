import { prisma } from '@/lib/db';

const CATEGORY_LABELS: Record<string, string> = {
  MATERIAL:     'Materiały',
  ROOF:         'Typy dachu',
  GATE:         'Bramy',
  CONSTRUCTION: 'Konstrukcja',
  ADVANCED:     'Zaawansowane',
};

export default async function FeaturesPage() {
  const features = await prisma.feature.findMany({ orderBy: [{ category: 'asc' }, { sortOrder: 'asc' }] });

  const grouped: Record<string, typeof features> = {};
  for (const f of features) {
    if (!grouped[f.category]) grouped[f.category] = [];
    grouped[f.category].push(f);
  }

  return (
    <div className="p-8">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-white mb-1">Feature&apos;y</h1>
        <p className="text-slate-400">Master lista dostępnych opcji konfiguratora</p>
      </div>

      <div className="space-y-6">
        {Object.entries(CATEGORY_LABELS).map(([cat, label]) => {
          const catFeatures = grouped[cat];
          if (!catFeatures?.length) return null;
          return (
            <div key={cat} className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden">
              <div className="px-6 py-4 border-b border-slate-800 bg-slate-800/30">
                <h2 className="font-semibold text-white text-sm">{label}</h2>
              </div>
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-slate-500 text-xs uppercase border-b border-slate-800">
                    <th className="text-left px-6 py-3 font-medium">Key</th>
                    <th className="text-left px-6 py-3 font-medium">Nazwa</th>
                    <th className="text-left px-6 py-3 font-medium">Domyślny</th>
                    <th className="text-left px-6 py-3 font-medium">Kolejność</th>
                  </tr>
                </thead>
                <tbody>
                  {catFeatures.map(f => (
                    <tr key={f.id} className="border-b border-slate-800/50">
                      <td className="px-6 py-3">
                        <code className="text-amber-400 text-xs font-mono">{f.key}</code>
                      </td>
                      <td className="px-6 py-3 text-slate-300">{f.name}</td>
                      <td className="px-6 py-3">
                        {f.isDefault ? (
                          <span className="text-xs text-green-400 bg-green-500/10 px-2 py-0.5 rounded-full">Tak</span>
                        ) : (
                          <span className="text-xs text-slate-600">Nie</span>
                        )}
                      </td>
                      <td className="px-6 py-3 text-slate-500">{f.sortOrder}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          );
        })}
      </div>
    </div>
  );
}
