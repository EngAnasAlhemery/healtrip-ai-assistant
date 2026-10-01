// Load backend environment variables before reading the secret.
import "dotenv/config";

import Groq from "groq-sdk";

// Read the API key without exposing it to the browser.
const apiKey = process.env.GROQ_API_KEY?.trim();

if (!apiKey) {
  throw new Error("GROQ_API_KEY is missing from the backend environment.");
}

// Bound each request and disable automatic retries to control usage.
export const groqClient = new Groq({
  apiKey,
  timeout: 20000,
  maxRetries: 0,
});