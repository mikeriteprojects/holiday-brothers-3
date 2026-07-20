"use client";

import { useEffect, useState } from "react";
import { getContent, type ContentRow } from "@/lib/backend";

// Static export has no server to fetch this at request time, so pages that
// need live Content-sheet data pull it client-side on mount instead — same
// pattern as the other GH Pages sites pulling live Sheets data.
export function useContent(): { rows: ContentRow[]; loading: boolean } {
  const [rows, setRows] = useState<ContentRow[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    getContent()
      .then((res) => {
        if (!cancelled && res.ok) setRows(res.rows);
      })
      .catch(() => {})
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  return { rows, loading };
}
