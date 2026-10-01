import type { Doctor, Hospital } from "./provider.types.js";

// Fictional hospitals for demonstration; these are not real care providers.
export const hospitals: Hospital[] = [
  {
    id: "hospital-001",
    name: {
      ar: "مستشفى ألف التجريبي",
      en: "Demo Hospital Alpha",
    },
    city: { ar: "الرياض", en: "Riyadh" },
    // Stable city identifier used by the search tool.
cityCode: "riyadh",
    hasEmergencyDepartment: true,
    isMock: true,
  },
  {
    id: "hospital-002",
    name: {
      ar: "مركز باء التجريبي",
      en: "Demo Medical Center Beta",
    },
    city: { ar: "جدة", en: "Jeddah" },
    // Stable city identifier used by the search tool.
cityCode: "jeddah",
    hasEmergencyDepartment: false,
    isMock: true,
  },
];

// Fictional doctors linked to hospitals through hospitalId.
export const doctors: Doctor[] = [
  {
    id: "doctor-001",
    name: {
      ar: "طبيب القلب التجريبي ألف",
      en: "Demo Cardiologist Alpha",
    },
    specialty: "cardiology",
    hospitalId: "hospital-001",
    languages: ["ar", "en"],
    offersSecondOpinion: true,
    isMock: true,
  },
  {
    id: "doctor-002",
    name: {
      ar: "طبيب الباطنة التجريبي باء",
      en: "Demo Internist Beta",
    },
    specialty: "internal_medicine",
    hospitalId: "hospital-001",
    languages: ["ar", "en"],
    offersSecondOpinion: false,
    isMock: true,
  },
  {
    id: "doctor-003",
    name: {
      ar: "طبيب القلب التجريبي جيم",
      en: "Demo Cardiologist Gamma",
    },
    specialty: "cardiology",
    hospitalId: "hospital-002",
    languages: ["en"],
    offersSecondOpinion: true,
    isMock: true,
  },
  {
    id: "doctor-004",
    name: {
      ar: "طبيب الأسرة التجريبي دال",
      en: "Demo Family Physician Delta",
    },
    specialty: "family_medicine",
    hospitalId: "hospital-002",
    languages: ["ar", "en"],
    offersSecondOpinion: false,
    isMock: true,
  },
];
