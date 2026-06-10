import { useState } from "react";
import { Plus } from "lucide-react";
import { Button } from "../ui/button";
import { useAlbumStore } from "../../store/useAlbumStore";
import type { Track } from "../../lib/types/album";
import type { SunoResult } from "../../lib/types/suno";

const inputClass =
  "w-full rounded-md border bg-background px-3 py-2 text-sm outline-none focus:ring-1 focus:ring-ring transition-colors";

const RATING_OPTIONS: { value: SunoResult["rating"]; label: string }[] = [
  { value: 1, label: "★" },
  { value: 2, label: "★★" },
  { value: 3, label: "★★★" },
  { value: 4, label: "★★★★" },
  { value: 5, label: "★★★★★" },
];

interface Props {
  track: Track;
}

export function SunoInputForm({ track }: Props) {
  const addSunoResult = useAlbumStore((s) => s.addSunoResult);

  const [open, setOpen] = useState(false);
  const [url, setUrl] = useState("");
  const [versionLabel, setVersionLabel] = useState("");
  const [rating, setRating] = useState<SunoResult["rating"]>(3);
  const [memo, setMemo] = useState("");
  const [isBestVersion, setIsBestVersion] = useState(false);
  const [saving, setSaving] = useState(false);

  function reset() {
    setUrl("");
    setVersionLabel("");
    setRating(3);
    setMemo("");
    setIsBestVersion(false);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (saving) return;

    setSaving(true);
    try {
      const result: SunoResult = {
        id: crypto.randomUUID(),
        url: url.trim(),
        promptId: "",
        versionLabel: versionLabel.trim() || `v${track.sunoResults.length + 1}`,
        rating,
        memo: memo.trim(),
        isBestVersion,
        createdAt: new Date().toISOString(),
      };
      await addSunoResult(track.id, result);
      reset();
      setOpen(false);
    } finally {
      setSaving(false);
    }
  }

  return (
    <div>
      {!open ? (
        <button
          onClick={() => setOpen(true)}
          className="flex w-full items-center justify-center gap-2 rounded-lg border border-dashed py-2 text-xs text-muted-foreground hover:border-foreground/30 hover:text-foreground transition-colors"
        >
          <Plus className="h-3.5 w-3.5" />
          Suno 결과 추가
        </button>
      ) : (
        <form
          onSubmit={handleSubmit}
          className="rounded-lg border bg-muted/10 p-3 flex flex-col gap-3"
        >
          <div className="grid grid-cols-2 gap-2">
            <div className="space-y-1">
              <label className="text-xs text-muted-foreground">버전 라벨</label>
              <input
                className={inputClass}
                value={versionLabel}
                onChange={(e) => setVersionLabel(e.target.value)}
                placeholder={`v${track.sunoResults.length + 1}`}
                autoFocus
              />
            </div>
            <div className="space-y-1">
              <label className="text-xs text-muted-foreground">URL</label>
              <input
                className={inputClass}
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                placeholder="https://suno.ai/..."
                type="url"
              />
            </div>
          </div>

          <div className="space-y-1">
            <label className="text-xs text-muted-foreground">평점</label>
            <div className="flex gap-1">
              {RATING_OPTIONS.map((opt) => (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => setRating(opt.value)}
                  className={[
                    "rounded-md border px-2.5 py-1 text-sm transition-colors",
                    rating === opt.value
                      ? "border-primary bg-primary text-primary-foreground"
                      : "border-border bg-background hover:bg-muted text-muted-foreground",
                  ].join(" ")}
                >
                  {opt.value}
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-1">
            <label className="text-xs text-muted-foreground">메모</label>
            <textarea
              className={`${inputClass} resize-none`}
              value={memo}
              onChange={(e) => setMemo(e.target.value)}
              placeholder="느낌, 수정 포인트 등"
              rows={2}
            />
          </div>

          <label className="flex items-center gap-2 text-sm cursor-pointer">
            <input
              type="checkbox"
              checked={isBestVersion}
              onChange={(e) => setIsBestVersion(e.target.checked)}
              className="h-4 w-4 rounded border accent-primary"
            />
            최고 버전으로 표시
          </label>

          <div className="flex gap-2">
            <Button type="submit" size="sm" disabled={saving}>
              {saving ? "저장 중..." : "저장"}
            </Button>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => {
                reset();
                setOpen(false);
              }}
            >
              취소
            </Button>
          </div>
        </form>
      )}
    </div>
  );
}
