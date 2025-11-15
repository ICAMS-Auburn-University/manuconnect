import { NextRequest, NextResponse } from 'next/server';

import {
  createAssemblyWithParts,
  listAssembliesWithParts,
} from '@/domain/manufacturing/service';

type RouteParams = {
  orderId: string;
};

type RouteContext = {
  params: Promise<RouteParams>;
};

export async function GET(
  _request: NextRequest,
  context: RouteContext
): Promise<NextResponse> {
  const { orderId } = await context.params;

  try {
    const assemblies = await listAssembliesWithParts(orderId);
    return NextResponse.json({ assemblies });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : 'Failed to load assemblies';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function POST(
  request: NextRequest,
  context: RouteContext
): Promise<NextResponse> {
  const { orderId } = await context.params;
  const { name, partIds } = (await request.json().catch(() => ({}))) as {
    name?: string;
    partIds?: string[];
  };

  if (!name || !Array.isArray(partIds) || partIds.length === 0) {
    return NextResponse.json(
      { error: 'Assembly name and at least one part are required.' },
      { status: 400 }
    );
  }

  try {
    const assembly = await createAssemblyWithParts({
      orderId,
      assemblyName: name.trim(),
      partIds,
    });
    return NextResponse.json({ assembly });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : 'Failed to create assembly';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
