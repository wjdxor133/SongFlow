import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Plus, Trash2, Disc3 } from "lucide-react";
import { Button } from "../components/ui/button";
import { Badge } from "../components/ui/badge";
import { CreateAlbumDialog } from "../components/projects/CreateAlbumDialog";
import { useAlbumStore } from "../store/useAlbumStore";
import type { Album } from "../lib/types/album";

function formatDate(iso: string) {
  return new Intl.DateTimeFormat(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(new Date(iso));
}

function AlbumCard({
  album,
  trackCount,
  onDelete,
}: {
  album: Album;
  trackCount: number;
  onDelete: (id: string) => void;
}) {
  const navigate = useNavigate();

  function handleDelete(e: React.MouseEvent) {
    e.stopPropagation();
    if (window.confirm(`Delete "${album.title}"? This cannot be undone.`)) {
      onDelete(album.id);
    }
  }

  return (
    <div
      className="group relative flex cursor-pointer flex-col gap-3 rounded-lg border bg-card p-4 transition-colors hover:border-foreground/30 hover:bg-accent/50"
      onClick={() => navigate(`/albums/${album.id}`)}
    >
      <div className="flex items-start justify-between gap-2">
        <h3 className="line-clamp-1 text-sm font-semibold leading-tight">
          {album.title}
        </h3>
        <button
          className="shrink-0 rounded p-1 opacity-0 transition-opacity hover:bg-destructive/10 hover:text-destructive group-hover:opacity-100"
          onClick={handleDelete}
          title="Delete album"
        >
          <Trash2 className="h-3.5 w-3.5" />
        </button>
      </div>

      {album.concept && (
        <p className="line-clamp-2 text-xs text-muted-foreground">
          {album.concept}
        </p>
      )}

      <div className="mt-auto flex items-center justify-between gap-2 pt-1">
        <div className="flex items-center gap-1.5 overflow-hidden">
          {album.genre && (
            <Badge variant="secondary" className="truncate">{album.genre}</Badge>
          )}
          <Badge variant="secondary" className="shrink-0">
            {trackCount} track{trackCount !== 1 ? "s" : ""}
          </Badge>
        </div>
        <span className="shrink-0 text-xs text-muted-foreground">
          {formatDate(album.updatedAt)}
        </span>
      </div>
    </div>
  );
}

export function Dashboard() {
  const albums = useAlbumStore((s) => s.albums);
  const tracks = useAlbumStore((s) => s.tracks);
  const deleteAlbum = useAlbumStore((s) => s.deleteAlbum);
  const isLoaded = useAlbumStore((s) => s.isLoaded);
  const [dialogOpen, setDialogOpen] = useState(false);

  useEffect(() => {
    if (!isLoaded) {
      useAlbumStore.getState().init();
    }
  }, [isLoaded]);

  return (
    <div className="flex h-full flex-col gap-6 p-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Dashboard</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {albums.length === 0
              ? "Create your first album to get started."
              : `${albums.length} album${albums.length !== 1 ? "s" : ""}`}
          </p>
        </div>
        <Button onClick={() => setDialogOpen(true)}>
          <Plus className="mr-1.5 h-4 w-4" />
          New Album
        </Button>
      </div>

      {albums.length === 0 ? (
        <div className="flex flex-1 items-center justify-center rounded-lg border border-dashed">
          <div className="flex flex-col items-center gap-3 text-center">
            <div className="rounded-full bg-muted p-3">
              <Disc3 className="h-6 w-6 text-muted-foreground" />
            </div>
            <div>
              <p className="text-sm font-medium">No albums yet</p>
              <p className="mt-1 text-xs text-muted-foreground">
                Click "New Album" to create your first album.
              </p>
            </div>
            <Button size="sm" onClick={() => setDialogOpen(true)}>
              <Plus className="mr-1.5 h-3.5 w-3.5" />
              New Album
            </Button>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {albums.map((album) => (
            <AlbumCard
              key={album.id}
              album={album}
              trackCount={tracks.filter((t) => t.albumId === album.id).length}
              onDelete={deleteAlbum}
            />
          ))}
        </div>
      )}

      <CreateAlbumDialog open={dialogOpen} onOpenChange={setDialogOpen} />
    </div>
  );
}
