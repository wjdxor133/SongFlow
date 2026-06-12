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

type CreateAlbumDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

export function CreateAlbumDialog({ open, onOpenChange }: CreateAlbumDialogProps) {
  const createAlbum = useAlbumStore((s) => s.createAlbum);
  const [title, setTitle] = useState("");
  const [genre, setGenre] = useState("");
  const [concept, setConcept] = useState("");

  function reset() {
    setTitle("");
    setGenre("");
    setConcept("");
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!title.trim()) return;
    await createAlbum({
      title: title.trim(),
      genre: genre.trim(),
      concept: concept.trim(),
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
          <DialogTitle>New Album</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1.5">
            <label className="text-sm font-medium">
              Title <span className="text-destructive">*</span>
            </label>
            <Input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="My Album"
              required
              autoFocus
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-sm font-medium">Genre</label>
            <Input
              value={genre}
              onChange={(e) => setGenre(e.target.value)}
              placeholder="Pop, Jazz, Electronic…"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-sm font-medium">Concept</label>
            <Textarea
              value={concept}
              onChange={(e) => setConcept(e.target.value)}
              placeholder="What's this album about?"
              rows={3}
            />
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={!title.trim()}>
              Create Album
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
