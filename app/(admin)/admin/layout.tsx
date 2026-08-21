import { getSession } from "@/lib/auth/getSession";
import { AdminNav } from "./components/AdminNav";

// IMPORTANT: /admin/login is a child segment of /admin (see file tree —
// there is no route-group trick separating them), so this layout wraps it
// too. It deliberately does NOT redirect unauthenticated visitors: doing
// so here would redirect /admin/login to /admin/login and loop forever.
// Middleware already keeps /admin/login reachable without a session (see
// middleware.ts ADMIN_PUBLIC_PATHS), and every protected page under this
// layout (starting with admin/page.tsx in Phase 1) does its own
// authorization check and redirect — that remains the real boundary, per
// the existing comment there. This layout's only job is chrome: show the
// sidebar when there is a session to show it for, render children bare
// when there is not (i.e. on the login page itself).
export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getSession();
  const isAuthenticatedAdmin = session?.accountType === "ADMIN";

  if (!isAuthenticatedAdmin) {
    return <>{children}</>;
  }

  return (
    <div className="flex min-h-screen bg-page-bg">
      <AdminNav />
      <div className="flex-1 lg:pl-64">
        <main className="p-6 lg:p-10">{children}</main>
      </div>
    </div>
  );
}
