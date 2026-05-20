import { NextRequest, NextResponse } from 'next/server';

import { analyzeCADWithLLM } from '@/services/LLM/analyzeCAD';
import type { SplitAssemblyResult } from '@/domain/cad/types';
import { getCurrentUser } from '@/lib/supabase/orders';

function isValidSplitAssemblyResult(
  value: unknown
): value is SplitAssemblyResult {
  if (!value || typeof value !== 'object') {
    return false;
  }

  const candidate = value as Partial<SplitAssemblyResult>;
  return (
    typeof candidate.userId === 'string' &&
    typeof candidate.orderId === 'string' &&
    typeof candidate.originalPath === 'string' &&
    Array.isArray(candidate.parts)
  );
}

export async function POST(request: NextRequest): Promise<NextResponse> {
  const { user, error } = await getCurrentUser();
  if (error || !user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const body = (await request.json().catch(() => ({}))) as {
    splitData?: unknown;
  };

  if (!isValidSplitAssemblyResult(body.splitData)) {
    return NextResponse.json(
      { error: 'splitData is required' },
      { status: 400 }
    );
  }

  try {
    const analysis = await analyzeCADWithLLM(body.splitData);
    return NextResponse.json({ analysis });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : 'Failed to analyze CAD';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}