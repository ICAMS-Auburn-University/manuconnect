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
  insertMessageAttachments,
  fetchAttachmentsForMessages,
  deleteMessageById,
  fetchMessageById,
} from '@/lib/supabase/chats';
import type {
  ChatSummary,
  ChatsResponse,
  CurrentUserSummary,
  MessageSummary,
} from './types';
import {
  ChatsSchema,
  MessageAttachmentsSchema,
  MessagesSchema,
} from '@/types/schemas';

const DEFAULT_MESSAGES_LIMIT = 50;
const MAX_MESSAGES_LIMIT = 200;
const MAX_ATTACHMENTS_PER_MESSAGE = 5;

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

const toAttachmentSummary = (
  record: MessageAttachmentsSchema
): MessageSummary['attachments'][number] => ({
  attachment_id: record.attachment_id,
  bucket_id: record.bucket_id,
  path: record.path,
  filename: record.filename,
  mime: record.mime,
  size: record.size,
  time_uploaded: record.time_uploaded,
});

const toMessageSummary = (
  row: MessagesSchema,
  attachments: MessageAttachmentsSchema[]
): MessageSummary => ({
  message_id: row.message_id,
  chat_id: row.chat_id,
  sender_id: row.sender_id,
  content: row.content ?? '',
  time_sent: row.time_sent,
  read_by: (row.read_by as string[] | null) ?? null,
  attachment_ids: (row.attachment_ids as string[] | null) ?? [],
  attachments: attachments.map(toAttachmentSummary),
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
  const messageLookup = new Map<
    string,
    { chatIndex: number; schema: MessagesSchema }
  >();

  for (const chat of chats) {
    const members = (chat.members as string[]) ?? [];
    members.forEach((member) => member && memberIds.add(member));

    const message = await fetchLatestMessageForChat(chat.chat_id);
    if (message) {
      messageLookup.set(message.message_id, {
        chatIndex: summaries.length,
        schema: message,
      });
    }
    summaries.push(
      toChatSummary(chat, message ? toMessageSummary(message, []) : null)
    );
  }

  if (messageLookup.size > 0) {
    const attachmentsByMessage = await fetchAttachmentsForMessages([
      ...messageLookup.keys(),
    ]);

    messageLookup.forEach(({ chatIndex, schema }, messageId) => {
      const chatSummary = summaries[chatIndex];
      if (!chatSummary.last_message) {
        return;
      }
      const attachments = attachmentsByMessage[messageId] ?? [];
      chatSummary.last_message = toMessageSummary(schema, attachments);
    });
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

  const attachmentsByMessage = await fetchAttachmentsForMessages(
    rawMessages.map((row) => row.message_id)
  );

  return rawMessages
    .map((row) =>
      toMessageSummary(row, attachmentsByMessage[row.message_id] ?? [])
    )
    .sort(
      (a, b) =>
        new Date(a.time_sent).getTime() - new Date(b.time_sent).getTime()
    );
}

export async function getChatMessageById(
  chatId: string,
  messageId: string
): Promise<MessageSummary | null> {
  const user = await requireCurrentUser();
  await ensureChatMember(chatId, user.id);

  const message = await fetchMessageById(messageId);
  if (!message || message.chat_id !== chatId) {
    return null;
  }

  const attachmentsByMessage = await fetchAttachmentsForMessages([messageId]);
  return toMessageSummary(message, attachmentsByMessage[messageId] ?? []);
}

export async function sendChatMessage(
  chatId: string,
  content: string,
  attachments: {
    attachment_id: string;
    bucket_id: string;
    path: string;
    filename: string;
    mime: string;
    size: number;
    time_uploaded: string;
  }[] = []
): Promise<MessageSummary> {
  const user = await requireCurrentUser();
  await ensureChatMember(chatId, user.id);

  const trimmed = content.trim();
  if (!trimmed && attachments.length === 0) {
    throw new ChatsServiceError('Missing content', 400);
  }

  if (attachments.length > MAX_ATTACHMENTS_PER_MESSAGE) {
    throw new ChatsServiceError('Too many attachments', 400);
  }

  const timestamp = new Date().toISOString();

  const message = await insertMessage({
    chat_id: chatId,
    sender_id: user.id,
    content: trimmed,
    time_sent: timestamp,
    read_by: [user.id],
    attachment_ids: attachments.map((item) => item.attachment_id),
  });

  try {
    const insertedAttachments = await insertMessageAttachments(
      attachments.map((item) => ({
        ...item,
        message_id: message.message_id,
      }))
    );

    return toMessageSummary(message, insertedAttachments);
  } catch (error) {
    await deleteMessageById(message.message_id);
    throw new ChatsServiceError(
      error instanceof Error ? error.message : 'Failed to save attachments',
      500
    );
  }
}
