import { z } from "zod";

// Validate the structured decision returned by the model.
export const assistantOutputSchema = z.object({
  nextStep: z.enum([
    "clarify",
    "emergency",
    "consultation",
    "second_opinion",
    "no_match",
  ]),

  // Keep explanations concise and bounded.
  explanation: z.string().trim().min(1).max(1500),

  // Allow a small number of focused follow-up questions.
  questions: z.array(
    z.string().trim().min(1).max(300),
  ).max(3),

  // Accept identifiers only; provider details come from database records.
  providerIds: z.array(
    z.string().regex(/^doctor-\d{3}$/),
  ).max(4),
}).strict();

// Keep the TypeScript output type aligned with runtime validation.
export type AssistantOutput = z.infer<typeof assistantOutputSchema>;