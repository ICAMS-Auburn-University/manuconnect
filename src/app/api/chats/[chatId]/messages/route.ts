import { NextRequest, NextResponse } from 'next/server';

import { createSupabaseServiceRoleClient } from '@/app/_internal/supabase/server-client';
import type { TablesInsert } from '@/types/supabase';

type RouteParams = {
  chatId: string;
};

type RouteContext = {
  params: RouteParams | Promise<RouteParams>;
};

const DEFAULT_LIMIT = 50;
const MAX_LIMIT = 200;

const sanitizeLimit = (rawLimit: string | null) => {
  const parsed = Number.parseInt(rawLimit ?? `${DEFAULT_LIMIT}`, 10);
  if (Number.isNaN(parsed)) {
    return DEFAULT_LIMIT;
  }
  return Math.min(Math.max(parsed, 1), MAX_LIMIT);
};

export async function GET(request: NextRequest, context: RouteContext) {
  const { chatId } = await context.params;
  const userId = request.headers.get('x-user-id');

  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const supabase = await createSupabaseServiceRoleClient();
  const { searchParams } = request.nextUrl;

  const limit = sanitizeLimit(searchParams.get('limit'));
  const before = searchParams.get('before');

  let query = supabase
    .from('Messages')
    .select('*')
    .eq('chat_id', chatId)
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

  const messages = [...(data ?? [])].sort((a, b) => {
    const aTimestamp = new Date(a.time_sent).getTime();
    const bTimestamp = new Date(b.time_sent).getTime();
    return aTimestamp - bTimestamp;
  });

  return NextResponse.json({ messages });
}

export async function POST(request: NextRequest, context: RouteContext) {
  const { chatId } = await context.params;
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

  const payload: TablesInsert<'Messages'> = {
    chat_id: chatId,
    sender_id: userId,
    content: trimmed,
    time_sent: new Date().toISOString(),
    read_by: [userId],
  };

  const { data, error } = await supabase
    .from('Messages')
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
