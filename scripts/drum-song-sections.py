#!/usr/bin/env python3
"""송폼 섹션별 드럼 생성기 (808/GM 맵, jersey club 계열).

임의의 BPM·송폼을 인자로 받아 섹션마다 드럼 패턴을 만들고,
  (1) --out-json  : MCP add_notes_to_clip / ableton-setup 스킬용 (기본)
  (2) --midi-dir  : 섹션별 .mid (Arrangement 수동 드래그용, 선택)
를 출력한다. 노트 타이밍은 섹션 시작(bar 0)을 0으로 하는 상대 beat이며,
절대 배치는 export_songform_layout의 startBeat이 담당한다(스킬이 오프셋).

섹션 energy는 이름으로 자동 매핑한다(--energy로 개별 오버라이드 가능):
  high  = chorus / hook / drop            → 강한 바운스 + 필/고스트
  build = pre / build / rise / lift       → 하이햇 조밀화 + 마지막 마디 스네어 롤
  mid   = verse / intro / outro / bridge  → 담백(기본값)

리서치 반영(RenCon 2025 '벨로시티 폭=지각 품질 최강 변수', GigaMIDI DNVR):
  - 하이햇 accent wave(강-약-중-약) + 미세 지터 → 고유 벨로시티↑
  - 킥/클랩 타이트(±3ms), 하이햇 살짝 느슨, 고스트 스네어 저벨로시티
  - jersey 시그니처: 킥 바운스(3-hit lock) + 마디 끝 트리플렛 필
GM/808 패드: Kick36 Snare38 Clap39 ClosedHH42 OpenHH46. 4/4 가정.
"""
import struct, random, os, json, argparse, sys

TPQ = 480
KICK, SNARE, CLAP, CHH, OHH = 36, 38, 39, 42, 46
BEATS_PER_BAR = 4  # 4/4 가정

def N(p, t, d, v): return {"pitch": p, "start": round(t, 4), "dur": d, "vel": v}

def hats_16(bar_t, base=70, accent=104, mid=86):
    """16분 클로즈햇 + accent wave(강-약-중-약)."""
    out = []
    for i in range(16):
        t = bar_t + i * 0.25
        if   i % 4 == 0: v = accent      # 정박
        elif i % 4 == 2: v = mid         # 8분 뒷박
        else:            v = base        # 16분 사이
        out.append(N(CHH, t, 0.12, v))
    return out

def kick_jersey(bar_t, b, fill=True):
    """jersey 3-hit lock(0/1.5/2.5) + 홀수마디 마디끝 트리플렛 바운스."""
    out = [N(KICK, bar_t + 0.0, 0.22, 118), N(KICK, bar_t + 1.5, 0.2, 104), N(KICK, bar_t + 2.5, 0.2, 110)]
    if fill and b % 2 == 1:  # 마디 끝 8분트리플렛 → 다음 마디로 굴러감
        out += [N(KICK, bar_t + 3.333, 0.15, 96), N(KICK, bar_t + 3.667, 0.15, 108)]
    return out

# ── energy 레벨별 섹션 패턴 ──
def pat_high(bars):
    out = []
    for b in range(bars):
        t = b * 4.0
        out += kick_jersey(t, b)
        out += [N(CLAP, t + 1.0, 0.2, 110), N(CLAP, t + 3.0, 0.2, 112)]   # 백비트 클랩 2·4
        out += hats_16(t)
        out += [N(OHH, t + 0.75, 0.25, 96), N(OHH, t + 2.75, 0.25, 92)]   # 개러지 오픈햇 셔플
        if b % 4 == 3:  # 4마디마다 고스트 스네어 픽업
            out += [N(SNARE, t + 3.5, 0.12, 54), N(SNARE, t + 3.75, 0.12, 72)]
    return out

def pat_mid(bars):
    out = []
    for b in range(bars):
        t = b * 4.0
        out += kick_jersey(t, b, fill=False)                     # 트리플렛 필 제외 → 담백
        out += [N(CLAP, t + 3.0, 0.2, 100)]                      # 백비트 4만
        for i in range(8):                                       # 8분 하이햇(담백)
            v = 96 if i % 2 == 0 else 72
            out.append(N(CHH, t + i * 0.5, 0.12, v))
        out += [N(OHH, t + 2.75, 0.25, 84)]
    return out

def pat_build(bars):
    """빌드업: 하이햇 8분→16분 촘촘, 마지막 마디 스네어 롤 크레셴도."""
    out = []
    for b in range(bars):
        t = b * 4.0
        out += [N(KICK, t + 0.0, 0.22, 110)]
        if b < bars - 1:
            out += kick_jersey(t, b, fill=False)
            step = 0.5 if b < bars // 2 else 0.25   # 후반부 16분으로 조밀
            n = int(4.0 / step)
            for i in range(n):
                v = 78 + int(i * (28 / max(1, n - 1)))
                out.append(N(CHH, t + i * step, 0.1, min(112, v)))
        else:  # 마지막 마디: 16분 스네어 롤 크레셴도 → 드롭
            for i in range(16):
                v = 60 + int(i * (58 / 15))
                out.append(N(SNARE, t + i * 0.25, 0.1, min(120, v)))
    return out

ENERGY_FN = {"high": pat_high, "mid": pat_mid, "build": pat_build}

def energy_for(name):
    """섹션 이름 → energy 레벨 규칙 매핑."""
    n = name.lower()
    # build를 먼저 검사: "Pre-Chorus"는 chorus를 포함하므로 build가 우선해야 함
    if any(k in n for k in ("pre", "build", "rise", "lift")):  return "build"
    if any(k in n for k in ("chorus", "hook", "drop")):        return "high"
    return "mid"  # verse / intro / outro / bridge / 기타 기본값

def humanize(notes, bpm, seed):
    rnd = random.Random(seed); beat_ms = 60000.0 / bpm; out = []
    for n in notes:
        p = n["pitch"]
        if p in (KICK, CLAP, SNARE): off = rnd.uniform(-2, 3) / beat_ms   # 타이트
        else:                        off = rnd.uniform(-1, 6) / beat_ms   # 햇 약간 느슨
        v = n["vel"] * rnd.gauss(1.0, 0.07) + rnd.uniform(-3, 3)
        v = max(20, min(124, int(round(v))))
        out.append(N(p, max(0.0, n["start"] + off), n["dur"], v))
    return out

# ── MIDI writer ──
def vlq(n):
    n = max(0, int(n)); out = bytearray([n & 0x7F]); n >>= 7
    while n: out.insert(0, (n & 0x7F) | 0x80); n >>= 7
    return bytes(out)

def write_midi(notes, bpm, path):
    ev = []
    for n in notes:
        on = int(round(n["start"] * TPQ)); off = int(round((n["start"] + n["dur"]) * TPQ))
        ev.append((on, 1, n["pitch"], n["vel"])); ev.append((max(on + 1, off), 0, n["pitch"], 0))
    ev.sort(key=lambda e: (e[0], e[1]))
    body = bytearray(); body += vlq(0) + bytes([0xFF, 0x51, 0x03]) + struct.pack(">I", int(60_000_000 / bpm))[1:]
    prev = 0
    for tick, on, p, v in ev:
        body += vlq(tick - prev) + bytes([(0x90 if on else 0x80), p, v]); prev = tick
    body += vlq(0) + bytes([0xFF, 0x2F, 0x00])
    trk = b"MTrk" + struct.pack(">I", len(body)) + bytes(body)
    with open(path, "wb") as f: f.write(b"MThd" + struct.pack(">IHHH", 6, 0, 1, TPQ) + trk)


def parse_sections(raw):
    """--sections JSON: [{"name":..,"bars":..,"energy"?:..}, ...] (문자열 또는 파일 경로)."""
    if os.path.isfile(raw):
        with open(raw) as f: data = json.load(f)
    else:
        data = json.loads(raw)
    secs = []
    for i, s in enumerate(data):
        name = s["name"]; bars = int(s["bars"])
        energy = s.get("energy") or energy_for(name)
        if energy not in ENERGY_FN:
            sys.exit(f"error: 알 수 없는 energy '{energy}' (섹션 '{name}'). high/mid/build 중 하나여야 함.")
        secs.append({"name": name, "bars": bars, "energy": energy, "index": i})
    return secs


def main():
    ap = argparse.ArgumentParser(description="송폼 섹션별 드럼 생성기")
    ap.add_argument("--bpm", type=float, required=True)
    ap.add_argument("--sections", required=True,
                    help='JSON 문자열 또는 파일 경로: [{"name":"Verse 1","bars":8},...] (energy 선택)')
    ap.add_argument("--out-json", required=True, help="Ableton/MCP용 JSON 출력 경로")
    ap.add_argument("--midi-dir", default=None, help="섹션별 .mid 출력 디렉토리(선택)")
    ap.add_argument("--slug", default="drums", help="파일명 슬러그(.mid용)")
    args = ap.parse_args()

    secs = parse_sections(args.sections)
    if args.midi_dir: os.makedirs(args.midi_dir, exist_ok=True)

    out = {"bpm": args.bpm, "beats_per_bar": BEATS_PER_BAR, "sections": []}
    for s in secs:
        raw = ENERGY_FN[s["energy"]](s["bars"])
        notes = humanize(raw, args.bpm, seed=hash("drum" + s["name"] + str(s["index"])) & 0xFFFF)
        length_beats = s["bars"] * BEATS_PER_BAR
        out["sections"].append({
            "name": s["name"], "index": s["index"], "bars": s["bars"],
            "energy": s["energy"], "length_beats": length_beats,
            "notes": [{"pitch": n["pitch"], "start_time": n["start"],
                       "duration": n["dur"], "velocity": n["vel"], "mute": False} for n in notes],
        })
        uniq = len(set(n["vel"] for n in notes))
        print(f"✅ {s['name']} [{s['energy']}] {s['bars']}bars — {len(notes)}노트, 고유벨로시티 {uniq}개")
        if args.midi_dir:
            mpath = os.path.join(args.midi_dir, f"{args.slug}_{s['index']:02d}_{s['name'].lower().replace(' ', '')}.mid")
            write_midi(notes, args.bpm, mpath)
            print(f"   ↳ {mpath}")

    os.makedirs(os.path.dirname(os.path.abspath(args.out_json)), exist_ok=True)
    with open(args.out_json, "w") as f:
        json.dump(out, f, ensure_ascii=False, indent=1)
    print(f"📄 {args.out_json} 저장 ({len(out['sections'])}섹션, {args.bpm} BPM)")


if __name__ == "__main__":
    main()
