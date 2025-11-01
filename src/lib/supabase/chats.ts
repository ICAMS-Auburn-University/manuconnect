import { createSupabaseServiceRoleClient } from '@/app/_internal/supabase/server-client';
import {
  ChatsSchema,
  MessageAttachmentsSchema,
  MessagesSchema,
  UsersMapSchema,
} from '@/types/schemas';

type ChatInsertPayload = {
  members: string[];
  is_direct_message: boolean;
  created_at: string;
};

type MessageInsertPayload = {
  chat_id: string;
  sender_id: string;
  content: string;
  time_sent: string;
  read_by: string[];
  attachment_ids: string[];
};

type MessageAttachmentInsertPayload = {
  attachment_id: string;
  message_id: string;
  bucket_id: string;
  path: string;
  filename: string;
  mime: string;
  size: number;
  time_uploaded: string;
};

export async function fetchChatsForMember(
  userId: string
): Promise<ChatsSchema[]> {
  const supabase = await createSupabaseServiceRoleClient();

  const { data, error } = await supabase
    .from('Chats')
    .select('*')
    .contains('members', [userId])
    .order('created_at', { ascending: false });

  if (error) {
    throw new Error(error.message);
  }

  return (data as ChatsSchema[]) ?? [];
}

export async function findDirectMessageBetweenMembers(
  userId: string,
  targetUserId: string
): Promise<ChatsSchema | null> {
  const supabase = await createSupabaseServiceRoleClient();

  const { data, error } = await supabase
    .from('Chats')
    .select('*')
    .eq('is_direct_message', true)
    .contains('members', [userId, targetUserId])
    .limit(1)
    .maybeSingle();

  if (error) {
    throw new Error(error.message);
  }

  return (data as ChatsSchema) ?? null;
}

export async function insertChat(
  payload: ChatInsertPayload
): Promise<ChatsSchema> {
  const supabase = await createSupabaseServiceRoleClient();

  const { data, error } = await supabase
    .from('Chats')
    .insert(payload)
    .select('*')
    .single();

  if (error || !data) {
    throw new Error(error?.message ?? 'Failed to insert chat');
  }

  return data as ChatsSchema;
}

export async function fetchChatById(
  chatId: string
): Promise<ChatsSchema | null> {
  const supabase = await createSupabaseServiceRoleClient();

  const { data, error } = await supabase
    .from('Chats')
    .select('*')
    .eq('chat_id', chatId)
    .maybeSingle();

  if (error) {
    throw new Error(error.message);
  }

  return (data as ChatsSchema) ?? null;
}

export async function fetchLatestMessageForChat(
  chatId: string
): Promise<MessagesSchema | null> {
  const supabase = await createSupabaseServiceRoleClient();

  const { data, error } = await supabase
    .from('Messages')
    .select('*')
    .eq('chat_id', chatId)
    .order('time_sent', { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error) {
    throw new Error(error.message);
  }

  return (data as MessagesSchema) ?? null;
}

export async function fetchMessagesForChat(
  chatId: string,
  options: {
    limit: number;
    before?: string | null;
  }
): Promise<MessagesSchema[]> {
  const supabase = await createSupabaseServiceRoleClient();

  let query = supabase
    .from('Messages')
    .select('*')
    .eq('chat_id', chatId)
    .order('time_sent', { ascending: false })
    .limit(options.limit);

  if (options.before) {
    query = query.lt('time_sent', options.before);
  }

  const { data, error } = await query;

  if (error) {
    throw new Error(error.message);
  }

  return (data as MessagesSchema[]) ?? [];
}

export async function fetchMessageById(
  messageId: string
): Promise<MessagesSchema | null> {
  const supabase = await createSupabaseServiceRoleClient();

  const { data, error } = await supabase
    .from('Messages')
    .select('*')
    .eq('message_id', messageId)
    .maybeSingle();

  if (error) {
    throw new Error(error.message);
  }

  return (data as MessagesSchema) ?? null;
}

export async function insertMessage(
  payload: MessageInsertPayload
): Promise<MessagesSchema> {
  const supabase = await createSupabaseServiceRoleClient();

  const { data, error } = await supabase
    .from('Messages')
    .insert(payload)
    .select('*')
    .single();

  if (error || !data) {
    throw new Error(error?.message ?? 'Failed to insert message');
  }

  return data as MessagesSchema;
}

export async function insertMessageAttachments(
  payload: MessageAttachmentInsertPayload[]
): Promise<MessageAttachmentsSchema[]> {
  if (payload.length === 0) {
    return [];
  }

  const supabase = await createSupabaseServiceRoleClient();

  const { data, error } = await supabase
    .from('MessageAttachments')
    .insert(payload)
    .select('*');

  if (error) {
    throw new Error(error.message);
  }

  return (data as MessageAttachmentsSchema[]) ?? [];
}

export async function fetchAttachmentsForMessages(
  messageIds: string[]
): Promise<Record<string, MessageAttachmentsSchema[]>> {
  if (messageIds.length === 0) {
    return {};
  }

  const supabase = await createSupabaseServiceRoleClient();

  const { data, error } = await supabase
    .from('MessageAttachments')
    .select('*')
    .in('message_id', messageIds);

  if (error) {
    throw new Error(error.message);
  }

  const rows = (data as MessageAttachmentsSchema[]) ?? [];
  return rows.reduce<Record<string, MessageAttachmentsSchema[]>>((acc, row) => {
    if (!acc[row.message_id]) {
      acc[row.message_id] = [];
    }
    acc[row.message_id].push(row);
    return acc;
  }, {});
}

export async function deleteMessageById(messageId: string): Promise<void> {
  const supabase = await createSupabaseServiceRoleClient();
  const { error } = await supabase
    .from('Messages')
    .delete()
    .eq('message_id', messageId);

  if (error) {
    throw new Error(error.message);
  }
}

export async function fetchUsersDisplayNames(
  userIds: string[]
): Promise<Record<string, string>> {
  if (userIds.length === 0) {
    return {};
  }

  const supabase = await createSupabaseServiceRoleClient();

  const { data, error } = await supabase
    .from('UsersMap')
    .select('id, display_name')
    .in('id', userIds);

  if (error) {
    throw new Error(error.message);
  }

  const result: Record<string, string> = {};
  (data as UsersMapSchema[] | null)?.forEach((row) => {
    if (row.id) {
      result[row.id] = row.display_name ?? '';
    }
  });

  return result;
}
