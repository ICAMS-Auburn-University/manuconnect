import { NextRequest, NextResponse } from 'next/server';

import {
  listPartSpecifications,
  savePartSpecification,
} from '@/domain/manufacturing/service';
import type { PartSpecificationContent } from '@/domain/manufacturing/types';

type RouteParams = {
  assemblyId: string;
};

type RouteContext = {
  params: Promise<RouteParams>;
};

export async function GET(
  _request: NextRequest,
  context: RouteContext
): Promise<NextResponse> {
  const { assemblyId } = await context.params;

  try {
    const specifications = await listPartSpecifications(assemblyId);
    return NextResponse.json({ specifications });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : 'Failed to load specifications';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function POST(
  request: NextRequest,
  context: RouteContext
): Promise<NextResponse> {
  const { assemblyId } = await context.params;
  const body = (await request.json().catch(() => ({}))) as {
    orderId?: string;
    partId?: string;
    quantity?: number;
    specifications?: PartSpecificationContent;
  };

  if (!body.orderId || !body.partId || !body.specifications) {
    return NextResponse.json(
      { error: 'Project, part, and specification details are required.' },
      { status: 400 }
    );
  }

  try {
    const record = await savePartSpecification({
      orderId: body.orderId,
      assemblyId,
      partId: body.partId,
      quantity: body.quantity ?? 1,
      specifications: body.specifications,
    });
    return NextResponse.json({ specification: record });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : 'Failed to save specifications';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
