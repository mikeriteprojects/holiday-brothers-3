"use client";

import { useCallback, useEffect, useState } from "react";
import { useAdminGuard } from "@/components/admin/use-admin-guard";
import { AdminTable } from "@/components/admin/admin-table";
import { get, post } from "@/lib/backend";

type Vendor = {
  vendor_id: string;
  account_id: string;
  category: string;
  service_area: string;
  status: string;
  tier: string;
};

const TIERS = ["Tier 1", "Tier 2", "Tier 3"];

export default function AdminVendorsPage() {
  const { session, ready } = useAdminGuard();
  const [rows, setRows] = useState<Vendor[]>([]);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    const res = await get<{ rows: Vendor[] }>("admin_vendors");
    if (res.ok) setRows(res.rows);
    else setError(res.error);
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  async function approve(vendorId: string) {
    if (!session) return;
    await post("approveVendor", { account_id: session.account_id, vendor_id: vendorId });
    load();
  }

  async function setTier(vendorId: string, tier: string) {
    if (!session) return;
    await post("decideVendorTier", { account_id: session.account_id, vendor_id: vendorId, tier });
    load();
  }

  if (!ready || !session) return null;

  return (
    <div>
      <p className="text-eyebrow">Admin</p>
      <h1 className="text-display-lg mt-2 text-foreground">Vendors</h1>
      {error && <p className="mt-4 text-sm text-primary">{error}</p>}
      <AdminTable
        rows={rows}
        columns={[
          { key: "vendor_id", label: "Vendor" },
          { key: "category", label: "Category" },
          { key: "service_area", label: "Area" },
          { key: "status", label: "Status" },
        ]}
        renderActions={(row) => (
          <div className="flex items-center justify-end gap-2">
            <select
              value={row.tier}
              onChange={(e) => setTier(row.vendor_id, e.target.value)}
              className="rounded-md border border-border bg-card px-2 py-1 text-xs"
            >
              {TIERS.map((t) => (
                <option key={t} value={t}>
                  {t}
                </option>
              ))}
            </select>
            {row.status !== "Approved" && (
              <button
                type="button"
                onClick={() => approve(row.vendor_id)}
                className="hover-wiggle rounded-full bg-primary px-3 py-1 text-xs font-semibold text-primary-foreground"
              >
                Approve
              </button>
            )}
          </div>
        )}
        emptyLabel="No vendors yet."
      />
    </div>
  );
}
