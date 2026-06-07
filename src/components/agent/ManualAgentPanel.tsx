import { useState } from "react";
import { Check, ClipboardCopy } from "lucide-react";
import { Button } from "../ui/button";
import { useProjectStore } from "../../store/useProjectStore";
import { buildAgentRequestPayload, buildCopyablePrompt } from "../../lib/agent/prompts";
import { parseAgentResponse } from "../../lib/agent/parser";
import type { AgentTask, SongProject } from "../../lib/types";

const TASKS: { value: AgentTask; label: string }[] = [
  { value: "generate_song_brief", label: "Generate Song Brief" },
  { value: "analyze_reference_song", label: "Analyze Reference Song" },
  { value: "generate_suno_prompts", label: "Generate Suno Prompts" },
  { value: "generate_sound_keywords", label: "Generate Sound Keywords" },
  { value: "refine_suno_prompt", label: "Refine Suno Prompt" },
];

function formatDate(iso: string) {
  return new Intl.DateTimeFormat(undefined, {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(iso));
}

interface ManualAgentPanelProps {
  project: SongProject;
}

export function ManualAgentPanel({ project }: ManualAgentPanelProps) {
  const [selectedTask, setSelectedTask] = useState<AgentTask>("generate_song_brief");
  const [responseText, setResponseText] = useState("");
  const [copied, setCopied] = useState(false);
  const [lastSaved, setLastSaved] = useState<string | null>(null);

  const { addAgentRequest, addAgentResponse } = useProjectStore();

  const promptText = buildCopyablePrompt(selectedTask, project);

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(promptText);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Clipboard unavailable — fall through silently
    }
  }

  function handleSaveResponse() {
    if (!responseText.trim()) return;

    const requestPayload = buildAgentRequestPayload(selectedTask, project);
    const requestId = crypto.randomUUID();
    const now = new Date().toISOString();

    const request = { ...requestPayload, id: requestId, createdAt: now };
    addAgentRequest(project.id, request);

    const parsed = parseAgentResponse(responseText);
    const responseId = crypto.randomUUID();
    addAgentResponse(project.id, {
      id: responseId,
      requestId,
      provider: project.agentProvider,
      ...parsed,
      createdAt: now,
    });

    setLastSaved(responseId);
    setResponseText("");
  }

  const recentInteractions = project.agentRequests
    .slice()
    .reverse()
    .slice(0, 5)
    .map((req) => ({
      request: req,
      response: project.agentResponses.find((r) => r.requestId === req.id),
    }));

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

      {/* Generated prompt */}
      <div className="flex flex-col gap-2">
        <div className="flex items-center justify-between">
          <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
            Generated Prompt
          </label>
          <Button variant="outline" size="sm" onClick={handleCopy}>
            {copied ? (
              <>
                <Check className="mr-1.5 h-3.5 w-3.5 text-green-600" />
                Copied
              </>
            ) : (
              <>
                <ClipboardCopy className="mr-1.5 h-3.5 w-3.5" />
                Copy Prompt
              </>
            )}
          </Button>
        </div>
        <pre className="rounded-lg border bg-muted/40 p-3 text-xs font-mono whitespace-pre-wrap overflow-auto max-h-64 text-foreground">
          {promptText}
        </pre>
        <p className="text-xs text-muted-foreground">
          Copy this prompt, paste it into your AI agent, then paste the response below.
        </p>
      </div>

      {/* Response input */}
      <div className="flex flex-col gap-2">
        <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
          Paste Agent Response
        </label>
        <textarea
          value={responseText}
          onChange={(e) => setResponseText(e.target.value)}
          placeholder="Paste the agent's JSON response here..."
          rows={8}
          className="rounded-lg border bg-background px-3 py-2 text-sm font-mono resize-y outline-none focus:border-ring focus:ring-3 focus:ring-ring/50 placeholder:text-muted-foreground"
        />
        <div className="flex items-center justify-between">
          {lastSaved && (
            <span className="text-xs text-green-600 flex items-center gap-1">
              <Check className="h-3.5 w-3.5" />
              Response saved
            </span>
          )}
          <Button
            onClick={handleSaveResponse}
            disabled={!responseText.trim()}
            className="ml-auto"
          >
            Save Response
          </Button>
        </div>
      </div>

      {/* History */}
      {recentInteractions.length > 0 && (
        <div className="flex flex-col gap-3">
          <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
            Recent Interactions
          </label>
          <div className="flex flex-col gap-2">
            {recentInteractions.map(({ request, response }) => (
              <div
                key={request.id}
                className="rounded-lg border bg-muted/20 p-3 flex flex-col gap-1.5"
              >
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">
                    {TASKS.find((t) => t.value === request.task)?.label ?? request.task}
                  </span>
                  <span className="text-xs text-muted-foreground">
                    {formatDate(request.createdAt)}
                  </span>
                </div>
                {response && (
                  <div className="flex items-center gap-1.5">
                    <span
                      className={[
                        "inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium",
                        response.parseStatus === "success"
                          ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400"
                          : "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400",
                      ].join(" ")}
                    >
                      {response.parseStatus === "success" ? "Parsed" : "Parse failed"}
                    </span>
                    {response.parseStatus === "failed" && response.errorMessage && (
                      <span className="text-xs text-muted-foreground truncate max-w-[240px]">
                        {response.errorMessage}
                      </span>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
