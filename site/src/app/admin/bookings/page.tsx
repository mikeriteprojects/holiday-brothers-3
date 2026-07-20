"use client";

import { useCallback, useEffect, useState } from "react";
import { useAdminGuard } from "@/components/admin/use-admin-guard";
import { AdminTable } from "@/components/admin/admin-table";
import { get, post } from "@/lib/backend";

type Booking = {
  booking_code: string;
  account_id: string;
  size: string;
  sukkah_type: string;
  speed_tier: string;
  status: string;
  price_total: number;
  address: string;
};

const STATUS_CHAIN = [
  "Submitted Booking", "Price Pending", "Quote Sent", "Job Confirmed",
  "Scheduled", "In Progress", "Paid", "Pending Completion", "Completed",
];

export default function AdminBookingsPage() {
  const { session, ready } = useAdminGuard();
  const [rows, setRows] = useState<Booking[]>([]);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!session) return;
    const res = await get<{ rows: Booking[] }>("admin_leads", { account_id: session.account_id });
    if (res.ok) setRows(res.rows);
    else setError(res.error);
  }, [session]);

  useEffect(() => {
    load();
  }, [load]);

  async function updateStatus(bookingCode: string, status: string) {
    if (!session) return;
    await post("updateStatus", {
      account_id: session.account_id,
      table: "Bookings",
      key_value: bookingCode,
      status,
    });
    load();
  }

  async function remove(bookingCode: string) {
    if (!session) return;
    await post("deleteLead", { account_id: session.account_id, booking_code: bookingCode });
    load();
  }

  if (!ready || !session) return null;

  return (
    <div>
      <p className="text-eyebrow">Admin</p>
      <h1 className="text-display-lg mt-2 text-foreground">Bookings</h1>
      {error && <p className="mt-4 text-sm text-primary">{error}</p>}
      <AdminTable
        rows={rows}
        columns={[
          { key: "booking_code", label: "Code" },
          { key: "size", label: "Size" },
          { key: "sukkah_type", label: "Type" },
          { key: "speed_tier", label: "Speed" },
          { key: "status", label: "Status" },
          { key: "price_total", label: "Total", money: true },
        ]}
        renderActions={(row) => (
          <div className="flex justify-end gap-2">
            <select
              value={row.status}
              onChange={(e) => updateStatus(row.booking_code, e.target.value)}
              className="rounded-md border border-border bg-card px-2 py-1 text-xs"
            >
              {STATUS_CHAIN.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
              <option value="Cancelled">Cancelled</option>
              <option value="Weather Hold">Weather Hold</option>
            </select>
            <button
              type="button"
              onClick={() => remove(row.booking_code)}
              className="text-xs text-muted-foreground hover:text-primary"
            >
              Delete
            </button>
          </div>
        )}
        emptyLabel="No bookings yet."
      />
    </div>
  );
}
