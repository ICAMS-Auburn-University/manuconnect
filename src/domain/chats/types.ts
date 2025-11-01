export type StartChatPayload = {
  targetUserId: string;
  orderId: string;
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

export interface MessageSummary {
  message_id: string;
  chat_id: string;
  sender_id: string;
  content: string;
  time_sent: string;
  read_by: string[] | null;
}

export interface ChatSummary {
  chat_id: string;
  members: string[];
  is_direct_message: boolean;
  created_at: string;
  last_message: MessageSummary | null;
  unread_count: number;
}

export interface CurrentUserSummary {
  id: string;
  name: string;
  email?: string | null;
}

export interface ChatsResponse {
  currentUser: CurrentUserSummary | null;
  chats: ChatSummary[];
  participantDisplayNames: Record<string, string>;
}

export interface UseRealtimeChatOptions {
  chatId: string;
  currentUserName: string;
  currentUserId: string | null;
  participants: Record<string, string>;
}
