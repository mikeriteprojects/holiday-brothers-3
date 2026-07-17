"use client";

import { useCallback, useEffect, useState } from "react";
import { useAdminGuard } from "@/components/admin/use-admin-guard";
import { AdminTable } from "@/components/admin/admin-table";
import { get, post } from "@/lib/backend";

type Account = {
  account_id: string;
  first_name: string;
  email: string;
  phone: string;
  roles_csv: string;
  crew_subtype: string;
  status: string;
};

export default function AdminCrewPage() {
  const { session, ready } = useAdminGuard();
  const [rows, setRows] = useState<Account[]>([]);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!session) return;
    const res = await get<{ rows: Account[] }>("admin_crew", { account_id: session.account_id });
    if (res.ok) setRows(res.rows.filter((r) => (r.roles_csv || "").includes("crew")));
    else setError(res.error);
  }, [session]);

  useEffect(() => {
    load();
  }, [load]);

  async function hire(applicantId: string) {
    if (!session) return;
    await post("hireWorker", { account_id: session.account_id, applicant_id: applicantId });
    load();
  }

  if (!ready || !session) return null;

  return (
    <div>
      <p className="text-eyebrow">Admin</p>
      <h1 className="text-display-lg mt-2 text-foreground">Crew & workers</h1>
      {error && <p className="mt-4 text-sm text-primary">{error}</p>}
      <AdminTable
        rows={rows}
        columns={[
          { key: "account_id", label: "Account" },
          { key: "first_name", label: "Name" },
          { key: "phone", label: "Phone" },
          { key: "crew_subtype", label: "Subtype" },
          { key: "status", label: "Status" },
        ]}
        renderActions={(row) =>
          row.status === "Submitted" ? (
            <button
              type="button"
              onClick={() => hire(row.account_id)}
              className="hover-wiggle rounded-full bg-primary px-3 py-1 text-xs font-semibold text-primary-foreground"
            >
              Hire
            </button>
          ) : null
        }
        emptyLabel="No crew applications yet."
      />
    </div>
  );
}
