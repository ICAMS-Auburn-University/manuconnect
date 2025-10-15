import { US_STATES } from '@/lib/constants';

export interface Address {
  street1: string;
  street2: string;
  city: string;
  state: string;
  postal_code: string;
  country: string;
}

export type USState = (typeof US_STATES)[number]['label'];
