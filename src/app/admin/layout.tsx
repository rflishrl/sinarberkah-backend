import { redirect } from "next/navigation";

import { AdminShell } from "@/components/admin/admin-shell";
import { getSession } from "@/lib/auth";

// Halaman admin bergantung pada cookie sesi, jadi tidak boleh dibuat statis.
export const dynamic = "force-dynamic";

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getSession();
  if (!session) redirect("/login");

  return <AdminShell email={session.email}>{children}</AdminShell>;
}
