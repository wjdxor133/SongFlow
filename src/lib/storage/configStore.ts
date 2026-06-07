import { readTextFile, writeTextFile, mkdir, exists } from "@tauri-apps/plugin-fs";
import { appDataDir } from "@tauri-apps/api/path";

export type AppConfig = {
  anthropicApiKey: string;
};

const defaultConfig = (): AppConfig => ({ anthropicApiKey: "" });

async function getConfigPath(): Promise<string> {
  const dir = await appDataDir();
  return `${dir}/songflow-config.json`;
}

export async function loadConfig(): Promise<AppConfig> {
  try {
    const path = await getConfigPath();
    const fileExists = await exists(path);
    if (!fileExists) return defaultConfig();
    const raw = await readTextFile(path);
    return { ...defaultConfig(), ...JSON.parse(raw) } as AppConfig;
  } catch {
    return defaultConfig();
  }
}

export async function saveConfig(config: AppConfig): Promise<void> {
  const dir = await appDataDir();
  await mkdir(dir, { recursive: true });
  const path = await getConfigPath();
  await writeTextFile(path, JSON.stringify(config, null, 2));
}
