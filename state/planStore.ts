import { create } from "zustand";
import type { PlanCounters, AICounters } from "@/types";
import { getItem, setItem, storageNamespaces } from "@/services/storage";

interface PlanState {
  counters: PlanCounters;
  aiCounters: AICounters;
  ensureCurrentPeriod: () => void;
  incDocs: () => void;
  canCreateDoc: (premium: boolean) => boolean;
  incAI: () => void;
  canUseAI: (premium: boolean) => boolean;
  getRemainingDocs: (premium: boolean) => number;
  getRemainingAI: (premium: boolean) => number;
  resetAICounters: () => void;
  resetCounters: () => void;
  loadFromCache: () => Promise<void>;
  saveToCache: () => Promise<void>;
  reset: () => void;
}

function getCurrentPeriod(): string {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
}

export const usePlanStore = create<PlanState>((set, get) => ({
  counters: {
    periodISO: getCurrentPeriod(),
    freeDocsUsed: 0,
  },
  aiCounters: {
    periodISO: getCurrentPeriod(),
    freeUsed: 0,
    premiumUsed: 0,
  },

  ensureCurrentPeriod: () => {
    const currentPeriod = getCurrentPeriod();
    const { counters, aiCounters } = get();

    if (counters.periodISO !== currentPeriod) {
      console.log("[PlanStore] New period detected, resetting counters");
      set({
        counters: {
          periodISO: currentPeriod,
          freeDocsUsed: 0,
        },
      });
      get().saveToCache();
    }

    if (aiCounters.periodISO !== currentPeriod) {
      console.log("[PlanStore] New period detected, resetting AI counters");
      set({
        aiCounters: {
          periodISO: currentPeriod,
          freeUsed: 0,
          premiumUsed: 0,
        },
      });
      get().saveToCache();
    }
  },

  incDocs: () => {
    console.log("[PlanStore] incDocs");
    get().ensureCurrentPeriod();
    set((state) => ({
      counters: {
        ...state.counters,
        freeDocsUsed: state.counters.freeDocsUsed + 1,
      },
    }));
    get().saveToCache();
  },

  canCreateDoc: (premium) => {
    get().ensureCurrentPeriod();
    const { counters } = get();

    if (premium) {
      console.log("[PlanStore] Premium user can create doc");
      return true;
    }

    const canCreate = counters.freeDocsUsed < 3;
    console.log(
      `[PlanStore] Free user ${counters.freeDocsUsed}/3 docs used, can create: ${canCreate}`
    );
    return canCreate;
  },

  incAI: () => {
    console.log("[PlanStore] incAI");
    get().ensureCurrentPeriod();
    set((state) => ({
      aiCounters: {
        ...state.aiCounters,
        freeUsed: state.aiCounters.freeUsed + 1,
        premiumUsed: state.aiCounters.premiumUsed + 1,
      },
    }));
    get().saveToCache();
  },

  canUseAI: (premium) => {
    get().ensureCurrentPeriod();
    const { aiCounters } = get();

    if (premium) {
      const canUse = aiCounters.premiumUsed < 300;
      console.log(
        `[PlanStore] Premium user ${aiCounters.premiumUsed}/300 AI requests used, can use: ${canUse}`
      );
      return canUse;
    }

    const canUse = aiCounters.freeUsed < 5;
    console.log(
      `[PlanStore] Free user ${aiCounters.freeUsed}/5 AI requests used, can use: ${canUse}`
    );
    return canUse;
  },

  getRemainingDocs: (premium) => {
    get().ensureCurrentPeriod();
    const { counters } = get();
    if (premium) return Infinity;
    return Math.max(0, 3 - counters.freeDocsUsed);
  },

  getRemainingAI: (premium) => {
    get().ensureCurrentPeriod();
    const { aiCounters } = get();
    if (premium) return Math.max(0, 300 - aiCounters.premiumUsed);
    return Math.max(0, 5 - aiCounters.freeUsed);
  },

  resetAICounters: () => {
    console.log("[PlanStore] resetAICounters");
    set({
      aiCounters: {
        periodISO: getCurrentPeriod(),
        freeUsed: 0,
        premiumUsed: 0,
      },
    });
    get().saveToCache();
  },

  resetCounters: () => {
    console.log("[PlanStore] resetCounters");
    const period = getCurrentPeriod();
    set({
      counters: {
        periodISO: period,
        freeDocsUsed: 0,
      },
      aiCounters: {
        periodISO: period,
        freeUsed: 0,
        premiumUsed: 0,
      },
    });
    get().saveToCache();
  },

  loadFromCache: async () => {
    console.log("[PlanStore] loadFromCache");
    const counters = await getItem<PlanCounters>(
      storageNamespaces.PLAN,
      "counters"
    );
    const aiCounters = await getItem<AICounters>(
      storageNamespaces.PLAN,
      "aiCounters"
    );
    if (counters) {
      set({ counters });
    }
    if (aiCounters) {
      set({ aiCounters });
    }
    get().ensureCurrentPeriod();
  },

  saveToCache: async () => {
    const { counters, aiCounters } = get();
    console.log("[PlanStore] saveToCache");
    await setItem(storageNamespaces.PLAN, "counters", counters);
    await setItem(storageNamespaces.PLAN, "aiCounters", aiCounters);
  },

  reset: () => {
    console.log("[PlanStore] reset");
    set({
      counters: {
        periodISO: getCurrentPeriod(),
        freeDocsUsed: 0,
      },
      aiCounters: {
        periodISO: getCurrentPeriod(),
        freeUsed: 0,
        premiumUsed: 0,
      },
    });
  },
}));
