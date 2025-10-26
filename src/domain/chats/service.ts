'use server';

import 'server-only';

import type { User } from '@supabase/supabase-js';

import { getCurrentUser as getSupabaseCurrentUser } from '@/lib/supabase/users';
import {
  fetchChatsForMember,
  fetchLatestMessageForChat,
  findDirectMessageBetweenMembers,
  fetchMessagesForChat,
  fetchUsersDisplayNames,
  insertChat,
  insertMessage,
  fetchChatById,
} from '@/lib/supabase/chats';
import type {
  ChatSummary,
  ChatsResponse,
  CurrentUserSummary,
  MessageSummary,
} from './types';
import { ChatsSchema, MessagesSchema } from '@/types/schemas';

const DEFAULT_MESSAGES_LIMIT = 50;
const MAX_MESSAGES_LIMIT = 200;

export class ChatsServiceError extends Error {
  status: number;

  constructor(message: string, status: number) {
    super(message);
    this.name = 'ChatsServiceError';
    this.status = status;
  }
}

const sanitizeLimit = (limit?: number | null) => {
  if (typeof limit !== 'number' || Number.isNaN(limit)) {
    return DEFAULT_MESSAGES_LIMIT;
  }
  return Math.min(Math.max(limit, 1), MAX_MESSAGES_LIMIT);
};

const toMessageSummary = (row: MessagesSchema): MessageSummary => ({
  message_id: row.message_id,
  chat_id: row.chat_id,
  sender_id: row.sender_id,
  content: row.content ?? '',
  time_sent: row.time_sent,
  read_by: (row.read_by as string[] | null) ?? null,
});

const toChatSummary = (
  chat: ChatsSchema,
  lastMessage: MessageSummary | null
): ChatSummary => ({
  chat_id: chat.chat_id,
  members: (chat.members as string[]) ?? [],
  is_direct_message: Boolean(chat.is_direct_message),
  created_at: chat.created_at ?? new Date().toISOString(),
  last_message: lastMessage,
  unread_count: 0,
});

const getUserDisplayName = (user: User): string =>
  (user.user_metadata?.display_name as string | undefined) ??
  (user.user_metadata?.full_name as string | undefined) ??
  (user.user_metadata?.company_name as string | undefined) ??
  user.email ??
  'You';

const requireCurrentUser = async (): Promise<User> => {
  const { user, error } = await getSupabaseCurrentUser();

  if (error) {
    throw new ChatsServiceError(error.message ?? 'Unauthorized', 401);
  }

  if (!user) {
    throw new ChatsServiceError('Unauthorized', 401);
  }

  return user;
};

const ensureChatMember = async (
  chatId: string,
  userId: string
): Promise<ChatsSchema> => {
  const chat = await fetchChatById(chatId);

  if (!chat) {
    throw new ChatsServiceError('Chat not found', 404);
  }

  const members = (chat.members as string[]) ?? [];
  if (!members.includes(userId)) {
    throw new ChatsServiceError('Forbidden', 403);
  }

  return chat;
};

const sortChatsByActivity = (chats: ChatSummary[]) => {
  const getTimestamp = (chat: ChatSummary) =>
    new Date(
      chat.last_message?.time_sent ?? chat.created_at ?? '1970-01-01T00:00:00Z'
    ).getTime();

  return [...chats].sort((a, b) => getTimestamp(b) - getTimestamp(a));
};

const buildCurrentUserSummary = (user: User): CurrentUserSummary => ({
  id: user.id,
  name: getUserDisplayName(user),
  email: user.email,
});

export async function startDirectChat(
  targetUserId: string
): Promise<ChatsSchema> {
  const user = await requireCurrentUser();

  if (targetUserId === user.id) {
    throw new ChatsServiceError('Cannot start a chat with yourself', 400);
  }

  const existing = await findDirectMessageBetweenMembers(user.id, targetUserId);
  if (existing) {
    return existing;
  }

  const payload = {
    members: [user.id, targetUserId],
    is_direct_message: true,
    created_at: new Date().toISOString(),
  };

  return insertChat(payload);
}

export async function getChatsForCurrentUser(): Promise<ChatsResponse> {
  const user = await requireCurrentUser();

  const chats = await fetchChatsForMember(user.id);
  if (chats.length === 0) {
    const currentUser = buildCurrentUserSummary(user);
    return {
      currentUser,
      chats: [],
      participantDisplayNames: {
        [user.id]: currentUser.name,
      },
    };
  }

  const summaries: ChatSummary[] = [];
  const memberIds = new Set<string>();

  for (const chat of chats) {
    const members = (chat.members as string[]) ?? [];
    members.forEach((member) => member && memberIds.add(member));

    const message = await fetchLatestMessageForChat(chat.chat_id);
    summaries.push(
      toChatSummary(chat, message ? toMessageSummary(message) : null)
    );
  }

  const participantDisplayNames = await fetchUsersDisplayNames([...memberIds]);

  const currentUser = buildCurrentUserSummary(user);
  participantDisplayNames[user.id] = currentUser.name;

  return {
    currentUser,
    chats: sortChatsByActivity(summaries),
    participantDisplayNames,
  };
}

export async function getChatMessages(
  chatId: string,
  options: { limit?: number; before?: string | null } = {}
): Promise<MessageSummary[]> {
  const user = await requireCurrentUser();
  await ensureChatMember(chatId, user.id);

  const rawMessages = await fetchMessagesForChat(chatId, {
    limit: sanitizeLimit(options.limit ?? null),
    before: options.before ?? null,
  });

  return rawMessages
    .map(toMessageSummary)
    .sort(
      (a, b) =>
        new Date(a.time_sent).getTime() - new Date(b.time_sent).getTime()
    );
}

export async function sendChatMessage(
  chatId: string,
  content: string
): Promise<MessageSummary> {
  const user = await requireCurrentUser();
  await ensureChatMember(chatId, user.id);

  const trimmed = content.trim();
  if (!trimmed) {
    throw new ChatsServiceError('Missing content', 400);
  }

  const message = await insertMessage({
    chat_id: chatId,
    sender_id: user.id,
    content: trimmed,
    time_sent: new Date().toISOString(),
    read_by: [user.id],
  });

  return toMessageSummary(message);
}
