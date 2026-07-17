"use client";

import { useCallback, useEffect, useState } from "react";
import { useAdminGuard } from "@/components/admin/use-admin-guard";
import { get, post } from "@/lib/backend";

// Content and Pricing are the two sheets whose schema actually matches the
// generic draft/publish flow (value/draft_value/has_pending_draft columns) —
// this is also where /about/[slug] and the homepage's eyebrow/FAQ copy live,
// since those all read from Content blocks. Testimonials get a simpler
// create-only form below (its schema doesn't have a draft_value column, so
// the generic saveDraft/publishDraft flow doesn't apply to it).

type DraftRow = {
  [key: string]: string;
  value: string;
  draft_value: string;
  has_pending_draft: string;
};

function TableEditor({
  table,
  action,
  keyField,
  accountId,
  reload,
}: {
  table: "Content" | "Pricing";
  action: string;
  keyField: string;
  accountId: string;
  reload: number;
}) {
  const [rows, setRows] = useState<DraftRow[]>([]);
  const [drafts, setDrafts] = useState<Record<string, string>>({});

  const load = useCallback(async () => {
    const res = await get<{ rows: DraftRow[] }>(action, { account_id: accountId });
    if (res.ok) setRows(res.rows);
  }, [action, accountId]);

  useEffect(() => {
    load();
  }, [load, reload]);

  async function saveDraft(rowKey: string) {
    await post("saveDraft", {
      account_id: accountId,
      table,
      row_key: rowKey,
      new_value: drafts[rowKey] ?? "",
    });
    load();
  }

  async function publish(rowKey: string) {
    await post("publishDraft", { account_id: accountId, table, row_key: rowKey });
    load();
  }

  return (
    <div className="space-y-3">
      {rows.map((row) => {
        const key = row[keyField];
        return (
          <div key={key} className="rounded-lg border border-border bg-card p-4">
            <p className="text-xs font-mono text-muted-foreground">{key}</p>
            <p className="mt-1 text-sm text-foreground">Live: {row.value}</p>
            <div className="mt-2 flex gap-2">
              <input
                defaultValue={row.draft_value || row.value}
                onChange={(e) => setDrafts((d) => ({ ...d, [key]: e.target.value }))}
                className="flex-1 rounded-md border border-border bg-background px-3 py-2 text-sm"
              />
              <button
                type="button"
                onClick={() => saveDraft(key)}
                className="hover-wiggle rounded-md border border-border px-3 py-2 text-xs font-semibold text-foreground"
              >
                Save draft
              </button>
              {String(row.has_pending_draft).toUpperCase() === "TRUE" && (
                <button
                  type="button"
                  onClick={() => publish(key)}
                  className="hover-wiggle rounded-md bg-primary px-3 py-2 text-xs font-semibold text-primary-foreground"
                >
                  Publish
                </button>
              )}
            </div>
          </div>
        );
      })}
      {rows.length === 0 && <p className="text-sm text-muted-foreground">No rows yet.</p>}
    </div>
  );
}

function TestimonialsCreate({ accountId, onCreated }: { accountId: string; onCreated: () => void }) {
  const [customerName, setCustomerName] = useState("");
  const [quote, setQuote] = useState("");

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    await post("createTestimonial", { account_id: accountId, customer_name: customerName, quote });
    setCustomerName("");
    setQuote("");
    onCreated();
  }

  return (
    <form onSubmit={submit} className="grid gap-2 rounded-lg border border-border bg-card p-4 sm:grid-cols-[1fr_2fr_auto]">
      <input
        required
        value={customerName}
        onChange={(e) => setCustomerName(e.target.value)}
        placeholder="Customer name"
        className="rounded-md border border-border bg-background px-3 py-2 text-sm"
      />
      <input
        required
        value={quote}
        onChange={(e) => setQuote(e.target.value)}
        placeholder="Quote"
        className="rounded-md border border-border bg-background px-3 py-2 text-sm"
      />
      <button type="submit" className="hover-wiggle rounded-md bg-primary px-3 py-2 text-xs font-semibold text-primary-foreground">
        Add
      </button>
    </form>
  );
}

export default function AdminContentPage() {
  const { session, ready } = useAdminGuard();
  const [reload, setReload] = useState(0);

  async function publishAll() {
    if (!session) return;
    await post("publishAll", { account_id: session.account_id });
    setReload((n) => n + 1);
  }

  if (!ready || !session) return null;

  return (
    <div className="space-y-10">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-eyebrow">Admin</p>
          <h1 className="text-display-lg mt-2 text-foreground">Content</h1>
        </div>
        <button
          type="button"
          onClick={publishAll}
          className="hover-wiggle rounded-full bg-primary px-5 py-2 text-sm font-semibold text-primary-foreground"
        >
          Publish all drafts
        </button>
      </div>

      <section>
        <p className="text-eyebrow">Site copy (homepage, about pages, FAQ)</p>
        <div className="mt-3">
          <TableEditor
            table="Content"
            action="admin_content_all"
            keyField="block_id"
            accountId={session.account_id}
            reload={reload}
          />
        </div>
      </section>

      <section>
        <p className="text-eyebrow">Pricing</p>
        <div className="mt-3">
          <TableEditor
            table="Pricing"
            action="pricing"
            keyField="formula_component"
            accountId={session.account_id}
            reload={reload}
          />
        </div>
      </section>

      <section>
        <p className="text-eyebrow">Testimonials</p>
        <div className="mt-3">
          <TestimonialsCreate accountId={session.account_id} onCreated={() => setReload((n) => n + 1)} />
        </div>
      </section>
    </div>
  );
}
