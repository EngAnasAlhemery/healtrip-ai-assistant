import { useState } from "react";
import type { FormEvent } from "react";
import "./App.css";

type Language = "ar" | "en";

interface Provider {
  doctor: {
    id: string;
    name: Record<Language, string>;
    specialty: string;
    languages: Language[];
    offersSecondOpinion: boolean;
  };
  hospital: {
    name: Record<Language, string>;
    city: Record<Language, string>;
  };
}

interface ChatMessage {
  role: "user" | "assistant";
  content: string;
  providers?: Provider[];
  nextStep?: string;
  toolTrace?: Array<{ tool: string; resultCount: number }>;
}

interface ChatResponse {
  reply: string;
  providers: Provider[];
  nextStep: string;
  toolTrace: Array<{ tool: string; resultCount: number }>;
}

const labels = {
  en: {
    title: "HealTrip Patient Decision Assistant",
    notice:
      "Technical prototype. Not a diagnosis or an emergency service. All provider records are fictional. Use fictional patient information only.",
    placeholder: "Describe your question or what you need help with…",
    send: "Send",
    waiting: "Processing…",
    reset: "New conversation",
    demo: "Fictional demo provider",
    secondOpinion: "Second-opinion service offered",
    noAvailability: "Appointment availability is not provided.",
    tools: "Search activity",
    error: "The request failed. Please try again.",
    rateLimit: "AI usage limit reached. Please try later.",
    timeout: "The request timed out. Please try again.",
    failedNote: "Message not added to the conversation. Your draft was restored.",
    chatLimit: "Too many messages. Please wait a minute and try again.",
  },
  ar: {
    title: "HealTrip — مساعد اتخاذ الخطوة التالية",
    notice:
      "نموذج تقني تجريبي، لا يقدم تشخيصًا وليس خدمة طوارئ. جميع بيانات الأطباء وهمية. استخدم معلومات مرضى وهمية فقط.",
    placeholder: "اكتب سؤالك أو وضّح ما تحتاج المساعدة فيه…",
    send: "إرسال",
    waiting: "جارٍ المعالجة…",
    reset: "محادثة جديدة",
    demo: "طبيب وهمي للتجربة",
    secondOpinion: "يقدم خدمة الرأي الطبي الثاني",
    noAvailability: "لا توجد معلومات عن توفر المواعيد.",
    tools: "نشاط البحث",
    error: "تعذّر إكمال الطلب. حاول مجددًا.",
    rateLimit: "تم الوصول إلى حد استخدام الذكاء الاصطناعي. حاول لاحقًا.",
    timeout: "انتهت مهلة الطلب. حاول مجددًا.",
    failedNote: "لم تُضف الرسالة إلى المحادثة، وأُعيد النص إلى حقل الكتابة.",
    chatLimit: "رسائل كثيرة خلال فترة قصيرة. انتظر دقيقة ثم حاول مجددًا.",
  },
};

export default function App() {
  const [language, setLanguage] = useState<Language>("en");
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [draft, setDraft] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const text = labels[language];

  // Reset context when switching languages to avoid mixing conversations.
  function changeLanguage(value: Language) {
    setLanguage(value);
    setMessages([]);
    setDraft("");
    setError("");
  }

  async function sendMessage(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const message = draft.trim();

    if (!message || loading) return;

    const userMessage: ChatMessage = { role: "user", content: message };
    const previousMessages = messages;

    setMessages([...previousMessages, userMessage]);
    setDraft("");
    setError("");
    setLoading(true);

    // Bound browser waiting time and clear the timer after completion.
    const controller = new AbortController();
    const timer = window.setTimeout(() => controller.abort(), 60000);

    try {
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        signal: controller.signal,
        body: JSON.stringify({
          message,
          language,
          // Send recent text only; provider cards are not conversation input.
          history: previousMessages.slice(-12).map((item) => ({
            role: item.role,
            content: item.content.slice(0, 2000),
          })),
        }),
      });

      // Distinguish application throttling from the AI provider's quota.
      if (!response.ok) {
        const failure = await response.json().catch(() => null);
        const code = failure?.error?.code;

        if (code === "CHAT_RATE_LIMITED") {
          throw new Error("CHAT_LIMIT");
        }

        if (code === "AI_RATE_LIMITED") {
          throw new Error("RATE_LIMIT");
        }

        throw new Error("REQUEST_FAILED");
      }
      const data: ChatResponse = await response.json();

      // Perform a basic response check before rendering.
      if (typeof data.reply !== "string" || !Array.isArray(data.providers)) {
        throw new Error("INVALID_RESPONSE");
      }

      setMessages([
        ...previousMessages,
        userMessage,
        {
          role: "assistant",
          content: data.reply,
          providers: data.providers,
          nextStep: data.nextStep,
          toolTrace: data.toolTrace,
        },
      ]);
    } catch (caught: unknown) {
            const timedOut =
        caught instanceof Error && caught.name === "AbortError";
      const rateLimited =
        caught instanceof Error && caught.message === "RATE_LIMIT";
      const chatLimited =
        caught instanceof Error && caught.message === "CHAT_LIMIT";

      // Show the message for the specific failure source.
      const errorMessage = timedOut
        ? text.timeout
        : chatLimited
          ? text.chatLimit
          : rateLimited
            ? text.rateLimit
            : text.error;

      setError(`${errorMessage} ${text.failedNote}`);

      // Restore the draft and exclude failed turns from future context.
      setMessages(previousMessages);
      setDraft(message);
    } finally {
      window.clearTimeout(timer);
      setLoading(false);
    }
  }

  return (
    <main className="app" dir={language === "ar" ? "rtl" : "ltr"} lang={language}>
      <header className="header">
        <h1>{text.title}</h1>
        <div className="controls">
          <button
            type="button"
            disabled={loading}
            onClick={() => changeLanguage(language === "en" ? "ar" : "en")}
          >
            {language === "en" ? "العربية" : "English"}
          </button>
          <button
            type="button"
            disabled={loading}
            onClick={() => {
              setMessages([]);
              setDraft("");
              setError("");
            }}
          >
            {text.reset}
          </button>
        </div>
      </header>

      <p className="notice">{text.notice}</p>

      <section className="messages" role="log" aria-live="polite">
        {messages.map((item, index) => (
          <article className={`message ${item.role}`} key={index}>
            {/* Render model text as plain text, never as raw HTML. */}
            <p className="message-text" dir="auto">{item.content}</p>

            {item.nextStep && (
              <small className="decision">nextStep: {item.nextStep}</small>
            )}

            {item.providers?.map(({ doctor, hospital }) => (
              <div className="provider" key={doctor.id}>
                <small>{text.demo}</small>
                <h3>{doctor.name[language]}</h3>
                <p>{hospital.name[language]} — {hospital.city[language]}</p>
                <p>{doctor.languages.join(" / ")}</p>
                {doctor.offersSecondOpinion && <p>{text.secondOpinion}</p>}
                <small>{text.noAvailability}</small>
              </div>
            ))}

            {!!item.toolTrace?.length && (
              <details className="trace">
                <summary>{text.tools}</summary>
                {item.toolTrace.map((tool, toolIndex) => (
                  <p key={toolIndex}>
                    {tool.tool}: {tool.resultCount}
                  </p>
                ))}
              </details>
            )}
          </article>
        ))}
        {loading && <p role="status">{text.waiting}</p>}
      </section>

      {error && <p className="error" role="alert">{error}</p>}

      <form onSubmit={sendMessage} className="composer">
        <textarea
          aria-label={text.placeholder}
          placeholder={text.placeholder}
          value={draft}
          onChange={(event) => setDraft(event.target.value)}
          maxLength={2000}
          disabled={loading}
          rows={3}
        />
        <button type="submit" disabled={loading || !draft.trim()}>
          {loading ? text.waiting : text.send}
        </button>
      </form>
    </main>
  );
}