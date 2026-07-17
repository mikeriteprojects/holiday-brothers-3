"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  workerIdentify,
  workerLoginPassword,
  workerVerifyCode,
  workerSetPassword,
  requestPasswordReset,
} from "@/lib/backend";
import { setSession } from "@/lib/session";

type Mode = "identify" | "password" | "code" | "forgot-code" | "forgot-new-password";

export default function WorkerLoginPage() {
  const router = useRouter();
  const [mode, setMode] = useState<Mode>("identify");
  const [identifier, setIdentifier] = useState("");
  const [accountId, setAccountId] = useState("");
  const [password, setPassword] = useState("");
  const [code, setCode] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  function finishLogin(id: string, token: string, roles?: string) {
    setSession({ account_id: id, token, roles });
    router.push("/worker-portal");
  }

  async function handleIdentify(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const res = await workerIdentify(identifier.trim());
      if (!res.ok) {
        setError(res.error);
        return;
      }
      setAccountId(res.account_id);
      setMode(res.method === "password" ? "password" : "code");
    } catch {
      setError("Couldn't reach the login service. Try again in a moment.");
    } finally {
      setLoading(false);
    }
  }

  async function handlePassword(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const res = await workerLoginPassword(accountId, password);
      if (!res.ok) {
        setError(res.error);
        return;
      }
      finishLogin(res.account_id, res.token, res.roles);
    } catch {
      setError("Couldn't reach the login service. Try again in a moment.");
    } finally {
      setLoading(false);
    }
  }

  async function handleCode(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const res = await workerVerifyCode(accountId, code.trim());
      if (!res.ok) {
        setError(res.error);
        return;
      }
      if (mode === "forgot-code") {
        setMode("forgot-new-password");
      } else {
        finishLogin(res.account_id, res.token);
      }
    } catch {
      setError("Couldn't reach the login service. Try again in a moment.");
    } finally {
      setLoading(false);
    }
  }

  async function handleForgotStart() {
    setLoading(true);
    setError(null);
    try {
      const res = await requestPasswordReset(identifier.trim());
      if (!res.ok) {
        setError(res.error);
        return;
      }
      setAccountId(res.account_id);
      setMode("forgot-code");
    } catch {
      setError("Couldn't reach the login service. Try again in a moment.");
    } finally {
      setLoading(false);
    }
  }

  async function handleNewPassword(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const res = await workerSetPassword(accountId, newPassword);
      if (!res.ok) {
        setError(res.error);
        return;
      }
      finishLogin(res.account_id, res.token);
    } catch {
      setError("Couldn't reach the login service. Try again in a moment.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="mx-auto max-w-md px-6 py-20">
      <p className="text-eyebrow">Log in</p>
      <h1 className="text-display-lg mt-2 text-foreground">Welcome back.</h1>
      <p className="mt-2 text-sm text-muted-foreground">
        For customers, crew, and vendors — one login for everyone.
      </p>

      {mode === "identify" && (
        <form onSubmit={handleIdentify} className="mt-8 space-y-3">
          <input
            required
            value={identifier}
            onChange={(e) => setIdentifier(e.target.value)}
            placeholder="Username, email, phone, or account ID"
            className="w-full rounded-lg border border-border bg-card px-4 py-3 text-foreground"
          />
          <button
            type="submit"
            disabled={loading}
            className="hover-wiggle w-full rounded-full bg-primary px-6 py-3 text-sm font-semibold text-primary-foreground disabled:opacity-40"
          >
            {loading ? "Checking…" : "Continue"}
          </button>
        </form>
      )}

      {mode === "password" && (
        <form onSubmit={handlePassword} className="mt-8 space-y-3">
          <input
            required
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Password"
            className="w-full rounded-lg border border-border bg-card px-4 py-3 text-foreground"
          />
          <button
            type="submit"
            disabled={loading}
            className="hover-wiggle w-full rounded-full bg-primary px-6 py-3 text-sm font-semibold text-primary-foreground disabled:opacity-40"
          >
            {loading ? "Logging in…" : "Log in"}
          </button>
          <button
            type="button"
            onClick={handleForgotStart}
            className="text-sm text-muted-foreground underline hover:text-foreground"
          >
            Forgot password?
          </button>
        </form>
      )}

      {(mode === "code" || mode === "forgot-code") && (
        <form onSubmit={handleCode} className="mt-8 space-y-3">
          <p className="text-sm text-muted-foreground">
            {mode === "forgot-code"
              ? "We emailed you a reset code."
              : "We emailed you a 6-digit code."}
          </p>
          <input
            required
            value={code}
            onChange={(e) => setCode(e.target.value)}
            placeholder="6-digit code"
            className="w-full rounded-lg border border-border bg-card px-4 py-3 text-foreground"
          />
          <button
            type="submit"
            disabled={loading}
            className="hover-wiggle w-full rounded-full bg-primary px-6 py-3 text-sm font-semibold text-primary-foreground disabled:opacity-40"
          >
            {loading ? "Verifying…" : "Verify code"}
          </button>
        </form>
      )}

      {mode === "forgot-new-password" && (
        <form onSubmit={handleNewPassword} className="mt-8 space-y-3">
          <p className="text-sm text-muted-foreground">Choose a new password.</p>
          <input
            required
            type="password"
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            placeholder="New password"
            className="w-full rounded-lg border border-border bg-card px-4 py-3 text-foreground"
          />
          <button
            type="submit"
            disabled={loading}
            className="hover-wiggle w-full rounded-full bg-primary px-6 py-3 text-sm font-semibold text-primary-foreground disabled:opacity-40"
          >
            {loading ? "Saving…" : "Set new password"}
          </button>
        </form>
      )}

      {error && (
        <p className="mt-4 rounded-lg border-l-2 border-primary bg-primary/5 px-4 py-3 text-sm text-foreground">
          {error}
        </p>
      )}
    </div>
  );
}
