# Deep Research: AI로 영어 가사를 레퍼런스 음절 구조에 정밀 매칭하기

> 출처: deep-research 워크플로 (소스 23개 → 주장 104개 → 상위 25개 3표 적대적 검증 → **24 확정 / 1 폐기**). 생성일 2026-06-26.
> 대상: 자동화·정밀도를 원하는 영어 가사 작곡가. 보유 도구(`lyrics-from-reference`) 최적화 관점.

## 핵심 결론
음절 카운팅을 LLM에 맡기지 말고 **CMUdict(사전)로 결정론적 처리** + Claude에 **줄별 정확한 음절 타깃 명시** + **생성→검증→교정 루프**로 감싼다. 이 3층이 정밀도의 거의 전부.

---

## 1. LLM은 음절을 신뢰성 있게 못 센다 (confidence: high)
- Claude-3-Sonnet **55%**, GPT-4 **23.3%** 음절 카운팅 정확도 (인간 90%). ChatGPT-3.5/4.0의 정확한 음절 제약 충족률 ~38%/57%, GPT-4 음절 오류율 79.8%.
- 원인: 토큰 단위 처리가 음절·강세·운(rhyme) 같은 음운 단위와 어긋나는 **구조적 한계** — 음운 추론이 아니라 학습 데이터의 상관관계 암기. 프롬프트로 안 고쳐짐.
- 출처: PhonologyBench [arXiv 2404.02456](https://arxiv.org/html/2404.02456v1), [arXiv 2411.13100](https://arxiv.org/html/2411.13100v1), [arXiv 2601.09631](https://arxiv.org/pdf/2601.09631)

## 2. 사전 기반 카운팅이 정답 (confidence: high)
- CMUdict에서 단어별 발음(ARPAbet) 조회 → 모음 음소(=강세 숫자 토큰) 개수 = 음절 수. OOV(사전 외) 단어만 rule-based 폴백.
- LOAF-M2L이 실제로 쓰는 방식: "CMU Pronunciation Dictionary로 단어-음절 매핑, OOV는 rule-based estimator."
- 출처: [CMUdict](https://www.speech.cs.cmu.edu/cgi-bin/cmudict), [arXiv 2307.02146](https://arxiv.org/html/2307.02146v3)

## 3. 도구: `pronouncing` / `prosodic` (confidence: high)
- **`pronouncing`** (Python, CMUdict 래퍼): `syllable_count()`=음절 수, `stresses()`=강세 패턴(`'snappiest'→'102'`). 음절 수 + 강세 윤곽 동시. 운각(iamb `01`/trochee `10`/dactyl `100`/anapest `001`) 매칭 가능. [tutorial](https://pronouncing.readthedocs.io/en/latest/tutorial.html)
- **`prosodic`** (Python): `text→stanza→line→syllable→phoneme` 계층 파싱 → 섹션·줄당 음절·운율(약강/강약 등) 한 번에. CMUdict 우선 + espeak OOV 폴백. [PyPI](https://pypi.org/project/prosodic/)

## 4. 프롬프트: 줄별 음절 타깃을 *명시* (confidence: high)
- 음절 밀도를 추론시키지 말고 각 줄에 **정확한 목표 음절 수**를 붙임 (length-control token). LOAF-M2L **줄별 98.33%** 정확도 (ChatGPT 6.67%, SongMASS 15%). 섹션 마커 뒤 `<SYL:s>` 토큰으로 타깃을 *제공*(예측 아님).
- 출처: [arXiv 2307.02146](https://arxiv.org/html/2307.02146v3), [arXiv 2411.13100](https://arxiv.org/html/2411.13100v1)

## 5. 생성→검증→교정 루프 (confidence: high) ⭐ 최고 레버리지
- LLM 생성 → 사전 카운터로 줄별 대조 → 불일치를 피드백으로 주입 → 재시도(~15회). 음운 제약 생성을 **<4% → 73.1%**로. 결정론적 카운터를 "거의 정답 비평가"로.
- 출처: [arXiv 2601.09631](https://arxiv.org/pdf/2601.09631), [DeCRIM arXiv 2410.06458](https://arxiv.org/pdf/2410.06458) (GPT-4도 다중 제약의 21%+에서 ≥1개 누락)

## 6. 운율(강세)도 매칭 — 단 소프트 레버 (confidence: high)
- 음절 *수*만이 아니라 강세 윤곽(CMUdict 0/1/2)을 맞추면 더 자연스럽게 불림. 단 "강세-강박 정렬 0.81 확률" 주장은 **검증 폐기(0-3)** → 정량 규칙 아님, 품질 향상용.
- 출처: [arXiv 2301.02732](https://arxiv.org/pdf/2301.02732)

## 7. 성공 측정 (confidence: high)
- **Per-line Syllable Count Distance** = 생성 줄 음절 수가 레퍼런스 줄과 정확 일치하는 비율. 루프 게이트 겸 리포트 지표.
- 출처: [arXiv 2308.13715](https://arxiv.org/abs/2308.13715)

## 8. ⚠️ Suno 관련은 미검증 (confidence: low — 공백)
- Suno 메타태그·음절 허용치·발음 트릭은 적대적 검증을 통과한 1차 근거 없음. Suno 공식 문서/커뮤니티로 별도 검증 필요. (블로그: jackrighteous, sunoarchitect 등은 참고용.)

---

## 주요 caveat
1. 73% 수치는 **그리스어**(철자-발음 규칙적) 연구 → 원리 유효, 영어 수치 크기는 다를 수 있음.
2. LLM 정확도 수치는 2024 모델 버전 기준 (최신 모델·CoT로 다소 개선되나 raw 카운팅은 여전히 불안정 → 사전 백엔드 권고 유지).
3. CMUdict는 음절 경계 미표기, OOV/슬랭에 빈값 → rule-based/espeak 폴백 필수. 사전형 강세지 실제 멜리스마(음절 늘임)는 미반영.
4. Syllable Count Distance·length-control token은 번역/멜로디→가사 맥락 → 임의 레퍼런스 매칭에 약한 외삽.

## Open Questions
- Suno의 실제 음절 허용치와 메타태그·발음 트릭 (별도 Suno 연구 필요)
- <4%→73% 향상이 영어 음절 제약에 그대로 전이되는지 (영어 복제 실험 필요)
- 가사 OOV/슬랭/축약/멜리스마 최적 처리 (espeak vs rule vs LLM-G2P)
- 음절 수 vs 강세 매칭 가중치 튜닝

## 적용 (lyrics-from-reference)
1. 음절 카운터를 CMUdict(`pronouncing`/`prosodic`)로 — LLM 추정 제거
2. 줄별 정확 음절 타깃(+강세)을 Claude 프롬프트에 주입
3. CMUdict 검증 루프(~15회)로 생성 감싸기 + per-line match rate 게이트
