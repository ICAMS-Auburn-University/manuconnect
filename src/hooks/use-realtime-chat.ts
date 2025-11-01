import { useCallback, useEffect, useRef, useState } from 'react';
import type { RealtimeChannel } from '@supabase/supabase-js';

import type {
  ChatMessage,
  MessageSummary,
  UseRealtimeChatOptions,
} from '@/domain/chats/types';
import { abbreviateUUID } from '@/lib/utils/transforms';
import { createSupabaseServiceRoleClient } from '@/app/_internal/supabase/server-client';

type MessagesResponse = {
  messages?: MessageSummary[];
  message?: MessageSummary;
  error?: string;
};

export function useRealtimeChat({
  chatId,
  currentUserName,
  currentUserId,
  participants = {},
}: UseRealtimeChatOptions) {
  // const supabase = useMemo(() => createClient(), []);
  const channelRef = useRef<RealtimeChannel | null>(null);

  const [resolvedCurrentUserId, setResolvedCurrentUserId] = useState<
    string | null
  >(currentUserId);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isConnected, setIsConnected] = useState(false);

  useEffect(() => {
    setResolvedCurrentUserId(currentUserId);
  }, [currentUserId]);

  const resolveUserName = useCallback(
    (senderId: string) => {
      if (senderId === resolvedCurrentUserId) {
        return currentUserName || 'You';
      }
      return participants[senderId] ?? `User ${abbreviateUUID(senderId)}`;
    },
    [resolvedCurrentUserId, currentUserName, participants]
  );

  const mapSummaryToMessage = useCallback(
    (summary: MessageSummary): ChatMessage => ({
      id: summary.message_id,
      chatId: summary.chat_id,
      content: summary.content,
      createdAt: summary.time_sent,
      user: {
        id: summary.sender_id,
        name: resolveUserName(summary.sender_id),
      },
    }),
    [resolveUserName]
  );

  const mergeMessage = useCallback((incoming: ChatMessage) => {
    setMessages((previous) => {
      if (previous.some((item) => item.id === incoming.id)) {
        return previous;
      }

      const next = [...previous, incoming];
      next.sort(
        (a, b) =>
          new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
      );
      return next;
    });
  }, []);

  // Load existing messages from API
  useEffect(() => {
    if (!chatId) {
      setMessages([]);
      return;
    }

    const abortController = new AbortController();

    const loadMessages = async () => {
      try {
        const response = await fetch(`/api/chats/${chatId}/messages`, {
          method: 'GET',
          credentials: 'include',
          signal: abortController.signal,
        });

        if (!response.ok) {
          const payload = (await response.json().catch(() => ({}))) as
            | MessagesResponse
            | undefined;
          const errorMessage =
            payload?.error ??
            `Failed to load messages (status ${response.status})`;
          console.error(errorMessage);
          setMessages([]);
          return;
        }

        const payload = (await response.json()) as MessagesResponse;
        const rows = payload.messages ?? [];
        setMessages(rows.map(mapSummaryToMessage));
      } catch (error) {
        if (!abortController.signal.aborted) {
          console.error('Failed to load chat messages', error);
          setMessages([]);
        }
      }
    };

    void loadMessages();

    return () => {
      abortController.abort();
    };
  }, [chatId, mapSummaryToMessage]);

  // Subscribe to realtime updates (broadcast channel configured elsewhere)
  useEffect(() => {
    let isMounted = true;
    let supabaseClient: Awaited<
      ReturnType<typeof createSupabaseServiceRoleClient>
    > | null = null;

    const subscribe = async () => {
      if (!chatId || !resolvedCurrentUserId) {
        return;
      }

      const client = await createSupabaseServiceRoleClient();
      if (!isMounted) {
        return;
      }

      supabaseClient = client;

      if (channelRef.current) {
        void client.removeChannel(channelRef.current);
        channelRef.current = null;
      }

      const topic = `chat:${chatId}:messages`;

      const channel = client
        .channel(topic, {
          config: {
            broadcast: {
              ack: true,
            },
          },
        })
        .on('broadcast', { event: 'message' }, (payload) => {
          const raw = payload.message as MessageSummary;
          const message = mapSummaryToMessage(raw);
          mergeMessage(message);
        });

      channel.subscribe((status) => {
        if (status === 'SUBSCRIBED') {
          setIsConnected(true);
        } else if (status === 'CHANNEL_ERROR') {
          console.error('Failed to subscribe to messages channel', {
            topic,
          });
          setIsConnected(false);
        } else if (status === 'CLOSED') {
          setIsConnected(false);
        }
      });

      channelRef.current = channel;
    };

    void subscribe();

    return () => {
      isMounted = false;
      setIsConnected(false);
      if (supabaseClient && channelRef.current) {
        void supabaseClient.removeChannel(channelRef.current);
        channelRef.current = null;
      }
    };
  }, [chatId, resolvedCurrentUserId, mapSummaryToMessage, mergeMessage]);

  const sendMessage = useCallback(
    async (content: string) => {
      const trimmed = content.trim();
      if (!trimmed || !resolvedCurrentUserId) {
        return;
      }

      const response = await fetch(`/api/chats/${chatId}/messages`, {
        method: 'POST',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ content: trimmed }),
      });

      const payload = (await response.json().catch(() => ({}))) as
        | MessagesResponse
        | undefined;

      if (!response.ok || !payload?.message) {
        const errorMessage =
          payload?.error ??
          `Failed to send message (status ${response.status})`;
        throw new Error(errorMessage);
      }

      const message = mapSummaryToMessage(payload.message);
      mergeMessage(message);
    },
    [chatId, mergeMessage, mapSummaryToMessage, resolvedCurrentUserId]
  );

  return {
    messages,
    sendMessage,
    isConnected,
    currentUserId: resolvedCurrentUserId,
  };
}
