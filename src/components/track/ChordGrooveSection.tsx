import { useAlbumStore } from "../../store/useAlbumStore";
import type { Track } from "../../lib/types/album";
import type { ChordProgression, GroovePattern } from "../../lib/types/music";

const CHORD_COLORS: Record<string, string> = {
  C: "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300",
  D: "bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-300",
  E: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300",
  F: "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300",
  G: "bg-teal-100 text-teal-800 dark:bg-teal-900/30 dark:text-teal-300",
  A: "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300",
  B: "bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300",
};

function chordColor(chord: string) {
  const root = chord.replace(/[^A-Gb#]/g, "")[0] ?? "C";
  return CHORD_COLORS[root] ?? "bg-muted text-muted-foreground";
}

function ChordCard({ cp, isSelected }: { cp: ChordProgression; isSelected: boolean }) {
  return (
    <div
      className={[
        "flex flex-col gap-2 rounded-lg border p-3 transition-colors",
        isSelected ? "border-primary bg-primary/5" : "border-border bg-card",
      ].join(" ")}
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium">{cp.name}</span>
          {isSelected && (
            <span className="inline-flex items-center rounded-full bg-primary/10 px-2 py-0.5 text-xs font-medium text-primary">
              선택됨
            </span>
          )}
        </div>
        <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
          <span>{cp.key} {cp.mode}</span>
          {cp.bpm && <span>· {cp.bpm} BPM</span>}
        </div>
      </div>
      <div className="flex flex-wrap gap-1.5">
        {cp.chords.map((chord, i) => (
          <span
            key={i}
            className={[
              "inline-flex items-center rounded px-2 py-0.5 text-xs font-mono font-semibold",
              chordColor(chord),
            ].join(" ")}
          >
            {chord}
          </span>
        ))}
      </div>
    </div>
  );
}

function GrooveCard({ gp, isSelected }: { gp: GroovePattern; isSelected: boolean }) {
  return (
    <div
      className={[
        "flex items-center gap-3 rounded-lg border p-3 transition-colors",
        isSelected ? "border-primary bg-primary/5" : "border-border bg-card",
      ].join(" ")}
    >
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium">{gp.name}</span>
          {isSelected && (
            <span className="inline-flex items-center rounded-full bg-primary/10 px-2 py-0.5 text-xs font-medium text-primary">
              선택됨
            </span>
          )}
        </div>
        {gp.bpm && (
          <span className="text-xs text-muted-foreground">{gp.bpm} BPM</span>
        )}
      </div>
      <div className="flex gap-0.5">
        {Array.from({ length: 16 }).map((_, i) => {
          const pattern = gp.pattern as Record<string, unknown> | null;
          const hasHit =
            pattern &&
            typeof pattern === "object" &&
            Object.values(pattern).some(
              (beats) => Array.isArray(beats) && beats.includes(i)
            );
          return (
            <div
              key={i}
              className={[
                "h-4 w-1.5 rounded-sm",
                i % 4 === 0 ? "ml-1" : "",
                hasHit ? "bg-primary" : "bg-muted",
              ].join(" ")}
            />
          );
        })}
      </div>
    </div>
  );
}

interface Props {
  track: Track;
}

export function ChordGrooveSection({ track }: Props) {
  const updateTrack = useAlbumStore((s) => s.updateTrack);

  const hasChords = track.chordProgressions.length > 0;
  const hasGrooves = track.groovePatterns.length > 0;

  if (!hasChords && !hasGrooves) {
    return (
      <div className="flex flex-col gap-3">
        <h2 className="text-sm font-semibold">Chord & Groove</h2>
        <div className="rounded-lg border border-dashed py-6 text-center">
          <p className="text-xs text-muted-foreground">
            MCP 서버나 AI 패널을 통해 코드 진행과 그루브 패턴을 생성하면 여기에 표시돼요.
          </p>
        </div>
      </div>
    );
  }

  async function selectChord(id: string) {
    await updateTrack(track.id, { selectedChordProgressionId: id });
  }

  async function selectGroove(id: string) {
    await updateTrack(track.id, { selectedGroovePatternId: id });
  }

  return (
    <div className="flex flex-col gap-4">
      {hasChords && (
        <div className="flex flex-col gap-3">
          <h2 className="text-sm font-semibold">
            코드 진행{" "}
            <span className="text-sm font-normal text-muted-foreground">
              ({track.chordProgressions.length})
            </span>
          </h2>
          <div className="flex flex-col gap-2">
            {track.chordProgressions.map((cp) => (
              <button
                key={cp.id}
                className="text-left"
                onClick={() => selectChord(cp.id)}
              >
                <ChordCard
                  cp={cp}
                  isSelected={track.selectedChordProgressionId === cp.id}
                />
              </button>
            ))}
          </div>
        </div>
      )}

      {hasGrooves && (
        <div className="flex flex-col gap-3">
          <h2 className="text-sm font-semibold">
            그루브 패턴{" "}
            <span className="text-sm font-normal text-muted-foreground">
              ({track.groovePatterns.length})
            </span>
          </h2>
          <div className="flex flex-col gap-2">
            {track.groovePatterns.map((gp) => (
              <button
                key={gp.id}
                className="text-left w-full"
                onClick={() => selectGroove(gp.id)}
              >
                <GrooveCard
                  gp={gp}
                  isSelected={track.selectedGroovePatternId === gp.id}
                />
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
