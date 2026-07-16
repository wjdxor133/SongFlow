# SongFlow — Project Specification (v4)

> **v4 변경 사항** (2026-07): Track Plan 완전 제거, "앱=뷰어" 철학 명문화, Suno Settings 필드 분리(트랙당 프롬프트 1개), 코드 진행 MIDI 내보내기, 스킬 3종(reference-to-suno · refine-suno · lyrics-from-reference) 반영. MCP 툴 22개(+레거시 2개).
> v3 대비 변경: `TrackPlan` 타입 삭제 / `SunoSettings` 추가 / MCP 툴 21→22 및 네이밍 개편(`add_`/`delete_` → `save_`/`get_`).

---

## 1. Core Purpose

SongFlow는 AI 기반 음악 제작 워크플로우를 위한 Tauri 기반 로컬 데스크톱 앱이다.

**앱의 역할**: 데이터 뷰어 + 워크플로우 허브 (앱은 데이터를 저장·표시만 한다)
**AI의 역할**: 실제 작업 수행 (레퍼런스 분석, 가사·코드 진행·Suno 프롬프트 생성 등)

핵심 흐름은 **레퍼런스 곡 하나 → 가사·코드·Suno 프롬프트·설정 생성 → MCP로 SongFlow에 기록 → Suno에서 생성 → DAW**이며, 앱은 이 산출물을 확인하는 뷰어다.

### AI 연결 방식 (2가지)

| 방식 | 대상 | API 키 |
|------|------|--------|
| **MCP 서버** | Claude Code, Cursor 등 AI 개발 도구 사용자 | 불필요 |
| **인앱 Claude API** | 일반 사용자 | Anthropic API 키 필요 |

MCP와 인앱 API는 공존한다 — 사용자가 선택한다. 주 워크플로우(스킬 기반)는 MCP 방식이다.

---

## 2. 데이터 구조

### 계층 구조

```
Album (앨범)
  └── Track (수록곡) × N
        ├── ReferenceSong[] — 레퍼런스 곡 목록
        ├── ReferenceAnalysis[] — 레퍼런스 분석
        ├── ReferenceBrief[] — Reference Coach AI 분석 브리프
        ├── LearningMission[] — Reference Coach 학습 미션
        ├── ChordProgression[] — 코드 진행
        ├── GroovePattern[] — 그루브 패턴
        ├── SoundKeywordGroup — 파트별 사운드 키워드
        ├── SunoSettings — Suno 설정(weirdness/style/audio influence)
        ├── GeneratedPrompt[] — Suno 프롬프트 (트랙당 1개 원칙)
        ├── SunoResult[] — Suno 생성 결과
        ├── ResultFeedback[] / PromptRefinement[] — refine 피드백/개선
        └── TrackNote[] — 메모
```

### Album

```ts
type Album = {
  id: string;
  title: string;
  genre: string;
  concept: string;
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
  genre?: string;           // 없으면 Album.genre 상속
  bpm?: number;
  key?: string;
  concept?: string;
  lyrics?: string;
  sourceTrack?: SourceTrack;      // Spotify에서 불러온 원곡 정보
  sunoSettings?: SunoSettings;    // Suno 설정
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
  referenceBriefs?: ReferenceBrief[];
  learningMissions?: LearningMission[];
  createdAt: string;
  updatedAt: string;
};
```

### SunoSettings (Suno 설정)

```ts
type SunoSettings = {
  weirdness: number;            // 0-100 (%)
  styleInfluence: number;       // 0-100 (%)
  audioInfluence: number | null;// 0-100 (%), null = off (오디오 레퍼런스 없음)
  excludeStyles?: string;       // Suno "Exclude Styles" — 쉼표구분 회피 목록 (예: "ad-libs, male vocals")
};
```

### SourceTrack (Spotify 원곡 정보)

```ts
type SourceTrack = {
  spotifyId: string;
  artist: string;
  album: string;
  title: string;
  year?: number;
};
```

### GeneratedPrompt / SunoResult (요약)

- `GeneratedPrompt` — `style`, `lyrics` 및 방향별 변형(`moreRefreshing`/`moreEmotional`/`vocalFocused`/`grooveFocused`), `type`, `versionLabel`. **트랙당 프롬프트 1개** 원칙.
- `SunoResult` — `url`, `promptId`, `versionLabel`, `rating(1-5)`, `memo`, `isBestVersion`.

### 스토리지

- **파일**: `~/Library/Application Support/com.wjdxor133.songflow/songflow-data.json`
- **형식**: `{ version: number; schemaVersion: number; albums: Album[]; tracks: Track[] }`
- **schemaVersion**: 스키마 마이그레이션용 (fileStore가 로드 시 최신 스키마로 승격)
- **동시 쓰기 안전성**: CAS (Compare-and-Swap) — `version` 필드로 충돌 감지 및 재시도

---

## 3. 현재 구현 상태

### 완료

#### 인프라 & 기반
- [x] Tauri 2 + React 19 + TypeScript + Vite + Tailwind 셋업
- [x] Album/Track 핵심 타입 정의
- [x] 파일 기반 스토리지 (Tauri fs 플러그인, CAS + schemaVersion 마이그레이션)
- [x] Zustand 스토어 (`useAlbumStore`, `useConfigStore`)

#### 페이지 & UI
- [x] Dashboard — 앨범 목록, 앨범 불러오기(Spotify), 삭제 (인라인 확인 패턴)
- [x] AlbumDetail — 트랙 목록, 생성, 삭제, 앨범 편집
- [x] TrackDetail — 자동 저장 (blur), 원곡 배지(sourceTrack), 섹션별 Dialog 패턴
- [x] Settings — Anthropic API 키, Spotify Client ID/Secret 관리

#### TrackDetail 섹션
- [x] **ReferenceCoachSection** — AI 분석 (Reference Brief → Learning Missions), Dialog 입력 *(Track Plan 탭 제거됨)*
- [x] **SongBriefSection** — 송 브리프 생성
- [x] **PromptLabSection** — Suno 프롬프트 관리 + `SunoInputForm`(Suno Settings 필드 분리) — 프롬프트 아래에 Suno Settings 카드 배치(Suno UI 순서와 동일)
- [x] **ChordGrooveSection** — 코드 진행 추가 (Dialog), Tone.js 미리듣기(`ChordPlayback`), AI 자동 생성, **MIDI 내보내기**
- [x] **NotesSection** — 메모 추가 (Dialog)

#### Spotify 통합
- [x] Client Credentials 토큰 캐싱
- [x] 앨범 검색 → 수록곡 목록 → 트랙 선택 → SongFlow 앨범 자동 생성
- [x] audio-features 배치 API → BPM, Key 자동 입력
- [x] 아티스트 API → Genre 자동 입력

#### MCP 서버
- [x] Album CRUD 5개 툴
- [x] Track CRUD 5개 툴
- [x] Workflow 툴 4개
- [x] Reference Coach 데이터 툴 5개 (briefs / learning missions)
- [x] 코드/Suno 툴 3개 (`save_chord_progressions`, `save_suno_settings`, `export_chord_midi`)
- [x] 총 **22개 활성 MCP 툴** (+ 레거시 2개)

#### 스킬 (Claude Code)
- [x] **reference-to-suno** — 레퍼런스 1곡 → 컨셉·언어 질의 → C키 변환·Suno 프롬프트·송폼별 음절 일치 가사·코드 진행·Suno 설정 → MCP로 기록
- [x] **refine-suno** — Suno 결과 피드백 → 증상을 레버(style/설정/가사/코드)에 매핑해 프롬프트·설정 갱신 (이터레이션 루프)
- [x] **lyrics-from-reference** — 레퍼런스 구조 분석 → 동일 섹션/줄 수/음절 밀도 가사 + Suno 프롬프트

### 미구현 / 향후 과제

- [ ] 트랙 삭제 (TrackDetail 페이지 내에서)
- [ ] Spotify Redirect URI 없이 앱 내 OAuth 연동 (현재 Client Credentials만)
- [ ] Suno 직접 API 연동
- [ ] 오프라인 모드 / 데이터 백업·복원 UI
- [ ] 레거시 `TrackPlan` 코드 정리 (아래 참고)

---

## 4. MCP 서버

### 위치
`mcp-server/` (독립 Node.js 패키지)

### 빌드
```bash
cd mcp-server
npm install && npm run build
```

### Claude Code 연결
```bash
claude mcp add songflow node /path/to/SongFlow/mcp-server/dist/server.js
```

### 제공 툴 (22개 활성)

**Album (5개)**: `list_albums`, `get_album`, `create_album`, `update_album`, `delete_album`

**Track (5개)**: `list_tracks`, `get_track`, `create_track`, `update_track`, `delete_track`

**Workflow (4개)**: `save_agent_response`, `get_track_prompts`, `save_suno_result`, `get_agent_history`

**Reference Coach (5개)**: `save_reference_brief`, `get_reference_briefs`, `save_learning_missions`, `get_learning_missions`, `update_learning_mission`

**코드 / Suno (3개)**: `save_chord_progressions`, `save_suno_settings`, `export_chord_midi`

> **레거시 (2개, 미사용)**: `save_track_plan`, `get_track_plans` — Track Plan은 UI·스킬에서 제거됐으나 데이터 호환을 위해 MCP 툴만 남아있다. 별도 정리 예정.

---

## 5. 워크플로우

### A. MCP + 스킬 방식 (주 워크플로우, Claude Code 사용자)
```
Claude Code에서:
1. "이 곡으로 Suno 준비" → reference-to-suno 스킬 실행
   → (1) 어떤 곡 (2) 원곡 가사 (3) 컨셉·언어 질의
   → C키 변환 · Suno 프롬프트 · 음절 일치 가사 · 코드 진행 · Suno 설정 생성
   → MCP(save_*)로 SongFlow에 기록
2. SongFlow 앱에서 결과 확인 (뷰어)
3. Suno에서 생성 → 들어보고 "후렴이 약해" 등 피드백
   → refine-suno 스킬이 프롬프트·설정 그 자리에서 갱신
4. 코드 진행 MIDI 내보내기(export_chord_midi) → DAW
```

### B. Spotify 앨범 불러오기 (시작점)
```
1. Settings → Spotify Client ID/Secret 입력
2. Dashboard → 앨범 불러오기 → 아티스트명 + 앨범명 검색
3. 수록곡 선택 → 가져오기 → SongFlow 앨범 자동 생성 (BPM, Key, Genre 자동 입력)
4. 각 TrackDetail에서 원곡 정보 확인 후 작업 시작
```

### C. 인앱 AI 방식 (일반 사용자)
```
SongFlow 앱에서:
1. Settings → Anthropic API 키 입력
2. TrackDetail → ReferenceCoachSection → 분석 시작 → Brief / Missions 자동 생성
3. ChordGrooveSection → AI 코드 진행 생성 → MIDI 내보내기
4. PromptLabSection → Suno 프롬프트 + Suno Settings 생성
```

---

## 6. 기술 스택

| 영역 | 기술 |
|------|------|
| 데스크톱 런타임 | Tauri 2 (Rust) |
| 프론트엔드 | React 19, TypeScript, Vite |
| 스타일링 | Tailwind CSS 4, shadcn/ui, @base-ui/react |
| 상태 관리 | Zustand 5 |
| 파일 I/O | @tauri-apps/plugin-fs |
| MCP 서버 | @modelcontextprotocol/sdk, Node.js |
| AI | Anthropic Claude API (fetch) |
| 음악 미리듣기 | Tone.js |
| MIDI | 코드 진행 → MIDI 파일 내보내기 (`mcp-server/src/midi.ts`) |
| 외부 API | Spotify Web API (Client Credentials) |

---

## 7. Product Principles

- 로컬 전용 — 서버, 로그인, 클라우드 동기화 없음
- **앱은 데이터를 저장·표시하는 뷰어, AI가 실제 작업 수행**
- API 키는 로컬 파일에만 저장 (서버 전송 없음)
- MCP와 인앱 API는 공존 — 사용자가 선택 (주 워크플로우는 MCP + 스킬)
- Spotify는 공개 데이터 조회 전용 (Client Credentials, 사용자 인증 불필요)
- 프롬프트는 트랙당 1개 원칙 — 여러 변형 대신 하나를 refine 루프로 개선
