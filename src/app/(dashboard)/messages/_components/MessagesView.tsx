'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { formatDistanceToNowStrict } from 'date-fns';
import { Loader2, MessageCircle, Search } from 'lucide-react';
import clsx from 'clsx';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';

import { RealtimeChat } from '@/components/chats/realtime-chat';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useChats } from '@/hooks/useChats';
import { createSupabaseServiceRoleClient } from '@/app/_internal/supabase/server-client';
// import { createClient } from '@/services/supabase/client';

const getInitialsFromMembers = (
  members: string[],
  currentUserId: string | null,
  participantNames?: Record<string, string>
) => {
  const others = members.filter((member) => member !== currentUserId);
  if (others.length === 0) {
    return 'MC';
  }
  if (others.length === 1) {
    const source = participantNames?.[others[0]] ?? others[0];
    return source?.slice(0, 2)?.toUpperCase() ?? 'US';
  }
  return others
    .slice(0, 2)
    .map((value) => {
      const name = participantNames?.[value] ?? value;
      return name.slice(0, 1).toUpperCase();
    })
    .join('');
};

const buildChatTitle = (
  members: string[],
  currentUserId: string | null,
  participants: Record<string, string>
) => {
  const others = members.filter((member) => member !== currentUserId);
  if (others.length === 0) {
    return 'Conversation';
  }
  if (others.length === 1) {
    const identifier = participants[others[0]] ?? others[0];
    return `Chat with ${identifier}`;
  }
  return `Group chat (${others.length} people)`;
};

const formatRelativeTime = (timestamp: string | undefined | null) => {
  if (!timestamp) {
    return '';
  }
  try {
    return formatDistanceToNowStrict(new Date(timestamp), { addSuffix: true });
  } catch {
    return '';
  }
};

export function MessagesView() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [currentUserName, setCurrentUserName] = useState<string>('You');
  const [selectedChatId, setSelectedChatId] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [displayNames, setDisplayNames] = useState<Record<string, string>>({});

  useEffect(async () => {
    const supabase = await createSupabaseServiceRoleClient();
    let isMounted = true;

    supabase.auth.getSession().then(({ data }) => {
      if (!isMounted) {
        return;
      }
      const sessionUser = data.session?.user;
      setCurrentUserId(sessionUser?.id ?? null);
      setCurrentUserName(
        sessionUser?.user_metadata?.display_name ??
          sessionUser?.user_metadata?.full_name ??
          sessionUser?.email ??
          'You'
      );
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      const user = session?.user;
      setCurrentUserId(user?.id ?? null);
      setCurrentUserName(
        user?.user_metadata?.display_name ??
          user?.user_metadata?.full_name ??
          user?.email ??
          'You'
      );
    });

    return () => {
      isMounted = false;
      subscription.unsubscribe();
    };
  }, [supabase]);

  const {
    chats,
    isLoading: chatsLoading,
    error: chatsError,
    markChatAsRead,
  } = useChats(currentUserId, { activeChatId: selectedChatId });

  const chatFromQuery = searchParams.get('chat');

  useEffect(() => {
    if (!currentUserId) {
      setDisplayNames({});
      return;
    }
    setDisplayNames((prev) => {
      if (prev[currentUserId] === currentUserName) {
        return prev;
      }
      return { ...prev, [currentUserId]: currentUserName };
    });
  }, [currentUserId, currentUserName]);

  useEffect(() => {
    if (chats.length === 0) {
      return;
    }

    const missing = new Set<string>();
    chats.forEach((chat) => {
      chat.members.forEach((memberId) => {
        if (memberId && memberId !== currentUserId && !displayNames[memberId]) {
          missing.add(memberId);
        }
      });
    });

    if (missing.size === 0) {
      return;
    }

    let cancelled = false;

    const fetchDisplayNames = async () => {
      const { data, error } = await supabase
        .from('UsersMap')
        .select('id, display_name')
        .in('id', Array.from(missing));

      if (error) {
        console.error('Failed to load participant display names', error);
        return;
      }

      if (!data || cancelled) {
        return;
      }

      setDisplayNames((prev) => {
        const next = { ...prev };
        data.forEach((user) => {
          next[user.id] = user.display_name;
        });
        return next;
      });
    };

    void fetchDisplayNames();

    return () => {
      cancelled = true;
    };
  }, [chats, currentUserId, displayNames, supabase]);

  const getMemberDisplayName = useCallback(
    (memberId: string) => {
      if (memberId === currentUserId) {
        return currentUserName;
      }
      return (
        displayNames[memberId] ?? `User ${memberId.slice(0, 8).toUpperCase()}`
      );
    },
    [currentUserId, currentUserName, displayNames]
  );

  useEffect(() => {
    if (!selectedChatId && chats.length > 0) {
      if (
        chatFromQuery &&
        chats.some((chat) => chat.chat_id === chatFromQuery)
      ) {
        setSelectedChatId(chatFromQuery);
        return;
      }
      setSelectedChatId(chats[0].chat_id);
    }
  }, [chats, selectedChatId, chatFromQuery]);

  useEffect(() => {
    if (
      chatFromQuery &&
      chatFromQuery !== selectedChatId &&
      chats.some((chat) => chat.chat_id === chatFromQuery)
    ) {
      setSelectedChatId(chatFromQuery);
    }
  }, [chatFromQuery, chats, selectedChatId]);

  useEffect(() => {
    if (!selectedChatId || !pathname) {
      return;
    }
    const currentParam = searchParams.get('chat');
    if (currentParam === selectedChatId) {
      return;
    }

    const params = new URLSearchParams(searchParams);
    params.set('chat', selectedChatId);
    const queryString = params.toString();
    const url = queryString ? `${pathname}?${queryString}` : pathname;
    router.replace(url, { scroll: false });
  }, [pathname, router, searchParams, selectedChatId]);

  const filteredChats = chats.filter((chat) => {
    if (!searchTerm) {
      return true;
    }
    const participants: Record<string, string> = {};
    chat.members.forEach((memberId) => {
      participants[memberId] = getMemberDisplayName(memberId);
    });

    const title = buildChatTitle(chat.members, currentUserId, participants);
    const preview = chat.last_message?.content ?? '';
    const term = searchTerm.toLowerCase();

    return (
      title.toLowerCase().includes(term) ||
      preview.toLowerCase().includes(term) ||
      Object.values(participants).some((name) =>
        name.toLowerCase().includes(term)
      ) ||
      chat.members.some((member) => member.toLowerCase().includes(term))
    );
  });

  const selectedChat = selectedChatId
    ? (chats.find((chat) => chat.chat_id === selectedChatId) ?? null)
    : null;

  const participantMap = useMemo(() => {
    if (!selectedChat) {
      return {};
    }
    const map: Record<string, string> = {};
    selectedChat.members.forEach((memberId) => {
      map[memberId] = getMemberDisplayName(memberId);
    });
    return map;
  }, [selectedChat, getMemberDisplayName]);

  useEffect(() => {
    if (!selectedChatId) {
      return;
    }
    markChatAsRead(selectedChatId);
  }, [markChatAsRead, selectedChatId]);

  return (
    <div className="flex w-full flex-1 h-full flex-col overflow-hidden rounded-xl border bg-background shadow-sm">
      <div className="grid min-h-0 flex-1 auto-rows-fr grid-cols-1 md:grid-cols-[320px_1fr]">
        <aside className="flex min-h-0 flex-col overflow-hidden border-r">
          <div className="flex items-center gap-2 border-b px-4 py-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 text-primary">
              <MessageCircle className="h-5 w-5" />
            </div>
            <div>
              <p className="font-semibold">Inbox</p>
              <p className="text-sm text-muted-foreground">
                Manage conversations with manufacturers
              </p>
            </div>
          </div>

          <div className="border-b px-4 py-3">
            <div className="relative">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Search conversations"
                className="pl-9"
                value={searchTerm}
                onChange={(event) => setSearchTerm(event.target.value)}
              />
            </div>
          </div>

          <ScrollArea className="flex-1 min-h-0 max-h-full">
            <div className="flex flex-col gap-1 p-2">
              {chatsLoading ? (
                <div className="flex items-center justify-center py-12 text-muted-foreground">
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Loading chats...
                </div>
              ) : filteredChats.length === 0 ? (
                <div className="flex flex-col items-center gap-2 px-6 py-12 text-center text-muted-foreground">
                  <MessageCircle className="h-6 w-6" />
                  <p>No conversations yet.</p>
                  <p className="text-sm">
                    Start by creating a new chat or replying to an order
                    inquiry.
                  </p>
                </div>
              ) : (
                filteredChats.map((chat) => {
                  const participants: Record<string, string> = {};
                  chat.members.forEach((memberId) => {
                    participants[memberId] = getMemberDisplayName(memberId);
                  });
                  const title = buildChatTitle(
                    chat.members,
                    currentUserId,
                    participants
                  );
                  const preview =
                    chat.last_message?.content ?? 'No messages yet.';
                  const isActive = chat.chat_id === selectedChatId;
                  const unread = chat.unread_count ?? 0;

                  return (
                    <button
                      key={chat.chat_id}
                      type="button"
                      onClick={() => setSelectedChatId(chat.chat_id)}
                      className={clsx(
                        'flex w-full items-start gap-3 rounded-lg px-3 py-3 text-left transition hover:bg-muted/60',
                        isActive ? 'bg-muted' : 'bg-transparent'
                      )}
                    >
                      <Avatar className="h-11 w-11">
                        <AvatarFallback>
                          {getInitialsFromMembers(
                            chat.members,
                            currentUserId,
                            participants
                          )}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1">
                        <div className="flex items-center justify-between gap-2">
                          <p className="font-medium">{title}</p>
                          <span className="text-xs text-muted-foreground">
                            {formatRelativeTime(
                              chat.last_message?.time_sent ?? chat.created_at
                            )}
                          </span>
                        </div>
                        <p className="mt-1 line-clamp-2 text-sm text-muted-foreground">
                          {preview}
                        </p>
                        {unread > 0 ? (
                          <span className="mt-2 inline-flex items-center rounded-full bg-primary/10 px-2 py-0.5 text-[11px] font-semibold text-primary">
                            {unread} new message{unread > 1 ? 's' : ''}
                          </span>
                        ) : null}
                      </div>
                    </button>
                  );
                })
              )}

              {chatsError ? (
                <p className="px-4 py-3 text-sm text-destructive">
                  {chatsError}
                </p>
              ) : null}
            </div>
          </ScrollArea>
        </aside>

        <section className="flex max-h-full min-h-0 flex-col">
          {selectedChat ? (
            <>
              <div className="flex items-center justify-between border-b px-6 py-4">
                <div>
                  <h2 className="text-lg font-semibold">
                    {buildChatTitle(
                      selectedChat.members,
                      currentUserId,
                      participantMap
                    )}
                  </h2>
                  <p className="text-sm text-muted-foreground">
                    Started{' '}
                    {formatRelativeTime(
                      selectedChat.last_message?.time_sent ??
                        selectedChat.created_at
                    )}
                  </p>
                </div>
              </div>
              <div className="flex max-h-full min-h-0 flex-1">
                <RealtimeChat
                  roomName={selectedChat.chat_id}
                  username={currentUserName}
                  participants={participantMap}
                />
              </div>
            </>
          ) : (
            <div className="flex flex-1 flex-col items-center justify-center gap-3 text-center text-muted-foreground">
              <MessageCircle className="h-9 w-9" />
              <p className="text-lg font-medium">
                Select a conversation to get started
              </p>
              <p className="text-sm">
                Pick one from the left or create a new chat to reach out.
              </p>
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
