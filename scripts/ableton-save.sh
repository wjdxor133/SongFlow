#!/usr/bin/env bash
# SongFlow spike — Live 강제 저장 (백업 전 선행 단계)
# 배경: 조사 결과 4개 MCP 서버 모두 save 명령 미지원 (Day 1 research 참조).
#       AppleScript로 Ableton Live에 ⌘S 키스트로크를 보내는 우회.
# 주의: - Ableton Live가 실행 중이어야 하며 저장 다이얼로그가 없어야 함
#       - 시스템 설정 > 개인정보 보호 > 손쉬운 사용에서 터미널(또는 Claude Code)
#         권한 필요 (최초 1회)
#       - 새 프로젝트(미저장)면 Save As 다이얼로그가 뜨므로, 이 스크립트는
#         이미 저장된 적 있는 프로젝트 전용

set -euo pipefail

LIVE_APP="$(osascript -e 'tell application "System Events" to get name of (processes whose name contains "Live")' 2>/dev/null | tr -d ',' | awk '{print $1}')"

if [ -z "$LIVE_APP" ]; then
  echo "오류: 실행 중인 Ableton Live를 찾을 수 없음" >&2
  exit 1
fi

# Day 1 실측 결과: keystroke ⌘S는 모디파이어가 유실돼 저장이 실행되지 않는
# 경우가 있음(평문 's'=솔로 토글 위험). 메뉴 항목 클릭이 결정론적.
osascript <<EOF
tell application "System Events"
  tell process "$LIVE_APP"
    set frontmost to true
    delay 0.3
    click menu item "Save Live Set" of menu "File" of menu bar 1
  end tell
end tell
EOF

# 저장이 디스크에 반영될 시간
sleep 1
echo "Live 저장 명령 전송 완료 ($LIVE_APP)"
