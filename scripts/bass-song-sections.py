#!/usr/bin/env python3
"""Tongue-Tied (ref: Super Shy) 섹션별 베이스 생성기.

각 섹션(Chorus/Verse/Pre/Bridge)의 코드 진행에 맞춰 베이스라인을 만들고,
  (1) exports/bass/tonguetied_<section>_150bpm.mid  (Arrangement 드래그용)
  (2) exports/bass/tonguetied_bass_ableton.json      (MCP add_notes_to_clip용)
를 동시에 출력한다.

리서치 반영(GigaMIDI DNVR/NOMML, RenCon 2025 '벨로시티 폭이 지각 품질의 최강 변수'):
  - 벨로시티 표준편차 확대(0.06→0.09) + 노트별 base 미세 변주 → 고유 벨로시티 수 증가
  - 다운비트 포함 전 노트에 미세 타이밍 편차(고유 온셋 편차 ↑)
  - "minimal sub bass" 지시 반영: 과밀하지 않게, 바운스감 위주
장르: jersey club / K-pop, 150 BPM, C minor, sub 옥타브(C2=36).
"""
import struct, random, os, json, math

TPQ = 480
BPM = 150.0
OCT = 2  # sub bass
PC = {"C":0,"Db":1,"D":2,"Eb":3,"E":4,"F":5,"Gb":6,"G":7,"Ab":8,"A":9,"Bb":10,"B":11}

def root(sym):
    m = sym[:2] if len(sym) > 1 and sym[1] in "b#" else sym[:1]
    return 12*(OCT+1) + PC[m]
def N(p,t,d,v): return {"pitch":p,"start":t,"dur":d,"vel":v}

# ── 섹션 정의: (progression, style, bars) ──
SECTIONS = {
    "Chorus": (["Cm","Ab","Eb","Bb"], "jerseypop", 8),   # 강한 바운스
    "Verse":  (["Cm","Fm","Ab","Bb"], "sparse",    8),   # 미니멀·여백
    "Pre":    (["Ab","Bb","Cm","Cm"], "build",     4),   # 상승 빌드
    "Bridge": (["Cm","Eb","Bb","Ab"], "color",     8),   # 하강 컬러
}

# r=이번 마디 루트, nx=다음 마디 루트, t=마디 시작 beat, b=마디 번호(0-base)
def s_jerseypop(r, nx, t, b):
    # jersey 킥 락(0 / 1.5 / 2.5) + 짝수마디 옥타브 팝 + 어프로치
    out = [N(r,t,0.9,102), N(r,t+1.5,0.7,90), N(r,t+2.5,0.7,96)]
    if b % 2 == 1:
        out += [N(r+12,t+3.25,0.35,99), N(nx-1,t+3.6,0.3,72)]  # 옥타브 팝 + 리딩톤
    else:
        out += [N(r,t+3.25,0.35,84)]
    return out

def s_sparse(r, nx, t, b):
    # 루트 지속 + 3박 여백, 짝수마다 고스트/리딩
    out = [N(r,t,1.4,86), N(r,t+2.0,0.9,80)]
    if b % 2 == 1:
        out += [N(r,t+2.75,0.18,48), N(nx-1,t+3.5,0.4,70)]  # 고스트 + 다음 루트로 리딩
    return out

def s_build(r, nx, t, b):
    # 8분 펄스가 마디 진행하며 촘촘해짐(빌드업)
    dens = 4 + b  # b=0..3 → 4,5,6,7 히트
    out = []
    for i in range(dens):
        st = t + i*(4.0/dens)
        v = 78 + int(i*(30/max(1,dens-1)))   # 점점 세짐
        out.append(N(r, st, (4.0/dens)*0.85, min(112, v)))
    if b == 3:  # 마지막 마디 끝 옥타브 킥 → 코러스 진입
        out.append(N(r+12, t+3.5, 0.4, 108))
    return out

def s_color(r, nx, t, b):
    # 트레시요(3-3-2) + 어프로치, 다운비트 강조로 하강 컬러 부각
    out = [N(r,t,1.1,96), N(r,t+1.5,1.0,88), N(r,t+3.0,0.9,92)]
    if b % 2 == 1:
        out += [N(r+7,t+2.5,0.35,66), N(nx-1,t+3.6,0.3,70)]  # 5도 경유 + 리딩
    return out

STYLES = {"jerseypop":s_jerseypop, "sparse":s_sparse, "build":s_build, "color":s_color}

def humanize(notes, seed):
    """벨로시티 폭↑ + 고유값↑ + 전 노트 미세 타이밍(다운비트는 타이트)."""
    rnd = random.Random(seed)
    beat_ms = 60000.0 / BPM
    out = []
    for n in notes:
        on_grid = abs(n["start"] - round(n["start"])) < 1e-6
        downbeat = on_grid and (round(n["start"]) % 4 == 0)
        # 타이밍: 다운비트 ±2ms, 온그리드 ±4ms, 오프비트는 +5~12ms(포켓, 뒤로)
        if downbeat:      off = rnd.uniform(-2, 3)/beat_ms
        elif on_grid:     off = rnd.uniform(-3, 5)/beat_ms
        else:             off = rnd.uniform(5, 12)/beat_ms
        # 벨로시티: sd 0.09 가우시안 + ±3 정수 지터(고유값 분산)
        v = n["vel"] * rnd.gauss(1.0, 0.09) + rnd.uniform(-3, 3)
        v = max(24, min(120, int(round(v))))
        out.append(N(n["pitch"], max(0.0, round(n["start"]+off, 4)), n["dur"], v))
    return out

def build_section(name):
    prog, style, bars = SECTIONS[name]
    roots = [root(s) for s in prog]
    fn = STYLES[style]
    notes = []
    for b in range(bars):
        r  = roots[b % len(roots)]
        nx = roots[(b+1) % len(roots)]
        notes += fn(r, nx, b*4.0, b)
    return humanize(notes, seed=hash(name) & 0xFFFF)

# ── MIDI writer ──
def vlq(n):
    n = max(0, int(n))
    out = bytearray([n & 0x7F]); n >>= 7
    while n: out.insert(0, (n & 0x7F)|0x80); n >>= 7
    return bytes(out)

def write_midi(notes, path):
    ev = []
    for n in notes:
        on = int(round(n["start"]*TPQ)); off = int(round((n["start"]+n["dur"])*TPQ))
        ev.append((on,1,n["pitch"],n["vel"])); ev.append((max(on+1,off),0,n["pitch"],0))
    ev.sort(key=lambda e:(e[0],e[1]))
    body = bytearray()
    body += vlq(0)+bytes([0xFF,0x51,0x03])+struct.pack(">I",int(60_000_000/BPM))[1:]
    prev=0
    for tick,on,p,v in ev:
        body += vlq(tick-prev)+bytes([(0x90 if on else 0x80),p,v]); prev=tick
    body += vlq(0)+bytes([0xFF,0x2F,0x00])
    trk = b"MTrk"+struct.pack(">I",len(body))+bytes(body)
    with open(path,"wb") as f:
        f.write(b"MThd"+struct.pack(">IHHH",6,0,1,TPQ)+trk)

def main():
    out_dir = "exports/bass"
    os.makedirs(out_dir, exist_ok=True)
    ableton = {}
    for name in SECTIONS:
        notes = build_section(name)
        path = os.path.join(out_dir, f"tonguetied_{name.lower()}_150bpm.mid")
        write_midi(notes, path)
        # Ableton add_notes_to_clip 포맷
        ableton[name] = {
            "length_beats": SECTIONS[name][2]*4,
            "progression": SECTIONS[name][0],
            "notes": [{"pitch":n["pitch"],"start_time":n["start"],
                       "duration":round(n["dur"],4),"velocity":n["vel"],"mute":False}
                      for n in notes],
        }
        uniq = len(set(n["vel"] for n in notes))
        print(f"✅ {path}  ({len(notes)}노트, 고유벨로시티 {uniq}개)")
    with open(os.path.join(out_dir,"tonguetied_bass_ableton.json"),"w") as f:
        json.dump(ableton, f, ensure_ascii=False, indent=1)
    print(f"📄 exports/bass/tonguetied_bass_ableton.json 저장")

if __name__ == "__main__":
    main()
