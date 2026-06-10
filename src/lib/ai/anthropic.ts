export type ClaudeMessage = {
  role: "user" | "assistant";
  content: string;
};

export type ClaudeResponse = {
  rawText: string;
  parseStatus: "success" | "failed";
  parsedJson: unknown;
  errorMessage?: string;
};

export class AnthropicApiError extends Error {
  constructor(
    public status: number,
    message: string
  ) {
    super(message);
    this.name = "AnthropicApiError";
  }
}

export async function callClaude(
  apiKey: string,
  messages: ClaudeMessage[],
  systemPrompt?: string
): Promise<ClaudeResponse> {
  const body: Record<string, unknown> = {
    model: "claude-haiku-4-5-20251001",
    max_tokens: 2048,
    messages,
  };
  if (systemPrompt) body.system = systemPrompt;

  const res = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "x-api-key": apiKey,
      "anthropic-version": "2023-06-01",
      "content-type": "application/json",
    },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    const err = await res.text();
    throw new AnthropicApiError(res.status, err);
  }

  const data = (await res.json()) as { content: Array<{ type: string; text: string }> };
  const rawText = data.content.find((c) => c.type === "text")?.text ?? "";

  let parsedJson: unknown = undefined;
  let parseStatus: "success" | "failed" = "failed";
  let errorMessage: string | undefined;
  try {
    const cleaned = rawText.replace(/^```(?:json)?\n?/m, "").replace(/\n?```$/m, "").trim();
    parsedJson = JSON.parse(cleaned);
    parseStatus = "success";
  } catch (e) {
    errorMessage = e instanceof Error ? e.message : String(e);
  }

  return { rawText, parseStatus, parsedJson, errorMessage };
}
