'use client';

import { useCallback, useState } from 'react';
import { createSupabaseBrowserClient } from '@/app/_internal/supabase/browser-client';
import type { MessageAttachmentSummary } from '@/domain/chats/types';

const BUCKET_ID = 'chat-attachments';
const MAX_ATTACHMENTS = 5;
const MAX_FILE_SIZE_BYTES = 50 * 1024 * 1024;

const ALLOWED_MIME_TYPES = new Set<string>([
  'application/pdf',
  'image/jpeg',
  'image/png',
  'image/gif',
  'image/webp',
  'video/mp4',
  'video/webm',
]);

export type AttachmentStatus = 'ready' | 'uploading' | 'uploaded' | 'error';

export type UploadAttachmentState = {
  id: string;
  attachmentId: string;
  file: File;
  status: AttachmentStatus;
  progress: number;
  error?: string;
  bucketId?: string;
  storagePath?: string;
};

export interface UseChatAttachmentUploaderOptions {
  chatId: string;
  onSendMessage: (
    content: string,
    attachments: MessageAttachmentSummary[]
  ) => Promise<void>;
  onSuccess?: () => void;
}

export interface ChatAttachmentUploader {
  attachments: UploadAttachmentState[];
  validationErrors: string[];
  isUploading: boolean;
  isSending: boolean;
  canSend: (content: string) => boolean;
  selectFiles: (files: FileList | File[]) => void;
  removeAttachment: (id: string) => void;
  send: (content: string) => Promise<void>;
  reset: () => void;
  clearErrors: () => void;
}

const sanitizeFileName = (filename: string) =>
  filename
    .normalize('NFKD')
    .replace(/[^\w.\-]+/g, '_')
    .replace(/_+/g, '_');

const toFileArray = (input: FileList | File[]) =>
  Array.isArray(input) ? input : Array.from(input ?? []);

export function useChatAttachmentUploader({
  chatId,
  onSendMessage,
  onSuccess,
}: UseChatAttachmentUploaderOptions): ChatAttachmentUploader {
  const [attachments, setAttachments] = useState<UploadAttachmentState[]>([]);
  const [validationErrors, setValidationErrors] = useState<string[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [isSending, setIsSending] = useState(false);

  const pushError = useCallback((message: string) => {
    setValidationErrors((prev) =>
      prev.includes(message) ? prev : [...prev, message]
    );
  }, []);

  const clearErrors = useCallback(() => setValidationErrors([]), []);

  const selectFiles = useCallback(
    (input: FileList | File[]) => {
      const files = toFileArray(input);
      if (files.length === 0) {
        return;
      }

      clearErrors();

      if (attachments.length >= MAX_ATTACHMENTS) {
        pushError(`You can attach up to ${MAX_ATTACHMENTS} files per message.`);
        return;
      }

      const availableSlots = MAX_ATTACHMENTS - attachments.length;
      const accepted: UploadAttachmentState[] = [];

      for (const file of files.slice(0, availableSlots)) {
        if (!ALLOWED_MIME_TYPES.has(file.type)) {
          pushError(
            `${file.name} has an unsupported file type (${file.type || 'unknown'}).`
          );
          continue;
        }

        if (file.size > MAX_FILE_SIZE_BYTES) {
          pushError(
            `${file.name} exceeds the 50 MB limit (${(
              file.size /
              1024 /
              1024
            ).toFixed(1)} MB).`
          );
          continue;
        }

        accepted.push({
          id: crypto.randomUUID(),
          attachmentId: crypto.randomUUID(),
          file,
          status: 'ready',
          progress: 0,
        });
      }

      if (accepted.length > 0) {
        setAttachments((prev) => [...prev, ...accepted]);
      }
    },
    [attachments.length, clearErrors, pushError]
  );

  const removeAttachment = useCallback((id: string) => {
    setAttachments((prev) => prev.filter((item) => item.id !== id));
  }, []);

  const reset = useCallback(() => {
    setAttachments([]);
    setValidationErrors([]);
    setIsUploading(false);
    setIsSending(false);
  }, []);

  const canSend = useCallback(
    (content: string) => {
      const hasMessage = content.trim().length > 0;
      return (
        !isSending && !isUploading && (hasMessage || attachments.length > 0)
      );
    },
    [attachments.length, isSending, isUploading]
  );

  const send = useCallback(
    async (content: string) => {
      const trimmed = content.trim();
      if (!trimmed && attachments.length === 0) {
        pushError('Cannot send an empty message.');
        return;
      }

      setIsUploading(true);
      clearErrors();

      const supabase = await createSupabaseBrowserClient();
      const uploadedPaths: string[] = [];
      const attachmentRecords: MessageAttachmentSummary[] = [];

      const updateState = (
        id: string,
        patch: Partial<UploadAttachmentState>
      ) => {
        setAttachments((prev) =>
          prev.map((item) => (item.id === id ? { ...item, ...patch } : item))
        );
      };

      try {
        for (const item of attachments) {
          const cleanName = sanitizeFileName(item.file.name);
          const storagePath = `${chatId}/${item.id}_${cleanName}`;

          updateState(item.id, { status: 'uploading', progress: 15 });

          const { error: uploadError } = await supabase.storage
            .from(BUCKET_ID)
            .upload(storagePath, item.file, {
              cacheControl: '3600',
              upsert: false,
              contentType: item.file.type || undefined,
            });

          if (uploadError) {
            updateState(item.id, {
              status: 'error',
              progress: 0,
              error: uploadError.message,
            });
            throw new Error(
              `Failed to upload ${item.file.name}: ${uploadError.message}`
            );
          }

          uploadedPaths.push(storagePath);
          updateState(item.id, {
            status: 'uploaded',
            progress: 100,
            bucketId: BUCKET_ID,
            storagePath,
          });

          attachmentRecords.push({
            attachment_id: item.attachmentId,
            bucket_id: BUCKET_ID,
            path: storagePath,
            filename: cleanName,
            mime: item.file.type,
            size: item.file.size,
            time_uploaded: new Date().toISOString(),
          });
        }

        setIsUploading(false);
        setIsSending(true);

        await onSendMessage(trimmed, attachmentRecords);

        setIsSending(false);
        setAttachments([]);
        onSuccess?.();
      } catch (error) {
        const message =
          error instanceof Error ? error.message : 'Failed to send message.';
        pushError(message);
        setIsSending(false);
        setIsUploading(false);

        if (uploadedPaths.length > 0) {
          await supabase.storage.from(BUCKET_ID).remove(uploadedPaths);
        }

        throw error;
      }
    },
    [attachments, chatId, clearErrors, onSendMessage, onSuccess, pushError]
  );

  return {
    attachments,
    validationErrors,
    isUploading,
    isSending,
    canSend,
    selectFiles,
    removeAttachment,
    send,
    reset,
    clearErrors,
  };
}
