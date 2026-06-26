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
| **가이드 샘플 온보딩** | API 키 없이 미리 준비된 샘플 곡으로 전체 흐름(분석 → 코드/그루브 듣기 → Suno 프롬프트 복사)을 한 바퀴 체험 |
| **앨범 불러오기** | Spotify API로 아티스트 앨범 검색 → 수록곡 선택 → 프로젝트 자동 생성 (BPM, Key, Genre 자동 입력) |
| **Reference Coach** | 레퍼런스 곡 기반 AI 분석 → 제작 브리프 / 플랜(개요·코드·그루브·적용 탭) / 학습 미션 자동 생성 |
| **AI 레퍼런스 제안** | 트랙 정보 기반으로 유사 레퍼런스 곡 5개 자동 추천 |
| **코드 & 그루브** | AI 자동 생성 + 직접 입력, Tone.js로 인앱 미리듣기, 트랙에 원클릭 적용 |
| **Suno 프롬프트 생성** | 트랙 정보 + 레퍼런스 분석 결과로 Suno 프롬프트 자동 생성 (복사·편집) |
| **MCP 서버** | Claude Code, Cursor 등 AI 도구에서 SongFlow 데이터 직접 접근 (21개 툴) |

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

### 전체 흐름 한눈에

```
설치 → (가이드 샘플 체험) → API 키 설정 → 앨범/트랙 생성
   → Reference Coach 분석 → 코드·그루브·가사 생성 → Suno 프롬프트 → Suno에서 곡 생성
```

핵심 철학: **"어떤 곡을 레퍼런스로, 어떤 방향으로 만들지"를 한 곳에서 정리하고 Suno 프롬프트까지 자동화.** 아래는 가장 추천하는 전체 플로우입니다.

1. Spotify로 레퍼런스 앨범 임포트 (또는 트랙 직접 생성)
2. 트랙 진입 → **Reference Coach "분석 시작"** → 브리프·플랜·학습 미션 생성
3. Track Plan에서 코드·그루브·사운드 키워드를 트랙에 **원클릭 적용**
4. (정밀 가사가 필요하면) Claude Code에서 **`/lyrics-from-reference`** 스킬로 레퍼런스 음절 구조에 맞춘 가사 생성
5. **Prompt Lab**의 Suno 프롬프트 복사 → Suno에서 곡 생성
6. 결과를 듣고 가사·프롬프트를 이터레이션

---

### 시작 전: 가이드 샘플 둘러보기 (API 키 불필요)

처음 실행하면 Dashboard 빈 화면에서 **가이드 샘플로 시작** 버튼을 누를 수 있습니다.

미리 준비된 예제 곡 하나로 **레퍼런스 분석 → 코드/그루브 듣기 → Suno 프롬프트 복사**까지 전체 흐름을 키 입력 없이 4단계로 체험합니다. 실제 AI 호출(내 곡 만들기)은 이 단계를 마친 뒤 시작합니다.

> 언제든 **Settings → 가이드 다시 보기**로 다시 둘러볼 수 있습니다.

---

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
   - **Reference Brief** — 레퍼런스 분석 요약 (장르/무드 태그, 신뢰도)
   - **Track Plan** — 구체적인 제작 방향. 탭 4개로 정리:
     - **개요** — 방향 요약, 추천 Key/BPM
     - **코드** — 코드 진행 제안 → `코드 추가`로 트랙에 적용
     - **그루브** — 그루브 패턴 제안 → `그루브 추가`로 트랙에 적용
     - **적용** — `사운드 키워드 적용` + `Suno 프롬프트 만들기`
   - **Learning Missions** — 이 트랙을 만들기 위한 학습 미션 체크리스트

#### 코드 & 그루브

- **직접 입력** 또는 **AI 자동 생성**
- Tone.js 인앱 미리듣기로 확인 후 트랙에 적용

#### Suno 프롬프트

- PromptLab 섹션에서 트랙 정보 + 레퍼런스 분석 결과 기반 Suno 프롬프트 자동 생성
- 생성된 프롬프트(Style/Lyrics)를 복사·편집하여 Suno에 붙여넣기

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

#### `/lyrics-from-reference` 스킬 (정밀 가사 생성)

Claude Code에서 레퍼런스 곡 구조에 맞춘 가사를 생성하는 전용 스킬입니다.
레퍼런스의 섹션 구성·줄 수·**줄별 음절 수**(영어는 CMUdict 사전 기반으로 정밀 카운트)를
분석해, 내용은 100% 오리지널이되 구조가 동일한 가사 + Suno 프롬프트를 만들어 SongFlow에 저장합니다.

```
/lyrics-from-reference Bruno Mars - Uptown Funk, track: New Wave, concept: 새벽 드라이브
```

> 구조·음절이 같으면 Suno가 비슷한 리듬·프레이징으로 곡을 뽑아내, 내용은 새로워도 레퍼런스의 "느낌"이 살아납니다. (정밀 음절 매칭은 영어 가사에 적용)

> **두 가지 AI 작업 방식** — ① 앱 안의 **Reference Coach**(GUI 버튼)로 분석·플랜·프롬프트를 만들거나, ② **Claude Code + MCP/스킬**로 더 정밀하게 데이터를 조작하고 가사를 생성할 수 있습니다.

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
