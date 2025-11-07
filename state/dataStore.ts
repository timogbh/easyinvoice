import { create } from "zustand";
import type { Client, Item, Document } from "@/types";
import { getItem, setItem, storageNamespaces } from "@/services/storage";
import { useUserStore } from "./userStore";

interface DataState {
  clients: Client[];
  items: Item[];
  documents: Document[];
  addClient: (client: Client) => void;
  updateClient: (id: string, updates: Partial<Client>) => void;
  removeClient: (id: string) => void;
  addItem: (item: Item) => void;
  updateItem: (id: string, updates: Partial<Item>) => void;
  removeItem: (id: string) => void;
  addDocument: (doc: Document) => void;
  updateDocument: (id: string, updates: Partial<Document>) => void;
  removeDocument: (id: string) => void;
  nextInvoiceNumber: () => string;
  nextQuoteNumber: () => string;
  loadFromCache: () => Promise<void>;
  saveToCache: () => Promise<void>;
  reset: () => void;
}

export const useDataStore = create<DataState>((set, get) => ({
  clients: [],
  items: [],
  documents: [],

  addClient: (client) => {
    console.log("[DataStore] addClient", client.id);
    set((state) => ({ clients: [...state.clients, client] }));
    get().saveToCache();
  },

  updateClient: (id, updates) => {
    console.log("[DataStore] updateClient", id);
    set((state) => ({
      clients: state.clients.map((c) => (c.id === id ? { ...c, ...updates } : c)),
    }));
    get().saveToCache();
  },

  removeClient: (id) => {
    console.log("[DataStore] removeClient", id);
    set((state) => ({ clients: state.clients.filter((c) => c.id !== id) }));
    get().saveToCache();
  },

  addItem: (item) => {
    console.log("[DataStore] addItem", item.id);
    set((state) => ({ items: [...state.items, item] }));
    get().saveToCache();
  },

  updateItem: (id, updates) => {
    console.log("[DataStore] updateItem", id);
    set((state) => ({
      items: state.items.map((i) => (i.id === id ? { ...i, ...updates } : i)),
    }));
    get().saveToCache();
  },

  removeItem: (id) => {
    console.log("[DataStore] removeItem", id);
    set((state) => ({ items: state.items.filter((i) => i.id !== id) }));
    get().saveToCache();
  },

  addDocument: (doc) => {
    console.log("[DataStore] addDocument", doc.id);
    set((state) => ({ documents: [...state.documents, doc] }));
    get().saveToCache();
  },

  updateDocument: (id, updates) => {
    console.log("[DataStore] updateDocument", id);
    set((state) => ({
      documents: state.documents.map((d) =>
        d.id === id ? { ...d, ...updates } : d
      ),
    }));
    get().saveToCache();
  },

  removeDocument: (id) => {
    console.log("[DataStore] removeDocument", id);
    set((state) => ({ documents: state.documents.filter((d) => d.id !== id) }));
    get().saveToCache();
  },

  nextInvoiceNumber: () => {
    const profile = useUserStore.getState().profile;
    if (!profile) return "RE-2025-001";

    const { invoicePrefix, invoiceNext } = profile.numbering;
    const year = new Date().getFullYear();
    const number = `${invoicePrefix}${year}-${String(invoiceNext).padStart(3, "0")}`;

    useUserStore.getState().setProfile({
      numbering: {
        ...profile.numbering,
        invoiceNext: invoiceNext + 1,
      },
    });

    console.log("[DataStore] nextInvoiceNumber", number);
    return number;
  },

  nextQuoteNumber: () => {
    const profile = useUserStore.getState().profile;
    if (!profile) return "AN-2025-001";

    const { quotePrefix, quoteNext } = profile.numbering;
    const year = new Date().getFullYear();
    const number = `${quotePrefix}${year}-${String(quoteNext).padStart(3, "0")}`;

    useUserStore.getState().setProfile({
      numbering: {
        ...profile.numbering,
        quoteNext: quoteNext + 1,
      },
    });

    console.log("[DataStore] nextQuoteNumber", number);
    return number;
  },

  loadFromCache: async () => {
    console.log("[DataStore] loadFromCache");
    const clients = await getItem<Client[]>(storageNamespaces.DATA, "clients");
    const items = await getItem<Item[]>(storageNamespaces.DATA, "items");
    const documents = await getItem<Document[]>(
      storageNamespaces.DATA,
      "documents"
    );

    set({
      clients: clients || [],
      items: items || [],
      documents: documents || [],
    });
  },

  saveToCache: async () => {
    const { clients, items, documents } = get();
    console.log("[DataStore] saveToCache");
    await setItem(storageNamespaces.DATA, "clients", clients);
    await setItem(storageNamespaces.DATA, "items", items);
    await setItem(storageNamespaces.DATA, "documents", documents);
  },

  reset: () => {
    console.log("[DataStore] reset");
    set({ clients: [], items: [], documents: [] });
  },
}));
