import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Trash2, Disc3, Download } from "lucide-react";
import { Button } from "../components/ui/button";
import { Badge } from "../components/ui/badge";
import { ImportAlbumDialog } from "../components/projects/ImportAlbumDialog";
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
  const [confirming, setConfirming] = useState(false);

  function handleDeleteClick(e: React.MouseEvent) {
    e.stopPropagation();
    setConfirming(true);
  }

  function handleConfirm(e: React.MouseEvent) {
    e.stopPropagation();
    onDelete(album.id);
  }

  function handleCancel(e: React.MouseEvent) {
    e.stopPropagation();
    setConfirming(false);
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
        {confirming ? (
          <div className="flex items-center gap-1 shrink-0" onClick={(e) => e.stopPropagation()}>
            <button
              className="rounded px-1.5 py-0.5 text-xs text-destructive hover:bg-destructive/10"
              onClick={handleConfirm}
            >
              삭제
            </button>
            <button
              className="rounded px-1.5 py-0.5 text-xs text-muted-foreground hover:bg-muted"
              onClick={handleCancel}
            >
              취소
            </button>
          </div>
        ) : (
          <button
            className="shrink-0 rounded p-1 opacity-0 transition-opacity hover:bg-destructive/10 hover:text-destructive group-hover:opacity-100"
            onClick={handleDeleteClick}
            title="Delete album"
          >
            <Trash2 className="h-3.5 w-3.5" />
          </button>
        )}
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

function getOnboardingCompleted(): boolean {
  try {
    return localStorage.getItem("songflow.onboarding.completed") === "1";
  } catch {
    return false;
  }
}

export function Dashboard() {
  const albums = useAlbumStore((s) => s.albums);
  const tracks = useAlbumStore((s) => s.tracks);
  const deleteAlbum = useAlbumStore((s) => s.deleteAlbum);
  const isLoaded = useAlbumStore((s) => s.isLoaded);
  const [importOpen, setImportOpen] = useState(false);
  const navigate = useNavigate();
  const [onboardingCompleted, setOnboardingCompleted] = useState(getOnboardingCompleted);

  useEffect(() => {
    if (!isLoaded) {
      useAlbumStore.getState().init();
    }
  }, [isLoaded]);

  // Re-read on mount so returning from the /guided flow reflects the latest state.
  useEffect(() => {
    setOnboardingCompleted(getOnboardingCompleted());
  }, []);

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
        <Button onClick={() => setImportOpen(true)}>
          <Download className="mr-1.5 h-4 w-4" />
          앨범 불러오기
        </Button>
      </div>

      {albums.length === 0 ? (
        <div className="flex flex-1 items-center justify-center rounded-lg border border-dashed">
          <div className="flex flex-col items-center gap-4 text-center max-w-sm">
            <div className="rounded-full bg-muted p-3">
              <Disc3 className="h-6 w-6 text-muted-foreground" />
            </div>
            <div>
              <p className="text-sm font-medium">No albums yet</p>
              <p className="mt-1 text-xs text-muted-foreground">
                처음이라면 가이드 샘플로 SongFlow를 체험해보세요.
              </p>
            </div>
            {!onboardingCompleted ? (
              <div className="flex flex-col items-center gap-2 w-full">
                <Button onClick={() => navigate("/guided")}>
                  🎵 가이드 샘플로 시작하기
                </Button>
                <button
                  className="text-xs text-muted-foreground underline-offset-2 hover:underline"
                  onClick={() => setImportOpen(true)}
                >
                  또는 앨범 불러오기
                </button>
              </div>
            ) : (
              <div className="flex flex-col items-center gap-2 w-full">
                <Button size="sm" onClick={() => setImportOpen(true)}>
                  <Download className="mr-1.5 h-3.5 w-3.5" />
                  앨범 불러오기
                </Button>
                <button
                  className="text-xs text-muted-foreground underline-offset-2 hover:underline"
                  onClick={() => navigate("/guided")}
                >
                  가이드 다시 보기
                </button>
              </div>
            )}
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

      <ImportAlbumDialog open={importOpen} onOpenChange={setImportOpen} />
    </div>
  );
}
