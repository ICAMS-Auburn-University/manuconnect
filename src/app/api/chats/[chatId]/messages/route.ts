import { NextRequest, NextResponse } from 'next/server';

import {
  ChatsServiceError,
  getChatMessages,
  getChatMessageById,
  sendChatMessage,
} from '@/domain/chats/service';

type RouteParams = {
  chatId: string;
};

type RouteContext = {
  params: Promise<RouteParams>;
};

type AttachmentInput = {
  attachment_id: string;
  bucket_id: string;
  path: string;
  filename: string;
  mime: string;
  size: number;
  time_uploaded: string;
};

const jsonError = (message: string, status: number) =>
  NextResponse.json({ error: message }, { status });

const parseLimit = (rawLimit: string | null): number | undefined => {
  if (!rawLimit) {
    return undefined;
  }

  const parsed = Number.parseInt(rawLimit, 10);
  return Number.isNaN(parsed) ? undefined : parsed;
};

export async function GET(request: NextRequest, context: RouteContext) {
  const { chatId } = await context.params;

  const { searchParams } = request.nextUrl;
  const limit = parseLimit(searchParams.get('limit'));
  const before = searchParams.get('before');
  const messageId = searchParams.get('messageId');

  try {
    if (messageId) {
      const message = await getChatMessageById(chatId, messageId);
      return NextResponse.json({ message });
    }

    const messages = await getChatMessages(chatId, { limit, before });
    return NextResponse.json({ messages });
  } catch (error) {
    if (error instanceof ChatsServiceError) {
      return jsonError(error.message, error.status);
    }

    return jsonError('Failed to load messages', 500);
  }
}

export async function POST(request: NextRequest, context: RouteContext) {
  const { chatId } = await context.params;

  const { content, attachments } = (await request.json().catch(() => ({}))) as {
    content?: string;
    attachments?: AttachmentInput[];
  };

  const sanitizedAttachments =
    Array.isArray(attachments) && attachments.length > 0
      ? attachments.slice(0, 5).map((item) => ({
          attachment_id: item.attachment_id,
          bucket_id: item.bucket_id,
          path: item.path,
          filename: item.filename,
          mime: item.mime,
          size: item.size,
          time_uploaded: item.time_uploaded,
        }))
      : [];

  try {
    const message = await sendChatMessage(
      chatId,
      content ?? '',
      sanitizedAttachments
    );
    return NextResponse.json({ message });
  } catch (error) {
    if (error instanceof ChatsServiceError) {
      return jsonError(error.message, error.status);
    }

    return jsonError('Failed to send message', 500);
  }
}
