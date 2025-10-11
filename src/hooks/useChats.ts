import { useEffect, useMemo, useRef, useState } from 'react';
import type { RealtimeChannel } from '@supabase/supabase-js';

import { createClient } from '@/services/supabase/client';

import type { Message } from './useMessages';

export interface ChatSummary {
  chat_id: string;
  members: string[];
  is_direct_message: boolean;
  created_at: string;
  last_message: Message | null;
  unread_count: number;
}

type UseChatsOptions = {
  activeChatId?: string | null;
};

const CHATS_TABLE = 'Chats';
const MESSAGES_TABLE = 'Messages';

export function useChats(
  userId: string | null,
  { activeChatId }: UseChatsOptions = {}
) {
  const supabase = useMemo(() => createClient(), []);
  const channelRef = useRef<RealtimeChannel | null>(null);

  const [chats, setChats] = useState<ChatSummary[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!userId) {
      setChats([]);
      return;
    }

    let cancelled = false;
    setIsLoading(true);
    setError(null);

    const loadChats = async () => {
      try {
        const { data, error: chatsError } = await supabase
          .from(CHATS_TABLE)
          .select('*')
          .contains('members', [userId])
          .order('created_at', { ascending: false });

        if (chatsError) {
          throw chatsError;
        }

        const resolvedChats =
          (await Promise.all(
            (data ?? []).map(async (chat) => {
              const { data: lastMessageData } = await supabase
                .from(MESSAGES_TABLE)
                .select('*')
                .eq('chat_id', chat.chat_id)
                .order('time_sent', { ascending: false })
                .limit(1);

              return {
                chat_id: chat.chat_id,
                members: chat.members ?? [],
                is_direct_message: chat.is_direct_message ?? true,
                created_at: chat.created_at,
                last_message:
                  lastMessageData && lastMessageData.length > 0
                    ? (lastMessageData[0] as Message)
                    : null,
                unread_count: 0,
              } satisfies ChatSummary;
            })
          )) ?? [];

        if (cancelled) {
          return;
        }

        setChats(
          resolvedChats.sort((a, b) => {
            const aDate = a.last_message?.time_sent ?? a.created_at;
            const bDate = b.last_message?.time_sent ?? b.created_at;
            return new Date(bDate).getTime() - new Date(aDate).getTime();
          })
        );
      } catch (err) {
        if (cancelled) {
          return;
        }
        setError(err instanceof Error ? err.message : 'Failed to load chats');
        setChats([]);
      } finally {
        if (!cancelled) {
          setIsLoading(false);
        }
      }
    };

    loadChats();

    return () => {
      cancelled = true;
    };
  }, [supabase, userId]);

  useEffect(() => {
    if (!userId) {
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
      .channel('chats:messages')
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: MESSAGES_TABLE },
        (payload) => {
          const incoming = payload.new as Message;
          setChats((prev) => {
            const index = prev.findIndex(
              (chat) => chat.chat_id === incoming.chat_id
            );
            if (index === -1) {
              return prev;
            }

            const next = [...prev];
            const target = { ...next[index] };
            target.last_message = incoming;
            if (
              incoming.sender_id !== userId &&
              target.chat_id !== activeChatId
            ) {
              target.unread_count = (target.unread_count ?? 0) + 1;
            } else if (target.chat_id === activeChatId) {
              target.unread_count = 0;
            }

            next.splice(index, 1);
            next.unshift(target);
            return next;
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
  }, [supabase, userId, activeChatId]);

  const markChatAsRead = (chatId: string) => {
    setChats((prev) =>
      prev.map((chat) =>
        chat.chat_id === chatId ? { ...chat, unread_count: 0 } : chat
      )
    );
  };

  return {
    chats,
    isLoading,
    error,
    markChatAsRead,
  };
}
