# SongFlow

**AI와 함께하는 음악 제작 워크플로우 데스크톱 앱**

---

## 왜 만들었나요?

음악을 만들 때 가장 어려운 부분은 **"어떤 곡을 레퍼런스로 삼아, 어떤 방향으로 만들어야 하는가"** 를 정리하는 일입니다.

기존에는 이 과정이 머릿속이나 메모장에 흩어져 있었습니다. 레퍼런스 곡을 찾고, 분석하고, 코드 진행을 정리하고, Suno 같은 AI 음악 생성 도구에 넣을 프롬프트를 만드는 작업이 툴 간 이동과 반복 작업의 연속이었습니다.

**SongFlow는 이 흐름을 한 곳에 모읍니다.**

- Spotify에서 레퍼런스 앨범을 바로 불러와 프로젝트로 만들고
- AI가 레퍼런스를 분석해 제작 방향, 코드 진행, 학습 미션을 제안하고
- 최종적으로 Suno에 넣을 프롬프트까지 자동으로 생성합니다

모든 데이터는 **로컬에만 저장**됩니다. 서버도, 로그인도 없습니다.

---

## 주요 기능

| 기능 | 설명 |
|------|------|
| **앨범 불러오기** | Spotify API로 아티스트 앨범 검색 → 수록곡 선택 → 프로젝트 자동 생성 (BPM, Key, Genre 자동 입력) |
| **Reference Coach** | 레퍼런스 곡 기반 AI 분석 → 제작 브리프 / 플랜 / 학습 미션 자동 생성 |
| **AI 레퍼런스 제안** | 트랙 정보 기반으로 유사 레퍼런스 곡 5개 자동 추천 |
| **코드 진행** | AI 자동 생성 + 직접 입력, Tone.js로 인앱 미리듣기 |
| **Suno 프롬프트 생성** | 트랙 정보 + 레퍼런스 분석 결과로 Suno 프롬프트 자동 생성 |
| **MCP 서버** | Claude Code, Cursor 등 AI 도구에서 SongFlow 데이터 직접 접근 |

---

## 시작하기

### 요구 사항

- macOS (Tauri 앱)
- Node.js 18+
- Rust (Tauri 빌드용)

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

### 1단계: API 키 설정

앱 상단 **Settings**에서 사용할 API를 등록합니다.

| API | 용도 | 발급처 |
|-----|------|--------|
| Anthropic API Key | AI 분석, 레퍼런스 제안, 코드 생성 | [console.anthropic.com](https://console.anthropic.com) |
| Spotify Client ID/Secret | 앨범 불러오기 | [developer.spotify.com](https://developer.spotify.com) |

> Spotify 앱 생성 시 Redirect URI는 `https://example.com/callback` 으로 입력하세요.  
> SongFlow는 Client Credentials 방식을 사용하므로 실제로 리다이렉트가 발생하지 않습니다.

---

### 2단계: 프로젝트 시작

#### A. Spotify 앨범 불러오기 (추천)

1. Dashboard에서 **앨범 불러오기** 클릭
2. 아티스트명 + 앨범명 입력 후 검색
3. 수록곡 선택 (전체 선택/해제 가능)
4. **가져오기** 클릭 → SongFlow 앨범 자동 생성

가져온 트랙에는 원곡 정보(아티스트, 앨범, 발매년도)와 BPM, Key, Genre가 자동으로 채워집니다.

#### B. 직접 생성

> 현재 버전에서는 Spotify 불러오기가 기본 진입점입니다.  
> 향후 빈 앨범 직접 생성 기능이 추가될 예정입니다.

---

### 3단계: 트랙 작업

앨범 → 트랙 카드 클릭으로 TrackDetail에 진입합니다.

#### 레퍼런스 곡 추가

- **직접 추가**: 레퍼런스 곡 섹션 → 추가 버튼
- **AI 제안**: Anthropic API 키 등록 시 → AI 제안 버튼으로 유사 곡 5개 자동 추천

#### Reference Coach 분석

1. **분석 시작** 버튼 클릭
2. 레퍼런스 곡 정보, 타겟 장르, 원하는 분위기 입력
3. AI가 순서대로 생성:
   - **Reference Brief** — 레퍼런스 분석 요약
   - **Track Plan** — 구체적인 제작 방향
   - **Learning Missions** — 이 트랙을 만들기 위한 학습 미션 목록

#### 코드 진행

- **직접 입력** 또는 **AI 자동 생성**
- 인앱 미리듣기로 확인 후 선택

#### Suno 프롬프트

- PromptLab 섹션에서 트랙 정보 기반 Suno 프롬프트 자동 생성
- 생성된 프롬프트를 Suno에 복사하여 사용

---

### MCP 서버 연결 (Claude Code 사용자)

SongFlow 데이터를 Claude Code에서 직접 다룰 수 있습니다.

```bash
# MCP 서버 빌드
cd mcp-server
npm install && npm run build

# Claude Code에 등록
claude mcp add songflow node /path/to/SongFlow/mcp-server/dist/server.js
```

등록 후 Claude Code에서 자연어로 SongFlow 데이터를 조회하고 수정할 수 있습니다.

```
"SongFlow에서 NewJeans Get Up 앨범 트랙 목록 보여줘"
"Supernatural 트랙의 Reference Coach 분석 시작해줘"
```

제공 툴: Album/Track CRUD, Reference Coach 데이터 관리, Suno 결과 저장 등 **21개 툴**

---

## 데이터 저장 위치

```
~/Library/Application Support/com.wjdxor133.songflow/songflow-data.json
```

모든 앨범, 트랙, AI 분석 결과가 이 파일 하나에 저장됩니다.

---

## 기술 스택

- **Tauri 2** (Rust) — 데스크톱 런타임
- **React 19 + TypeScript + Vite** — 프론트엔드
- **Tailwind CSS 4 + shadcn/ui** — UI
- **Zustand 5** — 상태 관리
- **Anthropic Claude API** — AI 분석 및 생성
- **Spotify Web API** — 앨범/트랙 데이터
- **Tone.js** — 코드 진행 미리듣기
- **MCP SDK** — Claude Code 연동
