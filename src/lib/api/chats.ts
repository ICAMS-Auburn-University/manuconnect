import type { StartChatPayload } from '@/domain/chats/types';
import { ChatsSchema } from '@/types/schemas';

export async function startDirectChat({
  targetUserId,
  orderId,
}: StartChatPayload): Promise<ChatsSchema> {
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

  const data = (await response.json()) as ChatsSchema;
  console.log('Started chat:', data);
  return data;
}
