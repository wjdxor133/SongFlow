import { useState } from "react";
import { Trash2, StickyNote, Plus } from "lucide-react";
import { Button } from "../ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "../ui/dialog";
import { useAlbumStore } from "../../store/useAlbumStore";
import type { Track, TrackNote } from "../../lib/types/album";

function formatDate(iso: string) {
  return new Intl.DateTimeFormat(undefined, {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(iso));
}

interface Props {
  track: Track;
}

export function NotesSection({ track }: Props) {
  const addNote = useAlbumStore((s) => s.addNote);
  const updateTrack = useAlbumStore((s) => s.updateTrack);

  const [open, setOpen] = useState(false);
  const [content, setContent] = useState("");
  const [saving, setSaving] = useState(false);

  async function handleAdd(e: React.FormEvent) {
    e.preventDefault();
    if (!content.trim() || saving) return;

    setSaving(true);
    try {
      const now = new Date().toISOString();
      const note: TrackNote = {
        id: crypto.randomUUID(),
        content: content.trim(),
        createdAt: now,
        updatedAt: now,
      };
      await addNote(track.id, note);
      setContent("");
      setOpen(false);
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(noteId: string) {
    await updateTrack(track.id, {
      notes: track.notes.filter((n) => n.id !== noteId),
    });
  }

  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center justify-between">
        <h2 className="text-sm font-semibold">
          Notes{" "}
          <span className="text-sm font-normal text-muted-foreground">({track.notes.length})</span>
        </h2>
        <Button variant="outline" size="sm" onClick={() => setOpen(true)}>
          <Plus className="h-3.5 w-3.5 mr-1" />
          노트 추가
        </Button>
      </div>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>노트 추가</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleAdd} className="flex flex-col gap-4">
            <textarea
              className="w-full rounded-md border bg-background px-3 py-2 text-sm outline-none focus:ring-1 focus:ring-ring transition-colors resize-none"
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="자유롭게 메모를 남겨보세요..."
              rows={4}
              autoFocus
              onKeyDown={(e) => {
                if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) {
                  e.preventDefault();
                  handleAdd(e as unknown as React.FormEvent);
                }
              }}
            />
            <span className="text-xs text-muted-foreground -mt-2">⌘ + Enter로 빠르게 저장</span>
            <DialogFooter>
              <Button type="button" variant="outline" size="sm" onClick={() => setOpen(false)}>
                취소
              </Button>
              <Button type="submit" size="sm" disabled={!content.trim() || saving}>
                {saving ? "저장 중..." : "추가"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {track.notes.length === 0 ? (
        <div className="flex flex-col items-center justify-center gap-2 rounded-lg border border-dashed py-6 text-center">
          <StickyNote className="h-5 w-5 text-muted-foreground" />
          <p className="text-xs text-muted-foreground">아직 노트가 없어요.</p>
        </div>
      ) : (
        <div className="flex flex-col gap-2">
          {track.notes
            .slice()
            .reverse()
            .map((note) => (
              <NoteCard key={note.id} note={note} onDelete={handleDelete} />
            ))}
        </div>
      )}
    </div>
  );
}

function NoteCard({
  note,
  onDelete,
}: {
  note: TrackNote;
  onDelete: (id: string) => void;
}) {
  return (
    <div className="group flex gap-3 rounded-lg border bg-card p-3">
      <div className="flex-1 min-w-0">
        <p className="whitespace-pre-wrap text-sm leading-relaxed">{note.content}</p>
        <span className="mt-1.5 block text-xs text-muted-foreground">
          {formatDate(note.createdAt)}
        </span>
      </div>
      <button
        onClick={() => onDelete(note.id)}
        className="shrink-0 self-start rounded p-1 opacity-0 transition-opacity hover:bg-destructive/10 hover:text-destructive group-hover:opacity-100"
        title="삭제"
      >
        <Trash2 className="h-3.5 w-3.5" />
      </button>
    </div>
  );
}
