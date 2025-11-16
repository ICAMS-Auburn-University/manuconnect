import { NextRequest, NextResponse } from 'next/server';

import {
  fetchShippingDetails,
  saveShippingDetails,
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
    const address = await fetchShippingDetails(orderId);
    return NextResponse.json({ address });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : 'Failed to load address';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function POST(
  request: NextRequest,
  context: RouteContext
): Promise<NextResponse> {
  const { orderId } = await context.params;

  const body = (await request.json().catch(() => ({}))) as {
    recipientName?: string;
    companyName?: string | null;
    street1?: string;
    street2?: string | null;
    city?: string;
    state?: string;
    postalCode?: string;
    country?: string;
    phoneNumber?: string;
  };

  if (
    !body.recipientName ||
    !body.street1 ||
    !body.city ||
    !body.state ||
    !body.postalCode ||
    !body.country ||
    !body.phoneNumber
  ) {
    console.error('[shipping:POST] missing fields', {
      orderId,
      body,
    });
    return NextResponse.json(
      { error: 'All shipping fields are required.' },
      { status: 400 }
    );
  }

  try {
    console.log('[shipping:POST] saving address', {
      orderId,
      payload: {
        recipientName: body.recipientName,
        companyName: body.companyName ?? null,
        street1: body.street1,
        street2: body.street2 ?? '',
        city: body.city,
        state: body.state,
        postalCode: body.postalCode,
        country: body.country,
        phoneNumber: body.phoneNumber,
      },
    });
    const address = await saveShippingDetails({
      orderId,
      recipientName: body.recipientName,
      companyName: body.companyName ?? null,
      street1: body.street1,
      street2: body.street2 ?? '',
      city: body.city,
      state: body.state,
      postalCode: body.postalCode,
      country: body.country,
      phoneNumber: body.phoneNumber,
    });
    return NextResponse.json({ address });
  } catch (error) {
    console.error('[shipping:POST] failed', { orderId, error });
    const message =
      error instanceof Error ? error.message : 'Failed to save address';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
