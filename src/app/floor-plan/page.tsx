import { Suspense } from "react";
import { FloorPlanView } from "@/components/floor-plan/FloorPlanView";
import { Card } from "@/components/common/Card";

export default function FloorPlanPage() {
  return (
    <Suspense fallback={<Card>Loading floor plan...</Card>}>
      <FloorPlanView />
    </Suspense>
  );
}
