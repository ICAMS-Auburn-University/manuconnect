'use client';

import Image from 'next/image';
import { FormEvent, useEffect, useRef, useState } from 'react';
import { Loader2, Paperclip, Trash2, Upload, X } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { useChatAttachmentUploader } from '@/hooks/chats/use-chat-attachment-uploader';
import type { MessageAttachmentSummary } from '@/domain/chats/types';
import { cn } from '@/lib/utils';

const ACCEPTED_TYPES = [
  'application/pdf',
  'image/jpeg',
  'image/png',
  'image/gif',
  'image/webp',
  'video/mp4',
  'video/webm',
];
const ALLOWED_LABEL = 'PDF, JPEG, PNG, GIF, WEBP, MP4, WEBM';

const formatSize = (bytes: number) => {
  if (!bytes) {
    return '0 B';
  }
  const units = ['B', 'KB', 'MB', 'GB'];
  const exponent = Math.min(
    Math.floor(Math.log(bytes) / Math.log(1024)),
    units.length - 1
  );
  const size = bytes / 1024 ** exponent;
  return `${size.toFixed(exponent === 0 ? 0 : 1)} ${units[exponent]}`;
};

interface ChatMessageComposerProps {
  chatId: string;
  isConnected: boolean;
  onSendMessage: (
    content: string,
    attachments: MessageAttachmentSummary[]
  ) => Promise<void>;
}

export function ChatMessageComposer({
  chatId,
  isConnected,
  onSendMessage,
}: ChatMessageComposerProps) {
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [content, setContent] = useState('');
  const [previewUrls, setPreviewUrls] = useState<Map<string, string>>(
    () => new Map()
  );

  const {
    attachments,
    validationErrors,
    isUploading,
    isSending,
    canSend,
    selectFiles,
    removeAttachment,
    send,
    clearErrors,
  } = useChatAttachmentUploader({
    chatId,
    onSendMessage,
    onSuccess: () => setContent(''),
  });

  const isBusy = isUploading || isSending;

  useEffect(() => {
    setPreviewUrls((prev) => {
      const next = new Map<string, string>();

      attachments.forEach((item) => {
        if (item.file.type.startsWith('image/')) {
          const existing = prev.get(item.id);
          if (existing) {
            next.set(item.id, existing);
          } else {
            next.set(item.id, URL.createObjectURL(item.file));
          }
        }
      });

      prev.forEach((url, key) => {
        if (!next.has(key)) {
          URL.revokeObjectURL(url);
        }
      });

      return next;
    });
  }, [attachments]);

  useEffect(() => {
    return () => {
      previewUrls.forEach((url) => URL.revokeObjectURL(url));
    };
  }, [previewUrls]);

  const handleFileInput = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (!event.target.files) {
      return;
    }
    selectFiles(event.target.files);
    event.target.value = '';
  };

  const openFilePicker = () => {
    clearErrors();
    fileInputRef.current?.click();
  };

  const handleRemoveAttachment = (id: string) => {
    const existing = previewUrls.get(id);
    if (existing) {
      URL.revokeObjectURL(existing);
    }
    removeAttachment(id);
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!isConnected || !canSend(content)) {
      return;
    }
    try {
      await send(content);
    } catch (error) {
      console.error(error);
    }
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="flex w-full flex-col gap-3 border-t border-border/70 bg-background/95 p-4 backdrop-blur-xl"
    >
      <textarea
        className="min-h-[100px] w-full resize-y rounded-lg border border-border/70 bg-muted/40 px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
        value={content}
        onChange={(event) => setContent(event.target.value)}
        placeholder="Write a message…"
        disabled={!isConnected || isBusy}
      />

      <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-muted-foreground">
        <div className="flex flex-wrap items-center gap-2">
          <Button
            type="button"
            onClick={openFilePicker}
            variant="outline"
            className="h-8 rounded-full border-dashed border-primary/60 bg-primary/10 px-3 text-primary hover:bg-primary/20"
            disabled={!isConnected || isBusy}
          >
            <Paperclip className="mr-2 h-3.5 w-3.5" />
            Attach files
          </Button>
          <span>Allowed: {ALLOWED_LABEL}</span>
          <span>Up to 5 files · ≤ 50 MB each</span>
        </div>

        <Button
          type="submit"
          disabled={!isConnected || !canSend(content)}
          className={cn(
            'inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm font-medium transition',
            isBusy ? 'bg-primary/50' : 'bg-primary hover:bg-primary/90'
          )}
        >
          {isBusy ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              Sending…
            </>
          ) : (
            <>
              <Upload className="h-4 w-4" />
              Send
            </>
          )}
        </Button>
      </div>

      <input
        ref={fileInputRef}
        type="file"
        className="hidden"
        multiple
        accept={ACCEPTED_TYPES.join(',')}
        onChange={handleFileInput}
      />

      {validationErrors.length > 0 && (
        <div className="rounded-lg border border-destructive/40 bg-destructive/10 px-3 py-2 text-sm text-destructive">
          <ul className="list-disc space-y-1 pl-4">
            {validationErrors.map((error) => (
              <li key={error}>{error}</li>
            ))}
          </ul>
        </div>
      )}

      {attachments.length > 0 && (
        <div className="space-y-2 rounded-lg border border-border/70 bg-muted/30 p-3">
          {attachments.map((item) => {
            const previewUrl = previewUrls.get(item.id);
            const isError = item.status === 'error';
            const badgeClass = isError
              ? 'bg-destructive/15 text-destructive'
              : item.status === 'uploading'
                ? 'bg-primary/15 text-primary'
                : 'bg-muted text-muted-foreground';

            return (
              <div
                key={item.id}
                className={cn(
                  'flex items-center gap-3 rounded-lg border border-border/60 bg-background px-3 py-2 shadow-sm transition',
                  isError
                    ? 'border-destructive/50 bg-destructive/5'
                    : 'hover:border-primary/50 hover:bg-primary/5'
                )}
              >
                <div className="relative h-12 w-12 flex-shrink-0 overflow-hidden rounded-md border border-border/60 bg-muted">
                  {previewUrl ? (
                    <Image
                      src={previewUrl}
                      alt={item.file.name}
                      fill
                      sizes="48px"
                      className="h-full w-full object-cover"
                      unoptimized
                    />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center text-[10px] text-muted-foreground">
                      {item.file.type.startsWith('video/')
                        ? 'Video'
                        : item.file.type === 'application/pdf'
                          ? 'PDF'
                          : 'File'}
                    </div>
                  )}
                </div>

                <div className="flex min-w-0 flex-1 flex-col gap-1">
                  <div className="flex items-start justify-between gap-2">
                    <p className="truncate text-sm font-medium text-foreground">
                      {item.file.name}
                    </p>
                    <span className="text-xs text-muted-foreground">
                      {formatSize(item.file.size)}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 text-xs">
                    <span
                      className={cn(
                        'inline-flex items-center gap-1 rounded-full px-2 py-0.5',
                        badgeClass
                      )}
                    >
                      {isError
                        ? 'Upload failed'
                        : item.status === 'uploading'
                          ? 'Uploading…'
                          : 'Ready'}
                    </span>
                    {item.status === 'uploaded' && (
                      <span className="text-muted-foreground">
                        Upload complete
                      </span>
                    )}
                  </div>
                  <div className="relative h-1.5 w-full overflow-hidden rounded-full bg-muted">
                    <div
                      className={cn(
                        'absolute left-0 top-0 h-full transition-all duration-300',
                        isError ? 'bg-destructive' : 'bg-primary'
                      )}
                      style={{ width: `${Math.min(item.progress, 100)}%` }}
                    />
                  </div>
                  {item.error && (
                    <p className="text-xs text-destructive">{item.error}</p>
                  )}
                </div>

                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="h-8 w-8 rounded-full p-0 text-muted-foreground hover:bg-muted"
                  onClick={() => handleRemoveAttachment(item.id)}
                  disabled={isUploading && item.status === 'uploading'}
                >
                  {isError ? (
                    <Trash2 className="h-4 w-4" />
                  ) : (
                    <X className="h-4 w-4" />
                  )}
                </Button>
              </div>
            );
          })}
        </div>
      )}
    </form>
  );
}
