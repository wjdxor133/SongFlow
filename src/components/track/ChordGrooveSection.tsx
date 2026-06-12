import { useAlbumStore } from "../../store/useAlbumStore";
import type { Track } from "../../lib/types/album";
import type { ChordProgression, GroovePattern } from "../../lib/types/music";
import { useState, useEffect, useRef, useCallback } from "react";
import { Play, Square, Plus, X } from "lucide-react";
import * as Tone from "tone";
import { Input } from "../ui/input";

const CHORD_COLORS: Record<string, string> = {
  C: "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300",
  D: "bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-300",
  E: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300",
  F: "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300",
  G: "bg-teal-100 text-teal-800 dark:bg-teal-900/30 dark:text-teal-300",
  A: "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300",
  B: "bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300",
};

// Chord name → note array (piano voicing, octave 4)
const CHORD_INTERVALS: Record<string, number[]> = {
  "": [0, 4, 7],         // major
  "m": [0, 3, 7],        // minor
  "7": [0, 4, 7, 10],    // dominant 7th
  "maj7": [0, 4, 7, 11], // major 7th
  "m7": [0, 3, 7, 10],   // minor 7th
  "dim": [0, 3, 6],      // diminished
  "aug": [0, 4, 8],      // augmented
  "sus2": [0, 2, 7],     // suspended 2nd
  "sus4": [0, 5, 7],     // suspended 4th
};

const NOTE_SEMITONES: Record<string, number> = {
  C: 0, "C#": 1, Db: 1, D: 2, "D#": 3, Eb: 3, E: 4,
  F: 5, "F#": 6, Gb: 6, G: 7, "G#": 8, Ab: 8, A: 9,
  "A#": 10, Bb: 10, B: 11,
};

const SEMITONE_TO_NOTE = ["C", "C#", "D", "D#", "E", "F", "F#", "G", "G#", "A", "A#", "B"];

function parseChordToNotes(chord: string): string[] {
  // Parse root note (e.g. "Cm7" → root="C", quality="m7")
  const match = chord.match(/^([A-G][b#]?)(.*)/);
  if (!match) return ["C4", "E4", "G4"];

  const root = match[1];
  const quality = match[2] ?? "";
  const intervals = CHORD_INTERVALS[quality] ?? CHORD_INTERVALS[""];
  const rootSemitone = NOTE_SEMITONES[root] ?? 0;

  return intervals.map((interval) => {
    const semitone = (rootSemitone + interval) % 12;
    const octave = rootSemitone + interval >= 12 ? 5 : 4;
    return `${SEMITONE_TO_NOTE[semitone]}${octave}`;
  });
}

function chordColor(chord: string) {
  const root = chord.replace(/[^A-Gb#]/g, "")[0] ?? "C";
  return CHORD_COLORS[root] ?? "bg-muted text-muted-foreground";
}

interface ChordCardProps {
  cp: ChordProgression;
  isSelected: boolean;
  playingIndex: number | null;
  isPlaying: boolean;
  onPlay: () => void;
  onStop: () => void;
}

function ChordCard({ cp, isSelected, playingIndex, isPlaying, onPlay, onStop }: ChordCardProps) {
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
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <span>{cp.key} {cp.mode}</span>
            {cp.bpm && <span>· {cp.bpm} BPM</span>}
          </div>
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              isPlaying ? onStop() : onPlay();
            }}
            className="flex h-6 w-6 items-center justify-center rounded-full bg-primary/10 text-primary hover:bg-primary/20 transition-colors"
            title={isPlaying ? "정지" : "재생"}
          >
            {isPlaying ? <Square className="h-3 w-3 fill-current" /> : <Play className="h-3 w-3 fill-current" />}
          </button>
        </div>
      </div>
      <div className="flex flex-wrap gap-1.5">
        {cp.chords.map((chord, i) => (
          <span
            key={i}
            className={[
              "inline-flex items-center rounded px-2 py-0.5 text-xs font-mono font-semibold transition-all",
              chordColor(chord),
              isPlaying && playingIndex === i ? "ring-2 ring-primary scale-110" : "",
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


function AddChordProgressionForm({ onAdd }: { onAdd: (cp: Omit<ChordProgression, "id" | "isDefault">) => void }) {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [chordsInput, setChordsInput] = useState("");
  const [key, setKey] = useState("");
  const [mode, setMode] = useState<"major" | "minor">("minor");
  const [bpm, setBpm] = useState("");

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const chords = chordsInput.trim().split(/\s+/).filter(Boolean);
    if (!chords.length) return;
    onAdd({
      name: name.trim() || chordsInput.trim(),
      chords,
      key: key.trim() || (chords[0]?.[0] ?? "C"),
      mode,
      bpm: bpm ? Number(bpm) : undefined,
    });
    setName("");
    setChordsInput("");
    setKey("");
    setBpm("");
    setOpen(false);
  }

  if (!open) {
    return (
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="flex w-full items-center justify-center gap-1.5 rounded-lg border border-dashed py-2.5 text-xs text-muted-foreground hover:text-foreground hover:border-border transition-colors"
      >
        <Plus className="h-3.5 w-3.5" />
        코드 진행 추가
      </button>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="rounded-lg border bg-muted/20 p-3 flex flex-col gap-2.5">
      <div className="flex items-center justify-between">
        <span className="text-xs font-medium">새 코드 진행</span>
        <button type="button" onClick={() => setOpen(false)}>
          <X className="h-3.5 w-3.5 text-muted-foreground" />
        </button>
      </div>
      <div>
        <label className="text-xs text-muted-foreground">코드 (공백으로 구분) *</label>
        <Input
          value={chordsInput}
          onChange={(e) => setChordsInput(e.target.value)}
          placeholder="Cm Fm Ab Bb"
          required
          autoFocus
        />
      </div>
      <div className="grid grid-cols-3 gap-2">
        <div>
          <label className="text-xs text-muted-foreground">이름</label>
          <Input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="선택 사항"
          />
        </div>
        <div>
          <label className="text-xs text-muted-foreground">Key</label>
          <Input
            value={key}
            onChange={(e) => setKey(e.target.value)}
            placeholder="C"
          />
        </div>
        <div>
          <label className="text-xs text-muted-foreground">BPM</label>
          <Input
            value={bpm}
            onChange={(e) => setBpm(e.target.value)}
            placeholder="100"
            type="number"
            min={1}
            max={300}
          />
        </div>
      </div>
      <div className="flex items-center gap-2">
        <label className="text-xs text-muted-foreground">모드</label>
        <button
          type="button"
          onClick={() => setMode(mode === "major" ? "minor" : "major")}
          className="text-xs px-2 py-0.5 rounded-full border hover:bg-muted transition-colors"
        >
          {mode === "major" ? "Major" : "Minor"}
        </button>
      </div>
      <button
        type="submit"
        className="self-end rounded-md bg-primary px-3 py-1.5 text-xs font-medium text-primary-foreground hover:bg-primary/90 transition-colors"
      >
        추가
      </button>
    </form>
  );
}

interface Props {
  track: Track;
}

export function ChordGrooveSection({ track }: Props) {
  const updateTrack = useAlbumStore((s) => s.updateTrack);
  const [playingCpId, setPlayingCpId] = useState<string | null>(null);
  const [playingIndex, setPlayingIndex] = useState<number | null>(null);
  const synthRef = useRef<Tone.PolySynth | null>(null);
  const seqRef = useRef<Tone.Sequence | null>(null);

  const stopPlayback = useCallback(() => {
    seqRef.current?.stop();
    seqRef.current?.dispose();
    seqRef.current = null;
    synthRef.current?.releaseAll();
    Tone.getTransport().stop();
    setPlayingCpId(null);
    setPlayingIndex(null);
  }, []);

  useEffect(() => {
    return () => stopPlayback();
  }, [stopPlayback]);

  async function playChordProgression(cp: ChordProgression) {
    stopPlayback();

    await Tone.start();

    const synth = new Tone.PolySynth(Tone.Synth, {
      oscillator: { type: "triangle" },
      envelope: { attack: 0.05, decay: 0.3, sustain: 0.4, release: 0.8 },
      volume: -8,
    }).toDestination();
    synthRef.current = synth;

    const bpm = cp.bpm ?? 100;
    Tone.getTransport().bpm.value = bpm;

    let index = 0;
    const seq = new Tone.Sequence(
      (time) => {
        const chord = cp.chords[index];
        const notes = parseChordToNotes(chord);
        synth.triggerAttackRelease(notes, "2n", time);
        setPlayingIndex(index);
        index = (index + 1) % cp.chords.length;
      },
      cp.chords.map((_, i) => i),
      "1n"
    );
    seqRef.current = seq;

    setPlayingCpId(cp.id);
    setPlayingIndex(0);

    seq.start(0);
    Tone.getTransport().start();
  }

  const hasChords = track.chordProgressions.length > 0;
  const hasGrooves = track.groovePatterns.length > 0;

  async function selectChord(id: string) {
    await updateTrack(track.id, { selectedChordProgressionId: id });
  }

  async function selectGroove(id: string) {
    await updateTrack(track.id, { selectedGroovePatternId: id });
  }

  async function handleAddChordProgression(cp: Omit<ChordProgression, "id" | "isDefault">) {
    const newCp: ChordProgression = {
      ...cp,
      id: crypto.randomUUID(),
      isDefault: false,
    };
    await updateTrack(track.id, {
      chordProgressions: [...track.chordProgressions, newCp],
    });
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col gap-3">
        <h2 className="text-sm font-semibold">
          코드 진행{" "}
          {hasChords && (
            <span className="text-sm font-normal text-muted-foreground">
              ({track.chordProgressions.length})
            </span>
          )}
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
                playingIndex={playingCpId === cp.id ? playingIndex : null}
                isPlaying={playingCpId === cp.id}
                onPlay={() => playChordProgression(cp)}
                onStop={stopPlayback}
              />
            </button>
          ))}
          <AddChordProgressionForm onAdd={handleAddChordProgression} />
        </div>
      </div>

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
