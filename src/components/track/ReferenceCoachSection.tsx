import { useState } from "react";
import { Check } from "lucide-react";
import { Button } from "../ui/button";
import { Badge } from "../ui/badge";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "../ui/tabs";
import { useAlbumStore } from "../../store/useAlbumStore";
import type { Track } from "../../lib/types/album";
import type { TrackPlan } from "../../lib/types/reference-coach";
import type { GeneratedPrompt } from "../../lib/types/prompt";

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
  const updateTrack = useAlbumStore((s) => s.updateTrack);
  const addSunoPromptTryout = useAlbumStore((s) => s.addSunoPromptTryout);

  const [appliedChordIds, setAppliedChordIds] = useState<Set<string>>(new Set());
  const [appliedGrooveIds, setAppliedGrooveIds] = useState<Set<string>>(new Set());
  const [appliedKeywordsId, setAppliedKeywordsId] = useState<string | null>(null);
  const [sunoTryoutPlanId, setSunoTryoutPlanId] = useState<string | null>(null);

  const referenceBriefs = track.referenceBriefs ?? [];
  const trackPlans = track.trackPlans ?? [];
  const learningMissions = track.learningMissions ?? [];

  async function handleApplyChord(plan: TrackPlan, chordIdx: number) {
    const suggestion = plan.chordProgressionSuggestions[chordIdx];
    if (!suggestion) return;
    const newCp = { ...suggestion, id: crypto.randomUUID(), isDefault: false };
    await updateTrack(track.id, {
      chordProgressions: [...track.chordProgressions, newCp],
    });
    setAppliedChordIds((prev) => new Set(prev).add(`${plan.id}-${chordIdx}`));
  }

  async function handleApplyGroove(plan: TrackPlan, grooveIdx: number) {
    const suggestion = plan.grooveSuggestions[grooveIdx];
    if (!suggestion) return;
    const newGp = { ...suggestion, id: crypto.randomUUID(), isDefault: false };
    await updateTrack(track.id, {
      groovePatterns: [...track.groovePatterns, newGp],
    });
    setAppliedGrooveIds((prev) => new Set(prev).add(`${plan.id}-${grooveIdx}`));
  }

  async function handleApplyKeywords(plan: TrackPlan) {
    await updateTrack(track.id, { soundKeywords: plan.soundKeywords });
    setAppliedKeywordsId(plan.id);
  }

  async function handleSunoTryout(plan: TrackPlan) {
    const now = new Date().toISOString();
    const kw = plan.soundKeywords;
    const style = [
      ...kw.drums.slice(0, 2),
      ...kw.bass.slice(0, 2),
      ...kw.melody.slice(0, 2),
      ...kw.fx.slice(0, 1),
    ]
      .filter(Boolean)
      .join(", ");

    const prompt: GeneratedPrompt = {
      id: crypto.randomUUID(),
      requestId: crypto.randomUUID(),
      style: style || plan.directionSummary,
      lyrics: "",
      moreRefreshing: "",
      moreEmotional: "",
      vocalFocused: kw.vocal.join(", "),
      grooveFocused: [...kw.drums, ...kw.bass].join(", "),
      type: "sound_design",
      sourceTrackPlanId: plan.id,
      sourceReferenceBriefId: plan.referenceBriefId,
      versionLabel: "balanced",
      createdAt: now,
    };
    await addSunoPromptTryout(track.id, prompt);
    setSunoTryoutPlanId(plan.id);
  }

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

      {referenceBriefs.length === 0 &&
        trackPlans.length === 0 &&
        learningMissions.length === 0 && (
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

      {/* Track Plan 카드 — 데이터 있을 때만 표시, 탭으로 구성 */}
      {trackPlans.length > 0 && (
        <div className="rounded-lg border bg-muted/20 p-4 flex flex-col gap-3">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              Track Plan
            </h3>
            <Badge variant="secondary">{trackPlans.length}개</Badge>
          </div>
          <div className="flex flex-col gap-3">
            {trackPlans.map((plan) => (
              <div key={plan.id} className="rounded-md border bg-background p-3 text-xs flex flex-col gap-2">
                <div className="flex items-center gap-2">
                  <span className="font-medium">{plan.title}</span>
                  <Badge variant="outline" className={CONFIDENCE_STYLES[plan.confidence] ?? ""}>
                    {CONFIDENCE_LABELS[plan.confidence] ?? plan.confidence}
                  </Badge>
                </div>
                <Tabs defaultValue="overview">
                  <TabsList className="h-7 text-xs">
                    <TabsTrigger value="overview" className="text-xs px-2 py-0.5">개요</TabsTrigger>
                    <TabsTrigger value="chords" className="text-xs px-2 py-0.5">코드</TabsTrigger>
                    <TabsTrigger value="groove" className="text-xs px-2 py-0.5">그루브</TabsTrigger>
                    <TabsTrigger value="apply" className="text-xs px-2 py-0.5">적용</TabsTrigger>
                  </TabsList>

                  <TabsContent value="overview" className="mt-2 flex flex-col gap-1.5">
                    <p className="text-muted-foreground">{plan.directionSummary}</p>
                    {plan.keySuggestions.length > 0 && (
                      <div className="flex items-center gap-1 flex-wrap">
                        <span className="text-muted-foreground">키:</span>
                        {plan.keySuggestions.map((k) => (
                          <Badge key={k} variant="secondary" className="text-xs">{k}</Badge>
                        ))}
                      </div>
                    )}
                    {plan.bpmSuggestions.length > 0 && (
                      <p className="text-muted-foreground">BPM: {plan.bpmSuggestions.join(", ")}</p>
                    )}
                  </TabsContent>

                  <TabsContent value="chords" className="mt-2 flex flex-col gap-1.5">
                    {plan.chordProgressionSuggestions.length > 0 ? (
                      plan.chordProgressionSuggestions.map((cp, idx) => {
                        const key = `${plan.id}-${idx}`;
                        const applied = appliedChordIds.has(key);
                        return (
                          <div key={cp.id ?? idx} className="flex items-center justify-between gap-2">
                            <span className="text-muted-foreground">
                              {cp.name}: {cp.chords.join(" - ")} ({cp.key} {cp.mode})
                            </span>
                            <Button
                              size="sm"
                              variant={applied ? "ghost" : "outline"}
                              className="h-6 px-2 text-xs shrink-0"
                              disabled={applied}
                              onClick={() => handleApplyChord(plan, idx)}
                            >
                              {applied ? <><Check className="h-3 w-3 mr-1" />추가됨</> : "코드 추가"}
                            </Button>
                          </div>
                        );
                      })
                    ) : (
                      <p className="text-muted-foreground">코드 제안이 없어요.</p>
                    )}
                  </TabsContent>

                  <TabsContent value="groove" className="mt-2 flex flex-col gap-1.5">
                    {plan.grooveSuggestions.length > 0 ? (
                      plan.grooveSuggestions.map((gp, idx) => {
                        const key = `${plan.id}-${idx}`;
                        const applied = appliedGrooveIds.has(key);
                        return (
                          <div key={gp.id ?? idx} className="flex items-center justify-between gap-2">
                            <span className="text-muted-foreground">{gp.name}</span>
                            <Button
                              size="sm"
                              variant={applied ? "ghost" : "outline"}
                              className="h-6 px-2 text-xs shrink-0"
                              disabled={applied}
                              onClick={() => handleApplyGroove(plan, idx)}
                            >
                              {applied ? <><Check className="h-3 w-3 mr-1" />추가됨</> : "그루브 추가"}
                            </Button>
                          </div>
                        );
                      })
                    ) : (
                      <p className="text-muted-foreground">그루브 제안이 없어요.</p>
                    )}
                  </TabsContent>

                  <TabsContent value="apply" className="mt-2 flex flex-col gap-2">
                    <Button
                      size="sm"
                      variant={appliedKeywordsId === plan.id ? "ghost" : "outline"}
                      className="h-7 px-3 text-xs self-start"
                      disabled={appliedKeywordsId === plan.id}
                      onClick={() => handleApplyKeywords(plan)}
                    >
                      {appliedKeywordsId === plan.id ? (
                        <><Check className="h-3 w-3 mr-1" />키워드 적용됨</>
                      ) : "사운드 키워드 적용"}
                    </Button>
                    <Button
                      size="sm"
                      variant={sunoTryoutPlanId === plan.id ? "ghost" : "outline"}
                      className="h-7 px-3 text-xs self-start"
                      disabled={sunoTryoutPlanId === plan.id}
                      onClick={() => handleSunoTryout(plan)}
                    >
                      {sunoTryoutPlanId === plan.id ? (
                        <><Check className="h-3 w-3 mr-1" />Suno 프롬프트 생성됨</>
                      ) : "Suno 프롬프트 만들기"}
                    </Button>
                  </TabsContent>
                </Tabs>
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
