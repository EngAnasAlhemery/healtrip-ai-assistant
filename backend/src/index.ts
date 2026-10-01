// Load environment variables from the local .env file.
import "dotenv/config";
import express from "express";
// Import the validation rules for incoming chat requests.
import { chatRequestSchema } from "./chat.schema.js";
// Import the service that manages AI requests and tool execution.
import { runPatientAssistant } from "./ai/patient-assistant.service.js";
import helmet from "helmet";
import { rateLimit } from "express-rate-limit";
import type { ErrorRequestHandler } from "express";

// Create the Express application.
const app = express();
// Add security headers to API responses.
app.use(helmet());

// Parse incoming JSON request bodies, with a size limit.
app.use(express.json({ limit: "128kb" }));

// Provide a simple endpoint to check that the API is running.
app.get("/api/health", (_req, res) => {
  res.status(200).json({
    status: "ok",
    service: "HealTrip API",
  });
});

// Limit chat requests per IP using an in-memory counter.
const chatLimiter = rateLimit({
  windowMs: 60 * 1000,
  limit: 5,
  standardHeaders: "draft-8",
  legacyHeaders: false,

  // Return a controlled error before contacting the AI service.
  handler: (req, res) => {
    const arabic = req.body?.language === "ar";

    res.status(429).json({
      error: {
        code: "CHAT_RATE_LIMITED",
        message: arabic
          ? "طلبات كثيرة خلال فترة قصيرة. انتظر دقيقة ثم حاول مجددًا."
          : "Too many requests. Please wait a minute and try again.",
      },
    });
  },
});

// Validate incoming messages and run the patient assistant.
app.post("/api/chat", chatLimiter, async (req, res) => {
  const result = chatRequestSchema.safeParse(req.body);

  // Reject invalid client input before contacting the AI provider.
  if (!result.success) {
    res.status(400).json({
      error: {
        code: "INVALID_INPUT",
        message: "Invalid message, language, or conversation history.",
      },
    });
    return;
  }

  try {
    const response = await runPatientAssistant(result.data);
    res.status(200).json(response);
  } catch (error: unknown) {
    // Inspect status without logging patient data or raw provider errors.
    const status =
      typeof error === "object" && error !== null && "status" in error
        ? Number(error.status)
        : undefined;

    const rateLimited = status === 429;

    // Return a controlled error without exposing internal details.
    res.status(rateLimited ? 429 : 502).json({
      error: {
        code: rateLimited ? "AI_RATE_LIMITED" : "AI_REQUEST_FAILED",
        message:
          result.data.language === "ar"
            ? rateLimited
              ? "تم الوصول إلى حد استخدام خدمة الذكاء الاصطناعي. حاول لاحقًا."
              : "تعذّر إكمال الطلب. حاول مجددًا."
            : rateLimited
              ? "The AI usage limit was reached. Please try later."
              : "The request could not be completed. Please try again.",
      },
    });
  }
});

// Handle parser errors and unexpected failures without exposing internals.
const apiErrorHandler: ErrorRequestHandler = (error, _req, res, next) => {
  if (res.headersSent) {
    next(error);
    return;
  }

  const failure = error as {
    type?: string;
  };

  if (failure?.type === "entity.too.large") {
    res.status(413).json({
      error: {
        code: "REQUEST_TOO_LARGE",
        message: "The request body exceeds the allowed size.",
      },
    });
    return;
  }

  if (failure?.type === "entity.parse.failed") {
    res.status(400).json({
      error: {
        code: "INVALID_JSON",
        message: "The request body must contain valid JSON.",
      },
    });
    return;
  }

  res.status(500).json({
    error: {
      code: "INTERNAL_ERROR",
      message: "An unexpected server error occurred.",
    },
  });
};

// Register error middleware after all API routes.
app.use(apiErrorHandler);

// Read the configured port, using 3001 when PORT is missing.
const PORT = Number(process.env.PORT ?? "3001");

// Stop startup if the port is invalid.
if (!Number.isInteger(PORT) || PORT < 1 || PORT > 65535) {
  throw new Error("PORT must be an integer between 1 and 65535.");
}

app.listen(PORT, "127.0.0.1", () => {
  console.log(`HealTrip API is running at http://127.0.0.1:${PORT}`);
});