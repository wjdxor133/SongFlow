import { useState } from "react";
import { Dialog } from "@base-ui/react/dialog";
import { X } from "lucide-react";
import { Button } from "../ui/button";
import { useAlbumStore } from "../../store/useAlbumStore";

type CreateAlbumDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

const inputClass =
  "w-full rounded-md border bg-background px-3 py-2 text-sm outline-none focus:ring-1 focus:ring-ring transition-colors";

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
    <Dialog.Root open={open} onOpenChange={handleOpenChange}>
      <Dialog.Portal>
        <Dialog.Backdrop className="fixed inset-0 z-40 bg-black/50" />
        <Dialog.Popup className="fixed left-1/2 top-1/2 z-50 w-full max-w-md -translate-x-1/2 -translate-y-1/2 rounded-lg border bg-background p-6 shadow-lg">
          <div className="mb-5 flex items-center justify-between">
            <Dialog.Title className="text-lg font-semibold">
              New Album
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
                placeholder="My Album"
                required
                autoFocus
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-sm font-medium">Genre</label>
              <input
                className={inputClass}
                value={genre}
                onChange={(e) => setGenre(e.target.value)}
                placeholder="Pop, Jazz, Electronic…"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-sm font-medium">Concept</label>
              <textarea
                className={`${inputClass} resize-none`}
                value={concept}
                onChange={(e) => setConcept(e.target.value)}
                placeholder="What's this album about?"
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
                Create Album
              </Button>
            </div>
          </form>
        </Dialog.Popup>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
