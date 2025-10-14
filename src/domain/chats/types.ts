import type { Tables } from '@/types/supabase';

export type StartChatPayload = {
  targetUserId: string;
  orderId: number;
};

export type StartChatResponse = {
  chat: Tables<'Chats'>;
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

export type MessageRow = {
  message_id: string;
  chat_id: string;
  sender_id: string;
  content: string;
  time_sent: string;
  read_by: string[];
};

export interface UseRealtimeChatOptions {
  chatId: string;
  currentUserName: string;
  participants: Record<string, string>;
}
