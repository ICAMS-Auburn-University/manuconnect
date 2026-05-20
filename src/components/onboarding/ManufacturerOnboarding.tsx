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
import { completeManufacturerOnboarding } from '@/domain/auth/service';
import { isNextRedirectError } from '@/lib/utils/errors';
import { manufacturerOnboardingSchema } from '@/domain/auth/zod';
import type { ManufacturerOnboardingFormValues } from '@/domain/auth/types';
import ManufacturerCapabilitiesStep from '@/components/onboarding/ManufacturerCapabilitiesStep';

export default function ManufacturerOnboarding() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [step, setStep] = useState<'company' | 'capabilities' | 'agreement'>(
    'company'
  );
  const router = useRouter();

  const form = useForm<ManufacturerOnboardingFormValues>({
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
      capabilities: {
        processes: [],
        materialCategories: [],
        certifications: [],
      },
      agreementAccepted: false,
    },
  });

  const onSubmit = async (values: ManufacturerOnboardingFormValues) => {
    setIsLoading(true);
    setError(null);

    try {
      await completeManufacturerOnboarding({
        companyName: values.companyName,
        companyType: values.companyType,
        stateOfFormation: values.stateOfFormation,
        companyAddress: values.companyAddress,
        representativeRole: values.representativeRole,
        capabilities: values.capabilities,
        agreementAccepted: values.agreementAccepted,
      });

      // The service handles the redirect, but we'll never get here
      // This is just a fallback
      router.push('/');
    } catch (err: unknown) {
      if (isNextRedirectError(err)) {
        throw err;
      }
      const message =
        err instanceof Error ? err.message : 'Failed to complete onboarding';
      console.error('Error completing onboarding:', err);
      setError(message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleNextStep = async () => {
    if (step === 'company') {
      await form.trigger([
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
        setStep('capabilities');
        window.scrollTo(0, 0);
      }
    } else if (step === 'capabilities') {
      await form.trigger(['capabilities']);
      const isCapabilitiesValid =
        !form.getFieldState('capabilities').invalid;

      if (isCapabilitiesValid) {
        setStep('agreement');
        window.scrollTo(0, 0);
      }
    }
  };

  const handleBack = () => {
    if (step === 'capabilities') {
      setStep('company');
    } else if (step === 'agreement') {
      setStep('capabilities');
    }
    window.scrollTo(0, 0);
  };

  const stepTitles = {
    company: 'Complete Your Profile',
    capabilities: 'Manufacturing Capabilities',
    agreement: 'Manufacturer Agreement',
  };

  const stepDescriptions = {
    company: 'Please provide your company information to complete your profile.',
    capabilities:
      'Tell us about your manufacturing capabilities so we can match you with the right orders.',
    agreement:
      'Please review and accept our manufacturer agreement to continue.',
  };

  return (
    <div className="space-y-8">
      {/* Step Indicator */}
      <div className="flex items-center justify-center gap-2 text-sm">
        {(['company', 'capabilities', 'agreement'] as const).map(
          (s, index) => (
            <div key={s} className="flex items-center gap-2">
              <div
                className={`flex items-center justify-center w-8 h-8 rounded-full text-sm font-medium ${
                  step === s
                    ? 'bg-[#e87722] text-white'
                    : ['company', 'capabilities', 'agreement'].indexOf(step) >
                        index
                      ? 'bg-green-500 text-white'
                      : 'bg-gray-200 text-gray-500'
                }`}
              >
                {['company', 'capabilities', 'agreement'].indexOf(step) >
                index
                  ? '✓'
                  : index + 1}
              </div>
              {index < 2 && (
                <div
                  className={`w-12 h-0.5 ${
                    ['company', 'capabilities', 'agreement'].indexOf(step) >
                    index
                      ? 'bg-green-500'
                      : 'bg-gray-200'
                  }`}
                />
              )}
            </div>
          )
        )}
      </div>

      <div className="text-center">
        <h1 className="text-3xl font-bold text-[#0c2340] mb-2">
          {stepTitles[step]}
        </h1>
        <p className="text-gray-600">{stepDescriptions[step]}</p>
      </div>

      {step === 'company' ? (
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
              Next: Manufacturing Capabilities
            </Button>
          </form>
        </Form>
      ) : step === 'capabilities' ? (
        <Form {...form}>
          <form className="space-y-6">
            <ManufacturerCapabilitiesStep
              processes={form.watch('capabilities.processes')}
              materialCategories={form.watch(
                'capabilities.materialCategories'
              )}
              certifications={form.watch('capabilities.certifications')}
              onProcessesChange={(val) =>
                form.setValue('capabilities.processes', val, {
                  shouldValidate: true,
                })
              }
              onMaterialCategoriesChange={(val) =>
                form.setValue('capabilities.materialCategories', val, {
                  shouldValidate: true,
                })
              }
              onCertificationsChange={(val) =>
                form.setValue('capabilities.certifications', val, {
                  shouldValidate: true,
                })
              }
              errors={{
                processes:
                  form.formState.errors.capabilities?.processes?.message,
                materialCategories:
                  form.formState.errors.capabilities?.materialCategories
                    ?.message,
              }}
            />

            <div className="flex gap-4">
              <Button
                type="button"
                className="bg-gray-200 text-gray-800 w-1/2 rounded-full"
                onClick={handleBack}
              >
                Back
              </Button>
              <Button
                type="button"
                className="bg-[#e87722] text-white w-1/2 rounded-full"
                onClick={handleNextStep}
              >
                Next: Review Agreement
              </Button>
            </div>
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
                onClick={handleBack}
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
