// Describe the provider search function to the AI model.
export const providerSearchTool = {
  type: "function" as const,
  name: "search_providers",
  description:
    "Search fictional demo doctors and hospitals using explicit filters. " +
    "This tool does not diagnose patients, assess urgency, or confirm availability.",

  // Describe the arguments the model may supply.
  parameters: {
    type: "object",
    properties: {
      specialty: {
        type: "string",
        enum: [
          "cardiology",
          "internal_medicine",
          "family_medicine",
        ],
        description: "The specialty to search for.",
      },
      city: {
        type: "string",
        enum: ["riyadh", "jeddah"],
        description:
          "The patient's requested city. Omit if unknown; do not guess.",
      },
      language: {
        type: "string",
        enum: ["ar", "en"],
        description:
          "The requested language spoken by the doctor. Omit if unspecified.",
      },
      secondOpinionOnly: {
        type: "boolean",
        description:
          "Set to true when the patient explicitly requests a second opinion.",
      },
    },
    required: ["specialty"],
    additionalProperties: false,
  },
};