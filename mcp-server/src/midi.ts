// midi.ts — 코드 진행을 2트랙(Bass + Chords) Standard MIDI File(.mid)로 변환.
// 외부 의존성 없이 raw 바이트로 SMF Type-1 파일을 생성한다.

const PC: Record<string, number> = { C: 0, D: 2, E: 4, F: 5, G: 7, A: 9, B: 11 };
const TPQ = 480; // ticks per quarter note

// 코드 품질 → 루트 기준 반음 간격
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

export type ParsedChord = { sym: string; rootPc: number; bassPc: number; intervals: number[] };

export function parseChord(symRaw: string, seventh = false): ParsedChord {
  let sym = symRaw.trim();
  let bassOverride: number | null = null;
  if (sym.includes("/")) {
    const [head, slash] = sym.split("/", 2);
    bassOverride = parsePc(slash.trim()).pc;
    sym = head;
  }
  const { pc: rootPc, end } = parsePc(sym);
  const qual = sym.slice(end);
  if (!(qual in QUALITIES)) throw new Error(`코드 품질 인식 실패: '${qual}' (코드 ${symRaw})`);
  let intervals = [...QUALITIES[qual]];
  // 7th 보이싱: 순수 3화음만 자동으로 7도 추가 (major→maj7, minor→m7)
  if (seventh && intervals.length === 3) {
    if (intervals.includes(4)) intervals.push(11);      // major triad → maj7
    else if (intervals.includes(3) && intervals.includes(7)) intervals.push(10); // minor triad → m7
  }
  return { sym: symRaw.trim(), rootPc, bassPc: bassOverride ?? rootPc, intervals };
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

type Event = { delta: number; data: number[] };

function trackChunk(events: Event[]): Buffer {
  const body: number[] = [];
  for (const { delta, data } of events) body.push(...vlq(delta), ...data);
  body.push(...vlq(0), 0xff, 0x2f, 0x00); // end of track
  const len = Buffer.alloc(4);
  len.writeUInt32BE(body.length, 0);
  return Buffer.concat([Buffer.from("MTrk", "ascii"), len, Buffer.from(body)]);
}

function noteEvents(bars: number[][], barTicks: number, channel: number, velocity: number): Event[] {
  const ev: Event[] = [];
  for (const notes of bars) {
    notes.forEach((n) => ev.push({ delta: 0, data: [0x90 | channel, n, velocity] }));
    notes.forEach((n, j) => ev.push({ delta: j === 0 ? barTicks : 0, data: [0x80 | channel, n, 0] }));
  }
  return ev;
}

function metaName(text: string): Event {
  const bytes = [...Buffer.from(text, "utf8")];
  return { delta: 0, data: [0xff, 0x03, bytes.length, ...bytes] };
}

export type MidiOptions = {
  key?: string;
  bpm?: number;
  barsPerChord?: number;
  repeat?: number;
  seventh?: boolean;
  bassOctave?: number;
  chordOctave?: number;
};

export type MidiResult = {
  buffer: Buffer;
  perChord: { sym: string; bass: number; chord: number[] }[];
};

export function buildChordMidi(chords: string[], opts: MidiOptions = {}): MidiResult {
  const {
    key = "C", bpm = 104, barsPerChord = 1, repeat = 2,
    seventh = false, bassOctave = 2, chordOctave = 3,
  } = opts;
  if (chords.length === 0) throw new Error("코드가 비어 있습니다");

  const barTicks = TPQ * 4 * barsPerChord; // 4/4 가정
  const bassBars: number[][] = [];
  const chordBars: number[][] = [];
  const perChord: MidiResult["perChord"] = [];

  const sequence: string[] = [];
  for (let r = 0; r < repeat; r++) sequence.push(...chords);

  sequence.forEach((sym, i) => {
    const pc = parseChord(sym, seventh);
    const bassNote = 12 * (bassOctave + 1) + pc.bassPc;          // C2 -> 36
    const chordNotes = pc.intervals.map((iv) => 12 * (chordOctave + 1) + pc.rootPc + iv);
    bassBars.push([bassNote]);
    chordBars.push(chordNotes);
    if (i < chords.length) perChord.push({ sym: pc.sym, bass: bassNote, chord: chordNotes });
  });

  // tempo / meta track
  const upq = Math.round(60_000_000 / bpm);
  const tempoTrack: Event[] = [
    metaName(`${key} ${chords.join(" ")} @ ${Math.round(bpm)}bpm`),
    { delta: 0, data: [0xff, 0x51, 0x03, (upq >> 16) & 0xff, (upq >> 8) & 0xff, upq & 0xff] },
    { delta: 0, data: [0xff, 0x58, 0x04, 4, 2, 24, 8] }, // 4/4
  ];

  const header = Buffer.alloc(14);
  header.write("MThd", 0, "ascii");
  header.writeUInt32BE(6, 4);
  header.writeUInt16BE(1, 8);  // format 1
  header.writeUInt16BE(3, 10); // 3 tracks
  header.writeUInt16BE(TPQ, 12);

  const buffer = Buffer.concat([
    header,
    trackChunk(tempoTrack),
    trackChunk([metaName("Bass"), ...noteEvents(bassBars, barTicks, 0, 100)]),
    trackChunk([metaName("Chords"), ...noteEvents(chordBars, barTicks, 1, 80)]),
  ]);

  return { buffer, perChord };
}

export function sanitizeFilename(s: string): string {
  return s.replace(/[^\w.-]+/g, "_").replace(/_+/g, "_").replace(/^_|_$/g, "").slice(0, 80) || "progression";
}
