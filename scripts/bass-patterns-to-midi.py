#!/usr/bin/env python3
"""베이스 연주 스타일별 .mid 생성기 (스파이크 검증 레시피).

사용: python3 scripts/bass-patterns-to-midi.py --key Cm --bpm 150 \
        --out-dir exports/bass --name tonguetied Cm Ab Eb Bb

스타일 6종을 각각 별도 .mid로 출력 → DAW에 드래그해서 비교 청취.
  whole      온음표 (자리 표시)
  sparse     스파스 트레시요 (0/3박, 여백) — Verse용
  tresillo   3-3-2 풀 + 고스트 — Afrobeats
  octpop     트레시요 + 옥타브 팝 + 어프로치 — Afrobeats Chorus용
  jersey     Jersey club 킥 락 (0/1.5/2.5박)
  jerseypop  jersey + 옥타브 팝(3.25박) + 어프로치
휴먼라이즈(벨로시티 지터, 오프비트 뒤로) 기본 내장 (--no-humanize로 끔).
"""
import argparse, struct, random, re, os

TPQ = 480
PC = {"C":0,"C#":1,"Db":1,"D":2,"D#":3,"Eb":3,"E":4,"F":5,"F#":6,"Gb":6,
      "G":7,"G#":8,"Ab":8,"A":9,"A#":10,"Bb":10,"B":11}

def root_of(sym):
    m = re.match(r"([A-G][#b]?)", sym)
    if not m: raise ValueError(f"코드 인식 실패: {sym}")
    return PC[m.group(1)]

def vlq(n):
    out = bytearray([n & 0x7F]); n >>= 7
    while n: out.insert(0, (n & 0x7F) | 0x80); n >>= 7
    return bytes(out)

def N(p, t, d, v): return {"pitch": p, "start": t, "dur": d, "vel": v}

# ── 스타일 레시피 (r=루트, nx=다음 루트, t=마디 시작 beat, b=마디 번호) ──
def style_whole(r, nx, t, b):  return [N(r,t,4.0,90)]
def style_sparse(r, nx, t, b):
    out = [N(r,t,1.2,88), N(r,t+3.0,0.75,82)]
    if b % 2 == 1: out += [N(r,t+2.75,0.2,50), N(nx-1,t+3.5,0.45,76)]
    return out
def style_tresillo(r, nx, t, b):
    return [N(r,t,1.2,96), N(r,t+1.5,1.1,90), N(r,t+2.75,0.2,52), N(r,t+3.0,0.8,93)]
def style_octpop(r, nx, t, b):
    if b % 2 == 0: return [N(r,t,1.2,100), N(r,t+1.5,1.1,94), N(r+12,t+3.0,0.9,100)]
    return [N(r,t,1.2,100), N(r,t+1.25,0.2,55), N(r,t+1.5,1.1,92),
            N(r+7,t+2.5,0.4,70), N(r+12,t+3.0,0.55,96), N(nx-1,t+3.5,0.45,78)]
def style_jersey(r, nx, t, b):
    return [N(r,t,1.0,98), N(r,t+1.5,0.75,92), N(r,t+2.5,1.0,94)]
def style_jerseypop(r, nx, t, b):
    out = [N(r,t,1.0,100), N(r,t+1.5,0.75,92), N(r,t+2.5,0.75,94)]
    if b % 2 == 1: out += [N(r+12,t+3.25,0.4,98), N(nx-1,t+3.6,0.35,74)]
    return out

STYLES = {"whole":style_whole, "sparse":style_sparse, "tresillo":style_tresillo,
          "octpop":style_octpop, "jersey":style_jersey, "jerseypop":style_jerseypop}

def humanize(notes, bpm, seed=42):
    rnd = random.Random(seed)
    beat_ms = 60000.0 / bpm
    out = []
    for n in notes:
        frac = round(n["start"] % 1.0, 3)
        tight = frac == 0.0 and n["start"] % 4.0 == 0.0
        off = rnd.uniform(0, 4/beat_ms) if tight else rnd.uniform(5/beat_ms, 12/beat_ms)
        vel = max(25, min(127, int(n["vel"] * rnd.gauss(1.0, 0.06))))
        out.append(N(n["pitch"], n["start"]+off, n["dur"], vel))
    return out

def write_midi(notes, bpm, path):
    ev = []  # (abs_tick, on?, pitch, vel) — off를 먼저 정렬되게 on=1/off=0
    for n in notes:
        on = int(round(n["start"] * TPQ)); off = int(round((n["start"]+n["dur"]) * TPQ))
        ev.append((on, 1, n["pitch"], n["vel"])); ev.append((max(on+1, off), 0, n["pitch"], 0))
    ev.sort(key=lambda e: (e[0], e[1]))
    body = bytearray()
    tempo = int(60_000_000 / bpm)
    body += vlq(0) + bytes([0xFF, 0x51, 0x03]) + struct.pack(">I", tempo)[1:]
    prev = 0
    for tick, on, p, v in ev:
        body += vlq(tick - prev) + bytes([(0x90 if on else 0x80), p, v])
        prev = tick
    body += vlq(0) + bytes([0xFF, 0x2F, 0x00])
    trk = b"MTrk" + struct.pack(">I", len(body)) + bytes(body)
    hdr = b"MThd" + struct.pack(">IHHH", 6, 0, 1, TPQ)
    with open(path, "wb") as f: f.write(hdr + trk)

def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("chords", nargs="+")
    ap.add_argument("--bpm", type=float, default=150)
    ap.add_argument("--key", default="")          # 파일명 표기용
    ap.add_argument("--bass-octave", type=int, default=2)
    ap.add_argument("--bars", type=int, default=8)
    ap.add_argument("--styles", default="all")
    ap.add_argument("--name", default="bass")
    ap.add_argument("--out-dir", default="exports/bass")
    ap.add_argument("--no-humanize", action="store_true")
    a = ap.parse_args()

    roots = [12*(a.bass_octave+1) + root_of(s) for s in a.chords]
    picked = STYLES if a.styles == "all" else {k: STYLES[k] for k in a.styles.split(",")}
    os.makedirs(a.out_dir, exist_ok=True)
    for sname, fn in picked.items():
        notes = []
        for b in range(a.bars):
            r, nx = roots[b % len(roots)], roots[(b+1) % len(roots)]
            notes += fn(r, nx, b*4.0, b)
        if not a.no_humanize: notes = humanize(notes, a.bpm)
        path = os.path.join(a.out_dir, f"{a.name}_{sname}_{int(a.bpm)}bpm.mid")
        write_midi(notes, a.bpm, path)
        print(f"✅ {path}  ({len(notes)}노트, {a.bars}마디)")

if __name__ == "__main__":
    main()
