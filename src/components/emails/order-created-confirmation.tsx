import { OrdersSchema } from '@/types/schemas';
import { EmailTemplate } from './email-template';
import { Link, Preview, Text } from '@react-email/components';
import { abbreviateUUID } from '@/lib/utils/transforms';

interface NewOrderConfirmationEmailProps {
  order: OrdersSchema;
  email: string;
}

export const NewOrderConfirmation: React.FC<
  Readonly<NewOrderConfirmationEmailProps>
> = ({ order, email }) => (
  <EmailTemplate email={email}>
    <Preview>Order #{abbreviateUUID(order.id)} Confirmation</Preview>
    <Text>
      <h3>Order #{abbreviateUUID(order.id)} Confirmation</h3>
    </Text>
    <Text>Your order has been created successfully!</Text>
    <Text>
      <span className="font-bold">What&apos;s next?</span> Your order will be
      available for manufacturers to view and offer on. Once a manufacturer has
      accepted your order, you will be contacted to finalize details and
      payment.
    </Text>
    <Text>
      View your order details on your{' '}
      <Link href={`https://manuconnect.org/orders/`}>orders page</Link>.
    </Text>
  </EmailTemplate>
);
