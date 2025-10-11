import { NextRequest, NextResponse } from 'next/server';

import { createSupabaseServiceRoleClient } from '@/app/_internal/supabase/server-client';

type RouteParams = {
  chatId: string;
};

const TABLE_NAME = 'Messages';
const DEFAULT_LIMIT = 50;
const MAX_LIMIT = 200;

const sanitizeLimit = (rawLimit: string | null) => {
  const parsed = Number.parseInt(rawLimit ?? `${DEFAULT_LIMIT}`, 10);
  if (Number.isNaN(parsed)) {
    return DEFAULT_LIMIT;
  }
  return Math.min(Math.max(parsed, 1), MAX_LIMIT);
};

export async function GET(
  request: NextRequest,
  { params }: { params: RouteParams }
) {
  const userId = request.headers.get('x-user-id');

  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const supabase = await createSupabaseServiceRoleClient();
  const { searchParams } = request.nextUrl;

  const limit = sanitizeLimit(searchParams.get('limit'));
  const before = searchParams.get('before');

  let query = supabase
    .from(TABLE_NAME)
    .select('*')
    .eq('chat_id', params.chatId)
    .order('time_sent', { ascending: false })
    .limit(limit);

  if (before) {
    query = query.lt('time_sent', before);
  }

  const { data, error } = await query;

  if (error) {
    return NextResponse.json(
      { error: error.message ?? 'Failed to load messages' },
      { status: 500 }
    );
  }

  const messages = (data ?? []).sort(
    (a, b) =>
      new Date(a.time_sent as string).getTime() -
      new Date(b.time_sent as string).getTime()
  );

  return NextResponse.json({ messages });
}

export async function POST(
  request: NextRequest,
  { params }: { params: RouteParams }
) {
  const userId = request.headers.get('x-user-id');

  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { content } = (await request.json().catch(() => ({}))) as {
    content?: string;
  };

  const trimmed = (content ?? '').trim();

  if (!trimmed) {
    return NextResponse.json({ error: 'Missing content' }, { status: 400 });
  }

  const supabase = await createSupabaseServiceRoleClient();

  const payload = {
    chat_id: params.chatId,
    sender_id: userId,
    content: trimmed,
    time_sent: new Date().toISOString(),
    read_by: [userId],
  };

  const { data, error } = await supabase
    .from(TABLE_NAME)
    .insert(payload)
    .select()
    .single();

  if (error) {
    return NextResponse.json(
      { error: error.message ?? 'Failed to send message' },
      { status: 500 }
    );
  }

  return NextResponse.json({ message: data });
}
