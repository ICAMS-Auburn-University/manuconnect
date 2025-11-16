export type StartChatPayload = {
  targetUserId: string;
  orderId: string;
};

export interface MessageAttachmentSummary {
  attachment_id: string;
  bucket_id: string;
  path: string;
  filename: string;
  mime: string;
  size: number;
  time_uploaded: string;
}

export interface ChatMessageAttachment extends MessageAttachmentSummary {
  signedUrl?: string | null;
}

export interface ChatMessage {
  id: string;
  chatId: string;
  content: string;
  createdAt: string;
  user: {
    id: string;
    name: string;
  };
  attachmentIds: string[];
  attachments: ChatMessageAttachment[];
}

export interface MessageSummary {
  message_id: string;
  chat_id: string;
  sender_id: string;
  content: string;
  time_sent: string;
  read_by: string[] | null;
  attachment_ids: string[];
  attachments: MessageAttachmentSummary[];
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
