// Store both translations explicitly instead of asking the AI to invent them.
export interface LocalizedName {
  ar: string;
  en: string;
}

// Limit specialties to values supported by the prototype.
export type Specialty =
  | "cardiology"
  | "internal_medicine"
  | "family_medicine";

// Define the hospital records used by the mock database.
export interface Hospital {
  id: string;
  name: LocalizedName;
  city: LocalizedName;
    // Use a stable code for filtering, independent of display language.
  cityCode: "riyadh" | "jeddah";
  hasEmergencyDepartment: boolean;
  isMock: true;
}

// Link each doctor to an existing hospital through its ID.
export interface Doctor {
  id: string;
  name: LocalizedName;
  specialty: Specialty;
  hospitalId: string;
  languages: Array<"ar" | "en">;
  offersSecondOpinion: boolean;
  isMock: true;
}