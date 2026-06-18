import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Textarea } from "../components/ui/textarea";
import { ReferenceSongSection } from "../components/track/ReferenceSongSection";
import { SongBriefSection } from "../components/track/SongBriefSection";
import { ChordGrooveSection } from "../components/track/ChordGrooveSection";
import { PromptLabSection } from "../components/track/PromptLabSection";
import { NotesSection } from "../components/track/NotesSection";
import { ReferenceCoachSection } from "../components/track/ReferenceCoachSection";
import { useAlbumStore } from "../store/useAlbumStore";

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
      <div className="flex flex-col gap-3">
        <input
          className="bg-transparent text-2xl font-semibold tracking-tight outline-none border-b border-transparent focus:border-border transition-colors"
          value={editTitle}
          onChange={(e) => setEditTitle(e.target.value)}
          onBlur={() => updateTrack(track.id, { title: editTitle.trim() || track.title })}
          placeholder="Track title"
        />

        {track.sourceTrack && (
          <div className="flex flex-col gap-0.5 rounded-md border bg-muted/30 px-3 py-2.5 text-xs">
            <span className="text-muted-foreground">원곡</span>
            <span className="font-medium">
              {track.sourceTrack.artist} — {track.sourceTrack.title}
            </span>
            {track.sourceTrack.album && (
              <span className="text-muted-foreground">
                {track.sourceTrack.album}{track.sourceTrack.year ? ` (${track.sourceTrack.year})` : ""}
              </span>
            )}
          </div>
        )}

        <div className="grid grid-cols-3 gap-3">
          <div className="space-y-1">
            <label className="text-xs text-muted-foreground">Genre</label>
            <Input
              value={editGenre}
              onChange={(e) => setEditGenre(e.target.value)}
              onBlur={() => updateTrack(track.id, { genre: editGenre.trim() || undefined })}
              placeholder="Optional"
            />
          </div>
          <div className="space-y-1">
            <label className="text-xs text-muted-foreground">BPM</label>
            <Input
              value={editBpm}
              onChange={(e) => setEditBpm(e.target.value)}
              onBlur={() => {
                const bpm = editBpm.trim() ? Number(editBpm.trim()) : undefined;
                updateTrack(track.id, { bpm: bpm && !isNaN(bpm) ? bpm : undefined });
              }}
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
              onBlur={() => updateTrack(track.id, { key: editKey.trim() || undefined })}
              placeholder="C major"
            />
          </div>
        </div>
        <div className="space-y-1">
          <label className="text-xs text-muted-foreground">Concept</label>
          <Textarea
            value={editConcept}
            onChange={(e) => setEditConcept(e.target.value)}
            onBlur={() => updateTrack(track.id, { concept: editConcept.trim() || undefined })}
            placeholder="What's this track about?"
            rows={2}
          />
        </div>
        <div className="space-y-1">
          <label className="text-xs text-muted-foreground">Lyrics</label>
          <Textarea
            value={editLyrics}
            onChange={(e) => setEditLyrics(e.target.value)}
            onBlur={() => updateTrack(track.id, { lyrics: editLyrics.trim() || undefined })}
            placeholder="Write your lyrics here..."
            rows={6}
          />
        </div>
      </div>

      {/* References */}
      <ReferenceSongSection track={track} />

      {/* Reference Coach */}
      <ReferenceCoachSection track={track} />

      {/* Song Brief */}
      <SongBriefSection track={track} />

      {/* Prompt Lab */}
      <PromptLabSection track={track} />

      {/* Chord & Groove */}
      {album && <ChordGrooveSection track={track} album={album} />}

      {/* Notes */}
      <NotesSection track={track} />

    </div>
  );
}
