import AdminShell from "@/components/admin/AdminShell";
import { assertAdminSession } from "@/lib/auth";

export const dynamic = "force-dynamic";

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  await assertAdminSession();
  return <AdminShell>{children}</AdminShell>;
}