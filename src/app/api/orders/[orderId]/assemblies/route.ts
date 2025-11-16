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
  const { name, partIds, parts } = (await request.json().catch(() => ({}))) as {
    name?: string;
    partIds?: string[];
    parts?: {
      storagePath?: string;
      name?: string;
      hierarchy?: string[];
    }[];
  };

  if (!name || !Array.isArray(partIds) || partIds.length === 0) {
    return NextResponse.json(
      { error: 'Assembly name and at least one part are required.' },
      { status: 400 }
    );
  }

  const normalizedParts =
    Array.isArray(parts) && parts.length > 0
      ? parts
          .filter(
            (
              part
            ): part is {
              storagePath: string;
              name: string;
              hierarchy: string[];
            } =>
              Boolean(part.storagePath) &&
              Boolean(part.name) &&
              Array.isArray(part.hierarchy)
          )
          .map((part) => ({
            storagePath: part.storagePath,
            name: part.name,
            hierarchy: part.hierarchy,
          }))
      : [];

  if (normalizedParts.length !== partIds.length) {
    return NextResponse.json(
      {
        error:
          'Part metadata is required for every selected part to create an assembly.',
      },
      { status: 400 }
    );
  }

  try {
    console.log('[assemblies:POST] request payload', {
      orderId,
      name,
      partIdsCount: partIds.length,
    });
    const assembly = await createAssemblyWithParts({
      orderId,
      assemblyName: name.trim(),
      partIds,
      parts: normalizedParts,
    });
    return NextResponse.json({ assembly });
  } catch (error) {
    console.error('[assemblies:POST] failed', {
      orderId,
      error,
    });
    const message =
      error instanceof Error ? error.message : 'Failed to create assembly';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
