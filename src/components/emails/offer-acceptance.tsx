import { OffersSchema } from '@/types/schemas';
import { EmailTemplate } from './email-template';
import { Link, Preview, Text } from '@react-email/components';
import { abbreviateUUID } from '@/lib/utils/transforms';

interface OfferAcceptanceEmailProps {
  offer?: OffersSchema;
  email: string;
}

export const OfferAcceptanceEmail: React.FC<
  Readonly<OfferAcceptanceEmailProps>
> = ({ offer, email }) => (
  <EmailTemplate email={email}>
    <Preview>Offer Accepted</Preview>
    <Text>
      <h3>Offer Accepted</h3>
    </Text>
    <Text>
      Your offer has been accepted on order #
      {abbreviateUUID(offer?.order_id || '')}
    </Text>
    <Text>
      <span className="font-bold">What&apos;s next?</span> Reach out to the
      creator to finalize details and payment of the order.
    </Text>
    <Text>
      You can now view the order details on the{' '}
      <Link href={`https://manuconnect.org/orders/${offer?.order_id}`}>
        order&apos;s page
      </Link>
      .
    </Text>
  </EmailTemplate>
);
