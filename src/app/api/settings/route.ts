import { NextResponse, type NextRequest } from 'next/server';
import { prisma } from '@/lib/db';
import { DEFAULT_SETTINGS } from '@/config/settings';
import { resolveVisualSettings } from '@/config/visual-settings';
import { buildClientSettings } from '@/features/admin/utils/buildClientSettings';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  const apiKey = req.nextUrl.searchParams.get('apiKey');
  const globalSettings = await prisma.globalSettings.findUnique({ where: { id: 'default' } });

  // No apiKey → return default settings (demo / marketing mode)
  if (!apiKey) {
    return NextResponse.json({
      ...DEFAULT_SETTINGS,
      visual: resolveVisualSettings(globalSettings?.visualSettings),
    }, {
      headers: { 'Cache-Control': 'public, max-age=600' },
    });
  }

  const client = await prisma.client.findUnique({
    where: { apiKey },
    include: {
      clientFeatures: {
        where:   { enabled: true },
        include: { feature: true },
      },
    },
  });

  if (!client) {
    return NextResponse.json({ error: 'Invalid API key' }, { status: 401 });
  }

  if (!client.isActive) {
    return NextResponse.json({ error: 'Account inactive' }, { status: 403 });
  }

  // Log access (fire-and-forget, don't block response)
  const ip = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ?? undefined;
  prisma.apiKeyLog.create({
    data: { clientId: client.id, ip, userAgent: req.headers.get('user-agent') ?? undefined },
  }).catch(() => {});

  const enabledFeatures = client.clientFeatures.map(cf => cf.feature);
  const settings = buildClientSettings(client.name, client.id, enabledFeatures);
  const visual = resolveVisualSettings(globalSettings?.visualSettings, client.visualSettings);

  return NextResponse.json({ ...settings, visual }, {
    headers: { 'Cache-Control': 'private, max-age=300' },
  });
}
