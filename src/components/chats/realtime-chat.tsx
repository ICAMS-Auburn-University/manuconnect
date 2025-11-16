'use client';

import { useEffect, useMemo } from 'react';

import { ChatMessageItem } from '@/components/chats/chat-message';
import { useChatScroll } from '@/hooks/chats/use-chat-scroll';
import type { ChatMessage } from '@/domain/chats/types';
import { useRealtimeChat } from '@/hooks/chats/use-realtime-chat';
import { ChatMessageComposer } from '@/components/chats/chat-message-composer';

interface RealtimeChatProps {
  roomName: string;
  username: string;
  currentUserId: string | null;
  participants?: Record<string, string>;
  onMessage?: (messages: ChatMessage[]) => void;
  messages?: ChatMessage[];
}

export const RealtimeChat = ({
  roomName,
  username,
  currentUserId,
  participants = {},
  onMessage,
  messages: initialMessages = [],
}: RealtimeChatProps) => {
  const { containerRef, scrollToBottom } = useChatScroll();

  const {
    messages: realtimeMessages,
    sendMessage,
    isConnected,
    currentUserId: resolvedCurrentUserId,
  } = useRealtimeChat({
    chatId: roomName,
    currentUserName: username,
    currentUserId,
    participants,
  });

  const allMessages = useMemo(() => {
    const merged = [...initialMessages, ...realtimeMessages];
    const unique = merged.filter(
      (message, index, self) =>
        index === self.findIndex((m) => m.id === message.id)
    );

    return unique.sort((a, b) => a.createdAt.localeCompare(b.createdAt));
  }, [initialMessages, realtimeMessages]);

  useEffect(() => {
    if (onMessage) {
      onMessage(allMessages);
    }
  }, [allMessages, onMessage]);

  useEffect(() => {
    scrollToBottom();
  }, [allMessages, scrollToBottom]);

  return (
    <div className="flex h-full min-h-0 max-h-full w-full flex-col overflow-hidden bg-background text-foreground antialiased">
      <div
        ref={containerRef}
        className="min-h-0 max-h-full flex-1 space-y-4 overflow-y-auto p-4"
      >
        {allMessages.length === 0 ? (
          <div className="text-center text-sm text-muted-foreground">
            No messages yet. Start the conversation!
          </div>
        ) : null}
        <div className="space-y-1">
          {allMessages.map((message, index) => {
            const previous = index > 0 ? allMessages[index - 1] : null;
            const showHeader =
              !previous ||
              previous.user.id !== message.user.id ||
              new Date(previous.createdAt).getMinutes() !==
                new Date(message.createdAt).getMinutes();

            return (
              <div
                key={message.id}
                className="animate-in fade-in slide-in-from-bottom-4 duration-300"
              >
                <ChatMessageItem
                  message={message}
                  isOwnMessage={message.user.id === resolvedCurrentUserId}
                  showHeader={showHeader}
                />
              </div>
            );
          })}
        </div>
      </div>

      <ChatMessageComposer
        chatId={roomName}
        isConnected={isConnected}
        onSendMessage={sendMessage}
      />
    </div>
  );
};
