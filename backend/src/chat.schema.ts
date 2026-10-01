import { z } from "zod";

// Accept only bounded user and assistant messages from the chat interface.
const historyMessageSchema = z.object({
  role: z.enum(["user", "assistant"]),
  content: z.string().trim().min(1).max(2000),
}).strict();

// Validate the latest message and a limited conversation history.
export const chatRequestSchema = z.object({
  message: z.string().trim().min(1).max(2000),
  language: z.enum(["ar", "en"]).default("en"),

  // Preserve recent context without allowing unlimited request growth.
  history: z.array(historyMessageSchema).max(12).default([]),
}).strict();

// Derive application types from the runtime validation rules.
export type ChatRequest = z.infer<typeof chatRequestSchema>;