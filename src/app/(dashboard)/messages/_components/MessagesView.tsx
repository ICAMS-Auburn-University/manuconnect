'use client';

import { useEffect, useMemo, useState, type KeyboardEventHandler } from 'react';
import { formatDistanceToNowStrict } from 'date-fns';
import { Loader2, MessageCircle, Search, Send } from 'lucide-react';
import clsx from 'clsx';

import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Textarea } from '@/components/ui/textarea';
import { useChats } from '@/hooks/useChats';
import { useMessages } from '@/hooks/useMessages';
import { createClient } from '@/services/supabase/client';

const getInitialsFromMembers = (
  members: string[],
  currentUserId: string | null
) => {
  const others = members.filter((member) => member !== currentUserId);
  if (others.length === 0) {
    return 'MC';
  }
  if (others.length === 1) {
    return others[0]?.slice(0, 2)?.toUpperCase() ?? 'US';
  }
  return others
    .slice(0, 2)
    .map((value) => value.slice(0, 1).toUpperCase())
    .join('');
};

const buildChatTitle = (members: string[], currentUserId: string | null) => {
  const others = members.filter((member) => member !== currentUserId);
  if (others.length === 0) {
    return 'Conversation';
  }
  if (others.length === 1) {
    return `Chat with ${others[0].slice(0, 8)}…`;
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

const renderMessageTimestamp = (timestamp: string | undefined) => {
  if (!timestamp) {
    return null;
  }
  return (
    <span className="block text-[11px] text-muted-foreground mt-1">
      {formatRelativeTime(timestamp)}
    </span>
  );
};

export function MessagesView() {
  const supabase = useMemo(() => createClient(), []);

  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [selectedChatId, setSelectedChatId] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [composerValue, setComposerValue] = useState('');
  const [sendError, setSendError] = useState<string | null>(null);
  const [isSending, setIsSending] = useState(false);

  useEffect(() => {
    let isMounted = true;
    supabase.auth.getSession().then(({ data }) => {
      if (!isMounted) {
        return;
      }
      setCurrentUserId(data.session?.user.id ?? null);
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setCurrentUserId(session?.user?.id ?? null);
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

  useEffect(() => {
    if (chats.length > 0 && !selectedChatId) {
      setSelectedChatId(chats[0].chat_id);
    }
  }, [chats, selectedChatId]);

  const {
    messages,
    isLoading: messagesLoading,
    error: messagesError,
    sendMessage,
  } = useMessages(selectedChatId, { userId: currentUserId ?? undefined });

  useEffect(() => {
    if (selectedChatId) {
      markChatAsRead(selectedChatId);
    }
  }, [selectedChatId, markChatAsRead, messages.length]);

  const selectedChat =
    chats.find((chat) => chat.chat_id === selectedChatId) ?? null;

  const filteredChats = chats.filter((chat) => {
    if (!searchTerm) {
      return true;
    }
    const title = buildChatTitle(chat.members, currentUserId);
    const preview = chat.last_message?.content ?? '';
    const term = searchTerm.toLowerCase();
    return (
      title.toLowerCase().includes(term) ||
      preview.toLowerCase().includes(term) ||
      chat.members.some((member) => member.toLowerCase().includes(term))
    );
  });

  const handleSend = async () => {
    if (!selectedChatId || !composerValue.trim()) {
      return;
    }
    setSendError(null);
    setIsSending(true);
    try {
      await sendMessage(composerValue);
      setComposerValue('');
      markChatAsRead(selectedChatId);
    } catch (err) {
      setSendError(
        err instanceof Error ? err.message : 'Unable to send message right now.'
      );
    } finally {
      setIsSending(false);
    }
  };

  const handleComposerKeyDown: KeyboardEventHandler<HTMLTextAreaElement> = (
    event
  ) => {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault();
      void handleSend();
    }
  };

  return (
    <div className="flex h-[calc(100vh-8rem)] min-h-[600px] w-full flex-col rounded-xl border bg-background shadow-sm">
      <div className="grid flex-1 grid-cols-1 md:grid-cols-[320px_1fr]">
        <aside className="flex min-h-0 flex-col border-r">
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

          <ScrollArea className="flex-1">
            <div className="flex flex-col gap-1 p-2">
              {chatsLoading ? (
                <div className="flex items-center justify-center py-12 text-muted-foreground">
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Loading chats…
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
                  const title = buildChatTitle(chat.members, currentUserId);
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
                          {getInitialsFromMembers(chat.members, currentUserId)}
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

        <section className="flex min-h-0 flex-col">
          {selectedChat ? (
            <>
              <div className="flex items-center justify-between border-b px-6 py-4">
                <div>
                  <h2 className="text-lg font-semibold">
                    {buildChatTitle(selectedChat.members, currentUserId)}
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

              <ScrollArea className="flex-1 px-6 py-6">
                <div className="flex flex-col gap-4">
                  {messagesLoading ? (
                    <div className="flex justify-center py-12 text-muted-foreground">
                      <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                      Loading messages…
                    </div>
                  ) : messages.length === 0 ? (
                    <div className="flex flex-col items-center gap-2 py-12 text-center text-muted-foreground">
                      <MessageCircle className="h-7 w-7" />
                      <p>No messages in this conversation yet.</p>
                      <p className="text-sm">
                        Say hello to get the discussion started.
                      </p>
                    </div>
                  ) : (
                    messages.map((message) => {
                      const isMine = message.sender_id === currentUserId;
                      return (
                        <div
                          key={message.message_id}
                          className={clsx(
                            'flex w-full',
                            isMine ? 'justify-end' : 'justify-start'
                          )}
                        >
                          <div
                            className={clsx(
                              'max-w-[70%] rounded-2xl px-4 py-3 text-sm',
                              isMine
                                ? 'bg-primary text-primary-foreground'
                                : 'bg-muted'
                            )}
                          >
                            <p className="whitespace-pre-wrap break-words">
                              {message.content}
                            </p>
                            {renderMessageTimestamp(message.time_sent)}
                          </div>
                        </div>
                      );
                    })
                  )}

                  {messagesError ? (
                    <p className="text-sm text-destructive">{messagesError}</p>
                  ) : null}
                </div>
              </ScrollArea>

              <div className="border-t px-6 py-4">
                <div className="flex flex-col gap-3">
                  <Textarea
                    placeholder="Write your message…"
                    value={composerValue}
                    onChange={(event) => setComposerValue(event.target.value)}
                    onKeyDown={handleComposerKeyDown}
                    disabled={!selectedChatId || isSending}
                    rows={3}
                  />
                  {sendError ? (
                    <p className="text-sm text-destructive">{sendError}</p>
                  ) : null}
                  <div className="flex justify-end">
                    <Button
                      type="button"
                      onClick={() => void handleSend()}
                      disabled={isSending || !composerValue.trim()}
                    >
                      {isSending ? (
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      ) : (
                        <Send className="mr-2 h-4 w-4" />
                      )}
                      Send
                    </Button>
                  </div>
                </div>
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
