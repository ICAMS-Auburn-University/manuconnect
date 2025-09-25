import { Offer, Order } from '@/lib/definitions';
import { EmailTemplate } from './email-template';
import { Link, Preview, Text } from '@react-email/components';

interface OrderUpdateEmailProps {
  order?: Order;
  email: string;
}

export const OrderUpdateEmail: React.FC<Readonly<OrderUpdateEmailProps>> = ({
  order,
  email,
}) => (
  <EmailTemplate email={email}>
    <Preview>You have an update for one of your orders!</Preview>
    <Text>
      <h3>Order Update</h3>
    </Text>
    <Text>
      Your order #
      {order?.id.toLocaleString('en-US', {
        minimumIntegerDigits: 6,
        useGrouping: false,
      })}{' '}
      has been updated on{' '}
      {order?.last_update
        ? new Date(order.last_update).toLocaleString()
        : 'N/A'}
      .
    </Text>
    <Text>
      You can view the order details on the{' '}
      <Link href={`https://manuconnect.org/orders/${order?.id}`}>
        order's page
      </Link>
      .
    </Text>
  </EmailTemplate>
);
