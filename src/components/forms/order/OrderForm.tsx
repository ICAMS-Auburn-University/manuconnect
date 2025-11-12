// Multi-step order creation flow with CAD processing integration.
'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import Image from 'next/image';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { zodResolver } from '@hookform/resolvers/zod';
import { FormProvider, useForm } from 'react-hook-form';
import { toast } from 'sonner';

import { Button } from '@/components/ui/button';
import { Form } from '@/components/ui/form';
import { OrderStepIndicator } from './OrderStepIndicator';
import { OrderDetailsStep } from './OrderDetailsStep';
import { CadProcessingStep } from './CadProcessingStep';
import { ShippingStep } from './ShippingStep';
import { ReviewStep } from './ReviewStep';
import { OrderFormValues, orderFormSchema } from './schema';
import { useSplitAssembly } from '@/hooks/cad/useSplitAssembly';
import { SplitAssemblyResult } from '@/domain/cad/types';
import { createOrder } from '@/domain/orders/service';
import { createSupabaseBrowserClient } from '@/app/_internal/supabase/browser-client';

const STEP_LABELS = [
  'Order Details',
  'CAD Processing',
  'Shipping',
  'Review & Timeline',
] as const;

type StepIndex = 0 | 1 | 2 | 3;

const initialDueDate = () => {
  const date = new Date();
  date.setDate(date.getDate() + 7);
  return date.toISOString().split('T')[0];
};

export function OrderForm() {
  const form = useForm<OrderFormValues>({
    resolver: zodResolver(orderFormSchema),
    defaultValues: {
      title: '',
      description: '',
      quantity: 1,
      dueDate: initialDueDate(),
      tags: [],
      cadFile: null,
      shippingAddress1: '',
      shippingAddress2: '',
      shippingCity: '',
      shippingState: '',
      shippingZip: '',
      shippingCountry: 'us',
    },
  });

  const [currentStep, setCurrentStep] = useState<StepIndex>(0);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [splitResult, setSplitResult] = useState<SplitAssemblyResult | null>(
    null
  );
  const [splitErrorMessage, setSplitErrorMessage] = useState<string | null>(
    null
  );
  const [userId, setUserId] = useState<string | null>(null);

  const draftOrderId = useMemo(() => crypto.randomUUID(), []);

  const {
    splitAssembly,
    data: cadData,
    error: cadError,
    isLoading: isProcessingCad,
  } = useSplitAssembly();

  useEffect(() => {
    let isMounted = true;

    async function loadUser() {
      try {
        const client = await createSupabaseBrowserClient();
        const { data } = await client.auth.getUser();
        if (isMounted) {
          setUserId(data.user?.id ?? null);
        }
      } catch (error) {
        console.error('Failed to load user for CAD processing.', error);
        if (isMounted) {
          setUserId(null);
        }
      }
    }

    loadUser();

    return () => {
      isMounted = false;
    };
  }, []);

  useEffect(() => {
    if (cadData) {
      setSplitResult(cadData);
      setSplitErrorMessage(null);
    }
  }, [cadData]);

  useEffect(() => {
    if (cadError) {
      setSplitErrorMessage(cadError.message);
    }
  }, [cadError]);

  const stepFieldMap = useMemo<Record<StepIndex, (keyof OrderFormValues)[]>>(
    () => ({
      0: ['title', 'description', 'quantity', 'dueDate', 'tags'],
      1: ['cadFile'],
      2: [
        'shippingAddress1',
        'shippingAddress2',
        'shippingCity',
        'shippingState',
        'shippingZip',
        'shippingCountry',
      ],
      3: [],
    }),
    []
  );

  const handleFileSelected = useCallback((file: File | null) => {
    setSplitResult(null);
    if (!file) {
      setSplitErrorMessage(null);
    } else {
      setSplitErrorMessage('Process the new assembly file to continue.');
    }
  }, []);

  const goToStep = useCallback(
    async (nextStep: StepIndex) => {
      if (nextStep === currentStep) return;

      if (nextStep > currentStep) {
        const fields = stepFieldMap[currentStep];
        const isValid = await form.trigger(fields);

        if (!isValid) {
          return;
        }

        if (currentStep === 1 && !splitResult) {
          setSplitErrorMessage(
            'Process the assembly before moving on to shipping.'
          );
          return;
        }
      }

      setCurrentStep(nextStep);
    },
    [currentStep, form, splitResult, stepFieldMap]
  );

  const handleNext = useCallback(async () => {
    if (currentStep === STEP_LABELS.length - 1) {
      return;
    }

    const nextStep = (currentStep + 1) as StepIndex;
    await goToStep(nextStep);
  }, [currentStep, goToStep]);

  const handleBack = useCallback(() => {
    if (currentStep === 0) {
      return;
    }

    setCurrentStep((currentStep - 1) as StepIndex);
  }, [currentStep]);

  const handleProcessCad = useCallback(async () => {
    setSplitErrorMessage(null);
    const isValid = await form.trigger(['cadFile']);

    if (!isValid) {
      return;
    }

    if (!userId) {
      setSplitErrorMessage(
        'We could not determine your user. Please sign in again and retry.'
      );
      return;
    }

    const file = form.getValues('cadFile');
    if (!(file instanceof File)) {
      setSplitErrorMessage('Please choose a valid CAD file before processing.');
      return;
    }

    try {
      await splitAssembly({
        userId,
        orderId: draftOrderId,
        file,
      });
    } catch (error) {
      setSplitErrorMessage(
        error instanceof Error
          ? error.message
          : 'Failed to process CAD assembly. Please retry.'
      );
    }
  }, [draftOrderId, form, splitAssembly, userId]);

  const onSubmit = useCallback(
    async (values: OrderFormValues) => {
      if (!splitResult) {
        setSplitErrorMessage(
          'Process the CAD assembly before submitting your order.'
        );
        setCurrentStep(1);
        return;
      }

      setIsSubmitting(true);
      setErrorMessage(null);

      try {
        const dueDate = new Date(values.dueDate);

        const { error } = await createOrder({
          title: values.title,
          description: values.description,
          quantity: values.quantity,
          due_date: dueDate,
          file: splitResult.originalPath,
          tags: values.tags,
          shipping_country: values.shippingCountry,
          shipping_address_1: values.shippingAddress1,
          shipping_address_2: values.shippingAddress2,
          shipping_city: values.shippingCity,
          shipping_state: values.shippingState,
          shipping_zip: values.shippingZip,
        });

        if (error) {
          setErrorMessage(`${error}. Please try again.`);
          return;
        }

        toast.success('Order created successfully!');
        form.reset();
        setSplitResult(null);
        setSplitErrorMessage(null);
        setCurrentStep(0);
      } catch (error) {
        console.error('Error creating order:', error);
        const message =
          error instanceof Error
            ? error.message
            : 'An unexpected error occurred';
        setErrorMessage(`${message}. Please try again.`);
      } finally {
        setIsSubmitting(false);
      }
    },
    [form, splitResult]
  );

  const handleSubmit = form.handleSubmit(onSubmit);

  return (
    <FormProvider {...form}>
      <Form {...form}>
        <div className="space-y-8">
          <OrderStepIndicator
            steps={Array.from(STEP_LABELS)}
            currentStep={currentStep}
          />

          <form
            onSubmit={handleSubmit}
            className="space-y-8 rounded border border-gray-200 bg-white p-6"
          >
            {currentStep === 0 && <OrderDetailsStep />}
            {currentStep === 1 && (
              <CadProcessingStep
                splitResult={splitResult}
                onProcessFile={handleProcessCad}
                onFileSelected={handleFileSelected}
                isProcessing={isProcessingCad}
                errorMessage={splitErrorMessage}
              />
            )}
            {currentStep === 2 && <ShippingStep />}
            {currentStep === 3 && <ReviewStep cadResult={splitResult} />}

            {errorMessage && (
              <p className="text-sm text-red-600">*{errorMessage}</p>
            )}

            <div className="flex flex-col gap-3 pt-4 md:flex-row md:items-center md:justify-between">
              <div className="flex items-center gap-3">
                <Button
                  type="button"
                  variant="ghost"
                  onClick={handleBack}
                  disabled={currentStep === 0}
                  className="flex items-center gap-2"
                >
                  <ChevronLeft className="h-4 w-4" />
                  Back
                </Button>
                {currentStep < STEP_LABELS.length - 1 && (
                  <Button
                    type="button"
                    onClick={handleNext}
                    className="flex items-center gap-2"
                  >
                    Next
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                )}
              </div>

              {currentStep === STEP_LABELS.length - 1 && (
                <Button type="submit" disabled={isSubmitting}>
                  {isSubmitting ? (
                    <span className="flex items-center gap-2">
                      Submitting
                      <Image
                        src="/loader.svg"
                        alt="loader"
                        width={20}
                        height={20}
                        className="animate-spin"
                      />
                    </span>
                  ) : (
                    'Submit order'
                  )}
                </Button>
              )}
            </div>
          </form>
        </div>
      </Form>
    </FormProvider>
  );
}
