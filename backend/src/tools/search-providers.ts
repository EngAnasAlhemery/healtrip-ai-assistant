import { z } from "zod";
import { doctors, hospitals } from "../data/providers.js";

// Validate search arguments, including arguments proposed by the AI.
export const searchProvidersSchema = z.object({
  specialty: z.enum([
    "cardiology",
    "internal_medicine",
    "family_medicine",
  ]),

  // Use stable city codes rather than translated names for filtering.
  city: z.enum(["riyadh", "jeddah"]).optional(),

  // Filter by the languages the doctor speaks.
  language: z.enum(["ar", "en"]).optional(),

  // Require second-opinion support only when explicitly requested.
  secondOpinionOnly: z.boolean().default(false),
}).strict();

// Keep the function's input type aligned with its validation rules.
export type SearchProvidersInput =
  z.infer<typeof searchProvidersSchema>;

// Validate tool arguments and return matching records from the mock database.
export function searchProviders(input: unknown) {
  const filters = searchProvidersSchema.parse(input);

  // Join each doctor with their hospital before applying filters.
  const matches = doctors.flatMap((doctor) => {
    const hospital = hospitals.find(
      (item) => item.id === doctor.hospitalId,
    );

    // Treat a broken hospital reference as a data integrity error.
    if (!hospital) {
      throw new Error("Doctor references a missing hospital.");
    }

    // Apply every supplied filter to the database records.
    if (doctor.specialty !== filters.specialty) return [];

    if (filters.city && hospital.cityCode !== filters.city) return [];

    if (
      filters.language &&
      !doctor.languages.includes(filters.language)
    ) return [];

    if (
      filters.secondOpinionOnly &&
      !doctor.offersSecondOpinion
    ) return [];

    // Return provider details directly from the stored records.
    return [{ doctor, hospital }];
  });

  // An empty result is valid; never create substitute providers.
  return {
    source: "mock_database" as const,
    total: matches.length,
    results: matches,
  };
}