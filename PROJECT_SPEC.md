# SongFlow — Project Specification (v2)

> **v2 변경 사항**: 기획 피벗으로 인해 전면 재작성 (2026-06).
> SongProject 단위 → Album/Track 계층 구조, Manual Agent Mode → MCP 서버 + 인앱 Claude API.

---

## 1. Core Purpose

SongFlow는 AI 기반 음악 제작 워크플로우를 위한 Tauri 기반 로컬 데스크톱 앱이다.

**앱의 역할**: 데이터 뷰어 + 워크플로우 허브  
**AI의 역할**: 실제 작업 수행 (프롬프트 생성, 브리프 작성, 분석 등)

### AI 연결 방식 (2가지)

| 방식 | 대상 | API 키 |
|------|------|--------|
| **MCP 서버** | Claude Code, Cursor 등 AI 개발 도구 사용자 | 불필요 |
| **인앱 Claude API** | 일반 사용자 | Anthropic API 키 필요 |

---

## 2. 데이터 구조

### 계층 구조

```
Album (앨범)
  └── Track (수록곡) × N
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
  genre?: string;          // 없으면 Album.genre 상속
  bpm?: number;
  key?: string;
  concept?: string;
  lyrics?: string;
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

### 스토리지

- **파일**: `~/Library/Application Support/com.wjdxor133.songflow/songflow-data.json`
- **형식**: `{ version: number; albums: Album[]; tracks: Track[] }`
- **동시 쓰기 안전성**: CAS (Compare-and-Swap) — version 필드로 충돌 감지 및 재시도

---

## 3. 현재 구현 상태

### 완료

- [x] Tauri 2 + React 19 + TypeScript + Vite + Tailwind 셋업
- [x] Album/Track 핵심 타입 정의
- [x] 파일 기반 스토리지 (Tauri fs 플러그인, CAS)
- [x] Zustand 스토어 (`useAlbumStore`, `useConfigStore`)
- [x] Dashboard — Album 목록, 생성, 삭제
- [x] AlbumDetail — Track 목록, 생성, 삭제, 앨범 편집
- [x] TrackDetail — 인라인 편집 (제목, 장르, BPM, Key, 컨셉, 가사)
- [x] MCP 서버 (`mcp-server/`) — Album/Track CRUD + 워크플로우 툴 14개
- [x] Settings 페이지 — Anthropic API 키 저장
- [x] 인앱 AI 패널 — Claude API로 태스크 실행 (송 브리프, Suno 프롬프트, 사운드 키워드)
- [x] Agent History 표시 (TrackDetail)
- [x] Suno Results 표시 (TrackDetail)

### 미구현 (이슈 참고)

- [ ] #8 Reference Song Analyzer UI (레퍼런스 곡 입력 + 분석)
- [ ] #9 Song Brief Generator 결과 전용 뷰
- [ ] #10 Chord & Groove Preview (Tone.js)
- [ ] #11 Prompt Lab — 생성된 프롬프트 관리 UI
- [ ] #12 Suno Result 인앱 입력 폼
- [ ] #13 Notes UI

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

### 제공 툴 (14개)

**Album**: `list_albums`, `get_album`, `create_album`, `update_album`, `delete_album`

**Track**: `list_tracks`, `get_track`, `create_track`, `update_track`, `delete_track`

**Workflow**: `save_agent_response`, `get_track_prompts`, `save_suno_result`, `get_agent_history`

---

## 5. 워크플로우

### MCP 방식 (Claude Code 사용자)
```
Claude Code에서:
1. list_albums → 앨범 확인
2. create_track(albumId, title, concept, bpm, key) → 트랙 생성
3. "이 트랙의 Suno 프롬프트 만들어줘" → Claude가 분석 후 save_agent_response
4. SongFlow 앱에서 결과 확인
```

### 인앱 API 방식 (일반 사용자)
```
SongFlow 앱에서:
1. Settings → Anthropic API 키 입력
2. TrackDetail → AI 패널 → 태스크 선택 → Generate
3. 결과 확인 및 저장
```

---

## 6. 기술 스택

| 영역 | 기술 |
|------|------|
| 데스크톱 런타임 | Tauri 2 (Rust) |
| 프론트엔드 | React 19, TypeScript, Vite |
| 스타일링 | Tailwind CSS 4, shadcn/ui |
| 상태 관리 | Zustand 5 |
| 파일 I/O | @tauri-apps/plugin-fs |
| MCP 서버 | @modelcontextprotocol/sdk, Node.js |
| AI | Anthropic Claude API (fetch) |
| 음악 미리듣기 | Tone.js (미구현) |

---

## 7. Product Principles

- 로컬 전용 — 서버, 로그인, 클라우드 동기화 없음
- 앱은 데이터를 저장하고 보여주는 역할, AI가 실제 작업 수행
- API 키는 로컬 파일에만 저장 (서버 전송 없음)
- MCP와 인앱 API는 공존 — 사용자가 선택
- Suno, Spotify, Ableton 등 외부 서비스 API 통합 없음 (MVP)
