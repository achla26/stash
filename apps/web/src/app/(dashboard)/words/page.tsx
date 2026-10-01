import { Suspense } from "react";
import { WordsDashboard } from "@/components/words/words-dashboard";

export default function WordsPage() {
  return (
    <Suspense fallback={null}>
      <WordsDashboard />
    </Suspense>
  );
}
