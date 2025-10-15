'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { isNextRedirectError } from '@/lib/utils/errors';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { signup } from '@/domain/auth/service';
import { signUpSchema } from '@/domain/auth/zod';
import type { SignUpFormValues } from '@/domain/auth/types';
import { AccountType } from '@/types/enums';

const SignUpForm = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [isSuccess, setIsSuccess] = useState(false);

  const form = useForm<SignUpFormValues>({
    resolver: zodResolver(signUpSchema),
    defaultValues: {
      email: '',
      password: '',
      firstName: '',
      lastName: '',
      accountType: AccountType.Creator,
      confirmPassword: '',
    },
  });

  const onSubmit = async (values: SignUpFormValues) => {
    setIsLoading(true);
    setErrorMessage('');
    try {
      await signup({
        email: values.email,
        password: values.password,
        firstName: values.firstName,
        lastName: values.lastName,
        accountType: values.accountType,
      });
      setIsSuccess(true);
    } catch (error) {
      if (isNextRedirectError(error)) {
        throw error;
      }
      console.error(error);
      setErrorMessage('Something went wrong. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Form {...form}>
      <form
        onSubmit={form.handleSubmit(onSubmit)}
        className="auth-form max-w-sm"
      >
        <h1 className="h1 mb-2 text-[#0c2340]">Sign Up</h1>

        <div>
          <FormField
            control={form.control}
            name="firstName"
            render={({ field }) => (
              <FormItem>
                <div className="shad-form-item">
                  <FormLabel className="shad-form-label">First Name</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="Enter your first name"
                      className="shad-input"
                      {...field}
                    />
                  </FormControl>
                </div>
                <FormMessage className="shad-form-message" />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="lastName"
            render={({ field }) => (
              <FormItem>
                <div className="shad-form-item">
                  <FormLabel className="shad-form-label">Last Name</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="Enter your last name"
                      className="shad-input"
                      {...field}
                    />
                  </FormControl>
                </div>
                <FormMessage className="shad-form-message" />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="accountType"
            render={({ field }) => (
              <FormItem className="mt-4">
                <div className="shad-form-item">
                  <FormLabel className="shad-form-label">
                    Account Type
                  </FormLabel>
                  <Select
                    onValueChange={field.onChange}
                    value={field.value}
                    defaultValue={field.value}
                  >
                    <FormControl>
                      <SelectTrigger className="shad-input text-left">
                        <SelectValue placeholder="Select account type" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value={AccountType.Creator}>
                        Creator
                      </SelectItem>
                      <SelectItem value={AccountType.Manufacturer}>
                        Manufacturer
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <FormMessage className="shad-form-message" />
              </FormItem>
            )}
          />
        </div>

        <FormField
          control={form.control}
          name="email"
          render={({ field }) => (
            <FormItem className="mt-4">
              <div className="shad-form-item">
                <FormLabel className="shad-form-label">Email</FormLabel>
                <FormControl>
                  <Input
                    placeholder="Enter your email"
                    className="shad-input"
                    {...field}
                  />
                </FormControl>
              </div>
              <FormMessage className="shad-form-message" />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="password"
          render={({ field }) => (
            <FormItem>
              <div className="shad-form-item">
                <FormLabel className="shad-form-label">Password</FormLabel>
                <FormControl>
                  <Input
                    placeholder="Enter your password"
                    className="shad-input"
                    type="password"
                    {...field}
                  />
                </FormControl>
              </div>
              <FormMessage className="shad-form-message" />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="confirmPassword"
          render={({ field }) => (
            <FormItem>
              <div className="shad-form-item">
                <FormLabel className="shad-form-label">
                  Confirm Password
                </FormLabel>
                <FormControl>
                  <Input
                    placeholder="Re-enter your password"
                    className="shad-input"
                    type="password"
                    {...field}
                  />
                </FormControl>
              </div>
              <FormMessage className="shad-form-message" />
            </FormItem>
          )}
        />

        <Button
          type="submit"
          className="bg-[#e87722] text-white w-full rounded-full my-4"
          disabled={isLoading}
        >
          Sign Up
          {isLoading && (
            <Image
              src="/loader.svg"
              alt="loader"
              width={24}
              height={24}
              className="ml-2 animate-spin"
            />
          )}
        </Button>

        {errorMessage && <p className="error-message">*{errorMessage}</p>}
        <div className="body-2 flex flex-col justify-center text-center">
          <div className="flex justify-center">
            <p>Already have an account?</p>
            <Link href="/sign-in" className="ml-1 font-medium text-[#e87722]">
              {' '}
              Sign In
            </Link>
          </div>
        </div>

        {isSuccess && (
          <div className="flex justify-center text-center mt-3 font-semibold">
            <p>
              Success! Please check your email for a confirmation link. After
              verification, you'll complete your account setup.
            </p>
          </div>
        )}
      </form>
    </Form>
  );
};

export default SignUpForm;
