"use client";

import { useCallback, useEffect, useState } from "react";
import { useAdminGuard } from "@/components/admin/use-admin-guard";
import { AdminTable } from "@/components/admin/admin-table";
import { get, post } from "@/lib/backend";

type Job = {
  job_id: string;
  booking_code: string;
  job_type: string;
  date: string;
  tier: string;
  status: string;
  total_cost: number;
};

const METHOD_TOKENS: Record<string, string> = {
  build: "var(--method-construction)",
};

export default function AdminJobsPage() {
  const { session, ready } = useAdminGuard();
  const [rows, setRows] = useState<Job[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [form, setForm] = useState({ booking_code: "", job_type: "build", date: "", tier: "regular", total_cost: "" });

  const load = useCallback(async () => {
    if (!session) return;
    const res = await get<{ rows: Job[] }>("admin_jobs", { account_id: session.account_id });
    if (res.ok) setRows(res.rows);
    else setError(res.error);
  }, [session]);

  useEffect(() => {
    load();
  }, [load]);

  async function createJob(e: React.FormEvent) {
    e.preventDefault();
    if (!session) return;
    await post("createJob", {
      account_id: session.account_id,
      booking_code: form.booking_code,
      job_type: form.job_type,
      date: form.date,
      tier: form.tier,
      total_cost: Number(form.total_cost) || 0,
    });
    setForm({ booking_code: "", job_type: "build", date: "", tier: "regular", total_cost: "" });
    load();
  }

  if (!ready || !session) return null;

  return (
    <div>
      <p className="text-eyebrow">Admin</p>
      <h1 className="text-display-lg mt-2 text-foreground">Jobs</h1>
      {error && <p className="mt-4 text-sm text-primary">{error}</p>}

      <form onSubmit={createJob} className="mt-6 grid gap-3 rounded-xl border border-border bg-card p-5 sm:grid-cols-5">
        <input
          required
          value={form.booking_code}
          onChange={(e) => setForm((f) => ({ ...f, booking_code: e.target.value }))}
          placeholder="Booking code"
          className="rounded-md border border-border bg-background px-3 py-2 text-sm"
        />
        <input
          value={form.date}
          type="date"
          onChange={(e) => setForm((f) => ({ ...f, date: e.target.value }))}
          className="rounded-md border border-border bg-background px-3 py-2 text-sm"
        />
        <input
          value={form.tier}
          onChange={(e) => setForm((f) => ({ ...f, tier: e.target.value }))}
          placeholder="Tier"
          className="rounded-md border border-border bg-background px-3 py-2 text-sm"
        />
        <input
          value={form.total_cost}
          onChange={(e) => setForm((f) => ({ ...f, total_cost: e.target.value }))}
          placeholder="Total cost"
          className="rounded-md border border-border bg-background px-3 py-2 text-sm"
        />
        <button
          type="submit"
          className="hover-wiggle rounded-full bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground"
        >
          Create job
        </button>
      </form>

      <AdminTable
        rows={rows}
        columns={[
          { key: "job_id", label: "Job" },
          { key: "booking_code", label: "Booking" },
          { key: "job_type", label: "Type" },
          { key: "date", label: "Date" },
          { key: "status", label: "Status" },
          { key: "total_cost", label: "Cost" },
        ]}
        emptyLabel="No jobs yet."
      />
      <p className="mt-2 text-xs text-muted-foreground">
        <span
          className="mr-1 inline-block h-2 w-2 rounded-full align-middle"
          style={{ backgroundColor: METHOD_TOKENS.build }}
        />
        Construction-method color tokens carry over from the booking flow — matched here for job
        listings.
      </p>
    </div>
  );
}
