import type { Doctor, Hospital } from "../data/provider.types.js";

interface ProviderRecord {
  doctor: Doctor;
  hospital: Hospital;
}

// Resolve selected IDs only against the actual search results.
export function resolveVerifiedProviders(
  providerIds: string[],
  searchResults: ProviderRecord[],
): ProviderRecord[] {
  // Reject repeated IDs instead of displaying duplicate cards.
  if (new Set(providerIds).size !== providerIds.length) {
    throw new Error("The assistant returned duplicate provider IDs.");
  }

  return providerIds.map((id) => {
    const match = searchResults.find((item) => item.doctor.id === id);

    // Reject invented IDs and IDs outside the current search results.
    if (!match) {
      throw new Error("The assistant selected an unverified provider.");
    }

    return match;
  });
}