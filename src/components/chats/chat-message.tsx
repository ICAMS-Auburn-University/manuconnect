'use client';

import Image from 'next/image';
import { useCallback, useEffect, useRef, useState } from 'react';

import { createSupabaseBrowserClient } from '@/app/_internal/supabase/browser-client';
import type { ChatMessage } from '@/domain/chats/types';
import { cn } from '@/lib/utils';

interface ChatMessageItemProps {
  message: ChatMessage;
  isOwnMessage: boolean;
  showHeader: boolean;
}

export const ChatMessageItem = ({
  message,
  isOwnMessage,
  showHeader,
}: ChatMessageItemProps) => {
  const timestamp = new Date(message.createdAt);
  const [signedUrls, setSignedUrls] = useState<Record<string, string>>({});
  const cachedUrlsRef = useRef<Record<string, string>>({});
  const [isGenerating, setIsGenerating] = useState<string | null>(null);

  useEffect(() => {
    const imageAttachments = message.attachments.filter((attachment) =>
      attachment.mime.startsWith('image/')
    );

    if (imageAttachments.length === 0) {
      return;
    }

    let cancelled = false;

    void (async () => {
      const client = await createSupabaseBrowserClient();
      for (const attachment of imageAttachments) {
        if (cachedUrlsRef.current[attachment.attachment_id]) {
          continue;
        }

        const { data, error } = await client.storage
          .from(attachment.bucket_id)
          .createSignedUrl(attachment.path, 60 * 60);

        if (!cancelled && data?.signedUrl && !error) {
          cachedUrlsRef.current[attachment.attachment_id] = data.signedUrl;
          setSignedUrls((prev) => ({
            ...prev,
            [attachment.attachment_id]: data.signedUrl,
          }));
        }
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [message.attachments]);

  const handleDownload = useCallback(
    async (attachmentId: string) => {
      const target = message.attachments.find(
        (item) => item.attachment_id === attachmentId
      );
      if (!target) {
        return;
      }

      try {
        setIsGenerating(attachmentId);
        const client = await createSupabaseBrowserClient();
        const { data, error } = await client.storage
          .from(target.bucket_id)
          .createSignedUrl(target.path, 60 * 60);

        if (error || !data?.signedUrl) {
          throw error ?? new Error('Unable to generate download URL.');
        }

        window.open(data.signedUrl, '_blank', 'noreferrer');
      } catch (error) {
        console.error('Failed to create signed URL', error);
      } finally {
        setIsGenerating(null);
      }
    },
    [message.attachments]
  );

  return (
    <div
      className={cn('mt-2 flex', {
        'justify-end': isOwnMessage,
        'justify-start': !isOwnMessage,
      })}
    >
      <div
        className={cn('flex w-fit max-w-[75%] flex-col gap-1', {
          'items-end': isOwnMessage,
        })}
      >
        {showHeader && (
          <div
            className={cn('flex items-center gap-2 px-3 text-xs', {
              'flex-row-reverse justify-end': isOwnMessage,
            })}
          >
            <span className="font-medium">{message.user.name}</span>
            <span className="text-xs text-foreground/50">
              {timestamp.toLocaleTimeString('en-US', {
                hour: '2-digit',
                minute: '2-digit',
                hour12: true,
              })}
            </span>
          </div>
        )}

        {(message.content || message.attachments.length > 0) && (
          <div
            className={cn(
              'flex w-fit flex-col gap-2 rounded-xl bg-muted px-3 py-2 text-sm text-foreground',
              isOwnMessage && 'bg-primary text-primary-foreground'
            )}
          >
            {message.content && (
              <p className="whitespace-pre-wrap">{message.content}</p>
            )}

            {message.attachments.length > 0 && (
              <div className="flex flex-col gap-2">
                {message.attachments.map((attachment) => {
                  const previewUrl = signedUrls[attachment.attachment_id];
                  const isImage = attachment.mime.startsWith('image/');

                  return (
                    <div
                      key={attachment.attachment_id}
                      className={cn(
                        'flex w-64 flex-col gap-2 rounded-md border border-border/30 bg-background/80 p-2 text-xs',
                        isOwnMessage &&
                          'border-primary/40 bg-primary-foreground/10 text-foreground'
                      )}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex flex-col">
                          <span className="break-words font-medium">
                            {attachment.filename}
                          </span>
                          <span className="text-muted-foreground">
                            {attachment.mime}
                          </span>
                        </div>
                        <button
                          type="button"
                          className={cn(
                            'rounded-md border border-border/50 px-2 py-1 text-xs transition hover:bg-muted',
                            isOwnMessage && 'hover:bg-primary/20'
                          )}
                          onClick={() =>
                            void handleDownload(attachment.attachment_id)
                          }
                          disabled={isGenerating === attachment.attachment_id}
                        >
                          {isGenerating === attachment.attachment_id
                            ? 'Loading...'
                            : 'Download'}
                        </button>
                      </div>
                      {isImage && previewUrl && (
                        <div className="relative h-40 w-full overflow-hidden rounded-md">
                          <Image
                            src={previewUrl}
                            alt={attachment.filename}
                            fill
                            sizes="256px"
                            className="object-cover"
                            unoptimized
                          />
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
