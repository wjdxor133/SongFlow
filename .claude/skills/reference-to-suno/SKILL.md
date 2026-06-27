---
name: reference-to-suno
description: 레퍼런스 곡 하나로 Suno에 바로 쓸 트랙을 만든다. 질의문답으로 (1) 어떤 곡인지 (2) 원곡 가사 (3) 컨셉·언어를 차례로 묻고, C키 변환·Suno 스타일 프롬프트·송폼별 음절 일치 가사를 만들어 MCP로 SongFlow에 기록해 화면에 띄운다. "레퍼런스로 Suno 준비", "이 곡으로 곡 만들어줘", "suno 준비" 같은 요청에 사용.
---

# reference-to-suno

레퍼런스 곡 하나를 **질의문답**으로 받아, **Suno에 바로 붙여넣을 수 있는 트랙**을 SongFlow에 만든다.
사용자는 결과(프롬프트 + 가사)를 복사해 Suno에 붙이기만 하면 된다.

SongFlow MCP 서버(`songflow`)가 연결돼 있다고 가정한다. 모든 결과는 MCP 툴로 기록되며,
앱(TrackDetail/PromptLab)이 그 데이터를 그대로 화면에 표시한다. **앱 코드는 건드리지 않는다.**

산출물(새 트랙 1개): ① Key/BPM + C키 변환 ② 느낌 분석(Reference Brief) ③ Suno 스타일 프롬프트
④ 레퍼런스 송폼(verse/pre/chorus…)별 **음절 수가 동일한** 새 가사.

---

## 질의문답 플로우 (한 번에 하나씩 묻는다)

### Q1 — "어떤 노래인가요?"
사용자에게 레퍼런스 곡을 묻는다 ("아티스트 - 제목", 링크도 가능).
답을 받으면 곧바로 **웹으로 곡을 식별하고 Key/BPM/느낌을 수집**한다 (사용자에게 다시 묻지 않는다):
- `WebSearch`로 아티스트/제목/앨범/연도 확정. 동명이곡이면 후보를 제시해 한 번 확인.
- `WebSearch` + `WebFetch`로 Key/BPM 조회(tunebat, songbpm 등). 웹 값은 **커뮤니티 추정치**임을 인지하고 Claude 음악 지식과 교차검토.
- 장르/무드/프로덕션 특징을 정리(느낌 분석).
- **C키 변환**: 장조→C major / 단조→C minor. 변환 반음 수를 계산해 명시(원곡이 이미 C면 0반음). **BPM은 그대로 유지.**

> 참고: 가사 전문은 저작권 가드레일로 웹 자동 추출이 거의 막힌다. 그래서 가사는 Q2에서 직접 받는다.

### Q2 — "원곡 가사를 붙여넣어 주세요."
사용자가 원곡 가사를 붙여넣게 한다 (음절 일치의 기준).
- 섹션 라벨(Verse/Pre-Chorus/Chorus/Bridge 등)이 있으면 그대로 사용, 없으면 스킬이 송폼으로 나눈다.
- **각 줄의 음절 수**를 센다. 한국어는 글자 수 ≈ 음절 수, 영어는 발음 음절 기준.
- 섹션별·줄별 음절 카운트 표를 내부적으로 만든다 (음절 일치의 핵심).

### Q3 — "어떤 느낌/컨셉으로, 어떤 언어로 갈까요?"
새 가사의 **컨셉(주제·분위기)과 언어**를 묻는다 (예: "여름 짝사랑, 한국어" / "강렬한 첫만남, 영어").

---

## 생성 & 기록 (Q1~Q3 확보 후)

### Step A — 음절 일치 새 가사 생성
- Q2의 섹션별·줄별 음절 카운트를 **정확히** 맞춘다 (줄마다 동일 음절 수).
- Q3의 컨셉/언어로 작성. 섹션 구조·반복 후렴 위치·가능하면 운율/강세도 보존. 상징적 영어 훅(예: "Oh my my")은 그대로 살려도 됨.
- 생성 후 **각 줄 음절 수를 재검산**해 원곡과 일치하는지 검증하고, 어긋나면 고친다.

### Step B — Suno 스타일 프롬프트 + 생성 설정
- **Style 텍스트**: 장르/무드/프로덕션 특징 + BPM + 작업 키(C) + 보컬 스타일을 한 문단으로.
  보컬이 깨끗하게 나오도록 "clear lead vocal, vocal-forward mix, articulate, minimal vocal fx, uncluttered verses" 류 표현을 포함한다.
- **가사**: `[Verse]`, `[Pre-Chorus]`, `[Chorus]` 등 Suno 섹션 태그를 붙여 정리.
- **권장 생성 설정** (보컬 선명도 우선 기본값 — 곡 성격에 따라 ±조정):
  - **Weirdness**: 낮게 (10~25%). 낮을수록 예측 가능·아티팩트 적고 보컬이 안정적.
  - **Style Influence**: 중간 (50~65%). 스타일은 따르되 과하면 반주가 보컬을 덮으므로 적당히.
  - **Audio Influence**: 오디오 레퍼런스를 업로드할 때만 의미. 업로드 시 40~55%, 프롬프트+가사만이면 해당 없음(off).
  - **Expected style**: 한 줄로 "이렇게 나올 것" 예상(예: "여름 청량 Afrobeat 팝, 에어리한 여성 리드 보컬이 또렷하게 앞에"). 보컬 순도가 목표면 verse를 비우고 chorus에서 레이어를 올리도록 style에 명시.

### Step C — MCP 기록 (songflow), 순서대로
1. **앨범 확보**: `list_albums`로 적절한 앨범이 있으면 사용, 없으면 `create_album`
   `{ title: "<아티스트> 레퍼런스", genre, concept }`.
2. **트랙 생성**: `create_track`
   `{ albumId, title, genre, bpm: <원곡 BPM 숫자>, key: "C major|C minor", concept: "<이 곡의 컨셉 한두 문장 — Q3의 주제/분위기 + 레퍼런스 느낌>", lyrics: "<생성 가사>" }` → `trackId` 확보.
   ⚠️ `concept`을 반드시 채운다 (비우면 앱 Concept 필드가 빈다).
3. **레퍼런스 브리프**: `save_reference_brief`
   `{ trackId, artist, songTitle, summary, genreTags, moodTags, productionTraits, confidence, disclaimer }`.
4. **트랙 플랜**: `save_track_plan`
   `{ trackId, title, directionSummary, bpmSuggestions:[bpm], keySuggestions:["C ..."], beginnerExplanation, confidence }`.
5. **Suno 프롬프트**: `save_agent_response`
   `{ trackId, task: "generate_suno_prompts", rawText: "{\"style\":\"...\",\"lyrics\":\"...\"}" }`
   ⚠️ `rawText`는 **반드시 `{ "style": "...", "lyrics": "..." }` JSON 문자열** — 그래야 서버가 파싱해 PromptLab(track.prompts)에 자동 등록한다.
6. **코드 진행 자동 삽입**: `save_chord_progressions`
   `{ trackId, progressions: [ { name, chords: ["Cm","Ab","Eb","Bb"], key: "C", mode: "minor", bpm } , … ] }`
   - 작업 키(C major/minor)에 맞는 **코드 진행 5개 정도**를 생성해 한 번에 넣는다 (레퍼런스 무드/장르에 어울리는 진행). 사용자가 따로 "생성" 누를 필요 없이 트랙에 바로 들어간다.
   - chords는 C 기준 표기(예: 단조면 Cm, Ab, Eb, Bb, Fm, G 등). mode/key는 작업 키와 일치.

### Step D — 마무리 출력
- 생성된 앨범/트랙 이름·`trackId`를 알리고, 음절 일치 스폿체크 표를 보여준다.
- **권장 Suno 설정(Weirdness/Style Influence/Audio Influence)과 expected style를 함께 안내**한다.
- "앱에서 트랙을 열면 가사 탭/PromptLab에 결과가 있습니다. 복사해 Suno에 붙여넣으세요." 안내.
- Key/BPM은 추정치, 가사 음절은 원곡 기준으로 맞췄음을 한 줄로 명시.

> 권장 설정은 `save_track_plan`의 `beginnerExplanation` 또는 Suno style 텍스트 끝에 "Suno settings: Weirdness 20% · Style 60% · Audio off" 형태로 함께 기록해 앱에서도 보이게 한다.

---

## 원칙
- **질의문답은 한 번에 하나씩** (곡 → 가사 → 컨셉/언어). 곡 식별·Key/BPM/느낌은 Q1 답을 받고 스킬이 자동 처리(되묻지 않음).
- 음절 일치는 이 스킬의 핵심 가치 — 생성 후 반드시 재검산.
- 모든 산출물은 MCP로 기록(앱은 표시만). 데이터 파일을 직접 건드리지 않는다.
- 화성학/이론 학습은 **이 스킬 범위 밖**(별도 스킬).
