import { NextRequest, NextResponse } from 'next/server';

import { reorderAssemblies } from '@/domain/manufacturing/service';

type RouteParams = {
  orderId: string;
};

type RouteContext = {
  params: Promise<RouteParams>;
};

export async function POST(
  request: NextRequest,
  context: RouteContext
): Promise<NextResponse> {
  const { orderId } = await context.params;
  const { assemblyOrder } = (await request.json().catch(() => ({}))) as {
    assemblyOrder?: string[];
  };

  if (!Array.isArray(assemblyOrder) || assemblyOrder.length === 0) {
    return NextResponse.json(
      { error: 'Assembly order must include at least one entry.' },
      { status: 400 }
    );
  }

  try {
    await reorderAssemblies(orderId, assemblyOrder);
    return NextResponse.json({ success: true });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : 'Failed to update build order';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
