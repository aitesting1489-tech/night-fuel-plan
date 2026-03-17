import { useState } from "react";
import ShiftSetup from "@/components/ShiftSetup";
import ShiftDashboard from "@/components/ShiftDashboard";
import type { DietType } from "@/lib/schedule";

const Index = () => {
  const [shift, setShift] = useState<{ start: string; end: string; diet: DietType } | null>(null);

  if (!shift) {
    return <ShiftSetup onGenerate={(start, end, diet) => setShift({ start, end, diet })} />;
  }

  return (
    <ShiftDashboard
      startTime={shift.start}
      endTime={shift.end}
      diet={shift.diet}
      onBack={() => setShift(null)}
    />
  );
};

export default Index;
