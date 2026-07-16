---
name: ableton-setup
description: SongFlow 트랙 데이터(BPM/키/코드 진행/송폼)로 Ableton Live 프로젝트를 작업 가능 상태로 자동 셋업한다. 백업 → 템포 → 트랙 생성 → 송폼대로 Arrangement 타임라인에 코드/베이스/패드 MIDI 초안 배치 + 섹션 로케이터 생성. "에이블톤 셋업", "작업 시작하자", "이 트랙 에이블톤에 깔아줘"에 사용. 결과물은 바운스 → Suno 업로드(Add Vocals)의 입력이 된다.
---

# ableton-setup: SongFlow → Ableton 프로젝트 자동 셋업

## 전제 조건 (하나라도 실패 시 진행 중단하고 사용자에게 안내)
1. Ableton Live 실행 중 + Control Surface `AbletonMCP` 활성 (검증: `nc -z localhost 9877`)
2. 대상 Live 세트가 열려 있고 **한 번 이상 저장된 상태** (새 미저장 세트면 저장 먼저 요청)
3. SongFlow MCP 사용 가능 (`get_track` 호출 가능)

## 도구
- **Ableton 제어**: `python3 /Users/taek2/SongFlow/scripts/ableton_client.py <command> '<json-params>'`
  - 검증된 명령: get_session_info, get_track_info, set_tempo, create_midi_track, set_track_name,
    create_clip, add_notes_to_clip, set_clip_name, duplicate_session_clip_to_arrangement,
    get_arrangement_clips, create_locator, get_locators, set_current_song_time,
    start_playback, stop_playback
  - 응답은 JSON `{"status": "success|error", ...}` — error면 그 자리에서 사용자에게 보고
- **저장**: `/Users/taek2/SongFlow/scripts/ableton-save.sh` (File 메뉴 클릭 방식 — keystroke 금지)
- **백업**: `/Users/taek2/SongFlow/scripts/ableton-backup.sh <path/to/project.als>`
- **트랙 데이터**: SongFlow MCP `get_track` (BPM, key, chordProgressions, lyrics 섹션 구조)

## 실행 순서

### 1단계: Q&A (한 번에 한 질문, 기본값 확인 — 절대 생략 금지)
1. 어떤 SongFlow 트랙? (모호하면 `list_tracks`로 후보 제시)
2. `get_track`으로 데이터 조회 후 **송폼 확인**: 가사 섹션 구조에서 도출한 섹션 순서 +
   섹션별 마디 수 기본값(코드 진행 bars 기준, 관례: Verse/Chorus 8마디)을 표로 제시하고 확인받기
3. 대상 .als 경로 확인 (기본값: `~/Desktop/music/SongFlow/` 아래 최신 프로젝트)

### 2단계: 안전 확인 (순서 고정)
1. `get_session_info`로 열린 세트 확인 — **트랙 수가 예상(새 세트 ~4개)보다 크게 많으면
   실제 작업 프로젝트일 수 있으므로 정지하고 사용자에게 확인** (Day 1에 92트랙 실프로젝트 감지 사례)
2. `ableton-save.sh` (미저장 변경 디스크 반영)
3. `ableton-backup.sh <als>` → 백업 경로를 사용자에게 보고

### 3단계: 셋업
1. `set_tempo` — SongFlow 트랙 BPM
2. 트랙 생성: Drums / Bass / Chords / Pads / Topline / Vocal
   (`create_midi_track` index -1 → 응답의 index 기억 → `set_track_name`)
3. 섹션별 MIDI 배치 — 섹션마다:
   a. 코드 진행을 노트로 변환: export_chord_midi 응답의 `perChord`(sym/bass/chord) +
      `bars`/`barsPerChord`/`repeat`를 결합해 마디 오프셋 재계산 (perChord는 1회분·타이밍 없음 주의)
   b. Chords 트랙: `create_clip`(길이 = 섹션 마디×4비트) → `add_notes_to_clip`(보이싱, dur=코드당 비트)
      → `set_clip_name`("Verse" 등 섹션명)
   c. Bass 트랙: 루트 온음표(perChord.bass, 코드당 1노트)
   d. Pads 트랙: 코드 노트 서스테인(섹션 전체 길이)
   e. `duplicate_session_clip_to_arrangement`(destination_time = 섹션 시작 beat)
   f. `create_locator`(time = 섹션 시작 beat, name = 섹션명)
4. Session View 슬롯의 작업용 클립은 남겨둠 (오너는 Arrangement에서 작업 — Session 줄은 작업대)

### 4단계: 검증 + 마무리
1. `get_arrangement_clips`(각 트랙) + `get_locators`로 배치 리드백 검증 — 섹션 수/시작 비트 일치 확인
2. `ableton-save.sh` 최종 저장
3. 보고: 템포/트랙/섹션·로케이터 표 + 백업 경로 + "악기 올리고 스페이스바" 안내
4. 실패 항목이 있으면 숨기지 말고 표에 그대로 표기 (스파이크 갭 수집 중)

## 학습된 함정 (실측에서 확인)
- **트랙 인덱스를 캐시하지 말 것**: 사용자가 실행 중 트랙을 삭제/추가하면 인덱스가 밀림 →
  각 단계 시작 시 `get_track_info`로 이름→인덱스 재매핑 (Day 2: 10→4트랙 삭제로 24클립 배치 실패 사례)
- 로케이터는 반드시 `ableton_client.py`의 `create_locator` 헬퍼 사용 (위치 이동 명령 선행 필수)
- Arrangement 클립 이름은 복제 시점의 세션 클립 이름을 상속 → 복제 직전 `set_clip_name`으로 섹션명 지정
- 오디오 트랙 생성 API 없음 → Topline/Vocal 트랙은 생성 불가. 사용자가 스템을 빈 영역에 드래그(자동 생성)

## 제약
- 실제 작업 프로젝트(스파이크 폴더 밖)에는 오너의 명시적 허락 없이 쓰기 금지
- 오디오 익스포트는 자동화 불가(전 MCP 서버 미지원) — 바운스는 오너가 수동 1클릭 (⇧⌘R)
- Suno 업로드용 바운스에는 샘플 오디오 포함 금지(핑거프린팅) — MIDI 파트만
- Drums 트랙은 빈 트랙으로 생성만 (초안은 GroovePattern 스키마 정의 후 — 백로그)
