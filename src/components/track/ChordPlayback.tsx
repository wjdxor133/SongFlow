import { useState, useRef, useCallback, useEffect } from "react";
import { Play, Square, Download, ListMusic } from "lucide-react";
import * as Tone from "tone";
import type { ChordProgression } from "../../lib/types/music";
import { buildChordMidi, sanitizeFilename, chordToMidiNotes, midiToName } from "../../lib/midi/chordMidi";
import { saveMidi } from "../../lib/midi/saveMidi";

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

// WKWebView (Tauri on macOS) reports AudioContext.state === "running" but emits
// no sound until the first *real* playback node fires inside a user gesture —
// Chrome is lenient, WebKit is not. Playing one short silent buffer "arms" the
// output route. Runs once per context; harmless in Chrome.
// Refs: WebKit bug 132691, Tone.js autoplay wiki.
let audioUnlocked = false;
function unlockWebAudio() {
  if (audioUnlocked) return;
  const raw = Tone.getContext().rawContext as unknown as AudioContext;
  try {
    const buffer = raw.createBuffer(1, 1, raw.sampleRate);
    const source = raw.createBufferSource();
    source.buffer = buffer;
    source.connect(raw.destination);
    source.start(0);
    audioUnlocked = true;
  } catch (err) {
    console.warn("[ChordPlayback] audio unlock failed:", err);
  }
}

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
  const [downloadState, setDownloadState] = useState<"idle" | "saving" | "done" | "error">("idle");
  const [showNotes, setShowNotes] = useState(false);
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

    try {
      await Tone.start();
      // WKWebView emits no sound despite a "running" context until an initial
      // real playback node fires inside the gesture. Unlock before scheduling.
      unlockWebAudio();

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
    } catch (err) {
      console.error("[ChordPlayback] playback failed:", err);
      stopPlayback();
    }
  }

  async function downloadMidi() {
    setDownloadState("saving");
    try {
      const bytes = buildChordMidi(cp.chords, {
        key: cp.key ?? "C",
        bpm: cp.bpm ?? 100,
        repeat: 2,
      });
      const filename =
        sanitizeFilename(`${cp.name}_${cp.chords.join("-")}_${cp.bpm ?? 100}bpm`) + ".mid";
      await saveMidi(bytes, filename);
      setDownloadState("done");
      setTimeout(() => setDownloadState("idle"), 2000);
    } catch (err) {
      console.error("MIDI 저장 실패", err);
      setDownloadState("error");
      setTimeout(() => setDownloadState("idle"), 2500);
    }
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
              setShowNotes((v) => !v);
            }}
            className={[
              "flex h-6 w-6 items-center justify-center rounded-full transition-colors",
              showNotes ? "bg-primary/20 text-primary" : "bg-primary/10 text-primary hover:bg-primary/20",
            ].join(" ")}
            title={showNotes ? "MIDI 노트 숨기기" : "MIDI 노트 보기"}
          >
            <ListMusic className="h-3 w-3" />
          </button>
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
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              downloadMidi();
            }}
            disabled={downloadState === "saving"}
            className={[
              "flex h-6 w-6 items-center justify-center rounded-full transition-colors",
              downloadState === "done"
                ? "bg-green-500/15 text-green-600 dark:text-green-400"
                : downloadState === "error"
                  ? "bg-red-500/15 text-red-600 dark:text-red-400"
                  : "bg-primary/10 text-primary hover:bg-primary/20",
            ].join(" ")}
            title={
              downloadState === "done"
                ? "MIDI 저장됨"
                : downloadState === "error"
                  ? "저장 실패"
                  : "MIDI 다운로드 (.mid)"
            }
          >
            <Download className="h-3 w-3" />
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

      {showNotes && (
        <div className="overflow-x-auto rounded-md border bg-background/60">
          <table className="w-full text-xs">
            <thead>
              <tr className="text-muted-foreground">
                <th className="px-2 py-1 text-left font-medium">Chord</th>
                <th className="px-2 py-1 text-left font-medium">Bass</th>
                <th className="px-2 py-1 text-left font-medium">Notes (MIDI)</th>
              </tr>
            </thead>
            <tbody className="font-mono">
              {cp.chords.map((chord, i) => {
                const n = chordToMidiNotes(chord);
                return (
                  <tr key={i} className="border-t border-border/60">
                    <td className="px-2 py-1 font-semibold whitespace-nowrap">{chord}</td>
                    <td className="px-2 py-1 whitespace-nowrap">
                      {n ? `${midiToName(n.bass)} (${n.bass})` : "—"}
                    </td>
                    <td className="px-2 py-1">
                      {n
                        ? n.chord.map((m) => `${midiToName(m)} (${m})`).join("   ")
                        : "인식 실패"}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
          <p className="px-2 py-1 text-[10px] text-muted-foreground border-t border-border/60">
            미들 C = C4 = 60 · Bass 옥타브 2 / Chord 옥타브 3 (.mid 다운로드와 동일)
          </p>
        </div>
      )}
    </div>
  );
}
