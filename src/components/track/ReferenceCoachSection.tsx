import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { AlertCircle, Check } from "lucide-react";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { Textarea } from "../ui/textarea";
import { Badge } from "../ui/badge";
import { Alert, AlertDescription } from "../ui/alert";
import { useConfigStore } from "../../store/useConfigStore";
import { useAlbumStore } from "../../store/useAlbumStore";
import { callClaude, AnthropicApiError } from "../../lib/ai/anthropic";
import { buildPrompt } from "../../lib/agent/prompts";
import {
  validateReferenceBriefJson,
  validateTrackPlanJson,
  validateLearningMissionsJson,
} from "../../lib/agent/reference-coach-validator";
import type { Track } from "../../lib/types/album";
import type { TrackPlan, ReferenceFocus } from "../../lib/types/reference-coach";
import type { GeneratedPrompt } from "../../lib/types/prompt";

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

type GenerationStep = "idle" | "brief" | "plan" | "missions";

const STEP_LABELS: Record<GenerationStep, string> = {
  idle: "",
  brief: "Reference Brief 분석 중...",
  plan: "Track Plan 작성 중...",
  missions: "학습 미션 생성 중...",
};

interface ReferenceCoachSectionProps {
  track: Track;
}

export function ReferenceCoachSection({ track }: ReferenceCoachSectionProps) {
  const navigate = useNavigate();
  const apiKey = useConfigStore((s) => s.config.anthropicApiKey);
  const album = useAlbumStore((s) => s.albums.find((a) => a.id === track.albumId));
  const addReferenceBrief = useAlbumStore((s) => s.addReferenceBrief);
  const addTrackPlan = useAlbumStore((s) => s.addTrackPlan);
  const addLearningMissions = useAlbumStore((s) => s.addLearningMissions);
  const updateTrack = useAlbumStore((s) => s.updateTrack);
  const addSunoPromptTryout = useAlbumStore((s) => s.addSunoPromptTryout);

  const [artist, setArtist] = useState("");
  const [songTitle, setSongTitle] = useState("");
  const [selectedFocus, setSelectedFocus] = useState<ReferenceFocus[]>([]);
  const [userNotes, setUserNotes] = useState("");
  const [generationStep, setGenerationStep] = useState<GenerationStep>("idle");
  const [generationError, setGenerationError] = useState<string | null>(null);
  const [appliedChordIds, setAppliedChordIds] = useState<Set<string>>(new Set());
  const [appliedGrooveIds, setAppliedGrooveIds] = useState<Set<string>>(new Set());
  const [appliedKeywordsId, setAppliedKeywordsId] = useState<string | null>(null);
  const [sunoTryoutPlanId, setSunoTryoutPlanId] = useState<string | null>(null);

  const isGenerating = generationStep !== "idle";
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
    if (!artist.trim() || !songTitle.trim() || !album) return;

    setGenerationError(null);

    try {
      // Step 1: Reference Brief
      setGenerationStep("brief");
      const { instruction: briefInstruction, outputSchema: briefSchema } = buildPrompt(
        "generate_reference_brief",
        track,
        album,
        { artist: artist.trim(), songTitle: songTitle.trim(), userFocus: selectedFocus, userNotes }
      );
      const briefResult = await callClaude(apiKey, [
        { role: "user", content: `${briefInstruction}\n\nOutput schema:\n${briefSchema}` },
      ]);

      if (briefResult.parseStatus === "failed") {
        setGenerationError(
          `Reference Brief 생성 실패: JSON 파싱 오류 — ${briefResult.errorMessage ?? "알 수 없는 오류"}`
        );
        return;
      }

      const briefValidation = validateReferenceBriefJson(
        briefResult.parsedJson,
        track.id,
        artist.trim(),
        songTitle.trim(),
        selectedFocus,
        userNotes || undefined
      );
      if (!briefValidation.ok) {
        setGenerationError(`Reference Brief 유효성 오류: ${briefValidation.error}`);
        return;
      }

      await addReferenceBrief(track.id, briefValidation.data);
      const savedBriefId = briefValidation.data.id;

      // Step 2: Track Plan
      setGenerationStep("plan");
      const { instruction: planInstruction, outputSchema: planSchema } = buildPrompt(
        "generate_track_plan",
        track,
        album,
        { referenceBrief: briefValidation.data, briefId: savedBriefId }
      );
      const planResult = await callClaude(apiKey, [
        { role: "user", content: `${planInstruction}\n\nOutput schema:\n${planSchema}` },
      ]);

      if (planResult.parseStatus === "failed") {
        setGenerationError(
          `Track Plan 생성 실패: JSON 파싱 오류 — ${planResult.errorMessage ?? "알 수 없는 오류"}`
        );
        return;
      }

      const planValidation = validateTrackPlanJson(planResult.parsedJson, track.id, savedBriefId);
      if (!planValidation.ok) {
        setGenerationError(`Track Plan 유효성 오류: ${planValidation.error}`);
        return;
      }

      await addTrackPlan(track.id, planValidation.data);
      const savedPlanId = planValidation.data.id;

      // Step 3: Learning Missions
      setGenerationStep("missions");
      const { instruction: missionsInstruction, outputSchema: missionsSchema } = buildPrompt(
        "generate_learning_missions",
        track,
        album,
        { trackPlan: planValidation.data, planId: savedPlanId, briefId: savedBriefId }
      );
      const missionsResult = await callClaude(apiKey, [
        { role: "user", content: `${missionsInstruction}\n\nOutput schema:\n${missionsSchema}` },
      ]);

      if (missionsResult.parseStatus === "failed") {
        setGenerationError(
          `학습 미션 생성 실패: JSON 파싱 오류 — ${missionsResult.errorMessage ?? "알 수 없는 오류"}`
        );
        return;
      }

      const missionsValidation = validateLearningMissionsJson(
        missionsResult.parsedJson,
        track.id,
        savedPlanId,
        savedBriefId
      );
      if (!missionsValidation.ok) {
        setGenerationError(`학습 미션 유효성 오류: ${missionsValidation.error}`);
        return;
      }

      await addLearningMissions(track.id, missionsValidation.data);

      // 성공 시 입력 초기화
      setArtist("");
      setSongTitle("");
      setSelectedFocus([]);
      setUserNotes("");
    } catch (err) {
      if (err instanceof AnthropicApiError) {
        setGenerationError(`API 오류 (${err.status}): ${err.message}`);
      } else {
        setGenerationError(err instanceof Error ? err.message : String(err));
      }
    } finally {
      setGenerationStep("idle");
    }
  }

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
              disabled={isGenerating}
            />
          </div>
          <div className="space-y-1">
            <label className="text-xs text-muted-foreground">곡 제목</label>
            <Input
              value={songTitle}
              onChange={(e) => setSongTitle(e.target.value)}
              placeholder="예: OMG"
              disabled={isGenerating}
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
                disabled={isGenerating}
                className={[
                  "rounded-md border px-3 py-1 text-xs transition-colors",
                  selectedFocus.includes(opt.value)
                    ? "border-primary bg-primary text-primary-foreground"
                    : "border-border bg-background hover:bg-muted text-foreground",
                  isGenerating ? "opacity-50 cursor-not-allowed" : "",
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
            disabled={isGenerating}
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

        {generationError && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{generationError}</AlertDescription>
          </Alert>
        )}

        {isGenerating && (
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <span className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-current border-t-transparent" />
            {STEP_LABELS[generationStep]}
          </div>
        )}

        <div className="flex gap-2">
          <Button
            onClick={handleGenerateAll}
            disabled={isGenerating || !artist.trim() || !songTitle.trim()}
            size="sm"
          >
            {isGenerating ? "생성 중..." : "한 번에 생성"}
          </Button>
          <Button
            variant="ghost"
            size="sm"
            disabled={isGenerating}
            onClick={() => {
              setArtist("");
              setSongTitle("");
              setSelectedFocus([]);
              setUserNotes("");
              setGenerationError(null);
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
              <div key={brief.id} className="rounded-md border bg-background p-3 text-xs flex flex-col gap-1.5">
                <div className="flex items-center gap-2">
                  <span className="font-medium">
                    {brief.artist} — {brief.songTitle}
                  </span>
                  <Badge
                    variant="outline"
                    className={
                      brief.confidence === "high"
                        ? "border-green-500 text-green-600"
                        : brief.confidence === "low"
                          ? "border-orange-400 text-orange-500"
                          : ""
                    }
                  >
                    {brief.confidence === "high" ? "높음" : brief.confidence === "low" ? "낮음" : "보통"}
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
                <p className="text-muted-foreground/70 italic">{brief.disclaimer}</p>
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
        {trackPlans.length === 0 ? (
          <p className="text-xs text-muted-foreground">
            Track Plan은 원곡을 복제하는 것이 아니라, 비슷한 에너지와 제작 원리를 바탕으로 내 곡을
            시작할 수 있게 도와주는 가이드입니다.
          </p>
        ) : (
          <div className="flex flex-col gap-2">
            {trackPlans.map((plan) => (
              <div key={plan.id} className="rounded-md border bg-background p-3 text-xs flex flex-col gap-2">
                <div className="flex items-center gap-2">
                  <span className="font-medium">{plan.title}</span>
                  <Badge
                    variant="outline"
                    className={
                      plan.confidence === "high"
                        ? "border-green-500 text-green-600"
                        : plan.confidence === "low"
                          ? "border-orange-400 text-orange-500"
                          : ""
                    }
                  >
                    {plan.confidence === "high" ? "높음" : plan.confidence === "low" ? "낮음" : "보통"}
                  </Badge>
                </div>
                <p className="text-muted-foreground">{plan.directionSummary}</p>
                {plan.keySuggestions.length > 0 && (
                  <div className="flex items-center gap-1 flex-wrap">
                    <span className="text-muted-foreground">키:</span>
                    {plan.keySuggestions.map((k) => (
                      <Badge key={k} variant="secondary" className="text-xs">
                        {k}
                      </Badge>
                    ))}
                  </div>
                )}
                {plan.bpmSuggestions.length > 0 && (
                  <p className="text-muted-foreground">BPM: {plan.bpmSuggestions.join(", ")}</p>
                )}

                {/* 코드 진행 적용 */}
                {plan.chordProgressionSuggestions.length > 0 && (
                  <div className="flex flex-col gap-1 pt-1 border-t border-border/50">
                    <span className="text-muted-foreground font-medium">코드 진행 제안</span>
                    {plan.chordProgressionSuggestions.map((cp, idx) => {
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
                            className="h-6 px-2 text-xs"
                            disabled={applied}
                            onClick={() => handleApplyChord(plan, idx)}
                          >
                            {applied ? (
                              <><Check className="h-3 w-3 mr-1" />추가됨</>
                            ) : "코드 추가"}
                          </Button>
                        </div>
                      );
                    })}
                  </div>
                )}

                {/* 그루브 적용 */}
                {plan.grooveSuggestions.length > 0 && (
                  <div className="flex flex-col gap-1 pt-1 border-t border-border/50">
                    <span className="text-muted-foreground font-medium">그루브 제안</span>
                    {plan.grooveSuggestions.map((gp, idx) => {
                      const key = `${plan.id}-${idx}`;
                      const applied = appliedGrooveIds.has(key);
                      return (
                        <div key={gp.id ?? idx} className="flex items-center justify-between gap-2">
                          <span className="text-muted-foreground">{gp.name}</span>
                          <Button
                            size="sm"
                            variant={applied ? "ghost" : "outline"}
                            className="h-6 px-2 text-xs"
                            disabled={applied}
                            onClick={() => handleApplyGroove(plan, idx)}
                          >
                            {applied ? (
                              <><Check className="h-3 w-3 mr-1" />추가됨</>
                            ) : "그루브 추가"}
                          </Button>
                        </div>
                      );
                    })}
                  </div>
                )}

                {/* 사운드 키워드 / Suno 프롬프트 */}
                <div className="flex gap-2 pt-1 border-t border-border/50">
                  <Button
                    size="sm"
                    variant={appliedKeywordsId === plan.id ? "ghost" : "outline"}
                    className="h-6 px-2 text-xs"
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
                    className="h-6 px-2 text-xs"
                    disabled={sunoTryoutPlanId === plan.id}
                    onClick={() => handleSunoTryout(plan)}
                  >
                    {sunoTryoutPlanId === plan.id ? (
                      <><Check className="h-3 w-3 mr-1" />Suno 프롬프트 생성됨</>
                    ) : "Suno 프롬프트 만들기"}
                  </Button>
                </div>

                <p className="text-muted-foreground/70 italic">{plan.disclaimer}</p>
              </div>
            ))}
          </div>
        )}
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
                className="rounded-md border bg-background p-3 text-xs flex flex-col gap-1"
              >
                <div className="flex items-center gap-2">
                  <span
                    className={mission.completed ? "line-through text-muted-foreground" : "font-medium"}
                  >
                    {mission.title}
                  </span>
                  <Badge variant="outline" className="ml-auto text-xs">
                    {mission.category}
                  </Badge>
                </div>
                <p className="text-muted-foreground">{mission.objective}</p>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
