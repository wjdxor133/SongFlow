# SongFlow

**Claude Code로 음악 제작 워크플로우를 돌리는 데스크톱 허브**

---

## 왜 만들었나요?

곡을 만드는 실제 흐름은 이렇습니다:

1. 레퍼런스 곡을 정하고 **Key / BPM**을 파악해 작업 키(C 기준)로 옮긴다
2. 곡의 느낌을 분석해 **Suno 프롬프트**를 만든다
3. 레퍼런스 **송폼(verse·pre-chorus·chorus…)에 맞춰 음절 수가 동일한 가사**를 쓴다
4. Suno에 프롬프트 + 가사를 넣어 곡을 생성한다
5. 마음에 드는 탑라인을 **DAW에서 멜로디로 조합**하고, 샘플·신스로 완성한다

이 과정이 여러 도구에 흩어져 있었습니다. SongFlow는 **1~4단계의 준비물**을 한 번에 만들어 한 곳에 모읍니다.

핵심 철학:

> **앱 = 데이터 뷰어/허브, AI 작업 = Claude Code 스킬 + MCP**

앱은 결과(가사·프롬프트·코드 진행·분석)를 **보여주고 정리**합니다. 실제 생성 작업은 **Claude Code 스킬**이 MCP를 통해 수행하고 결과를 앱에 기록합니다. 모든 데이터는 **로컬에만 저장**됩니다. 서버도, 로그인도 없습니다.

---

## 핵심: `reference-to-suno` 스킬

Claude Code에서 레퍼런스 곡 하나를 질의문답으로 받아, **Suno에 바로 쓸 트랙**을 만들어 앱에 띄웁니다.

```
"유다연 Oh My 로 곡 만들어줘"
   │  ① 어떤 곡?      → 웹에서 Key/BPM/느낌 자동 수집, C키로 변환
   │  ② 원곡 가사?    → 붙여넣으면 송폼·줄별 음절 수 분석
   │  ③ 컨셉/언어?    → 예: "강렬한 첫만남, 영어"
   ▼
앱에 트랙 1개 생성 (MCP 기록):
  · Key(C) / BPM / Concept
  · Reference Brief (느낌 분석)
  · Suno 스타일 프롬프트 + 음절 일치 가사
  · 코드 진행 5개 (자동 삽입)
  · 권장 Suno 설정 (Weirdness / Style Influence / Audio Influence)
   ▼
앱에서 프롬프트 + 가사 복사 → Suno 생성 → DAW에서 멜로디·믹싱
```

음절 일치가 핵심입니다 — 구조·줄별 음절이 같으면 Suno가 레퍼런스의 리듬·프레이징을 살린 결과를 냅니다.

---

## 주요 기능

| 기능 | 설명 |
|------|------|
| **reference-to-suno 스킬** | 레퍼런스 곡 → C키 변환·Suno 프롬프트·음절 일치 가사·코드 진행을 한 번에 생성해 트랙에 기록 (Claude Code) |
| **MCP 서버** | Claude Code 등에서 SongFlow 데이터를 직접 다루는 22개 툴 (Album/Track CRUD, Reference Brief, 코드 진행, Suno 결과 등) |
| **트랙 뷰어** | 가사·메타(Key/BPM/Genre/Concept)·Reference Brief·PromptLab·코드/그루브·노트를 보고 편집 |
| **코드 & 그루브** | 트랙에 저장된 코드 진행을 Tone.js로 인앱 미리듣기 |
| **가이드 샘플 온보딩** | API 키 없이 샘플 곡으로 전체 흐름(분석 → 코드/그루브 듣기 → Suno 프롬프트 복사)을 키 입력 0회로 체험 |

> 이전 버전의 Spotify 앨범 불러오기·인앱 AI 생성 버튼·Track Plan은 제거되었습니다. 진입과 생성은 `reference-to-suno` 스킬 + MCP로 일원화됩니다.

---

## 시작하기

### 요구 사항
- macOS (Tauri 앱)
- Node.js 18+
- Rust (Tauri 빌드용)
- Claude Code (AI 작업용)

### 설치 및 실행
```bash
git clone https://github.com/wjdxor133/SongFlow.git
cd SongFlow
npm install
npm run tauri dev
```

### 빌드
```bash
npm run tauri build
```

---

## 사용 방법

### 전체 흐름
```
설치 → MCP 서버 등록 → (가이드 샘플 체험)
   → Claude Code에서 reference-to-suno 스킬 실행 (곡 → 가사 → 컨셉/언어)
   → 앱에서 결과 확인 → 프롬프트·가사 복사 → Suno 생성 → DAW에서 멜로디·믹싱
```

### MCP 서버 등록 (필수)
SongFlow 데이터를 Claude Code에서 다루려면 MCP 서버를 등록합니다.

```bash
cd mcp-server
npm install && npm run build

claude mcp add songflow node /path/to/SongFlow/mcp-server/dist/server.js
```

등록 후 Claude Code에서 자연어로 데이터를 조회·생성할 수 있습니다.

```
"SongFlow에서 앨범 목록 보여줘"
"유다연 Oh My 로 곡 만들어줘"   ← reference-to-suno 스킬
```

### reference-to-suno 스킬
`.claude/skills/reference-to-suno/`에 포함되어 있습니다. Claude Code에서 곡 이름을 던지면 위 [핵심] 흐름대로 트랙을 만들어 앱에 기록합니다. 원곡 가사는 음절 정밀 매칭을 위해 붙여넣기로 받습니다(한국 신곡 등은 웹 자동 추출이 막히는 경우가 많아 붙여넣기가 기본).

### 가이드 샘플 둘러보기 (API 키 불필요)
처음 실행하면 Dashboard에서 **가이드 샘플로 시작**으로 전체 흐름을 키 입력 없이 체험할 수 있습니다. 언제든 **Settings → 가이드 다시 보기**로 다시 볼 수 있습니다.

### 트랙 보기
앨범 → 트랙 진입(TrackDetail)에서 스킬이 만든 결과를 봅니다:
- **메타** — 제목/Genre/BPM/Key/Concept/가사 (편집 가능)
- **Reference Brief** — 레퍼런스 느낌 분석
- **PromptLab** — Suno 프롬프트(Style/Lyrics) 복사
- **코드 & 그루브** — 코드 진행 목록 + Tone.js 미리듣기
- **Learning Missions / Notes**

---

## 데이터 저장 위치
```
~/Library/Application Support/com.wjdxor133.songflow/songflow-data.json
```
모든 앨범·트랙·분석 결과가 이 파일 하나에 저장됩니다.

---

## 기술 스택
- **Tauri 2** (Rust) — 데스크톱 런타임
- **React 19 + TypeScript + Vite** — 프론트엔드
- **Tailwind CSS 4 + shadcn/ui** — UI
- **Zustand 5** — 상태 관리
- **Tone.js** — 코드 진행 미리듣기
- **MCP SDK** — Claude Code 연동 (AI 작업은 Claude Code 스킬 + MCP로 수행)
