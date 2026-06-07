import { useState } from "react";
import { Dialog } from "@base-ui/react/dialog";
import { X } from "lucide-react";
import { Button } from "../ui/button";
import { useProjectStore } from "../../store/useProjectStore";

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

const inputClass =
  "w-full rounded-md border bg-background px-3 py-2 text-sm outline-none focus:ring-1 focus:ring-ring transition-colors";

export function CreateProjectDialog({ open, onOpenChange }: Props) {
  const createProject = useProjectStore((s) => s.createProject);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [genre, setGenre] = useState("");
  const [moodsInput, setMoodsInput] = useState("");
  const [targetVibe, setTargetVibe] = useState("");

  function reset() {
    setTitle("");
    setDescription("");
    setGenre("");
    setMoodsInput("");
    setTargetVibe("");
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!title.trim()) return;
    createProject({
      title: title.trim(),
      description: description.trim(),
      genre: genre.trim(),
      moods: moodsInput
        .split(",")
        .map((m) => m.trim())
        .filter(Boolean),
      targetVibe: targetVibe.trim(),
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
              New Project
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
                placeholder="My Song Project"
                required
                autoFocus
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-sm font-medium">Description</label>
              <textarea
                className={`${inputClass} resize-none`}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="What's this song about?"
                rows={3}
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
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
                <label className="text-sm font-medium">Target Vibe</label>
                <input
                  className={inputClass}
                  value={targetVibe}
                  onChange={(e) => setTargetVibe(e.target.value)}
                  placeholder="Dark, Summer, Chill…"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-sm font-medium">Moods</label>
              <input
                className={inputClass}
                value={moodsInput}
                onChange={(e) => setMoodsInput(e.target.value)}
                placeholder="Upbeat, Nostalgic, Energetic (comma-separated)"
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
                Create Project
              </Button>
            </div>
          </form>
        </Dialog.Popup>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
