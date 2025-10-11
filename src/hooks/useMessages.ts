import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import type { RealtimeChannel } from '@supabase/supabase-js';

import { createClient } from '@/services/supabase/client';

export interface Message {
  message_id: string;
  chat_id: string;
  sender_id: string;
  content: string;
  time_sent: string;
  read_by: string[];
}

type UseMessagesOptions = {
  userId?: string | null;
  pageSize?: number;
};

const TABLE_NAME = 'Messages';

export function useMessages(
  chatId: string | null,
  { userId, pageSize = 50 }: UseMessagesOptions = {}
) {
  const supabase = useMemo(() => createClient(), []);
  const channelRef = useRef<RealtimeChannel | null>(null);

  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Fetch the latest messages whenever chatId changes.
  useEffect(() => {
    if (!chatId || !userId) {
      setMessages([]);
      return;
    }

    let isMounted = true;
    setIsLoading(true);
    setError(null);

    const load = async () => {
      try {
        const resp = await fetch(
          `/api/chats/${chatId}/messages?limit=${pageSize}`,
          {
            headers: {
              'x-user-id': userId,
            },
          }
        );

        if (!resp.ok) {
          const payload = await resp.json().catch(() => ({}));
          throw new Error(payload?.error ?? 'Failed to load messages');
        }

        const payload = (await resp.json()) as { messages?: Message[] };
        if (!isMounted) {
          return;
        }

        if (payload.messages) {
          setMessages(
            payload.messages.sort(
              (a, b) =>
                new Date(a.time_sent).getTime() -
                new Date(b.time_sent).getTime()
            )
          );
        } else {
          setMessages([]);
        }
      } catch (err) {
        if (!isMounted) {
          return;
        }
        setError(
          err instanceof Error ? err.message : 'Failed to load messages'
        );
        setMessages([]);
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    };

    load();

    return () => {
      isMounted = false;
    };
  }, [chatId, userId, pageSize]);

  // Subscribe to realtime inserts for the active chat.
  useEffect(() => {
    if (!chatId) {
      if (channelRef.current) {
        supabase.removeChannel(channelRef.current);
        channelRef.current = null;
      }
      return;
    }

    if (channelRef.current) {
      supabase.removeChannel(channelRef.current);
      channelRef.current = null;
    }

    const channel = supabase
      .channel(`messages:${chatId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: TABLE_NAME,
          filter: `chat_id=eq.${chatId}`,
        },
        (payload) => {
          const incoming = payload.new as Message;
          setMessages((prev) => {
            const next = [...prev, incoming];
            return next.sort(
              (a, b) =>
                new Date(a.time_sent).getTime() -
                new Date(b.time_sent).getTime()
            );
          });
        }
      )
      .subscribe();

    channelRef.current = channel;

    return () => {
      if (channelRef.current) {
        supabase.removeChannel(channelRef.current);
        channelRef.current = null;
      }
    };
  }, [chatId, supabase]);

  const sendMessage = useCallback(
    async (content: string) => {
      if (!chatId) {
        throw new Error('No chat selected');
      }
      if (!userId) {
        throw new Error('User must be authenticated to send messages');
      }
      const trimmed = content.trim();
      if (!trimmed) {
        return null;
      }

      const resp = await fetch(`/api/chats/${chatId}/messages`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-user-id': userId,
        },
        body: JSON.stringify({ content: trimmed }),
      });

      if (!resp.ok) {
        const payload = await resp.json().catch(() => ({}));
        throw new Error(payload?.error ?? 'Failed to send message');
      }

      const { message } = (await resp.json()) as { message?: Message };
      if (message) {
        setMessages((prev) => {
          const exists = prev.some((m) => m.message_id === message.message_id);
          if (exists) {
            return prev;
          }
          const next = [...prev, message];
          next.sort(
            (a, b) =>
              new Date(a.time_sent).getTime() - new Date(b.time_sent).getTime()
          );
          return next;
        });
      }
      return message ?? null;
    },
    [chatId, userId]
  );

  return {
    messages,
    isLoading,
    error,
    sendMessage,
  };
}
