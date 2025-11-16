import { NextRequest, NextResponse } from 'next/server';

import { updateAssemblySpecificationStatus } from '@/domain/manufacturing/service';

type RouteParams = {
  assemblyId: string;
};

type RouteContext = {
  params: Promise<RouteParams>;
};

export async function POST(
  request: NextRequest,
  context: RouteContext
): Promise<NextResponse> {
  const { assemblyId } = await context.params;
  const { completed } = (await request.json().catch(() => ({}))) as {
    completed?: boolean;
  };

  if (typeof completed !== 'boolean') {
    return NextResponse.json(
      { error: 'Completed flag is required.' },
      { status: 400 }
    );
  }

  try {
    const assembly = await updateAssemblySpecificationStatus(
      assemblyId,
      completed
    );
    return NextResponse.json({ assembly });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : 'Failed to update assembly';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
