"use client";

import { useEffect, useState } from "react";
import { use } from "react";
import DashboardLayout from "@/components/layout/DashboardLayout";
import MentorProfile from "@/components/mentors/MentorProfile";
import MentorProfileSkeleton from "@/components/mentors/MentorProfileSkeleton";
import type { Mentor } from "@/lib/types/mentor";

type PageState = "loading" | "ready" | "error" | "not-found";

export default function MentorProfilePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);

  const [state, setState] = useState<PageState>("loading");
  const [mentor, setMentor] = useState<Mentor | null>(null);

  const loadMentor = async () => {
    setState("loading");
    try {
      const res = await fetch(`/api/mentors/${id}`);
      if (res.status === 404) { setState("not-found"); return; }
      if (!res.ok) throw new Error("Failed to fetch");
      const data: Mentor = await res.json();
      setMentor(data);
      setState("ready");
    } catch {
      setState("error");
    }
  };

  useEffect(() => {
    loadMentor();
  }, [id]);

  const pageTitle = mentor?.name ?? "Mentor Profile";
  const pageSubtitle = mentor?.title;

  return (
    <DashboardLayout
      role="learner"
      pageTitle={pageTitle}
      pageSubtitle={pageSubtitle}
      userName="Jane Doe"
      userTitle="Learner"
    >
      {/* Extra bottom padding on mobile for sticky booking bar */}
      <div className="pb-20 lg:pb-0">
        {state === "loading" ? (
          <MentorProfileSkeleton />
        ) : (
          <MentorProfile
            mentor={mentor}
            state={state}
            onRetry={loadMentor}
          />
        )}
      </div>
    </DashboardLayout>
  );
}
