export type StartChatPayload = {
  targetUserId: string;
  orderId: number;
};

export interface ChatMessage {
  id: string;
  chatId: string;
  content: string;
  createdAt: string;
  user: {
    id: string;
    name: string;
  };
}

export interface UseRealtimeChatOptions {
  chatId: string;
  currentUserName: string;
  participants: Record<string, string>;
}
