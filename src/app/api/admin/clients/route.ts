import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/db';
import { z } from 'zod';

const schema = z.object({
  name:  z.string().min(2).max(100),
  slug:  z.string().min(2).max(60).regex(/^[a-z0-9-]+$/),
  notes: z.string().optional(),
});

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

  const clients = await prisma.client.findMany({
    orderBy: { createdAt: 'desc' },
    include: { _count: { select: { clientFeatures: { where: { enabled: true } } } } },
  });
  return NextResponse.json(clients);
}

export async function POST(req: Request) {
  if (!await assertSuperAdmin()) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const body = await req.json();
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: 'Dane nieprawidłowe', details: parsed.error.format() }, { status: 400 });
  }

  const { name, slug, notes } = parsed.data;

  const existing = await prisma.client.findUnique({ where: { slug } });
  if (existing) {
    return NextResponse.json({ error: 'Slug jest już zajęty' }, { status: 409 });
  }

  const client = await prisma.client.create({ data: { name, slug, notes } });
  return NextResponse.json(client, { status: 201 });
}
