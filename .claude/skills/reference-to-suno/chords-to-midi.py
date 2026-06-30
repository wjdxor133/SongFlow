#!/usr/bin/env python3
"""
chords-to-midi.py — 코드 진행을 DAW에 바로 끌어다 쓸 수 있는 .mid 파일로 변환.

두 트랙을 만든다:
  - Track "Bass"  : 근음 1개 (옥타브 2)
  - Track "Chords": 코드 톤 쌓기 (root position, 옥타브 3)

지원 코드: C, Cm, Cmaj7, Cm7, C7, Cdim, Cm7b5, Csus2, Csus4, Caug, C6, Cm6
샵/플랫: C#, Db 등. 슬래시 코드(C/E)는 베이스를 슬래시 음으로.

사용:
  python3 chords-to-midi.py --key C --bpm 104 --out out.mid C Em Am F
  python3 chords-to-midi.py --bpm 100 --bars-per-chord 1 --repeat 2 \
      --out song.mid Cmaj7 Em7 Am7 Fmaj7
"""
import argparse, struct, re

PC = {"C":0,"D":2,"E":4,"F":5,"G":7,"A":9,"B":11}
TPQ = 480  # ticks per quarter note

QUALITIES = {
    "":      [0,4,7],        "maj":   [0,4,7],   "M":   [0,4,7],
    "m":     [0,3,7],        "min":   [0,3,7],   "-":   [0,3,7],
    "maj7":  [0,4,7,11],     "M7":    [0,4,7,11],"Maj7":[0,4,7,11],
    "m7":    [0,3,7,10],     "min7":  [0,3,7,10],"-7":  [0,3,7,10],
    "7":     [0,4,7,10],     "dom7":  [0,4,7,10],
    "dim":   [0,3,6],        "dim7":  [0,3,6,9], "o":   [0,3,6],
    "m7b5":  [0,3,6,10],     "ø":     [0,3,6,10],"min7b5":[0,3,6,10],
    "sus2":  [0,2,7],        "sus4":  [0,5,7],   "sus": [0,5,7],
    "aug":   [0,4,8],        "+":     [0,4,8],
    "6":     [0,4,7,9],      "m6":    [0,3,7,9], "min6":[0,3,7,9],
    "add9":  [0,4,7,14],     "madd9": [0,3,7,14],
}

def parse_pc(name):
    m = re.match(r"^([A-Ga-g])([#b]?)", name)
    if not m:
        raise ValueError(f"음 이름 인식 실패: {name}")
    pc = PC[m.group(1).upper()]
    if m.group(2) == "#": pc += 1
    elif m.group(2) == "b": pc -= 1
    return pc % 12, m.end()

def parse_chord(sym):
    """returns (bass_pc, [chord_pcs])"""
    sym = sym.strip()
    bass_override = None
    if "/" in sym:
        sym, slash = sym.split("/", 1)
        bass_override, _ = parse_pc(slash.strip())
    root_pc, i = parse_pc(sym)
    qual = sym[i:]
    if qual not in QUALITIES:
        raise ValueError(f"코드 품질 인식 실패: '{qual}' (코드 {sym})")
    # intervals stacked above root, not folded into one octave
    chord = [root_pc + iv for iv in QUALITIES[qual]]
    bass = bass_override if bass_override is not None else root_pc
    return bass, root_pc, chord

def vlq(n):
    """variable length quantity"""
    out = bytearray([n & 0x7F])
    n >>= 7
    while n:
        out.insert(0, (n & 0x7F) | 0x80)
        n >>= 7
    return bytes(out)

def track_chunk(events):
    body = bytearray()
    for delta, data in events:
        body += vlq(delta) + data
    body += vlq(0) + bytes([0xFF, 0x2F, 0x00])  # end of track
    return b"MTrk" + struct.pack(">I", len(body)) + bytes(body)

def note_events(notes_per_bar, bar_ticks, channel, velocity):
    """notes_per_bar: list of lists of MIDI note numbers (one per bar)"""
    ev = []
    for notes in notes_per_bar:
        for j, n in enumerate(notes):
            ev.append((0, bytes([0x90 | channel, n, velocity])))
        # hold for bar, then release all
        for j, n in enumerate(notes):
            delta = bar_ticks if j == 0 else 0
            ev.append((delta, bytes([0x80 | channel, n, 0])))
    return ev

def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("chords", nargs="+")
    ap.add_argument("--key", default="C")
    ap.add_argument("--bpm", type=float, default=104)
    ap.add_argument("--bars-per-chord", type=int, default=1)
    ap.add_argument("--repeat", type=int, default=2)
    ap.add_argument("--bass-octave", type=int, default=2)
    ap.add_argument("--chord-octave", type=int, default=3)
    ap.add_argument("--out", default="progression.mid")
    a = ap.parse_args()

    bar_ticks = TPQ * 4 * a.bars_per_chord  # assume 4/4
    bass_bars, chord_bars = [], []
    summary = []
    for sym in a.chords * a.repeat:
        bass_pc, root_pc, chord_pcs = parse_chord(sym)
        bass_note = 12 * (a.bass_octave + 1) + bass_pc      # C2 -> 36
        chord_notes = [12 * (a.chord_octave + 1) + pc for pc in chord_pcs]
        bass_bars.append([bass_note])
        chord_bars.append(chord_notes)
        if len(summary) < len(a.chords):
            summary.append((sym, bass_note, chord_notes))

    # tempo track
    upq = int(round(60_000_000 / a.bpm))
    tempo = [(0, bytes([0xFF, 0x51, 0x03]) + struct.pack(">I", upq)[1:])]
    tempo.append((0, bytes([0xFF, 0x58, 0x04, 4, 2, 24, 8])))  # 4/4
    name = f"{a.key} {' '.join(a.chords)} @ {a.bpm:.0f}bpm".encode()
    tempo.insert(0, (0, bytes([0xFF, 0x03, len(name)]) + name))

    tracks = [
        track_chunk(tempo),
        track_chunk([(0, bytes([0xFF, 0x03, 4]) + b"Bass")] +
                    note_events(bass_bars, bar_ticks, 0, 100)),
        track_chunk([(0, bytes([0xFF, 0x03, 6]) + b"Chords")] +
                    note_events(chord_bars, bar_ticks, 1, 80)),
    ]
    header = b"MThd" + struct.pack(">IHHH", 6, 1, len(tracks), TPQ)
    with open(a.out, "wb") as f:
        f.write(header + b"".join(tracks))

    print(f"✅ {a.out}  ({a.key}, {a.bpm:.0f}bpm, {len(a.chords)}코드 ×{a.repeat}회)")
    print("   코드별 MIDI 노트 (Bass / Chord):")
    for sym, b, ch in summary:
        print(f"   {sym:7} bass {b:3}   chord {ch}")

if __name__ == "__main__":
    main()
