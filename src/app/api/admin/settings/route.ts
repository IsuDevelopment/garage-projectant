import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/db';
import { safeParseVisualSettings } from '@/config/visual-settings';

async function assertSuperAdmin() {
  const session = await auth();
  const role = (session?.user as { role?: string } | undefined)?.role;
  if (role !== 'SUPER_ADMIN') return null;
  return session;
}

export async function GET() {
  if (!await assertSuperAdmin()) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const settings = await prisma.globalSettings.findUnique({ where: { id: 'default' } });
  return NextResponse.json(settings);
}

export async function PUT(req: Request) {
  if (!await assertSuperAdmin()) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const body = await req.json();
  const visualSettings = body.visualSettings;

  if (visualSettings !== null) {
    const parsed = safeParseVisualSettings(visualSettings);
    if (!parsed.success) {
      return NextResponse.json({ error: 'Nieprawidłowe ustawienia wizualne', details: parsed.error.format() }, { status: 400 });
    }
  }

  const settings = await prisma.globalSettings.upsert({
    where: { id: 'default' },
    update: { visualSettings },
    create: { id: 'default', visualSettings },
  });

  return NextResponse.json(settings);
}