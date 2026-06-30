import os from "node:os";
import path from "node:path";

const APP_IDENTIFIER = "com.wjdxor133.songflow";

export function getAppDataDir(): string {
  const platform = os.platform();
  const home = os.homedir();

  if (platform === "darwin") {
    return path.join(home, "Library", "Application Support", APP_IDENTIFIER);
  } else if (platform === "win32") {
    const appData = process.env.APPDATA ?? path.join(home, "AppData", "Roaming");
    return path.join(appData, APP_IDENTIFIER);
  } else {
    const xdgData = process.env.XDG_DATA_HOME ?? path.join(home, ".local", "share");
    return path.join(xdgData, APP_IDENTIFIER);
  }
}

export function getStoreFilePath(): string {
  return path.join(getAppDataDir(), "songflow-data.json");
}

export function getExportsDir(): string {
  return path.join(getAppDataDir(), "exports");
}
