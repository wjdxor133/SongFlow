---
name: reference-to-suno
description: 레퍼런스 곡 하나로 Suno에 바로 쓸 트랙을 만든다. 질의문답으로 (1) 어떤 곡 (2) 원곡 가사 (3) 컨셉·언어를 차례로 묻고, C키 변환·Suno 프롬프트·송폼별 음절 일치 가사·코드 진행·Suno 설정을 만들어 MCP로 SongFlow에 기록한다. "레퍼런스로 Suno 준비", "이 곡으로 곡 만들어줘", "suno 준비"에 사용.
---

# reference-to-suno

레퍼런스 곡을 질의문답으로 받아 **Suno에 바로 붙여넣을 트랙**을 SongFlow에 만든다. 사용자는 결과(프롬프트+가사)를 복사해 Suno에 붙이기만 하면 된다. 모든 결과는 MCP 툴(`songflow`)로 기록하고 앱은 표시만 한다 — **앱 코드는 건드리지 않는다.**

## 질의문답 (한 번에 하나씩)

**Q1 "어떤 노래인가요?"** ("아티스트 - 제목", 링크 가능)
답을 받으면 되묻지 않고 웹으로 자동 처리한다:
- `WebSearch`로 곡 확정(동명이곡이면 후보 한 번 확인), `WebSearch`+`WebFetch`로 Key/BPM 조회(tunebat 등, 커뮤니티 추정치 → Claude 지식과 교차검토), 장르/무드/프로덕션 느낌 정리.
- **C키 변환**: 장조→C major / 단조→C minor (변환 반음 수 명시, 이미 C면 0). **BPM은 유지.**

**Q2 "원곡 가사를 붙여넣어 주세요."** (가사 전문은 웹 자동추출이 막혀 직접 받는다)
- 섹션 라벨이 있으면 사용, 없으면 송폼으로 나눈다. **줄별 음절 수**를 센다(한국어=글자 수, 영어=발음 음절).

**Q3 "어떤 컨셉·언어로?"** (예: "강렬한 첫만남, 영어")

## 생성 & 기록

**1. 음절 일치 가사** — Q2의 줄별 음절 수를 정확히 맞춰 Q3 컨셉/언어로 작성. 섹션 구조·후렴 위치 보존, 상징적 훅(예: "Oh my my")은 살려도 됨. **생성 후 줄별 음절 수 재검산.**

**2. Suno style 텍스트** — **영어로만, 깨끗하게**(바로 복붙용). 장르/무드/프로덕션 + BPM + C키 + 보컬 스타일 한 문단. 보컬 선명도 위해 "clear lead vocal, vocal-forward mix, uncluttered verses" 류 포함. ⚠️ **설정값·한국어를 style에 섞지 않는다** (설정은 아래 4번 `save_suno_settings`로 따로 기록).

**3. MCP 기록 (순서대로)**
1. `list_albums` → 적절한 앨범 없으면 `create_album { title, genre, concept }`
2. `create_track { albumId, title, genre, bpm, key:"C major|C minor", concept, lyrics }` → `trackId`
   - `concept` 필수(비우면 앱 Concept 빈칸)
3. `save_reference_brief { trackId, artist, songTitle, summary, genreTags, moodTags, productionTraits, confidence, disclaimer }`
4. `save_agent_response { trackId, task:"generate_suno_prompts", rawText }`
   - `rawText`는 **`{"style":"<영어 클린>","lyrics":"<섹션 태그 부착>"}` JSON 문자열**. 트랙당 프롬프트는 1개만 유지됨(서버가 기존 프롬프트를 교체).
5. `save_suno_settings { trackId, weirdness, styleInfluence, audioInfluence?, expectedStyle }` — 보컬 선명도 우선 기본값(곡 성격에 ±):
   - `weirdness` 10~25 (낮을수록 보컬 안정), `styleInfluence` 50~65 (과하면 반주가 보컬을 덮음), `audioInfluence` 생략=Off(프롬프트+가사만), 오디오 업로드 시 40~55.
   - `expectedStyle`: **영어 한 줄** 예상(예: "Bright summer Afrobeat pop with a clear airy female lead up front").
6. `save_chord_progressions { trackId, progressions:[{name, chords, key:"C", mode, bpm}, …] }` — C키에 맞는 코드 진행 5개를 생성해 한 번에 삽입(chords는 C 기준 표기).

**4. 마무리** — 앨범/트랙명·`trackId`, 음절 일치 스폿체크 표, Suno 설정값을 안내. Key/BPM은 추정치임을 한 줄로 명시.

## 원칙
- 질의문답은 한 번에 하나씩. 곡 식별·Key/BPM/느낌은 Q1 후 자동 처리.
- 음절 일치가 핵심 — 반드시 재검산.
- style은 영어 클린(복붙용), 설정값은 `save_suno_settings`로 분리.
- 산출물은 MCP로만 기록(데이터 파일 직접 편집 금지).
- 화성학/이론 학습은 범위 밖(별도 스킬).
