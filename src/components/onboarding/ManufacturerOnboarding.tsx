'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { createClient } from '@/services/supabase/client';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useRouter } from 'next/navigation';
import { CompanyType } from '@/types/enums';
import { US_STATES } from '@/lib/constants';
import { ManufacturerAgreement } from '@/components/onboarding/agreements/ManufacturerAgreement';

const manufacturerOnboardingSchema = z.object({
  companyName: z.string().min(1, { message: 'Company name is required' }),
  companyType: z.nativeEnum(CompanyType),
  stateOfFormation: z
    .string()
    .min(1, { message: 'State of formation is required' }),
  companyAddress: z.object({
    street1: z.string().min(1, { message: 'Street address is required' }),
    street2: z.string().optional(),
    city: z.string().min(1, { message: 'City is required' }),
    state: z.string().min(1, { message: 'State is required' }),
    postal_code: z.string().min(1, { message: 'Postal code is required' }),
    country: z.string().min(1, { message: 'Country is required' }),
  }),
  representativeRole: z
    .string()
    .min(1, { message: 'Representative role is required' }),
  agreementAccepted: z.boolean().refine((val) => val === true, {
    message: 'You must accept the agreement to continue',
  }),
});

type ManufacturerOnboardingValues = z.infer<
  typeof manufacturerOnboardingSchema
>;

export default function ManufacturerOnboardingForm() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showAgreement, setShowAgreement] = useState(false);
  const router = useRouter();

  const form = useForm<ManufacturerOnboardingValues>({
    resolver: zodResolver(manufacturerOnboardingSchema),
    defaultValues: {
      companyName: '',
      companyType: CompanyType.LLC,
      stateOfFormation: '',
      companyAddress: {
        street1: '',
        street2: '',
        city: '',
        state: '',
        postal_code: '',
        country: 'United States',
      },
      representativeRole: '',
      agreementAccepted: false,
    },
  });

  const onSubmit = async (values: ManufacturerOnboardingValues) => {
    setIsLoading(true);
    setError(null);

    try {
      const supabase = createClient();

      const { error: updateError } = await supabase.auth.updateUser({
        data: {
          companyName: values.companyName,
          companyType: values.companyType,
          stateOfFormation: values.stateOfFormation,
          companyAddress: values.companyAddress,
          representativeRole: values.representativeRole,
          agreementAccepted: values.agreementAccepted,
          onboardingCompleted: true,
        },
      });

      if (updateError) {
        throw updateError;
      }

      router.push('/');
    } catch (err: any) {
      console.error('Error completing onboarding:', err);
      setError(err.message || 'Failed to complete onboarding');
    } finally {
      setIsLoading(false);
    }
  };

  const handleNextStep = () => {
    form.trigger([
      'companyName',
      'companyType',
      'stateOfFormation',
      'companyAddress',
      'representativeRole',
    ]);
    const isFirstStepValid =
      !form.getFieldState('companyName').invalid &&
      !form.getFieldState('companyType').invalid &&
      !form.getFieldState('stateOfFormation').invalid &&
      !form.getFieldState('representativeRole').invalid &&
      !form.getFieldState('companyAddress').invalid;

    if (isFirstStepValid) {
      setShowAgreement(true);
      window.scrollTo(0, 0);
    }
  };

  return (
    <div className="space-y-8">
      <div className="text-center">
        <h1 className="text-3xl font-bold text-[#0c2340] mb-2">
          {showAgreement ? 'Manufacturer Agreement' : 'Complete Your Profile'}
        </h1>
        <p className="text-gray-600">
          {showAgreement
            ? 'Please review and accept our manufacturer agreement to continue.'
            : 'Please provide your company information to complete your profile.'}
        </p>
      </div>

      {!showAgreement ? (
        <Form {...form}>
          <form className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <FormField
                control={form.control}
                name="companyName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Company Name</FormLabel>
                    <FormControl>
                      <Input placeholder="Enter company name" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="companyType"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Company Type</FormLabel>
                    <Select
                      onValueChange={field.onChange}
                      defaultValue={field.value}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select company type" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {Object.entries(CompanyType).map(([key, value]) => (
                          <SelectItem key={key} value={value}>
                            {value}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="stateOfFormation"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>State of Formation</FormLabel>
                    <Select
                      onValueChange={field.onChange}
                      defaultValue={field.value}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select state" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {US_STATES.map((state) => (
                          <SelectItem key={state.value} value={state.label}>
                            {state.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="representativeRole"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Your Role in Company</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="e.g. CEO, Manager, Owner"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="border rounded-lg p-4 space-y-4">
              <h3 className="font-medium">Company Address</h3>

              <FormField
                control={form.control}
                name="companyAddress.street1"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Street Address</FormLabel>
                    <FormControl>
                      <Input placeholder="Street address" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="companyAddress.street2"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Street Address 2 (Optional)</FormLabel>
                    <FormControl>
                      <Input placeholder="Apartment, suite, etc." {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="companyAddress.city"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>City</FormLabel>
                      <FormControl>
                        <Input placeholder="City" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="companyAddress.state"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>State</FormLabel>
                      <Select
                        onValueChange={field.onChange}
                        defaultValue={field.value}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select state" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {US_STATES.map((state) => (
                            <SelectItem key={state.value} value={state.label}>
                              {state.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="companyAddress.postal_code"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Postal Code</FormLabel>
                      <FormControl>
                        <Input placeholder="Postal code" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="companyAddress.country"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Country</FormLabel>
                      <FormControl>
                        <Input placeholder="Country" {...field} disabled />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </div>

            <Button
              type="button"
              className="bg-[#e87722] text-white w-full rounded-full"
              onClick={handleNextStep}
            >
              Next: Review Agreement
            </Button>
          </form>
        </Form>
      ) : (
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <div className="bg-gray-50 border border-gray-200 rounded-lg p-6">
              <ManufacturerAgreement />
            </div>

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
                      I have read and agree to the Manufacturer Agreement
                    </label>
                  </div>
                  <FormMessage />
                </FormItem>
              )}
            />

            {error && <p className="text-red-500 text-sm">{error}</p>}

            <div className="flex gap-4">
              <Button
                type="button"
                className="bg-gray-200 text-gray-800 w-1/2 rounded-full"
                onClick={() => setShowAgreement(false)}
              >
                Back
              </Button>
              <Button
                type="submit"
                className="bg-[#e87722] text-white w-1/2 rounded-full"
                disabled={isLoading}
              >
                {isLoading ? 'Processing...' : 'Complete Signup'}
              </Button>
            </div>
          </form>
        </Form>
      )}
    </div>
  );
}
