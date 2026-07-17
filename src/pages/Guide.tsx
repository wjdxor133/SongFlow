import { useState } from "react";
import { Check, Copy } from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "../components/ui/card";

function CodeBlock({ code }: { code: string }) {
  const [copied, setCopied] = useState(false);

  function handleCopy() {
    navigator.clipboard.writeText(code).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    });
  }

  return (
    <div className="relative flex items-center gap-2 rounded-md bg-muted px-3 py-2 font-mono text-xs">
      <span className="flex-1 break-all">{code}</span>
      <button
        onClick={handleCopy}
        className="shrink-0 rounded p-0.5 text-muted-foreground hover:text-foreground transition-colors"
        title="복사"
      >
        {copied ? (
          <Check className="h-3.5 w-3.5 text-green-500" />
        ) : (
          <Copy className="h-3.5 w-3.5" />
        )}
      </button>
    </div>
  );
}

function TriggerBadge({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);

  function handleCopy() {
    navigator.clipboard.writeText(text).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    });
  }

  return (
    <button
      onClick={handleCopy}
      className="inline-flex items-center gap-1 rounded border border-border bg-muted px-2 py-0.5 text-xs font-medium hover:bg-accent transition-colors"
      title="클릭해서 복사"
    >
      <span>"{text}"</span>
      {copied ? (
        <Check className="h-3 w-3 text-green-500" />
      ) : (
        <Copy className="h-3 w-3 text-muted-foreground" />
      )}
    </button>
  );
}

const skills = [
  {
    name: "reference-to-suno",
    trigger: "〈아티스트 - 곡명〉 레퍼런스로 새 트랙 준비해줘",
    description:
      "Q&A 후 가사·코드 진행·Suno 프롬프트·설정을 앱에 저장합니다.",
  },
  {
    name: "ableton-setup",
    trigger: "이 트랙 에이블톤에 깔아줘",
    description:
      "백업 → 템포 설정 → 트랙 생성 → 송폼 로케이터 → 코드·베이스·드럼 MIDI 초안을 자동으로 만듭니다.",
  },
  {
    name: "refine-suno",
    trigger: "보컬에 기계음 추임새가 섞여",
    description:
      "증상을 말하면 레버(style / Suno 설정 / 가사 / 코드)에 매핑해 프롬프트와 설정을 즉시 갱신합니다.",
  },
  {
    name: "lyrics-from-reference",
    trigger: "레퍼런스 구조로 가사만 뽑아줘",
    description: "레퍼런스 곡 구조를 따라 가사만 단독으로 생성합니다.",
  },
  {
    name: "theory-coach",
    trigger: "이 코드 왜 이런 느낌이야?",
    description:
      "대화형 이론 코치. 저장은 없으며 궁금한 걸 바로 물어보면 됩니다.",
  },
];

const workflowSteps = [
  {
    num: "①",
    manual: false,
    text: "레퍼런스 재료 생성 — reference-to-suno 스킬 실행",
  },
  {
    num: "②",
    manual: true,
    text: "Live에서 새 프로젝트를 music/SongFlow/ 아래에 저장",
  },
  {
    num: "③",
    manual: false,
    text: "에이블톤 셋업 — ableton-setup 스킬 실행",
  },
  {
    num: "④",
    manual: true,
    text: '악기 올리기 (Bass는 Mono + Glide) → 귀 판정. 별로면 증상을 말로 전달해 refine 반복: 예) "베이스가 초보 같아"',
  },
  {
    num: "⑤",
    manual: true,
    text: "⇧⌘R 바운스 (MIDI만, 샘플 금지) → Suno Upload → Add Vocals (가사·스타일은 앱에서 복사, Audio Strength 최대)",
  },
  {
    num: "⑥",
    manual: true,
    text: "보컬 스템만 다운로드 → 같은 Live 프로젝트에 드래그 → 완성",
  },
];

export function Guide() {

  return (
    <div className="flex h-full flex-col gap-8 p-6 overflow-auto">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">가이드</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          SongFlow × Claude Code × Ableton × Suno 워크플로우 레퍼런스
        </p>
      </div>

      {/* §1 시작하기 — 연결 확인 */}
      <section className="flex flex-col gap-4">
        <h2 className="text-base font-semibold tracking-tight">
          §1 시작하기 — 연결 확인
        </h2>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm">SongFlow MCP 연결</CardTitle>
            <CardDescription>
              Claude Code에서 아래 명령으로 songflow 서버가 목록에 있는지
              확인하세요.
            </CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col gap-2">
            <CodeBlock code="claude mcp list" />
            <p className="text-xs text-muted-foreground">
              songflow 항목이 보이면 준비 완료입니다.
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm">Ableton 제어 전제 조건</CardTitle>
            <CardDescription>
              AbletonMCP Remote Script 설치 후 Live 설정에서 Control Surface를
              AbletonMCP로 지정해야 합니다.
            </CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col gap-2">
            <p className="text-xs text-muted-foreground">연결 확인 명령:</p>
            <CodeBlock code="nc -z localhost 9877" />
            <p className="text-xs text-muted-foreground">
              응답이 없으면 Live가 실행 중인지, Remote Script가 활성화됐는지
              확인하세요.
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm">Suno 계정</CardTitle>
            <CardDescription>
              Suno Pro 이상 플랜이 필요합니다. Add Vocals 기능과 스템 분리가
              활성화되어야 워크플로우가 작동합니다.
            </CardDescription>
          </CardHeader>
        </Card>
      </section>

      {/* §2 스킬로 작업하기 */}
      <section className="flex flex-col gap-4">
        <h2 className="text-base font-semibold tracking-tight">
          §2 스킬로 작업하기
        </h2>
        <p className="text-sm text-muted-foreground">
          트리거 문장을 클릭하면 클립보드에 복사됩니다. Claude Code에 그대로
          붙여넣으세요.
        </p>

        <div className="flex flex-col gap-3">
          {skills.map((skill) => (
            <Card key={skill.name}>
              <CardHeader className="pb-2">
                <div className="flex flex-wrap items-center gap-2">
                  <CardTitle className="text-sm font-mono">
                    {skill.name}
                  </CardTitle>
                  <TriggerBadge text={skill.trigger} />
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-xs text-muted-foreground">
                  {skill.description}
                </p>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      {/* §3 전체 워크플로우 */}
      <section className="flex flex-col gap-4">
        <h2 className="text-base font-semibold tracking-tight">
          §3 전체 워크플로우
        </h2>
        <p className="text-xs text-muted-foreground">
          🖐 = 직접 해야 하는 수동 단계
        </p>

        <Card>
          <CardContent className="pt-4">
            <ol className="flex flex-col gap-3">
              {workflowSteps.map((step) => (
                <li key={step.num} className="flex items-start gap-3">
                  <span className="shrink-0 text-sm font-semibold tabular-nums">
                    {step.num}
                  </span>
                  {step.manual && (
                    <span className="shrink-0 text-sm" title="수동 단계">
                      🖐
                    </span>
                  )}
                  <p className="text-sm text-foreground/90">{step.text}</p>
                </li>
              ))}
            </ol>
          </CardContent>
        </Card>
      </section>

      {/* §4 대시보드에서 확인할 것 */}
      <section className="flex flex-col gap-4">
        <h2 className="text-base font-semibold tracking-tight">
          §4 대시보드에서 확인할 것
        </h2>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm">앨범 카드 → 트랙 페이지</CardTitle>
            <CardDescription>
              트랙 페이지에서 아래 데이터를 바로 꺼내 쓸 수 있습니다.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ul className="flex flex-col gap-2 text-sm text-foreground/90">
              <li className="flex gap-2">
                <span className="shrink-0 text-muted-foreground">·</span>
                <span>
                  <strong>프롬프트 카드</strong> — style / lyrics를 Suno에
                  복사
                </span>
              </li>
              <li className="flex gap-2">
                <span className="shrink-0 text-muted-foreground">·</span>
                <span>
                  <strong>Suno 설정 카드</strong> — Weirdness · Style Influence
                  · Exclude Styles 값을 그대로 입력
                </span>
              </li>
              <li className="flex gap-2">
                <span className="shrink-0 text-muted-foreground">·</span>
                <span>
                  <strong>코드 진행 + DAW 노트 표</strong> — 근음·보이싱·MIDI
                  번호. DAW에 직접 찍거나{" "}
                  <code className="rounded bg-muted px-1 py-0.5 text-xs font-mono">
                    exports/.mid
                  </code>{" "}
                  드래그
                </span>
              </li>
              <li className="flex gap-2">
                <span className="shrink-0 text-muted-foreground">·</span>
                <span>
                  <strong>샘플 검색 키워드</strong> — Splice에 복사
                </span>
              </li>
              <li className="flex gap-2">
                <span className="shrink-0 text-muted-foreground">·</span>
                <span>
                  <strong>피드백 / 이터레이션 이력</strong> — 이전 시도와
                  변경사항 추적
                </span>
              </li>
            </ul>
          </CardContent>
        </Card>

        <Card className="border-amber-500/30 bg-amber-500/5">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">원칙</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-foreground/90">
              <strong>앱에서는 편집하지 않습니다.</strong> 바꾸고 싶으면 Claude
              Code에 말하세요. 앱은 데이터를 보고 복사하는 뷰어입니다.
            </p>
          </CardContent>
        </Card>

      </section>
    </div>
  );
}
