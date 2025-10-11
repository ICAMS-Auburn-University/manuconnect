import OrderPageWrapper from '@/app/(dashboard)/orders/[slug]/_components/OrderPageWrapper';
import { getOrderById } from '@/domain/orders/service';

export default async function OrderDetailsPage({
  params,
}: {
  params: { slug: string };
}) {
  const { slug } = params;

  const order = await getOrderById(slug);

  if (!order) {
    return <div>Order not found</div>;
  }

  return <OrderPageWrapper orderId={slug} />;
}
