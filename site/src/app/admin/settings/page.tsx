"use client";

import { useCallback, useEffect, useState } from "react";
import { useAdminGuard } from "@/components/admin/use-admin-guard";
import { get, post } from "@/lib/backend";

type SettingRow = {
  key: string;
  value: string;
  category: string;
  description: string;
  draft_value: string;
  has_pending_draft: string;
};

export default function AdminSettingsPage() {
  const { session, ready } = useAdminGuard();
  const [rows, setRows] = useState<SettingRow[]>([]);
  const [drafts, setDrafts] = useState<Record<string, string>>({});

  const load = useCallback(async () => {
    if (!session) return;
    const res = await get<{ rows: SettingRow[] }>("admin_settings", { account_id: session.account_id });
    if (res.ok) setRows(res.rows);
  }, [session]);

  useEffect(() => {
    load();
  }, [load]);

  async function saveDraft(key: string) {
    if (!session) return;
    await post("saveDraft", { account_id: session.account_id, table: "Settings", row_key: key, new_value: drafts[key] ?? "" });
    load();
  }

  async function publish(key: string) {
    if (!session) return;
    await post("publishDraft", { account_id: session.account_id, table: "Settings", row_key: key });
    load();
  }

  if (!ready || !session) return null;

  const byCategory = rows.reduce<Record<string, SettingRow[]>>((acc, r) => {
    (acc[r.category || "Other"] ||= []).push(r);
    return acc;
  }, {});

  return (
    <div>
      <p className="text-eyebrow">Admin</p>
      <h1 className="text-display-lg mt-2 text-foreground">Settings</h1>
      <p className="mt-2 text-sm text-muted-foreground">
        Operational thresholds — cancellation-fee tiers, follow-up escalation windows, and other
        placeholder numbers.
      </p>

      <div className="mt-8 space-y-8">
        {Object.entries(byCategory).map(([category, catRows]) => (
          <section key={category}>
            <p className="text-eyebrow">{category}</p>
            <div className="mt-3 space-y-3">
              {catRows.map((row) => (
                <div key={row.key} className="rounded-lg border border-border bg-card p-4">
                  <p className="text-xs font-mono text-muted-foreground">{row.key}</p>
                  <p className="mt-0.5 text-xs text-muted-foreground">{row.description}</p>
                  <div className="mt-2 flex gap-2">
                    <input
                      defaultValue={row.draft_value || row.value}
                      onChange={(e) => setDrafts((d) => ({ ...d, [row.key]: e.target.value }))}
                      className="flex-1 rounded-md border border-border bg-background px-3 py-2 text-sm"
                    />
                    <button
                      type="button"
                      onClick={() => saveDraft(row.key)}
                      className="hover-wiggle rounded-md border border-border px-3 py-2 text-xs font-semibold text-foreground"
                    >
                      Save draft
                    </button>
                    {String(row.has_pending_draft).toUpperCase() === "TRUE" && (
                      <button
                        type="button"
                        onClick={() => publish(row.key)}
                        className="hover-wiggle rounded-md bg-primary px-3 py-2 text-xs font-semibold text-primary-foreground"
                      >
                        Publish
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </section>
        ))}
        {rows.length === 0 && <p className="text-sm text-muted-foreground">No settings rows yet.</p>}
      </div>
    </div>
  );
}
