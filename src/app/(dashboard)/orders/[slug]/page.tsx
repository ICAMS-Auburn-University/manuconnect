import OrderPageWrapper from '@/app/(dashboard)/orders/[slug]/_components/OrderPageWrapper';
import { getOrderById } from '@/domain/orders/service';
import { notFound } from 'next/navigation';

export default async function OrderDetailsPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const resolvedParams = await params;

  // Validate that slug exists and is a string
  if (!resolvedParams?.slug || typeof resolvedParams.slug !== 'string') {
    notFound();
  }

  const slug = resolvedParams.slug;

  try {
    const order = await getOrderById(slug);

    if (!order) {
      notFound();
    }

    return <OrderPageWrapper orderId={slug} />;
  } catch (error) {
    console.error('Error loading order:', error);
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="p-8 text-center">
          <h2 className="text-2xl font-semibold mb-4">Error Loading Order</h2>
          <p>Unable to load order details. Please try again later.</p>
        </div>
      </div>
    );
  }
}
