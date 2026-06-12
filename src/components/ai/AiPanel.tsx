import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Check, AlertCircle } from "lucide-react";
import { Button } from "../ui/button";
import { Badge } from "../ui/badge";
import { Alert, AlertDescription } from "../ui/alert";
import { useConfigStore } from "../../store/useConfigStore";
import { useAlbumStore } from "../../store/useAlbumStore";
import { callClaude, AnthropicApiError } from "../../lib/ai/anthropic";
import { buildPrompt } from "../../lib/agent/prompts";
import type { AgentTask } from "../../lib/types/agent";
import type { Track } from "../../lib/types/album";
import type { Album } from "../../lib/types/album";

const TASKS: { value: AgentTask; label: string }[] = [
  { value: "generate_song_brief", label: "송 브리프 생성" },
  { value: "generate_suno_prompts", label: "Suno 프롬프트 생성" },
  { value: "generate_sound_keywords", label: "사운드 키워드 생성" },
];

interface AiPanelProps {
  track: Track;
  album: Album;
}

export function AiPanel({ track, album }: AiPanelProps) {
  const navigate = useNavigate();
  const apiKey = useConfigStore((s) => s.config.anthropicApiKey);
  const [selectedTask, setSelectedTask] = useState<AgentTask>("generate_song_brief");
  const [isLoading, setIsLoading] = useState(false);
  const [rawText, setRawText] = useState<string | null>(null);
  const [parseStatus, setParseStatus] = useState<"success" | "failed" | null>(null);
  const [parsedJson, setParsedJson] = useState<unknown>(undefined);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);

  if (!apiKey) {
    return (
      <div className="flex flex-col gap-3 rounded-lg border bg-muted/20 p-4 text-sm">
        <p className="text-foreground">
          API 키가 설정되지 않았어요. 설정 페이지에서 Anthropic API 키를 입력해주세요.
        </p>
        <button
          onClick={() => navigate("/settings")}
          className="self-start text-primary underline underline-offset-2 hover:text-primary/80 transition-colors text-sm"
        >
          설정 페이지로 이동
        </button>
      </div>
    );
  }

  async function handleGenerate() {
    setIsLoading(true);
    setRawText(null);
    setParseStatus(null);
    setParsedJson(undefined);
    setErrorMessage(null);
    setSaved(false);

    try {
      const { instruction, outputSchema } = buildPrompt(selectedTask, track, album);
      const content = `${instruction}\n\nOutput schema:\n${outputSchema}`;
      const result = await callClaude(apiKey, [{ role: "user", content }]);
      setRawText(result.rawText);
      setParseStatus(result.parseStatus);
      setParsedJson(result.parsedJson);
      if (result.errorMessage) setErrorMessage(result.errorMessage);
    } catch (err) {
      if (err instanceof AnthropicApiError) {
        setErrorMessage(`API 오류 (${err.status}): ${err.message}`);
      } else {
        setErrorMessage(err instanceof Error ? err.message : String(err));
      }
    } finally {
      setIsLoading(false);
    }
  }

  async function handleSave() {
    if (rawText === null || parseStatus === null) return;
    const now = new Date().toISOString();
    const responseId = crypto.randomUUID();
    const response = {
      id: responseId,
      requestId: crypto.randomUUID(),
      provider: "claude-api" as const,
      task: selectedTask,
      rawText,
      parsedJson,
      parseStatus,
      errorMessage: errorMessage ?? undefined,
      createdAt: now,
    };
    await useAlbumStore.getState().addAgentResponse(track.id, response);
    setSaved(true);
  }

  return (
    <div className="flex flex-col gap-6">
      {/* Task selector */}
      <div className="flex flex-col gap-2">
        <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
          Agent Task
        </label>
        <div className="flex flex-wrap gap-2">
          {TASKS.map((t) => (
            <button
              key={t.value}
              onClick={() => setSelectedTask(t.value)}
              className={[
                "rounded-md border px-3 py-1.5 text-sm transition-colors",
                selectedTask === t.value
                  ? "border-primary bg-primary text-primary-foreground"
                  : "border-border bg-background hover:bg-muted text-foreground",
              ].join(" ")}
            >
              {t.label}
            </button>
          ))}
        </div>
      </div>

      {/* Generate button */}
      <Button onClick={handleGenerate} disabled={isLoading} className="self-start">
        {isLoading ? "생성 중..." : "Generate"}
      </Button>

      {/* Loading spinner */}
      {isLoading && (
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <span className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
          Claude가 응답을 생성하고 있어요...
        </div>
      )}

      {/* Error */}
      {errorMessage && !isLoading && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{errorMessage}</AlertDescription>
        </Alert>
      )}

      {/* Result */}
      {rawText !== null && !isLoading && (
        <div className="flex flex-col gap-2">
          <div className="flex items-center justify-between">
            <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
              결과
            </label>
            <Badge
              className={
                parseStatus === "success"
                  ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400"
                  : "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400"
              }
            >
              {parseStatus === "success" ? "Parsed" : "Parse failed"}
            </Badge>
          </div>
          <pre className="rounded-lg border bg-muted/40 p-3 text-xs font-mono whitespace-pre-wrap overflow-auto max-h-64 text-foreground">
            {rawText}
          </pre>
          <div className="flex items-center gap-3">
            <Button onClick={handleSave} disabled={saved} size="sm">
              {saved ? (
                <>
                  <Check className="mr-1.5 h-3.5 w-3.5 text-green-600" />
                  저장됨
                </>
              ) : (
                "저장"
              )}
            </Button>
            {saved && (
              <span className="text-xs text-green-600 flex items-center gap-1">
                <Check className="h-3.5 w-3.5" />
                응답이 저장되었어요
              </span>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
