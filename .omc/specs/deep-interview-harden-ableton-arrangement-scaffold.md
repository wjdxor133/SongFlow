# Deep Interview Spec: Ableton 어레인지먼트 뼈대 다지기 (구조/내용 분리)

## Metadata
- Interview ID: di-ableton-scaffold-2026-07-20
- Rounds: 5 (+ Round 0 topology)
- Final Ambiguity Score: 12%
- Type: brownfield
- Generated: 2026-07-20
- Threshold: 0.2
- Threshold Source: default
- Initial Context Summarized: no (pasted workflow doc used as context)
- Status: PASSED

## Clarity Breakdown
| Dimension | Score | Weight | Weighted |
|-----------|-------|--------|----------|
| Goal Clarity | 0.93 | 0.35 | 0.326 |
| Constraint Clarity | 0.82 | 0.25 | 0.205 |
| Success Criteria | 0.88 | 0.25 | 0.220 |
| Context Clarity | 0.85 | 0.15 | 0.128 |
| **Total Clarity** | | | **0.878** |
| **Ambiguity** | | | **0.122** |

## Topology
세션 목표: **만든 것 다지기(harden)**. 파이프라인 5단계 중 2단계(Ableton MIDI)에 초점, 그중에서도 어레인지먼트 구조로 수렴.

| Component | Status | Description | Coverage / Deferral Note |
|-----------|--------|-------------|--------------------------|
| 2. Ableton MIDI — 어레인지먼트 뼈대 | active (primary) | 송폼 → Arrangement에 정확한 마디의 섹션 + 로케이터 배치 | 본 스펙의 acceptance criteria 전부가 여기에 매핑 |
| 1. 레퍼런스 → Suno 프롬프트 | active (secondary) | reference-to-suno / lyrics-from-reference | 이번 범위 아님. 현 상태 유지, 회귀만 방지 |
| 3. Suno 생성 + 리파인 | active (secondary) | refine-suno | 이번 범위 아님. 현 상태 유지 |
| 4. 스템 → DAW + Splice | deferred | 도구 없음 | 사용자 확인 보류 (2026-07-20): 이번 세션 목표 아님 |
| 5. 믹싱 | deferred | 도구 없음 | 사용자 확인 보류 (2026-07-20) |
| 6. SongFlow 앱 | deferred | 읽기 전용 뷰어 | 사용자 확인 보류 (2026-07-20) |

## Goal
`ableton-setup` 스킬이 SongFlow 트랙 데이터(BPM/키/송폼)를 받아, **정확한 마디 길이의 섹션 + 정확히 배치된 로케이터로 이루어진 Arrangement '뼈대'를 100% 신뢰성 있게** 생성하도록 다진다. 코드/베이스/드럼 노트 채우기는 이 뼈대 위에 얹히는 **별개의 후속 단계**로 분리한다.

## Constraints
- **구조/내용 분리(핵심 결정):** 구조(섹션·마디·로케이터) 생성과 내용(MIDI 노트) 채우기를 한 번에 하지 않는다. 구조를 먼저 확정적으로 보장하고, 내용은 별도 레이어.
- 스킬 중심 아키텍처 유지: 생성 로직은 Claude Code 스킬 + `scripts/*.py` + MCP. SongFlow 앱은 읽기 전용 뷰어로 유지.
- 수동 전제조건 허용: Ableton Remote Script 설치 + `AbletonMCP` Control Surface + `localhost:9877` 서버 실행은 사용자가 수동으로 준비하는 것으로 수용.
- 결과물은 곧바로 **바운스 → Suno 업로드(Add Vocals)** 입력이 될 수 있어야 함.

## Non-Goals
- 스템 분리(4단계), 믹싱(5단계) 도구화 — 이번 범위 아님.
- SongFlow 앱 내 생성 기능 추가 — 아님.
- 1·3단계(프롬프트/리파인) 스킬 재설계 — 회귀 방지 외 손대지 않음.
- MIDI 노트의 음악적 품질 개선(베이스/드럼 패턴이 기계적인 문제)은 이번 "구조" 스코프가 아님(별도 내용-채우기 단계로 분리됨).

## Acceptance Criteria
- [ ] 송폼의 **모든** 섹션(Intro~Outro)이 Arrangement 타임라인에 빠짐없이 존재한다.
- [ ] 각 섹션의 마디 길이가 송폼 명세와 정확히 일치한다(마디 계산 검증 통과 — **의심 1순위 원인**).
- [ ] 섹션 경계에 로케이터가 정확한 마디에 이름과 함께 배치된다.
- [ ] 재생 시 섹션 경계가 그리드에 딱 맞는다(타이밍/오프-그리드 어긋남 없음).
- [ ] 구조 생성이 부분 완료/타임아웃 없이 결정적으로 끝난다(불완전 상태로 멈추지 않음).
- [ ] 구조 단계와 내용 채우기 단계가 명확히 분리되어, 구조만 단독 실행/검증 가능하다.
- [ ] 1·3단계 스킬(reference-to-suno, refine-suno) 동작에 회귀가 없다.

## Assumptions Exposed & Resolved
| Assumption | Challenge | Resolution |
|------------|-----------|------------|
| "파이프라인을 새로 만들어야 한다" | 레포 탐색 결과 1~3단계 이미 구현됨 | 목표를 "다지기"로 재정의, 2단계에 집중 |
| "Ableton MIDI 전반이 문제다" | 어느 증상이 반복되나? | 원인은 **섹션/어레인지먼트 구조**로 좁혀짐 |
| "완성 = 내용까지 꽉 찬 전체 타임라인 한 방에" (Contrarian) | 구조+내용 동시 생성이 불안정의 원인 아닌가? | **구조/내용 분리** 채택 — 뼈대 먼저 100% 보장 |
| "어느 층위가 깨지는지 불명" (Simplifier) | 마디계산 vs 복제 vs 로케이터 vs 타임아웃? | **마디 계산(송폼→바 길이 변환)**이 1순위 의심 |

## Technical Context
- 스킬: `.claude/skills/ableton-setup/SKILL.md` (SongFlow 트랙 → 템포/트랙/섹션 로케이터/MIDI 초안).
- 브리지: `scripts/ableton_client.py` — `localhost:9877` TCP 클라이언트. 관련 커맨드: `set_tempo`, `create_midi_track`, `create_clip`, `add_notes_to_clip`, `set_clip_name`, `duplicate_session_clip_to_arrangement`, `get_arrangement_clips`, `set_current_song_time`, 로케이터/재생 제어.
- MIDI 생성 스크립트: `scripts/bass-song-sections.py`, `scripts/drum-song-sections.py` → `exports/{bass,drums}/*.mid` + Ableton JSON (내용 채우기 단계에 해당).
- **수정 1순위 대상:** 송폼 섹션 정의 → 마디/바 수 → 절대 위치/길이 변환 로직(BPM·박자 기반). 이 계산이 어긋나면 섹션 길이·로케이터·복제 위치가 연쇄로 틀어짐.
- MCP: `mcp-server/src/server.ts` (26 tools). 송폼/코드 데이터 소스는 여기서 읽음.

## Ontology (Key Entities)
| Entity | Type | Fields | Relationships |
|--------|------|--------|---------------|
| Track | core domain | id, bpm, key, songform | has Sections; source of MCP data |
| Section | core domain | name, bar length, start bar | belongs to Songform; maps to Arrangement region + Locator |
| Songform | core domain | ordered sections | defines Section sequence & lengths |
| Bar/Beat math | core (process) | bpm, time signature | Section → absolute time/length 변환 |
| Locator | supporting | name, bar position | marks Section boundary in Arrangement |
| MIDI Clip | supporting | notes, length | fills a Section (별도 단계) |
| Arrangement | supporting | timeline regions | contains Sections/Clips/Locators |
| Chord/Bass/Drum content | supporting | notes, pattern | content-fill layer (분리됨) |
| MCP data | external system | tracks, chords, plans | read source for setup |

## Ontology Convergence
| Round | Entity Count | New | Changed | Stable | Stability Ratio |
|-------|-------------|-----|---------|--------|----------------|
| 1 | 9 | 9 | - | - | N/A |
| 2 | 9 | 0 | 0 | 9 | 100% |
| 3 | 9 | 0 | 0 | 9 | 100% |
| 4 | 9 | 0 | 0 | 9 | 100% |
| 5 | 9 | 0 | 0 | 9 | 100% |

도메인 모델이 Round 2에 즉시 수렴 — Section/Songform/Bar-math/Locator가 안정적 핵심.

## Interview Transcript
<details>
<summary>Full Q&A (Round 0 + 5 rounds)</summary>

### Round 0 — Topology
**Q:** 5단계 파이프라인 토폴로지 확인 / 이번 세션 목표?
**A:** "만든 것 다지기" (harden what's built)

### Round 1
**Q:** 실사용에서 가장 자주 깨지거나 손이 다시 갔던 지점은?
**A:** Ableton MIDI 배치
**Ambiguity:** 53%

### Round 2
**Q:** Ableton MIDI 배치가 어긋날 때 가장 자주 나타난 증상은?
**A:** 섹션/어러지먼트 구조
**Ambiguity:** 41%

### Round 3
**Q:** ableton-setup 실행 직후 '성공' 상태를 가장 잘 설명하는 것은?
**A:** 전체 타임라인 완성
**Ambiguity:** 27%

### Round 4 (Contrarian)
**Q:** 구조/내용을 분리(구조 먼저 100% 보장)하는 안에 대해?
**A:** 맞음, 분리하자
**Ambiguity:** 16%

### Round 5 (Simplifier)
**Q:** 구조가 어긋날 때 가장 의심가는 층위는?
**A:** 마디 계산
**Ambiguity:** 12%

</details>
