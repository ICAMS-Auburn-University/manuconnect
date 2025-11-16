import type {
  AssemblyWithParts,
  PartSpecificationContent,
  PartSpecificationRecord,
} from '@/domain/manufacturing/types';

export type AssemblyClientModel = AssemblyWithParts;

export type PartSpecificationState = Record<string, PartSpecificationRecord>;

export type SpecificationDraft = PartSpecificationContent;
