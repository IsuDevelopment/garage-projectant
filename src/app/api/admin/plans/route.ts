import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/db';
import { z } from 'zod';

const schema = z.object({
  name:        z.string().min(2).max(100),
  description: z.string().optional(),
  basePrice:   z.number().min(0),
  isActive:    z.boolean().optional().default(true),
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
  const plans = await prisma.subscriptionPlan.findMany({
    orderBy: { sortOrder: 'asc' },
    include: { planFeatures: { include: { feature: true } } },
  });
  return NextResponse.json(plans);
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

  const plan = await prisma.subscriptionPlan.create({ data: parsed.data });
  return NextResponse.json(plan, { status: 201 });
}
