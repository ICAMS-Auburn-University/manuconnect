import { NextRequest, NextResponse } from 'next/server';

import {
  createSupabaseServerClient,
  createSupabaseServiceRoleClient,
} from '@/app/_internal/supabase/server-client';
import type { Tables } from '@/types/supabase';

type StartChatRequest = {
  targetUserId?: string;
  orderId?: number;
};

export async function POST(request: NextRequest) {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { targetUserId } = (await request
    .json()
    .catch(() => ({}))) as StartChatRequest;

  if (!targetUserId) {
    return NextResponse.json(
      { error: 'Missing target user id' },
      { status: 400 }
    );
  }

  if (targetUserId === user.id) {
    return NextResponse.json(
      { error: 'Cannot start a chat with yourself' },
      { status: 400 }
    );
  }

  const serviceClient = await createSupabaseServiceRoleClient();

  const { data: existingChats, error: existingError } = await serviceClient
    .from('Chats')
    .select('*')
    .eq('is_direct_message', true)
    .contains('members', [user.id, targetUserId])
    .limit(1);

  if (existingError) {
    return NextResponse.json(
      { error: existingError.message ?? 'Failed to check existing chat' },
      { status: 500 }
    );
  }

  if (existingChats && existingChats.length > 0) {
    return NextResponse.json({ chat: existingChats[0] as Tables<'Chats'> });
  }

  const { data: insertedChat, error: insertError } = await serviceClient
    .from('Chats')
    .insert({
      members: [user.id, targetUserId],
      is_direct_message: true,
      created_at: new Date().toISOString(),
    })
    .select()
    .single();

  if (insertError || !insertedChat) {
    return NextResponse.json(
      { error: insertError?.message ?? 'Failed to create chat' },
      { status: 500 }
    );
  }

  return NextResponse.json({ chat: insertedChat as Tables<'Chats'> });
}
