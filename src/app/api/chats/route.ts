import { NextRequest, NextResponse } from 'next/server';

import {
  ChatsServiceError,
  getChatsForCurrentUser,
  startDirectChat,
} from '@/domain/chats/service';

type StartChatRequest = {
  targetUserId?: string;
  orderId?: number;
};

const jsonError = (message: string, status: number) =>
  NextResponse.json({ error: message }, { status });

export async function GET() {
  try {
    const data = await getChatsForCurrentUser();
    return NextResponse.json(data);
  } catch (error) {
    if (error instanceof ChatsServiceError) {
      return jsonError(error.message, error.status);
    }

    return jsonError('Failed to load chats', 500);
  }
}

export async function POST(request: NextRequest) {
  try {
    const { targetUserId } = (await request
      .json()
      .catch(() => ({}))) as StartChatRequest;

    if (!targetUserId) {
      return jsonError('Missing target user id', 400);
    }

    const chat = await startDirectChat(targetUserId);
    return NextResponse.json({ chat });
  } catch (error) {
    if (error instanceof ChatsServiceError) {
      return jsonError(error.message, error.status);
    }

    return jsonError('Failed to create chat', 500);
  }
}
