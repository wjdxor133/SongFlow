import type { AgentResponse } from "../types";

type ParseResult = Pick<AgentResponse, "rawText" | "parsedJson" | "parseStatus" | "errorMessage">;

export function parseAgentResponse(rawText: string): ParseResult {
  const trimmed = rawText.trim();

  // Extract JSON from markdown code fences if present
  const fenceMatch = trimmed.match(/```(?:json)?\s*([\s\S]+?)\s*```/);
  const candidate = fenceMatch ? fenceMatch[1].trim() : trimmed;

  try {
    const value = JSON.parse(candidate);
    if (typeof value !== "object" || value === null) {
      return { rawText, parseStatus: "failed", errorMessage: "Response is not a JSON object" };
    }
    return { rawText, parsedJson: value, parseStatus: "success" };
  } catch (err) {
    return {
      rawText,
      parseStatus: "failed",
      errorMessage: err instanceof Error ? err.message : "Unknown parse error",
    };
  }
}
