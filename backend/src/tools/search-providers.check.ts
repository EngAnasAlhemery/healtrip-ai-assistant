import { searchProviders } from "./search-providers.js";

// Check a search that should match exactly one mock doctor.
const result = searchProviders({
  specialty: "cardiology",
  city: "jeddah",
  language: "ar",
  secondOpinionOnly: true,
});

// Display the returned records in a readable format.
console.log(JSON.stringify(result, null, 2));