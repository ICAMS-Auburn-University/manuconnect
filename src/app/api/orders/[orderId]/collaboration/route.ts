import { NextRequest, NextResponse } from 'next/server';

import {
  getCollaborationData,
  assignPartsToSubcontractor,
  getAvailableManufacturers,
} from '@/domain/collaboration/service';

type RouteParams = {
  orderId: string;
};

type RouteContext = {
  params: Promise<RouteParams>;
};

/**
 * GET /api/orders/[orderId]/collaboration
 * Returns all collaboration data for an order — assignments, parts, collaborators.
 */
export async function GET(
  _request: NextRequest,
  context: RouteContext
): Promise<NextResponse> {
  const { orderId } = await context.params;

  try {
    const data = await getCollaborationData(orderId);
    return NextResponse.json(data);
  } catch (error) {
    const message =
      error instanceof Error ? error.message : 'Failed to fetch collaboration data';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

/**
 * POST /api/orders/[orderId]/collaboration
 * Assign parts to a subcontractor.
 * Body: { partIds: string[], manufacturerId: string, manufacturerName: string }
 */
export async function POST(
  request: NextRequest,
  context: RouteContext
): Promise<NextResponse> {
  const { orderId } = await context.params;

  const body = (await request.json().catch(() => ({}))) as {
    partIds?: string[];
    manufacturerId?: string;
    manufacturerName?: string;
  };

  if (
    !Array.isArray(body.partIds) ||
    body.partIds.length === 0 ||
    !body.manufacturerId ||
    !body.manufacturerName
  ) {
    return NextResponse.json(
      { error: 'partIds, manufacturerId, and manufacturerName are required.' },
      { status: 400 }
    );
  }

  try {
    const result = await assignPartsToSubcontractor(
      orderId,
      body.partIds,
      body.manufacturerId,
      body.manufacturerName
    );

    if (!result.success) {
      return NextResponse.json(
        { error: result.error },
        { status: 400 }
      );
    }

    // Return updated collaboration data
    const data = await getCollaborationData(orderId);
    return NextResponse.json(data);
  } catch (error) {
    const message =
      error instanceof Error ? error.message : 'Failed to assign parts';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
