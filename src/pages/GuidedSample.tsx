import { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Sparkles,
  Music,
  ClipboardCopy,
  Rocket,
  Lightbulb,
  KeyRound,
  LayoutDashboard,
} from "lucide-react";
import { GUIDED_SAMPLE } from "../lib/onboarding/sampleTrack";
import { GuidedStepper, type GuidedStep } from "../components/onboarding/GuidedStepper";
import { ChordPlayback } from "../components/track/ChordPlayback";
import { CopyButton } from "../components/ui/CopyButton";
import { Button } from "../components/ui/button";
import { Badge } from "../components/ui/badge";

const ONBOARDING_COMPLETED_KEY = "songflow.onboarding.completed";

const STEPS: GuidedStep[] = [
  { title: "레퍼런스 분석" },
  { title: "코드 & 그루브 듣기" },
  { title: "Suno 프롬프트 복사" },
  { title: "내 곡 만들기" },
];

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

const CATEGORY_LABELS: Record<string, string> = {
  harmony: "화성",
  drums: "드럼",
  bass: "베이스",
  topline: "탑라인",
  sound_design: "사운드 디자인",
  arrangement: "편곡",
  suno_prompt: "Suno 프롬프트",
};

function SectionCard({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-col gap-2 rounded-lg border bg-muted/20 p-4">
      <h3 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
        {title}
      </h3>
      {children}
    </div>
  );
}

export function GuidedSample() {
  const navigate = useNavigate();
  const [step, setStep] = useState(0);

  const { bakedBrief, bakedPlan, bakedChords, bakedGroove, bakedMissions, bakedPrompt } =
    GUIDED_SAMPLE;

  function markCompleted() {
    try {
      localStorage.setItem(ONBOARDING_COMPLETED_KEY, "1");
    } catch {
      // localStorage unavailable — non-blocking
    }
  }

  function handleNext() {
    if (step >= STEPS.length - 1) return;
    setStep((s) => s + 1);
  }

  function handleBack() {
    setStep((s) => Math.max(0, s - 1));
  }

  return (
    <div className="mx-auto flex max-w-3xl flex-col gap-6 p-6">
      {/* 헤더 */}
      <div className="flex flex-col gap-1">
        <div className="flex items-center gap-2">
          <Sparkles className="h-4 w-4 text-primary" />
          <h1 className="text-lg font-semibold">가이드 샘플 둘러보기</h1>
        </div>
        <p className="text-sm text-muted-foreground">
          API 키 없이도 SongFlow의 전체 흐름을 체험해보세요. 레퍼런스 분석부터 Suno 프롬프트
          복사까지, 미리 준비된 샘플로 따라가 봅니다.
        </p>
      </div>

      {/* 스테퍼 */}
      <GuidedStepper
        steps={STEPS}
        current={step}
        onBack={handleBack}
        onNext={handleNext}
        hideNext={step === STEPS.length - 1}
      />

      <div className="grid gap-6 lg:grid-cols-[1fr_240px]">
        {/* 메인 콘텐츠 */}
        <div className="flex flex-col gap-4">
          {/* ── Step 1: 레퍼런스 분석 ── */}
          {step === 0 && (
            <>
              <SectionCard title="Reference Brief">
                <div className="flex flex-col gap-2 rounded-md border bg-background p-3 text-xs">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="font-medium">
                      {bakedBrief.artist} — {bakedBrief.songTitle}
                    </span>
                    <Badge
                      variant="outline"
                      className={CONFIDENCE_STYLES[bakedBrief.confidence] ?? ""}
                    >
                      신뢰도 {CONFIDENCE_LABELS[bakedBrief.confidence] ?? bakedBrief.confidence}
                    </Badge>
                  </div>
                  <p className="text-muted-foreground">{bakedBrief.summary}</p>
                  {bakedBrief.genreTags.length > 0 && (
                    <div className="flex flex-wrap gap-1">
                      {bakedBrief.genreTags.map((tag) => (
                        <Badge key={tag} variant="secondary">
                          {tag}
                        </Badge>
                      ))}
                    </div>
                  )}
                  {bakedBrief.moodTags.length > 0 && (
                    <div className="flex flex-wrap gap-1">
                      {bakedBrief.moodTags.map((tag) => (
                        <Badge key={tag} variant="outline">
                          {tag}
                        </Badge>
                      ))}
                    </div>
                  )}
                  <div className="mt-1 rounded-md bg-muted/40 p-2 text-[11px] leading-relaxed text-muted-foreground">
                    {bakedBrief.disclaimer}
                  </div>
                </div>
              </SectionCard>

              <SectionCard title="Track Plan 개요">
                <div className="flex flex-col gap-3 rounded-md border bg-background p-3 text-xs">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="font-medium">{bakedPlan.title}</span>
                    <Badge
                      variant="outline"
                      className={CONFIDENCE_STYLES[bakedPlan.confidence] ?? ""}
                    >
                      신뢰도 {CONFIDENCE_LABELS[bakedPlan.confidence] ?? bakedPlan.confidence}
                    </Badge>
                  </div>

                  {/* 초보자 설명 강조 */}
                  <div className="rounded-md border border-primary/20 bg-primary/5 p-3">
                    <div className="mb-1 flex items-center gap-1.5 font-medium text-primary">
                      <Lightbulb className="h-3.5 w-3.5" />
                      초보자를 위한 설명
                    </div>
                    <p className="leading-relaxed text-foreground/80">
                      {bakedPlan.beginnerExplanation}
                    </p>
                  </div>

                  <p className="leading-relaxed text-muted-foreground">
                    {bakedPlan.directionSummary}
                  </p>

                  <div className="flex flex-wrap items-center gap-1">
                    <span className="text-muted-foreground">키 추천:</span>
                    {bakedPlan.keySuggestions.map((k) => (
                      <Badge key={k} variant="secondary">
                        {k}
                      </Badge>
                    ))}
                  </div>
                  <p className="text-muted-foreground">
                    BPM 추천: {bakedPlan.bpmSuggestions.join(", ")}
                  </p>
                </div>
              </SectionCard>
            </>
          )}

          {/* ── Step 2: 코드 & 그루브 듣기 ── */}
          {step === 1 && (
            <>
              <SectionCard title="코드 진행 — 재생 버튼으로 들어보세요">
                <div className="flex flex-col gap-2">
                  {bakedChords.map((cp) => (
                    <ChordPlayback key={cp.id} cp={cp} isSelected={false} />
                  ))}
                </div>
              </SectionCard>

              <SectionCard title="그루브 패턴">
                <div className="flex flex-col gap-1.5">
                  {bakedGroove.map((gp) => {
                    const desc =
                      gp.pattern &&
                      typeof gp.pattern === "object" &&
                      "description" in gp.pattern
                        ? String((gp.pattern as { description?: unknown }).description ?? "")
                        : "";
                    return (
                      <div
                        key={gp.id}
                        className="flex flex-col gap-0.5 rounded-md border bg-background p-3 text-xs"
                      >
                        <div className="flex items-center gap-2">
                          <Music className="h-3.5 w-3.5 text-muted-foreground" />
                          <span className="font-medium">{gp.name}</span>
                          {gp.bpm && (
                            <span className="text-muted-foreground">· {gp.bpm} BPM</span>
                          )}
                        </div>
                        {desc && <p className="text-muted-foreground">{desc}</p>}
                      </div>
                    );
                  })}
                </div>
              </SectionCard>

              <SectionCard title="베이스 — 초보자 팁">
                <div className="flex flex-col gap-2 rounded-md border bg-background p-3 text-xs">
                  <p className="text-muted-foreground">{bakedPlan.bassDirection.summary}</p>
                  <ul className="flex list-disc flex-col gap-1 pl-4 text-muted-foreground">
                    {bakedPlan.bassDirection.beginnerTips.map((tip, i) => (
                      <li key={i}>{tip}</li>
                    ))}
                  </ul>
                </div>
              </SectionCard>

              <SectionCard title="탑라인 — Suno 팁">
                <div className="flex flex-col gap-2 rounded-md border bg-background p-3 text-xs">
                  <p className="text-muted-foreground">{bakedPlan.toplineDirection.summary}</p>
                  <ul className="flex list-disc flex-col gap-1 pl-4 text-muted-foreground">
                    {bakedPlan.toplineDirection.sunoTips.map((tip, i) => (
                      <li key={i}>{tip}</li>
                    ))}
                  </ul>
                </div>
              </SectionCard>
            </>
          )}

          {/* ── Step 3: Suno 프롬프트 복사 ── */}
          {step === 2 && (
            <>
              <div className="flex items-center gap-2 rounded-md border border-primary/20 bg-primary/5 p-3 text-xs text-foreground/80">
                <ClipboardCopy className="h-4 w-4 shrink-0 text-primary" />
                아래 프롬프트를 복사해 Suno(suno.com)에 붙여넣으면, API 키 없이 바로 음악을
                만들어볼 수 있어요.
              </div>

              <SectionCard title="스타일 프롬프트">
                <div className="rounded-md border bg-background p-3">
                  <div className="mb-2 flex items-center justify-between">
                    <span className="text-xs font-medium">Style</span>
                    <CopyButton text={bakedPrompt.style} />
                  </div>
                  <p className="whitespace-pre-wrap break-words font-mono text-xs leading-relaxed text-muted-foreground">
                    {bakedPrompt.style}
                  </p>
                </div>
              </SectionCard>

              <SectionCard title="가사">
                <div className="rounded-md border bg-background p-3">
                  <div className="mb-2 flex items-center justify-between">
                    <span className="text-xs font-medium">Lyrics</span>
                    <CopyButton text={bakedPrompt.lyrics} />
                  </div>
                  <pre className="whitespace-pre-wrap break-words font-mono text-xs leading-relaxed text-muted-foreground">
                    {bakedPrompt.lyrics}
                  </pre>
                </div>
              </SectionCard>
            </>
          )}

          {/* ── Step 4: 내 곡 만들기 ── */}
          {step === 3 && (
            <SectionCard title="이제 내 곡을 만들어볼까요?">
              <div className="flex flex-col gap-4 rounded-md border bg-background p-4 text-sm">
                <div className="flex items-center gap-2">
                  <Rocket className="h-5 w-5 text-primary" />
                  <span className="font-medium">샘플 둘러보기를 모두 마쳤어요!</span>
                </div>
                <p className="leading-relaxed text-muted-foreground">
                  방금 본 분석·코드·그루브·프롬프트는 미리 준비된 샘플이었어요. 직접 좋아하는
                  곡을 레퍼런스로 분석하고 나만의 곡을 만들려면 Anthropic API 키가 필요합니다.
                  설정 페이지에서 키를 입력하면 모든 AI 기능이 열려요.
                </p>
                <div className="flex flex-wrap gap-2">
                  <Button
                    size="sm"
                    onClick={() => {
                      markCompleted();
                      navigate("/settings");
                    }}
                  >
                    <KeyRound className="mr-1.5 h-3.5 w-3.5" />
                    API 키 설정하기
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => {
                      markCompleted();
                      navigate("/");
                    }}
                  >
                    <LayoutDashboard className="mr-1.5 h-3.5 w-3.5" />
                    대시보드로 이동
                  </Button>
                </div>
              </div>
            </SectionCard>
          )}
        </div>

        {/* ── 사이드바: 이번에 배울 것 (학습 미션) ── */}
        <aside className="flex flex-col gap-2">
          <div className="flex flex-col gap-2 rounded-lg border bg-muted/20 p-4">
            <h3 className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              <Lightbulb className="h-3.5 w-3.5" />
              이번에 배울 것
            </h3>
            <div className="flex flex-col gap-2">
              {bakedMissions.map((mission) => (
                <div
                  key={mission.id}
                  className="flex flex-col gap-1 rounded-md border bg-background p-3 text-xs"
                >
                  <div className="flex items-start gap-2">
                    <span className="font-medium leading-snug">{mission.title}</span>
                    <Badge variant="outline" className="ml-auto shrink-0">
                      {CATEGORY_LABELS[mission.category] ?? mission.category}
                    </Badge>
                  </div>
                  <p className="text-muted-foreground">{mission.objective}</p>
                  <p className="rounded bg-muted/40 p-2 text-[11px] leading-relaxed text-muted-foreground">
                    💡 {mission.beginnerHint}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
}
