import { groqClient } from "./groq.client.js";

// Verify generation access for the configured Groq model.
async function main() {
  const model = process.env.GROQ_MODEL?.trim();

  if (!model) {
    throw new Error("GROQ_MODEL is missing.");
  }

  // Send a short non-medical request.
  const response = await groqClient.chat.completions.create({
    model,
    messages: [
      {
        role: "user",
        content: "Reply with exactly: HealTrip Groq connection successful",
      },
    ],
    max_completion_tokens: 512,
  });

  // Read the assistant's text and reject an empty response.
  const reply = response.choices[0]?.message.content?.trim();

  if (!reply) {
    throw new Error("The model returned no text.");
  }

  console.log(reply);
}

// Report errors without exposing the API key.
main().catch((error: unknown) => {
  const message =
    error instanceof Error ? error.message : "Unknown error";

  const apiKey = process.env.GROQ_API_KEY?.trim();

  console.error(
    apiKey ? message.split(apiKey).join("[REDACTED]") : message,
  );

  process.exitCode = 1;
});