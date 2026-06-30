import { useAlbumStore } from "../../store/useAlbumStore";
import type { Track } from "../../lib/types/album";
import type { ChordProgression, GroovePattern } from "../../lib/types/music";
import { useState } from "react";
import { Plus } from "lucide-react";
import { Input } from "../ui/input";
import { Button } from "../ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "../ui/dialog";
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
}

export function ChordGrooveSection({ track }: Props) {
  const updateTrack = useAlbumStore((s) => s.updateTrack);

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
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-semibold">
            코드 진행{" "}
            {hasChords && (
              <span className="text-sm font-normal text-muted-foreground">
                ({track.chordProgressions.length})
              </span>
            )}
          </h2>
        </div>
        <div className="flex flex-col gap-2">
          {track.chordProgressions.map((cp) => (
            // 주의: 카드 안에 ChordPlayback의 재생 <button>이 들어가므로
            // 이 래퍼는 <button>이면 안 됨(button 중첩 → WKWebView에서 재생 클릭이 삼켜짐).
            <div
              key={cp.id}
              role="button"
              tabIndex={0}
              className="cursor-pointer text-left"
              onClick={() => selectChord(cp.id)}
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") {
                  e.preventDefault();
                  selectChord(cp.id);
                }
              }}
            >
              <ChordPlayback
                cp={cp}
                isSelected={track.selectedChordProgressionId === cp.id}
              />
            </div>
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
