import { useState, useRef, useCallback, useEffect } from "react";
import { Play, Square } from "lucide-react";
import * as Tone from "tone";
import type { ChordProgression } from "../../lib/types/music";

const CHORD_COLORS: Record<string, string> = {
  C: "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300",
  D: "bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-300",
  E: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300",
  F: "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300",
  G: "bg-teal-100 text-teal-800 dark:bg-teal-900/30 dark:text-teal-300",
  A: "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300",
  B: "bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300",
};

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

export function parseChordToNotes(chord: string): string[] {
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

// Module-level "active player" registry: ensures only ONE chord card plays at a
// time across ALL ChordPlayback instances (TrackDetail page + /guided page),
// since every instance shares the global Tone.getTransport() singleton.
let activeStop: (() => void) | null = null;

interface ChordPlaybackProps {
  cp: ChordProgression;
  isSelected: boolean;
}

/**
 * Renders a single chord progression card with Tone.js playback controls.
 * Contains no AI dependencies — safe to import in key-free contexts.
 */
export function ChordPlayback({ cp, isSelected }: ChordPlaybackProps) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [playingIndex, setPlayingIndex] = useState<number | null>(null);
  const synthRef = useRef<Tone.PolySynth | null>(null);
  const seqRef = useRef<Tone.Sequence | null>(null);

  const stopPlayback = useCallback(() => {
    seqRef.current?.stop();
    seqRef.current?.dispose();
    seqRef.current = null;
    synthRef.current?.releaseAll();
    synthRef.current?.dispose();
    synthRef.current = null;
    const transport = Tone.getTransport();
    transport.stop();
    transport.cancel(0);
    setIsPlaying(false);
    setPlayingIndex(null);
    if (activeStop === stopPlayback) {
      activeStop = null;
    }
  }, []);

  useEffect(() => {
    return () => stopPlayback();
  }, [stopPlayback]);

  async function playChordProgression() {
    // Stop whichever card is currently playing (could be this one or another
    // instance) before starting, so the shared transport state never overlaps.
    activeStop?.();
    activeStop = stopPlayback;

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

    setIsPlaying(true);
    setPlayingIndex(0);

    seq.start(0);
    Tone.getTransport().start();
  }

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
              isPlaying ? stopPlayback() : playChordProgression();
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
