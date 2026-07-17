"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useSession } from "@/lib/session";
import { getWorkerDashboard } from "@/lib/backend";

type Dashboard = {
  worker: Record<string, unknown>;
  balances: Record<string, number>;
  current_jobs: Record<string, unknown>[];
  past_jobs: Record<string, unknown>[];
  rewards: Record<string, unknown>[];
  redemptions: Record<string, unknown>[];
};

const CURRENCY_LABELS: Record<string, string> = {
  Priority: "Priority",
  Incentive: "Incentive",
  Referral: "Referral",
  Vendor: "Vendor",
  Shop: "Shop",
};

export default function WorkerPortalPage() {
  const { session, loaded } = useSession();
  const router = useRouter();
  const [dashboard, setDashboard] = useState<Dashboard | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (loaded && !session) router.push("/worker-login");
  }, [loaded, session, router]);

  useEffect(() => {
    if (!session) return;
    getWorkerDashboard(session.account_id)
      .then((res) => {
        if (res.ok) setDashboard(res as unknown as Dashboard);
        else setError(res.error);
      })
      .catch(() => setError("Couldn't load your dashboard. Try refreshing."));
  }, [session]);

  if (!loaded || !session) return null;

  const roles = session.roles || "";
  const isCrew = roles.includes("crew");
  const isCustomer = roles.includes("client");

  return (
    <div className="mx-auto max-w-4xl px-6 py-16">
      <p className="text-eyebrow">Your portal</p>
      <h1 className="text-display-lg mt-2 text-foreground">Welcome back.</h1>

      {error && (
        <p className="mt-4 rounded-lg border-l-2 border-primary bg-primary/5 px-4 py-3 text-sm text-foreground">
          {error}
        </p>
      )}

      {!dashboard && !error && <p className="mt-6 text-muted-foreground">Loading…</p>}

      {dashboard && (
        <div className="mt-10 space-y-10">
          <section>
            <p className="text-eyebrow">Points balance</p>
            <div className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-5">
              {Object.entries(CURRENCY_LABELS).map(([key, label]) => (
                <div key={key} className="rounded-xl border border-border bg-card p-4 text-center">
                  <p className="text-2xl font-display text-foreground">
                    {dashboard.balances[key] ?? 0}
                  </p>
                  <p className="mt-1 text-xs text-muted-foreground">{label}</p>
                </div>
              ))}
            </div>
          </section>

          {isCrew && (
            <section>
              <p className="text-eyebrow">Jobs</p>
              <div className="mt-3 space-y-2">
                {dashboard.current_jobs.length === 0 && dashboard.past_jobs.length === 0 ? (
                  <p className="text-sm text-muted-foreground">No jobs assigned yet.</p>
                ) : (
                  [...dashboard.current_jobs, ...dashboard.past_jobs].map((job, i) => (
                    <div key={i} className="rounded-lg border border-border bg-card p-4 text-sm">
                      <p className="font-medium text-foreground">
                        {String(job.job_type)} · {String(job.status)}
                      </p>
                      <p className="text-muted-foreground">{String(job.date)}</p>
                    </div>
                  ))
                )}
              </div>
              <Link
                href="/worker-portal"
                className="mt-3 inline-block text-sm text-primary underline"
              >
                Browse open jobs
              </Link>
            </section>
          )}

          {isCustomer && (
            <section>
              <p className="text-eyebrow">Your bookings</p>
              <p className="mt-3 text-sm text-muted-foreground">
                Booking history isn&apos;t shown in-portal yet — use{" "}
                <Link href="/booking/track" className="text-primary underline">
                  track my booking
                </Link>{" "}
                with your booking code to check status.
              </p>
            </section>
          )}

          <section>
            <p className="text-eyebrow">Rewards</p>
            {dashboard.rewards.length === 0 ? (
              <p className="mt-3 text-sm text-muted-foreground">No rewards available right now.</p>
            ) : (
              <div className="mt-3 grid gap-3 sm:grid-cols-2">
                {dashboard.rewards.map((r, i) => (
                  <div key={i} className="rounded-lg border border-border bg-card p-4">
                    <p className="font-medium text-foreground">{String(r.label)}</p>
                  </div>
                ))}
              </div>
            )}
          </section>

          <section>
            <p className="text-eyebrow">Redemption history</p>
            {dashboard.redemptions.length === 0 ? (
              <p className="mt-3 text-sm text-muted-foreground">No redemptions yet.</p>
            ) : (
              <div className="mt-3 space-y-2">
                {dashboard.redemptions.map((r, i) => (
                  <div key={i} className="rounded-lg border border-border bg-card p-4 text-sm">
                    <p className="text-foreground">
                      {String(r.reward_id)} · {String(r.status)}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </section>
        </div>
      )}
    </div>
  );
}
