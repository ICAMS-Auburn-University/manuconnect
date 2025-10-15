import { AccountType, CompanyType } from '@/types/enums';
import { Address, USState } from '@/types/shared';
import { z } from 'zod';
import { signInSchema } from '@/domain/auth/zod';

export interface LoginData {
  email: string;
  password: string;
}

export interface SignupData extends LoginData {
  firstName: string;
  lastName: string;
  accountType: AccountType;
  companyName: string;
}

export interface ClientSignUpData extends LoginData {
  firstName: string;
  lastName: string;
  accountType: AccountType.Client;
}

export interface ManufacturerSignUpData extends LoginData {
  companyName: string;
  companyType: CompanyType;
  stateOfFormation: USState;
  companyAddress: Address;
  representativeFirstName: string;
  representativeLastName: string;
  representativeRole: string;
  accountType: AccountType.Manufacturer;
}

export type SignInFormValues = z.infer<typeof signInSchema>;
