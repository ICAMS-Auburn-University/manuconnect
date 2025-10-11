import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import type { RealtimeChannel } from '@supabase/supabase-js';

import { createClient } from '@/services/supabase/client';
import type { Tables } from '@/types/supabase';

export interface ChatSummary {
  chat_id: string;
  members: string[];
  is_direct_message: boolean;
  created_at: string;
  last_message: MessageSummary | null;
  unread_count: number;
}

type UseChatsOptions = {
  activeChatId?: string | null;
};

type ChatRow = Tables<'Chats'>;
type MessageSummary = {
  message_id: string;
  chat_id: string;
  sender_id: string;
  content: string;
  time_sent: string;
  read_by: string[] | null;
};

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
          .from('Chats')
          .select('*')
          .contains('members', [userId])
          .order('created_at', { ascending: false });

        if (chatsError) {
          throw chatsError;
        }

        const rows: ChatRow[] = data ?? [];

        const resolvedChats: ChatSummary[] = await Promise.all(
          rows.map(async (chat) => {
            const { data: lastMessageData, error: lastMessageError } =
              await supabase
                .from('Messages')
                .select(
                  'message_id, chat_id, sender_id, content, time_sent, read_by'
                )
                .eq('chat_id', chat.chat_id)
                .order('time_sent', { ascending: false })
                .limit(1);

            if (lastMessageError) {
              throw lastMessageError;
            }

            const lastMessage =
              lastMessageData && lastMessageData.length > 0
                ? (lastMessageData[0] as MessageSummary)
                : null;

            return {
              chat_id: chat.chat_id,
              members: chat.members,
              is_direct_message: chat.is_direct_message,
              created_at: chat.created_at,
              last_message: lastMessage,
              unread_count: 0,
            };
          })
        );

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
    let isMounted = true;

    const subscribe = async () => {
      if (!userId) {
        if (channelRef.current) {
          await supabase.removeChannel(channelRef.current);
          channelRef.current = null;
        }
        return;
      }

      if (channelRef.current) {
        await supabase.removeChannel(channelRef.current);
        channelRef.current = null;
      }

      const channel = supabase
        .channel(`chats:realtime:${userId}`)
        .on(
          'postgres_changes',
          { event: 'INSERT', schema: 'public', table: 'Messages' },
          (payload) => {
            const incoming = payload.new as MessageSummary;
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
                target.unread_count = target.unread_count + 1;
              } else if (target.chat_id === activeChatId) {
                target.unread_count = 0;
              }

              next.splice(index, 1);
              next.unshift(target);
              return next;
            });
          }
        )
        .on(
          'postgres_changes',
          { event: 'INSERT', schema: 'public', table: 'Chats' },
          (payload) => {
            const newChat = payload.new as ChatRow;
            if (!newChat.members?.includes(userId)) {
              return;
            }

            setChats((prev) => {
              if (prev.some((chat) => chat.chat_id === newChat.chat_id)) {
                return prev;
              }

              const summary: ChatSummary = {
                chat_id: newChat.chat_id,
                members: newChat.members,
                is_direct_message: newChat.is_direct_message,
                created_at: newChat.created_at,
                last_message: null,
                unread_count: 0,
              };

              const next = [summary, ...prev];
              return next.sort((a, b) => {
                const aDate = a.last_message?.time_sent ?? a.created_at;
                const bDate = b.last_message?.time_sent ?? b.created_at;
                return new Date(bDate).getTime() - new Date(aDate).getTime();
              });
            });
          }
        );

      channel.subscribe((status) => {
        if (status === 'CHANNEL_ERROR') {
          console.error('Failed to subscribe to chats channel', {
            topic: channel.topic,
            status,
          });
        }
      });

      if (isMounted) {
        channelRef.current = channel;
      } else {
        void supabase.removeChannel(channel);
      }
    };

    void subscribe();

    return () => {
      isMounted = false;
      if (channelRef.current) {
        void supabase.removeChannel(channelRef.current);
        channelRef.current = null;
      }
    };
  }, [supabase, userId, activeChatId]);

  const markChatAsRead = useCallback((chatId: string) => {
    setChats((prev) =>
      prev.map((chat) =>
        chat.chat_id === chatId ? { ...chat, unread_count: 0 } : chat
      )
    );
  }, []);

  return {
    chats,
    isLoading,
    error,
    markChatAsRead,
  };
}
