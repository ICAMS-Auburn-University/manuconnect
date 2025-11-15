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
import { AssemblySelectionStep } from './AssemblySelectionStep';
import { BuildOrderStep } from './BuildOrderStep';
import { SpecificationsOverviewStep } from './SpecificationsOverviewStep';
import { PartSpecificationsStep } from './PartSpecificationsStep';
import { OrderFormValues, orderFormSchema } from './schema';
import { useSplitAssembly } from '@/hooks/cad/useSplitAssembly';
import type { PartSummary, SplitAssemblyResult } from '@/domain/cad/types';
import { createOrder } from '@/domain/orders/service';
import { createSupabaseBrowserClient } from '@/app/_internal/supabase/browser-client';
import type {
  AssemblyClientModel,
  PartSpecificationState,
  SpecificationDraft,
} from './types';

const STEP_LABELS = [
  'Project Details',
  'Upload & Split',
  'Select Assemblies',
  'Build Order',
  'Specifications Overview',
  'Part Specifications',
  'Shipping',
  'Review & Submit',
] as const;

type StepIndex = 0 | 1 | 2 | 3 | 4 | 5 | 6 | 7;

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
      shippingRecipient: '',
      shippingCompany: '',
      shippingPhone: '',
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
  const [assemblies, setAssemblies] = useState<AssemblyClientModel[]>([]);
  const [assignedPartIds, setAssignedPartIds] = useState<Set<string>>(
    () => new Set()
  );
  const [isCreatingAssembly, setIsCreatingAssembly] = useState(false);
  const [isSavingBuildOrder, setIsSavingBuildOrder] = useState(false);
  const [buildOrderConfirmed, setBuildOrderConfirmed] = useState(false);
  const [activeAssemblyId, setActiveAssemblyId] = useState<string | null>(null);
  const [partSpecifications, setPartSpecifications] =
    useState<PartSpecificationState>({});
  const [isMarkingAssemblyComplete, setIsMarkingAssemblyComplete] =
    useState(false);
  const [isSavingShipping, setIsSavingShipping] = useState(false);
  const [flowError, setFlowError] = useState<string | null>(null);

  const [draftOrderId, setDraftOrderId] = useState(() => crypto.randomUUID());

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

  useEffect(() => {
    if (splitResult && currentStep < 2) {
      setCurrentStep(2);
    }
  }, [splitResult, currentStep]);

  const stepFieldMap = useMemo<Record<StepIndex, (keyof OrderFormValues)[]>>(
    () => ({
      0: ['title', 'description', 'quantity', 'dueDate', 'tags'],
      1: ['cadFile'],
      2: [],
      3: [],
      4: [],
      5: [],
      6: [
        'shippingAddress1',
        'shippingAddress2',
        'shippingCity',
        'shippingState',
        'shippingZip',
        'shippingCountry',
      ],
      7: [],
    }),
    []
  );

  const availableParts = splitResult?.parts ?? [];

  const activeAssembly = useMemo(
    () =>
      assemblies.find((assembly) => assembly.id === activeAssemblyId) ?? null,
    [assemblies, activeAssemblyId]
  );

  const assembliesComplete =
    assemblies.length > 0 &&
    assemblies.every((assembly) => assembly.specifications_completed);

  const saveShippingDetails = useCallback(async () => {
    setIsSavingShipping(true);
    try {
      const values = form.getValues();
      const companyName =
        values.shippingCompany && values.shippingCompany.trim().length > 0
          ? values.shippingCompany.trim()
          : null;
      const response = await fetch(`/api/orders/${draftOrderId}/shipping`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          recipientName:
            values.shippingRecipient || values.title || 'Project Owner',
          companyName,
          street1: values.shippingAddress1,
          street2: values.shippingAddress2,
          city: values.shippingCity,
          state: values.shippingState,
          postalCode: values.shippingZip,
          country: values.shippingCountry,
          phoneNumber: values.shippingPhone?.trim() || 'N/A',
        }),
      });

      if (!response.ok) {
        const payload = (await response.json().catch(() => ({}))) as {
          error?: string;
        };
        setFlowError(payload.error ?? 'Failed to save shipping address.');
        return false;
      }

      return true;
    } catch (error) {
      const message =
        error instanceof Error ? error.message : 'Failed to save shipping.';
      setFlowError(message);
      return false;
    } finally {
      setIsSavingShipping(false);
    }
  }, [draftOrderId, form]);

  const goToStep = useCallback(
    async (nextStep: StepIndex) => {
      if (nextStep === currentStep) return;

      if (nextStep > currentStep) {
        const fields = stepFieldMap[currentStep];
        if (fields.length > 0) {
          const isValid = await form.trigger(fields);
          if (!isValid) {
            return;
          }
        }

        if (currentStep === 1 && !splitResult) {
          setSplitErrorMessage(
            'Process the assembly before moving on to the next step.'
          );
          return;
        }

        if (currentStep === 2 && assemblies.length === 0) {
          setFlowError('Create at least one assembly to continue.');
          return;
        }

        if (currentStep === 3 && !buildOrderConfirmed) {
          setFlowError('Confirm and save your build order first.');
          return;
        }

        if (currentStep === 4 && !assembliesComplete) {
          setFlowError('Complete specifications for every assembly first.');
          return;
        }

        if (currentStep === 6) {
          const saved = await saveShippingDetails();
          if (!saved) {
            return;
          }
        }
      }

      setFlowError(null);
      setCurrentStep(nextStep);
    },
    [
      currentStep,
      stepFieldMap,
      form,
      splitResult,
      assemblies.length,
      buildOrderConfirmed,
      assembliesComplete,
      saveShippingDetails,
    ]
  );

  const handleNext = useCallback(async () => {
    if (currentStep === STEP_LABELS.length - 1) {
      return;
    }

    let nextStep: StepIndex;
    if (currentStep === 4) {
      nextStep = 6;
    } else {
      nextStep = (currentStep + 1) as StepIndex;
    }

    await goToStep(nextStep);
  }, [currentStep, goToStep]);

  const handleBack = useCallback(() => {
    if (currentStep === 0) {
      return;
    }

    if (currentStep === 5) {
      setCurrentStep(4);
      return;
    }

    if (currentStep === 6) {
      setCurrentStep(4);
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
      setFlowError(null);
      setSplitErrorMessage('Splitting file into parts...');
      setAssemblies([]);
      setAssignedPartIds(() => new Set());
      setPartSpecifications({});
      setActiveAssemblyId(null);
      setBuildOrderConfirmed(false);
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

  const handleFileSelected = useCallback(
    (file: File | null) => {
      setSplitResult(null);
      setAssemblies([]);
      setAssignedPartIds(() => new Set());
      setPartSpecifications({});
      setActiveAssemblyId(null);
      setBuildOrderConfirmed(false);
      if (!file) {
        setSplitErrorMessage(null);
        return;
      }
      void handleProcessCad();
    },
    [handleProcessCad]
  );

  const handleCreateAssembly = useCallback(
    async ({ name, partIds }: { name: string; partIds: string[] }) => {
      if (!splitResult) {
        toast.error('Process your CAD assembly before creating groups.');
        return;
      }
      setIsCreatingAssembly(true);
      try {
        const response = await fetch(`/api/orders/${draftOrderId}/assemblies`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ name, partIds }),
        });

        if (!response.ok) {
          const payload = (await response.json().catch(() => ({}))) as {
            error?: string;
          };
          throw new Error(payload.error ?? 'Failed to create assembly');
        }

        const payload = (await response.json()) as {
          assembly: AssemblyClientModel;
        };
        setAssemblies((prev) => [...prev, payload.assembly]);
        setAssignedPartIds((prev) => {
          const next = new Set(prev);
          partIds.forEach((id) => next.add(id));
          return next;
        });
        setBuildOrderConfirmed(false);
      } catch (error) {
        const message =
          error instanceof Error ? error.message : 'Failed to create assembly';
        toast.error(message);
        throw error;
      } finally {
        setIsCreatingAssembly(false);
      }
    },
    [draftOrderId, splitResult]
  );

  const handleConfirmBuildOrder = useCallback(
    async (assemblyIds: string[]) => {
      setIsSavingBuildOrder(true);
      try {
        const response = await fetch(
          `/api/orders/${draftOrderId}/assemblies/build-order`,
          {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({ assemblyOrder: assemblyIds }),
          }
        );

        if (!response.ok) {
          const payload = (await response.json().catch(() => ({}))) as {
            error?: string;
          };
          throw new Error(payload.error ?? 'Failed to update build order');
        }

        setAssemblies((prev) =>
          prev.map((assembly) => {
            const index = assemblyIds.indexOf(assembly.id);
            return index === -1
              ? assembly
              : { ...assembly, build_order: index + 1 };
          })
        );
        setBuildOrderConfirmed(true);
      } catch (error) {
        const message =
          error instanceof Error ? error.message : 'Failed to save build order';
        toast.error(message);
        throw error;
      } finally {
        setIsSavingBuildOrder(false);
      }
    },
    [draftOrderId]
  );

  const handleSelectAssembly = useCallback((assemblyId: string) => {
    setActiveAssemblyId(assemblyId);
    setCurrentStep(5);
  }, []);

  const handleSavePartSpecification = useCallback(
    async (
      assemblyId: string,
      partId: string,
      specifications: SpecificationDraft,
      quantity: number
    ) => {
      const response = await fetch(
        `/api/assemblies/${assemblyId}/specifications`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            orderId: draftOrderId,
            partId,
            quantity,
            specifications,
          }),
        }
      );

      if (!response.ok) {
        const payload = (await response.json().catch(() => ({}))) as {
          error?: string;
        };
        throw new Error(payload.error ?? 'Failed to save specifications');
      }

      const { specification } = (await response.json()) as {
        specification: PartSpecificationState[string];
      };

      setPartSpecifications((prev) => ({
        ...prev,
        [partId]: specification,
      }));
    },
    [draftOrderId]
  );

  const handleMarkAssemblyComplete = useCallback(async (assemblyId: string) => {
    setIsMarkingAssemblyComplete(true);
    try {
      const response = await fetch(`/api/assemblies/${assemblyId}/status`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ completed: true }),
      });

      if (!response.ok) {
        const payload = (await response.json().catch(() => ({}))) as {
          error?: string;
        };
        throw new Error(payload.error ?? 'Failed to update assembly');
      }

      const { assembly } = (await response.json()) as {
        assembly: AssemblyClientModel;
      };
      setAssemblies((prev) =>
        prev.map((item) => (item.id === assembly.id ? assembly : item))
      );
      setActiveAssemblyId(null);
      setCurrentStep(4);
      toast.success('Assembly marked complete.');
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : 'Failed to update assembly status';
      toast.error(message);
    } finally {
      setIsMarkingAssemblyComplete(false);
    }
  }, []);

  const onSubmit = useCallback(
    async (values: OrderFormValues) => {
      if (!splitResult) {
        setSplitErrorMessage(
          'Process the CAD assembly before submitting your order.'
        );
        setCurrentStep(1);
        return;
      }

      if (!assembliesComplete) {
        setFlowError(
          'Complete specifications for all assemblies before submitting.'
        );
        setCurrentStep(4);
        return;
      }

      setIsSubmitting(true);
      setErrorMessage(null);

      try {
        const dueDate = new Date(values.dueDate);

        const { error } = await createOrder({
          orderId: draftOrderId,
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
        setAssemblies([]);
        setAssignedPartIds(() => new Set());
        setPartSpecifications({});
        setActiveAssemblyId(null);
        setBuildOrderConfirmed(false);
        setFlowError(null);
        setDraftOrderId(crypto.randomUUID());
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
    [assembliesComplete, draftOrderId, form, splitResult]
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
            {currentStep === 2 && (
              <AssemblySelectionStep
                parts={availableParts}
                assemblies={assemblies}
                assignedPartIds={assignedPartIds}
                onCreateAssembly={handleCreateAssembly}
                isSaving={isCreatingAssembly}
              />
            )}
            {currentStep === 3 && (
              <BuildOrderStep
                assemblies={assemblies}
                onConfirmOrder={handleConfirmBuildOrder}
                isSaving={isSavingBuildOrder}
              />
            )}
            {currentStep === 4 && (
              <SpecificationsOverviewStep
                assemblies={assemblies}
                onSelectAssembly={handleSelectAssembly}
                disableContinue={!assembliesComplete}
                onContinue={() => goToStep(6)}
              />
            )}
            {currentStep === 5 && (
              <PartSpecificationsStep
                assembly={activeAssembly}
                parts={availableParts}
                specifications={partSpecifications}
                onSavePartSpecification={(partId, payload, quantity) =>
                  activeAssembly
                    ? handleSavePartSpecification(
                        activeAssembly.id,
                        partId,
                        payload,
                        quantity
                      )
                    : Promise.resolve()
                }
                onMarkAssemblyComplete={() =>
                  activeAssembly
                    ? handleMarkAssemblyComplete(activeAssembly.id)
                    : Promise.resolve()
                }
                onBack={() => {
                  setActiveAssemblyId(null);
                  setCurrentStep(4);
                }}
                isMarkingComplete={isMarkingAssemblyComplete}
              />
            )}
            {currentStep === 6 && <ShippingStep isSaving={isSavingShipping} />}
            {currentStep === 7 && (
              <ReviewStep cadResult={splitResult} assemblies={assemblies} />
            )}

            {errorMessage && (
              <p className="text-sm text-red-600">*{errorMessage}</p>
            )}
            {flowError && <p className="text-sm text-red-600">*{flowError}</p>}

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
                {currentStep < STEP_LABELS.length - 1 &&
                  currentStep !== 4 &&
                  currentStep !== 5 && (
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
