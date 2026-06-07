import { useState } from "react";
import { Dialog } from "@base-ui/react/dialog";
import { X } from "lucide-react";
import { Button } from "../ui/button";
import { useAlbumStore } from "../../store/useAlbumStore";

type CreateTrackDialogProps = {
  albumId: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

const inputClass =
  "w-full rounded-md border bg-background px-3 py-2 text-sm outline-none focus:ring-1 focus:ring-ring transition-colors";

export function CreateTrackDialog({ albumId, open, onOpenChange }: CreateTrackDialogProps) {
  const createTrack = useAlbumStore((s) => s.createTrack);
  const [title, setTitle] = useState("");
  const [genre, setGenre] = useState("");
  const [bpmInput, setBpmInput] = useState("");
  const [key, setKey] = useState("");
  const [concept, setConcept] = useState("");
  const [lyrics, setLyrics] = useState("");

  function reset() {
    setTitle("");
    setGenre("");
    setBpmInput("");
    setKey("");
    setConcept("");
    setLyrics("");
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!title.trim()) return;
    const bpm = bpmInput.trim() ? Number(bpmInput.trim()) : undefined;
    await createTrack(albumId, {
      title: title.trim(),
      genre: genre.trim() || undefined,
      bpm: bpm && !isNaN(bpm) ? bpm : undefined,
      key: key.trim() || undefined,
      concept: concept.trim() || undefined,
      lyrics: lyrics.trim() || undefined,
    });
    reset();
    onOpenChange(false);
  }

  function handleOpenChange(next: boolean) {
    if (!next) reset();
    onOpenChange(next);
  }

  return (
    <Dialog.Root open={open} onOpenChange={handleOpenChange}>
      <Dialog.Portal>
        <Dialog.Backdrop className="fixed inset-0 z-40 bg-black/50" />
        <Dialog.Popup className="fixed left-1/2 top-1/2 z-50 w-full max-w-md -translate-x-1/2 -translate-y-1/2 rounded-lg border bg-background p-6 shadow-lg">
          <div className="mb-5 flex items-center justify-between">
            <Dialog.Title className="text-lg font-semibold">
              New Track
            </Dialog.Title>
            <Dialog.Close
              render={
                <button
                  type="button"
                  className="rounded-sm opacity-70 transition-opacity hover:opacity-100 focus:outline-none"
                >
                  <X className="h-4 w-4" />
                </button>
              }
            />
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-1.5">
              <label className="text-sm font-medium">
                Title <span className="text-destructive">*</span>
              </label>
              <input
                className={inputClass}
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Track title"
                required
                autoFocus
              />
            </div>

            <div className="grid grid-cols-3 gap-3">
              <div className="space-y-1.5">
                <label className="text-sm font-medium">Genre</label>
                <input
                  className={inputClass}
                  value={genre}
                  onChange={(e) => setGenre(e.target.value)}
                  placeholder="Optional"
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-sm font-medium">BPM</label>
                <input
                  className={inputClass}
                  value={bpmInput}
                  onChange={(e) => setBpmInput(e.target.value)}
                  placeholder="120"
                  type="number"
                  min={1}
                  max={300}
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-sm font-medium">Key</label>
                <input
                  className={inputClass}
                  value={key}
                  onChange={(e) => setKey(e.target.value)}
                  placeholder="C major"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-sm font-medium">Concept</label>
              <textarea
                className={`${inputClass} resize-none`}
                value={concept}
                onChange={(e) => setConcept(e.target.value)}
                placeholder="What's this track about?"
                rows={2}
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-sm font-medium">Lyrics</label>
              <textarea
                className={`${inputClass} resize-none`}
                value={lyrics}
                onChange={(e) => setLyrics(e.target.value)}
                placeholder="Lyrics (optional)"
                rows={3}
              />
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <Dialog.Close
                render={
                  <Button type="button" variant="outline">
                    Cancel
                  </Button>
                }
              />
              <Button type="submit" disabled={!title.trim()}>
                Create Track
              </Button>
            </div>
          </form>
        </Dialog.Popup>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
