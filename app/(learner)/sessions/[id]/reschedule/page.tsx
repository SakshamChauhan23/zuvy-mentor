import { Suspense } from "react";
import ReschedulePageContent from "@/components/sessions/ReschedulePageContent";

export default function ReschedulePage({ params }: { params: Promise<{ id: string }> }) {
  return <Suspense><ReschedulePageContent params={params} /></Suspense>;
}
