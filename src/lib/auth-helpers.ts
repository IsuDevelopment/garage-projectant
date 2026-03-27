import { auth } from '@/lib/auth';
import { redirect } from 'next/navigation';
import type { Role } from '@prisma/client';

/** Server-side helper: get current session user or redirect to login */
export async function requireAuth() {
  const session = await auth();
  if (!session?.user) redirect('/login');
  return session.user;
}

/** Server-side helper: guard a route to a specific role */
export async function requireRole(role: Role) {
  const user = await requireAuth();
  const userRole = (user as { role?: string }).role;
  if (userRole !== role) redirect('/');
  return user;
}
