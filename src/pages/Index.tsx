import { useState } from "react";
import ShiftSetup from "@/components/ShiftSetup";
import ShiftDashboard from "@/components/ShiftDashboard";
import Starfield from "@/components/Starfield";
import type { DietType } from "@/lib/schedule";

const Index = () => {
  const [shift, setShift] = useState<{ start: string; end: string; diet: DietType; name: string } | null>(null);

  return (
    <>
      <Starfield />

  if (!shift) {
    return <ShiftSetup onGenerate={(start, end, diet, shiftName) => setShift({ start, end, diet, name: shiftName })} />;
  }

  return (
    <ShiftDashboard
      startTime={shift.start}
      endTime={shift.end}
      diet={shift.diet}
      shiftName={shift.name}
      onBack={() => setShift(null)}
    />
  );
};

export default Index;
