import { Copy, Check } from "lucide-react";
import { useState } from "react";
import type { Track } from "../../lib/types/album";

function formatDate(iso: string) {
  return new Intl.DateTimeFormat(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(iso));
}

function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);
  return (
    <button
      onClick={() => {
        navigator.clipboard.writeText(text).then(() => {
          setCopied(true);
          setTimeout(() => setCopied(false), 2000);
        });
      }}
      className="shrink-0 rounded p-1 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
      title="복사"
    >
      {copied ? <Check className="h-3.5 w-3.5 text-green-500" /> : <Copy className="h-3.5 w-3.5" />}
    </button>
  );
}

function BriefCard({ brief }: { brief: Record<string, unknown> }) {
  const rows: { label: string; value: string }[] = [];

  const labelMap: Record<string, string> = {
    title: "제목",
    concept: "컨셉",
    mood: "무드",
    genre: "장르",
    tempo: "템포",
    structure: "구성",
    instruments: "악기",
    vocal_style: "보컬 스타일",
    reference: "레퍼런스",
    keywords: "키워드",
    notes: "추가 메모",
  };

  for (const [key, val] of Object.entries(brief)) {
    if (val == null || val === "") continue;
    const label = labelMap[key] ?? key;
    const value = Array.isArray(val) ? val.join(", ") : String(val);
    rows.push({ label, value });
  }

  if (rows.length === 0) return null;

  return (
    <div className="flex flex-col divide-y rounded-lg border bg-card text-sm overflow-hidden">
      {rows.map(({ label, value }) => (
        <div key={label} className="flex gap-3 px-3 py-2">
          <span className="w-24 shrink-0 text-xs text-muted-foreground pt-0.5">{label}</span>
          <span className="flex-1 leading-relaxed whitespace-pre-wrap">{value}</span>
        </div>
      ))}
    </div>
  );
}

interface Props {
  track: Track;
}

export function SongBriefSection({ track }: Props) {
  const briefs = track.agentResponses.filter((r) => r.task === "generate_song_brief");

  if (briefs.length === 0) return null;

  return (
    <div className="flex flex-col gap-3">
      <h2 className="text-sm font-semibold">
        Song Brief{" "}
        <span className="text-sm font-normal text-muted-foreground">({briefs.length})</span>
      </h2>
      <div className="flex flex-col gap-3">
        {briefs
          .slice()
          .reverse()
          .map((brief) => (
            <div key={brief.id} className="flex flex-col gap-2">
              <div className="flex items-center justify-between">
                <span className="text-xs text-muted-foreground">{formatDate(brief.createdAt)}</span>
                <div className="flex items-center gap-1">
                  <span
                    className={[
                      "inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium",
                      brief.parseStatus === "success"
                        ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400"
                        : "bg-muted text-muted-foreground",
                    ].join(" ")}
                  >
                    {brief.parseStatus === "success" ? "파싱됨" : "원본"}
                  </span>
                  <CopyButton text={brief.rawText} />
                </div>
              </div>
              {brief.parseStatus === "success" &&
              brief.parsedJson &&
              typeof brief.parsedJson === "object" &&
              !Array.isArray(brief.parsedJson) ? (
                <BriefCard brief={brief.parsedJson as Record<string, unknown>} />
              ) : (
                <pre className="rounded-lg border bg-muted/40 p-3 text-xs font-mono whitespace-pre-wrap overflow-auto max-h-64">
                  {brief.rawText}
                </pre>
              )}
            </div>
          ))}
      </div>
    </div>
  );
}
