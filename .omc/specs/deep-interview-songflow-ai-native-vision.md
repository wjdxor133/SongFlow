# Deep Interview Spec: SongFlow — AI-Native 음악 제작 환경 (비전 → 실행 가능 정의)

## Metadata
- Interview ID: di-songflow-ai-native-os-vision
- Rounds: 10 (+ Round 0 토폴로지 게이트)
- Final Ambiguity Score: 19%
- Type: brownfield
- Generated: 2026-07-12
- Threshold: 0.2
- Threshold Source: default
- Initial Context Summarized: yes (비전 문서 원문 → 프롬프트-세이프 요약)
- Status: PASSED

## Clarity Breakdown
| Dimension | Score | Weight | Weighted |
|-----------|-------|--------|----------|
| Goal Clarity | 0.85 | 0.35 | 0.30 |
| Constraint Clarity | 0.85 | 0.25 | 0.21 |
| Success Criteria | 0.75 | 0.25 | 0.19 |
| Context Clarity | 0.72 | 0.15 | 0.11 |
| **Total Clarity** | | | **0.81** |
| **Ambiguity** | | | **0.19** |

## Topology
| Component | Status | Description | Coverage / Deferral Note |
|-----------|--------|-------------|--------------------------|
| 오케스트레이션 코어 | active | 창작 의도 해석 + 에이전트 조정. 대화 창구 = Claude Code (별도 대화 UI 없음, R0에서 병합) | 정체성(R9), 성공 기준(R7) 커버 |
| 프로젝트 메모리 | active | 프로젝트 수명 전체의 음악적 컨텍스트 유지 | R6에서 "현상 유지 + 필요 시 필드 추가"로 해소. 신규 메모리 레이어 없음 |
| DAW 통합 레이어 | active | Ableton 프로젝트 직접 조작 | 1차 목표(셋업 자동화, R5), 안전 경계(R8) 커버 |
| AI 모델 어댑터 | **deferred** | 외부 AI 교체 가능 추상화 | R3 사용자 확인: "당장은 Suno만". 새 AI 필요 시 스킬 추가로 대응 (2026-07-12) |

## Goal
SongFlow는 **오너 1인의 음악 제작 환경 전체의 이름**이다: Claude Code(대화 창구·오케스트레이터) + SongFlow 스킬들 + MCP 서버 + 데이터 파일(메모리) + Ableton 연결 + Tauri 앱(데이터 뷰어 표면). "Cursor for Music"의 실체는 새 시스템 축조가 아니라 **Claude Code를 음악 제작의 셸로 만드는 구성**이다.

당면 목표: **1주 스파이크** — AbletonMCP(또는 동급 기성 도구) + 기존 스킬 조합으로 "Crave 트랙 작업 시작하자" 한마디에 Ableton 프로젝트 셋업(BPM/키 세팅, 트랙 구성, 코드 MIDI 배치)이 자동 완료되어 손대지 않고 바로 작업 가능한 상태를 만든다. 스파이크에서 드러난 결핍만이 SongFlow가 직접 소유(자체 구현)할 대상이 된다.

## Constraints
- 오너 1인용. 불특정 사용자 대상 제품 가정(자체 대화 UI, 과금, 온보딩) 배제
- 새 시스템(오케스트레이션 엔진, 에이전트 프레임워크) 선축조 금지 — 실험이 소유 경계를 정한다
- Ableton 조작은 기성 도구(AbletonMCP/AbletonOSC 등) 우선, 자체 구현은 결핍 확인 후
- 에이전트의 Ableton 조작 전 .als 자동 백업(타임스탬프 복사) 필수 — 실전 프로젝트에서 바로 운용
- 스파이크 기간 중 Tauri 앱 신규 기능 개발 동결 (버그 수정만)
- 프로젝트 메모리는 기존 songflow-data.json 구조 유지, 필요 시 필드 추가만
- 기존 확정 제약 승계: 완전 로컬, 오디오 분석 기능 안 만듦, Suno는 톱라인 추출용

## Non-Goals
- AI 모델 어댑터/멀티모델 추상화 레이어 (보류 — Suno 외 실수요 없음)
- 별도 대화형 UI (Claude Code가 창구)
- "모든 것을 기억"하는 신규 메모리 시스템 (대화 로그, 기각 아이디어 아카이브, 버전 비교 — 실결핍 미확인)
- 10개 전문 에이전트 프레임워크 (현 단계에선 마케팅 슬라이드)
- 일반 사용자용 제품화, 비용 최적화, 클라우드/동기화

## Acceptance Criteria
- [ ] 스파이크(1주 내): "Crave 트랙 작업 시작" 지시 → Ableton에 BPM/키/트랙 구성/코드 MIDI 배치까지 자동, 수작업 개입 0으로 작업 시작 가능
- [ ] 에이전트 조작 전 .als 백업이 자동 생성되고, 백업으로 복원이 실제 동작
- [ ] 스파이크 종료 시 "기성 조합으로 되는 것 / 안 되는 것(=SongFlow 소유 후보)" 목록 산출
- [ ] 6개월 판정 기준(자기 평가): ① 다음 곡도 자연스럽게 이 루프로 시작하는가(반복 사용) ② 곡 시작→데모 시간이 체감상 단축됐는가 ③ 비트 판매(수익화) 트랙이 이 환경에서 나오기 시작했는가

## Assumptions Exposed & Resolved
| Assumption | Challenge | Resolution |
|------------|-----------|------------|
| 불특정 "users"를 위한 제품 | R1: 기존 기록(오너 1인 파워유저)과의 충돌 제시 | 오너 1인용으로 확정 |
| 모델 비종속 어댑터 필요 | R3: 실수요 검증 (현재 Suno+ACE만 사용) | 보류 — 스킬 추가로 대응 |
| OS/시스템을 새로 지어야 함 | R4 컨트래리언: "안 만든다면?" + 사용자 자발적 의심("다 할 수 있나?") | 실험 우선 — 기성 조합 스파이크가 소유 경계를 정함 |
| AI가 모든 것을 기억해야 함 | R6 심플리파이어: 실결핍 순간 유무 질문 | 결핍 없음 — 현상 유지 |
| DAW 통합 = 무한 범위 | R2 전부 선택 → R5 단일 태스크 강제 | 1순위 = 프로젝트 셋업 자동화 |
| SongFlow = 앱 | R9 온톨로지스트: "SongFlow는 무엇인가?" | 환경 전체 = SongFlow, 앱은 표면 하나 |

## Technical Context
- 기존 자산: Tauri 2 + React 19 앱(데이터 뷰어), MCP 서버 22툴, 스킬 3종(reference-to-suno, refine-suno, lyrics-from-reference), 단일 JSON+CAS 저장, export_chord_midi
- 스파이크 활용 후보: AbletonMCP, AbletonOSC, Max for Live (설치+스킬 작성 영역, 발명 불필요)
- 확인된 난제(스파이크 검증 대상): ① Ableton 프로젝트 상태 읽기 신뢰도 ② 추상 지시의 음악적 품질(에이전트는 못 들음 — 귀는 오너 담당) ③ 1인 유지보수 표면적
- 실사용 파이프라인: 레퍼런스 → Suno(톱라인) → DAW 수작업 → 믹스. 스파이크는 "DAW 수작업" 구간의 앞단(셋업)을 공략

## Ontology (Key Entities)
| Entity | Type | Fields | Relationships |
|--------|------|--------|---------------|
| SongFlow(환경) | core domain | 스킬, MCP, 데이터, 앱, Ableton 연결 | 오너가 소유, Claude Code로 구동 |
| Claude Code | core domain | 대화 창구, 오케스트레이터 | SongFlow의 셸 |
| Ableton 프로젝트 | core domain | BPM, 키, 트랙, 섹션, 디바이스 | 스파이크의 조작 대상, 백업 규칙 적용 |
| 스파이크 | core domain | 태스크=셋업 자동화, 기한=1주, DoD | 소유 경계를 결정 |
| 프로젝트 메모리 | supporting | songflow-data.json 기존 구조 | 현상 유지 |
| Track/Album | supporting | 기존 데이터 모델 | 메모리에 저장 |
| Suno | external system | 톱라인 추출용 | 유일한 생성 AI (어댑터 보류) |
| AbletonMCP/OSC | external system | 기성 조작 도구 | 스파이크 1차 수단 |
| 백업 규칙 | supporting | .als 타임스탬프 복사 | 조작 전 필수 |
| 오너 | core domain | 1인 사용자·개발자·심판(귀) | 모든 판정의 주체 |
| 수익화 파이프라인 | supporting | 비트 판매 | 성공 기준 ③ |

## Ontology Convergence
| Round | Entity Count | New | Changed | Stable | Stability Ratio |
|-------|-------------|-----|---------|--------|----------------|
| 1 | 8 | 8 | - | - | N/A |
| 2 | 8 | 0 | 0 | 8 | 100% |
| 3 | 8 | 0 | 0 | 8 | 100% |
| 4-5 | 9 | 1(스파이크) | 0 | 8 | 89% |
| 7 | 10 | 1(수익화) | 0 | 9 | 90% |
| 8 | 11 | 1(백업 규칙) | 0 | 10 | 91% |
| 9-10 | 11 | 0 | 0 | 11 | 100% (수렴) |

## Interview Transcript
<details>
<summary>Full Q&A (10 rounds + R0)</summary>

### Round 0 — 토폴로지
**Q:** 5개 컴포넌트(코어/메모리/DAW/어댑터/대화UI) 맞나?
**A:** 4·5번 이해 안 됨 → 설명 후 "5번은 사실상 Claude Code" (대화UI를 코어에 병합, 4개 활성)

### Round 1 — 코어/Goal
**Q:** 누구를 위한 것인가? **A:** 나 자신 (오너 1인) | 모호도 68%

### Round 2 — DAW/Goal
**Q:** 가장 먼저 넘길 DAW 작업? **A:** 4개 카테고리 전부 (우선순위 없음) | 66%

### Round 3 — 어댑터/Goal
**Q:** Suno 외 실제 모델 수요? **A:** 당장은 Suno만 → 컴포넌트 보류 | 63%

### Round 4 — 컨트래리언 (+ 사용자: "근데 다 할 수 있나..?")
**Q:** SongFlow를 새로 안 만든다면 비전의 몇 %가 기성 조합으로 되나? **A:** 실험이 먼저 | 51%

### Round 5 — DAW/Criteria
**Q:** 스파이크 대표 태스크와 판정 기준? **A:** 프로젝트 셋업 자동화 | 47%

### Round 6 — 심플리파이어, 메모리/Goal
**Q:** "AI가 기억했다면" 하고 아쉬웠던 실제 순간? **A:** 딱히 없었다 → 현상 유지 | 44%

### Round 7 — 코어/Criteria
**Q:** 6개월 뒤 성공 판정 기준? **A:** 반복 사용 + 시간 절감 체감 + 수익화 연결 | 36%

### Round 8 — DAW/Constraints
**Q:** 안전 경계? **A:** 실전 + 자동 백업 | 31%

### Round 9 — 온톨로지스트
**Q:** SongFlow는 이제 무엇인가? **A:** 환경 전체 = SongFlow | 25%

### Round 10 — Constraints
**Q:** Tauri 앱 개발의 위치? **A:** 동결 — 루프에 집중 | **19% (통과)**

</details>
