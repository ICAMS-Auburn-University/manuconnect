import { NextRequest, NextResponse } from 'next/server';

import {
  ChatsServiceError,
  getChatMessages,
  sendChatMessage,
} from '@/domain/chats/service';

type RouteParams = {
  chatId: string;
};

type RouteContext = {
  params: Promise<RouteParams>;
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

  try {
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

  const { content } = (await request.json().catch(() => ({}))) as {
    content?: string;
  };

  try {
    const message = await sendChatMessage(chatId, content ?? '');
    return NextResponse.json({ message });
  } catch (error) {
    if (error instanceof ChatsServiceError) {
      return jsonError(error.message, error.status);
    }

    return jsonError('Failed to send message', 500);
  }
}
