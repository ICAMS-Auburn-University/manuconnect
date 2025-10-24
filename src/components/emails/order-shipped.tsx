import { OrdersSchema } from '@/types/schemas';
import { EmailTemplate } from './email-template';
import { Link, Preview, Text } from '@react-email/components';
import { abbreviateUUID } from '@/lib/utils/transforms';

interface OrderShippedEmailProps {
  order: OrdersSchema;
  email: string;
}

export const OrderShippedEmail: React.FC<Readonly<OrderShippedEmailProps>> = ({
  order,
  email,
}) => (
  <EmailTemplate email={email}>
    <Preview>Order #{abbreviateUUID(order.id)} has shipped!</Preview>
    <Text>
      <h3>Order #{abbreviateUUID(order.id)} Shipped</h3>
    </Text>
    <Text>Your order has shipped!</Text>
    <Text>
      The manufacturer has marked your order as shipped. They have provided the
      tracking information below:
      <br />
      <span className="font-bold">Carrier:</span> {order.shipping_info?.carrier}
      <br />
      <span className="font-bold">Tracking Number:</span>{' '}
      <Link
        href={`https://google.com/search?q=${order.shipping_info?.tracking_number}`}
      >
        {' '}
        {order.shipping_info?.tracking_number}
      </Link>
    </Text>
    <Text>
      View your order details on your{' '}
      <Link href={`https://manuconnect.org/orders/`}>orders page</Link>.
    </Text>
  </EmailTemplate>
);
