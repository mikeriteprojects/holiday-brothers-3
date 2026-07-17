"use client";

import { useEffect, useState, useCallback } from "react";

// Mirrors the backend's session model (UserJourney.md §3): the token is a
// client-side "am I logged in" flag, not middleware-enforced — every
// privileged POST call passes account_id itself and the backend checks
// permissions server-side.

const STORAGE_KEY = "hb_session";

export type Session = {
  account_id: string;
  token: string;
  roles?: string;
  permissions?: Record<string, boolean>;
};

function readSession(): Session | null {
  if (typeof window === "undefined") return null;
  const raw = window.localStorage.getItem(STORAGE_KEY);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as Session;
  } catch {
    return null;
  }
}

export function setSession(session: Session) {
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(session));
  window.dispatchEvent(new Event("hb_session_change"));
}

export function clearSession() {
  window.localStorage.removeItem(STORAGE_KEY);
  window.dispatchEvent(new Event("hb_session_change"));
}

export function useSession() {
  const [session, setSessionState] = useState<Session | null>(null);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    setSessionState(readSession());
    setLoaded(true);
    const onChange = () => setSessionState(readSession());
    window.addEventListener("hb_session_change", onChange);
    window.addEventListener("storage", onChange);
    return () => {
      window.removeEventListener("hb_session_change", onChange);
      window.removeEventListener("storage", onChange);
    };
  }, []);

  const logout = useCallback(() => clearSession(), []);

  return { session, loaded, logout };
}
