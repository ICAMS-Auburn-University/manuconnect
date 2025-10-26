import { useCallback, useEffect, useRef, useState } from 'react';
import type { RealtimeChannel } from '@supabase/supabase-js';
import { createSupabaseServiceRoleClient } from '@/app/_internal/supabase/server-client';
import type {
  ChatSummary,
  ChatsResponse,
  CurrentUserSummary,
  MessageSummary,
} from '@/domain/chats/types';
import { ChatsSchema } from '@/types/schemas';

type UseChatsOptions = {
  activeChatId?: string | null;
};

const defaultResponse: ChatsResponse = {
  chats: [],
  currentUser: null,
  participantDisplayNames: {},
};

export function useChats({ activeChatId }: UseChatsOptions = {}) {
  const channelRef = useRef<RealtimeChannel | null>(null);

  const [chats, setChats] = useState<ChatSummary[]>([]);
  const [participantDisplayNames, setParticipantDisplayNames] = useState<
    Record<string, string>
  >({});
  const [currentUser, setCurrentUser] = useState<CurrentUserSummary | null>(
    null
  );
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadChats = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/chats', {
        method: 'GET',
        credentials: 'include',
      });

      if (response.status === 401) {
        setChats([]);
        setParticipantDisplayNames({});
        setCurrentUser(null);
        setError('Unauthorized');
        return;
      }

      if (!response.ok) {
        throw new Error('Failed to load chats');
      }

      const data = (await response.json()) as ChatsResponse;

      setChats(data.chats ?? defaultResponse.chats);
      setParticipantDisplayNames(
        data.participantDisplayNames ?? defaultResponse.participantDisplayNames
      );
      setCurrentUser(data.currentUser ?? defaultResponse.currentUser);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load chats');
      setChats([]);
      setParticipantDisplayNames({});
      setCurrentUser(null);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadChats();
  }, [loadChats]);

  useEffect(() => {
    let isMounted = true;
    let supabaseClient: Awaited<
      ReturnType<typeof createSupabaseServiceRoleClient>
    > | null = null;

    const subscribe = async () => {
      const client = await createSupabaseServiceRoleClient();
      if (!isMounted) {
        return;
      }

      supabaseClient = client;

      if (channelRef.current) {
        await client.removeChannel(channelRef.current);
        channelRef.current = null;
      }

      if (!currentUser?.id) {
        return;
      }

      const channel = client
        .channel(`chats:realtime:${currentUser.id}`)
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
                incoming.sender_id !== currentUser.id &&
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
            const newChat = payload.new as ChatsSchema;
            const members = (newChat.members as string[]) ?? [];
            if (!members.includes(currentUser.id)) {
              return;
            }

            setChats((prev) => {
              if (prev.some((chat) => chat.chat_id === newChat.chat_id)) {
                return prev;
              }

              const summary: ChatSummary = {
                chat_id: newChat.chat_id,
                members,
                is_direct_message: Boolean(newChat.is_direct_message),
                created_at: newChat.created_at ?? new Date().toISOString(),
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

            void loadChats();
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

      channelRef.current = channel;
    };

    void subscribe();

    return () => {
      isMounted = false;
      if (supabaseClient && channelRef.current) {
        void supabaseClient.removeChannel(channelRef.current);
        channelRef.current = null;
      }
    };
  }, [currentUser?.id, activeChatId, loadChats]);

  const markChatAsRead = useCallback((chatId: string) => {
    setChats((prev) =>
      prev.map((chat) =>
        chat.chat_id === chatId ? { ...chat, unread_count: 0 } : chat
      )
    );
  }, []);

  return {
    chats,
    participantDisplayNames,
    currentUser,
    isLoading,
    error,
    markChatAsRead,
    reload: loadChats,
  };
}
