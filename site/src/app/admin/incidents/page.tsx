"use client";

import { useEffect, useState } from "react";
import { useAdminGuard } from "@/components/admin/use-admin-guard";
import { AdminTable } from "@/components/admin/admin-table";
import { get } from "@/lib/backend";

type Incident = { incident_id: string; type: string; related_id: string; details: string; created_at: string };
type Review = { review_id: string; review_type: string; stars: number; text: string; published: string };

export default function AdminIncidentsPage() {
  const { session, ready } = useAdminGuard();
  const [incidents, setIncidents] = useState<Incident[]>([]);
  const [reviews, setReviews] = useState<Review[]>([]);

  useEffect(() => {
    if (!session) return;
    get<{ rows: Incident[] }>("admin_incidents", { account_id: session.account_id }).then(
      (res) => res.ok && setIncidents(res.rows)
    );
    get<{ rows: Review[] }>("admin_reviews", { account_id: session.account_id }).then(
      (res) => res.ok && setReviews(res.rows)
    );
  }, [session]);

  if (!ready || !session) return null;

  return (
    <div className="space-y-10">
      <div>
        <p className="text-eyebrow">Admin</p>
        <h1 className="text-display-lg mt-2 text-foreground">Incidents & reviews</h1>
      </div>

      <section>
        <p className="text-eyebrow">Incidents</p>
        <AdminTable
          rows={incidents}
          columns={[
            { key: "incident_id", label: "Incident" },
            { key: "type", label: "Type" },
            { key: "related_id", label: "Related" },
            { key: "details", label: "Details" },
            { key: "created_at", label: "Logged" },
          ]}
          emptyLabel="No incidents logged."
        />
      </section>

      <section>
        <p className="text-eyebrow">Reviews</p>
        <AdminTable
          rows={reviews}
          columns={[
            { key: "review_id", label: "Review" },
            { key: "review_type", label: "Type" },
            { key: "stars", label: "Stars" },
            { key: "text", label: "Text" },
            { key: "published", label: "Published" },
          ]}
          emptyLabel="No reviews yet."
        />
      </section>
    </div>
  );
}
