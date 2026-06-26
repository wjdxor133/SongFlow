---
name: lyrics-from-reference
description: 레퍼런스 곡의 구조를 분석해서 동일한 섹션/줄 수/음절 밀도로 새 가사를 생성하고, Reddit 가이드 기반 Suno 프롬프트를 작성해 SongFlow에 저장
argument-hint: "<레퍼런스 아티스트 - 곡명> [track: 트랙명 or 앨범명] [concept: 컨셉]"
---

# lyrics-from-reference

레퍼런스 곡의 구조(섹션 구성, 줄 수, 음절 밀도, 언어 혼용 비율)를 분석한 뒤,
내용은 완전히 다르게 · 구조는 동일하게 가사를 생성하고,
Reddit Suno 가이드 기반으로 Style 프롬프트를 작성해 SongFlow에 저장한다.

---

## Step 1 — 인수 파싱 및 트랙 조회

args에서 다음을 추출한다:
- `reference`: 레퍼런스 곡 (예: "유다연 - Oh My")
- `track`: 저장할 트랙명 or 앨범명 (없으면 저장 생략)
- `concept`: 새 가사의 컨셉/주제 (없으면 트랙의 concept 사용)

`track`이 지정된 경우:
1. `mcp__songflow__list_albums` 로 전체 앨범 목록 조회
2. `mcp__songflow__list_tracks` 로 앨범별 트랙 조회
3. 트랙 이름 또는 앨범 이름으로 fuzzy match → trackId 자동 추출
4. 매칭 결과를 사용자에게 한 줄로 확인 후 진행

---

## Step 2 — 레퍼런스 구조 분석

`general-purpose` 에이전트로 웹 검색해서 다음을 수집한다:
- 전체 섹션 목록 (순서대로): Intro / Verse / Pre-Chorus / Chorus / Post-Chorus / Bridge / Outro 등
- 각 섹션의 줄 수 및 총 줄 수
- 언어 혼용 비율 (한국어 / 영어 / 기타)
- 훅 반복 횟수 (Chorus가 몇 번 등장하는지)
- 레퍼런스 곡의 장르, BPM(추정), Key(추정), 주요 악기, 보컬 스타일

### Step 2-1 — 줄별 정밀 음절 타깃 추출 (영어 가사일 때 필수)

> 배경: LLM은 영어 음절을 ~23-55% 정확도로밖에 못 센다. 음절 매칭은 모델이 아니라 **사전(CMUdict)**으로 해야 한다. 근거: `.omc/research/ai-english-lyric-syllable-matching.md`

"라인당 평균 음절(보통/긺)" 같은 **느슨한 추정을 쓰지 않는다.** 대신 레퍼런스의 줄별 정확한 음절 수를 결정론적으로 추출한다:

1. 웹에서 레퍼런스 가사 전문을 임시로 가져온다.
2. 번들 스크립트로 줄별 음절 수를 계산한다:
   ```bash
   python3 .claude/skills/lyrics-from-reference/scripts/syllable_count.py count /tmp/ref_lyrics.txt
   ```
   (CMUdict=`pronouncing` 우선, 미설치 시 rule-based 폴백. `backend` 필드로 확인. 한 줄: `cat | python3 .../syllable_count.py count`)
3. **숫자 타깃만 보관하고 레퍼런스 가사 텍스트는 폐기한다** (저작권 — 음절 수만 템플릿으로 남김).
4. 섹션별 음절 타깃 배열을 `targets.json` 형태로 만든다 (Step 3-1 검증에 사용):
   ```json
   {"Verse 1": [8,6,8,6], "Pre-Chorus": [7,7], "Chorus": [7,7,5,7]}
   ```

> 영어 줄에만 정밀 카운팅이 유효하다. 한국어/혼용 줄은 카운터가 부정확(OOV 폴백)하므로 기존 음절 밀도 방식으로 맞춘다.

---

## Step 3 — 가사 생성

분석한 구조를 템플릿으로 삼아 새 가사를 작성한다.

**규칙:**
- 각 섹션에 Suno 섹션 마커 삽입: `[Intro]`, `[Verse]`, `[Pre-Chorus]`, `[Chorus]`, `[Bridge]`, `[Outro]` 등
- 레퍼런스와 **동일한 섹션 수, 동일한 줄 수** 유지 (줄 수는 정확히 일치)
- **줄별 음절 수를 Step 2-1의 `targets.json`에 정확히 맞춘다.** "범위 내" 같은 근사가 아니라 줄마다 정확한 목표치. 프롬프트(스스로에게)에 각 줄의 목표 음절을 명시한다:
  ```
  [Verse 1]
    L1: 8 syllables
    L2: 6 syllables
    ...
  ```
  (근거: 줄별 타깃 명시 시 98.33% 정확도 vs 자유 생성 6.67% — LOAF-M2L)
- (선택, 품질 향상) 영어 줄은 레퍼런스의 **강세 윤곽**도 맞추면 더 자연스럽게 불린다. 강세는 `pronouncing.stresses()`로 확인(0/1/2). 단 정량 규칙이 아닌 소프트 레버.
- 언어 혼용 비율 유지 (레퍼런스가 한/영 6:4이면 동일하게)
- 반복 Chorus는 동일하게 반복 표기
- 훅 라인은 짧고 강하게, 중독성 있게
- 내용은 트랙의 concept/genre에 맞게 100% 오리지널로 작성
- 레퍼런스 가사를 그대로 복사하지 않는다 (저작권)

---

## Step 3-1 — 음절 검증 → 교정 루프 (영어 가사일 때 필수)

> 이 루프가 정밀도의 최고 레버리지다. 자유 생성은 음운 제약을 <4%만 충족하지만, 결정론적 검증+교정 루프는 73%+로 끌어올린다 (arXiv 2601.09631).

생성한 가사를 `targets.json`에 대조하고, 불일치를 고쳐 재생성한다 (최대 ~15회):

1. 생성한 가사를 `/tmp/gen_lyrics.txt`에 쓴다 (섹션 마커 포함 가능 — 스크립트가 무시).
2. 검증:
   ```bash
   python3 .claude/skills/lyrics-from-reference/scripts/syllable_count.py verify /tmp/gen_lyrics.txt /tmp/targets.json
   ```
   출력의 `per_line_match_rate`와 `mismatches`(줄별 target/got)를 본다.
3. **불일치가 있으면**: `mismatches`를 피드백으로 삼아 해당 줄만 목표 음절에 맞게 다시 쓴다 (예: "L2 had 7, need 6"). 다른 줄은 유지.
4. 2-3을 `per_line_match_rate == 1.0` (또는 ≥ 목표치, 기본 1.0)이 될 때까지, 최대 15회 반복.
5. 15회 내 미달 시 최선본을 쓰되, 최종 `per_line_match_rate`를 출력에 명시한다.

> 게이트 지표 = **per-line Syllable Count Distance**(줄별 정확 일치율). 한국어/혼용 줄은 이 루프에서 제외하고 줄 수·밀도만 확인.

---

## Step 4 — Suno Style 프롬프트 작성 (Reddit 가이드 기반)

### 4-1. 사전 체크리스트 (생성 전 스스로 확인)
- [ ] Vocal 곡인가, Instrumental인가?
- [ ] 무드 형용사 3~5개 선정 (서로 상충하지 않는지 확인)
- [ ] 주장르 + 서브장르 확정
- [ ] BPM 또는 템포감 (slow/mid/fast) + 그루브 스타일
- [ ] 리드 역할 악기 또는 보컬 훅 확정
- [ ] 악기 목록 3~5개 이하로 제한

### 4-2. Style 필드 작성 순서
아래 순서대로 작성한다. 중요한 것을 **앞에** 배치한다 (Suno는 앞부분에 더 강하게 반응):

```
주장르, 서브장르/시대, 무드 형용사 2~4개, BPM, 리드악기+역할, 
리듬/베이스, 배경 텍스처, 믹스/프로덕션 키워드, 분위기 내러티브 큐(선택)
```

**악기 규칙:**
- 단수형 사용: `guitars` ❌ → `guitar` ✅
- 3~5개 이하로 제한 (많을수록 소리가 뭉개짐)
- 레이어가 많은 곡은 섹션 태그 안에서 점층적으로 추가

**믹스 키워드 (뭉개지는 경우 추가):**
- 깨끗하게: `clean mix`, `high-fidelity`, `wide stereo`, `tight low end`
- 빈티지: `tape warmth`, `vinyl crackle`, `lo-fi cassette`
- 공간감: `spacious reverb`, `subtle delay`
- 뭉개질 때 제거: `no distortion`, `dry mix`, `minimal reverb`

**아티스트명 직접 사용 금지** → 대신 특성으로 변환:
```
유다연 스타일 → afrobeats groove, breathy Korean female vocal, dance pop hook, bright clean mix
```

**예시 Style 프롬프트:**
```
modern afrobeats dance pop, warm and upbeat, 104 BPM, Eb major,
breathy female vocal with an anthemic chorus,
pop piano lead, afro percussion, groovy bass,
soft synth pad background, clean mix wide stereo,
summer romance first love
```

### 4-3. Lyrics 필드의 구조 태그 (Custom Mode)
섹션 마커에 `:` 로 해당 섹션의 편곡 지시를 추가한다:

```
[Intro: airy pads, no drums, establish motif softly]
[Verse: bass groove enters, vocal carries melody]
[Pre-Chorus: tension builds, drums tighten]
[Chorus: full drums, biggest hook, wide stereo]
[Post-Chorus: hook echo, groove settles]
[Verse 2: same groove, new details]
[Bridge: strip down, emotional shift]
[Chorus: return, bigger drums, stronger hook]
[Outro: remove drums, let pads ring out]
[Fade Out]
```

훅이 약할 경우 `[Hook: lead instrument plays a memorable 2-bar motif]` 태그 삽입.

---

## Step 5 — SongFlow 저장 (trackId 있을 때)

1. `mcp__songflow__update_track` — 새 가사로 `lyrics` 업데이트
2. `mcp__songflow__save_agent_response` — task: `"generate_suno_prompts"`, rawText:
```json
{
  "style": "...(Style 필드 전문)...",
  "lyrics": "...(섹션 태그 포함 가사 전문)..."
}
```

---

## 출력 형식

```
## 레퍼런스 구조 분석
아티스트 - 곡명
총 N줄 | M섹션 | Chorus ×N회 반복
섹션: [Intro(4줄)] → [Verse(8줄)] → [Pre(4줄)] → [Chorus(6줄)] → ...
언어 비율: 한국어 60% / 영어 40%
줄별 음절 타깃: Verse [8,6,8,6] · Pre [7,7] · Chorus [7,7,5,7]  (backend: cmudict)

## Style of Music (Suno)
(완성된 style 프롬프트)

## Lyrics (Suno)
(섹션 태그 + 편곡 지시 + 가사 전문)

## 음절 매칭 결과 (영어 줄)
per-line match rate: 100% (28/28)  ← Step 3-1 검증 루프 N회 후

## 저장 결과
트랙명 (trackId) — 업데이트 완료 / (track 미지정 — 저장 생략)
```

---

## 사용 예시

```
/lyrics-from-reference 유다연 - Oh My, track: Oh Wow
/lyrics-from-reference NewJeans - Hype Boy, track: Deep End, concept: 이별 후 홀로서기
/lyrics-from-reference Bruno Mars - Uptown Funk, track: New Wave
/lyrics-from-reference 아이유 - 밤편지   ← 저장 없이 출력만
```

---

## 주의사항
- **영어 음절은 모델이 세지 않는다** — 반드시 `scripts/syllable_count.py`(CMUdict)로 카운트/검증한다. 정확도가 곧 결과 품질. 배경: `.omc/research/ai-english-lyric-syllable-matching.md`
- 정밀 카운팅은 `pronouncing`(CMUdict) 설치 시 최적. 미설치면 `pip install pronouncing` 권장(폴백도 동작하나 OOV 정확도↓). `verify` 출력의 `backend` 필드로 확인.
- 정밀 음절 매칭은 **영어 줄에만** 적용 — 한국어/혼용 줄은 줄 수·밀도만 맞춘다.
- `deep-research`는 런타임에 사용하지 않는다 — 레퍼런스 구조는 웹 검색 2~3회로 충분하다 (정밀도는 로컬 카운터 루프가 담당)
- Style 프롬프트는 **1,000자 이하**로 유지 (Suno v4.5+ 한도)
- 장르 블렌딩은 최대 2개: 주장르가 편곡 결정, 서브장르는 악기/코드로만 표현
- 무드 형용사가 서로 상충하는지 확인 ("sad happy" 같은 조합 금지)
- 이터레이션 시 한 번에 1~2가지만 수정
