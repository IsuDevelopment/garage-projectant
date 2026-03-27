import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/db';
import { z } from 'zod';

const schema = z.object({
  featureId:   z.string(),
  enabled:     z.boolean().optional(),
  customPrice: z.number().nullable().optional(),
});

async function assertSuperAdmin() {
  const session = await auth();
  const role = (session?.user as { role?: string } | undefined)?.role;
  if (role !== 'SUPER_ADMIN') return null;
  return session;
}

export async function PUT(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  if (!await assertSuperAdmin()) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { id: clientId } = await params;
  const body = await req.json();
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: 'Dane nieprawidłowe' }, { status: 400 });
  }

  const { featureId, enabled, customPrice } = parsed.data;

  const data: Record<string, unknown> = {};
  if (enabled !== undefined)     data.enabled     = enabled;
  if (customPrice !== undefined) data.customPrice = customPrice;

  const cf = await prisma.clientFeature.upsert({
    where:  { clientId_featureId: { clientId, featureId } },
    update: data,
    create: { clientId, featureId, enabled: enabled ?? false, customPrice: customPrice ?? null },
  });

  return NextResponse.json(cf);
}
