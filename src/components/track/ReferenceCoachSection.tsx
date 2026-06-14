import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { Textarea } from "../ui/textarea";
import { Badge } from "../ui/badge";
import { useConfigStore } from "../../store/useConfigStore";
import type { Track } from "../../lib/types/album";
import type { ReferenceFocus } from "../../lib/types/reference-coach";

const FOCUS_OPTIONS: { value: ReferenceFocus; label: string }[] = [
  { value: "overall_mood", label: "전체 분위기" },
  { value: "chord_feel", label: "코드 느낌" },
  { value: "drum_groove", label: "드럼 그루브" },
  { value: "bass", label: "베이스" },
  { value: "topline", label: "탑라인" },
  { value: "vocal_tone", label: "보컬 톤" },
  { value: "sound_texture", label: "사운드 텍스처" },
  { value: "arrangement", label: "편곡" },
];

interface ReferenceCoachSectionProps {
  track: Track;
}

export function ReferenceCoachSection({ track }: ReferenceCoachSectionProps) {
  const navigate = useNavigate();
  const apiKey = useConfigStore((s) => s.config.anthropicApiKey);

  const [artist, setArtist] = useState("");
  const [songTitle, setSongTitle] = useState("");
  const [selectedFocus, setSelectedFocus] = useState<ReferenceFocus[]>([]);
  const [userNotes, setUserNotes] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);

  const referenceBriefs = track.referenceBriefs ?? [];
  const trackPlans = track.trackPlans ?? [];
  const learningMissions = track.learningMissions ?? [];

  function toggleFocus(focus: ReferenceFocus) {
    setSelectedFocus((prev) =>
      prev.includes(focus) ? prev.filter((f) => f !== focus) : [...prev, focus]
    );
  }

  async function handleGenerateAll() {
    if (!apiKey) {
      navigate("/settings");
      return;
    }
    if (!artist.trim() || !songTitle.trim()) return;
    setIsGenerating(true);
    // AI 연결은 MVP-19에서 구현
    await new Promise((r) => setTimeout(r, 500));
    setIsGenerating(false);
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col gap-1">
        <h2 className="text-sm font-semibold">Reference Coach</h2>
        <p className="text-xs text-muted-foreground">
          레퍼런스 곡을 바탕으로 내 트랙의 제작 방향과 학습 미션을 만들어보세요.
        </p>
      </div>

      {/* 입력 카드 */}
      <div className="rounded-lg border bg-muted/20 p-4 flex flex-col gap-4">
        <p className="text-xs text-muted-foreground">
          악보나 MIDI가 없어도 괜찮아요. 곡 제목과 참고하고 싶은 포인트만 입력하면 제작 방향을 제안합니다.
        </p>

        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1">
            <label className="text-xs text-muted-foreground">아티스트</label>
            <Input
              value={artist}
              onChange={(e) => setArtist(e.target.value)}
              placeholder="예: NewJeans"
            />
          </div>
          <div className="space-y-1">
            <label className="text-xs text-muted-foreground">곡 제목</label>
            <Input
              value={songTitle}
              onChange={(e) => setSongTitle(e.target.value)}
              placeholder="예: OMG"
            />
          </div>
        </div>

        <div className="space-y-2">
          <label className="text-xs text-muted-foreground">참고하고 싶은 포인트</label>
          <div className="flex flex-wrap gap-2">
            {FOCUS_OPTIONS.map((opt) => (
              <button
                key={opt.value}
                onClick={() => toggleFocus(opt.value)}
                className={[
                  "rounded-md border px-3 py-1 text-xs transition-colors",
                  selectedFocus.includes(opt.value)
                    ? "border-primary bg-primary text-primary-foreground"
                    : "border-border bg-background hover:bg-muted text-foreground",
                ].join(" ")}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </div>

        <div className="space-y-1">
          <label className="text-xs text-muted-foreground">추가 메모 (선택)</label>
          <Textarea
            value={userNotes}
            onChange={(e) => setUserNotes(e.target.value)}
            placeholder="이 곡에서 특히 참고하고 싶은 부분이 있으면 자유롭게 적어주세요."
            rows={2}
          />
        </div>

        {!apiKey && (
          <div className="rounded-md bg-muted/40 p-3 text-xs text-muted-foreground">
            AI 생성을 사용하려면{" "}
            <button
              onClick={() => navigate("/settings")}
              className="text-primary underline underline-offset-2 hover:text-primary/80"
            >
              설정 페이지
            </button>
            에서 Anthropic API 키를 입력해주세요.
          </div>
        )}

        <div className="flex gap-2">
          <Button
            onClick={handleGenerateAll}
            disabled={isGenerating || !artist.trim() || !songTitle.trim()}
            size="sm"
          >
            {isGenerating ? (
              <>
                <span className="mr-1.5 h-3.5 w-3.5 animate-spin rounded-full border-2 border-current border-t-transparent" />
                생성 중...
              </>
            ) : (
              "한 번에 생성"
            )}
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => {
              setArtist("");
              setSongTitle("");
              setSelectedFocus([]);
              setUserNotes("");
            }}
          >
            초기화
          </Button>
        </div>
      </div>

      {/* Reference Brief 결과 카드 */}
      <div className="rounded-lg border bg-muted/20 p-4 flex flex-col gap-2">
        <div className="flex items-center justify-between">
          <h3 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            Reference Brief
          </h3>
          {referenceBriefs.length > 0 && (
            <Badge variant="secondary">{referenceBriefs.length}개</Badge>
          )}
        </div>
        {referenceBriefs.length === 0 ? (
          <p className="text-xs text-muted-foreground">
            아직 생성된 Reference Brief가 없어요. 위에서 레퍼런스 곡을 입력하고 생성해보세요.
          </p>
        ) : (
          <div className="flex flex-col gap-2">
            {referenceBriefs.map((brief) => (
              <div key={brief.id} className="rounded-md border bg-background p-3 text-xs">
                <div className="flex items-center gap-2 mb-1">
                  <span className="font-medium">{brief.artist} — {brief.songTitle}</span>
                  <Badge variant="outline" className="text-xs">{brief.confidence}</Badge>
                </div>
                <p className="text-muted-foreground">{brief.summary}</p>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Track Plan 카드 */}
      <div className="rounded-lg border bg-muted/20 p-4 flex flex-col gap-2">
        <div className="flex items-center justify-between">
          <h3 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            Track Plan
          </h3>
          {trackPlans.length > 0 && (
            <Badge variant="secondary">{trackPlans.length}개</Badge>
          )}
        </div>
        <p className="text-xs text-muted-foreground">
          {trackPlans.length === 0
            ? "Track Plan은 원곡을 복제하는 것이 아니라, 비슷한 에너지와 제작 원리를 바탕으로 내 곡을 시작할 수 있게 도와주는 가이드입니다."
            : `${trackPlans.length}개의 Track Plan이 있어요.`}
        </p>
      </div>

      {/* Learn Missions 카드 */}
      <div className="rounded-lg border bg-muted/20 p-4 flex flex-col gap-2">
        <div className="flex items-center justify-between">
          <h3 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            Learn Missions
          </h3>
          {learningMissions.length > 0 && (
            <Badge variant="secondary">
              {learningMissions.filter((m) => m.completed).length}/{learningMissions.length} 완료
            </Badge>
          )}
        </div>
        {learningMissions.length === 0 ? (
          <p className="text-xs text-muted-foreground">
            Track Plan이 생성되면 초보 작곡가를 위한 미니 학습 미션을 만들 수 있어요.
          </p>
        ) : (
          <div className="flex flex-col gap-1.5">
            {learningMissions.map((mission) => (
              <div
                key={mission.id}
                className="flex items-center gap-2 rounded-md border bg-background p-2.5 text-xs"
              >
                <span className={mission.completed ? "line-through text-muted-foreground" : ""}>
                  {mission.title}
                </span>
                <Badge variant="outline" className="ml-auto text-xs">{mission.category}</Badge>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
