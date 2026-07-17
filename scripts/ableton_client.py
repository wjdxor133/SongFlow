import socket, json, sys

def cmd(command_type, params=None, timeout=10):
    s = socket.create_connection(("localhost", 9877), timeout=timeout)
    payload = json.dumps({"type": command_type, "params": params or {}})
    s.sendall(payload.encode())
    chunks = []
    s.settimeout(timeout)
    try:
        while True:
            data = s.recv(65536)
            if not data:
                break
            chunks.append(data)
            try:
                resp = json.loads(b"".join(chunks).decode())
                s.close()
                return resp
            except json.JSONDecodeError:
                continue
    except socket.timeout:
        s.close()
        return {"error": "timeout", "partial": b"".join(chunks).decode(errors="replace")}

if __name__ == "__main__":
    command = sys.argv[1]
    params = json.loads(sys.argv[2]) if len(sys.argv) > 2 else {}
    print(json.dumps(cmd(command, params), indent=2, ensure_ascii=False))

# --- SongFlow 헬퍼: 로케이터는 반드시 위치 이동을 별도 명령으로 선행 ---
# (Live API: current_song_time 반영이 같은 디스패치 안에서 안 됨 — Day 1 실측)

def create_locator(time, name=""):
    cmd("set_current_song_time", {"time": time})
    return cmd("create_locator", {"time": time, "name": name})

def delete_locator(time):
    cmd("set_current_song_time", {"time": time})
    return cmd("delete_locator", {"time": time})
