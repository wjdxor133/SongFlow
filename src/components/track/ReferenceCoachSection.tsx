import { Check } from "lucide-react";
import { Badge } from "../ui/badge";
import { useAlbumStore } from "../../store/useAlbumStore";
import type { Track } from "../../lib/types/album";

const CATEGORY_LABELS: Record<string, string> = {
  harmony: "화성",
  drums: "드럼",
  bass: "베이스",
  topline: "탑라인",
  sound_design: "사운드 디자인",
  arrangement: "편곡",
  suno_prompt: "Suno 프롬프트",
};

const CONFIDENCE_LABELS: Record<string, string> = {
  high: "높음",
  medium: "보통",
  low: "낮음",
};

const CONFIDENCE_STYLES: Record<string, string> = {
  high: "border-green-500 text-green-600",
  medium: "",
  low: "border-orange-400 text-orange-500",
};

interface ReferenceCoachSectionProps {
  track: Track;
}

export function ReferenceCoachSection({ track }: ReferenceCoachSectionProps) {
  const updateLearningMission = useAlbumStore((s) => s.updateLearningMission);

  const referenceBriefs = track.referenceBriefs ?? [];
  const learningMissions = track.learningMissions ?? [];

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <div className="flex flex-col gap-0.5">
          <h2 className="text-sm font-semibold">Reference Coach</h2>
          <p className="text-xs text-muted-foreground">
            레퍼런스 곡을 바탕으로 한 제작 방향과 학습 미션을 보여줘요.
          </p>
        </div>
      </div>

      {referenceBriefs.length === 0 && learningMissions.length === 0 && (
        <div className="rounded-lg border border-dashed p-4 text-center text-xs text-muted-foreground">
          아직 분석 결과가 없어요. Claude Code의{" "}
          <span className="font-medium text-foreground">reference-to-suno</span> 스킬로
          생성하면 여기에 표시돼요.
        </div>
      )}

      {/* Reference Brief 결과 카드 — 데이터 있을 때만 표시 */}
      {referenceBriefs.length > 0 && (
        <div className="rounded-lg border bg-muted/20 p-4 flex flex-col gap-2">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              Reference Brief
            </h3>
            <Badge variant="secondary">{referenceBriefs.length}개</Badge>
          </div>
          <div className="flex flex-col gap-2">
            {referenceBriefs.map((brief) => (
              <div key={brief.id} className="rounded-md border bg-background p-3 text-xs flex flex-col gap-1.5">
                <div className="flex items-center gap-2">
                  <span className="font-medium">
                    {brief.artist} — {brief.songTitle}
                  </span>
                  <Badge variant="outline" className={CONFIDENCE_STYLES[brief.confidence] ?? ""}>
                    {CONFIDENCE_LABELS[brief.confidence] ?? brief.confidence}
                  </Badge>
                </div>
                <p className="text-muted-foreground">{brief.summary}</p>
                {brief.genreTags.length > 0 && (
                  <div className="flex flex-wrap gap-1">
                    {brief.genreTags.map((tag) => (
                      <Badge key={tag} variant="secondary" className="text-xs">
                        {tag}
                      </Badge>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 학습 미션 카드 — 데이터 있을 때만 표시 */}
      {learningMissions.length > 0 && (
        <div className="rounded-lg border bg-muted/20 p-4 flex flex-col gap-2">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              학습 미션
            </h3>
            <Badge variant="secondary">
              {learningMissions.filter((m) => m.completed).length}/{learningMissions.length} 완료
            </Badge>
          </div>
          <div className="flex flex-col gap-1.5">
            {learningMissions.map((mission) => (
              <div
                key={mission.id}
                className="rounded-md border bg-background p-3 text-xs flex flex-col gap-1"
              >
                <div className="flex items-center gap-2">
                  <button
                    onClick={() =>
                      updateLearningMission(track.id, mission.id, {
                        completed: !mission.completed,
                        completedAt: !mission.completed ? new Date().toISOString() : undefined,
                      })
                    }
                    className={[
                      "h-4 w-4 shrink-0 rounded border transition-colors",
                      mission.completed
                        ? "border-primary bg-primary text-primary-foreground"
                        : "border-border bg-background hover:border-primary",
                    ].join(" ")}
                    title={mission.completed ? "완료 취소" : "완료로 표시"}
                  >
                    {mission.completed && <Check className="h-3 w-3 m-auto" />}
                  </button>
                  <span className={mission.completed ? "line-through text-muted-foreground" : "font-medium"}>
                    {mission.title}
                  </span>
                  <Badge variant="outline" className="ml-auto text-xs">
                    {CATEGORY_LABELS[mission.category] ?? mission.category}
                  </Badge>
                </div>
                <p className={`text-muted-foreground ${mission.completed ? "opacity-60" : ""}`}>
                  {mission.objective}
                </p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
