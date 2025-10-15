import { z } from 'zod';
import { AccountType } from '@/types/enums';

const MIN_PASSWORD_LENGTH = 8;
const MAX_PASSWORD_LENGTH = 30;

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
