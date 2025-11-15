import { NextRequest, NextResponse } from 'next/server';

import { ensureDraftOrder } from '@/domain/orders/service';

export async function POST(request: NextRequest): Promise<NextResponse> {
  const { orderId } = (await request.json().catch(() => ({}))) as {
    orderId?: string;
  };

  if (!orderId) {
    return NextResponse.json(
      { error: 'orderId is required' },
      { status: 400 }
    );
  }

  try {
    const order = await ensureDraftOrder(orderId);
    return NextResponse.json({ order });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : 'Failed to create draft order';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
