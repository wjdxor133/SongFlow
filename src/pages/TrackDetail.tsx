import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import { Button } from "../components/ui/button";
import { McpInfoPanel } from "../components/McpInfoPanel";
import { useAlbumStore } from "../store/useAlbumStore";

const inputClass =
  "w-full rounded-md border bg-background px-3 py-2 text-sm outline-none focus:ring-1 focus:ring-ring transition-colors";

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

  const [editing, setEditing] = useState(false);
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
    setEditing(false);
  }

  const agentHistory = track.agentRequests
    .slice()
    .reverse()
    .map((req) => ({
      request: req,
      response: track.agentResponses.find((r) => r.requestId === req.id),
    }));

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
      {editing ? (
        <form onSubmit={handleSaveEdit} className="flex flex-col gap-3">
          <div className="space-y-1.5">
            <label className="text-sm font-medium">Title</label>
            <input
              className={inputClass}
              value={editTitle}
              onChange={(e) => setEditTitle(e.target.value)}
              placeholder="Track title"
              required
              autoFocus
            />
          </div>
          <div className="grid grid-cols-3 gap-3">
            <div className="space-y-1.5">
              <label className="text-sm font-medium">Genre</label>
              <input
                className={inputClass}
                value={editGenre}
                onChange={(e) => setEditGenre(e.target.value)}
                placeholder="Optional"
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-sm font-medium">BPM</label>
              <input
                className={inputClass}
                value={editBpm}
                onChange={(e) => setEditBpm(e.target.value)}
                placeholder="120"
                type="number"
                min={1}
                max={300}
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-sm font-medium">Key</label>
              <input
                className={inputClass}
                value={editKey}
                onChange={(e) => setEditKey(e.target.value)}
                placeholder="C major"
              />
            </div>
          </div>
          <div className="space-y-1.5">
            <label className="text-sm font-medium">Concept</label>
            <textarea
              className={`${inputClass} resize-none`}
              value={editConcept}
              onChange={(e) => setEditConcept(e.target.value)}
              placeholder="What's this track about?"
              rows={2}
            />
          </div>
          <div className="space-y-1.5">
            <label className="text-sm font-medium">Lyrics</label>
            <textarea
              className={`${inputClass} resize-none`}
              value={editLyrics}
              onChange={(e) => setEditLyrics(e.target.value)}
              placeholder="Lyrics"
              rows={5}
            />
          </div>
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
              {track.title}
            </h1>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setEditing(true)}
            >
              Edit
            </Button>
          </div>
          {track.concept && (
            <p className="mt-1 text-sm text-muted-foreground">{track.concept}</p>
          )}
          <div className="mt-2 flex flex-wrap gap-1.5">
            {(track.genre ?? album?.genre) && (
              <span className="inline-flex items-center rounded-full bg-muted px-2.5 py-0.5 text-xs font-medium">
                {track.genre ?? album?.genre}
              </span>
            )}
            {track.bpm && (
              <span className="inline-flex items-center rounded-full bg-muted px-2.5 py-0.5 text-xs font-medium">
                {track.bpm} BPM
              </span>
            )}
            {track.key && (
              <span className="inline-flex items-center rounded-full bg-muted px-2.5 py-0.5 text-xs font-medium">
                {track.key}
              </span>
            )}
          </div>
          {track.lyrics && (
            <div className="mt-4">
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-1">
                Lyrics
              </p>
              <pre className="whitespace-pre-wrap text-sm font-sans text-foreground rounded-lg border bg-muted/20 p-3">
                {track.lyrics}
              </pre>
            </div>
          )}
        </div>
      )}

      {/* Agent history */}
      {agentHistory.length > 0 && (
        <div className="flex flex-col gap-3">
          <h2 className="text-sm font-semibold">Agent History</h2>
          <div className="flex flex-col gap-2">
            {agentHistory.map(({ request, response }) => (
              <div
                key={request.id}
                className="rounded-lg border bg-muted/20 p-3 flex flex-col gap-1.5"
              >
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">{request.task}</span>
                  <span className="text-xs text-muted-foreground">
                    {formatDate(request.createdAt)}
                  </span>
                </div>
                <p className="text-xs text-muted-foreground">
                  Provider: {request.provider}
                </p>
                {response && (
                  <span
                    className={[
                      "inline-flex w-fit items-center rounded-full px-2 py-0.5 text-xs font-medium",
                      response.parseStatus === "success"
                        ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400"
                        : "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400",
                    ].join(" ")}
                  >
                    {response.parseStatus === "success" ? "Parsed" : "Parse failed"}
                  </span>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Prompts */}
      {track.prompts.length > 0 && (
        <div className="flex flex-col gap-3">
          <h2 className="text-sm font-semibold">
            Prompts{" "}
            <span className="text-sm font-normal text-muted-foreground">
              ({track.prompts.length})
            </span>
          </h2>
          <div className="flex flex-col gap-2">
            {track.prompts.slice().reverse().map((prompt) => (
              <div
                key={prompt.id}
                className="rounded-lg border bg-muted/20 p-3 flex flex-col gap-1"
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-medium text-muted-foreground">
                    Prompt
                  </span>
                  <span className="text-xs text-muted-foreground">
                    {formatDate(prompt.createdAt)}
                  </span>
                </div>
                {prompt.basic && <p className="text-sm"><span className="font-medium">Basic:</span> {prompt.basic}</p>}
                {prompt.moreRefreshing && <p className="text-sm"><span className="font-medium">Refreshing:</span> {prompt.moreRefreshing}</p>}
                {prompt.moreEmotional && <p className="text-sm"><span className="font-medium">Emotional:</span> {prompt.moreEmotional}</p>}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Suno results */}
      {track.sunoResults.length > 0 && (
        <div className="flex flex-col gap-3">
          <h2 className="text-sm font-semibold">
            Suno Results{" "}
            <span className="text-sm font-normal text-muted-foreground">
              ({track.sunoResults.length})
            </span>
          </h2>
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
                    <span className="inline-flex w-fit items-center rounded-full bg-muted px-2 py-0.5 text-xs text-muted-foreground">
                      Rating: {result.rating}/5
                    </span>
                  )}
                  {result.isBestVersion && (
                    <span className="inline-flex w-fit items-center rounded-full bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400 px-2 py-0.5 text-xs font-medium">
                      Best version
                    </span>
                  )}
                  {result.memo && (
                    <span className="text-xs text-muted-foreground">{result.memo}</span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* MCP info */}
      <McpInfoPanel />
    </div>
  );
}
