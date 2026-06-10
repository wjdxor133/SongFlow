import { useState } from "react";
import { Plus, Trash2, Music2 } from "lucide-react";
import { Button } from "../ui/button";
import { useAlbumStore } from "../../store/useAlbumStore";
import type { Track } from "../../lib/types/album";
import type { ReferenceSong } from "../../lib/types/reference";

const inputClass =
  "w-full rounded-md border bg-background px-3 py-2 text-sm outline-none focus:ring-1 focus:ring-ring transition-colors";

interface Props {
  track: Track;
}

export function ReferenceSongSection({ track }: Props) {
  const updateTrack = useAlbumStore((s) => s.updateTrack);

  const [title, setTitle] = useState("");
  const [artist, setArtist] = useState("");
  const [notes, setNotes] = useState("");
  const [isAdding, setIsAdding] = useState(false);

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
    setIsAdding(false);
  }

  async function handleDelete(refId: string) {
    await updateTrack(track.id, {
      references: track.references.filter((r) => r.id !== refId),
    });
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
        {!isAdding && (
          <Button size="sm" variant="outline" onClick={() => setIsAdding(true)}>
            <Plus className="mr-1.5 h-3.5 w-3.5" />
            추가
          </Button>
        )}
      </div>

      {isAdding && (
        <form
          onSubmit={handleAdd}
          className="rounded-lg border bg-muted/10 p-3 flex flex-col gap-2"
        >
          <div className="grid grid-cols-2 gap-2">
            <div className="space-y-1">
              <label className="text-xs text-muted-foreground">곡 제목 *</label>
              <input
                className={inputClass}
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="예: Blinding Lights"
                required
                autoFocus
              />
            </div>
            <div className="space-y-1">
              <label className="text-xs text-muted-foreground">아티스트</label>
              <input
                className={inputClass}
                value={artist}
                onChange={(e) => setArtist(e.target.value)}
                placeholder="예: The Weeknd"
              />
            </div>
          </div>
          <div className="space-y-1">
            <label className="text-xs text-muted-foreground">메모</label>
            <textarea
              className={`${inputClass} resize-none`}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="어떤 요소를 참고하고 싶은지 적어주세요"
              rows={2}
            />
          </div>
          <div className="flex gap-2">
            <Button type="submit" size="sm">
              추가
            </Button>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => {
                setIsAdding(false);
                setTitle("");
                setArtist("");
                setNotes("");
              }}
            >
              취소
            </Button>
          </div>
        </form>
      )}

      {track.references.length === 0 && !isAdding ? (
        <div className="flex flex-col items-center justify-center gap-2 rounded-lg border border-dashed py-6 text-center">
          <Music2 className="h-6 w-6 text-muted-foreground" />
          <p className="text-xs text-muted-foreground">
            레퍼런스 곡을 추가하면 AI가 분석에 활용할 수 있어요.
          </p>
        </div>
      ) : (
        track.references.length > 0 && (
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
        )
      )}
    </div>
  );
}
