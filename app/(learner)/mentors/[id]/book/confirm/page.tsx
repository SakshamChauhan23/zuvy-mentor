import { Suspense } from "react";
import ConfirmPageContent from "@/components/booking/ConfirmPageContent";

// Suspense is required here because ConfirmPageContent calls useSearchParams()
export default function ConfirmPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  return (
    <Suspense>
      <ConfirmPageContent params={params} />
    </Suspense>
  );
}
