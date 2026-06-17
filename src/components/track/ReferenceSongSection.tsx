import { useState } from "react";
import { Plus, Trash2, Music2, Sparkles, Loader2, Check } from "lucide-react";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { Textarea } from "../ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "../ui/dialog";
import { useAlbumStore } from "../../store/useAlbumStore";
import { useConfigStore } from "../../store/useConfigStore";
import { callClaude } from "../../lib/ai/anthropic";
import type { Track } from "../../lib/types/album";
import type { ReferenceSong } from "../../lib/types/reference";

type SuggestedSong = {
  title: string;
  artist: string;
  reason: string;
};

interface Props {
  track: Track;
}

export function ReferenceSongSection({ track }: Props) {
  const updateTrack = useAlbumStore((s) => s.updateTrack);
  const apiKey = useConfigStore((s) => s.config.anthropicApiKey);

  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [artist, setArtist] = useState("");
  const [notes, setNotes] = useState("");

  const [isSuggesting, setIsSuggesting] = useState(false);
  const [suggestions, setSuggestions] = useState<SuggestedSong[]>([]);
  const [addedSuggestions, setAddedSuggestions] = useState<Set<number>>(new Set());

  async function handleAdd(e: React.FormEvent) {
    e.preventDefault();
    if (!title.trim()) return;

    const newRef: ReferenceSong = {
      id: crypto.randomUUID(),
      title: title.trim(),
      artist: artist.trim(),
      notes: notes.trim(),
      createdAt: new Date().toISOString(),
    };

    await updateTrack(track.id, {
      references: [...track.references, newRef],
    });

    setTitle("");
    setArtist("");
    setNotes("");
    setOpen(false);
  }

  async function handleDelete(refId: string) {
    await updateTrack(track.id, {
      references: track.references.filter((r) => r.id !== refId),
    });
  }

  async function handleSuggest() {
    if (!apiKey || isSuggesting) return;
    setIsSuggesting(true);
    setSuggestions([]);
    setAddedSuggestions(new Set());
    try {
      const sourceInfo = track.sourceTrack
        ? `원곡: ${track.sourceTrack.artist} — ${track.sourceTrack.title} (${track.sourceTrack.album ?? ""})`
        : `트랙: ${track.title}`;
      const genreInfo = track.genre ? `장르: ${track.genre}` : "";
      const prompt = [
        sourceInfo,
        genreInfo,
        track.concept ? `컨셉: ${track.concept}` : "",
        "위 곡과 비슷한 레퍼런스 곡 5개를 추천해줘. JSON 배열로만 응답해. 형식: [{\"title\":\"곡제목\",\"artist\":\"아티스트\",\"reason\":\"추천 이유 한 줄\"}]",
      ].filter(Boolean).join("\n");

      const result = await callClaude(apiKey, [{ role: "user", content: prompt }]);
      if (result.parseStatus === "success" && Array.isArray(result.parsedJson)) {
        setSuggestions(result.parsedJson as SuggestedSong[]);
      } else {
        setSuggestions([]);
      }
    } finally {
      setIsSuggesting(false);
    }
  }

  async function handleAddSuggestion(s: SuggestedSong, idx: number) {
    const newRef: ReferenceSong = {
      id: crypto.randomUUID(),
      title: s.title,
      artist: s.artist,
      notes: s.reason,
      createdAt: new Date().toISOString(),
    };
    await updateTrack(track.id, {
      references: [...track.references, newRef],
    });
    setAddedSuggestions((prev) => new Set(prev).add(idx));
  }

  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center justify-between">
        <h2 className="text-sm font-semibold">
          레퍼런스 곡{" "}
          <span className="text-sm font-normal text-muted-foreground">
            ({track.references.length})
          </span>
        </h2>
        <div className="flex items-center gap-1.5">
          {apiKey && (
            <Button
              size="sm"
              variant="ghost"
              onClick={handleSuggest}
              disabled={isSuggesting}
              className="text-xs"
            >
              {isSuggesting ? (
                <Loader2 className="mr-1 h-3.5 w-3.5 animate-spin" />
              ) : (
                <Sparkles className="mr-1 h-3.5 w-3.5" />
              )}
              AI 제안
            </Button>
          )}
          <Button size="sm" variant="outline" onClick={() => setOpen(true)}>
            <Plus className="mr-1.5 h-3.5 w-3.5" />
            추가
          </Button>
        </div>
      </div>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>레퍼런스 곡 추가</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleAdd} className="flex flex-col gap-3">
            <div className="grid grid-cols-2 gap-2">
              <div className="space-y-1">
                <label className="text-xs text-muted-foreground">곡 제목 *</label>
                <Input
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="예: Blinding Lights"
                  required
                  autoFocus
                />
              </div>
              <div className="space-y-1">
                <label className="text-xs text-muted-foreground">아티스트</label>
                <Input
                  value={artist}
                  onChange={(e) => setArtist(e.target.value)}
                  placeholder="예: The Weeknd"
                />
              </div>
            </div>
            <div className="space-y-1">
              <label className="text-xs text-muted-foreground">메모</label>
              <Textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="어떤 요소를 참고하고 싶은지 적어주세요"
                rows={2}
              />
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" size="sm" onClick={() => setOpen(false)}>취소</Button>
              <Button type="submit" size="sm" disabled={!title.trim()}>추가</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {suggestions.length > 0 && (
        <div className="flex flex-col gap-1.5 rounded-lg border bg-muted/20 p-3">
          <p className="text-xs font-medium text-muted-foreground mb-1">AI 제안 레퍼런스</p>
          {suggestions.map((s, idx) => (
            <div key={idx} className="flex items-center justify-between gap-2">
              <div className="flex-1 min-w-0">
                <span className="text-xs font-medium">{s.artist} — {s.title}</span>
                <span className="text-xs text-muted-foreground ml-1.5">{s.reason}</span>
              </div>
              <Button
                size="sm"
                variant={addedSuggestions.has(idx) ? "ghost" : "outline"}
                className="h-6 px-2 text-xs shrink-0"
                disabled={addedSuggestions.has(idx)}
                onClick={() => handleAddSuggestion(s, idx)}
              >
                {addedSuggestions.has(idx) ? <><Check className="h-3 w-3 mr-1" />추가됨</> : "추가"}
              </Button>
            </div>
          ))}
        </div>
      )}

      {track.references.length === 0 && suggestions.length === 0 ? (
        <div className="flex flex-col items-center justify-center gap-2 rounded-lg border border-dashed py-6 text-center">
          <Music2 className="h-6 w-6 text-muted-foreground" />
          <p className="text-xs text-muted-foreground">
            레퍼런스 곡을 추가하면 AI가 분석에 활용할 수 있어요.
          </p>
        </div>
      ) : track.references.length > 0 ? (
        <div className="flex flex-col gap-2">
          {track.references.map((ref) => (
            <div
              key={ref.id}
              className="group flex items-start gap-3 rounded-lg border bg-card p-3"
            >
              <div className="flex-1 min-w-0">
                <div className="flex items-baseline gap-2">
                  <span className="text-sm font-medium truncate">{ref.title}</span>
                  {ref.artist && (
                    <span className="text-xs text-muted-foreground truncate">
                      — {ref.artist}
                    </span>
                  )}
                </div>
                {ref.notes && (
                  <p className="mt-0.5 text-xs text-muted-foreground line-clamp-2">
                    {ref.notes}
                  </p>
                )}
              </div>
              <button
                className="shrink-0 rounded p-1 opacity-0 transition-opacity hover:bg-destructive/10 hover:text-destructive group-hover:opacity-100"
                onClick={() => handleDelete(ref.id)}
                title="삭제"
              >
                <Trash2 className="h-3.5 w-3.5" />
              </button>
            </div>
          ))}
        </div>
      ) : null}
    </div>
  );
}
