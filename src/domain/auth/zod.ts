import { z } from 'zod';
import { AccountType, CompanyType } from '@/types/enums';

const MIN_PASSWORD_LENGTH = 8;
const MAX_PASSWORD_LENGTH = 30;

export const addressSchema = z.object({
  street1: z.string().min(1, { message: 'Street address is required' }),
  street2: z.string(),
  city: z.string().min(1, { message: 'City is required' }),
  state: z.string().min(1, { message: 'State is required' }),
  postal_code: z.string().min(1, { message: 'Postal code is required' }),
  country: z.string().min(1, { message: 'Country is required' }),
});

export const signInSchema = z.object({
  email: z.string().email(),
  password: z.string().min(MIN_PASSWORD_LENGTH).max(MAX_PASSWORD_LENGTH),
});

export const signUpSchema = z
  .object({
    firstName: z.string().min(1),
    lastName: z.string().min(1),
    accountType: z.enum([AccountType.Creator, AccountType.Manufacturer]),
    email: z.string().email(),
    password: z.string().min(MIN_PASSWORD_LENGTH).max(MAX_PASSWORD_LENGTH),
    confirmPassword: z
      .string()
      .min(MIN_PASSWORD_LENGTH)
      .max(MAX_PASSWORD_LENGTH),
  })
  .superRefine((data, ctx) => {
    if (data.password !== data.confirmPassword) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['confirmPassword'],
        message: 'Passwords must match',
      });
    }
  });

export const creatorOnboardingSchema = z.object({
  agreementAccepted: z.boolean().refine((val) => val === true, {
    message: 'You must accept the agreement to continue',
  }),
  timeAccepted: z.date().optional(),
});

export const manufacturerOnboardingSchema = z.object({
  companyName: z.string().min(1, { message: 'Company name is required' }),
  companyType: z.nativeEnum(CompanyType),
  stateOfFormation: z
    .string()
    .min(1, { message: 'State of formation is required' }),
  companyAddress: addressSchema,
  representativeRole: z
    .string()
    .min(1, { message: 'Representative role is required' }),
  agreementAccepted: z.boolean().refine((val) => val === true, {
    message: 'You must accept the agreement to continue',
  }),
  timeAccepted: z.date().optional(),
});
