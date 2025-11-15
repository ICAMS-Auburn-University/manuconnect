'use client';

import { useEffect, useMemo, useState } from 'react';
import { toast } from 'sonner';

import type { PartSummary } from '@/domain/cad/types';
import type { SpecificationDraft } from './types';
import { SPECIFICATIONS } from '@/lib/specifications';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

const WIZARD_STEPS = [
  'Material',
  'Process',
  'Tolerances',
  'Surface Finish',
  'Heat Treatment',
  'Secondary Ops',
  'Inspection',
  'Compliance',
  'Part Marking',
] as const;

type WizardStepIndex = 0 | 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8;

const defaultDraft = (): SpecificationDraft => ({
  material: {
    category: '',
    material: '',
    grade: '',
    certificationRequired: false,
  },
  process: {
    type: 'Machined',
    operations: [],
  },
  tolerances: {
    general: SPECIFICATIONS.TOLERANCES.general[1] ?? '',
    criticalDimensions: [],
    gdandt: [],
  },
  surfaceFinish: {
    roughness: SPECIFICATIONS.SURFACE_ROUGHNESS[2] ?? '',
    coatings: [],
  },
  heatTreatment: {
    required: false,
  },
  secondaryOps: {
    edgeBreak: SPECIFICATIONS.EDGE_BREAK[0] ?? null,
    weldingNotes: '',
  },
  inspection: {
    methods: [],
    standards: [],
  },
  compliance: {
    regulatory: [],
    documentation: [],
  },
  marking: {
    required: false,
    method: undefined,
    content: [],
  },
});

interface SpecificationWizardProps {
  open: boolean;
  part: PartSummary | null;
  quantity: number;
  defaultValue?: SpecificationDraft | null;
  onClose: () => void;
  onSubmit: (
    payload: SpecificationDraft & { quantity: number }
  ) => Promise<void>;
}

export function SpecificationWizard({
  open,
  part,
  quantity,
  defaultValue,
  onClose,
  onSubmit,
}: SpecificationWizardProps) {
  const [step, setStep] = useState<WizardStepIndex>(0);
  const [formState, setFormState] = useState<SpecificationDraft>(
    () => defaultValue ?? defaultDraft()
  );
  const [qty, setQty] = useState(quantity);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const materialCategories = useMemo(
    () => Object.keys(SPECIFICATIONS.MATERIALS),
    []
  );

  const selectedMaterials =
    SPECIFICATIONS.MATERIALS[formState.material.category] ?? [];

  const processTypes = useMemo(
    () => Object.keys(SPECIFICATIONS.PROCESS_TYPES ?? {}),
    []
  );

  const heatTreatmentOptions = useMemo(() => {
    const steel = SPECIFICATIONS.HEAT_TREATMENTS?.steel ?? [];
    const aluminum = SPECIFICATIONS.HEAT_TREATMENTS?.aluminum ?? [];
    return [...steel, ...aluminum];
  }, []);

  useEffect(() => {
    setFormState(defaultValue ?? defaultDraft());
    setQty(quantity);
    setStep(0);
  }, [defaultValue, quantity, part?.storagePath]);

  const handleToggle = (
    list: string[],
    value: string,
    checked: boolean
  ): string[] => {
    if (checked) {
      return Array.from(new Set([...list, value]));
    }
    return list.filter((item) => item !== value);
  };

  const renderStep = () => {
    switch (step) {
      case 0:
        return (
          <div className="space-y-4">
            <div>
              <Label>Quantity required</Label>
              <Input
                type="number"
                min={1}
                value={qty}
                onChange={(event) => setQty(Number(event.target.value) || 1)}
              />
            </div>
            <div className="space-y-2">
              <Label>Material category</Label>
              <Select
                value={formState.material.category}
                onValueChange={(value) =>
                  setFormState((prev) => ({
                    ...prev,
                    material: {
                      ...prev.material,
                      category: value,
                      material: '',
                    },
                  }))
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select a category" />
                </SelectTrigger>
                <SelectContent>
                  {materialCategories.map((category) => (
                    <SelectItem key={category} value={category}>
                      {category}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Material</Label>
              <Select
                value={formState.material.material}
                onValueChange={(value) =>
                  setFormState((prev) => ({
                    ...prev,
                    material: { ...prev.material, material: value },
                  }))
                }
                disabled={!formState.material.category}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Pick a material" />
                </SelectTrigger>
                <SelectContent>
                  {selectedMaterials.map((material) => (
                    <SelectItem key={material} value={material}>
                      {material}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Grade (optional)</Label>
              <Input
                value={formState.material.grade}
                onChange={(event) =>
                  setFormState((prev) => ({
                    ...prev,
                    material: { ...prev.material, grade: event.target.value },
                  }))
                }
              />
            </div>
            <div className="flex items-center gap-2">
              <Checkbox
                checked={formState.material.certificationRequired}
                onCheckedChange={(checked) =>
                  setFormState((prev) => ({
                    ...prev,
                    material: {
                      ...prev.material,
                      certificationRequired: Boolean(checked),
                    },
                  }))
                }
              />
              <Label>Certification required (MTR/CoC)</Label>
            </div>
          </div>
        );
      case 1:
        return (
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Primary process</Label>
              <Select
                value={formState.process.type}
                onValueChange={(value) =>
                  setFormState((prev) => ({
                    ...prev,
                    process: { ...prev.process, type: value },
                  }))
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select process" />
                </SelectTrigger>
                <SelectContent>
                  {processTypes.map((type) => (
                    <SelectItem key={type} value={type}>
                      {type}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            {formState.process.type === 'Machined' && (
              <div className="space-y-2">
                <Label>Machining operations</Label>
                <div className="grid gap-2 md:grid-cols-2">
                  {SPECIFICATIONS.MACHINING_OPERATIONS.map((operation) => (
                    <label
                      key={operation}
                      className="flex items-center gap-2 rounded border border-muted-foreground/40 px-3 py-2 text-sm"
                    >
                      <Checkbox
                        checked={formState.process.operations.includes(
                          operation
                        )}
                        onCheckedChange={(checked) =>
                          setFormState((prev) => ({
                            ...prev,
                            process: {
                              ...prev.process,
                              operations: handleToggle(
                                prev.process.operations,
                                operation,
                                Boolean(checked)
                              ),
                            },
                          }))
                        }
                      />
                      <span>{operation}</span>
                    </label>
                  ))}
                </div>
              </div>
            )}
          </div>
        );
      case 2:
        return (
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>General tolerance</Label>
              <Select
                value={formState.tolerances.general}
                onValueChange={(value) =>
                  setFormState((prev) => ({
                    ...prev,
                    tolerances: { ...prev.tolerances, general: value },
                  }))
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select tolerance" />
                </SelectTrigger>
                <SelectContent>
                  {SPECIFICATIONS.TOLERANCES.general.map((option) => (
                    <SelectItem key={option} value={option}>
                      {option}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Critical dimensions (one per line)</Label>
              <Textarea
                rows={4}
                value={formState.tolerances.criticalDimensions.join('\n')}
                onChange={(event) =>
                  setFormState((prev) => ({
                    ...prev,
                    tolerances: {
                      ...prev.tolerances,
                      criticalDimensions: event.target.value
                        .split('\n')
                        .map((line) => line.trim())
                        .filter(Boolean),
                    },
                  }))
                }
              />
            </div>
            <div>
              <Label>GD&T controls (one per line)</Label>
              <Textarea
                rows={3}
                value={formState.tolerances.gdandt.join('\n')}
                onChange={(event) =>
                  setFormState((prev) => ({
                    ...prev,
                    tolerances: {
                      ...prev.tolerances,
                      gdandt: event.target.value
                        .split('\n')
                        .map((line) => line.trim())
                        .filter(Boolean),
                    },
                  }))
                }
              />
            </div>
          </div>
        );
      case 3:
        return (
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Surface roughness (Ra)</Label>
              <Select
                value={formState.surfaceFinish.roughness}
                onValueChange={(value) =>
                  setFormState((prev) => ({
                    ...prev,
                    surfaceFinish: { ...prev.surfaceFinish, roughness: value },
                  }))
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select roughness" />
                </SelectTrigger>
                <SelectContent>
                  {SPECIFICATIONS.SURFACE_ROUGHNESS.map((option) => (
                    <SelectItem key={option} value={option}>
                      {option}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Coatings / treatments</Label>
              <div className="grid gap-2 md:grid-cols-2">
                {SPECIFICATIONS.COATINGS.map((option) => (
                  <label
                    key={option}
                    className="flex items-center gap-2 rounded border border-muted-foreground/40 px-3 py-2 text-sm"
                  >
                    <Checkbox
                      checked={formState.surfaceFinish.coatings.includes(
                        option
                      )}
                      onCheckedChange={(checked) =>
                        setFormState((prev) => ({
                          ...prev,
                          surfaceFinish: {
                            ...prev.surfaceFinish,
                            coatings: handleToggle(
                              prev.surfaceFinish.coatings,
                              option,
                              Boolean(checked)
                            ),
                          },
                        }))
                      }
                    />
                    {option}
                  </label>
                ))}
              </div>
            </div>
          </div>
        );
      case 4:
        return (
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <Checkbox
                checked={formState.heatTreatment.required}
                onCheckedChange={(checked) =>
                  setFormState((prev) => ({
                    ...prev,
                    heatTreatment: {
                      ...prev.heatTreatment,
                      required: Boolean(checked),
                    },
                  }))
                }
              />
              <Label>Heat treatment required</Label>
            </div>
            {formState.heatTreatment.required && (
              <>
                <div className="space-y-2">
                  <Label>Heat treatment type</Label>
                  <Select
                    value={formState.heatTreatment.type}
                    onValueChange={(value) =>
                      setFormState((prev) => ({
                        ...prev,
                        heatTreatment: { ...prev.heatTreatment, type: value },
                      }))
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select type" />
                    </SelectTrigger>
                    <SelectContent>
                      {heatTreatmentOptions.map((option) => (
                        <SelectItem key={option} value={option}>
                          {option}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Hardness target (optional)</Label>
                  <Input
                    value={formState.heatTreatment.hardness ?? ''}
                    onChange={(event) =>
                      setFormState((prev) => ({
                        ...prev,
                        heatTreatment: {
                          ...prev.heatTreatment,
                          hardness: event.target.value,
                        },
                      }))
                    }
                  />
                </div>
              </>
            )}
          </div>
        );
      case 5:
        return (
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Edge break / deburring</Label>
              <Select
                value={formState.secondaryOps.edgeBreak ?? undefined}
                onValueChange={(value) =>
                  setFormState((prev) => ({
                    ...prev,
                    secondaryOps: { ...prev.secondaryOps, edgeBreak: value },
                  }))
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select option" />
                </SelectTrigger>
                <SelectContent>
                  {SPECIFICATIONS.EDGE_BREAK.map((option) => (
                    <SelectItem key={option} value={option}>
                      {option}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Welding / secondary notes</Label>
              <Textarea
                rows={4}
                value={formState.secondaryOps.weldingNotes ?? ''}
                onChange={(event) =>
                  setFormState((prev) => ({
                    ...prev,
                    secondaryOps: {
                      ...prev.secondaryOps,
                      weldingNotes: event.target.value,
                    },
                  }))
                }
              />
            </div>
          </div>
        );
      case 6:
        return (
          <div className="space-y-4">
            <div>
              <Label>Inspection methods</Label>
              <div className="grid gap-2 md:grid-cols-2">
                {SPECIFICATIONS.INSPECTION_METHODS.map((method) => (
                  <label
                    key={method}
                    className="flex items-center gap-2 rounded border border-muted-foreground/40 px-3 py-2 text-sm"
                  >
                    <Checkbox
                      checked={formState.inspection.methods.includes(method)}
                      onCheckedChange={(checked) =>
                        setFormState((prev) => ({
                          ...prev,
                          inspection: {
                            ...prev.inspection,
                            methods: handleToggle(
                              prev.inspection.methods,
                              method,
                              Boolean(checked)
                            ),
                          },
                        }))
                      }
                    />
                    {method}
                  </label>
                ))}
              </div>
            </div>
            <div>
              <Label>Quality standards</Label>
              <div className="grid gap-2 md:grid-cols-2">
                {SPECIFICATIONS.QUALITY_STANDARDS.map((standard) => (
                  <label
                    key={standard}
                    className="flex items-center gap-2 rounded border border-muted-foreground/40 px-3 py-2 text-sm"
                  >
                    <Checkbox
                      checked={formState.inspection.standards.includes(
                        standard
                      )}
                      onCheckedChange={(checked) =>
                        setFormState((prev) => ({
                          ...prev,
                          inspection: {
                            ...prev.inspection,
                            standards: handleToggle(
                              prev.inspection.standards,
                              standard,
                              Boolean(checked)
                            ),
                          },
                        }))
                      }
                    />
                    {standard}
                  </label>
                ))}
              </div>
            </div>
          </div>
        );
      case 7:
        return (
          <div className="space-y-4">
            <div>
              <Label>Regulatory compliance</Label>
              <div className="grid gap-2 md:grid-cols-2">
                {SPECIFICATIONS.COMPLIANCE.map((item) => (
                  <label
                    key={item}
                    className="flex items-center gap-2 rounded border border-muted-foreground/40 px-3 py-2 text-sm"
                  >
                    <Checkbox
                      checked={formState.compliance.regulatory.includes(item)}
                      onCheckedChange={(checked) =>
                        setFormState((prev) => ({
                          ...prev,
                          compliance: {
                            ...prev.compliance,
                            regulatory: handleToggle(
                              prev.compliance.regulatory,
                              item,
                              Boolean(checked)
                            ),
                          },
                        }))
                      }
                    />
                    {item}
                  </label>
                ))}
              </div>
            </div>
            <div>
              <Label>Documentation</Label>
              <div className="grid gap-2 md:grid-cols-2">
                {SPECIFICATIONS.DOCUMENTATION.map((doc) => (
                  <label
                    key={doc}
                    className="flex items-center gap-2 rounded border border-muted-foreground/40 px-3 py-2 text-sm"
                  >
                    <Checkbox
                      checked={formState.compliance.documentation.includes(doc)}
                      onCheckedChange={(checked) =>
                        setFormState((prev) => ({
                          ...prev,
                          compliance: {
                            ...prev.compliance,
                            documentation: handleToggle(
                              prev.compliance.documentation,
                              doc,
                              Boolean(checked)
                            ),
                          },
                        }))
                      }
                    />
                    {doc}
                  </label>
                ))}
              </div>
            </div>
          </div>
        );
      case 8:
        return (
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <Checkbox
                checked={formState.marking.required}
                onCheckedChange={(checked) =>
                  setFormState((prev) => ({
                    ...prev,
                    marking: {
                      ...prev.marking,
                      required: Boolean(checked),
                    },
                  }))
                }
              />
              <Label>Marking required</Label>
            </div>
            {formState.marking.required && (
              <>
                <div className="space-y-2">
                  <Label>Marking method</Label>
                  <Select
                    value={formState.marking.method}
                    onValueChange={(value) =>
                      setFormState((prev) => ({
                        ...prev,
                        marking: { ...prev.marking, method: value },
                      }))
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select method" />
                    </SelectTrigger>
                    <SelectContent>
                      {SPECIFICATIONS.MARKING_METHODS.map((method) => (
                        <SelectItem key={method} value={method}>
                          {method}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Marking content</Label>
                  <div className="grid gap-2 md:grid-cols-2">
                    {SPECIFICATIONS.MARKING_CONTENT.map((content) => (
                      <label
                        key={content}
                        className="flex items-center gap-2 rounded border border-muted-foreground/40 px-3 py-2 text-sm"
                      >
                        <Checkbox
                          checked={formState.marking.content.includes(content)}
                          onCheckedChange={(checked) =>
                            setFormState((prev) => ({
                              ...prev,
                              marking: {
                                ...prev.marking,
                                content: handleToggle(
                                  prev.marking.content,
                                  content,
                                  Boolean(checked)
                                ),
                              },
                            }))
                          }
                        />
                        {content}
                      </label>
                    ))}
                  </div>
                </div>
              </>
            )}
          </div>
        );
      default:
        return null;
    }
  };

  const handleNext = () => {
    setStep(
      (prev) => Math.min(prev + 1, WIZARD_STEPS.length - 1) as WizardStepIndex
    );
  };

  const handleBack = () => {
    if (step === 0) {
      onClose();
      return;
    }
    setStep((prev) => Math.max(prev - 1, 0) as WizardStepIndex);
  };

  const handleSubmit = async () => {
    if (!part) {
      toast.error('Select a part before saving specifications.');
      return;
    }

    setIsSubmitting(true);
    try {
      await onSubmit({ ...formState, quantity: qty });
      setIsSubmitting(false);
      onClose();
      toast.success('Specifications saved.');
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : 'Failed to save specifications';
      toast.error(message);
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog
      open={open}
      onOpenChange={(nextOpen) => {
        if (!nextOpen) {
          setStep(0);
          onClose();
        }
      }}
    >
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>
            Configure specifications{part ? ` for ${part.name}` : ''}
          </DialogTitle>
          <DialogDescription>
            Step {step + 1} of {WIZARD_STEPS.length}: {WIZARD_STEPS[step]}
          </DialogDescription>
        </DialogHeader>

        {renderStep()}

        <DialogFooter className="flex flex-col gap-2 sm:flex-row sm:justify-between">
          <Button type="button" variant="ghost" onClick={handleBack}>
            {step === 0 ? 'Cancel' : 'Back'}
          </Button>
          {step === WIZARD_STEPS.length - 1 ? (
            <Button
              type="button"
              onClick={handleSubmit}
              disabled={isSubmitting}
            >
              {isSubmitting ? 'Saving…' : 'Save specifications'}
            </Button>
          ) : (
            <Button type="button" onClick={handleNext}>
              Next
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
