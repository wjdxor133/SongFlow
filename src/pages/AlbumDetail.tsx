import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { ArrowLeft, Plus, Trash2, Music } from "lucide-react";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Textarea } from "../components/ui/textarea";
import { Badge } from "../components/ui/badge";
import { CreateTrackDialog } from "../components/projects/CreateTrackDialog";
import { useAlbumStore } from "../store/useAlbumStore";
import type { Track } from "../lib/types/album";

function formatDate(iso: string) {
  return new Intl.DateTimeFormat(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(new Date(iso));
}

function TrackCard({
  track,
  albumId,
  effectiveGenre,
  onDelete,
}: {
  track: Track;
  albumId: string;
  effectiveGenre: string;
  onDelete: (id: string) => void;
}) {
  const navigate = useNavigate();

  function handleDelete(e: React.MouseEvent) {
    e.stopPropagation();
    if (window.confirm(`Delete "${track.title}"? This cannot be undone.`)) {
      onDelete(track.id);
    }
  }

  return (
    <div
      className="group relative flex cursor-pointer flex-col gap-2 rounded-lg border bg-card p-4 transition-colors hover:border-foreground/30 hover:bg-accent/50"
      onClick={() => navigate(`/albums/${albumId}/tracks/${track.id}`)}
    >
      <div className="flex items-start justify-between gap-2">
        <h3 className="line-clamp-1 text-sm font-semibold leading-tight">
          {track.title}
        </h3>
        <button
          className="shrink-0 rounded p-1 opacity-0 transition-opacity hover:bg-destructive/10 hover:text-destructive group-hover:opacity-100"
          onClick={handleDelete}
          title="Delete track"
        >
          <Trash2 className="h-3.5 w-3.5" />
        </button>
      </div>

      {track.concept && (
        <p className="line-clamp-1 text-xs text-muted-foreground">
          {track.concept}
        </p>
      )}

      <div className="flex flex-wrap items-center gap-1.5 pt-1">
        {effectiveGenre && (
          <Badge variant="secondary">{effectiveGenre}</Badge>
        )}
        {track.bpm && (
          <Badge variant="secondary">{track.bpm} BPM</Badge>
        )}
        {track.key && (
          <Badge variant="secondary">{track.key}</Badge>
        )}
        <span className="ml-auto shrink-0 text-xs text-muted-foreground">
          {formatDate(track.updatedAt)}
        </span>
      </div>
    </div>
  );
}

export function AlbumDetail() {
  const { albumId } = useParams<{ albumId: string }>();
  const navigate = useNavigate();
  const isLoaded = useAlbumStore((s) => s.isLoaded);
  const album = useAlbumStore((s) => s.albums.find((a) => a.id === albumId));
  const allTracks = useAlbumStore((s) => s.tracks);
  const tracks = allTracks.filter((t) => t.albumId === albumId);
  const updateAlbum = useAlbumStore((s) => s.updateAlbum);
  const deleteTrack = useAlbumStore((s) => s.deleteTrack);
  const getTrackEffectiveGenre = useAlbumStore((s) => s.getTrackEffectiveGenre);

  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState(false);
  const [editTitle, setEditTitle] = useState("");
  const [editGenre, setEditGenre] = useState("");
  const [editConcept, setEditConcept] = useState("");

  useEffect(() => {
    if (!isLoaded) {
      useAlbumStore.getState().init();
    }
  }, [isLoaded]);

  useEffect(() => {
    if (album) {
      setEditTitle(album.title);
      setEditGenre(album.genre);
      setEditConcept(album.concept);
    }
  }, [album]);

  if (!album && isLoaded) {
    return (
      <div className="flex h-full flex-col items-center justify-center gap-4 p-6">
        <p className="text-sm text-muted-foreground">Album not found.</p>
        <Button variant="outline" onClick={() => navigate("/")}>
          <ArrowLeft className="mr-1.5 h-4 w-4" />
          Back to Dashboard
        </Button>
      </div>
    );
  }

  if (!album) return null;

  async function handleSaveEdit(e: React.FormEvent) {
    e.preventDefault();
    await updateAlbum(album!.id, {
      title: editTitle.trim() || album!.title,
      genre: editGenre.trim(),
      concept: editConcept.trim(),
    });
    setEditing(false);
  }

  return (
    <div className="flex h-full flex-col gap-6 p-6 overflow-auto">
      <div className="flex items-center gap-3">
        <Button
          variant="ghost"
          size="sm"
          className="-ml-2"
          onClick={() => navigate("/")}
        >
          <ArrowLeft className="mr-1.5 h-4 w-4" />
          Dashboard
        </Button>
      </div>

      {editing ? (
        <form onSubmit={handleSaveEdit} className="flex flex-col gap-3">
          <Input
            value={editTitle}
            onChange={(e) => setEditTitle(e.target.value)}
            placeholder="Album title"
            required
            autoFocus
          />
          <Input
            value={editGenre}
            onChange={(e) => setEditGenre(e.target.value)}
            placeholder="Genre"
          />
          <Textarea
            value={editConcept}
            onChange={(e) => setEditConcept(e.target.value)}
            placeholder="Concept"
            rows={3}
          />
          <div className="flex gap-2">
            <Button type="submit" size="sm">
              Save
            </Button>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setEditing(false)}
            >
              Cancel
            </Button>
          </div>
        </form>
      ) : (
        <div>
          <div className="flex items-start gap-3">
            <h1 className="text-2xl font-semibold tracking-tight flex-1">
              {album.title}
            </h1>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setEditing(true)}
            >
              Edit
            </Button>
          </div>
          {album.concept && (
            <p className="mt-1 text-sm text-muted-foreground">{album.concept}</p>
          )}
          {album.genre && (
            <div className="mt-2">
              <Badge variant="secondary">{album.genre}</Badge>
            </div>
          )}
        </div>
      )}

      <div className="flex items-center justify-between">
        <h2 className="text-base font-semibold">
          Tracks{" "}
          <span className="text-sm font-normal text-muted-foreground">
            ({tracks.length})
          </span>
        </h2>
        <Button size="sm" onClick={() => setDialogOpen(true)}>
          <Plus className="mr-1.5 h-3.5 w-3.5" />
          New Track
        </Button>
      </div>

      {tracks.length === 0 ? (
        <div className="flex flex-1 items-center justify-center rounded-lg border border-dashed">
          <div className="flex flex-col items-center gap-3 text-center">
            <div className="rounded-full bg-muted p-3">
              <Music className="h-6 w-6 text-muted-foreground" />
            </div>
            <div>
              <p className="text-sm font-medium">No tracks yet</p>
              <p className="mt-1 text-xs text-muted-foreground">
                Click "New Track" to add your first track.
              </p>
            </div>
            <Button size="sm" onClick={() => setDialogOpen(true)}>
              <Plus className="mr-1.5 h-3.5 w-3.5" />
              New Track
            </Button>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {tracks.map((track) => (
            <TrackCard
              key={track.id}
              track={track}
              albumId={album.id}
              effectiveGenre={getTrackEffectiveGenre(track.id)}
              onDelete={deleteTrack}
            />
          ))}
        </div>
      )}

      {albumId && (
        <CreateTrackDialog
          albumId={albumId}
          open={dialogOpen}
          onOpenChange={setDialogOpen}
        />
      )}
    </div>
  );
}
