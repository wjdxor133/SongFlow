---
name: reference-to-suno
description: 레퍼런스 곡 하나로 Suno에 바로 쓸 트랙을 만든다. 질의문답으로 (1) 어떤 곡 (2) 작업 키 (3) 원곡 가사 (4) 컨셉·언어를 묻고, Suno 프롬프트·송폼별 음절 일치 가사·코드 진행·Suno 설정을 만들어 MCP로 SongFlow에 기록한다. "레퍼런스로 Suno 준비", "이 곡으로 곡 만들어줘", "suno 준비"에 사용.
---

# reference-to-suno

레퍼런스 곡을 질의문답으로 받아 **Suno에 바로 붙여넣을 트랙**을 SongFlow에 만든다. 사용자는 결과(프롬프트+가사)를 복사해 Suno에 붙이기만 하면 된다. 모든 결과는 MCP 툴(`songflow`)로 기록하고 앱은 표시만 한다 — **앱 코드는 건드리지 않는다.**

## 질의문답 (한 번에 하나씩)

**Q1 "어떤 노래인가요?"** ("아티스트 - 제목", 링크 가능)
답을 받으면 되묻지 않고 웹으로 자동 처리: `WebSearch`로 곡 확정(동명이곡이면 후보 한 번 확인), `WebSearch`+`WebFetch`로 Key/BPM 조회(tunebat 등, 커뮤니티 추정치 → Claude 지식과 교차검토), 장르/무드/프로덕션 느낌 정리.

**Q2 "작업 키가 뭔가요? (특히 장조/단조)"** ⚠️ **1순위 — 키 미스매치가 어둡고 안 맞음의 최대 원인.**
- **이미 만든 inst/DAW가 있으면 그 키에 반드시 맞춘다** (Suno도 그 키로). 사용자가 모르면 DAW 상단 확인 요청.
- **major/minor가 곡 분위기를 좌우**한다 — minor=어두움, major=밝음. 밝은 설렘 곡이면 major. 레퍼런스가 minor라도 사용자 곡이 major면 **major로**.
- BPM은 레퍼런스 값 유지(사용자 inst와 다르면 inst에 맞춤).

**Q3 "원곡 가사"** — 붙여넣기 요청 전에 먼저 **자동 추출을 시도**한다:
- **가사 자동 추출**: `insane-search` 스킬로 가사 사이트를 뚫는다. WAF/CAPTCHA(letras·genius·bugs·melon 등)가 흔하지만 **Jina Reader**(`curl -s "https://r.jina.ai/<가사URL>"`)나 engine(`python3 -m engine <URL>`)으로 종종 관통된다. genius가 막히면 letras.com/namu.wiki/벅스 등 다른 소스로 폴백. 여러 소스 병렬 시도.
- 추출 성공 시 사용자에게 섹션 구조로 정리해 **확인만** 받는다(재붙여넣기 불필요). 전 소스 실패 시에만 "원곡 가사를 붙여넣어 주세요"로 수동 요청.
- 섹션 라벨 있으면 사용, 없으면 송폼으로 나눔. **줄별 음절 수**를 센다(한국어=글자 수, 영어=발음 음절).

**Q4 "어떤 컨셉·언어로?"** (예: "강렬한 첫만남, 영어")

## 생성 & 기록

**1. 음절 일치 가사** — Q3 줄별 음절 수에 맞춰 Q4 컨셉/언어로 작성. 섹션 구조·후렴 위치 보존. **생성 후 줄별 음절 수 재검산.**
- **멜로디가 사는 가사**: 한 단어(예: "high")를 과반복하면 멜로디가 납작해진다 → **짧은 훅 + 아치형으로 흐르는 라인**을 섞고, 늘여 부르는 음(줄 끝/훅)엔 **열린 모음**(you/stay/way/high/oh).
- **멜로디 곡선 메타태그**(다이내믹이 바뀌는 섹션 태그에 선택적으로 부착): `[Ascending progression]`·`[Build-up dynamics]`(빌드업), `[Descending melody]`(릴리스), `[Bridge modulation]`·`[Half-step change]`·`[Key shift cue]`(브릿지 전조로 후반 리프레시), `[Vocal expansion]`(음역 확장), `[Varied repetition]`·`[Motif transformation]`(훅 변형으로 지루함 방지). 브래킷은 가창되지 않는 구조/메타 큐다.
- **DAW 정렬**: inst가 있으면 섹션 줄 수를 마디 맵에 맞춘다(8마디≈4~8줄, 빌드/브레이크 고려). 단 Suno는 정확한 마디로 안 떨어지니 최종 타이밍은 DAW 컴핑.

**2. Suno style 텍스트** — **영어, 간결하게**: ~500자 키워드 나열 (Suno 1000자 제한; **긴 산문 금지**). 장르/무드/프로덕션 + BPM + 키 + 아래 [보컬 원칙]을 키워드로. **핵심 스타일 태그 5~8개 유지**(4개 미만은 밋밋, 10개 초과는 뒤쪽 태그가 무시됨). ⚠️ 설정값·한국어를 style에 섞지 않음(설정은 5번 분리).
   - **보컬 성별**은 style에 키워드로(예: `clear female lead vocal`), 캐릭터 큐는 가사의 `[Vocals: …]` 태그로. Suno UI의 Male/Female 버튼은 쓰지 않는다(버튼은 보컬 처리에 하드락을 걸어 멜로디 표현력·자연스러움을 떨어뜨린다).

**3~6. MCP 기록 (순서대로)**
1. `list_albums` → 없으면 `create_album { title, genre, concept }`
2. `create_track { albumId, title, genre, bpm, key, concept, lyrics }` → `trackId` (`concept` 필수)
3. `save_reference_brief { trackId, artist, songTitle, summary, genreTags, moodTags, productionTraits, confidence, disclaimer }`
4. `save_agent_response { trackId, task:"generate_suno_prompts", rawText:"{\"style\":\"...\",\"lyrics\":\"...\"}" }` — 트랙당 프롬프트 1개 유지(서버가 교체)
5. `save_suno_settings { trackId, weirdness, styleInfluence, audioInfluence?, expectedStyle }` (영어 expected 한 줄)
6. `save_chord_progressions { trackId, progressions:[{name, chords, key, mode, bpm}, …] }` — 작업 키에 맞는 진행 5개
7. `save_sound_keywords { trackId, drums, bass, melody, harmony, fx, vocal }` — 파트별 **샘플 검색 키워드**(Splice 등). 레퍼런스 프로덕션 특성에서 도출한 실제 검색어를 파트별 3~6개씩, 작업 키·BPM을 녹여 정확도를 높인다. 예: `drums:["pop rock drums 112","punchy live drums"]`, `harmony:["funk guitar loop Am","clean electric guitar"]`, `fx:["riser","vinyl foley"]`. 해당 없는 파트는 빈 배열.

**8. DAW 표기 + MIDI (코드 진행마다 항상 포함)** — 코드 심볼만으로는 DAW에 못 찍으니, **선택/기본 진행**에 대해 근음·보이싱·MIDI 번호를 표로 보여준다(옥타브 기준: 미들 C = C4 / MIDI 60 명시). 그다음 `.mid` 파일을 뽑는다:
```
mkdir -p exports
python3 .claude/skills/reference-to-suno/chords-to-midi.py \
  --key <작업키> --bpm <bpm> --repeat 2 \
  --out exports/<트랙명>_<진행>_<bpm>bpm.mid <코드…>
```
- 스크립트가 Bass 트랙(근음, 옥타브 2) + Chords 트랙(쌓기, 옥타브 3) 2트랙 .mid를 만들고, 코드별 MIDI 노트를 출력한다. triad/7th/sus/dim/슬래시 코드 지원.
- 드리미·R&B 계열이면 7th 변형도 한 벌 더 뽑아 제시.
- 결과 파일 경로를 사용자에게 안내(DAW에 드래그). 음성 진행(voice leading) 팁은 표 아래 한두 줄로.

**9. 마무리** — 앨범/트랙명·`trackId`, 음절 스폿체크, Suno 설정값, 샘플 검색 키워드, **DAW 표기 표 + .mid 경로**를 안내. Key/BPM은 추정치임을 한 줄로 명시.

## 보컬·생성 원칙 (실전 학습 — style/설정에 반영)
- **자연스러움 > 파워**: 억지 belting은 **AI 티**가 난다. 에너지는 **리듬·그루브·아티큘레이션**(펀치·바운시·싱코페이션)에서, 볼륨에서가 아니라.
- **보컬은 돋보이게 + 밝은 고음역**으로 (음이 낮으면 처진다). 매끄럽게(smooth/legato) 늘이면 처지니 **또박또박 끊어** 부르게.
- **추임새 금지**: style에 "one clean lead, only the written lyrics, no ad-libs/breaths/runs" 명시 + `weirdness` 낮게. 남으면 DAW 컷.
- **Weirdness 트레이드오프**: 높이면 멜로디 독특·표현↑ **이자 추임새↑**; 낮추면 클린·이자 밋밋. 기본 ~20, 독특한 멜로디 원하면 35~45로 올리고 추임새는 DAW 컷.
- **반주는 가볍게(추출용)** — 보컬이 돋보이게. 단 코러스 임팩트는 **풀 드롭 + 보컬 더블/화음(같은 가사)** 으로 (belting 아님).
- **여러 번 생성해 고른다** — Suno 생성 편차가 크다. 프롬프트로 방향만, 마지막 10%는 생성 비교 + DAW.
- **특정 멜로디는 텍스트로 못 박는다 → 오디오로 유도**: 머릿속에 원하는 후렴/멜로디가 있는데 텍스트 튜닝으로 안 잡히면, **흥얼거려 녹음 → Suno Cover/Audio Influence(~55~70%)** 로 멜로디를 유도하고 style/가사만 텍스트로 적용한다. (흥얼거림=저작권 0; 마음에 든 이전 테이크 업로드도 OK; 실곡 Cover는 출력 저작권 회색지대라 개인/추출용에 한정.) 텍스트는 무드·톤·구조까지만, **멜로디 윤곽은 소리로** 전달.

## 원칙
- 질의문답 한 번에 하나씩. 키(Q2)부터 확인.
- 음절 일치 핵심 — 재검산. 멜로디는 가사 컨투어로.
- 코드 진행은 **항상 DAW 표기(근음·보이싱·MIDI 번호) + .mid 출력**까지 함께 제공.
- 산출물은 MCP로만 기록(데이터 파일 직접 편집 금지). 단 `.mid`는 `exports/`에 파일로 출력(데이터 파일 아님).
- 화성학/이론 학습은 범위 밖(별도 스킬).
