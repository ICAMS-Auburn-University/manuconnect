import { getOrderById } from '@/utils/supabase/orders';

import OrderPageWrapper from '@/components/OrderPageWrapper';
import { getUserById } from '@/utils/adminUtils';

export default async function OrderDetailsPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;

  const order = await getOrderById(slug);

  if (!order) {
    return <div>Order not found</div>;
  }

  return <OrderPageWrapper orderId={slug} />;
}
