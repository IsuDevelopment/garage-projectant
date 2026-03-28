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

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  if (!await assertSuperAdmin()) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { id } = await params;
  const client = await prisma.client.findUnique({ where: { id }, select: { id: true, visualSettings: true } });
  if (!client) return NextResponse.json({ error: 'Not found' }, { status: 404 });

  return NextResponse.json(client);
}

export async function PUT(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  if (!await assertSuperAdmin()) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { id } = await params;
  const body = await req.json();
  const visualSettings = body.visualSettings;

  if (visualSettings !== null) {
    const parsed = safeParseVisualSettings(visualSettings);
    if (!parsed.success) {
      return NextResponse.json({ error: 'Nieprawidłowe ustawienia wizualne', details: parsed.error.format() }, { status: 400 });
    }
  }

  const client = await prisma.client.update({
    where: { id },
    data: { visualSettings },
    select: { id: true, visualSettings: true },
  });

  return NextResponse.json(client);
}