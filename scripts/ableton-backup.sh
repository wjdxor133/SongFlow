#!/usr/bin/env bash
# SongFlow spike — Ableton 프로젝트 백업 (에이전트 조작 전 필수 선행 단계)
# 사용법: ableton-backup.sh <path/to/project.als>
# 백업 위치: <프로젝트 폴더>/SongFlow Backup/<이름>-<타임스탬프>.als
#   (Ableton 내부 Backup/ 폴더와 의도적으로 분리 — 계획 v2 결정.
#    점(.) 폴더는 Finder에서 안 보여 오너 복원이 어려움 → 보이는 이름 사용, Day 1 학습)
# 주의: 이 스크립트는 디스크의 .als만 복사한다. Live에 미저장 변경이 있으면
#       백업에 반영되지 않으므로, 호출 전 반드시 Live 강제 저장(MCP save 명령)이
#       선행되어야 한다 (Day 1 체크리스트 ⑥).

set -euo pipefail

if [ $# -ne 1 ]; then
  echo "사용법: $0 <path/to/project.als>" >&2
  exit 1
fi

ALS_PATH="$1"

if [ ! -f "$ALS_PATH" ]; then
  echo "오류: .als 파일을 찾을 수 없음: $ALS_PATH" >&2
  exit 1
fi

case "$ALS_PATH" in
  *.als) ;;
  *) echo "오류: .als 파일이 아님: $ALS_PATH" >&2; exit 1 ;;
esac

PROJECT_DIR="$(cd "$(dirname "$ALS_PATH")" && pwd)"
BASENAME="$(basename "$ALS_PATH" .als)"
BACKUP_DIR="$PROJECT_DIR/SongFlow Backup"
TIMESTAMP="$(date +%Y%m%d-%H%M%S)"
DEST="$BACKUP_DIR/${BASENAME}-${TIMESTAMP}.als"
# 같은 초 내 재실행 시 파일명 충돌 방지
SEQ=1
while [ -e "$DEST" ]; do
  DEST="$BACKUP_DIR/${BASENAME}-${TIMESTAMP}-${SEQ}.als"
  SEQ=$((SEQ + 1))
done

mkdir -p "$BACKUP_DIR"
cp -p "$ALS_PATH" "$DEST"

# 복사 무결성 확인 (크기 비교)
SRC_SIZE=$(stat -f%z "$ALS_PATH")
DST_SIZE=$(stat -f%z "$DEST")
if [ "$SRC_SIZE" != "$DST_SIZE" ]; then
  echo "오류: 백업 크기 불일치 (src=$SRC_SIZE, dst=$DST_SIZE)" >&2
  exit 1
fi

echo "백업 완료: $DEST ($DST_SIZE bytes)"
