// saveMidi.ts — MIDI 바이트를 파일로 저장.
// Tauri 환경: appDataDir/exports/ 에 바이너리로 쓰고 Finder에서 노출.
// 일반 브라우저: <a download> blob 다운로드로 폴백.

function isTauri(): boolean {
  return typeof window !== "undefined" && "__TAURI_INTERNALS__" in window;
}

export interface SaveMidiResult {
  mode: "tauri" | "browser";
  path?: string;
}

export async function saveMidi(bytes: Uint8Array, filename: string): Promise<SaveMidiResult> {
  if (isTauri()) {
    const { writeFile, mkdir } = await import("@tauri-apps/plugin-fs");
    const { appDataDir, join } = await import("@tauri-apps/api/path");
    const dir = await join(await appDataDir(), "exports");
    await mkdir(dir, { recursive: true });
    const path = await join(dir, filename);
    await writeFile(path, bytes);
    // 저장 위치를 파일 탐색기에서 보여줌 (권한/플랫폼 문제 시 조용히 무시)
    try {
      const { revealItemInDir } = await import("@tauri-apps/plugin-opener");
      await revealItemInDir(path);
    } catch {
      /* reveal 실패해도 저장은 성공 */
    }
    return { mode: "tauri", path };
  }

  // 브라우저 폴백
  const blob = new Blob([bytes], { type: "audio/midi" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
  return { mode: "browser" };
}
