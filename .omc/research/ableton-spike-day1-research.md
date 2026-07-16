# 스파이크 Day 1 사전 조사 결과 (2026-07-12)

## A. MCP 후보 4종 문서 검토 → 실측 대상 2종 확정

| 항목 | ahujasid/ableton-mcp | uisato/extended | xiaolaa2/copilot | nozomi/osc-mcp |
|---|---|---|---|---|
| ①상태 읽기 ②템포 ③트랙 생성 ④노트 삽입 | 지원 | 지원 | 지원 | 지원 |
| ⑤ 에러 관찰성 | 불명 | 불명 | 불명 | 불명 |
| ⑥ Live 저장 명령 | ✗ | ✗ | ✗ | ✗ |
| ⑦ Arrangement 배치 | **지원(유일)** / 로케이터 ✗ | 로드맵만 | ✗ | ✗ |
| ⑧ 오디오 익스포트 | ✗ | ✗ | ✗ | ✗ |
| 스택/규모 | Python, 2.8k★, 활발 | Python, 234★ | TS(ableton-js), 89★ | Go, 8★ |

**실측 확정: A = ahujasid/ableton-mcp (Arrangement 유일 지원), B = uisato/ableton-mcp-extended (노트 편집 정밀도 최고)**

### 전원 미지원 3개 항목 → 갭 후보 선등록
1. **Live 저장(⑥)**: 어느 서버도 미구현. 우회 = AppleScript(⌘S 키스트로크) → `scripts/ableton-save.sh` 준비, Day 1 실측
2. **로케이터(⑦ 일부)**: 전원 미구현. 임시안 = 섹션명을 클립 이름으로 사용, 로케이터는 수동. **SongFlow 소유 1호 후보** (LOM `cue_points`는 존재하므로 Remote Script 확장 가능)
3. **오디오 익스포트(⑧)**: 전원 미구현. 계획대로 수동 바운스 1클릭 수용

## B. Suno 업로드 스펙 (2026-07 기준)

- **Add Vocals 기능(Pro $8+/Premier)이 우리 유스케이스 그 자체**: 업로드한 인스트루멘털 위에 보컬 레이어, **Audio Strength 슬라이더**로 베드 보존도 제어
- 업로드 한도: Free 8분 / Pro·Premier 30분 → 풀렝스 베드 문제없음, 섹션 분할 불필요
- 검증된 루프: Ableton 베드 익스포트 → 업로드 → Add Vocals(가사+스타일, Strength 최대) → **보컬 스템 분리 추출**(Pro 2종/Premier 3종) → Ableton 원본 세션에 재합성
- 주의 1: 완전 비파괴 보존은 아님(Suno가 재렌더링) — 보존도는 실측 필요
- 주의 2: **오디오 핑거프린팅** — 배포 이력 있는 트랙·상용 샘플 루프 포함 베드는 차단 위험. 우리 베드(자작 MIDI 신스)는 저위험. **바운스 베드에 Splice 샘플 넣지 말 것** (업로드용 베드는 MIDI 파트만)
- refine-suno 스킬에 Audio Strength 레버 추가 필요 (기존 audioInfluence 매핑 확인)

## 계획 영향
- Day 1 실측은 A·B 2종으로 확정 (계획 4-1 이행 완료)
- 체크리스트 ⑥⑦⑧의 "미지원" 사전 확인됨 — Day 1은 ①~⑤ 실측 + AppleScript 저장 우회 검증에 집중
- 갭 보고서에 위 3개 항목 선등록 (스파이크 종료 전이지만 증거 확보됨)

Sources: [ahujasid/ableton-mcp](https://github.com/ahujasid/ableton-mcp) · [ableton-mcp-extended](https://github.com/uisato/ableton-mcp-extended) · [Suno Audio Uploads](https://help.suno.com/en/articles/6141569) · [Add Vocals](https://help.suno.com/en/articles/6882817) · [Suno Pricing](https://suno.com/pricing)
