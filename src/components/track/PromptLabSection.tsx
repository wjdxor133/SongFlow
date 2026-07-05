import { useState } from "react";
import { Pencil, Trash2, X } from "lucide-react";
import { Button } from "../ui/button";
import { Textarea } from "../ui/textarea";
import { useAlbumStore } from "../../store/useAlbumStore";
import type { Track } from "../../lib/types/album";
import type { GeneratedPrompt } from "../../lib/types/prompt";
import { CopyButton } from "../ui/CopyButton";

function formatDate(iso: string) {
  return new Intl.DateTimeFormat(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(iso));
}

interface PromptCardProps {
  prompt: GeneratedPrompt;
  onDelete: (id: string) => void;
  onSave: (updated: GeneratedPrompt) => void;
}

function PromptCard({ prompt, onDelete, onSave }: PromptCardProps) {
  const [editing, setEditing] = useState(false);
  const [editStyle, setEditStyle] = useState(prompt.style);
  const [editLyrics, setEditLyrics] = useState(prompt.lyrics);

  function handleStartEdit() {
    setEditStyle(prompt.style);
    setEditLyrics(prompt.lyrics);
    setEditing(true);
  }

  function handleSave() {
    onSave({ ...prompt, style: editStyle, lyrics: editLyrics });
    setEditing(false);
  }

  function handleCancel() {
    setEditing(false);
    setEditStyle(prompt.style);
    setEditLyrics(prompt.lyrics);
  }

  return (
    <div className="rounded-lg border bg-muted/20 p-3 flex flex-col gap-3">
      <div className="flex items-center justify-between">
        <span className="text-xs font-medium text-muted-foreground">Suno Prompt</span>
        <div className="flex items-center gap-1">
          <span className="text-xs text-muted-foreground">{formatDate(prompt.createdAt)}</span>
          {!editing && (
            <>
              <button
                onClick={handleStartEdit}
                className="rounded p-1 text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
                title="편집"
              >
                <Pencil className="h-3.5 w-3.5" />
              </button>
              <button
                onClick={() => onDelete(prompt.id)}
                className="rounded p-1 text-muted-foreground hover:bg-destructive/10 hover:text-destructive transition-colors"
                title="삭제"
              >
                <Trash2 className="h-3.5 w-3.5" />
              </button>
            </>
          )}
          {editing && (
            <button
              onClick={handleCancel}
              className="rounded p-1 text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
              title="취소"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          )}
        </div>
      </div>

      {editing ? (
        <div className="flex flex-col gap-2">
          <div className="flex flex-col gap-1">
            <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
              Style of Music
            </label>
            <Textarea
              value={editStyle}
              onChange={(e) => setEditStyle(e.target.value)}
              rows={3}
            />
          </div>
          <div className="flex flex-col gap-1">
            <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
              Lyrics
            </label>
            <Textarea
              value={editLyrics}
              onChange={(e) => setEditLyrics(e.target.value)}
              rows={6}
            />
          </div>
          <div className="flex gap-2">
            <Button size="sm" onClick={handleSave}>
              저장
            </Button>
            <Button size="sm" variant="outline" onClick={handleCancel}>
              취소
            </Button>
          </div>
        </div>
      ) : (
        <>
          {prompt.style && (
            <div className="flex flex-col gap-1">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                  Style of Music
                </span>
                <CopyButton text={prompt.style} />
              </div>
              <p className="text-sm bg-background rounded p-2 border leading-relaxed">
                {prompt.style}
              </p>
            </div>
          )}
          {prompt.lyrics && (
            <div className="flex flex-col gap-1">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                  Lyrics
                </span>
                <CopyButton text={prompt.lyrics} />
              </div>
              <pre className="text-sm bg-background rounded p-2 border whitespace-pre-wrap font-sans leading-relaxed">
                {prompt.lyrics}
              </pre>
            </div>
          )}
          {prompt.moreRefreshing && (
            <p className="text-sm">
              <span className="font-medium">Refreshing:</span> {prompt.moreRefreshing}
            </p>
          )}
          {prompt.moreEmotional && (
            <p className="text-sm">
              <span className="font-medium">Emotional:</span> {prompt.moreEmotional}
            </p>
          )}
        </>
      )}
    </div>
  );
}

function SunoSettingsCard({ settings }: { settings: NonNullable<Track["sunoSettings"]> }) {
  const rows: { label: string; value: string }[] = [
    { label: "Weirdness", value: `${settings.weirdness}%` },
    { label: "Style Influence", value: `${settings.styleInfluence}%` },
    {
      label: "Audio Influence",
      value: settings.audioInfluence == null ? "Off" : `${settings.audioInfluence}%`,
    },
  ];
  return (
    <div className="rounded-lg border bg-muted/20 p-3 flex flex-col gap-2">
      <span className="text-xs font-medium text-muted-foreground">Suno Settings</span>
      <div className="grid grid-cols-3 gap-2">
        {rows.map((r) => (
          <div key={r.label} className="rounded bg-background border p-2 flex flex-col gap-0.5">
            <span className="text-[10px] uppercase tracking-wide text-muted-foreground">{r.label}</span>
            <span className="text-sm font-semibold">{r.value}</span>
          </div>
        ))}
      </div>
      {settings.excludeStyles && (
        <div className="flex flex-col gap-1">
          <div className="flex items-center justify-between">
            <span className="text-[10px] uppercase tracking-wide text-muted-foreground">Exclude Styles</span>
            <CopyButton text={settings.excludeStyles} />
          </div>
          <p className="text-sm bg-background rounded p-2 border leading-relaxed">
            {settings.excludeStyles}
          </p>
        </div>
      )}
      {settings.expectedStyle && (
        <div className="flex flex-col gap-1">
          <div className="flex items-center justify-between">
            <span className="text-[10px] uppercase tracking-wide text-muted-foreground">Expected</span>
            <CopyButton text={settings.expectedStyle} />
          </div>
          <p className="text-sm bg-background rounded p-2 border leading-relaxed">
            {settings.expectedStyle}
          </p>
        </div>
      )}
    </div>
  );
}

interface Props {
  track: Track;
}

export function PromptLabSection({ track }: Props) {
  const updateTrack = useAlbumStore((s) => s.updateTrack);

  if (track.prompts.length === 0 && !track.sunoSettings) return null;

  async function handleDelete(id: string) {
    await updateTrack(track.id, {
      prompts: track.prompts.filter((p) => p.id !== id),
    });
  }

  async function handleSave(updated: GeneratedPrompt) {
    await updateTrack(track.id, {
      prompts: track.prompts.map((p) => (p.id === updated.id ? updated : p)),
    });
  }

  return (
    <div className="flex flex-col gap-3">
      <h2 className="text-sm font-semibold">Prompt Lab</h2>
      <div className="flex flex-col gap-2">
        {track.prompts
          .slice()
          .reverse()
          .map((prompt) => (
            <PromptCard
              key={prompt.id}
              prompt={prompt}
              onDelete={handleDelete}
              onSave={handleSave}
            />
          ))}
        {track.sunoSettings && <SunoSettingsCard settings={track.sunoSettings} />}
      </div>
    </div>
  );
}
