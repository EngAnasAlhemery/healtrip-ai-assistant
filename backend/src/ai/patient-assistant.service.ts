import type { ChatCompletionMessageParam } from "groq-sdk/resources/chat/completions";
import type { ChatRequest } from "../chat.schema.js";
import { searchProviders } from "../tools/search-providers.js";
import { groqClient } from "./groq.client.js";
import { buildPatientAssistantPrompt } from "./patient-assistant.prompt.js";
import { providerSearchTool } from "./provider.tool.js";
import { assistantOutputSchema } from "./patient-assistant.output.js";

// Bound model requests and local tool execution per chat turn.
const MAX_MODEL_REQUESTS = 3;
const MAX_TOOL_CALLS = 2;

export async function runPatientAssistant(request: ChatRequest) {
  const model = process.env.GROQ_MODEL?.trim();

  if (!model) {
    throw new Error("GROQ_MODEL is missing.");
  }

  // Only the backend supplies system instructions.
  const messages: ChatCompletionMessageParam[] = [
    {
      role: "system",
      content: buildPatientAssistantPrompt(request.language),
    },
    ...request.history.map((item) => ({
      role: item.role,
      content: item.content,
    })),
    {
      role: "user",
      content: request.message,
    },
  ];

  // Adapt the existing tool definition to Groq's function format.
  const tool = {
    type: "function" as const,
    function: {
      name: providerSearchTool.name,
      description: providerSearchTool.description,
      parameters: providerSearchTool.parameters,
    },
  };

  let toolCallCount = 0;
  let providers: ReturnType<typeof searchProviders>["results"] = [];

  const toolTrace: Array<{
    tool: string;
    resultCount: number;
  }> = [];

  for (let round = 0; round < MAX_MODEL_REQUESTS; round++) {
    const response = await groqClient.chat.completions.create({
      model,
      messages,
      tools: [tool],
      tool_choice: "auto",
      max_completion_tokens: 2048,
    });

    const assistant = response.choices[0]?.message;

    // Reject truncated output rather than accepting a partial decision.
    if (
      !assistant ||
      response.choices[0]?.finish_reason === "length"
    ) {
      throw new Error("Missing or truncated assistant response.");
    }

    const calls = assistant.tool_calls ?? [];

    if (calls.length > 0) {
      // Preserve the assistant's tool calls before appending their results.
      messages.push({
        role: "assistant",
        content: assistant.content,
        tool_calls: calls,
      });

      for (const call of calls) {
        // Execute only the allowlisted function.
        if (
          call.type !== "function" ||
          call.function.name !== "search_providers" ||
          !call.id
        ) {
          throw new Error("Unsupported or invalid tool call.");
        }

        toolCallCount++;

        if (toolCallCount > MAX_TOOL_CALLS) {
          throw new Error("Tool call limit exceeded.");
        }

        // Parse JSON arguments, then validate them inside the search function.
        const result = searchProviders(
          JSON.parse(call.function.arguments),
        );

        providers = result.results;
        toolTrace.push({
          tool: call.function.name,
          resultCount: result.total,
        });

        // Link the database result to the exact tool call.
        messages.push({
          role: "tool",
          tool_call_id: call.id,
          content: JSON.stringify(result),
        });
      }

      continue;
    }

    const reply = assistant.content?.trim();

    if (!reply) {
      throw new Error("The assistant returned an empty response.");
    }

    // Validate both JSON syntax and the expected decision structure.
    const output = assistantOutputSchema.parse(JSON.parse(reply));

    if (new Set(output.providerIds).size !== output.providerIds.length) {
      throw new Error("The assistant returned duplicate provider IDs.");
    }

    // Resolve IDs exclusively against the latest actual search results.
    const verifiedProviders = output.providerIds.map((id) => {
      const match = providers.find((item) => item.doctor.id === id);

      if (!match) {
        throw new Error("The assistant selected an unverified provider.");
      }

      return match;
    });

    if (
      ["emergency", "clarify", "no_match"].includes(output.nextStep) &&
      verifiedProviders.length > 0
    ) {
      throw new Error("Provider selection conflicts with the next step.");
    }

    if (output.nextStep === "clarify" && output.questions.length === 0) {
      throw new Error("Clarification requires a follow-up question.");
    }

    if (
      output.nextStep === "no_match" &&
      (toolTrace.length === 0 || providers.length !== 0)
    ) {
      throw new Error("No-match decision conflicts with search results.");
    }

    // Return generated guidance separately from verified provider cards.
    return {
      reply: [output.explanation, ...output.questions].join("\n\n"),
      nextStep: output.nextStep,
      questions: output.questions,
      providers: verifiedProviders,
      toolTrace,
      isDemo: true,
    };
  }

  throw new Error("Assistant request limit exceeded.");
}