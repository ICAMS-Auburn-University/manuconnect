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
import { login } from '@/domain/auth/service';
import { signInSchema } from '@/domain/auth/zod';
import type { SignInFormValues } from '@/domain/auth/types';

const SignInForm = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  const form = useForm<SignInFormValues>({
    resolver: zodResolver(signInSchema),
    defaultValues: {
      email: '',
      password: '',
    },
  });

  const onSubmit = async (values: SignInFormValues) => {
    setIsLoading(true);
    setErrorMessage('');

    try {
      await login(values);
    } catch (error) {
      if (isNextRedirectError(error)) {
        throw error;
      }
      console.error(error);
      setErrorMessage('Invalid email or password. Please try again.');
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
        <h1 className="h1 mb-2 text-[#0c2340]">Sign In</h1>

        <FormField
          control={form.control}
          name="email"
          render={({ field }) => (
            <FormItem>
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

        <Button
          type="submit"
          className="bg-[#e87722] text-white w-full rounded-full my-4"
          disabled={isLoading}
        >
          Sign In
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

        {errorMessage && (
          <p className="error-message text-red font-bold">*{errorMessage}</p>
        )}
        <div className="body-2 flex flex-col justify-center text-center">
          <div className="flex justify-center">
            <p>Don&apos;t have an account?</p>
            <Link href="/sign-up" className="ml-1 font-medium text-[#e87722]">
              {' '}
              Sign Up
            </Link>
          </div>
          <Link
            href="/forgot-password"
            className="ml-1 font-medium text-[#e87722]"
          >
            {' '}
            Forgot Password?
          </Link>
        </div>
      </form>
    </Form>
  );
};

export default SignInForm;
