"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { getWorkerDashboard } from "@/lib/backend";

// Always-visible points indicator (Priority points, the currency every
// account accrues from booking/job activity) — clicking goes to the full
// breakdown in /worker-portal, where all five currencies are shown.
export function PointsBadge({ accountId }: { accountId: string }) {
  const [points, setPoints] = useState<number | null>(null);

  useEffect(() => {
    let cancelled = false;
    getWorkerDashboard(accountId)
      .then((res) => {
        if (!cancelled && res.ok) setPoints(res.balances?.Priority ?? 0);
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, [accountId]);

  if (points === null) return null;

  return (
    <Link
      href="/worker-portal"
      className="flex items-center gap-1.5 rounded-full border border-border bg-secondary px-3 py-1.5 text-sm font-semibold text-foreground transition-colors hover:border-primary"
      style={{ fontFamily: "var(--font-mono)" }}
      title="Priority points — see all balances in My Portal"
    >
      <span aria-hidden>✦</span>
      {points}
    </Link>
  );
}
