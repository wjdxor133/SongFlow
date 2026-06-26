#!/usr/bin/env python3
"""
Deterministic English syllable counter for lyrics-from-reference.

WHY: LLMs count English syllables at only ~23-55% accuracy (PhonologyBench
arXiv 2404.02456). Syllable matching MUST be done with a phoneme dictionary,
not by the model. This counts each line via CMUdict (the `pronouncing`
library) when available, with a rule-based fallback for out-of-vocabulary
words (slang/contractions are common in lyrics, and CMUdict returns nothing
for them). See .omc/research/ai-english-lyric-syllable-matching.md.

USAGE
  # Count syllables per line (section markers like [Verse] are ignored):
  python3 syllable_count.py count lyrics.txt
  cat lyrics.txt | python3 syllable_count.py count

  # Verify generated lyrics against a per-line target template, print
  # per-line match rate + mismatches (the gate for the refine loop):
  python3 syllable_count.py verify lyrics.txt targets.json

  targets.json format (per section, in order):
    {"Verse 1": [8,6,8,6], "Chorus": [7,7,5,7]}

OUTPUT: JSON to stdout. `backend` field reports "cmudict" or "fallback".
Exit code 0 if (verify) all lines match, 1 if any mismatch, 2 on error.
"""
import sys, json, re

try:
    import pronouncing  # CMUdict-backed
    _HAVE_PRONOUNCING = True
except Exception:
    _HAVE_PRONOUNCING = False

_VOWELS = "aeiouy"


def _fallback_syllables(word):
    """Rule-based vowel-group count for OOV words. Approximate but bounded."""
    w = re.sub(r"[^a-z]", "", word.lower())
    if not w:
        return 0
    groups = re.findall(r"[aeiouy]+", w)
    count = len(groups)
    # silent trailing 'e' (but not 'le' after a consonant, e.g. "table")
    if w.endswith("e") and not w.endswith("le") and count > 1:
        count -= 1
    if w.endswith("le") and len(w) > 2 and w[-3] not in _VOWELS:
        count += 0  # 'le' already counted as its own group only if preceded by vowel
    return max(1, count)


def _word_syllables(word):
    clean = re.sub(r"[^a-zA-Z']", "", word)
    if not clean:
        return 0, False
    if _HAVE_PRONOUNCING:
        phones = pronouncing.phones_for_word(clean.lower())
        if phones:
            return pronouncing.syllable_count(phones[0]), True
    return _fallback_syllables(clean), False


def _line_syllables(line):
    total, oov = 0, 0
    for tok in line.split():
        s, hit = _word_syllables(tok)
        total += s
        if not hit and re.sub(r"[^a-zA-Z']", "", tok):
            oov += 1
    return total, oov


_SECTION_RE = re.compile(r"^\s*\[.*\]\s*$")


def _read_lines(src):
    raw = src.read().splitlines()
    out = []
    for ln in raw:
        if _SECTION_RE.match(ln):  # skip [Verse]/[Chorus]/... markers
            continue
        if ln.strip() == "":
            continue
        out.append(ln.rstrip())
    return out


def cmd_count(path):
    src = open(path) if path else sys.stdin
    lines = _read_lines(src)
    result = []
    for ln in lines:
        n, oov = _line_syllables(ln)
        result.append({"line": ln, "syllables": n, "oov_words": oov})
    print(json.dumps({
        "backend": "cmudict" if _HAVE_PRONOUNCING else "fallback",
        "lines": result,
        "total_lines": len(result),
    }, ensure_ascii=False, indent=2))
    return 0


def cmd_verify(lyrics_path, targets_path):
    with open(targets_path) as f:
        targets = json.load(f)
    flat_targets = [t for sec in targets.values() for t in sec]
    src = open(lyrics_path) if lyrics_path else sys.stdin
    lines = _read_lines(src)
    rows, matches = [], 0
    for i, tgt in enumerate(flat_targets):
        if i < len(lines):
            got, oov = _line_syllables(lines[i])
            ok = (got == tgt)
            matches += int(ok)
            rows.append({"line_index": i, "target": tgt, "got": got,
                         "match": ok, "oov_words": oov,
                         "text": lines[i]})
        else:
            rows.append({"line_index": i, "target": tgt, "got": None,
                         "match": False, "missing": True})
    total = len(flat_targets)
    rate = matches / total if total else 0.0
    mismatches = [r for r in rows if not r.get("match")]
    print(json.dumps({
        "backend": "cmudict" if _HAVE_PRONOUNCING else "fallback",
        "per_line_match_rate": round(rate, 4),
        "matched": matches, "total": total,
        "mismatches": mismatches,
    }, ensure_ascii=False, indent=2))
    return 0 if matches == total else 1


def main():
    if len(sys.argv) < 2:
        sys.stderr.write(__doc__)
        return 2
    cmd = sys.argv[1]
    try:
        if cmd == "count":
            return cmd_count(sys.argv[2] if len(sys.argv) > 2 else None)
        if cmd == "verify":
            if len(sys.argv) < 4:
                sys.stderr.write("verify needs <lyrics> <targets.json>\n")
                return 2
            # allow stdin lyrics: verify - targets.json
            lp = None if sys.argv[2] == "-" else sys.argv[2]
            return cmd_verify(lp, sys.argv[3])
        sys.stderr.write(f"unknown command: {cmd}\n")
        return 2
    except FileNotFoundError as e:
        sys.stderr.write(f"file not found: {e}\n")
        return 2


if __name__ == "__main__":
    sys.exit(main())
