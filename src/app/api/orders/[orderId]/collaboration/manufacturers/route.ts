import { NextResponse } from 'next/server';

import { getAvailableManufacturers } from '@/domain/collaboration/service';

/**
 * GET /api/orders/[orderId]/collaboration/manufacturers
 * Returns list of available manufacturers for subcontracting.
 */
export async function GET(): Promise<NextResponse> {
  try {
    const manufacturers = await getAvailableManufacturers();
    return NextResponse.json({ manufacturers });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : 'Failed to fetch manufacturers';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
