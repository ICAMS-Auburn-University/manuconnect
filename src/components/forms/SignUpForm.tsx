'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import Image from 'next/image';
import Link from 'next/link';

import { Button } from '@/components/ui/button';
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
import { isNextRedirectError } from '@/lib/utils/errors';
import type { SignUpFormValues } from '@/domain/auth/types';
import { AccountType } from '@/types/enums';

const SignUpForm = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [isSuccess, setIsSuccess] = useState(false);

  const form = useForm<SignUpFormValues>({
    resolver: zodResolver(signUpSchema),
    defaultValues: {
      firstName: '',
      lastName: '',
      email: '',
      accountType: AccountType.Creator,
      password: '',
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
      console.error('Signup error:', error);
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

        {/* Personal Information */}
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
                    autoComplete="given-name"
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
                    autoComplete="family-name"
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
                <FormLabel className="shad-form-label">Account Type</FormLabel>
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
                    <SelectItem value={AccountType.Creator}>Creator</SelectItem>
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

        {/* Authentication Information */}
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
                    type="email"
                    autoComplete="email"
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
                    autoComplete="new-password"
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
                    autoComplete="new-password"
                    {...field}
                  />
                </FormControl>
              </div>
              <FormMessage className="shad-form-message" />
            </FormItem>
          )}
        />

        {/* Form Actions */}
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

        {errorMessage && <p className="text-red font-bold">*{errorMessage}</p>}

        {/* Success Message */}
        {isSuccess && (
          <div className="mt-3 p-3 bg-green-50 border border-green-200 rounded-md text-green-800 font-medium text-sm text-center">
            Success! Please check your email for a confirmation link.
            <br />
            After verification, you&apos;ll complete your account setup.
          </div>
        )}

        {/* Form Footer */}
        <div className="mt-4 text-center">
          <p className="text-sm flex items-center justify-center">
            Already have an account?
            <Link href="/sign-in" className="ml-1 font-medium text-[#e87722]">
              Sign In
            </Link>
          </p>
        </div>
      </form>
    </Form>
  );
};

export default SignUpForm;
