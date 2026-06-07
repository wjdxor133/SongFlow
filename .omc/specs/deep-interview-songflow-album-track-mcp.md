# Deep Interview Spec: SongFlow Album/Track 구조 전환 + MCP 서버

## Metadata
- Interview ID: songflow-album-track-mcp-2026-06-07
- Rounds: 11
- Final Ambiguity Score: 16.5%
- Type: brownfield
- Generated: 2026-06-07
- Threshold: 0.2 (20%)
- Threshold Source: default
- Initial Context Summarized: no
- Status: PASSED

---

## Clarity Breakdown

| Dimension | Score | Weight | Weighted |
|-----------|-------|--------|----------|
| Goal Clarity | 0.85 | 35% | 0.298 |
| Constraint Clarity | 0.80 | 25% | 0.200 |
| Success Criteria | 0.90 | 25% | 0.225 |
| Context Clarity (brownfield) | 0.75 | 15% | 0.113 |
| **Total Clarity** | | | **0.835** |
| **Ambiguity** | | | **16.5%** |

---

## Topology

| Component | Status | Description | Coverage Note |
|-----------|--------|-------------|---------------|
| Album/Track 구조 전환 | active | SongProject → Album + Track 계층 구조로 재편 | 필드 정의, 데이터 이동 방향 확정 |
| SongFlow MCP 서버 | active | SongFlow를 로컬 MCP 서버로 노출, 사용자의 AI 에이전트가 도구로 연결 | MCP 도구 범위, UI 역할 확정 |

---

## Goal

**Album/Track 구조 전환:**
기존 SongProject 하나의 평면 구조를 Album(앨범) → Track(수록곡) 계층으로 전환한다. Album은 앨범 전체 컨셉을 담고, Track은 개별 수록곡의 작업 데이터 전체를 소유한다.

**SongFlow MCP 서버:**
SongFlow를 로컬 MCP(Model Context Protocol) 서버로 동작시켜, 사용자가 이미 사용 중인 AI 에이전트(Claude Code, Cursor, Gemini CLI 등)에서 SongFlow 데이터를 도구(Tool)로 접근할 수 있게 한다. API 키 관리 불필요 — 사용자 본인의 AI 구독/계정을 그대로 사용. SongFlow UI(Tauri 앱)는 데이터 뷰어 역할을 한다.

---

## Data Model

### Album
```ts
type Album = {
  id: string;
  title: string;
  genre: string;
  concept: string;          // 전체 앨범 컨셉 설명
  tracks: Track[];
  createdAt: string;
  updatedAt: string;
};
```

### Track
```ts
type Track = {
  id: string;
  albumId: string;
  title: string;
  genre?: string;           // Album genre를 개별 오버라이드 가능
  bpm?: number;
  key?: string;             // ex. "C major", "A minor"
  concept?: string;         // 수록곡별 컨셉/메모
  lyrics?: string;          // 가사

  // 워크플로우 데이터 (기존 SongProject에 있던 것들)
  references: ReferenceSong[];
  referenceAnalyses: ReferenceAnalysis[];
  chordProgressions: ChordProgression[];
  selectedChordProgressionId?: string;
  groovePatterns: GroovePattern[];
  selectedGroovePatternId?: string;
  soundKeywords?: SoundKeywordGroup;
  prompts: GeneratedPrompt[];
  sunoResults: SunoResult[];
  feedbacks: ResultFeedback[];
  refinements: PromptRefinement[];
  agentRequests: AgentRequest[];
  agentResponses: AgentResponse[];
  notes: TrackNote[];

  createdAt: string;
  updatedAt: string;
};
```

---

## MCP 서버 도구 (Tools)

SongFlow MCP 서버가 노출할 도구 목록:

### Album 도구
- `list_albums` — 전체 앨범 목록 조회
- `get_album(id)` — 앨범 상세 + 트랙 목록
- `create_album(title, genre, concept)` — 앨범 생성
- `update_album(id, patch)` — 앨범 수정
- `delete_album(id)` — 앨범 삭제

### Track 도구
- `list_tracks(albumId)` — 앨범의 수록곡 목록
- `get_track(id)` — 트랙 상세
- `create_track(albumId, title, genre?, bpm?, key?, concept?, lyrics?)` — 수록곡 생성
- `update_track(id, patch)` — 수록곡 수정 (BPM, Key, 가사 등)
- `delete_track(id)` — 수록곡 삭제

### 워크플로우 도구
- `save_agent_response(trackId, task, rawText)` — AI 생성 결과 저장 (레퍼런스 분석, Suno 프롬프트 등)
- `get_track_prompts(trackId)` — 트랙의 생성된 Suno 프롬프트 조회
- `save_suno_result(trackId, promptId, url, rating, memo)` — Suno 결과 저장
- `get_agent_history(trackId)` — 트랙의 에이전트 요청/응답 기록

---

## Constraints

- SongFlow MCP 서버는 **로컬**에서 실행 (Tauri 백엔드 또는 별도 Node 프로세스)
- API 키 관리 없음 — 사용자 본인의 AI 도구가 MCP 클라이언트
- SongFlow UI는 **데이터 뷰어**: AI가 MCP로 데이터 씀, UI에서 조회
- UI에서도 독립적으로 Album/Track 생성·수정 가능 (AI 없이도 사용 가능)
- 데이터 영속성: localStorage → Tauri Store(SQLite) 마이그레이션 고려 필요 (MCP 서버가 직접 파일 접근해야 하므로)
- 기존 SongProject 데이터 마이그레이션 경로 필요

---

## Non-Goals (MVP에서 제외)

- SaaS 백엔드, 클라우드 동기화
- 다른 사용자와 공유/협업
- SongFlow 자체 AI 모델 내장
- Suno, Spotify, Ableton API 직접 연동
- 자동 CLI 실행 (subprocess 방식) — MCP 방식으로 대체
- Copy/Paste Manual Agent Mode (제거)

---

## Acceptance Criteria

- [ ] Claude Code에서 SongFlow MCP 서버에 연결할 수 있다
- [ ] MCP를 통해 Album을 생성/조회/수정/삭제할 수 있다
- [ ] MCP를 통해 Track을 생성할 수 있다 (BPM, Key, 장르, 컨셉, 가사 포함)
- [ ] MCP를 통해 Suno 프롬프트를 Track에 저장할 수 있다
- [ ] SongFlow Tauri UI에서 Album 목록과 Track 내용을 조회할 수 있다
- [ ] MCP로 저장한 데이터가 앱 재시작 후에도 유지된다
- [ ] Track은 Album의 장르를 개별 오버라이드할 수 있다
- [ ] Track에 가사를 저장하고 조회할 수 있다

---

## Assumptions Exposed & Resolved

| Assumption | Challenge | Resolution |
|------------|-----------|------------|
| 에이전트 연결 = CLI 자동 실행 | "Cursor처럼" 어떤 의미인지 확인 | MCP 서버 방식으로 — 사용자 AI가 클라이언트 |
| 모든 데이터가 Album 레벨 | Album vs Track 소유권 분리 | Track이 모든 작업 데이터 소유 |
| Copy/Paste 개선 | 불편함의 근본 원인 확인 | 앱 전환 자체가 문제 → MCP로 해결 |
| API 키 필요 | 어떤 AI를 쓸지 질문 | 불필요 — 사용자 본인 AI 계정 활용 |
| SongProject = 수록곡 | Album/Track 개념 도입 | Project → Album, 수록곡 → Track |

---

## Technical Context (Brownfield)

**기존 코드 자산 (재활용 가능):**
- `src/lib/types/` — 기존 타입들 Track으로 이동 (ReferenceSong, ChordProgression 등)
- `src/lib/agent/prompts.ts` — buildPrompt() Track 컨텍스트로 전환
- `src/lib/agent/parser.ts` — 그대로 재활용
- `src/lib/storage/localStorage.ts` — MCP 서버 접근을 위해 파일 기반 스토리지로 전환 고려
- `src/store/useProjectStore.ts` → `useAlbumStore.ts`로 전환

**신규 구현 필요:**
- MCP 서버 (Tauri 백엔드 또는 별도 stdio MCP 서버)
- Album/Track 계층 타입 및 스토어
- MCP 도구 핸들러
- Tauri UI 개편 (Dashboard → Album 그리드, ProjectDetail → Album+Track 탭)

**데이터 마이그레이션:**
- 기존 `songflow_projects` localStorage 키 → 새 구조로 마이그레이션
- 기존 SongProject → Album 변환 (track 배열에 기본 track 1개 생성)

---

## Ontology (Key Entities)

| Entity | Type | Fields | Relationships |
|--------|------|--------|---------------|
| Album | core domain | id, title, genre, concept, createdAt, updatedAt | Album has many Tracks |
| Track | core domain | id, albumId, title, genre, bpm, key, concept, lyrics, createdAt | Track belongs to Album; Track has many AgentRequests, Prompts, SunoResults |
| AgentRequest | supporting | id, task, instruction, outputSchema, createdAt | AgentRequest belongs to Track |
| AgentResponse | supporting | id, requestId, rawText, parsedJson, parseStatus | AgentResponse belongs to AgentRequest |
| GeneratedPrompt | supporting | id, requestId, basic, moreRefreshing, moreEmotional, vocalFocused, grooveFocused | GeneratedPrompt belongs to Track |
| SunoResult | supporting | id, url, promptId, rating, memo, isBestVersion | SunoResult belongs to Track via GeneratedPrompt |
| ReferenceSong | supporting | id, title, artist, notes | ReferenceSong belongs to Track |
| MCP Server | external system | tools[], stdio transport | MCP Server exposes Album/Track tools to AI clients |
| AI Agent | external system | (Claude Code, Cursor, etc.) | AI Agent connects to MCP Server as client |

---

## Interview Transcript

<details>
<summary>전체 Q&A (11 라운드)</summary>

### Round 0
**Q:** 2개 컴포넌트 (Album/Track 구조, MCP 연결) 확인
**A:** 맞아요

### Round 1
**Q:** 기존 SongProject의 데이터들이 Album/Track 어디로?
**A:** Track 레벨로 이동

### Round 2
**Q:** Album에는 무엇이 남는가?
**A:** 제목 + 장르 + 컨셉

### Round 3
**Q:** CLI 연결이 구체적으로 어떻게 동작해야 하는가?
**A:** 어떤 방식이 좋을지 모르겠어요 (방향 미정)

### Round 4
**Q:** Copy/Paste가 불편한 근본 이유는?
**A:** 앞뒤로 앱 전환이 번거로운 게

### Round 5
**Q:** 어떤 AI를 사용할 건가요?
**A:** Cursor Extension처럼 사용할 수 없어?

### Round 6
**Q:** Cursor의 어떤 면을 원하는가?
**A:** MCP 서버 링크

### Round 7
**Q:** MCP 시나리오 A(AI가 SongFlow 도구 사용) vs B(SongFlow가 AI 호출)?
**A:** 사용자가 로컬에서 본인 AI 에이전트 사용, API 연결 불필요

### Round 8
**Q:** SongFlow UI의 역할은?
**A:** UI는 데이터 뷰어, AI가 작업함

### Round 9
**Q:** Track 필드는?
**A:** 개별 제목, 장르(앨범 개별 가능), BPM + Key, 컨셉/메모

### Round 10
**Q:** MCP 도구 범위는?
**A:** 상태 업데이트, Album/Track CRUD
*(이 시점에 "가사도 넣을 수 있어야해" 추가)*

### Round 11
**Q:** MVP 완성 기준은?
**A:** Claude Code에서 Track 만들 수 있음, UI에서 Album/Track 조회, Track 데이터 영속성, Suno 프롬프트 AI 생성

</details>
