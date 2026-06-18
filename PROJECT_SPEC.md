# SongFlow — Project Specification (v3)

> **v3 변경 사항** (2026-06): Reference Coach, Spotify 앨범 불러오기, Dialog UX 전환 반영.
> v2 대비 추가: `SourceTrack`, `ReferenceBrief`, `TrackPlan`, `LearningMission` 타입 / Spotify API 통합 / MCP 툴 21개.

---

## 1. Core Purpose

SongFlow는 AI 기반 음악 제작 워크플로우를 위한 Tauri 기반 로컬 데스크톱 앱이다.

**앱의 역할**: 데이터 뷰어 + 워크플로우 허브  
**AI의 역할**: 실제 작업 수행 (프롬프트 생성, 레퍼런스 분석, 코드 생성 등)

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
        ├── ReferenceSong[] — 레퍼런스 곡 목록
        ├── ChordProgression[] — 코드 진행
        ├── GroovePattern[] — 그루브 패턴
        ├── ReferenceBrief[] — Reference Coach AI 분석 브리프
        ├── TrackPlan[] — Reference Coach 제작 플랜
        ├── LearningMission[] — Reference Coach 학습 미션
        ├── GeneratedPrompt[] — Suno 프롬프트
        ├── SunoResult[] — Suno 생성 결과
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
  sourceTrack?: SourceTrack; // Spotify에서 불러온 원곡 정보
  references: ReferenceSong[];
  referenceBriefs: ReferenceBrief[];
  trackPlans: TrackPlan[];
  learningMissions: LearningMission[];
  chordProgressions: ChordProgression[];
  selectedChordProgressionId?: string;
  groovePatterns: GroovePattern[];
  selectedGroovePatternId?: string;
  soundKeywords?: SoundKeywordGroup;
  prompts: GeneratedPrompt[];
  sunoResults: SunoResult[];
  notes: TrackNote[];
  createdAt: string;
  updatedAt: string;
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

### 스토리지

- **파일**: `~/Library/Application Support/com.wjdxor133.songflow/songflow-data.json`
- **형식**: `{ version: number; albums: Album[]; tracks: Track[] }`
- **동시 쓰기 안전성**: CAS (Compare-and-Swap) — version 필드로 충돌 감지 및 재시도

---

## 3. 현재 구현 상태

### 완료

#### 인프라 & 기반
- [x] Tauri 2 + React 19 + TypeScript + Vite + Tailwind 셋업
- [x] Album/Track 핵심 타입 정의
- [x] 파일 기반 스토리지 (Tauri fs 플러그인, CAS)
- [x] Zustand 스토어 (`useAlbumStore`, `useConfigStore`)

#### 페이지 & UI
- [x] Dashboard — 앨범 목록, 앨범 불러오기(Spotify), 삭제 (인라인 확인 패턴)
- [x] AlbumDetail — 트랙 목록, 생성, 삭제, 앨범 편집
- [x] TrackDetail — 자동 저장 (blur), 원곡 배지(sourceTrack), 섹션별 Dialog 패턴
- [x] Settings — Anthropic API 키, Spotify Client ID/Secret 관리

#### TrackDetail 섹션
- [x] **ReferenceSongSection** — 레퍼런스 곡 추가 (Dialog) + AI 제안 (Claude)
- [x] **ReferenceCoachSection** — AI 분석 체인 (Brief → Plan → Missions), Dialog 입력
- [x] **ChordGrooveSection** — 코드 진행 추가 (Dialog), Tone.js 미리듣기, AI 자동 생성
- [x] **PromptLabSection** — Suno 프롬프트 생성 및 관리
- [x] **SongBriefSection** — 송 브리프 생성
- [x] **NotesSection** — 메모 추가 (Dialog)

#### Spotify 통합
- [x] Client Credentials 토큰 캐싱
- [x] 앨범 검색 → 수록곡 목록 → 트랙 선택 → SongFlow 앨범 자동 생성
- [x] audio-features 배치 API → BPM, Key 자동 입력
- [x] 아티스트 API → Genre 자동 입력

#### MCP 서버
- [x] Album CRUD 5개 툴
- [x] Track CRUD 5개 툴
- [x] Workflow 툴 4개 (save_agent_response, get_track_prompts, save_suno_result, get_agent_history)
- [x] Reference Coach 데이터 관리 툴 7개 (referenceBriefs, trackPlans, learningMissions)
- [x] 총 **21개 MCP 툴**

### 미구현 / 향후 과제

- [ ] 트랙 삭제 (TrackDetail 페이지 내에서)
- [ ] Spotify Redirect URI 없이 앱 내 OAuth 연동 (현재 Client Credentials만)
- [ ] Suno 직접 API 연동
- [ ] 오프라인 모드 / 데이터 백업·복원 UI

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

### 제공 툴 (21개)

**Album (5개)**: `list_albums`, `get_album`, `create_album`, `update_album`, `delete_album`

**Track (5개)**: `list_tracks`, `get_track`, `create_track`, `update_track`, `delete_track`

**Workflow (4개)**: `save_agent_response`, `get_track_prompts`, `save_suno_result`, `get_agent_history`

**Reference Coach (7개)**: `add_reference_brief`, `delete_reference_brief`, `add_track_plan`, `delete_track_plan`, `add_learning_missions`, `update_learning_mission`, `delete_learning_mission`

---

## 5. 워크플로우

### A. Spotify 앨범 불러오기 (추천 시작점)
```
1. Settings → Spotify Client ID/Secret 입력
2. Dashboard → 앨범 불러오기
3. 아티스트명 + 앨범명 검색
4. 수록곡 선택 → 가져오기
5. SongFlow 앨범 자동 생성 (BPM, Key, Genre 자동 입력)
6. 각 TrackDetail에서 원곡 정보 확인 후 작업 시작
```

### B. MCP 방식 (Claude Code 사용자)
```
Claude Code에서:
1. list_albums → 앨범 확인
2. create_track(albumId, title, concept, bpm, key) → 트랙 생성
3. "이 트랙의 Reference Coach 분석 해줘" → AI가 분석 후 add_reference_brief
4. SongFlow 앱에서 결과 확인
```

### C. 인앱 AI 방식 (일반 사용자)
```
SongFlow 앱에서:
1. Settings → Anthropic API 키 입력
2. TrackDetail → ReferenceSongSection → AI 제안으로 레퍼런스 곡 추가
3. ReferenceCoachSection → 분석 시작 → Brief / Plan / Missions 자동 생성
4. ChordGrooveSection → AI 코드 진행 생성
5. PromptLabSection → Suno 프롬프트 생성
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
| 외부 API | Spotify Web API (Client Credentials) |

---

## 7. Product Principles

- 로컬 전용 — 서버, 로그인, 클라우드 동기화 없음
- 앱은 데이터를 저장하고 보여주는 역할, AI가 실제 작업 수행
- API 키는 로컬 파일에만 저장 (서버 전송 없음)
- MCP와 인앱 API는 공존 — 사용자가 선택
- Spotify는 공개 데이터 조회 전용 (Client Credentials, 사용자 인증 불필요)
