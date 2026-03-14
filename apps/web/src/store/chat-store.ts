import { create } from 'zustand';

export interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  feedback?: 'positive' | 'negative';
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
      conversationId: s.conversationId ?? uid(),
    }));

    try {
      const res = await fetch('/api/v1/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: content,
          conversationId: get().conversationId,
        }),
      });

      let assistantContent: string;

      if (res.ok) {
        const data = await res.json();
        assistantContent =
          data.reply ?? data.message ?? 'Primio sam vaš upit. Obrađujem...';
      } else {
        // Mock response while the API isn't wired up
        assistantContent = getMockResponse(content);
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
        content: getMockResponse(content),
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

  clearChat: () =>
    set({ messages: [], conversationId: null, isLoading: false }),
}));

function getMockResponse(input: string): string {
  const lower = input.toLowerCase();
  if (lower.includes('beograd') || lower.includes('belgrad')) {
    return 'Beograd ima mnogo zanimljivih kvartova! **Vračar** je poznat po mirnom okruženju i odličnoj infrastrukturi, dok **Dorćol** nudi bogat kulturni život. Želite li da analiziram određeni kvart?';
  }
  if (lower.includes('novi sad')) {
    return 'Novi Sad, prestonica kulture! **Liman** je popularan među porodicama, a **Grbavica** je odlična za mlade profesionalce. Koji aspekt vas zanima — transport, škole, ili nešto drugo?';
  }
  return 'Hvala na pitanju! Mogu vam pomoći sa analizom lokacija u Beogradu i Novom Sadu — kvalitet vazduha, škole, transport, zelenilo i još mnogo toga. Pitajte me nešto konkretno!';
}
