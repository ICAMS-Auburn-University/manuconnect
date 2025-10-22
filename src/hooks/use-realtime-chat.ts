import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import type { RealtimeChannel } from '@supabase/supabase-js';

import { createClient } from '@/services/supabase/client';
import { abbreviateUUID } from '@/lib/utils/transforms';

import type {
  ChatMessage,
  UseRealtimeChatOptions,
} from '@/domain/chats/types';

import { MessagesSchema } from '@/types/schemas';

const TABLE_NAME = 'Messages';

export function useRealtimeChat({
  chatId,
  currentUserName,
  participants = {},
}: UseRealtimeChatOptions) {
  const supabase = useMemo(() => createClient(), []);
  const channelRef = useRef<RealtimeChannel | null>(null);

  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isConnected, setIsConnected] = useState(false);

  useEffect(() => {
    let isMounted = true;
    supabase.auth.getUser().then(({ data }) => {
      if (!isMounted) {
        return;
      }
      setCurrentUserId(data.user?.id ?? null);
    });

    return () => {
      isMounted = false;
    };
  }, [supabase]);

  const resolveUserName = useCallback(
    (senderId: string) => {
      if (senderId === currentUserId) {
        return currentUserName || 'You';
      }
      return (
        participants[senderId] ?? `User ${abbreviateUUID(senderId)}`
      );
    },
    [currentUserId, currentUserName, participants]
  );

  const mapRowToMessage = useCallback(
    (row: MessagesSchema): ChatMessage => ({
      id: row.message_id,
      chatId: row.chat_id,
      content: row.content,
      createdAt: row.time_sent,
      user: {
        id: row.sender_id,
        name: resolveUserName(row.sender_id),
      },
    }),
    [resolveUserName]
  );

  // Load existing messages
  useEffect(() => {
    if (!chatId || !currentUserId) {
      setMessages([]);
      return;
    }

    let isMounted = true;

    const loadMessages = async () => {
      const { data, error } = await supabase
        .from(TABLE_NAME)
        .select('message_id, chat_id, sender_id, content, time_sent, read_by')
        .eq('chat_id', chatId)
        .order('time_sent', { ascending: true });

      if (error) {
        console.error('Failed to load chat messages', error);
        if (isMounted) {
          setMessages([]);
        }
        return;
      }

      if (!data) {
        if (isMounted) {
          setMessages([]);
        }
        return;
      }

      if (isMounted) {
        setMessages(data.map((row) => mapRowToMessage(row as MessagesSchema)));
      }
    };

    void loadMessages();

    return () => {
      isMounted = false;
    };
  }, [chatId, currentUserId, mapRowToMessage, supabase]);

  // Subscribe to realtime broadcast updates
  useEffect(() => {
    if (!chatId || !currentUserId) {
      return;
    }

    if (channelRef.current) {
      void supabase.removeChannel(channelRef.current);
      channelRef.current = null;
    }

    const topic = `chat:${chatId}:messages`;

    const channel = supabase
      .channel(topic, {
        config: {
          broadcast: {
            ack: true,
          },
        },
      })
      .on('broadcast', { event: 'message' }, (payload) => {
        const row = payload.message as MessagesSchema;
        const message = mapRowToMessage(row);
        setMessages((previous) => {
          if (previous.some((item) => item.id === message.id)) {
            return previous;
          }
          const next = [...previous, message];
          next.sort(
            (a, b) =>
              new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
          );
          return next;
        });
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

    return () => {
      setIsConnected(false);
      if (channelRef.current) {
        void supabase.removeChannel(channelRef.current);
        channelRef.current = null;
      }
    };
  }, [chatId, currentUserId, mapRowToMessage, supabase]);

  const sendMessage = useCallback(
    async (content: string) => {
      const trimmed = content.trim();
      if (!trimmed || !currentUserId) {
        return;
      }

      const { data, error } = await supabase
        .from(TABLE_NAME)
        .insert({
          chat_id: chatId,
          sender_id: currentUserId,
          content: trimmed,
          time_sent: new Date().toISOString(),
          read_by: [currentUserId],
        })
        .select('message_id, chat_id, sender_id, content, time_sent, read_by')
        .single();

      if (error) {
        throw new Error(error.message);
      }

      if (data) {
        const message = mapRowToMessage(data as MessagesSchema);
        setMessages((previous) => {
          if (previous.some((item) => item.id === message.id)) {
            return previous;
          }
          const next = [...previous, message];
          next.sort(
            (a, b) =>
              new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
          );
          return next;
        });
      }
    },
    [chatId, currentUserId, mapRowToMessage, supabase]
  );

  return {
    messages,
    sendMessage,
    isConnected,
    currentUserId,
  };
}
