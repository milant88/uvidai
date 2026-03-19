import { create } from 'zustand';
import { useMapStore, type MapMarker } from './map-store';

/** Prefer same-origin + Next rewrites; override with NEXT_PUBLIC_API_URL if needed */
function getApiBase(): string {
  const env = process.env.NEXT_PUBLIC_API_URL;
  if (env != null && env !== '') return env.replace(/\/$/, '');
  return '';
}

export interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  feedback?: 'positive' | 'negative';
  agentsUsed?: string[];
}

interface ChatState {
  messages: Message[];
  isLoading: boolean;
  conversationId: string | null;
  sendMessage: (content: string) => Promise<void>;
  addFeedback: (
    messageId: string,
    sentiment: 'positive' | 'negative',
  ) => void;
  clearChat: () => void;
}

function uid(): string {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

export const useChatStore = create<ChatState>((set, get) => ({
  messages: [],
  isLoading: false,
  conversationId: null,

  sendMessage: async (content: string) => {
    const userMsg: Message = {
      id: uid(),
      role: 'user',
      content,
      timestamp: new Date(),
    };

    set((s) => ({
      messages: [...s.messages, userMsg],
      isLoading: true,
    }));

    try {
      const res = await fetch(`${getApiBase()}/api/v1/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: content,
          conversationId: get().conversationId,
        }),
      });

      let assistantContent: string;
      let agentsUsed: string[] = [];

      if (res.ok) {
        const json = await res.json();
        const payload = json.data ?? json;
        assistantContent =
          payload.message?.content ??
          payload.reply ??
          payload.message ??
          'Primio sam vaš upit. Obrađujem...';
        agentsUsed = payload.agentsUsed ?? [];

        if (payload.conversationId) {
          set({ conversationId: payload.conversationId });
        }
      } else {
        let errText = `Server je vratio grešku (${res.status}).`;
        try {
          const errBody: unknown = await res.json();
          if (errBody && typeof errBody === 'object') {
            const msg =
              'message' in errBody && typeof errBody.message === 'string'
                ? errBody.message
                : 'error' in errBody && typeof errBody.error === 'string'
                  ? errBody.error
                  : null;
            if (msg) errText = msg;
          }
        } catch {
          /* keep status fallback */
        }
        assistantContent = errText;
      }

      const assistantMsg: Message = {
        id: uid(),
        role: 'assistant',
        content: assistantContent,
        timestamp: new Date(),
        agentsUsed,
      };

      set((s) => ({
        messages: [...s.messages, assistantMsg],
        isLoading: false,
      }));

      extractAndAddMarkers(assistantContent);
    } catch {
      const fallback: Message = {
        id: uid(),
        role: 'assistant',
        content:
          'Nije moguće povezati se sa serverom. Proverite da li je API pokrenut (npr. `pnpm dev:api`).',
        timestamp: new Date(),
      };

      set((s) => ({
        messages: [...s.messages, fallback],
        isLoading: false,
      }));
    }
  },

  addFeedback: (messageId, sentiment) =>
    set((s) => ({
      messages: s.messages.map((m) =>
        m.id === messageId ? { ...m, feedback: sentiment } : m,
      ),
    })),

  clearChat: () => {
    set({ messages: [], conversationId: null, isLoading: false });
    useMapStore.getState().clearMarkers();
  },
}));

const KNOWN_LOCATIONS: Record<string, { lat: number; lng: number }> = {
  'vračar': { lat: 44.7937, lng: 20.4754 },
  'dorćol': { lat: 44.8228, lng: 20.4628 },
  'liman': { lat: 45.2441, lng: 19.8275 },
  'grbavica': { lat: 45.2481, lng: 19.8381 },
  'novi beograd': { lat: 44.8059, lng: 20.4122 },
  'zemun': { lat: 44.8450, lng: 20.4010 },
  'savski venac': { lat: 44.7983, lng: 20.4541 },
  'stari grad': { lat: 44.8184, lng: 20.4586 },
  'palilula': { lat: 44.8227, lng: 20.4819 },
  'voždovac': { lat: 44.7739, lng: 20.4901 },
  'čukarica': { lat: 44.7800, lng: 20.4100 },
  'rakovica': { lat: 44.7612, lng: 20.4500 },
  'petrovaradin': { lat: 45.2519, lng: 19.8639 },
  'detelinara': { lat: 45.2600, lng: 19.8300 },
  'telep': { lat: 45.2400, lng: 19.8100 },
  'podbara': { lat: 45.2575, lng: 19.8475 },
};

function extractAndAddMarkers(text: string) {
  const lower = text.toLowerCase();
  const newMarkers: MapMarker[] = [];

  for (const [name, coords] of Object.entries(KNOWN_LOCATIONS)) {
    if (lower.includes(name)) {
      newMarkers.push({
        id: `loc-${name}`,
        lat: coords.lat,
        lng: coords.lng,
        category: 'default',
        label: name.charAt(0).toUpperCase() + name.slice(1),
      });
    }
  }

  if (newMarkers.length > 0) {
    const mapStore = useMapStore.getState();
    mapStore.addMarkers(newMarkers);
    mapStore.setCenter(newMarkers[0].lat, newMarkers[0].lng);
    if (newMarkers.length === 1) {
      mapStore.setZoom(14);
    }
  }
}

