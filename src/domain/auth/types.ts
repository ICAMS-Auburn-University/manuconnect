import { AccountType, CompanyType } from '@/types/enums';
import { Address, USState } from '@/types/shared';
import { z } from 'zod';
import { signInSchema, signUpSchema } from '@/domain/auth/zod';

export interface LoginData {
  email: string;
  password: string;
}

export interface SignUpData extends LoginData {
  firstName: string;
  lastName: string;
  accountType: AccountType;
}

export interface ClientSignUpData extends LoginData {
  firstName: string;
  lastName: string;
  accountType: AccountType.Creator;
}

export interface ManufacturerSignUpData extends LoginData {
  firstName: string;
  lastName: string;
  accountType: AccountType.Manufacturer;
  companyName: string;
  companyType: CompanyType;
  stateOfFormation: USState;
  companyAddress: Address;
  representativeFirstName: string;
  representativeLastName: string;
  representativeRole: string;
}

export type SignInFormValues = z.infer<typeof signInSchema>;
export type SignUpFormValues = z.infer<typeof signUpSchema>;
