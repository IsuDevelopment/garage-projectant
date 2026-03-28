import { prisma } from '@/lib/db';
import { VisualSettingsEditor } from '@/features/admin/components/VisualSettingsEditor';
import { getDefaultVisualSettings, resolveVisualSettings } from '@/config/visual-settings';

export default async function AdminSettingsPage() {
  const globalSettings = await prisma.globalSettings.findUnique({ where: { id: 'default' } });
  const visualSettings = resolveVisualSettings(globalSettings?.visualSettings);
  const defaults = getDefaultVisualSettings();
  const isCustomized = globalSettings?.visualSettings != null;

  return (
    <div className="p-4 md:p-8 space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white mb-1">Globalne ustawienia</h1>
        <p className="text-slate-400">Domyślne ustawienia wizualne dla wszystkich klientów i trybu demo.</p>
      </div>

      <VisualSettingsEditor
        title="Otoczenie sceny 3D"
        description="Zmiany zapisane tutaj staną się domyślnym wyglądem nieba, chmur i drzew dla całego systemu."
        endpoint="/api/admin/settings"
        initialSettings={visualSettings}
        resetLabel="Przywróć wartości z default-settings.json"
        inheritedHint={isCustomized ? undefined : `Aktualnie używany jest fallback z JSON: tło ${defaults.backgroundColor}, zenit ${defaults.sky.topColor}.`}
      />
    </div>
  );
}