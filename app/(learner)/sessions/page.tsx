"use client";

import { useEffect, useState } from "react";
import DashboardLayout from "@/components/layout/DashboardLayout";
import SessionList from "@/components/sessions/SessionList";
import { getSessions } from "@/lib/mock/sessions";
import type { BookedSession } from "@/lib/types/session";

export default function SessionsPage() {
  const [sessions, setSessions] = useState<BookedSession[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Simulates API fetch — swap with real API when ready
    const timer = setTimeout(() => {
      setSessions(getSessions());
      setLoading(false);
    }, 700);
    return () => clearTimeout(timer);
  }, []);

  const upcomingCount = sessions.filter(
    (s) => s.status === "upcoming" || s.status === "rescheduled"
  ).length;

  return (
    <DashboardLayout
      role="learner"
      pageTitle="My Sessions"
      pageSubtitle={
        !loading
          ? `${upcomingCount} upcoming · ${sessions.length} total`
          : "Your mentorship session history."
      }
      userName="Jane Doe"
      userTitle="Learner"
    >
      <div className="max-w-3xl">
        <SessionList sessions={sessions} loading={loading} />
      </div>
    </DashboardLayout>
  );
}
