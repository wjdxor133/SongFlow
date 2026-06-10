import { create } from "zustand";
import { loadConfig, saveConfig, type AppConfig } from "../lib/storage/configStore";

type ConfigStore = {
  config: AppConfig;
  isLoaded: boolean;
  init: () => Promise<void>;
  setAnthropicApiKey: (key: string) => Promise<void>;
  clearAnthropicApiKey: () => Promise<void>;
};

export const useConfigStore = create<ConfigStore>((set, get) => ({
  config: { anthropicApiKey: "" },
  isLoaded: false,

  async init() {
    const config = await loadConfig();
    set({ config, isLoaded: true });
  },

  async setAnthropicApiKey(key) {
    const config = { ...get().config, anthropicApiKey: key };
    await saveConfig(config);
    set({ config });
  },

  async clearAnthropicApiKey() {
    const config = { ...get().config, anthropicApiKey: "" };
    await saveConfig(config);
    set({ config });
  },
}));
