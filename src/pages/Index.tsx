import { useState } from "react";
import ShiftSetup from "@/components/ShiftSetup";
import ShiftDashboard from "@/components/ShiftDashboard";

const Index = () => {
  const [shift, setShift] = useState<{ start: string; end: string } | null>(null);

  if (!shift) {
    return <ShiftSetup onGenerate={(start, end) => setShift({ start, end })} />;
  }

  return (
    <ShiftDashboard
      startTime={shift.start}
      endTime={shift.end}
      onBack={() => setShift(null)}
    />
  );
};

export default Index;
