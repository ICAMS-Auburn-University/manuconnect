import { Order } from '@/lib/types/definitions';
import { EmailTemplate } from './email-template';
import { Link, Preview, Text } from '@react-email/components';

interface NewOrderConfirmationEmailProps {
  order: Order;
  email: string;
}

export const NewOrderConfirmation: React.FC<
  Readonly<NewOrderConfirmationEmailProps>
> = ({ order, email }) => (
  <EmailTemplate email={email}>
    <Preview>
      Order #
      {order.id.toLocaleString('en-US', {
        minimumIntegerDigits: 6,
        useGrouping: false,
      })}{' '}
      Confirmation
    </Preview>
    <Text>
      <h3>
        Order #
        {order.id.toLocaleString('en-US', {
          minimumIntegerDigits: 6,
          useGrouping: false,
        })}{' '}
        Confirmation
      </h3>
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
