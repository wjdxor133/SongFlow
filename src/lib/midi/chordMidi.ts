// chordMidi.ts — 코드 진행을 2트랙(Bass + Chords) Standard MIDI File 바이트로 변환.
// 브라우저/WKWebView에서 동작하도록 Uint8Array만 사용(Node Buffer 의존 없음).
// 서버측 mcp-server/src/midi.ts 와 동일한 로직(보이싱/노트 번호 일치).

const PC: Record<string, number> = { C: 0, D: 2, E: 4, F: 5, G: 7, A: 9, B: 11 };
const TPQ = 480; // ticks per quarter note

const QUALITIES: Record<string, number[]> = {
  "": [0, 4, 7], maj: [0, 4, 7], M: [0, 4, 7],
  m: [0, 3, 7], min: [0, 3, 7], "-": [0, 3, 7],
  maj7: [0, 4, 7, 11], M7: [0, 4, 7, 11], Maj7: [0, 4, 7, 11],
  m7: [0, 3, 7, 10], min7: [0, 3, 7, 10], "-7": [0, 3, 7, 10],
  "7": [0, 4, 7, 10], dom7: [0, 4, 7, 10],
  dim: [0, 3, 6], dim7: [0, 3, 6, 9], o: [0, 3, 6],
  m7b5: [0, 3, 6, 10], "ø": [0, 3, 6, 10], min7b5: [0, 3, 6, 10],
  sus2: [0, 2, 7], sus4: [0, 5, 7], sus: [0, 5, 7],
  aug: [0, 4, 8], "+": [0, 4, 8],
  "6": [0, 4, 7, 9], m6: [0, 3, 7, 9], min6: [0, 3, 7, 9],
  add9: [0, 4, 7, 14], madd9: [0, 3, 7, 14],
};

function parsePc(name: string): { pc: number; end: number } {
  const m = /^([A-Ga-g])([#b]?)/.exec(name);
  if (!m) throw new Error(`음 이름 인식 실패: ${name}`);
  let pc = PC[m[1].toUpperCase()];
  if (m[2] === "#") pc += 1;
  else if (m[2] === "b") pc -= 1;
  return { pc: ((pc % 12) + 12) % 12, end: m[0].length };
}

function parseChord(symRaw: string, seventh: boolean) {
  let sym = symRaw.trim();
  let bassOverride: number | null = null;
  if (sym.includes("/")) {
    const [head, slash] = sym.split("/", 2);
    bassOverride = parsePc(slash.trim()).pc;
    sym = head;
  }
  const { pc: rootPc, end } = parsePc(sym);
  const qual = sym.slice(end);
  if (!(qual in QUALITIES)) throw new Error(`코드 인식 실패: ${symRaw}`);
  const intervals = [...QUALITIES[qual]];
  if (seventh && intervals.length === 3) {
    if (intervals.includes(4)) intervals.push(11);
    else if (intervals.includes(3) && intervals.includes(7)) intervals.push(10);
  }
  return { rootPc, bassPc: bassOverride ?? rootPc, intervals };
}

function vlq(n: number): number[] {
  const out = [n & 0x7f];
  n >>= 7;
  while (n > 0) {
    out.unshift((n & 0x7f) | 0x80);
    n >>= 7;
  }
  return out;
}

function trackChunk(events: { delta: number; data: number[] }[]): number[] {
  const body: number[] = [];
  for (const { delta, data } of events) body.push(...vlq(delta), ...data);
  body.push(...vlq(0), 0xff, 0x2f, 0x00);
  const len = body.length;
  return [0x4d, 0x54, 0x72, 0x6b, (len >> 24) & 0xff, (len >> 16) & 0xff, (len >> 8) & 0xff, len & 0xff, ...body];
}

function metaName(text: string): { delta: number; data: number[] } {
  const bytes = [...new TextEncoder().encode(text)];
  return { delta: 0, data: [0xff, 0x03, ...vlq(bytes.length), ...bytes] };
}

function noteEvents(bars: number[][], barTicks: number, channel: number, velocity: number) {
  const ev: { delta: number; data: number[] }[] = [];
  for (const notes of bars) {
    notes.forEach((n) => ev.push({ delta: 0, data: [0x90 | channel, n, velocity] }));
    notes.forEach((n, j) => ev.push({ delta: j === 0 ? barTicks : 0, data: [0x80 | channel, n, 0] }));
  }
  return ev;
}

export interface ChordMidiOptions {
  key?: string;
  bpm?: number;
  barsPerChord?: number;
  repeat?: number;
  seventh?: boolean;
  bassOctave?: number;
  chordOctave?: number;
}

/** 코드 진행을 .mid 바이트(Uint8Array)로 반환 */
export function buildChordMidi(chords: string[], opts: ChordMidiOptions = {}): Uint8Array {
  const {
    key = "C", bpm = 104, barsPerChord = 1, repeat = 2,
    seventh = false, bassOctave = 2, chordOctave = 3,
  } = opts;
  if (chords.length === 0) throw new Error("코드가 비어 있습니다");

  const barTicks = TPQ * 4 * barsPerChord;
  const bassBars: number[][] = [];
  const chordBars: number[][] = [];
  const sequence: string[] = [];
  for (let r = 0; r < repeat; r++) sequence.push(...chords);
  for (const sym of sequence) {
    const pc = parseChord(sym, seventh);
    bassBars.push([12 * (bassOctave + 1) + pc.bassPc]);
    chordBars.push(pc.intervals.map((iv) => 12 * (chordOctave + 1) + pc.rootPc + iv));
  }

  const upq = Math.round(60_000_000 / bpm);
  const tempoTrack = [
    metaName(`${key} ${chords.join(" ")} @ ${Math.round(bpm)}bpm`),
    { delta: 0, data: [0xff, 0x51, 0x03, (upq >> 16) & 0xff, (upq >> 8) & 0xff, upq & 0xff] },
    { delta: 0, data: [0xff, 0x58, 0x04, 4, 2, 24, 8] },
  ];

  const header = [0x4d, 0x54, 0x68, 0x64, 0, 0, 0, 6, 0, 1, 0, 3, (TPQ >> 8) & 0xff, TPQ & 0xff];
  return Uint8Array.from([
    ...header,
    ...trackChunk(tempoTrack),
    ...trackChunk([metaName("Bass"), ...noteEvents(bassBars, barTicks, 0, 100)]),
    ...trackChunk([metaName("Chords"), ...noteEvents(chordBars, barTicks, 1, 80)]),
  ]);
}

export function sanitizeFilename(s: string): string {
  return s.replace(/[^\w.-]+/g, "_").replace(/_+/g, "_").replace(/^_|_$/g, "").slice(0, 80) || "progression";
}

const NOTE_NAMES = ["C", "C#", "D", "D#", "E", "F", "F#", "G", "G#", "A", "A#", "B"];

/** MIDI 노트 번호 → 음이름 (미들 C = C4 = 60) */
export function midiToName(n: number): string {
  return `${NOTE_NAMES[((n % 12) + 12) % 12]}${Math.floor(n / 12) - 1}`;
}

/**
 * 코드 심볼 → 다운로드되는 .mid와 동일한 Bass/Chord MIDI 노트 번호.
 * 옥타브 기본값은 buildChordMidi와 일치(bass 2, chord 3). 인식 실패 시 null.
 */
export function chordToMidiNotes(
  sym: string,
  opts: { seventh?: boolean; bassOctave?: number; chordOctave?: number } = {}
): { bass: number; chord: number[] } | null {
  const { seventh = false, bassOctave = 2, chordOctave = 3 } = opts;
  try {
    const pc = parseChord(sym, seventh);
    return {
      bass: 12 * (bassOctave + 1) + pc.bassPc,
      chord: pc.intervals.map((iv) => 12 * (chordOctave + 1) + pc.rootPc + iv),
    };
  } catch {
    return null;
  }
}
