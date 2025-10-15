'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Button } from '@/components/ui/button';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormMessage,
} from '@/components/ui/form';
import { Checkbox } from '@/components/ui/checkbox';
import { useRouter } from 'next/navigation';
import { CreatorAgreement } from '@/components/onboarding/agreements/CreatorAgreement';
import { completeCreatorOnboarding } from '@/domain/auth/service';
import { isNextRedirectError } from '@/lib/utils/errors';
import { creatorOnboardingSchema } from '@/domain/auth/zod';
import type { CreatorOnboardingFormValues } from '@/domain/auth/types';

export default function CreatorOnboarding() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  const form = useForm<CreatorOnboardingFormValues>({
    resolver: zodResolver(creatorOnboardingSchema),
    defaultValues: {
      agreementAccepted: false,
    },
  });

  const onSubmit = async (values: CreatorOnboardingFormValues) => {
    setIsLoading(true);
    setError(null);

    try {
      await completeCreatorOnboarding({
        agreementAccepted: values.agreementAccepted,
      });

      // The service handles the redirect, but we'll never get here
      // This is just a fallback
      router.push('/');
    } catch (err: any) {
      if (isNextRedirectError(err)) {
        throw err;
      }
      console.error('Error completing onboarding:', err);
      setError(err.message || 'Failed to complete onboarding');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-8">
      <div className="text-center">
        <h1 className="text-3xl font-bold text-[#0c2340] mb-2">
          Creator Agreement
        </h1>
        <p className="text-gray-600">
          Please review and accept our creator agreement to continue.
        </p>
      </div>

      <div className="bg-gray-50 border border-gray-200 rounded-lg p-6">
        <CreatorAgreement />
      </div>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          <FormField
            control={form.control}
            name="agreementAccepted"
            render={({ field }) => (
              <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4">
                <FormControl>
                  <Checkbox
                    checked={field.value}
                    onCheckedChange={field.onChange}
                  />
                </FormControl>
                <div className="space-y-1 leading-none">
                  <label className="font-medium text-sm cursor-pointer">
                    I have read and agree to the Creator Agreement
                  </label>
                </div>
                <FormMessage />
              </FormItem>
            )}
          />

          {error && <p className="text-red-500 text-sm">{error}</p>}

          <Button
            type="submit"
            className="bg-[#e87722] text-white w-full rounded-full"
            disabled={isLoading}
          >
            {isLoading ? 'Processing...' : 'Complete Signup'}
          </Button>
        </form>
      </Form>
    </div>
  );
}
