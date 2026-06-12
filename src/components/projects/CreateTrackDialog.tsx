import { useState } from "react";
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

type CreateTrackDialogProps = {
  albumId: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

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
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>New Track</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1.5">
            <label className="text-sm font-medium">
              Title <span className="text-destructive">*</span>
            </label>
            <Input
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
              <Input
                value={genre}
                onChange={(e) => setGenre(e.target.value)}
                placeholder="Optional"
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-sm font-medium">BPM</label>
              <Input
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
              <Input
                value={key}
                onChange={(e) => setKey(e.target.value)}
                placeholder="C major"
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-sm font-medium">Concept</label>
            <Textarea
              value={concept}
              onChange={(e) => setConcept(e.target.value)}
              placeholder="What's this track about?"
              rows={2}
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-sm font-medium">Lyrics</label>
            <Textarea
              value={lyrics}
              onChange={(e) => setLyrics(e.target.value)}
              placeholder="Lyrics (optional)"
              rows={3}
            />
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={!title.trim()}>
              Create Track
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
