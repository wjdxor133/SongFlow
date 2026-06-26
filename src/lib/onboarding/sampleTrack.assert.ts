/**
 * 런타임 구조 검증 — 테스트 러너 없이 GUIDED_SAMPLE 형상을 검증합니다.
 *
 * 사용법:
 *   import { assertGuidedSample } from "./sampleTrack.assert";
 *   assertGuidedSample(); // 개발 환경 초기화 시 호출
 *
 * NOTE: 프로젝트에 vitest/jest가 설정되면 이 파일을 *.test.ts로 전환하세요.
 */

import { GUIDED_SAMPLE } from "./sampleTrack";

function assert(condition: boolean, message: string): void {
  if (!condition) {
    throw new Error(`[assertGuidedSample] ${message}`);
  }
}

export function assertGuidedSample(): void {
  const s = GUIDED_SAMPLE;

  // 최상위 키 존재 여부
  assert("bakedBrief" in s, "bakedBrief 필드가 없습니다");
  assert("bakedPlan" in s, "bakedPlan 필드가 없습니다");
  assert("bakedChords" in s, "bakedChords 필드가 없습니다");
  assert("bakedGroove" in s, "bakedGroove 필드가 없습니다");
  assert("bakedMissions" in s, "bakedMissions 필드가 없습니다");
  assert("bakedPrompt" in s, "bakedPrompt 필드가 없습니다");

  // bakedBrief 핵심 필드
  assert(typeof s.bakedBrief.id === "string" && s.bakedBrief.id.length > 0, "bakedBrief.id가 비어있습니다");
  assert(typeof s.bakedBrief.artist === "string" && s.bakedBrief.artist.length > 0, "bakedBrief.artist가 비어있습니다");
  assert(typeof s.bakedBrief.summary === "string" && s.bakedBrief.summary.length > 0, "bakedBrief.summary가 비어있습니다");
  assert(typeof s.bakedBrief.disclaimer === "string" && s.bakedBrief.disclaimer.length > 0, "bakedBrief.disclaimer가 비어있습니다");
  assert(["low", "medium", "high"].includes(s.bakedBrief.confidence), "bakedBrief.confidence가 유효하지 않습니다");

  // bakedPlan 핵심 필드
  assert(typeof s.bakedPlan.id === "string" && s.bakedPlan.id.length > 0, "bakedPlan.id가 비어있습니다");
  assert(s.bakedPlan.bpmSuggestions.length > 0, "bakedPlan.bpmSuggestions가 비어있습니다");
  assert(s.bakedPlan.keySuggestions.length > 0, "bakedPlan.keySuggestions가 비어있습니다");
  assert(s.bakedPlan.chordProgressionSuggestions.length >= 2, "bakedPlan.chordProgressionSuggestions가 2개 미만입니다");
  assert(s.bakedPlan.grooveSuggestions.length >= 2, "bakedPlan.grooveSuggestions가 2개 미만입니다");
  assert(typeof s.bakedPlan.beginnerExplanation === "string" && s.bakedPlan.beginnerExplanation.length > 0, "bakedPlan.beginnerExplanation이 비어있습니다");

  // bakedChords — 각 항목의 chords가 비어있지 않은 string[]
  assert(s.bakedChords.length > 0, "bakedChords가 비어있습니다");
  for (const cp of s.bakedChords) {
    assert(Array.isArray(cp.chords) && cp.chords.length > 0, `코드 진행 '${cp.name}'의 chords가 비어있습니다`);
    assert(cp.chords.every((c) => typeof c === "string"), `코드 진행 '${cp.name}'의 chords 항목이 string이 아닙니다`);
  }

  // bakedGroove
  assert(s.bakedGroove.length > 0, "bakedGroove가 비어있습니다");

  // bakedMissions — 1~2개, completed:false
  assert(s.bakedMissions.length >= 1 && s.bakedMissions.length <= 2, `bakedMissions 길이(${s.bakedMissions.length})가 1~2가 아닙니다`);
  for (const m of s.bakedMissions) {
    assert(m.completed === false, `미션 '${m.title}'의 completed가 false가 아닙니다`);
    assert(typeof m.title === "string" && m.title.length > 0, "미션 title이 비어있습니다");
    assert(typeof m.objective === "string" && m.objective.length > 0, "미션 objective가 비어있습니다");
  }

  // bakedPrompt — style/lyrics 비어있지 않음
  assert(typeof s.bakedPrompt.style === "string" && s.bakedPrompt.style.length > 0, "bakedPrompt.style이 비어있습니다");
  assert(typeof s.bakedPrompt.lyrics === "string" && s.bakedPrompt.lyrics.length > 0, "bakedPrompt.lyrics가 비어있습니다");
}
