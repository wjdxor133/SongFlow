import type { AgentRequest, AgentTask, Track, Album } from "../types";

type PromptResult = {
  instruction: string;
  outputSchema: string;
};

export function buildPrompt(
  task: AgentTask,
  track: Track,
  album: Album,
  extra?: Record<string, unknown>
): PromptResult {
  const base = [
    `Track: ${track.title}`,
    `Album: ${album.title}`,
    `Genre: ${track.genre ?? album.genre}`,
    track.concept ? `Concept: ${track.concept}` : "",
    album.concept ? `Album Concept: ${album.concept}` : "",
  ]
    .filter(Boolean)
    .join("\n");

  switch (task) {
    case "generate_song_brief":
      return {
        instruction: `You are a music producer assistant. Generate a Song Brief for the following project.\n\n${base}\n\nReturn ONLY valid JSON (no markdown, no explanation) matching the schema below:`,
        outputSchema: JSON.stringify(
          {
            summary: "string — 2-3 sentence overview of the song concept",
            genre_notes: "string — specific production notes for the genre",
            mood_notes: "string — how to achieve the target moods",
            vibe_notes: "string — detailed vibe and energy description",
            production_suggestions: ["string — production technique"],
            reference_search_hints: ["string — keywords for finding reference songs"],
          },
          null,
          2
        ),
      };

    case "analyze_reference_song":
      return {
        instruction: `You are a music analysis assistant. Analyze the reference song for the following project.\n\n${base}\n\nReturn ONLY valid JSON (no markdown, no explanation) matching the schema below:`,
        outputSchema: JSON.stringify(
          {
            song_title: "string",
            artist: "string",
            key: "string — musical key (e.g. C major)",
            bpm: "number",
            chord_progression: "string — e.g. I-IV-V-I",
            groove_pattern: "string — rhythm description",
            production_notes: "string — notable production techniques",
            applicable_elements: ["string — elements usable in our project"],
          },
          null,
          2
        ),
      };

    case "generate_suno_prompts":
      return {
        instruction: `You are a Suno AI prompt engineer. Generate 5 optimized Suno prompt variants for the following project.\n\n${base}\n\nReturn ONLY valid JSON (no markdown, no explanation) matching the schema below:`,
        outputSchema: JSON.stringify(
          {
            basic: "string — standard Suno prompt",
            more_refreshing: "string — lighter, more upbeat variant",
            more_emotional: "string — deeper emotional variant",
            vocal_focused: "string — emphasis on vocal style",
            groove_focused: "string — emphasis on rhythm and groove",
          },
          null,
          2
        ),
      };

    case "generate_sound_keywords":
      return {
        instruction: `You are a sound design assistant. Generate sound search keywords for the following project.\n\n${base}\n\nReturn ONLY valid JSON (no markdown, no explanation) matching the schema below:`,
        outputSchema: JSON.stringify(
          {
            drums: ["string — drum sound keywords"],
            bass: ["string — bass sound keywords"],
            melody: ["string — melodic element keywords"],
            harmony: ["string — harmonic/chord keywords"],
            fx: ["string — effects and atmosphere keywords"],
            vocal: ["string — vocal style keywords"],
          },
          null,
          2
        ),
      };

    case "refine_suno_prompt":
      return {
        instruction: `You are a Suno prompt refinement specialist. Refine the existing prompt based on feedback for the following project.\n\n${base}\n\nReturn ONLY valid JSON (no markdown, no explanation) matching the schema below:`,
        outputSchema: JSON.stringify(
          {
            refined_prompt: "string — the improved Suno prompt",
            changes_made: ["string — description of each change"],
            reasoning: "string — why these changes improve the result",
          },
          null,
          2
        ),
      };

    case "generate_chord_progression": {
      const keyHint = track.key ? `Key: ${track.key}` : "";
      const bpmHint = track.bpm ? `BPM: ${track.bpm}` : "";
      const chordExtra = [keyHint, bpmHint].filter(Boolean).join("\n");
      return {
        instruction: `You are a music theory expert. Generate 3 chord progressions for the following track.\n\n${base}${chordExtra ? "\n" + chordExtra : ""}\n\nReturn ONLY valid JSON (no markdown, no explanation) matching the schema below:`,
        outputSchema: JSON.stringify(
          {
            progressions: [
              {
                name: "string — short descriptive name (e.g. 'Dark Minor Loop')",
                chords: ["string — chord names using standard notation (e.g. Cm, Fm, Ab, Bb)"],
                key: "string — root key (e.g. C)",
                mode: "major | minor",
                bpm: "number | null — suggested BPM",
                description: "string — brief description of the mood/feel",
              },
            ],
          },
          null,
          2
        ),
      };
    }

    case "generate_reference_brief": {
      const artist = (extra?.artist as string) ?? "";
      const songTitle = (extra?.songTitle as string) ?? "";
      const userFocus = Array.isArray(extra?.userFocus) ? (extra.userFocus as string[]) : [];
      const userNotes = (extra?.userNotes as string) ?? "";
      const focusStr = userFocus.length > 0 ? `Focus areas: ${userFocus.join(", ")}` : "";
      const notesStr = userNotes ? `User notes: ${userNotes}` : "";
      const refContext = [
        `Reference Song: ${artist} - ${songTitle}`,
        focusStr,
        notesStr,
        base,
      ]
        .filter(Boolean)
        .join("\n");
      return {
        instruction: `당신은 음악 프로듀서 어시스턴트입니다. 레퍼런스 곡 분석 브리프를 한국어로 작성해주세요.\n\n${refContext}\n\n위 레퍼런스 곡의 음악적 특성을 분석하여 초보 작곡가도 이해할 수 있는 브리프를 작성하세요. 악보나 MIDI 없이 곡 제목만으로 추론한 내용임을 disclaimer에 명시해주세요.\n\nReturn ONLY valid JSON (no markdown, no explanation) matching the schema below:`,
        outputSchema: JSON.stringify(
          {
            summary: "string — 2-3문장으로 이 곡의 전반적인 음악적 특성 요약",
            genreTags: ["string — 장르 태그 (예: K-pop, EDM, R&B)"],
            moodTags: ["string — 분위기 태그 (예: 신나는, 몽환적, 감성적)"],
            productionTraits: ["string — 프로덕션 특성 (예: 8비트 그루브, 레이어드 신스)"],
            rhythmTraits: ["string — 리듬 특성"],
            harmonyTraits: ["string — 화성 특성"],
            bassTraits: ["string — 베이스 특성"],
            toplineTraits: ["string — 탑라인 특성"],
            vocalTraits: ["string — 보컬 특성"],
            soundTextureTraits: ["string — 사운드 텍스처 특성"],
            arrangementTraits: ["string — 편곡 특성"],
            sourceMode: "ai_knowledge",
            sourceNotes: ["string — 분석 근거 메모"],
            disclaimer: "string — AI 추론 기반임을 명시하는 한국어 면책 문구",
            confidence: "low | medium | high",
          },
          null,
          2
        ),
      };
    }

    case "generate_track_plan": {
      const brief = extra?.referenceBrief as Record<string, unknown> | undefined;
      const briefContext = brief
        ? [
            `Reference Brief:`,
            `  Artist: ${brief.artist as string} - ${brief.songTitle as string}`,
            `  Summary: ${brief.summary as string}`,
            `  Genre: ${(brief.genreTags as string[])?.join(", ")}`,
            `  Mood: ${(brief.moodTags as string[])?.join(", ")}`,
            `  Production: ${(brief.productionTraits as string[])?.join(", ")}`,
          ].join("\n")
        : "";
      const planContext = [briefContext, base].filter(Boolean).join("\n\n");
      return {
        instruction: `당신은 음악 프로듀서 코치입니다. 레퍼런스 브리프를 바탕으로 내 트랙의 제작 방향 플랜을 한국어로 작성해주세요. 원곡을 복제하는 것이 아니라 비슷한 에너지와 제작 원리로 시작할 수 있는 가이드를 작성해주세요.\n\n${planContext}\n\nReturn ONLY valid JSON (no markdown, no explanation) matching the schema below:`,
        outputSchema: JSON.stringify(
          {
            title: "string — 트랙 플랜 제목",
            directionSummary: "string — 2-3문장 제작 방향 요약",
            bpmSuggestions: ["number — 추천 BPM (2-3개)"],
            keySuggestions: ["string — 추천 키 (예: C major, A minor)"],
            chordProgressionSuggestions: [
              {
                name: "string — 코드 진행 이름",
                chords: ["string — 코드 (예: Am, F, C, G)"],
                key: "string",
                mode: "major | minor",
              },
            ],
            grooveSuggestions: [
              {
                name: "string — 그루브 패턴 이름",
                description: "string — 그루브 설명",
              },
            ],
            bassDirection: {
              summary: "string",
              rootMotionIdeas: ["string"],
              rhythmIdeas: ["string"],
              beginnerTips: ["string"],
            },
            toplineDirection: {
              summary: "string",
              hookIdeas: ["string"],
              rhythmIdeas: ["string"],
              vocalToneIdeas: ["string"],
              sunoTips: ["string"],
            },
            soundKeywords: {
              drums: ["string"],
              bass: ["string"],
              melody: ["string"],
              harmony: ["string"],
              fx: ["string"],
              vocal: ["string"],
            },
            arrangementNotes: {
              intro: "string",
              verse: "string",
              chorus: "string",
            },
            beginnerExplanation: "string — 초보 작곡가를 위한 쉬운 설명",
            disclaimer: "string — AI 추론 기반 면책 문구",
            confidence: "low | medium | high",
          },
          null,
          2
        ),
      };
    }

    case "generate_learning_missions": {
      const plan = extra?.trackPlan as Record<string, unknown> | undefined;
      const planContext = plan
        ? [
            `Track Plan:`,
            `  Title: ${plan.title as string}`,
            `  Direction: ${plan.directionSummary as string}`,
            `  BPM: ${(plan.bpmSuggestions as number[])?.join(", ")}`,
            `  Key: ${(plan.keySuggestions as string[])?.join(", ")}`,
          ].join("\n")
        : "";
      const missionsContext = [planContext, base].filter(Boolean).join("\n\n");
      return {
        instruction: `당신은 음악 제작 코치입니다. 트랙 플랜을 바탕으로 초보 작곡가를 위한 단계별 학습 미션을 한국어로 작성해주세요. 미션은 구체적이고 실행 가능해야 합니다.\n\n${missionsContext}\n\nReturn ONLY valid JSON (no markdown, no explanation) matching the schema below:`,
        outputSchema: JSON.stringify(
          {
            missions: [
              {
                category: "harmony | drums | bass | topline | sound_design | arrangement",
                title: "string — 미션 제목",
                objective: "string — 이 미션의 목표",
                explanation: "string — 배경 설명",
                task: "string — 구체적인 실행 과제",
                beginnerHint: "string — 초보자를 위한 힌트",
                expectedOutput: "string — 기대 결과물 설명",
              },
            ],
          },
          null,
          2
        ),
      };
    }
  }
}

export function buildCopyablePrompt(task: AgentTask, track: Track, album: Album): string {
  const { instruction, outputSchema } = buildPrompt(task, track, album);
  return `${instruction}\n\n${outputSchema}`;
}

export function buildAgentRequestPayload(
  task: AgentTask,
  track: Track,
  album: Album
): Omit<AgentRequest, "id" | "createdAt"> {
  const { instruction, outputSchema } = buildPrompt(task, track, album);
  return {
    provider: "manual",
    task,
    input: { albumId: album.id, trackId: track.id, title: track.title },
    outputSchema,
    instruction,
  };
}
