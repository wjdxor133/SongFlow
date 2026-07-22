#!/usr/bin/env python3
"""Tongue-Tied (ref: Super Shy) 섹션별 드럼 생성기 (808 Core Kit / GM 맵).

각 섹션(Chorus/Verse/Pre)의 에너지에 맞춰 jersey club 드럼을 만들고,
  (1) exports/bass/tonguetied_drums_<section>_150bpm.mid  (드래그용)
  (2) exports/bass/tonguetied_drums_ableton.json          (MCP add_notes_to_clip용)
를 출력한다.

리서치 반영(RenCon 2025 '벨로시티 폭=지각 품질 최강 변수', GigaMIDI DNVR):
  - 하이햇에 구조적 accent wave(강-약-중-약) + 미세 지터 → 고유 벨로시티↑
  - 킥/클랩 타이트(±3ms), 하이햇 살짝 느슨, 고스트 스네어 저벨로시티
  - jersey 시그니처: 킥 바운스(3-hit lock) + 마디 끝 트리플렛 필
GM/808 패드: Kick36 Snare38 Clap39 ClosedHH42 OpenHH46. 150 BPM.
"""
import struct, random, os, json

TPQ = 480
BPM = 150.0
KICK, SNARE, CLAP, CHH, OHH = 36, 38, 39, 42, 46

def N(p,t,d,v): return {"pitch":p,"start":round(t,4),"dur":d,"vel":v}

def hats_16(bar_t, base=70, accent=104, mid=86):
    """16분 클로즈햇 + accent wave(강-약-중-약)."""
    out=[]
    for i in range(16):
        t = bar_t + i*0.25
        if   i % 4 == 0: v = accent      # 정박
        elif i % 4 == 2: v = mid         # 8분 뒷박
        else:            v = base        # 16분 사이
        out.append(N(CHH, t, 0.12, v))
    return out

def kick_jersey(bar_t, b, fill=True):
    """jersey 3-hit lock(0/1.5/2.5) + 홀수마디 마디끝 트리플렛 바운스."""
    out=[N(KICK,bar_t+0.0,0.22,118), N(KICK,bar_t+1.5,0.2,104), N(KICK,bar_t+2.5,0.2,110)]
    if fill and b % 2 == 1:  # 마디 끝 8분트리플렛 → 다음 마디로 굴러감
        out += [N(KICK,bar_t+3.333,0.15,96), N(KICK,bar_t+3.667,0.15,108)]
    return out

# ── 섹션 정의 ──
def sec_chorus(bars):
    out=[]
    for b in range(bars):
        t=b*4.0
        out += kick_jersey(t,b)
        out += [N(CLAP,t+1.0,0.2,110), N(CLAP,t+3.0,0.2,112)]   # 백비트 클랩 2·4
        out += hats_16(t)
        out += [N(OHH,t+0.75,0.25,96), N(OHH,t+2.75,0.25,92)]   # 개러지 오픈햇 셔플
        if b % 4 == 3:  # 4마디마다 고스트 스네어 픽업
            out += [N(SNARE,t+3.5,0.12,54), N(SNARE,t+3.75,0.12,72)]
    return out

def sec_verse(bars):
    out=[]
    for b in range(bars):
        t=b*4.0
        out += kick_jersey(t,b,fill=False)                     # 트리플렛 필 제외 → 담백
        out += [N(CLAP,t+3.0,0.2,100)]                          # 백비트 4만
        # 8분 하이햇(담백)
        for i in range(8):
            v = 96 if i%2==0 else 72
            out.append(N(CHH,t+i*0.5,0.12,v))
        out += [N(OHH,t+2.75,0.25,84)]
    return out

def sec_pre(bars):
    """빌드업: 하이햇 8분→16분 촘촘, 마지막 마디 스네어 롤 크레셴도."""
    out=[]
    for b in range(bars):
        t=b*4.0
        out += [N(KICK,t+0.0,0.22,110)]
        if b < bars-1:
            out += kick_jersey(t,b,fill=False)
            step = 0.5 if b < bars//2 else 0.25   # 후반부 16분으로 조밀
            n=int(4.0/step)
            for i in range(n):
                v = 78 + int(i*(28/max(1,n-1)))
                out.append(N(CHH,t+i*step,0.1,min(112,v)))
        else:  # 마지막 마디: 16분 스네어 롤 크레셴도 → 드롭
            for i in range(16):
                v = 60 + int(i*(58/15))
                out.append(N(SNARE,t+i*0.25,0.1,min(120,v)))
    return out

SECTIONS = {"Chorus":(sec_chorus,8), "Verse":(sec_verse,8), "Pre":(sec_pre,4)}

def humanize(notes, seed):
    rnd=random.Random(seed); beat_ms=60000.0/BPM; out=[]
    for n in notes:
        p=n["pitch"]
        if p in (KICK,CLAP,SNARE): off=rnd.uniform(-2,3)/beat_ms   # 타이트
        else:                      off=rnd.uniform(-1,6)/beat_ms   # 햇 약간 느슨
        v=n["vel"]*rnd.gauss(1.0,0.07)+rnd.uniform(-3,3)
        v=max(20,min(124,int(round(v))))
        out.append(N(p,max(0.0,n["start"]+off),n["dur"],v))
    return out

# ── MIDI writer ──
def vlq(n):
    n=max(0,int(n)); out=bytearray([n&0x7F]); n>>=7
    while n: out.insert(0,(n&0x7F)|0x80); n>>=7
    return bytes(out)

def write_midi(notes, path):
    ev=[]
    for n in notes:
        on=int(round(n["start"]*TPQ)); off=int(round((n["start"]+n["dur"])*TPQ))
        ev.append((on,1,n["pitch"],n["vel"])); ev.append((max(on+1,off),0,n["pitch"],0))
    ev.sort(key=lambda e:(e[0],e[1]))
    body=bytearray(); body+=vlq(0)+bytes([0xFF,0x51,0x03])+struct.pack(">I",int(60_000_000/BPM))[1:]
    prev=0
    for tick,on,p,v in ev:
        body+=vlq(tick-prev)+bytes([(0x90 if on else 0x80),p,v]); prev=tick
    body+=vlq(0)+bytes([0xFF,0x2F,0x00])
    trk=b"MTrk"+struct.pack(">I",len(body))+bytes(body)
    with open(path,"wb") as f: f.write(b"MThd"+struct.pack(">IHHH",6,0,1,TPQ)+trk)

def main():
    out_dir="exports/bass"; os.makedirs(out_dir,exist_ok=True); ableton={}
    for name,(fn,bars) in SECTIONS.items():
        notes=humanize(fn(bars), seed=hash("drum"+name)&0xFFFF)
        path=os.path.join(out_dir,f"tonguetied_drums_{name.lower()}_150bpm.mid")
        write_midi(notes,path)
        ableton[name]={"length_beats":bars*4,
            "notes":[{"pitch":n["pitch"],"start_time":n["start"],
                      "duration":n["dur"],"velocity":n["vel"],"mute":False} for n in notes]}
        uniq=len(set(n["vel"] for n in notes))
        print(f"✅ {path}  ({len(notes)}노트, 고유벨로시티 {uniq}개)")
    with open(os.path.join(out_dir,"tonguetied_drums_ableton.json"),"w") as f:
        json.dump(ableton,f,ensure_ascii=False,indent=1)
    print("📄 exports/bass/tonguetied_drums_ableton.json 저장")

if __name__=="__main__":
    main()
