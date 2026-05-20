import { NextRequest, NextResponse } from 'next/server';

import {
  updateAssignmentStatus,
  unassignPart,
} from '@/domain/collaboration/service';

type RouteParams = {
  orderId: string;
  assignmentId: string;
};

type RouteContext = {
  params: Promise<RouteParams>;
};

/**
 * PATCH /api/orders/[orderId]/collaboration/[assignmentId]
 * Update status of a part assignment.
 * Body: { status: string }
 */
export async function PATCH(
  request: NextRequest,
  context: RouteContext
): Promise<NextResponse> {
  const { assignmentId } = await context.params;

  const body = (await request.json().catch(() => ({}))) as {
    status?: string;
  };

  const validStatuses = [
    'Not Started',
    'In Progress',
    'Completed',
    'Shipped',
  ];

  if (!body.status || !validStatuses.includes(body.status)) {
    return NextResponse.json(
      { error: `Status must be one of: ${validStatuses.join(', ')}` },
      { status: 400 }
    );
  }

  try {
    const result = await updateAssignmentStatus(assignmentId, body.status);

    if (!result.success) {
      return NextResponse.json(
        { error: result.error },
        { status: 400 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : 'Failed to update assignment';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

/**
 * DELETE /api/orders/[orderId]/collaboration/[assignmentId]
 * Remove a part assignment (unassign subcontractor).
 */
export async function DELETE(
  _request: NextRequest,
  context: RouteContext
): Promise<NextResponse> {
  const { assignmentId } = await context.params;

  try {
    const result = await unassignPart(assignmentId);

    if (!result.success) {
      return NextResponse.json(
        { error: result.error },
        { status: 400 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : 'Failed to remove assignment';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
