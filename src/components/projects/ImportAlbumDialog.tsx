import { useState } from "react";
import { Search, Loader2, Music2, Check } from "lucide-react";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "../ui/dialog";
import { useAlbumStore } from "../../store/useAlbumStore";
import { useConfigStore } from "../../store/useConfigStore";
import {
  getSpotifyToken,
  searchSpotifyAlbum,
  getSpotifyAlbumTracks,
  getAudioFeaturesBatch,
  getArtistGenres,
  formatSpotifyKey,
  type SpotifyAlbum,
  type SpotifyTrack,
} from "../../lib/spotify";

type ImportAlbumDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

export function ImportAlbumDialog({ open, onOpenChange }: ImportAlbumDialogProps) {
  const createAlbum = useAlbumStore((s) => s.createAlbum);
  const createTrack = useAlbumStore((s) => s.createTrack);
  const config = useConfigStore((s) => s.config);

  const [artist, setArtist] = useState("");
  const [albumName, setAlbumName] = useState("");
  const [isSearching, setIsSearching] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  const [searchError, setSearchError] = useState<string | null>(null);

  const [foundAlbum, setFoundAlbum] = useState<SpotifyAlbum | null>(null);
  const [tracks, setTracks] = useState<SpotifyTrack[]>([]);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  const hasSpotifyKeys = config.spotifyClientId && config.spotifyClientSecret;

  function reset() {
    setArtist("");
    setAlbumName("");
    setIsSearching(false);
    setIsImporting(false);
    setSearchError(null);
    setFoundAlbum(null);
    setTracks([]);
    setSelectedIds(new Set());
  }

  async function handleSearch(e: React.FormEvent) {
    e.preventDefault();
    if (!artist.trim() || !albumName.trim()) return;
    if (!hasSpotifyKeys) {
      setSearchError("Settings에서 Spotify Client ID/Secret을 입력해주세요.");
      return;
    }

    setIsSearching(true);
    setSearchError(null);
    setFoundAlbum(null);
    setTracks([]);
    setSelectedIds(new Set());

    try {
      const token = await getSpotifyToken(config.spotifyClientId, config.spotifyClientSecret);
      const albums = await searchSpotifyAlbum(token, artist.trim(), albumName.trim());

      if (!albums.length) {
        setSearchError("앨범을 찾을 수 없어요. 아티스트/앨범 이름을 확인해주세요.");
        return;
      }

      const album = albums[0];
      setFoundAlbum(album);

      const albumTracks = await getSpotifyAlbumTracks(token, album.id);
      setTracks(albumTracks);
      setSelectedIds(new Set(albumTracks.map((t) => t.id)));
    } catch (err) {
      setSearchError(err instanceof Error ? err.message : "검색 실패. 다시 시도해주세요.");
    } finally {
      setIsSearching(false);
    }
  }

  function toggleTrack(id: string) {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function toggleAll() {
    if (selectedIds.size === tracks.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(tracks.map((t) => t.id)));
    }
  }

  async function handleImport() {
    if (!foundAlbum || !selectedIds.size) return;

    setIsImporting(true);
    try {
      const token = await getSpotifyToken(config.spotifyClientId, config.spotifyClientSecret);
      const albumArtist = foundAlbum.artists[0]?.name ?? artist.trim();
      const artistId = foundAlbum.artists[0]?.id;
      const year = foundAlbum.release_date
        ? Number(foundAlbum.release_date.slice(0, 4))
        : undefined;

      const selectedTracks = tracks.filter((t) => selectedIds.has(t.id));
      const selectedIds_ = selectedTracks.map((t) => t.id);

      const [audioFeaturesMap, genres] = await Promise.all([
        getAudioFeaturesBatch(token, selectedIds_).catch(() => new Map()),
        artistId ? getArtistGenres(token, artistId).catch(() => []) : Promise.resolve([]),
      ]);

      const genre = genres[0] ?? "";

      const newAlbum = await createAlbum({
        title: `${albumArtist} — ${foundAlbum.name}`,
        genre,
        concept: `${albumArtist}의 앨범 '${foundAlbum.name}'을 레퍼런스로 작업합니다.`,
      });

      for (const t of selectedTracks) {
        const features = audioFeaturesMap.get(t.id);
        const bpm = features ? Math.round(features.tempo) : undefined;
        const key = features ? formatSpotifyKey(features.key, features.mode) : undefined;

        await createTrack(newAlbum.id, {
          title: t.name,
          genre: genre || undefined,
          bpm,
          key,
          sourceTrack: {
            spotifyId: t.id,
            artist: albumArtist,
            album: foundAlbum.name,
            title: t.name,
            year,
          },
        });
      }

      reset();
      onOpenChange(false);
    } catch (err) {
      setSearchError(err instanceof Error ? err.message : "가져오기 실패.");
    } finally {
      setIsImporting(false);
    }
  }

  function handleOpenChange(next: boolean) {
    if (!next) reset();
    onOpenChange(next);
  }

  const allSelected = tracks.length > 0 && selectedIds.size === tracks.length;

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>앨범 불러오기</DialogTitle>
        </DialogHeader>

        <div className="flex flex-col gap-4">
          {!hasSpotifyKeys && (
            <div className="rounded-md bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 p-3 text-xs text-amber-700 dark:text-amber-400">
              Settings에서 Spotify Client ID/Secret을 먼저 등록해주세요.
            </div>
          )}

          <form onSubmit={handleSearch} className="flex flex-col gap-2">
            <div className="flex items-end gap-2">
              <div className="flex-1 space-y-1">
                <label className="text-xs text-muted-foreground">아티스트</label>
                <Input
                  value={artist}
                  onChange={(e) => setArtist(e.target.value)}
                  placeholder="예: NewJeans"
                  autoFocus
                  disabled={isSearching || isImporting}
                />
              </div>
              <div className="flex-1 space-y-1">
                <label className="text-xs text-muted-foreground">앨범 이름</label>
                <Input
                  value={albumName}
                  onChange={(e) => setAlbumName(e.target.value)}
                  placeholder="예: Get Up"
                  disabled={isSearching || isImporting}
                />
              </div>
              <Button
                type="submit"
                size="sm"
                variant="outline"
                disabled={!artist.trim() || !albumName.trim() || isSearching || isImporting}
              >
                {isSearching ? (
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                ) : (
                  <Search className="h-3.5 w-3.5" />
                )}
              </Button>
            </div>
          </form>

          {searchError && (
            <p className="text-xs text-destructive">{searchError}</p>
          )}

          {foundAlbum && (
            <div className="flex flex-col gap-2">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium">{foundAlbum.name}</p>
                  <p className="text-xs text-muted-foreground">
                    {foundAlbum.artists.map((a) => a.name).join(", ")} · {foundAlbum.release_date?.slice(0, 4)} · {foundAlbum.total_tracks}곡
                  </p>
                </div>
                <button
                  onClick={toggleAll}
                  className="text-xs text-primary hover:underline"
                >
                  {allSelected ? "전체 해제" : "전체 선택"}
                </button>
              </div>

              <div className="max-h-56 overflow-y-auto flex flex-col gap-0.5 rounded-md border bg-muted/10 p-1">
                {tracks.map((track, i) => {
                  const selected = selectedIds.has(track.id);
                  return (
                    <button
                      key={track.id}
                      onClick={() => toggleTrack(track.id)}
                      className={[
                        "flex items-center gap-2.5 rounded px-2.5 py-1.5 text-left text-xs transition-colors",
                        selected ? "bg-primary/10 text-primary" : "hover:bg-muted",
                      ].join(" ")}
                    >
                      <span className="w-4 text-center text-muted-foreground shrink-0">{i + 1}</span>
                      <span className="flex-1 truncate">{track.name}</span>
                      {selected && <Check className="h-3 w-3 shrink-0" />}
                    </button>
                  );
                })}
              </div>

              <p className="text-xs text-muted-foreground">
                {selectedIds.size}곡 선택됨 → 새 SongFlow 앨범에 트랙으로 추가됩니다.
              </p>
            </div>
          )}
        </div>

        <DialogFooter>
          <Button type="button" variant="outline" size="sm" onClick={() => onOpenChange(false)}>
            취소
          </Button>
          {foundAlbum && (
            <Button
              size="sm"
              onClick={handleImport}
              disabled={!selectedIds.size || isImporting}
            >
              {isImporting ? (
                <><Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />가져오는 중...</>
              ) : (
                <><Music2 className="mr-1.5 h-3.5 w-3.5" />{selectedIds.size}곡 트랙으로 추가</>
              )}
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
