import { AccountType, CompanyType } from '@/types/enums';
import { Address, USState } from '@/types/shared';
import { z } from 'zod';
import {
  signInSchema,
  signUpSchema,
  creatorOnboardingSchema,
  manufacturerOnboardingSchema,
} from '@/domain/auth/zod';

export interface LoginData {
  email: string;
  password: string;
}

export interface SignUpData extends LoginData {
  firstName: string;
  lastName: string;
  accountType: AccountType;
}

export interface CreatorOnboardingData {
  agreementAccepted: boolean;
}

export interface ManufacturerOnboardingData {
  companyName: string;
  companyType: CompanyType;
  stateOfFormation: USState;
  companyAddress: Address;
  representativeRole: string;
  agreementAccepted: boolean;
}

export type SignInFormValues = z.infer<typeof signInSchema>;
export type SignUpFormValues = z.infer<typeof signUpSchema>;
export type CreatorOnboardingFormValues = z.infer<
  typeof creatorOnboardingSchema
>;
export type ManufacturerOnboardingFormValues = z.infer<
  typeof manufacturerOnboardingSchema
>;
