import { create } from "zustand";
import type { CompanyProfile, AISettings } from "@/types";
import { getItem, setItem, storageNamespaces } from "@/services/storage";

interface UserState {
  profile: CompanyProfile | null;
  aiSettings: AISettings;
  setProfile: (partial: Partial<CompanyProfile>) => Promise<void>;
  setBranding: (logoUrl?: string, brandColor?: string) => Promise<void>;
  removeLogo: () => Promise<void>;
  acceptConsent: (dateISO: string) => Promise<void>;
  setPremium: (premium: boolean) => Promise<void>;
  setAISettings: (settings: Partial<AISettings>) => Promise<void>;
  loadFromCache: () => Promise<void>;
  saveToCache: () => Promise<void>;
  reset: () => void;
}

export const useUserStore = create<UserState>((set, get) => ({
  profile: null,
  aiSettings: {
    enabled: true,
    language: "de",
    tone: "neutral",
  },

  setProfile: async (partial) => {
    console.log("[UserStore] setProfile", partial);
    set((state) => ({
      profile: state.profile ? { ...state.profile, ...partial } : (partial as CompanyProfile),
    }));
    await get().saveToCache();
  },

  setBranding: async (logoUrl, brandColor) => {
    console.log("[UserStore] setBranding", { logoUrl: logoUrl ? "(data url)" : undefined, brandColor });
    set((state) => ({
      profile: state.profile
        ? { ...state.profile, logoUrl, brandColor }
        : null,
    }));
    await get().saveToCache();
  },

  removeLogo: async () => {
    console.log("[UserStore] removeLogo");
    set((state) => ({
      profile: state.profile
        ? { ...state.profile, logoUrl: undefined }
        : null,
    }));
    await get().saveToCache();
  },

  acceptConsent: async (dateISO) => {
    console.log("[UserStore] acceptConsent", dateISO);
    set((state) => ({
      profile: state.profile ? { ...state.profile, consentISO: dateISO } : null,
    }));
    await get().saveToCache();
  },

  setPremium: async (premium) => {
    console.log("[UserStore] setPremium", premium);
    set((state) => ({
      profile: state.profile ? { ...state.profile, premium } : null,
    }));
    await get().saveToCache();
  },

  setAISettings: async (settings) => {
    console.log("[UserStore] setAISettings", settings);
    set((state) => ({
      aiSettings: { ...state.aiSettings, ...settings },
    }));
    await get().saveToCache();
  },

  loadFromCache: async () => {
    console.log("[UserStore] loadFromCache");
    const profile = await getItem<CompanyProfile>(
      storageNamespaces.USER,
      "profile"
    );
    const aiSettings = await getItem<AISettings>(
      storageNamespaces.USER,
      "aiSettings"
    );
    if (profile) {
      set({ profile });
    }
    if (aiSettings) {
      set({ aiSettings });
    }
  },

  saveToCache: async () => {
    const { profile, aiSettings } = get();
    if (profile) {
      console.log("[UserStore] saveToCache");
      await setItem(storageNamespaces.USER, "profile", profile);
    }
    await setItem(storageNamespaces.USER, "aiSettings", aiSettings);
  },

  reset: () => {
    console.log("[UserStore] reset");
    set({
      profile: null,
      aiSettings: {
        enabled: true,
        language: "de",
        tone: "neutral",
      },
    });
  },
}));
