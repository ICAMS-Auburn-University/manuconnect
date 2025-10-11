'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { Send } from 'lucide-react';

import { ChatMessageItem } from '@/components/chat-message';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useChatScroll } from '@/hooks/use-chat-scroll';
import { type ChatMessage, useRealtimeChat } from '@/hooks/use-realtime-chat';
import { cn } from '@/lib/utils';

interface RealtimeChatProps {
  roomName: string;
  username: string;
  participants?: Record<string, string>;
  onMessage?: (messages: ChatMessage[]) => void;
  messages?: ChatMessage[];
}

export const RealtimeChat = ({
  roomName,
  username,
  participants = {},
  onMessage,
  messages: initialMessages = [],
}: RealtimeChatProps) => {
  const { containerRef, scrollToBottom } = useChatScroll();

  const {
    messages: realtimeMessages,
    sendMessage,
    isConnected,
    currentUserId,
  } = useRealtimeChat({
    chatId: roomName,
    currentUserName: username,
    participants,
  });

  const [newMessage, setNewMessage] = useState('');

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

  const handleSendMessage = useCallback(
    async (event: React.FormEvent<HTMLFormElement>) => {
      event.preventDefault();
      if (!newMessage.trim() || !isConnected) {
        return;
      }

      try {
        await sendMessage(newMessage);
        setNewMessage('');
      } catch (error) {
        console.error('Failed to send message', error);
      }
    },
    [isConnected, newMessage, sendMessage]
  );

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
                  isOwnMessage={message.user.id === currentUserId}
                  showHeader={showHeader}
                />
              </div>
            );
          })}
        </div>
      </div>

      <form
        onSubmit={handleSendMessage}
        className="flex w-full gap-2 border-t border-border p-4"
      >
        <Input
          className={cn(
            'rounded-full bg-background text-sm transition-all duration-300',
            isConnected && newMessage.trim() ? 'w-[calc(100%-36px)]' : 'w-full'
          )}
          type="text"
          value={newMessage}
          onChange={(event) => setNewMessage(event.target.value)}
          placeholder="Type a message..."
          disabled={!isConnected}
        />
        {isConnected && newMessage.trim() && (
          <Button
            className="aspect-square rounded-full animate-in fade-in slide-in-from-right-4 duration-300"
            type="submit"
          >
            <Send className="size-4" />
          </Button>
        )}
      </form>
    </div>
  );
};
