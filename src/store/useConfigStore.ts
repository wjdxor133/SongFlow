import { create } from "zustand";
import { loadConfig, type AppConfig } from "../lib/storage/configStore";

type ConfigStore = {
  config: AppConfig;
  isLoaded: boolean;
  init: () => Promise<void>;
};

export const useConfigStore = create<ConfigStore>((set) => ({
  config: {},
  isLoaded: false,

  async init() {
    const config = await loadConfig();
    set({ config, isLoaded: true });
  },
}));
