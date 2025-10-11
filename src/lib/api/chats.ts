import type { Tables } from '@/types/supabase';

type StartChatPayload = {
  targetUserId: string;
  orderId?: number;
};

type StartChatResponse = {
  chat: Tables<'Chats'>;
};

export async function startDirectChat({
  targetUserId,
  orderId,
}: StartChatPayload): Promise<Tables<'Chats'>> {
  const response = await fetch('/api/chats', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ targetUserId, orderId }),
  });

  if (!response.ok) {
    const payload = (await response.json().catch(() => ({}))) as {
      error?: string;
    };
    throw new Error(payload?.error ?? 'Failed to start chat');
  }

  const data = (await response.json()) as StartChatResponse;
  return data.chat;
}
