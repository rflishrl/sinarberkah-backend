import { createFileRoute, Outlet, redirect } from "@tanstack/react-router";

import { AdminShell } from "@/components/admin-kit/admin-shell";
import { getAdminServerFn } from "@/features/auth/server-fns";

export const Route = createFileRoute("/admin")({
  beforeLoad: async () => {
    const admin = await getAdminServerFn();
    if (!admin) {
      throw redirect({ to: "/login" });
    }
    return { admin };
  },
  component: AdminLayoutComponent,
});

function AdminLayoutComponent() {
  const { admin } = Route.useRouteContext();
  return (
    <AdminShell email={admin.email}>
      <Outlet />
    </AdminShell>
  );
}
