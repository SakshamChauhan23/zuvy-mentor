import { Suspense } from "react";
import CancelPageContent from "@/components/sessions/CancelPageContent";

export default function CancelPage({ params }: { params: Promise<{ id: string }> }) {
  return <Suspense><CancelPageContent params={params} /></Suspense>;
}
