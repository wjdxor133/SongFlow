# SongFlow 1주 스파이크: Ableton 셋업 자동화

- Status: **IN PROGRESS** (오너 실행 승인 2026-07-12. 컨센서스 이력 — Architect: APPROVE_WITH_IMPROVEMENTS 반영, Critic: APPROVED, 2 iterations)
- Input spec: `.omc/specs/deep-interview-songflow-ai-native-vision.md` (딥 인터뷰 10라운드, 최종 모호도 19%)
- Date: 2026-07-12
- Mode: RALPLAN-DR short

## Safety Boundary 수정 (오너 결정, 2026-07-12)
R8의 "실전 + 자동 백업"을 스파이크 기간 한정으로 조정: **스파이크는 전용 폴더 `~/Desktop/music/SongFlow/`의 테스트 프로젝트에서만** 진행. 작업 중인 실제 프로젝트는 건드리지 않음(추가했던 테스트 파일 원상복구 완료). 백업 스크립트는 그대로 유지(이중 안전장치). 실전 프로젝트 투입은 스파이크 통과 후.

## Progress Log
- 2026-07-12: Day 0 — `scripts/ableton-backup.sh` 작성·실검증 완료(충돌 처리 포함). 복원 검증(Live에서 열기)만 오너 대기. Day 1 사전 조사 완료 → `.omc/research/ableton-spike-day1-research.md`: 실측 대상 A=ahujasid, B=uisato-extended 확정 / 저장·로케이터·익스포트는 전 서버 미지원(갭 선등록) / `scripts/ableton-save.sh`(AppleScript ⌘S 우회) 준비 / Suno Add Vocals(Pro+, Audio Strength)로 베드→보컬 루프 확인됨, 업로드 베드에 샘플 금지(핑거프린팅)

- 2026-07-12 (Day 1): spike-test 프로젝트에서 A(ahujasid) 실측 — 체크리스트 ①~⑥ 전부 통과. ①상태 읽기✓ ②템포 150✓ ③트랙 생성/이름✓ ④16비트 클립+코드 16노트/베이스 4노트 삽입, 리드백 검증✓ ⑤에러 관찰성✓("Track index out of range" 반환) ⑥저장: keystroke ⌘S는 모디파이어 유실로 실패 → **File 메뉴 항목 클릭 방식으로 해결**, .als XML 검사로 저장 실증. 실프로젝트(92트랙) 감지 시 쓰기 중단하는 안전 절차 실작동. 백업 폴더는 Finder 가시성 문제로 `SongFlow Backup/`으로 개명. 남은 Day 1 항목: 귀 품질 판정(악기 로드 후), ⑦Arrangement 배치 실측, B(uisato) 비교 여부 결정
- 2026-07-12 (Day 1 완료): ⑦ Arrangement 배치 통과(Session 클립 경유 duplicate_session_clip_to_arrangement, beat 단위 배치 검증). **귀 판정 통과**(타이밍 정확, 진행 정상, 노트 겹침 없음) → **Day 1 게이트 통과, A(ahujasid) 확정, B 비교 생략**. 오너는 Arrangement 전용 워크플로우 확인 → 스킬은 Session을 작업대로만 쓰고 Arrangement에 최종 배치. 다음: 로케이터 Remote Script 패치(오너 승인) + Day 2 스킬 작성
- 2026-07-13 (Day 2 완료): 로케이터 패치 v2(2단계 분리 + delete_locator, 타이밍 함정: current_song_time이 동일 디스패치 내 미반영). `ableton-setup` 스킬 작성 + **첫 실전 실행 성공**: "High (ref: Oh My)" 트랙 데이터로 spike-test에 76마디 풀 셋업 — 템포 104, 트랙 4개(Drums/Bass/Chords/Pads), 13섹션 × 3트랙 = 39 Arrangement 클립 + 송폼 로케이터 13개 배치, 리드백 검증 통과. 중간 사고: 사용자가 실행 중 트랙 삭제 → 인덱스 밀림으로 24클립 실패 → 이름 재매핑으로 복구 (스킬에 "인덱스 캐시 금지" 반영). 갭 추가: 오디오 트랙 생성 API 없음(Topline/Vocal 생성 불가), delete_locator는 리로드 대기 중

- 2026-07-14~16 (재사용 검증 = Day 3~4 압축): High 베드에서 이터레이션 루프 검증(섹션별 화성 → 베이스 프로 패스 → 휴먼라이저 → Perc 추가 — 각 레버가 오너 피드백 한 문장으로 트리거됨). 도구 조사(midi-mcp 등 3종 모두 기각 — 자체 규칙 기반이 이미 우세, 진짜 레버는 인간 연주 MIDI 팩+휴먼라이즈). **풀 재사용 사이클 성공**: Super Shy 레퍼런스 → reference-to-suno(가사 자동 추출, C minor 150 이동) → 새 송폼(코러스-프론트 68마디)·Jersey club 문법으로 spike-test에 재빌드 → **오너 첫 귀 판정 통과**. 컨셉 오해석 1건(Crave→Tongue-Tied로 정정, 교훈: Q4 답변의 지시 대상 확인). 사용자 가이드 작성(docs/reference-to-ableton-suno-guide.md). 남은 미검증: 바운스→Suno Add Vocals→보컬 스템 추출 루프. 백로그 추가: 앱 개선(세팅 정리+홈 가이드 버튼, 동결 해제 판단 필요), 세션 플레이어 페르소나 스킬화, MIDI 팩 패턴 데이터화

## Requirements Summary
"Crave 트랙 작업 시작하자" 한마디에 Ableton Live 프로젝트가 작업 가능 상태(BPM/키 세팅, 트랙 구성, 코드 MIDI 배치)로 자동 준비된다. 기성 도구(AbletonMCP 등) + 기존 SongFlow 자산(MCP 22툴, export_chord_midi, 스킬 3종) 조합만 사용하고, 스파이크에서 드러난 결핍 목록이 이후 SongFlow가 직접 소유할 범위를 정의한다. 조작 전 .als 자동 백업 필수. Tauri 앱은 동결.

## RALPLAN-DR Summary

### Principles (4)
1. **발명 금지** — 기성 도구 우선. 자체 구현은 스파이크가 결핍을 증명한 것만.
2. **실전 안전** — 에이전트 조작 전 .als 타임스탬프 백업 자동화, 복원 1회 실검증.
3. **실사용 판정** — 실제 작업 곡(Crave)으로 검증하고 수작업 개입 횟수를 센다.
4. **타임박스 우선** — 1주. 완성도가 아니라 갭 목록이 1급 산출물.

### Decision Drivers (top 3)
1. 1인 유지보수 표면적 최소화 (오너 = 유일한 개발자·사용자)
2. 기존 자산 재사용 극대화 (get_track/chordProgressions/export_chord_midi가 셋업 데이터의 원천)
3. 소유 경계는 경험적으로 결정 (스파이크 갭 목록 = 다음 단계 백로그)

### Viable Options
**A. AbletonMCP(ahujasid 등 기성 MCP 서버) 우선 채택** ← 선택
- Pros: Claude Code에 즉시 연결, 트랙 생성/MIDI 클립/템포 지원 확인됨, 코드 0줄로 시작
- Cons: 프로젝트 상태 읽기 깊이·안정성 미검증, 외부 유지보수 리스크

**B. AbletonOSC + 자체 얇은 MCP 래퍼**
- Pros: Live Object Model 접근 범위 넓음, 세밀 제어
- Cons: 래퍼 개발이 "발명 금지" 원칙과 긴장, 1주 타임박스 잠식

**C. Max for Live 커스텀 디바이스**
- Pros: 최대 유연성
- Cons: 학습 곡선으로 1주 초과 확실 — 기각

판단 (Architect 합의 반영): **A·B 병렬 게이트** — Day 1에 양쪽 모두 "노트 삽입 + 귀 품질 판정"만 반나절씩 스파이크하고 승자로 진행. A 단독 선행은 최대 리스크(삽입 품질)를 Day 4에야 드러내 B 전환 시간이 부족해지는 순서 결함이 있었음. C는 기각(타임박스).

## Implementation Steps

### Day 0 — 안전장치 (선행 필수)
1. 백업 스크립트: 대상 .als를 `<프로젝트>/SongFlow Backup/<name>-<timestamp>.als`로 복사 (당초 `.songflow-backup`이었으나 숨김 폴더는 Finder에서 오너가 복원 불가 → 보이는 이름으로 변경, Day 1 학습) (Ableton 내부 `Backup/` 폴더와 경로 분리). 복사 전 **Live에서 강제 저장(또는 미저장 변경 경고)** 단계 포함 — 메모리/디스크 일치 보장
2. 백업→복원 라운드트립 1회 실검증 (Live에서 열어 확인)

### Day 1 — A·B 병렬 게이트 (최대 리스크 선검증)
3. **A(AbletonMCP)와 B(AbletonOSC) 양쪽에서 각 반나절씩 "코드 노트 삽입"만 스파이크**: 실제 코드 진행 1개를 노트 배열로 삽입하고 마디 배치/키/보이싱을 **귀로 품질 판정** (성공 bool이 아니라 품질까지 Day 1에 판정)
4. 공통 체크리스트: ① 프로젝트 상태 읽기(트랙/템포) ② 템포 설정 ③ 트랙 생성+이름 지정 ④ MIDI 클립 생성+노트 삽입+정확한 마디 배치(**repeat 반복·마디 오프셋 계산 검증 포함**) ⑤ 실패 시 에러 관찰 가능성 ⑥ **강제 저장(save) 명령 가용성** (Day 0 백업 선행 조건) ⑦ **Arrangement View 타임라인 클립 배치 + 로케이터(큐 포인트) 생성** ⑧ **Arrangement 오디오 익스포트 가용성** (불가 시 수동 바운스 1클릭 허용)
4-1. 후보군 확장(리서치 반영): ahujasid/ableton-mcp, uisato/ableton-mcp-extended, xiaolaa2/ableton-copilot-mcp(ableton-js 기반, Arrangement 명시 지원), nozomi-koborinai/ableton-osc-mcp — 문서 검토 후 유력 2개만 실측(반나절×2 타임박스 유지)
4-2. **Suno 업로드 스펙 확인**(병행, 30분): 오디오 업로드 길이 제한·플랜 조건 — 풀렝스 베드 vs 섹션 단위 업로드 판단
5. 게이트: 품질까지 통과한 승자로 Day 2 진행. 양쪽 다 미달이면 갭 보고서에 기록하고 스파이크 조기 종결 판단

### Day 2–3 — `ableton-setup` 스킬 작성
6. 새 Claude Code 스킬: 입력 = SongFlow 트랙명 → `get_track`으로 BPM/키/선택된 코드 진행/가사 섹션 구조(송폼) 조회 → 백업 실행 → 템포 설정 → 표준 트랙 구성 생성(Drums/Bass/Chords/Pads/Topline/Vocal — 오너 파이프라인 기준) → **Arrangement 타임라인에 송폼대로 배치**: 섹션 경계 로케이터 생성(Intro/Verse/Chorus...) + 섹션별 코드 클립·베이스 루트 초안(`perChord.bass`)·패드 서스테인 초안 배치. 섹션별 마디 수는 스킬 Q&A로 확인(레퍼런스 구조 기본값) → **코드 MIDI 배치는 단일 경로: `export_chord_midi` 응답의 `perChord` 노트 데이터 + `bars`/`barsPerChord`/`repeat`/`key` 파라미터를 함께 삽입 입력으로 사용해 LOM 직접 삽입** (mcp-server/src/server.ts:881, midi.ts:100). 주의: `perChord`는 진행 1회분 노트만 담고 마디 위치/노트 길이/반복 정보가 없으므로, 삽입자가 `barsPerChord`·`repeat`·시작 마디 오프셋을 재계산해야 함. .mid 파일 임포트는 폴백으로만 (파일 라이터와 라이브 삽입은 별개 아키텍처 — OR로 봉합하지 않음). 참고: export_chord_midi는 LOM 경로에서도 .mid 파일을 항상 디스크에 생성함(server.ts:870) — 무해하나 혼동 금지
7. 스킬 Q&A 원칙 준수(한 번에 한 질문, 기본값 확인 — 기존 메모리 규칙)

### Day 4 — 실전 검증
8. Crave 트랙으로 엔드투엔드 실행. 측정: 수작업 개입 횟수(목표 0), 소요 시간, 실패 지점

### Day 5 — 갭 보고서
9. `.omc/research/ableton-spike-gaps.md` 작성: 기성 조합으로 된 것 / 안 된 것(=SongFlow 소유 후보) / 다음 결정(확장·전환·중단)

## Acceptance Criteria
- [ ] "Crave 트랙 작업 시작" → 수작업 개입 0회로 Ableton 프로젝트가 작업 가능 상태 도달
- [ ] 코드 MIDI가 **정확한 마디/키/보이싱**으로 배치됨 (오너 귀 판정 — 단순 "삽입 성공"으로는 통과 불가)
- [ ] 조작 전 백업 자동 생성(.songflow-backup/, 강제 저장 선행) + 복원 실검증 1회 통과
- [ ] Day 1 A·B 병렬 게이트 결과(체크리스트 5항목 × 2도구 + 품질 판정)가 기록됨
- [ ] 갭 보고서에 소유 후보 목록과 다음 결정 포함
- [ ] Tauri 앱 코드 변경 0건 (동결 준수)

## Risks & Mitigations
| Risk | Mitigation |
|------|------------|
| AbletonMCP가 상태 읽기/MIDI 삽입에서 미성숙 | Day 1 A·B 병렬 게이트로 조기 판별 — 전환 시간 부족 문제 원천 제거 |
| Live 버전/Remote Script 호환 문제 | Day 1에 실제 사용 중 Live 버전으로만 검증 (가상 매트릭스 금지) |
| 코드 MIDI 배치 품질(보이싱/길이) 불만족 | 품질 판정을 Day 4→Day 1로 전진 배치. `result.perChord` 노트 데이터 단일 경로로 MVP-29 노트 테이블과 일치 보장 |
| Live 자동저장/미저장 변경으로 백업과 메모리 상태 괴리 | 백업 전 강제 저장 단계, 백업 경로를 Ableton `Backup/`과 분리(`.songflow-backup/`) |
| 스파이크가 1주를 넘김 | Day 5에 무조건 갭 보고서로 종결 — 미완이어도 학습을 산출물로 인정 |
| 백업 누락으로 프로젝트 손상 | 스킬 구조상 백업 단계를 첫 스텝으로 하드코딩, 스킬 외 수동 조작 시나리오는 범위 외 명시 |

## Verification Steps
1. Day 1 체크리스트(6항목 × A·B 2도구) 실행 로그 확인
2. Crave 엔드투엔드 실행을 오너가 직접 관찰(귀·눈 판정)
3. 백업 파일 존재 + Live에서 복원 오픈 확인
4. `git status`로 앱 코드 무변경 확인

## ADR

- **Decision**: 1주 타임박스 스파이크. Day 1에 AbletonMCP(A)·AbletonOSC(B)를 "코드 노트 삽입 + 귀 품질"로 병렬 게이트하고, 승자 위에 `ableton-setup` 스킬(백업 → 템포 → 트랙 구성 → perChord+bars/barsPerChord/repeat/key 기반 LOM 코드 MIDI 삽입)을 작성, Crave 실전 검증 후 갭 보고서로 종결.
- **Drivers**: ① 1인 유지보수 표면적 최소화 ② 기존 자산(get_track, export_chord_midi) 재사용 ③ 소유 경계의 경험적 결정.
- **Alternatives considered**: A 단독 선행(순서 결함 — 품질 리스크가 Day 4에야 노출, B 전환 시간 부족), B 우선(발명 금지 원칙과 긴장, 래퍼 개발이 타임박스 잠식), Max for Live(학습 곡선으로 1주 초과 — 기각).
- **Why chosen**: 최대 불확실성(라이브 노트 삽입 품질)을 Day 1로 전진 배치해 조기 신호를 확보하면서, 코드 작성은 승자 확정 후로 미뤄 발명 금지 원칙을 유지.
- **Consequences**: Day 1 부하 증가(반나절×2 선투자). A가 완승하면 소유 경계가 얇아질 수 있으나 그것 자체가 유효한 스파이크 결론("기성으로 충분")으로 인정.
- **Follow-ups**: 갭 보고서(`.omc/research/ableton-spike-gaps.md`) → 소유 후보 백로그화 → 다음 딥 인터뷰/플랜 사이클.

## Workflow Reorder (오너 결정, 2026-07-12 논의)
`ableton-setup`을 **Suno 이전**으로 이동: ① 재료 생성 → ② Ableton 셋업(송폼 타임라인+초안 MIDI) → ③ 바운스 → Suno 업로드(audioInfluence) → ④ 보컬/톱라인만 추출해 같은 프로젝트로. 근거: 키/BPM/송폼을 상류에서 확정해 key-snap 문제를 구조적으로 제거, 백킹 스템을 오너가 소유하므로 톱라인 추출이 깨끗해짐. 셋업 스킬의 입력은 ①의 데이터만이므로 순서 변경에 따른 의존성 문제 없음. 미검증: Suno 업로드 길이/플랜 제한(체크리스트 4-2), 베드 추종도(refine-suno 루프가 흡수), 익스포트 자동화(체크리스트 ⑧).

## Changelog (consensus 반영 이력)
- v2 (Architect): Day 1을 A·B 병렬 "노트 삽입+귀 품질" 게이트로 재구성 / perChord 단일 경로 명시 / 백업 경로 `.songflow-backup/` 분리 + 강제 저장 선행 / 수락 기준에 마디·키·보이싱 귀 판정 추가
- v3 (Critic): perChord의 타이밍 데이터 결손 명시 — `bars`/`barsPerChord`/`repeat`/`key` 결합 삽입 입력 + 삽입자 재계산 의무 / .mid 항상 생성 주석 / Day 1 체크리스트에 반복·오프셋 검증(④)과 save 명령 가용성(⑥) 추가
- v4 (오너 논의 반영): 워크플로우 재배열(셋업→Suno 순서) / 초안 확장(베이스 루트·패드 서스테인 — perChord 데이터로 결정론적) / 송폼 = Arrangement 로케이터+타임라인 배치(방법 2, 씬 방식 기각) / Day 1 체크리스트 ⑦⑧ + MCP 후보 4종 + Suno 업로드 스펙 확인(4-2) 추가 / 드럼 초안은 여전히 백로그(GroovePattern 스키마 선행)
