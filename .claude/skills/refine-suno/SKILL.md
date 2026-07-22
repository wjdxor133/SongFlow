---
name: refine-suno
description: Suno로 곡을 뽑아 들어본 뒤 "어디가 별로였는지"를 말하면, 증상을 레버(style/Suno 설정/가사/코드)에 매핑해 해당 트랙의 프롬프트·설정을 그 자리에서 갱신한다. "이 트랙 별로야 다시", "후렴이 약해", "보컬이 묻혀", "refine suno", "다시 뽑아줘" 같은 요청에 사용. reference-to-suno로 만든 트랙의 이터레이션 루프.
---

# refine-suno

`reference-to-suno`로 만든 트랙을 Suno에서 뽑아 들어본 뒤, **피드백(증상)으로 프롬프트·설정을 개선**한다. 사용자는 "뭐가 별로였는지"만 말하면 된다. 결과는 MCP로 트랙에 그대로 갱신된다(앱은 표시만). **트랙당 프롬프트는 1개 유지**(교체).

## 입력
- **어떤 트랙** (이름/링크/"방금 그거"). 모호하면 `list_albums`/`list_tracks`로 확인하거나 한 번 묻는다.
- **무엇이 별로였는지** (증상). 예: "후렴 약함", "벌스 보컬이 플럭에 안 맞음", "프리코러스 빌드업이 약해", "장르가 딴판".
- (선택) 들어본 Suno **링크/별점** — 주면 `save_suno_result`로 기록.

## 절차

### Step 1 — 현재 상태 읽기
`get_track`로 트랙의 현재 `prompts[0]`(style/lyrics), `sunoSettings`, `chordProgressions`, key/bpm를 읽는다. **바꿀 부분만 바꾸고 나머지는 보존**한다.

### Step 2 — 증상 → 레버 매핑
피드백을 아래로 변환한다 (해당되는 것만):

| 증상 | 조정 레버 |
|---|---|
| 보컬이 반주에 묻힘 | `styleInfluence` ↓ (예 65→50), style에 "vocal-forward, lead vocal up front, uncluttered backing" 강조 |
| 너무 밋밋·평범 | `weirdness` ↑ 살짝 (20→30~35), style에 텍스처/훅/필인 디테일 추가 |
| 너무 이상함·아티팩트 | `weirdness` ↓ (→10~15) |
| 장르·무드가 딴판 | style의 장르/프로덕션 키워드 교체, 필요시 `styleInfluence` ↑ |
| 섹션 다이내믹 약함(빌드업·대비) | style에 섹션별 지시(VERSE 인티메이트 / PRE-CHORUS build-up / CHORUS big anthemic) + 가사 섹션 태그에 연출 큐 `(build up)`, `(big, full energy)` 추가 |
| 후렴 약함 | style에 "big anthemic chorus, stacked vocal harmonies, wide, hook hitting hard" + `[Chorus] (big, anthemic, full energy)` |
| 멜로디가 밋밋·변화 없음·안 늘어남 | 다이내믹 지점의 섹션 태그에 멜로디 곡선 큐 부착: 빌드업 `[Build-up dynamics]`/`[Ascending progression]`, 정점 `[Vocal expansion]`, 후반 리프레시 `[Bridge modulation]`/`[Key shift cue]`/`[Half-step change]`, 훅 변형 `[Varied repetition]`/`[Motif transformation]`. 후렴 반복 태그·가사는 동일 유지(멜로디 반복 유도) |
| 추임새·애드립 거슬림(oh/yeah/whoa, 숨소리, 런) | 3중 압박: `excludeStyles`에 `ad-libs, breaths, runs, riffs, vocal chops, background vocals` 추가 + style에 `one clean lead, only the written lyrics, no ad-libs, no runs` + `weirdness` ↓(→10~15). 그래도 남으면 DAW에서 해당 구간 컷 안내 |
| 치찰음(sibilance)·거친 자음 쏨 | style에 `warm vocal tone, smooth consonants, no harsh sibilance` 추가 + 과도한 `bright/crisp/airy` 키워드 제거. **프롬프트로는 완화만** — 완전 제거는 바운스 후 DAW 디에서(여성 6-8kHz / 남성 5-7kHz, 4-7dB)로 마무리 안내 |
| AI 티 남·부자연스러움 | style에 네거티브 구문 `dry vocal, natural voice, one clean lead, no autotune, no pitch correction` + `excludeStyles`에 `autotune, pitch correction` + `weirdness`/`styleInfluence` 과하지 않게 |
| 보컬 성별/캐릭터 어긋남 | style에 산문으로(`clear female lead vocal`) + 가사 `[Vocals: …]` 태그로 지정. Suno UI Male/Female 버튼은 쓰지 않도록 안내(하드락→멜로디 표현력 저하) |
| 특정 악기 보컬과 안 맞음 | style에 "vocal locks to the <악기> rhythm" 식으로 명시 |
| 멜로디·플로우 어색 | 가사 음절/섹션 미세 조정 — **단, 원곡 음절 일치를 유지**(줄별 음절 수 재검산) |
| 코드 느낌 안 맞음 | `save_chord_progressions`로 진행 교체/추가 |

> style은 **영어 클린**으로 유지(바로 복붙). 설정값·한국어를 style에 섞지 않는다. 섹션 연출 큐는 가사의 `[...]` 태그에만 (브래킷은 가창되지 않는 구조/메타).

### Step 3 — 갱신 (MCP)
- **프롬프트 교체**: `save_agent_response { trackId, task:"generate_suno_prompts", rawText:"{\"style\":\"<개선 style>\",\"lyrics\":\"<유지/조정 가사>\"}" }` — 서버가 기존 프롬프트를 교체해 1개만 유지.
- **설정 갱신**: `save_suno_settings { trackId, weirdness, styleInfluence, audioInfluence?, excludeStyles? }` (excludeStyles = Suno Exclude Styles에 넣을 쉼표구분 회피 목록).
- **코드 변경 시**: `save_chord_progressions { trackId, progressions:[…] }`.
- (선택) 들어본 버전 기록: `save_suno_result { trackId, url, rating, memo }` (memo에 약했던 점).

### Step 4 — 요약
바꾼 것을 **증상 → 변경** 표로 보여주고, 새 Suno 설정값을 안내. "앱 리로드 후 PromptLab에서 복사해 다시 생성하세요"로 마무리.

## 원칙
- **바뀔 것만 바꾼다** — 잘 됐던 부분(키/BPM/잘 맞은 가사/장르)은 보존.
- 음절 일치는 가사를 건드릴 때만, 건드리면 반드시 재검산.
- 트랙당 프롬프트 1개(교체). 비교가 필요하면 들어본 버전을 `save_suno_result`로 로그.
- 한 번에 과하게 바꾸지 않는다(레버 1~3개) — 무엇이 효과였는지 추적 가능하게.
