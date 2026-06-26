import { ChevronLeft, ChevronRight, Check } from "lucide-react";
import { Button } from "../ui/button";

export interface GuidedStep {
  title: string;
}

interface GuidedStepperProps {
  steps: GuidedStep[];
  current: number;
  onBack: () => void;
  onNext: () => void;
  /** Label for the Next button on the final step. */
  finishLabel?: string;
  /** When true, hides the Next button entirely (e.g. final hand-off step). */
  hideNext?: boolean;
}

/**
 * Lightweight in-page stepper for the guided onboarding walkthrough.
 * No external dependency — renders step indicators, a progress bar, and Back/Next controls.
 * Contains no AI dependencies.
 */
export function GuidedStepper({
  steps,
  current,
  onBack,
  onNext,
  finishLabel = "다음",
  hideNext = false,
}: GuidedStepperProps) {
  const total = steps.length;
  const progress = total > 1 ? (current / (total - 1)) * 100 : 100;
  const isLast = current >= total - 1;

  return (
    <div className="flex flex-col gap-3">
      {/* 단계 표시 */}
      <ol className="flex items-center gap-1.5">
        {steps.map((step, idx) => {
          const done = idx < current;
          const active = idx === current;
          return (
            <li key={step.title} className="flex flex-1 items-center gap-2">
              <span
                className={[
                  "flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-xs font-medium transition-colors",
                  active
                    ? "bg-primary text-primary-foreground"
                    : done
                      ? "bg-primary/15 text-primary"
                      : "bg-muted text-muted-foreground",
                ].join(" ")}
              >
                {done ? <Check className="h-3.5 w-3.5" /> : idx + 1}
              </span>
              <span
                className={[
                  "hidden truncate text-xs sm:inline",
                  active ? "font-medium text-foreground" : "text-muted-foreground",
                ].join(" ")}
              >
                {step.title}
              </span>
            </li>
          );
        })}
      </ol>

      {/* 진행 바 */}
      <div className="h-1 w-full overflow-hidden rounded-full bg-muted">
        <div
          className="h-full rounded-full bg-primary transition-all"
          style={{ width: `${progress}%` }}
        />
      </div>

      {/* 이동 버튼 */}
      <div className="flex items-center justify-between">
        <Button
          type="button"
          size="sm"
          variant="outline"
          onClick={onBack}
          disabled={current === 0}
        >
          <ChevronLeft className="mr-1 h-3.5 w-3.5" />
          이전
        </Button>
        <span className="text-xs text-muted-foreground">
          {current + 1} / {total}
        </span>
        {!hideNext && (
          <Button type="button" size="sm" onClick={onNext}>
            {isLast ? finishLabel : "다음"}
            {!isLast && <ChevronRight className="ml-1 h-3.5 w-3.5" />}
          </Button>
        )}
        {hideNext && <span className="w-[64px]" aria-hidden />}
      </div>
    </div>
  );
}
