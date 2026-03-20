import { useState } from "react";
import ShiftSetup from "@/components/ShiftSetup";
import ShiftDashboard from "@/components/ShiftDashboard";
import NightOffDashboard from "@/components/NightOffDashboard";
import Starfield from "@/components/Starfield";
import type { DietType } from "@/lib/schedule";
import type { ShiftMode } from "@/components/ShiftSetup";

const Index = () => {
  const [shift, setShift] = useState<{ start: string; end: string; diet: DietType; name: string; mode: ShiftMode } | null>(null);

  return (
    <>
      <Starfield />

      {!shift ? (
        <ShiftSetup onGenerate={(start, end, diet, shiftName, mode) => setShift({ start, end, diet, name: shiftName, mode })} />
      ) : shift.mode === "night-off" ? (
        <NightOffDashboard
          bedtime={shift.start}
          diet={shift.diet}
          onBack={() => setShift(null)}
        />
      ) : (
        <ShiftDashboard
          startTime={shift.start}
          endTime={shift.end}
          diet={shift.diet}
          shiftName={shift.name}
          onBack={() => setShift(null)}
        />
      )}
    </>
  );
};

export default Index;
