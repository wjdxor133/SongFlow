/**
 * GUIDED_SAMPLE — 박제된 샘플 트랙 상수
 *
 * 키 없이도 전체 파이프라인(Reference Brief → Track Plan → 코드/그루브 → 학습 미션 → Suno 프롬프트)을
 * 초보자에게 보여주기 위한 오프라인 전용 데이터입니다.
 * 이 상수는 절대 JSON 스토어에 저장되지 않습니다.
 *
 * DO NOT import from src/lib/ai or the store.
 */

import type { ReferenceBrief, TrackPlan, LearningMission } from "../types/reference-coach";
import type { ChordProgression, GroovePattern } from "../types/music";
import type { GeneratedPrompt } from "../types/prompt";

export type GuidedSample = {
  bakedBrief: ReferenceBrief;
  bakedPlan: TrackPlan;
  bakedChords: ChordProgression[];
  bakedGroove: GroovePattern[];
  bakedMissions: LearningMission[];
  bakedPrompt: GeneratedPrompt;
};

// ─── 고정 ID 상수 ────────────────────────────────────────────────────────────
const SAMPLE_TRACK_ID = "sample-guided-track-001";
const SAMPLE_BRIEF_ID = "sample-brief-001";
const SAMPLE_PLAN_ID = "sample-plan-001";
const SAMPLE_CREATED_AT = "2026-01-01T00:00:00.000Z";

// ─── Reference Brief ─────────────────────────────────────────────────────────
const bakedBrief: ReferenceBrief = {
  id: SAMPLE_BRIEF_ID,
  trackId: SAMPLE_TRACK_ID,

  artist: "Nulbarich",
  songTitle: "ain't on the map",

  userFocus: ["overall_mood", "chord_feel", "drum_groove"],
  userNotes: "초보자가 따라 만들기 좋은 시티팝/R&B 분위기",

  summary:
    "Nulbarich의 'ain't on the map'은 부드러운 시티팝과 소울 R&B를 결합한 곡입니다. "
    + "재즈 코드 보이싱(maj7, 9th)으로 여유롭고 도시적인 분위기를 만들고, "
    + "하프타임 그루브 드럼과 자연스러운 코러스 보컬 레이어가 특징입니다.",

  genreTags: ["시티팝", "R&B", "소울", "J-Pop"],
  moodTags: ["여유로운", "도시적인", "감성적인", "따뜻한"],

  productionTraits: [
    "클린 기타 아르페지오",
    "소프트 코러스 레이어 보컬",
    "미디엄 리버브 공간감",
    "레이드백된 느낌의 전체 믹스",
  ],
  rhythmTraits: [
    "하프타임 드럼 그루브 (느린 스네어)",
    "8비트 하이햇 패턴",
    "킥 드럼이 약박에 위치",
  ],
  harmonyTraits: [
    "maj7 코드 사용으로 부드러운 색채",
    "II-V-I 재즈 기능화성",
    "도미넌트 서스펜션(sus4) 활용",
  ],
  bassTraits: [
    "루트음 중심의 심플한 베이스라인",
    "간간이 크로매틱 경과음",
    "따뜻한 핑거드 베이스 톤",
  ],
  toplineTraits: [
    "리듬감 있는 단어 반복",
    "후크가 짧고 기억하기 쉬운 구조",
    "음역대: 중성적인 테너 범위",
  ],
  vocalTraits: [
    "영어·일본어 혼합 가사",
    "소프트 팔세토 코러스",
    "더블 트랙 메인 보컬",
  ],
  soundTextureTraits: [
    "클린 일렉 기타 코드 스트러밍",
    "부드러운 로즈 피아노 레이어",
    "서브베이스 없이 미드 중심 사운드",
  ],
  arrangementTraits: [
    "인트로: 기타 아르페지오 솔로",
    "버스: 기타 + 베이스 + 드럼 미니멀",
    "코러스: 보컬 레이어 추가로 자연스럽게 확장",
    "아웃트로: 페이드 아웃",
  ],

  sourceMode: "ai_knowledge",
  sourceNotes: [
    "AI 사전 지식 기반 분석 (실시간 웹 검색 아님)",
    "실제 악보·MIDI 분석이 아닌 청음 기반 추정",
  ],
  disclaimer:
    "이 분석은 AI가 미리 작성한 샘플 데이터입니다. "
    + "실제 API 키 없이도 파이프라인을 체험할 수 있도록 제공됩니다. "
    + "정확한 분석을 원하시면 '분석 시작' 버튼을 눌러 직접 생성해보세요.",
  confidence: "medium",

  createdAt: SAMPLE_CREATED_AT,
  updatedAt: SAMPLE_CREATED_AT,
};

// ─── Track Plan ───────────────────────────────────────────────────────────────
const bakedPlan: TrackPlan = {
  id: SAMPLE_PLAN_ID,
  trackId: SAMPLE_TRACK_ID,
  referenceBriefId: SAMPLE_BRIEF_ID,

  title: "시티팝 R&B 샘플 플랜",
  directionSummary:
    "Nulbarich 스타일의 시티팝 R&B를 목표로 합니다. "
    + "핵심은 '여유로운 그루브'입니다. 코드는 maj7 계열로 부드러운 재즈 색채를 더하고, "
    + "드럼은 스네어를 3박에 느리게 배치하는 하프타임 그루브를 사용합니다. "
    + "초보자 팁: 코드를 한 번에 다 외우려 하지 말고, Cmaj7 → Am7 → Dm7 → G7 흐름 하나만 "
    + "반복해서 연주하며 귀로 익히세요.",

  bpmSuggestions: [90, 95, 100],
  keySuggestions: ["C", "F", "G"],

  chordProgressionSuggestions: [
    {
      id: "sample-chord-001",
      name: "재즈 팝 기본 진행 (추천)",
      chords: ["Cmaj7", "Am7", "Dm7", "G7"],
      key: "C",
      mode: "major",
      bpm: 90,
      isDefault: true,
    },
    {
      id: "sample-chord-002",
      name: "서브도미넌트 강조 진행",
      chords: ["Fmaj7", "Em7", "Am7", "Dm7", "G7"],
      key: "C",
      mode: "major",
      bpm: 95,
      isDefault: false,
    },
    {
      id: "sample-chord-003",
      name: "3625 변형 진행",
      chords: ["Em7", "A7", "Dm7", "G7"],
      key: "C",
      mode: "major",
      bpm: 90,
      isDefault: false,
    },
  ],

  grooveSuggestions: [
    {
      id: "sample-groove-001",
      name: "하프타임 R&B 그루브 (추천)",
      pattern: {
        description: "스네어 3박, 킥 1·4박 약간 뒤, 하이햇 8분음 스트레이트",
        kick: [1, 2.75, 4.5],
        snare: [3],
        hihat: [1, 1.5, 2, 2.5, 3, 3.5, 4, 4.5],
      },
      bpm: 90,
      isDefault: true,
    },
    {
      id: "sample-groove-002",
      name: "부드러운 스윙 그루브",
      pattern: {
        description: "16분음 스윙 하이햇, 스네어 2·4박, 가벼운 킥",
        kick: [1, 3.5],
        snare: [2, 4],
        hihat: [1, 1.25, 1.5, 1.75, 2, 2.25, 2.5, 2.75, 3, 3.25, 3.5, 3.75, 4, 4.25, 4.5, 4.75],
      },
      bpm: 95,
      isDefault: false,
    },
    {
      id: "sample-groove-003",
      name: "미니멀 트랩 스타일",
      pattern: {
        description: "킥만 1·3박, 스네어 2·4박, 하이햇 없음 — 매우 단순하여 초보자 연습용",
        kick: [1, 3],
        snare: [2, 4],
        hihat: [],
      },
      bpm: 90,
      isDefault: false,
    },
  ],

  bassDirection: {
    summary: "루트음 중심의 심플하고 따뜻한 베이스라인. 초보자라면 코드 루트음만 연주해도 충분합니다.",
    rootMotionIdeas: [
      "C → A → D → G 루트음 순서로만 연주",
      "강박(1박)에 루트, 이후 쉼표로 공간 확보",
    ],
    rhythmIdeas: [
      "점4분음표 리듬으로 레이드백 느낌",
      "2박에 걸쳐 타이로 연결하면 자연스럽게 느려 보임",
    ],
    beginnerTips: [
      "처음엔 루트음 하나만 치세요. 멋은 나중에 추가해요.",
      "베이스가 쉴수록 그루브가 살아납니다.",
    ],
  },

  toplineDirection: {
    summary: "짧고 반복 가능한 훅을 중심으로. 음역대 C4~A4 사이에서 멜로디를 구성하세요.",
    hookIdeas: [
      "짧은 영어 문장 반복 (예: 'hey, just stay with me')",
      "한 소절 안에서 음표 3~4개로 이루어진 단순 훅",
    ],
    rhythmIdeas: [
      "싱코페이션: 약박에 음절이 오도록",
      "8분음표 + 점4분음표 혼합 리듬",
    ],
    vocalToneIdeas: [
      "소프트 팔세토로 코러스 녹음",
      "더블 트랙으로 공간감 확보",
    ],
    sunoTips: [
      "Suno에서 스타일 입력 시 'city pop, R&B, soft vocal, jazzy chords' 조합 추천",
      "[Verse], [Chorus] 태그로 섹션 구분하면 구조가 명확해집니다",
    ],
  },

  soundKeywords: {
    drums: ["하프타임 드럼", "소프트 스네어", "클린 하이햇"],
    bass: ["핑거드 베이스", "따뜻한 미드", "루트음 중심"],
    melody: ["클린 기타 아르페지오", "로즈 피아노", "소프트 신스패드"],
    harmony: ["maj7 코드", "재즈 보이싱", "sus4 서스펜션"],
    fx: ["미디엄 리버브", "쇼트 딜레이"],
    vocal: ["소프트 팔세토", "더블 트랙", "부드러운 코러스"],
  },

  arrangementNotes: {
    intro: "클린 기타 아르페지오 4마디 — 드럼·베이스 없이 시작해 여백을 살리세요.",
    verse: "기타 + 베이스 + 드럼 미니멀하게. 보컬은 리듬감 있게 노래하되 지나치게 채우지 않기.",
    chorus: "보컬 더블 트랙 추가 + 로즈 피아노 레이어 인. 에너지를 살짝만 높여 자연스러운 빌드업.",
    outro: "코러스 멜로디 반복 후 점점 악기 줄이며 페이드 아웃.",
  },

  beginnerExplanation:
    "이 플랜은 초보자가 처음으로 시티팝 스타일 곡을 만드는 데 최적화되어 있습니다. "
    + "코드 진행 '추천' 항목부터 시작하고, 그루브도 '추천' 패턴을 그대로 사용해보세요. "
    + "Suno에 스타일 프롬프트를 그대로 붙여넣으면 바로 음악을 들을 수 있습니다.",

  disclaimer:
    "이 플랜은 AI가 미리 작성한 샘플 데이터입니다. API 키 없이 파이프라인을 체험하기 위한 용도입니다.",
  confidence: "medium",

  createdAt: SAMPLE_CREATED_AT,
  updatedAt: SAMPLE_CREATED_AT,
};

// ─── ChordProgression[] (bakedPlan.chordProgressionSuggestions와 동일 shape) ─
const bakedChords: ChordProgression[] = [
  {
    id: "sample-chord-001",
    name: "재즈 팝 기본 진행 (추천)",
    chords: ["Cmaj7", "Am7", "Dm7", "G7"],
    key: "C",
    mode: "major",
    bpm: 90,
    isDefault: true,
  },
  {
    id: "sample-chord-002",
    name: "서브도미넌트 강조 진행",
    chords: ["Fmaj7", "Em7", "Am7", "Dm7", "G7"],
    key: "C",
    mode: "major",
    bpm: 95,
    isDefault: false,
  },
  {
    id: "sample-chord-003",
    name: "3625 변형 진행",
    chords: ["Em7", "A7", "Dm7", "G7"],
    key: "C",
    mode: "major",
    bpm: 90,
    isDefault: false,
  },
];

// ─── GroovePattern[] ──────────────────────────────────────────────────────────
const bakedGroove: GroovePattern[] = [
  {
    id: "sample-groove-001",
    name: "하프타임 R&B 그루브 (추천)",
    pattern: {
      description: "스네어 3박, 킥 1·4박 약간 뒤, 하이햇 8분음 스트레이트",
      kick: [1, 2.75, 4.5],
      snare: [3],
      hihat: [1, 1.5, 2, 2.5, 3, 3.5, 4, 4.5],
    },
    bpm: 90,
    isDefault: true,
  },
  {
    id: "sample-groove-002",
    name: "부드러운 스윙 그루브",
    pattern: {
      description: "16분음 스윙 하이햇, 스네어 2·4박, 가벼운 킥",
      kick: [1, 3.5],
      snare: [2, 4],
      hihat: [1, 1.25, 1.5, 1.75, 2, 2.25, 2.5, 2.75, 3, 3.25, 3.5, 3.75, 4, 4.25, 4.5, 4.75],
    },
    bpm: 95,
    isDefault: false,
  },
  {
    id: "sample-groove-003",
    name: "미니멀 트랩 스타일",
    pattern: {
      description: "킥만 1·3박, 스네어 2·4박 — 매우 단순하여 초보자 연습용",
      kick: [1, 3],
      snare: [2, 4],
      hihat: [],
    },
    bpm: 90,
    isDefault: false,
  },
];

// ─── LearningMission[] ────────────────────────────────────────────────────────
const bakedMissions: LearningMission[] = [
  {
    id: "sample-mission-001",
    trackId: SAMPLE_TRACK_ID,
    trackPlanId: SAMPLE_PLAN_ID,
    referenceBriefId: SAMPLE_BRIEF_ID,

    category: "harmony",
    title: "maj7 코드 4개로 진행 만들기",

    objective: "Cmaj7 → Am7 → Dm7 → G7 진행을 기타나 피아노로 4마디 연주할 수 있다.",
    explanation:
      "maj7 코드는 일반 장조 코드(C, Am 등)보다 훨씬 부드럽고 재즈 느낌을 줍니다. "
      + "7번째 음(장7도)을 하나 추가하는 것만으로 시티팝 특유의 색채가 만들어집니다.",
    task: "DAW나 악기에서 Cmaj7 → Am7 → Dm7 → G7을 각 1마디씩 반복 연주하고 녹음하세요. "
      + "BPM 90으로 설정하고 루프 재생으로 10번 반복해보세요.",
    beginnerHint:
      "코드 이름이 낯설어도 괜찮아요. 피아노라면 C-E-G-B 4개 건반을 동시에 누르면 Cmaj7입니다. "
      + "기타라면 인터넷에서 'Cmaj7 코드 다이어그램'을 검색해보세요.",

    expectedOutput: "4마디 반복 코드 진행 오디오 클립",

    completed: false,

    createdAt: SAMPLE_CREATED_AT,
    updatedAt: SAMPLE_CREATED_AT,
  },
  {
    id: "sample-mission-002",
    trackId: SAMPLE_TRACK_ID,
    trackPlanId: SAMPLE_PLAN_ID,
    referenceBriefId: SAMPLE_BRIEF_ID,

    category: "suno_prompt",
    title: "Suno에 스타일 프롬프트 붙여넣고 결과 들어보기",

    objective: "아래 Suno 프롬프트를 복사해 Suno AI에 붙여넣고 생성 결과를 들을 수 있다.",
    explanation:
      "Suno는 텍스트 프롬프트만으로 완성된 곡을 만들어주는 AI 서비스입니다. "
      + "스타일 키워드를 잘 조합하면 원하는 분위기에 가까운 결과를 얻을 수 있습니다. "
      + "처음엔 주어진 프롬프트를 그대로 써보고, 이후 단어를 하나씩 바꿔 실험해보세요.",
    task: "Suno(suno.com)에 접속해 '프롬프트 만들기' 탭의 Style 필드에 제공된 스타일 프롬프트를 붙여넣고 생성해보세요.",
    beginnerHint:
      "결과가 마음에 들지 않아도 괜찮아요. 여러 번 생성하다 보면 원하는 느낌에 가까워집니다. "
      + "가사 칸은 비워도 Suno가 자동으로 만들어 줍니다.",

    expectedOutput: "Suno 생성 결과 1개 이상 청취",

    completed: false,

    createdAt: SAMPLE_CREATED_AT,
    updatedAt: SAMPLE_CREATED_AT,
  },
];

// ─── GeneratedPrompt (Suno 프롬프트) ─────────────────────────────────────────
const bakedPrompt: GeneratedPrompt = {
  id: "sample-prompt-001",
  requestId: "sample-request-001",

  style:
    "city pop, Japanese R&B, soul, jazzy chords, maj7 progression, "
    + "clean electric guitar arpeggio, Rhodes piano, fingered bass, "
    + "half-time drum groove, soft snare, medium reverb, warm mix, "
    + "soft falsetto vocal, double-tracked vocals, laidback feel, 90 BPM",

  lyrics:
    "[Verse]\n"
    + "도심의 불빛 사이로\n"
    + "오늘도 걸어가\n"
    + "바람이 불어오면\n"
    + "그냥 그대로 있어\n"
    + "\n"
    + "[Chorus]\n"
    + "hey, just stay with me\n"
    + "이 순간만큼은\n"
    + "아무것도 필요 없어\n"
    + "그냥 여기 있어줘",

  moreRefreshing:
    "city pop, upbeat, bright guitar, sunny vibes, 95 BPM, summer feel, clean mix",

  moreEmotional:
    "R&B ballad, emotional vocal, minor 9th chords, slow 80 BPM, rainy mood, reverb-heavy, soul",

  vocalFocused:
    "soft falsetto, double-tracked, breathy, intimate, close mic, minimal reverb, "
    + "vocal-forward mix, whisper tone",

  grooveFocused:
    "half-time groove, soft snare on beat 3, clean hi-hat 8th notes, "
    + "fingered bass root notes, laidback kick, minimal drum fill",

  type: "full_song",
  sourceTrackPlanId: SAMPLE_PLAN_ID,
  sourceReferenceBriefId: SAMPLE_BRIEF_ID,
  versionLabel: "balanced",

  createdAt: SAMPLE_CREATED_AT,
};

// ─── 메인 상수 ────────────────────────────────────────────────────────────────
export const GUIDED_SAMPLE = {
  bakedBrief,
  bakedPlan,
  bakedChords,
  bakedGroove,
  bakedMissions,
  bakedPrompt,
} satisfies GuidedSample;
