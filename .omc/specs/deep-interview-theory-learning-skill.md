# Deep Interview Spec: 화성학/이론 학습 스킬 (theory-coach)

## Metadata
- Interview ID: di-theory-learning-skill
- Rounds: 4 (+ Round 0 topology)
- Final Ambiguity Score: ~15%
- Type: brownfield
- Generated: 2026-06-28
- Threshold: 0.2
- Threshold Source: default
- Status: PASSED

## Clarity Breakdown
| Dimension | Score | Weight | Weighted |
|-----------|-------|--------|----------|
| Goal | 0.90 | 0.35 | 0.32 |
| Constraints | 0.80 | 0.25 | 0.20 |
| Success Criteria | 0.85 | 0.25 | 0.21 |
| Context | 0.80 | 0.15 | 0.12 |
| **Ambiguity** | | | **~0.15** |

## Topology
| Component | Status | Description | Coverage |
|-----------|--------|-------------|----------|
| A. 학습 방식 | active | 어떻게 가르치나 | 혼합: 작업 중 질문(just-in-time) + 가끔 미니레슨 |
| B. 트랙 연계 | active | 무엇을 교재로 | 개념(일반)→내 트랙 실제 데이터 적용 |
| C. 진도/기억 | deferred | 저장·복습·진도 | 사용자 확인 deferral — 순수 대화형, 저장 안 함 |

## Goal
음악 비전공·작곡 초보(Claude Code+MCP로 SongFlow 작업)가 **효율적으로** 화성학/이론을 익히도록 돕는 Claude Code 스킬을 만든다.

- **혼합 학습**: 평소엔 작업 중 떠오른 질문에 그 자리에서 답(just-in-time), 가끔 관련 개념을 짧은 미니레슨으로 묶어 설명.
- **개념 → 내 곡 적용**: 일반 이론 개념을 짧게 설명한 뒤, MCP로 현재 트랙을 읽어 "네 곡에선 이렇게 쓰였다"로 연결 (예: "이 트랙은 C minor, Cm–Ab–Eb–Bb — Ab가 밝게 들리는 이유는…").
- **능동 마무리**: 각 학습 비트 끝에 ① 짧은 **확인 질문 1개**(능동 회상) + ② **적용 제안**(배운 걸 트랙 결정/`refine-suno`로 연결).
- **순수 대화형**: 아무것도 저장하지 않는다. MCP는 **읽기 전용**(트랙 데이터 참조)으로만 사용.

## Constraints
- 단일 Claude Code 스킬. 호출 시 학습 대화 진행.
- MCP: `get_track`/`get_album` 등 **읽기만**. `save_*` 호출 안 함(저장/진도 기록 없음).
- 비전공자 눈높이: 전문용어는 풀어서, 예시는 구체적으로. 한 번에 한 개념(과부하 금지).
- 작업 흐름을 끊지 않게: 질문 답변은 짧고, 미니레슨은 "원하면 더"로 점진 확장.

## Non-Goals
- 진도/완료 추적, 복습 스케줄, LearningMission 저장 (C — deferred).
- 정식 커리큘럼/시험.
- 악보·MIDI 생성.

## Acceptance Criteria
- [ ] 스킬 호출 후, 작업 중 떠오른 이론 질문에 비전공자 눈높이로 짧게 답한다.
- [ ] 답/미니레슨이 **일반 개념 → 현재 트랙 실제 데이터 적용**의 2단 구조를 가진다 (MCP로 트랙 읽어 반영).
- [ ] 각 학습 비트 끝에 **확인 질문 1개 + 적용 제안 1개**가 붙는다.
- [ ] 스킬이 어떤 데이터도 저장하지 않는다(읽기 전용).
- [ ] 미니레슨은 한 번에 한 개념, "더 깊이?" 식으로 점진 확장.

## Assumptions Exposed & Resolved
| Assumption | Challenge | Resolution |
|------------|-----------|------------|
| 학습=강의 들어야 함 | 작업 흐름엔 just-in-time이 더 맞지 않나 | 혼합(질문 우선 + 가끔 미니레슨) |
| 일반 이론이면 됨 | 내 곡과 연결돼야 와닿지 않나 | 개념→내 트랙 적용 2단 |
| 진도 저장 필요 | 초보엔 부담 아닌가 | 순수 대화형, 저장 안 함 |
| 설명만으로 충분 | 능동 회상/적용 없이 남나 | 확인 질문 + 적용 제안으로 마무리 |

## Technical Context (brownfield)
- 기존 학습 인프라: `LearningMission` 타입(category: harmony/drums/bass/topline/sound_design/arrangement/suno_prompt) + `save_learning_missions`/`get_learning_missions`/`update_learning_mission` MCP 툴. **이번 스킬은 저장을 안 하므로 이 쓰기 툴들은 사용하지 않음** (C deferred). 향후 진도관리 도입 시 재사용 가능.
- 트랙 데이터: `get_track`로 key/bpm/chordProgressions/sunoSettings/referenceBriefs 읽어 학습 맥락에 활용.
- 연계 스킬: 적용 제안 시 `refine-suno`(편곡/프롬프트 조정)나 트랙 편집으로 자연 연결.
- 스킬 경로: `.claude/skills/theory-coach/SKILL.md` (reference-to-suno·refine-suno와 동일 규약).

## Ontology (Key Entities)
| Entity | Type | Fields | Relationships |
|--------|------|--------|---------------|
| Theory Coach Skill | core | mode(just-in-time/mini-lesson) | reads Track, ends with Check+Apply |
| Concept | core | name, plain explanation, example | applied to Track |
| Track (read-only) | external | key, bpm, chords, brief | source of "내 곡 적용" |
| Check Question | supporting | recall prompt | ends each beat |
| Application Suggestion | supporting | track decision / refine-suno link | ends each beat |

## Ontology Convergence
| Round | Entities | Stability |
|-------|----------|-----------|
| 1 | 4 | N/A |
| 2 | 5 | ~80% |
| 3 | 5 | 100% |
| 4 | 5 | 100% |

## Interview Transcript
<details><summary>Round 0 + 4 rounds</summary>

- R0 Topology: A+B만 (C 진도관리 deferred)
- R1 (A/Goal): 혼합 (질문 + 미니레슨)
- R2 (B/Goal): 둘 다 (개념→내 곡 적용)
- R3 (B/Constraints): 순수 대화형 (저장 X)
- R4 (Criteria, Contrarian): 확인 질문 + 적용 제안 둘 다
</details>
