"use client";

import { useCallback, useEffect, useState } from "react";
import { useAdminGuard } from "@/components/admin/use-admin-guard";
import { AdminTable } from "@/components/admin/admin-table";
import { get, post } from "@/lib/backend";

type Reward = { reward_id: string; label: string; active: string; cost_shop_points: number };
type Redemption = { redemption_id: string; account_id: string; reward_id: string; status: string };

export default function AdminRewardsPage() {
  const { session, ready } = useAdminGuard();
  const [rewards, setRewards] = useState<Reward[]>([]);
  const [redemptions, setRedemptions] = useState<Redemption[]>([]);
  const [label, setLabel] = useState("");

  const load = useCallback(async () => {
    if (!session) return;
    const [r1, r2] = await Promise.all([
      get<{ rows: Reward[] }>("admin_rewards", { account_id: session.account_id }),
      get<{ rows: Redemption[] }>("admin_redemptions", { account_id: session.account_id }),
    ]);
    if (r1.ok) setRewards(r1.rows);
    if (r2.ok) setRedemptions(r2.rows);
  }, [session]);

  useEffect(() => {
    load();
  }, [load]);

  async function createReward(e: React.FormEvent) {
    e.preventDefault();
    if (!session) return;
    await post("createReward", { account_id: session.account_id, label });
    setLabel("");
    load();
  }

  async function fulfill(redemptionId: string) {
    if (!session) return;
    await post("fulfillRedemption", { account_id: session.account_id, redemption_id: redemptionId });
    load();
  }

  if (!ready || !session) return null;

  return (
    <div className="space-y-10">
      <div>
        <p className="text-eyebrow">Admin</p>
        <h1 className="text-display-lg mt-2 text-foreground">Rewards & points</h1>
      </div>

      <section>
        <p className="text-eyebrow">Reward catalog</p>
        <form onSubmit={createReward} className="mt-3 flex gap-2">
          <input
            required
            value={label}
            onChange={(e) => setLabel(e.target.value)}
            placeholder="New reward label"
            className="flex-1 rounded-md border border-border bg-card px-3 py-2 text-sm"
          />
          <button type="submit" className="hover-wiggle rounded-md bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground">
            Add
          </button>
        </form>
        <AdminTable
          rows={rewards}
          columns={[
            { key: "reward_id", label: "Reward" },
            { key: "label", label: "Label" },
            { key: "active", label: "Active" },
          ]}
          emptyLabel="No rewards yet."
        />
      </section>

      <section>
        <p className="text-eyebrow">Redemptions</p>
        <AdminTable
          rows={redemptions}
          columns={[
            { key: "redemption_id", label: "Redemption" },
            { key: "account_id", label: "Account" },
            { key: "reward_id", label: "Reward" },
            { key: "status", label: "Status" },
          ]}
          renderActions={(row) =>
            row.status === "Pending" ? (
              <button
                type="button"
                onClick={() => fulfill(row.redemption_id)}
                className="hover-wiggle rounded-full bg-primary px-3 py-1 text-xs font-semibold text-primary-foreground"
              >
                Fulfill
              </button>
            ) : null
          }
          emptyLabel="No redemptions yet."
        />
      </section>
    </div>
  );
}
