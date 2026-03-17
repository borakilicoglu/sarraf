import type { AiConfig } from "./aiConfig.js";
import type { ReportWorkspace } from "./reporters.js";

export async function generateAiSummary(
  config: AiConfig,
  workspaces: ReportWorkspace[],
): Promise<string> {
  const prompt = buildPrompt(workspaces);

  if (config.provider === "openai") {
    return callOpenAI(config, prompt);
  }

  if (config.provider === "anthropic") {
    return callAnthropic(config, prompt);
  }

  return callGemini(config, prompt);
}

function buildPrompt(workspaces: ReportWorkspace[]): string {
  const payload = {
    workspaces: workspaces.map(({ workspace, findings, result }) => ({
      workspace: workspace.name,
      relativeDir: workspace.relativeDir,
      findings: findings.map((finding) => ({
        type: finding.type,
        items: finding.items,
      })),
      externalImports: result.externalImports,
      traces: result.packageTraces,
    })),
  };

  return [
    "You are Sarraf AI, a dependency analysis assistant.",
    "Summarize the most important dependency hygiene issues.",
    "Keep the answer short, actionable, and grouped by priority.",
    "If there are no findings, say that clearly.",
    JSON.stringify(payload),
  ].join("\n\n");
}

async function callOpenAI(config: AiConfig, prompt: string): Promise<string> {
  const response = await requestJson("openai", "https://api.openai.com/v1/responses", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${config.token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: config.model ?? "gpt-4.1",
      input: prompt,
    }),
  });

  return parseOpenAIResponse(await parseJsonResponse(response));
}

async function callAnthropic(config: AiConfig, prompt: string): Promise<string> {
  const response = await requestJson("anthropic", "https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "x-api-key": config.token,
      "anthropic-version": "2023-06-01",
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: config.model ?? "claude-sonnet-4-5",
      max_tokens: 700,
      messages: [
        {
          role: "user",
          content: prompt,
        },
      ],
    }),
  });

  return parseAnthropicResponse(await parseJsonResponse(response));
}

async function callGemini(config: AiConfig, prompt: string): Promise<string> {
  const model = config.model ?? "gemini-2.5-flash";
  const response = await requestJson(
    "gemini",
    `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(model)}:generateContent`,
    {
      method: "POST",
      headers: {
        "x-goog-api-key": config.token,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        contents: [
          {
            parts: [{ text: prompt }],
          },
        ],
      }),
    },
  );

  return parseGeminiResponse(await parseJsonResponse(response));
}

async function parseJsonResponse(response: Response): Promise<unknown> {
  const payload = await response.json().catch(() => null);

  if (!response.ok) {
    throw new Error(describeHttpFailure(response.status, payload));
  }

  return payload;
}

async function requestJson(
  provider: string,
  url: string,
  init: RequestInit,
): Promise<Response> {
  try {
    return await fetch(url, init);
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    throw new Error(`AI request to ${provider} failed before a response was received: ${message}`);
  }
}

function parseOpenAIResponse(payload: unknown): string {
  const data = payload as {
    output_text?: string;
    output?: Array<{
      content?: Array<{ text?: string }>;
    }>;
  };

  if (data.output_text?.trim()) {
    return data.output_text.trim();
  }

  const fallback = data.output
    ?.flatMap((item) => item.content ?? [])
    .map((item) => item.text ?? "")
    .join("\n")
    .trim();

  if (!fallback) {
    throw new Error("OpenAI response did not contain text output.");
  }

  return fallback;
}

function parseAnthropicResponse(payload: unknown): string {
  const data = payload as {
    content?: Array<{ type?: string; text?: string }>;
  };
  const text = data.content
    ?.filter((item) => item.type === "text")
    .map((item) => item.text ?? "")
    .join("\n")
    .trim();

  if (!text) {
    throw new Error("Anthropic response did not contain text output.");
  }

  return text;
}

function parseGeminiResponse(payload: unknown): string {
  const data = payload as {
    candidates?: Array<{
      content?: {
        parts?: Array<{ text?: string }>;
      };
    }>;
  };
  const text = data.candidates
    ?.flatMap((candidate) => candidate.content?.parts ?? [])
    .map((part) => part.text ?? "")
    .join("\n")
    .trim();

  if (!text) {
    throw new Error("Gemini response did not contain text output.");
  }

  return text;
}

function describeHttpFailure(status: number, payload: unknown): string {
  if (status === 401 || status === 403) {
    return `AI authentication failed (${status}). Check AI_TOKEN and provider configuration.`;
  }

  if (status === 429) {
    return `AI rate limit exceeded (${status}). Try again later or reduce request frequency.`;
  }

  if (status >= 500) {
    return `AI provider error (${status}). Try again later.`;
  }

  return `AI request failed (${status}): ${JSON.stringify(payload)}`;
}
