"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useSession, type Session } from "@/lib/session";

// Every /admin/<section> page calls this — redirects to /admin (the login
// gate) if there's no session or the session wasn't issued by adminLogin
// (which is the only action that returns a `permissions` map).
export function useAdminGuard(): { session: Session | null; ready: boolean } {
  const { session, loaded } = useSession();
  const router = useRouter();

  useEffect(() => {
    if (loaded && (!session || !session.permissions)) router.push("/admin");
  }, [loaded, session, router]);

  return { session: session?.permissions ? session : null, ready: loaded };
}
