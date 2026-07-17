"use client";

import { useSession } from "@/lib/session";
import { AdminNav } from "@/components/admin/admin-nav";

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const { session, loaded } = useSession();
  const isAdmin = loaded && !!session?.permissions;

  return (
    <div>
      {isAdmin && <AdminNav />}
      <div className="mx-auto max-w-6xl px-6 py-10">{children}</div>
    </div>
  );
}
