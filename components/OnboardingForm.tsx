'use client';
import React, { useState } from 'react';
import { Card, CardContent, CardTitle } from './ui/card';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import Image from 'next/image';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from './ui/select';
import { createClient } from '@/utils/supabase/client';
import { redirect } from 'next/navigation';
import { isMobilePhone } from 'validator';

const phoneRegex = new RegExp(
  /^([+]?[\s0-9]+)?(\d{3}|[(]?[0-9]+[)])?([-]?[\s]?[0-9])+$/
);

const onboardingFormSchema = z.object({
  accountType: z.enum(['creator', 'manufacturer', 'admin']),
  manufacturerName: z.string().max(30).optional(),
  phoneNumber: z.string().regex(phoneRegex, {
    message: 'Please enter a valid phone number.',
  }),
});

const OnboardingForm = () => {
  const [isLoading, setisLoading] = useState(false);
  const [errorMessage, seterrorMessage] = useState('');

  // 1. Define your form.
  const form = useForm<z.infer<typeof onboardingFormSchema>>({
    resolver: zodResolver(onboardingFormSchema),
    defaultValues: {
      accountType: undefined,
      manufacturerName: '',
      phoneNumber: '',
    },
  });

  // 2. Define a submit handler.
  const onSubmit = async (values: z.infer<typeof onboardingFormSchema>) => {
    setisLoading(true);
    seterrorMessage('');
    const supabase = createClient();

    try {
      const { data, error } = await supabase.auth.updateUser({
        data: {
          account_type: values.accountType,
          manufacturer_name: values.manufacturerName,
          phone_number: values.phoneNumber,
        },
      });
      console.log('User profile updated:', data, error);
    } catch (error) {
      console.error(error);
      seterrorMessage('Something went wrong. Please try again.' + error);
    } finally {
      setisLoading(false);
    }

    redirect('/');
  };

  return (
    <>
      <Form {...form}>
        <form
          onSubmit={form.handleSubmit(onSubmit)}
          className="auth-form max-w-sm"
        >
          <h1 className="h1 mb-2 text-[#0c2340]">Welcome!</h1>
          <FormDescription className="mb-4 -mt-2">
            It's great to have you here. Let's get started by setting up your
            account.
          </FormDescription>
          <div className="space-y-4">
            <FormField
              control={form.control}
              name="phoneNumber"
              render={({ field }) => (
                <FormItem>
                  <div className="shad-form-item mt-2">
                    <FormLabel className="pb-1">Phone Number</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="(334) 555-5555"
                        type="tel"
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
                <FormItem>
                  <div className="shad-form-item">
                    <FormLabel className="pb-1">Choose Account Type</FormLabel>
                    <FormControl>
                      <Select
                        onValueChange={field.onChange}
                        defaultValue={field.value}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="What best represents you?" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="creator">Creator</SelectItem>
                          <SelectItem value="manufacturer">
                            Manufacturer
                          </SelectItem>
                        </SelectContent>
                      </Select>
                    </FormControl>
                  </div>
                  <FormMessage className="shad-form-message" />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="manufacturerName"
              render={({ field }) => (
                <FormItem>
                  <div className="shad-form-item mt-2">
                    <FormLabel className="pb-1">Company Name</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="Enter your company name"
                        className="shad-input"
                        {...field}
                      />
                    </FormControl>
                  </div>
                  <FormMessage className="shad-form-message" />
                </FormItem>
              )}
            />
          </div>

          <Button
            type="submit"
            className="bg-[#e87722] text-white w-full rounded-full my-4"
            disabled={isLoading}
          >
            Continue
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
          {errorMessage && <p className="error-message"> *{errorMessage}</p>}
        </form>
      </Form>
    </>
  );
};

export default OnboardingForm;
