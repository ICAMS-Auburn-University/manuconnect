import { OffersSchema } from '@/types/schemas';
import { EmailTemplate } from './email-template';
import { Link, Preview, Text } from '@react-email/components';

interface NewOfferEmailProps {
  offer: OffersSchema;
  email: string;
}

export const NewOffer: React.FC<Readonly<NewOfferEmailProps>> = ({
  offer,
  email,
}) => (
  <EmailTemplate email={email}>
    <Preview>New Offer from {offer.manufacturer_name}</Preview>
    <Text>
      <h3>New Offer</h3>
    </Text>
    <Text>
      You have a new offer from {offer.manufacturer_name}.{' '}
      <span className="font-bold">
        Please login to view and decline or accept the offer.
      </span>
    </Text>
    <Text>
      Once the offer is accepted, you will be contacted by the manufacturer to
      finalize details and payment.
    </Text>
    <Text>
      View your offer details on your{' '}
      <Link href={`https://manuconnect.org/orders/`}>orders page</Link>.
    </Text>
  </EmailTemplate>
);
