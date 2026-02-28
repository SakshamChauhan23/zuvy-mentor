"use client";

import { useEffect, useState } from "react";
import DashboardLayout from "@/components/layout/DashboardLayout";
import SessionList from "@/components/sessions/SessionList";
import type { BookedSession } from "@/lib/types/session";

// Convert ISO timestamp to local "HH:MM"
function toHHMM(iso: string) {
  const d = new Date(iso);
  return `${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`;
}

// Convert ISO timestamp to local "YYYY-MM-DD"
function toDateStr(iso: string) {
  const d = new Date(iso);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

interface ApiSession {
  id: string;
  status: BookedSession["status"];
  bookedAt: string;
  cancelReason: string | null;
  rescheduleReason: string | null;
  slotStart: string;
  slotEnd: string;
  durationMinutes: number;
  mentorProfileId: string;
  mentorName: string;
  mentorTitle: string;
  isVerified: boolean;
}

function toBookedSession(s: ApiSession): BookedSession {
  return {
    id: s.id,
    mentorId: s.mentorProfileId,
    mentorName: s.mentorName,
    mentorTitle: s.mentorTitle,
    isVerified: s.isVerified,
    date: toDateStr(s.slotStart),
    startTime: toHHMM(s.slotStart),
    endTime: toHHMM(s.slotEnd),
    durationMinutes: s.durationMinutes,
    status: s.status,
    bookedAt: s.bookedAt,
  };
}

export default function SessionsPage() {
  const [sessions, setSessions] = useState<BookedSession[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/sessions")
      .then((res) => (res.ok ? res.json() : Promise.reject()))
      .then((data: ApiSession[]) => {
        setSessions(data.map(toBookedSession));
      })
      .catch(() => {
        setSessions([]);
      })
      .finally(() => setLoading(false));
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
