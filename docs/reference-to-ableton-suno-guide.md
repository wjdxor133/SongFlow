# 레퍼런스 → Ableton 베드 → Suno 보컬 — 실전 가이드

스파이크(2026-07-12~14)에서 검증된 절차. 새 곡을 시작할 때 이 순서대로 진행한다.
모든 단계는 Claude Code 대화로 구동하고, 손작업은 🖐 표시.

## 0. 전제 조건 (최초 1회 — 이미 완료됨)

- AbletonMCP Remote Script 설치됨 (`~/Music/Ableton/User Library/Remote Scripts/AbletonMCP/`, 로케이터 패치 포함)
- Live 설정 → Link/Tempo/MIDI → Control Surface = **AbletonMCP**
- Claude Code에 `ableton` MCP 등록됨 (`claude mcp list`로 확인)
- `scripts/ableton-backup.sh`, `scripts/ableton-save.sh`, `scripts/ableton_client.py`
- Suno **Pro 이상** (Add Vocals + 스템 분리 필요)

## 1. 곡 재료 만들기 — reference-to-suno

> "〈아티스트 - 곡명〉 레퍼런스로 새 트랙 준비해줘"

스킬 Q&A(작업 키, 컨셉/언어)에 답하면 SongFlow에 저장됨:
코드 진행 후보 · 음절 일치 가사(송폼 포함) · Suno 스타일 프롬프트 · Suno 설정.

## 2. Live 프로젝트 준비 🖐

1. Ableton Live 실행 → **File → New Live Set**
2. **⌘S** → `바탕화면/music/SongFlow/` 아래 곡명으로 저장 (예: `crave-bed`)
3. Control Surface가 AbletonMCP인지 확인 (포트 9877)

⚠️ 작업 중인 실제 프로젝트가 열려 있으면 안 됨 — 스킬이 상태를 읽고 트랙 수가 많으면 정지한다.

## 3. 자동 셋업 — ableton-setup

> "이 트랙 에이블톤에 깔아줘" / "에이블톤 셋업"

Q&A(트랙 선택, 송폼·마디 수 확인) 후 자동 실행:
저장→백업 → 템포 → 트랙 생성(Drums/Perc/Bass/Chords/Pads) → 송폼대로 Arrangement에
섹션 클립 + 로케이터 배치. Session View 상단 5행은 "역할별 작업대"(Verse/Pre/Chorus/Mid/Bridge)로 남는다.

### 반복 레버 (들어보고 말로 요청)
- "코드 진행이 다 똑같아 심심해" → 섹션별 진행 재배치 (기능화성 매핑)
- "베이스가 초보 같아" → 세션 플레이어 패스 (어프로치 노트, A/A' 변주, 고스트)
- "기계 티 나" → 휴먼라이저 패스 (스윙, 포켓, 벨로시티 지터)
- "드럼/퍼커션 추가해줘" → 트레시요 킥 + 콩가 인터로킹 배치

⚠️ 알려진 제약: 재배치 전 **세션 작업대 클립 삭제는 손으로** 해야 함 (API에 삭제 없음).
Claude가 요청하면 Session View에서 해당 트랙 클립만 지우면 된다.

## 4. 손작업 🖐 — 소리 입히기 (10분)

| 트랙 | 악기 | 팁 |
|------|------|-----|
| Drums | Drum Rack (킥 C1/스네어 D1/햇 F#1 표준) | |
| Perc | 퍼커션 킷 | 셰이커=F#1, 콩가=C1·D1. 안 어울리면 노트 전체 이동 |
| Bass | 신스 베이스 | **Mono + Glide 20~40ms** 필수, Saturator 권장 |
| Chords | 피아노/키즈/플럭 (어택 있는 것) | |
| Pads | 패드 (어택 느린 것) | |

- 그루브 더 원하면: Groove Pool에서 스윙 그루브를 클립에 드래그
- 로케이터로 섹션 점프하며 귀 판정 → 마음에 안 들면 3단계 레버로 반복

## 5. 바운스 🖐 → Suno

1. **⇧⌘R** (Export Audio/Video) — 전체 길이, MIDI 트랙만
   ⚠️ **Splice 등 샘플 오디오 포함 금지** — Suno 핑거프린팅에 걸릴 수 있음. MIDI 신스만
2. Suno → **Upload Audio** → 업로드 (Pro 30분 한도, 풀렝스 OK)
3. **Add Vocals** 선택:
   - Lyrics: SongFlow에 저장된 음절 일치 가사 (`get_track_prompts`로 조회 가능)
   - Style: 저장된 스타일 프롬프트 + "keep the existing instrumental"
   - **Audio Strength: 최대** (베드 보존)
4. 여러 번 생성 → 톱라인 좋은 버전 선택
5. **스템 분리** (Pro 2종) → **보컬 스템만 다운로드**

결과 판정 요령: 베드 보존도가 낮으면 Audio Strength 확인, 톱라인이 아쉬우면
refine-suno로 프롬프트 레버 조정. 멜로디를 조종하고 싶으면 이때 가이드 멜로디를
베드에 심고 재업로드 (1차부터 멜로디를 넣지 말 것 — Suno의 제안 능력이 사라짐).

## 6. 복귀 🖐 — 같은 프로젝트에서 완성

1. 보컬 스템을 Arrangement 빈 영역에 드래그 → Topline 트랙 자동 생성
2. 이후는 기존 파이프라인: 편곡 다듬기, ACE Studio 보컬, 사운드(Splice/Serum), 믹스

## 문제 해결

- **망가졌다** → `<프로젝트>/SongFlow Backup/`에서 최신 백업 .als 열기 (조작 전마다 자동 생성됨)
- **스킬이 안 움직인다** → Live 실행 + Control Surface 확인, `nc -z localhost 9877`
- **Remote Script 고친 뒤** → Control Surface를 None→AbletonMCP로 토글해야 반영
- 진행 상황·갭 목록: `.omc/plans/songflow-ableton-spike.md`, `.omc/research/ableton-spike-day1-research.md`
