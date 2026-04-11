import type { MascotGender } from "@/components/MascotTip";

export type { MascotGender };

const STORAGE_KEY = "circadia_mascot_gender";

export function getMascotGender(): MascotGender {
  try {
    const val = localStorage.getItem(STORAGE_KEY);
    if (val === "girl" || val === "boy") return val;
  } catch {}
  return "boy";
}

export function setMascotGender(gender: MascotGender) {
  try {
    localStorage.setItem(STORAGE_KEY, gender);
  } catch {}
}
