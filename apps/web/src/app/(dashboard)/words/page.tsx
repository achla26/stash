import { Suspense } from "react";
import { ReviewDashboard } from "@/components/words/review-dashboard";

export default function WordsPage() {
  return (
    <Suspense fallback={null}>
      <ReviewDashboard />
    </Suspense>
  );
}
