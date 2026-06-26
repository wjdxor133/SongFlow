import { useAlbumStore } from "../../store/useAlbumStore";
import { useConfigStore } from "../../store/useConfigStore";
import type { Track } from "../../lib/types/album";
import type { ChordProgression, GroovePattern } from "../../lib/types/music";
import { useState } from "react";
import { Plus, Sparkles, Loader2 } from "lucide-react";
import { Input } from "../ui/input";
import { Button } from "../ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "../ui/dialog";
import { callClaude } from "../../lib/ai/anthropic";
import { buildPrompt } from "../../lib/agent/prompts";
import type { Album } from "../../lib/types/album";
import { ChordPlayback } from "./ChordPlayback";

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

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="flex w-full items-center justify-center gap-1.5 rounded-lg border border-dashed py-2.5 text-xs text-muted-foreground hover:text-foreground hover:border-border transition-colors"
      >
        <Plus className="h-3.5 w-3.5" />
        코드 진행 추가
      </button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>코드 진행 추가</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="flex flex-col gap-3">
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
            <DialogFooter>
              <Button type="button" variant="outline" size="sm" onClick={() => setOpen(false)}>취소</Button>
              <Button type="submit" size="sm" disabled={!chordsInput.trim()}>추가</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </>
  );
}

interface Props {
  track: Track;
  album: Album;
}

export function ChordGrooveSection({ track, album }: Props) {
  const updateTrack = useAlbumStore((s) => s.updateTrack);
  const apiKey = useConfigStore((s) => s.config.anthropicApiKey);
  const [isGenerating, setIsGenerating] = useState(false);
  const [generateError, setGenerateError] = useState<string | null>(null);

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

  async function handleGenerate() {
    if (!apiKey) {
      setGenerateError("Settings에서 Anthropic API 키를 입력해주세요.");
      return;
    }
    setIsGenerating(true);
    setGenerateError(null);
    try {
      const { instruction, outputSchema } = buildPrompt("generate_chord_progression", track, album);
      const result = await callClaude(apiKey, [{ role: "user", content: `${instruction}\n\n${outputSchema}` }]);
      if (result.parseStatus === "failed") {
        setGenerateError("응답 파싱 실패. 다시 시도해주세요.");
        return;
      }
      const data = result.parsedJson as { progressions: Array<{ name: string; chords: string[]; key: string; mode: "major" | "minor"; bpm: number | null; }> };
      const newProgressions: ChordProgression[] = (data.progressions ?? []).map((p) => ({
        id: crypto.randomUUID(),
        name: p.name,
        chords: p.chords,
        key: p.key,
        mode: p.mode,
        bpm: p.bpm ?? undefined,
        isDefault: false,
      }));
      await updateTrack(track.id, {
        chordProgressions: [...track.chordProgressions, ...newProgressions],
      });
    } catch {
      setGenerateError("API 호출 실패. API 키와 네트워크를 확인해주세요.");
    } finally {
      setIsGenerating(false);
    }
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col gap-3">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-semibold">
            코드 진행{" "}
            {hasChords && (
              <span className="text-sm font-normal text-muted-foreground">
                ({track.chordProgressions.length})
              </span>
            )}
          </h2>
          <button
            type="button"
            onClick={handleGenerate}
            disabled={isGenerating}
            className="flex items-center gap-1 rounded-md px-2 py-1 text-xs text-muted-foreground hover:text-foreground hover:bg-muted transition-colors disabled:opacity-50"
          >
            {isGenerating ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Sparkles className="h-3.5 w-3.5" />}
            AI 생성
          </button>
        </div>
        {generateError && (
          <p className="text-xs text-destructive">{generateError}</p>
        )}
        <div className="flex flex-col gap-2">
          {track.chordProgressions.map((cp) => (
            <button
              key={cp.id}
              className="text-left"
              onClick={() => selectChord(cp.id)}
            >
              <ChordPlayback
                cp={cp}
                isSelected={track.selectedChordProgressionId === cp.id}
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
