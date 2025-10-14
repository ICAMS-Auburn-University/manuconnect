import { AccountType } from '@/types/enums';

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
