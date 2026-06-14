import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Textarea } from "../components/ui/textarea";
import { Badge } from "../components/ui/badge";
import { McpInfoPanel } from "../components/McpInfoPanel";
import { AiPanel } from "../components/ai/AiPanel";
import { ReferenceSongSection } from "../components/track/ReferenceSongSection";
import { SongBriefSection } from "../components/track/SongBriefSection";
import { ChordGrooveSection } from "../components/track/ChordGrooveSection";
import { PromptLabSection } from "../components/track/PromptLabSection";
import { SunoInputForm } from "../components/track/SunoInputForm";
import { NotesSection } from "../components/track/NotesSection";
import { ReferenceCoachSection } from "../components/track/ReferenceCoachSection";
import { useAlbumStore } from "../store/useAlbumStore";

function formatDate(iso: string) {
  return new Intl.DateTimeFormat(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(iso));
}

export function TrackDetail() {
  const { albumId, trackId } = useParams<{ albumId: string; trackId: string }>();
  const navigate = useNavigate();
  const isLoaded = useAlbumStore((s) => s.isLoaded);
  const album = useAlbumStore((s) => s.albums.find((a) => a.id === albumId));
  const track = useAlbumStore((s) => s.tracks.find((t) => t.id === trackId));
  const updateTrack = useAlbumStore((s) => s.updateTrack);

  const [editTitle, setEditTitle] = useState("");
  const [editGenre, setEditGenre] = useState("");
  const [editBpm, setEditBpm] = useState("");
  const [editKey, setEditKey] = useState("");
  const [editConcept, setEditConcept] = useState("");
  const [editLyrics, setEditLyrics] = useState("");

  useEffect(() => {
    if (!isLoaded) {
      useAlbumStore.getState().init();
    }
  }, [isLoaded]);

  useEffect(() => {
    if (track) {
      setEditTitle(track.title);
      setEditGenre(track.genre ?? "");
      setEditBpm(track.bpm != null ? String(track.bpm) : "");
      setEditKey(track.key ?? "");
      setEditConcept(track.concept ?? "");
      setEditLyrics(track.lyrics ?? "");
    }
  }, [track]);

  if (!track && isLoaded) {
    return (
      <div className="flex h-full flex-col items-center justify-center gap-4 p-6">
        <p className="text-sm text-muted-foreground">Track not found.</p>
        <Button variant="outline" onClick={() => navigate(`/albums/${albumId}`)}>
          <ArrowLeft className="mr-1.5 h-4 w-4" />
          Back to Album
        </Button>
      </div>
    );
  }

  if (!track) return null;

  async function handleSaveEdit(e: React.FormEvent) {
    e.preventDefault();
    const bpm = editBpm.trim() ? Number(editBpm.trim()) : undefined;
    await updateTrack(track!.id, {
      title: editTitle.trim() || track!.title,
      genre: editGenre.trim() || undefined,
      bpm: bpm && !isNaN(bpm) ? bpm : undefined,
      key: editKey.trim() || undefined,
      concept: editConcept.trim() || undefined,
      lyrics: editLyrics.trim() || undefined,
    });
  }

  return (
    <div className="flex h-full flex-col gap-6 p-6 overflow-auto">
      <div className="flex items-center gap-3">
        <Button
          variant="ghost"
          size="sm"
          className="-ml-2"
          onClick={() => navigate(`/albums/${albumId}`)}
        >
          <ArrowLeft className="mr-1.5 h-4 w-4" />
          {album?.title ?? "Album"}
        </Button>
      </div>

      {/* Track info */}
      <form onSubmit={handleSaveEdit} className="flex flex-col gap-3">
        <div className="flex items-center gap-3">
          <input
            className="flex-1 bg-transparent text-2xl font-semibold tracking-tight outline-none border-b border-transparent focus:border-border transition-colors"
            value={editTitle}
            onChange={(e) => setEditTitle(e.target.value)}
            placeholder="Track title"
            required
          />
        </div>
        <div className="grid grid-cols-3 gap-3">
          <div className="space-y-1">
            <label className="text-xs text-muted-foreground">Genre</label>
            <Input
              value={editGenre}
              onChange={(e) => setEditGenre(e.target.value)}
              placeholder="Optional"
            />
          </div>
          <div className="space-y-1">
            <label className="text-xs text-muted-foreground">BPM</label>
            <Input
              value={editBpm}
              onChange={(e) => setEditBpm(e.target.value)}
              placeholder="120"
              type="number"
              min={1}
              max={300}
            />
          </div>
          <div className="space-y-1">
            <label className="text-xs text-muted-foreground">Key</label>
            <Input
              value={editKey}
              onChange={(e) => setEditKey(e.target.value)}
              placeholder="C major"
            />
          </div>
        </div>
        <div className="space-y-1">
          <label className="text-xs text-muted-foreground">Concept</label>
          <Textarea
            value={editConcept}
            onChange={(e) => setEditConcept(e.target.value)}
            placeholder="What's this track about?"
            rows={2}
          />
        </div>
        <div className="space-y-1">
          <label className="text-xs text-muted-foreground">Lyrics</label>
          <Textarea
            value={editLyrics}
            onChange={(e) => setEditLyrics(e.target.value)}
            placeholder="Write your lyrics here..."
            rows={6}
          />
        </div>
        <div>
          <Button type="submit" size="sm">Save</Button>
        </div>
      </form>

      {/* References */}
      <ReferenceSongSection track={track} />

      {/* Reference Coach */}
      <ReferenceCoachSection track={track} />

      {/* Song Brief */}
      <SongBriefSection track={track} />

      {/* Prompt Lab */}
      <PromptLabSection track={track} />

      {/* Suno results */}
      <div className="flex flex-col gap-3">
        <h2 className="text-sm font-semibold">
          Suno Results{" "}
          <span className="text-sm font-normal text-muted-foreground">
            ({track.sunoResults.length})
          </span>
        </h2>
        <SunoInputForm track={track} />
        {track.sunoResults.length > 0 && (
          <div className="flex flex-col gap-2">
            {track.sunoResults.slice().reverse().map((result) => (
              <div
                key={result.id}
                className="rounded-lg border bg-muted/20 p-3 flex flex-col gap-1"
              >
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">{result.versionLabel || "Untitled"}</span>
                  <span className="text-xs text-muted-foreground">
                    {formatDate(result.createdAt)}
                  </span>
                </div>
                {result.url && (
                  <p className="text-xs text-muted-foreground break-all">
                    {result.url}
                  </p>
                )}
                <div className="flex flex-wrap items-center gap-1.5 pt-1">
                  {result.rating && (
                    <Badge variant="secondary">Rating: {result.rating}/5</Badge>
                  )}
                  {result.isBestVersion && (
                    <Badge className="bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400">
                      Best version
                    </Badge>
                  )}
                  {result.memo && (
                    <span className="text-xs text-muted-foreground">{result.memo}</span>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Chord & Groove */}
      {album && <ChordGrooveSection track={track} album={album} />}

      {/* Notes */}
      <NotesSection track={track} />

      {/* AI Panel */}
      {album && (
        <div className="flex flex-col gap-3">
          <h2 className="text-sm font-semibold">AI 작업</h2>
          <AiPanel track={track} album={album} />
        </div>
      )}

      {/* MCP info */}
      <McpInfoPanel />
    </div>
  );
}
