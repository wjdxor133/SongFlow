import { create } from "zustand";
import { loadConfig, saveConfig, type AppConfig } from "../lib/storage/configStore";

type ConfigStore = {
  config: AppConfig;
  isLoaded: boolean;
  init: () => Promise<void>;
  setAnthropicApiKey: (key: string) => Promise<void>;
  clearAnthropicApiKey: () => Promise<void>;
  setSpotifyCredentials: (clientId: string, clientSecret: string) => Promise<void>;
  clearSpotifyCredentials: () => Promise<void>;
};

export const useConfigStore = create<ConfigStore>((set, get) => ({
  config: { anthropicApiKey: "", spotifyClientId: "", spotifyClientSecret: "" },
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

  async setSpotifyCredentials(clientId, clientSecret) {
    const config = { ...get().config, spotifyClientId: clientId, spotifyClientSecret: clientSecret };
    await saveConfig(config);
    set({ config });
  },

  async clearSpotifyCredentials() {
    const config = { ...get().config, spotifyClientId: "", spotifyClientSecret: "" };
    await saveConfig(config);
    set({ config });
  },
}));
