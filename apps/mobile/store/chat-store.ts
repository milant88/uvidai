import { create } from 'zustand';

export interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

interface ChatState {
  messages: Message[];
  isLoading: boolean;
  conversationId: string | null;
  sendMessage: (content: string) => Promise<void>;
  clearChat: () => void;
}

function uid(): string {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

const API_BASE = process.env.EXPO_PUBLIC_API_URL ?? 'http://localhost:3000';

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
      conversationId: s.conversationId ?? uid(),
    }));

    try {
      const res = await fetch(`${API_BASE}/api/v1/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: content,
          conversationId: get().conversationId,
        }),
      });

      let assistantContent: string;

      if (res.ok) {
        const json = await res.json();
        const payload = json.data ?? json;
        assistantContent =
          payload.message?.content ??
          payload.reply ??
          payload.message ??
          'Primio sam vaš upit. Obrađujem...';

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
      };

      set((s) => ({
        messages: [...s.messages, assistantMsg],
        isLoading: false,
      }));
    } catch {
      const fallback: Message = {
        id: uid(),
        role: 'assistant',
        content:
          'Nije moguće povezati se sa serverom. Proverite da li je API pokrenut i da li je EXPO_PUBLIC_API_URL tačan.',
        timestamp: new Date(),
      };

      set((s) => ({
        messages: [...s.messages, fallback],
        isLoading: false,
      }));
    }
  },

  clearChat: () =>
    set({ messages: [], conversationId: null, isLoading: false }),
}));
