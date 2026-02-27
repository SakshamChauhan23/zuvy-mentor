"use client";

import { useEffect, useState } from "react";
import { use } from "react";
import DashboardLayout from "@/components/layout/DashboardLayout";
import MentorProfile from "@/components/mentors/MentorProfile";
import MentorProfileSkeleton from "@/components/mentors/MentorProfileSkeleton";
import { getMentorById } from "@/lib/mock/mentors";
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

  // Simulates an API fetch — swap for real API when available
  const loadMentor = () => {
    setState("loading");
    setTimeout(() => {
      const found = getMentorById(id);
      if (!found) {
        setState("not-found");
      } else {
        setMentor(found);
        setState("ready");
      }
    }, 700);
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
