import type {
  ReferenceBrief,
  TrackPlan,
  LearningMission,
  ReferenceFocus,
  ConfidenceLevel,
  LearningCategory,
} from "../types/reference-coach";

type ValidationResult<T> = { ok: true; data: T } | { ok: false; error: string };

function isStringArray(val: unknown): val is string[] {
  return Array.isArray(val) && val.every((v) => typeof v === "string");
}

function toStringArray(val: unknown): string[] {
  return isStringArray(val) ? val : [];
}

function toConfidence(val: unknown): ConfidenceLevel {
  return (["low", "medium", "high"] as ConfidenceLevel[]).includes(val as ConfidenceLevel)
    ? (val as ConfidenceLevel)
    : "medium";
}

export function validateReferenceBriefJson(
  raw: unknown,
  trackId: string,
  artist: string,
  songTitle: string,
  userFocus: ReferenceFocus[],
  userNotes?: string
): ValidationResult<ReferenceBrief> {
  if (!raw || typeof raw !== "object") {
    return { ok: false, error: "AI 응답이 올바른 JSON 형식이 아닙니다." };
  }
  const obj = raw as Record<string, unknown>;

  if (typeof obj.summary !== "string" || !obj.summary.trim()) {
    return { ok: false, error: "AI 응답에 필수 항목 'summary'가 없거나 비어있습니다." };
  }

  const now = new Date().toISOString();

  const data: ReferenceBrief = {
    id: crypto.randomUUID(),
    trackId,
    artist,
    songTitle,
    userFocus,
    userNotes,
    summary: obj.summary as string,
    genreTags: toStringArray(obj.genreTags),
    moodTags: toStringArray(obj.moodTags),
    productionTraits: toStringArray(obj.productionTraits),
    rhythmTraits: toStringArray(obj.rhythmTraits),
    harmonyTraits: toStringArray(obj.harmonyTraits),
    bassTraits: toStringArray(obj.bassTraits),
    toplineTraits: toStringArray(obj.toplineTraits),
    vocalTraits: toStringArray(obj.vocalTraits),
    soundTextureTraits: toStringArray(obj.soundTextureTraits),
    arrangementTraits: toStringArray(obj.arrangementTraits),
    sourceMode:
      obj.sourceMode === "user_input" || obj.sourceMode === "web_search_placeholder"
        ? obj.sourceMode
        : "ai_knowledge",
    sourceNotes: toStringArray(obj.sourceNotes),
    disclaimer:
      typeof obj.disclaimer === "string" && obj.disclaimer.trim()
        ? obj.disclaimer
        : "이 분석은 AI의 추론에 기반한 것으로, 실제 음악 이론과 다를 수 있습니다.",
    confidence: toConfidence(obj.confidence),
    createdAt: now,
    updatedAt: now,
  };

  return { ok: true, data };
}

export function validateTrackPlanJson(
  raw: unknown,
  trackId: string,
  referenceBriefId?: string
): ValidationResult<TrackPlan> {
  if (!raw || typeof raw !== "object") {
    return { ok: false, error: "AI 응답이 올바른 JSON 형식이 아닙니다." };
  }
  const obj = raw as Record<string, unknown>;

  if (typeof obj.title !== "string" || !obj.title.trim()) {
    return { ok: false, error: "AI 응답에 필수 항목 'title'이 없습니다." };
  }
  if (typeof obj.directionSummary !== "string" || !obj.directionSummary.trim()) {
    return { ok: false, error: "AI 응답에 필수 항목 'directionSummary'가 없습니다." };
  }

  const now = new Date().toISOString();
  const uid = () => crypto.randomUUID();

  const rawChords = Array.isArray(obj.chordProgressionSuggestions)
    ? (obj.chordProgressionSuggestions as Record<string, unknown>[])
    : [];
  const rawGrooves = Array.isArray(obj.grooveSuggestions)
    ? (obj.grooveSuggestions as Record<string, unknown>[])
    : [];

  const bassDir = (obj.bassDirection as Record<string, unknown>) ?? {};
  const toplineDir = (obj.toplineDirection as Record<string, unknown>) ?? {};
  const soundKw = (obj.soundKeywords as Record<string, unknown>) ?? {};
  const arrangNotes = (obj.arrangementNotes as Record<string, unknown>) ?? {};

  const data: TrackPlan = {
    id: uid(),
    trackId,
    referenceBriefId,
    title: obj.title as string,
    directionSummary: obj.directionSummary as string,
    bpmSuggestions: Array.isArray(obj.bpmSuggestions)
      ? (obj.bpmSuggestions as unknown[]).map(Number).filter(isFinite)
      : [],
    keySuggestions: toStringArray(obj.keySuggestions),
    chordProgressionSuggestions: rawChords.map((c) => ({
      id: uid(),
      name: typeof c.name === "string" ? c.name : "Chord Progression",
      chords: isStringArray(c.chords) ? c.chords : [],
      key: typeof c.key === "string" ? c.key : "C",
      mode: c.mode === "minor" ? "minor" : "major",
      bpm: typeof c.bpm === "number" ? c.bpm : undefined,
      isDefault: false,
    })),
    grooveSuggestions: rawGrooves.map((g) => ({
      id: uid(),
      name: typeof g.name === "string" ? g.name : "Groove",
      pattern: { description: typeof g.description === "string" ? g.description : "" },
      bpm: typeof g.bpm === "number" ? g.bpm : undefined,
      isDefault: false,
    })),
    bassDirection: {
      summary: typeof bassDir.summary === "string" ? bassDir.summary : "",
      rootMotionIdeas: toStringArray(bassDir.rootMotionIdeas),
      rhythmIdeas: toStringArray(bassDir.rhythmIdeas),
      beginnerTips: toStringArray(bassDir.beginnerTips),
    },
    toplineDirection: {
      summary: typeof toplineDir.summary === "string" ? toplineDir.summary : "",
      hookIdeas: toStringArray(toplineDir.hookIdeas),
      rhythmIdeas: toStringArray(toplineDir.rhythmIdeas),
      vocalToneIdeas: toStringArray(toplineDir.vocalToneIdeas),
      sunoTips: toStringArray(toplineDir.sunoTips),
    },
    soundKeywords: {
      drums: toStringArray(soundKw.drums),
      bass: toStringArray(soundKw.bass),
      melody: toStringArray(soundKw.melody),
      harmony: toStringArray(soundKw.harmony),
      fx: toStringArray(soundKw.fx),
      vocal: toStringArray(soundKw.vocal),
    },
    arrangementNotes: {
      intro: typeof arrangNotes.intro === "string" ? arrangNotes.intro : undefined,
      verse: typeof arrangNotes.verse === "string" ? arrangNotes.verse : undefined,
      preChorus: typeof arrangNotes.preChorus === "string" ? arrangNotes.preChorus : undefined,
      chorus: typeof arrangNotes.chorus === "string" ? arrangNotes.chorus : undefined,
      bridge: typeof arrangNotes.bridge === "string" ? arrangNotes.bridge : undefined,
      outro: typeof arrangNotes.outro === "string" ? arrangNotes.outro : undefined,
    },
    beginnerExplanation: typeof obj.beginnerExplanation === "string" ? obj.beginnerExplanation : "",
    disclaimer:
      typeof obj.disclaimer === "string" && obj.disclaimer.trim()
        ? obj.disclaimer
        : "이 플랜은 AI의 추론에 기반한 것으로, 실제 음악 제작과 다를 수 있습니다.",
    confidence: toConfidence(obj.confidence),
    createdAt: now,
    updatedAt: now,
  };

  return { ok: true, data };
}

const VALID_CATEGORIES: LearningCategory[] = [
  "harmony",
  "drums",
  "bass",
  "topline",
  "sound_design",
  "arrangement",
  "suno_prompt",
];

export function validateLearningMissionsJson(
  raw: unknown,
  trackId: string,
  trackPlanId?: string,
  referenceBriefId?: string
): ValidationResult<LearningMission[]> {
  if (!raw || typeof raw !== "object") {
    return { ok: false, error: "AI 응답이 올바른 JSON 형식이 아닙니다." };
  }
  const obj = raw as Record<string, unknown>;

  if (!Array.isArray(obj.missions) || obj.missions.length === 0) {
    return { ok: false, error: "AI 응답에 'missions' 배열이 없거나 비어있습니다." };
  }

  const now = new Date().toISOString();

  const missions: LearningMission[] = (obj.missions as unknown[]).flatMap((m) => {
    if (!m || typeof m !== "object") return [];
    const item = m as Record<string, unknown>;
    if (typeof item.title !== "string" || !item.title.trim()) return [];
    return [
      {
        id: crypto.randomUUID(),
        trackId,
        trackPlanId,
        referenceBriefId,
        category: VALID_CATEGORIES.includes(item.category as LearningCategory)
          ? (item.category as LearningCategory)
          : "harmony",
        title: item.title as string,
        objective: typeof item.objective === "string" ? item.objective : "",
        explanation: typeof item.explanation === "string" ? item.explanation : "",
        task: typeof item.task === "string" ? item.task : "",
        beginnerHint: typeof item.beginnerHint === "string" ? item.beginnerHint : "",
        expectedOutput: typeof item.expectedOutput === "string" ? item.expectedOutput : undefined,
        completed: false,
        createdAt: now,
        updatedAt: now,
      } satisfies LearningMission,
    ];
  });

  if (missions.length === 0) {
    return { ok: false, error: "유효한 학습 미션이 하나도 없습니다." };
  }

  return { ok: true, data: missions };
}
