import { Suspense } from "react";
import RiskAnalysisClient from "@/components/RiskAnalysisClient";

export default function RiskAnalysisPage() {
  return (
    <Suspense fallback={null}>
      <RiskAnalysisClient />
    </Suspense>
  );
}
