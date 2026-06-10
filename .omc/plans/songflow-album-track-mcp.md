# SongFlow: Album/Track 구조 전환 + MCP 서버 구현 계획

**Status: PENDING APPROVAL**
**Spec**: `.omc/specs/deep-interview-songflow-album-track-mcp.md`
**Consensus**: Planner → Architect → Critic (APPROVED-WITH-CHANGES, improvements applied)
**Date**: 2026-06-07

---

## RALPLAN-DR Summary

### Principles (5)

1. **데이터의 단일 진실 공급원.** MCP 서버와 Tauri UI는 동일한 파일을 읽고 씀. 두 복사본의 상태 드리프트가 중심 실패 모드.
2. **UI는 뷰어, AI가 작업자.** React UI는 읽기 + 기본 CRUD만. 모든 생성 워크플로우(프롬프트 빌드, 응답 파싱, Suno 결과 저장)는 사용자의 외부 에이전트가 MCP 도구를 통해 처리. `ManualAgentPanel` 제거.
3. **마이그레이션, 절대 손실 없이.** 기존 `songflow_projects` localStorage 데이터는 컷오버 후에도 살아남아야 함. 마이그레이션은 단방향, 멱등, 쓰기 전 백업.
4. **단계별 최소 폭발 반경.** 데이터 모델과 스토리지가 MCP보다 먼저 적용; MCP가 UI 재배선보다 먼저. 각 단계는 독립적으로 검증 가능.
5. **표준 MCP, 표준 전송.** `@modelcontextprotocol/sdk` + stdio 전송 사용. 커스텀 프로토콜 발명 금지.

### Decision Drivers (Top 3)

1. **stdio 전송은 MCP 클라이언트가 프로세스를 소유해야 함.** Claude Code/Cursor가 stdout 파이프를 통해 직접 프로세스를 스폰. Tauri가 스폰하면 외부 에이전트가 stdio를 붙일 수 없음.
2. **공유 데이터 접근.** Tauri UI와 MCP 서버 모두 동일한 JSON 데이터 파일에 접근해야 함. → 브라우저 localStorage(샌드박스, 외부 프로세스에서 접근 불가)를 파일시스템 경로로 이동 필요.
3. **브라운필드 비용 / 생태계 적합성.** 프론트엔드가 TS/React; 에이전트 로직(`prompts.ts`, `parser.ts`)이 이미 TS. Rust MCP 도구는 TS SDK 대비 미성숙. 기존 TS 에이전트 코드 재사용이 주요 레버.

### Viable Options

#### Option A — Tauri Sidecar (Node MCP 프로세스를 Tauri가 번들 + 스폰)
- **기각 이유**: stdio MCP에 구조적으로 맞지 않음. MCP 클라이언트(Claude Code)가 stdio 파이프를 소유해야 하는데, Tauri가 스폰하면 파이프가 Tauri에 연결됨. 두 번째 전송(SSE/소켓)이 필요해지며 "표준 stdio"를 포기. Node를 Tauri에 번들링하면 패키징 복잡도 크게 증가.

#### Option B — Tauri Commands + 커스텀 MCP 브리지
- **기각 이유**: Tauri 커맨드는 앱 자체의 WebView IPC에서만 호출 가능 — 외부 stdio 프로세스에서 호출 불가. 실질적으로 Rust로 두 번째 MCP 서버를 작성해야 하며, 기존 TS `prompts.ts`/`parser.ts` 재사용 불가. 가장 높은 구현 비용.

#### Option C — 독립 Node.js MCP 서버 (선택) ✅
- `@modelcontextprotocol/sdk` + `StdioServerTransport` 사용하는 독립 TS/Node 패키지(`mcp-server/`)
- 사용자가 MCP 클라이언트 설정에 실행 커맨드 등록; 클라이언트가 프로세스 라이프사이클 소유
- Tauri UI와 동일한 공유 JSON 데이터 파일 읽기/쓰기
- **Pro**: stdio 모델과 정확히 일치; 기존 TS 에이전트 코드 재사용; MCP Inspector로 독립 테스트 가능; Tauri 빌드 없이 개발 가능
- **Con**: 두 프로세스가 파일 공유 → 동시성/잠금 처리 필요; 사용자가 일회성 MCP 클라이언트 설정 필요

> **In-Tauri-backend MCP vs. Standalone Node**: Tauri Rust 백엔드에 MCP를 내장하면 단일 쓰기자를 보장하여 동시성 문제를 제거할 수 있음. 그러나 Rust MCP 생태계가 미성숙하고, 기존 TS 에이전트 코드 재사용 불가, 사용자 spec 자체가 "Tauri 백엔드 또는 별도 Node 프로세스"를 허용함. 장기적으로 고려할 수 있는 대안. v1에서는 독립 Node 서버를 선택하되, 동시성을 CAS로 명시적 처리.

---

## 저장소 레이아웃

```
src/                         # 기존 React/Tauri 프론트엔드
  lib/
    core/                    # NEW: 공유 도메인 (타입 + 순수 데이터 ops)
      dataModel.ts           # Album/Track CRUD 순수 함수
      paths.ts               # OS 앱데이터 디렉토리 경로 확인 (공유)
    types/
      album.ts               # NEW: Album, Track 타입
      agent.ts               # (수정) AgentTask 조정
      ...                    # 기존 타입들 (Track으로 이동)
    storage/
      fileStore.ts           # NEW: Tauri fs plugin 기반 파일 I/O
      migrate.ts             # NEW: localStorage → 파일 마이그레이션
  store/
    useAlbumStore.ts         # (rename/rewrite) 파일 스토어 기반 Zustand
  components/
    album/                   # NEW
    track/                   # NEW
    agent/                   # ManualAgentPanel.tsx 제거
  pages/
    Dashboard.tsx            # Album 그리드로 변경
    AlbumDetail.tsx          # NEW (ProjectDetail.tsx 대체)
mcp-server/                  # NEW: 독립 Node.js MCP 서버 패키지
  src/
    server.ts
    store.ts                 # 공유 JSON 파일 I/O (Node fs)
    tools/
      album.ts
      track.ts
      workflow.ts
  package.json
  README.md                  # MCP 클라이언트 설정 스니펫
src-tauri/                   # Tauri Rust 백엔드
  Cargo.toml                 # tauri-plugin-fs 추가
  src/lib.rs                 # fs 플러그인 등록
  capabilities/default.json  # fs 권한 범위 추가
```

---

## 구현 단계

### Phase 0 — 공유 코어 & 데이터 모델

**목적**: 모든 다른 단계가 의존하는 순수 타입과 함수를 확립.

**생성할 파일:**

`src/lib/types/album.ts`
```ts
export type Album = {
  id: string;
  title: string;
  genre: string;
  concept: string;
  createdAt: string;
  updatedAt: string;
};

export type Track = {
  id: string;
  albumId: string;
  title: string;
  genre?: string;           // Album genre 오버라이드
  bpm?: number;
  key?: string;             // ex. "C major"
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

export type StorageData = {
  version: number;
  albums: Album[];
  tracks: Track[];
};

export type TrackNote = {
  id: string;
  content: string;
  createdAt: string;
  updatedAt: string;
};
```

`src/lib/core/dataModel.ts` — 순수 함수 (I/O 없음):
- `createAlbum(input)` → `Album`
- `createTrack(albumId, input)` → `Track`
- `getTrackEffectiveGenre(track, album)` → `string` (AC6)
- `updateAlbum(data, id, patch)` → `StorageData`
- `updateTrack(data, id, patch)` → `StorageData`
- `deleteAlbum(data, id)` → `StorageData` (cascade delete tracks)
- `deleteTrack(data, id)` → `StorageData`
- `getAlbumTracks(data, albumId)` → `Track[]`

`src/lib/core/paths.ts` — OS 앱데이터 경로 확인:
- 플랫폼별 앱데이터 디렉토리: macOS `~/Library/Application Support/SongFlow/`, Windows `%APPDATA%\SongFlow\`, Linux `~/.local/share/SongFlow/`
- `getStoreFilePath()` → `string` (절대 경로)
- **이 파일은 Tauri UI와 Node MCP 서버 모두에서 import. 경로 불일치를 방지하는 핵심 계약.**

**수정할 파일:**
- `src/lib/types/index.ts` — 새 타입 export 추가

**검증**: `tsc` 통과; `getTrackEffectiveGenre` 단위 테스트 (track.genre 있을 때/없을 때); `paths.ts` 두 환경에서 동일 경로 반환 확인.

---

### Phase 1 — 파일 기반 스토리지 + 마이그레이션

**목적**: localStorage를 공유 JSON 파일로 교체. MCP 서버가 쓸 데이터 파일 확립.

**필수 사전 작업 (이전에 누락됨):**
```bash
npm install @tauri-apps/plugin-fs
```
`src-tauri/Cargo.toml`:
```toml
tauri-plugin-fs = "2"
```
`src-tauri/src/lib.rs`:
```rust
tauri_plugin_fs::init()  // .plugin() 체인에 추가
```
`src-tauri/capabilities/default.json`:
```json
{
  "permissions": [
    "core:default",
    "opener:default",
    "fs:allow-read-text-file",
    "fs:allow-write-text-file",
    "fs:allow-mkdir",
    "fs:allow-exists"
  ]
}
```
> **fs 권한은 앱데이터 디렉토리로만 범위 제한** — 전체 파일시스템 접근 금지.

**생성할 파일:**

`src/lib/storage/fileStore.ts`:
- `loadData()` → `StorageData` — `@tauri-apps/plugin-fs`로 파일 읽기; 없으면 빈 초기 데이터 반환
- `saveData(data)` — **원자 쓰기**: 임시 파일 → rename (torn read 방지)
- `saveDataCAS(data, expectedVersion)` — Compare-and-Swap 버전 쓰기: 파일의 현재 version이 expectedVersion과 다르면 Error('VERSION_CONFLICT') throw → 호출자가 reload-merge-retry 처리

`src/lib/storage/migrate.ts`:
- `migrateLegacy()` — **WebView 내부에서만 실행 가능** (localStorage는 WebView 전용; Node 프로세스에서 접근 불가)
- 절차:
  1. `localStorage.getItem("songflow_projects")` 읽기
  2. 없으면 → 마이그레이션 불필요, 반환
  3. 기존 JSON을 `songflow-legacy-backup.json` 파일로 백업 (쓰기 실패시 abort)
  4. 각 `SongProject` → `Album` + 기본 `Track` 1개로 변환:
     - `album.title = project.title`
     - `album.genre = project.genre`
     - `album.concept = [project.description, project.targetVibe].filter(Boolean).join(' — ')`
     - `track.concept = project.description`
     - `track.title = "메인 트랙"` (기본값)
     - `track.moods → track.notes`로 보존 (메모 형식)
     - `track.references, track.chordProgressions, track.prompts, track.sunoResults, track.agentRequests, track.agentResponses` → Track으로 이동
     - **의도적 드롭**: `project.status`, `project.brief`, `project.samplePlatformGuides` (spec에서 제거됨)
  5. `saveData()` 로 새 형식 쓰기
  6. `data.version = 1` 설정 (멱등성 가드)
  7. 성공 후 `localStorage.removeItem("songflow_projects")` (Phase 5에서 확인 후 제거)
- 멱등성: `data.version >= 1`이면 skip

**검증**: 실제 레거시 픽스처로 `migrate.ts` 단위 테스트; 백업 파일 존재 확인; 두 번 실행 시 멱등성 확인 (AC8).

---

### Phase 2 — Zustand 스토어 파일 스토어 기반으로 재작성

**목적**: 모든 상태 변이가 공유 파일을 통해 흐르도록.

**파일 변경:**
- `src/store/useProjectStore.ts` → `src/store/useAlbumStore.ts`로 rename 및 전면 재작성

```ts
// 스토어 인터페이스
type AlbumStore = {
  albums: Album[];
  tracks: Track[];
  isLoaded: boolean;

  // 초기화 (앱 시작시)
  init: () => Promise<void>;  // loadData() + migrateLegacy() 호출

  // Album
  createAlbum: (input) => Promise<Album>;
  updateAlbum: (id, patch) => Promise<void>;
  deleteAlbum: (id) => Promise<void>;  // 연관 Track cascade 삭제
  getAlbumById: (id) => Album | undefined;

  // Track
  createTrack: (albumId, input) => Promise<Track>;
  updateTrack: (id, patch) => Promise<void>;  // lyrics 포함 (AC7)
  deleteTrack: (id) => Promise<void>;
  getTracksByAlbum: (albumId) => Track[];
  getTrackEffectiveGenre: (trackId) => string;  // AC6

  // Workflow (Track-scoped)
  addAgentRequest: (trackId, request) => Promise<void>;
  addAgentResponse: (trackId, response) => Promise<void>;
  addPrompt: (trackId, prompt) => Promise<void>;
  addSunoResult: (trackId, result) => Promise<void>;
  addNote: (trackId, note) => Promise<void>;
};
```

**모든 변이는 async** (파일 I/O); `saveDataCAS`로 버전 충돌 감지 → 충돌 시 reload-merge-retry (최대 3회).

**파일 감시**: `@tauri-apps/plugin-fs`의 `watch()` API로 파일 변경 감지 → 외부 MCP 쓰기 시 스토어 자동 리로드.

**검증**: 앱 부팅 → 마이그레이션 실행 → 파일 쓰기; 스토어 상태가 UI에 반영됨; 재시작 후 데이터 유지 (AC5).

---

### Phase 3 — 독립 MCP 서버

**목적**: 사용자의 AI 에이전트(Claude Code, Cursor 등)가 SongFlow 데이터를 도구로 사용하도록.

**새 패키지 `mcp-server/`:**

`mcp-server/package.json`:
```json
{
  "name": "songflow-mcp",
  "version": "0.1.0",
  "bin": { "songflow-mcp": "./dist/server.js" },
  "dependencies": {
    "@modelcontextprotocol/sdk": "^1.0.0",
    "zod": "^3.0.0"
  }
}
```

`mcp-server/src/store.ts`:
- `paths.ts`에서 경로 import (Tauri UI와 동일 절대경로)
- `loadData()` → Node `fs.readFileSync`
- `saveDataCAS(data, expectedVersion)` → 원자 쓰기 (temp + rename) + 버전 충돌 감지

`mcp-server/src/server.ts` — MCP 도구 등록:

**Album 도구**: `list_albums`, `get_album`, `create_album`, `update_album`, `delete_album`

**Track 도구**: `list_tracks`, `get_track`, `create_track`, `update_track`, `delete_track`
- `create_track`: albumId, title, genre?, bpm?, key?, concept?, lyrics? (AC7)
- `update_track`: id + patch (lyrics 포함)

**Workflow 도구**: 
- `save_agent_response(trackId, task, rawText)` — `parser.ts` 재사용하여 JSON 파싱
- `get_track_prompts(trackId)` — Track의 생성된 Suno 프롬프트 반환
- `save_suno_result(trackId, promptId, url, rating, memo, isBestVersion)`
- `get_agent_history(trackId)` — AgentRequest + AgentResponse 쌍 반환

**⚠️ 중요: 모든 로깅은 stderr에만.** stdout에 console.log 사용 시 JSON-RPC 프레임 깨짐.

`mcp-server/README.md` — Claude Code 설정 예시:
```json
// claude_desktop_config.json 또는 .mcp.json
{
  "mcpServers": {
    "songflow": {
      "command": "npx",
      "args": ["songflow-mcp"],
      "description": "SongFlow music production workspace"
    }
  }
}
```

**검증**:
- `npx @modelcontextprotocol/inspector npx songflow-mcp` → 도구 목록 확인 (AC1 smoke test)
- Inspector에서 create_album → list_albums → get_album → delete_album 라운드트립 (AC2)
- `save_agent_response` → `get_agent_history` 반환 확인 (AC3)
- MCP 쓰기 후 Tauri UI 파일 감시로 자동 업데이트 확인 (AC4)

---

### Phase 4 — UI 재배선 (뷰어 + 기본 CRUD)

**목적**: UI를 Album/Track 계층과 MCP 데이터의 뷰어로 전환.

**변경/생성할 파일:**
- `src/pages/Dashboard.tsx` — SongProject 그리드 → **Album 그리드** (Album 생성/삭제)
- `src/pages/ProjectDetail.tsx` → `src/pages/AlbumDetail.tsx` — Album 헤더 + **Track 탭/목록**
- `src/components/album/CreateAlbumDialog.tsx` — 제목 + 장르 + 컨셉
- `src/components/track/CreateTrackDialog.tsx` — 제목 + 장르? + BPM? + Key? + 컨셉? + 가사?
- `src/components/track/TrackView.tsx` — 가사, 프롬프트, Suno 결과, 에이전트 히스토리 (read-mostly)
- `src/components/mcp/McpInfoPanel.tsx` — 공유 데이터 파일 경로 표시 + MCP 클라이언트 설정 스니펫

**제거:**
- `src/components/agent/ManualAgentPanel.tsx` (사용자 명시 요청으로 제거)

**라우팅:**
- `/` → Dashboard (Album 그리드)
- `/albums/:id` → AlbumDetail (Track 탭)
- `/albums/:albumId/tracks/:trackId` → TrackDetail

**검증**: Tauri 앱 부팅 → Album 목록 표시; Track 탭 열기 → 가사/프롬프트/Suno 결과 표시 (AC4).

---

### Phase 5 — 정리 & 문서

- `src/lib/storage/localStorage.ts` 삭제 (마이그레이션 완료 확인 후)
- `src/lib/agent/prompts.ts` — `SongProject` → `Track`/`Album` 시그니처 업데이트
- `src-tauri/Cargo.toml` — 패키지명 `songflow-temp` → `songflow` 변경
- 루트 `README.md` 업데이트 — MCP 설정 가이드, 마이그레이션 노트
- `AppShell.tsx`, `Sidebar.tsx` — Album/Track 네비게이션으로 업데이트

---

## 동시성 전략 (상세)

**핵심 문제**: UI와 MCP 서버가 동시에 같은 파일을 쓸 때 마지막 쓰기가 이전 쓰기를 덮어씀 (silent lost update).

**해결책: Compare-and-Swap (CAS) + 원자 쓰기**

1. **모든 `StorageData`에 `version: number` 필드**
2. **모든 쓰기자는 read → check version → increment → atomic write** 수행
3. **버전 불일치 시**: 재로드 후 변경사항 병합 → 재시도 (최대 3회)
4. **저장소 구조**: 정규화된 단일 JSON 파일 (albums[] + tracks[] 분리)
   - 트랙별 파일 샤딩은 동시 쓰기 충돌 가능성을 낮추지만 구현 복잡도 증가 → v1에서는 단일 파일 + CAS로 충분

```json
// songflow-data.json
{
  "version": 42,
  "albums": [...],
  "tracks": [...]
}
```

**충돌 감지 테스트**: UI 편집 중 MCP 도구 호출 → 충돌 감지되면 재시도; 최종 데이터가 둘 다 보존됨 (new AC9).

---

## 수용 기준 (모두 테스트 가능)

| # | 기준 | 검증 방법 |
|---|------|----------|
| AC1 | Claude Code가 MCP에 stdio로 연결 | MCP Inspector에서 도구 목록 확인; Claude Code에서 `list_albums` 호출 성공 |
| AC2 | MCP로 Album + Track CRUD | Inspector: create→list→get→update→delete 라운드트립; 파일 반영 확인 |
| AC3 | MCP로 에이전트 응답을 Track에 저장 | `save_agent_response(trackId, ...)` → `get_agent_history(trackId)` 반환 확인 |
| AC4 | Tauri UI에서 Album 목록 + Track 내용 표시 | 앱 실행; 앨범 렌더링; MCP로 쓴 데이터가 UI에 반영 |
| AC5 | 재시작 후 데이터 유지 | UI + MCP로 변이 → 앱 종료 → 재실행 → 데이터 존재 확인 |
| AC6 | Track genre가 Album genre 오버라이드 | track.genre 설정 → `getTrackEffectiveGenre` 반환값 확인; UI 표시 확인 |
| AC7 | Track에 가사 저장 | `update_track(lyrics)` via MCP + UI; 저장 + 표시 확인 |
| AC8 | 레거시 SongProject 마이그레이션 | `songflow_projects` localStorage 시딩 → 첫 부팅 → Album 1개 + Track 1개/프로젝트; 백업 파일 생성; 두 번째 부팅 멱등 |
| AC9 | 동시 쓰기 충돌 감지 | UI 편집 + 동시 MCP 쓰기 → 충돌 감지 + 재시도; 양쪽 변경사항 보존 (silent 손실 없음) |

---

## 리스크 & 완화

| 리스크 | 심각도 | 완화 |
|--------|--------|------|
| **동시 쓰기 손실** (UI + MCP 동시 쓰기) | 높음 | CAS + 원자 쓰기 + reload-merge-retry; UI 파일 감시 |
| **경로 확인 불일치** (Node ↔ Tauri 앱데이터 디렉토리 다름) | 높음 | 공유 `paths.ts`; UI에 확인된 경로 표시; 통합 테스트로 두 환경에서 동일 경로 확인 |
| **마이그레이션 데이터 손실** | 높음 | 쓰기 전 백업; 멱등 `version` 가드; 레거시 픽스처 단위 테스트; Phase 5까지 localStorage 키 유지 |
| **스키마 드리프트** (UI ↔ MCP 서버) | 중간 | 공유 `src/lib/core/`; 타입 변경 시 mcp-server 동반 업데이트 |
| **stdout 오염** (JSON-RPC 프레임 깨짐) | 중간 | MCP 서버에서 stderr만 사용; console.log 금지 린트 규칙 |
| **Tauri fs 권한 과도함** | 중간 | 앱데이터 하위 디렉토리로만 범위 제한 |
| **MCP SDK API 변경** | 낮음 | `@modelcontextprotocol/sdk` 버전 고정 |

---

## ADR

- **결정**: SongFlow MCP 서버를 **독립 Node.js 패키지 (Option C)**로 구현, `@modelcontextprotocol/sdk` stdio 사용, 공유 파일 기반 JSON 스토어 사용. 평면 `SongProject` 모델을 정규화된 `Album → Track[]`으로 재편, Tauri fs 플러그인 + CAS 쓰기로 영속성.
- **드라이버**: (1) stdio 전송은 MCP 클라이언트가 프로세스 라이프사이클 소유 필요; (2) UI와 서버 모두 하나의 공유 데이터 파일 접근; (3) 기존 TS 에이전트 코드 재사용으로 브라운필드 비용 최소화.
- **고려한 대안**: A — Tauri 사이드카 (기각: Tauri가 stdio 캡처, 외부 에이전트 연결 불가). B — Tauri 커맨드 + Rust MCP 브리지 (기각: 외부 프로세스에서 Tauri 커맨드 호출 불가, TS 재사용 불가, 최고 구현 비용). C vs Rust 백엔드 내 MCP: Rust 백엔드가 단일 쓰기자 보장으로 CAS 불필요하지만, Rust MCP 생태계 미성숙 + TS 재사용 불가 + spec이 Node 옵션 명시적 허용 → v2 고려 대상.
- **선택 이유**: Option C만이 표준 stdio 모델을 지키면서 `prompts.ts`/`parser.ts`와 공유 타입을 재사용하고, Tauri 빌드 없이 독립 테스트 가능.
- **결과**: 두 프로세스 파일 공유 → 원자 쓰기 + CAS 필수; 사용자 일회성 MCP 클라이언트 설정; 공유 `core` 모듈 동기 유지 필요.
- **후속 조치**: 동시성 충돌이 실제로 발생하면 어드바이저리 파일 잠금 평가; 미래 소켓/SSE 전송 고려; Rust 백엔드 내장 MCP 재평가 (v2).

---

## 개선사항 변경로그 (Architect + Critic 피드백 반영)

- **추가**: CAS (Compare-and-Swap) 버전 기반 동시성 전략 (Architect/Critic Critical #1)
- **추가**: Phase 1에 plugin-fs 설치/Cargo.toml/capabilities 명시적 작업 항목 (Architect/Critic Major)
- **추가**: 마이그레이션이 WebView 내부에서만 실행됨을 명시 (Architect Finding #3, Critic Major #1)
- **추가**: `paths.ts` 공유 경로 계약 — Node와 WebView 동일 절대경로 보장 (Critic Major #2)
- **추가**: 필드 드롭 마이그레이션 결정 명시 (moods, status 등 → notes/concept 보존) (Critic Minor #3)
- **추가**: AC9 — 동시 쓰기 충돌 감지 수용 기준 (Critic)
- **추가**: AC1 검증 단계 구체화 — MCP Inspector 사용 (Critic)
- **추가**: 독립 Node vs. Rust 백엔드 MCP 비교 문서화 (Critic Skeptic)
- **유지**: Manual Agent Mode 제거 — 사용자가 명시적으로 선택한 변경사항; 새 스펙이 PROJECT_SPEC.md 보다 우선 (Architect Finding #5 기각)
- **유지**: Album/Track 데이터 모델과 스토리지 마이그레이션 결합 — 스토리지 재작성이 새 모델 필요; 분리 불가 (Architect Finding #4 기각)
