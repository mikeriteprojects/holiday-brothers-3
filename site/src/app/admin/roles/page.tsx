"use client";

import { useCallback, useEffect, useState } from "react";
import { useAdminGuard } from "@/components/admin/use-admin-guard";
import { get, post } from "@/lib/backend";

type Role = { role_id: string; role_name: string; is_preset: string; permissions_json: string };
type Flag = { flag_id: string; category: string; label: string };

export default function AdminRolesPage() {
  const { session, ready } = useAdminGuard();
  const [roles, setRoles] = useState<Role[]>([]);
  const [flags, setFlags] = useState<Flag[]>([]);
  const [newRoleName, setNewRoleName] = useState("");
  const [assignTarget, setAssignTarget] = useState("");
  const [assignRole, setAssignRole] = useState("");

  const load = useCallback(async () => {
    if (!session) return;
    const [r1, r2] = await Promise.all([
      get<{ rows: Role[] }>("admin_roles", { account_id: session.account_id }),
      get<{ rows: Flag[] }>("admin_permission_flags", { account_id: session.account_id }),
    ]);
    if (r1.ok) setRoles(r1.rows);
    if (r2.ok) setFlags(r2.rows);
  }, [session]);

  useEffect(() => {
    load();
  }, [load]);

  async function createRole(e: React.FormEvent) {
    e.preventDefault();
    if (!session) return;
    await post("createCustomRole", { account_id: session.account_id, role_name: newRoleName });
    setNewRoleName("");
    load();
  }

  async function toggle(roleId: string, flagId: string, enabled: boolean) {
    if (!session) return;
    await post("toggleRolePermission", { account_id: session.account_id, role_id: roleId, flag_id: flagId, enabled });
    load();
  }

  async function assign(e: React.FormEvent) {
    e.preventDefault();
    if (!session) return;
    await post("assignStaffRole", { account_id: session.account_id, target_account_id: assignTarget, role_id: assignRole });
    setAssignTarget("");
    setAssignRole("");
  }

  if (!ready || !session) return null;

  const byCategory = flags.reduce<Record<string, Flag[]>>((acc, f) => {
    (acc[f.category] ||= []).push(f);
    return acc;
  }, {});

  return (
    <div className="space-y-10">
      <div>
        <p className="text-eyebrow">Admin</p>
        <h1 className="text-display-lg mt-2 text-foreground">Roles & permissions</h1>
      </div>

      <form onSubmit={createRole} className="flex gap-2">
        <input
          required
          value={newRoleName}
          onChange={(e) => setNewRoleName(e.target.value)}
          placeholder="New role name"
          className="flex-1 rounded-md border border-border bg-card px-3 py-2 text-sm"
        />
        <button type="submit" className="hover-wiggle rounded-md bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground">
          Create role
        </button>
      </form>

      <div className="space-y-6">
        {roles.map((role) => {
          let perms: Record<string, boolean> = {};
          try {
            perms = JSON.parse(role.permissions_json || "{}");
          } catch {
            perms = {};
          }
          return (
            <div key={role.role_id} className="rounded-xl border border-border bg-card p-5">
              <p className="font-semibold text-foreground">
                {role.role_name}{" "}
                {role.is_preset === "TRUE" && (
                  <span className="ml-2 rounded-full bg-secondary px-2 py-0.5 text-xs text-muted-foreground">
                    preset
                  </span>
                )}
              </p>
              <div className="mt-3 space-y-3">
                {Object.entries(byCategory).map(([category, catFlags]) => (
                  <div key={category}>
                    <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                      {category}
                    </p>
                    <div className="mt-1 grid gap-1 sm:grid-cols-2 lg:grid-cols-3">
                      {catFlags.map((f) => (
                        <label key={f.flag_id} className="flex items-center gap-2 text-sm text-foreground">
                          <input
                            type="checkbox"
                            checked={!!perms[f.flag_id]}
                            onChange={(e) => toggle(role.role_id, f.flag_id, e.target.checked)}
                            className="h-3.5 w-3.5 accent-[var(--primary)]"
                          />
                          {f.label}
                        </label>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          );
        })}
        {roles.length === 0 && <p className="text-sm text-muted-foreground">No roles yet.</p>}
      </div>

      <section>
        <p className="text-eyebrow">Assign a staff role</p>
        <form onSubmit={assign} className="mt-3 flex flex-wrap gap-2">
          <input
            required
            value={assignTarget}
            onChange={(e) => setAssignTarget(e.target.value)}
            placeholder="Target account ID"
            className="rounded-md border border-border bg-card px-3 py-2 text-sm"
          />
          <select
            required
            value={assignRole}
            onChange={(e) => setAssignRole(e.target.value)}
            className="rounded-md border border-border bg-card px-3 py-2 text-sm"
          >
            <option value="">Choose role</option>
            {roles.map((r) => (
              <option key={r.role_id} value={r.role_id}>
                {r.role_name}
              </option>
            ))}
          </select>
          <button type="submit" className="hover-wiggle rounded-md bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground">
            Assign
          </button>
        </form>
      </section>
    </div>
  );
}
