import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/db';
import { z } from 'zod';

const updateSchema = z.object({
  name:        z.string().min(2).max(100).optional(),
  description: z.string().optional(),
  basePrice:   z.number().min(0).optional(),
  isActive:    z.boolean().optional(),
  featureIds:  z.array(z.string()).optional(), // full replace of plan features
});

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
  const plan = await prisma.subscriptionPlan.findUnique({
    where: { id },
    include: { planFeatures: { include: { feature: true } } },
  });
  if (!plan) return NextResponse.json({ error: 'Not found' }, { status: 404 });
  return NextResponse.json(plan);
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
  const parsed = updateSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: 'Dane nieprawidłowe' }, { status: 400 });
  }

  const { featureIds, ...planData } = parsed.data;

  const plan = await prisma.$transaction(async (tx) => {
    const updated = await tx.subscriptionPlan.update({ where: { id }, data: planData });

    if (featureIds !== undefined) {
      await tx.planFeature.deleteMany({ where: { planId: id } });
      if (featureIds.length > 0) {
        await tx.planFeature.createMany({
          data: featureIds.map(featureId => ({ planId: id, featureId })),
        });
      }
    }

    return updated;
  });

  return NextResponse.json(plan);
}

export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  if (!await assertSuperAdmin()) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  const { id } = await params;
  await prisma.subscriptionPlan.delete({ where: { id } });
  return new NextResponse(null, { status: 204 });
}
