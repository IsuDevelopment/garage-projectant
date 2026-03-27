import { requireRole } from '@/lib/auth-helpers';
import { AdminSidebar } from '@/features/admin/components/AdminSidebar';

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  await requireRole('SUPER_ADMIN');

  return (
    <div className="flex min-h-dvh bg-slate-950 text-white">
      <AdminSidebar />
      <main className="flex-1 flex flex-col min-w-0 overflow-x-hidden">
        {children}
      </main>
    </div>
  );
}
