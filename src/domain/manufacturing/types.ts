import type {
  AssembliesSchema,
  PartSpecificationsSchema,
} from '@/types/schemas';

export interface AssemblyWithParts extends AssembliesSchema {
  partIds: string[];
}

export interface SpecificationMaterial {
  category: string;
  material: string;
  grade?: string;
  certificationRequired: boolean;
}

export interface SpecificationProcess {
  type: string;
  operations: string[];
}

export interface SpecificationTolerances {
  general: string;
  criticalDimensions: string[];
  gdandt: string[];
}

export interface SpecificationSurfaceFinish {
  roughness: string;
  coatings: string[];
}

export interface SpecificationHeatTreatment {
  required: boolean;
  type?: string;
  hardness?: string;
}

export interface SpecificationSecondaryOps {
  edgeBreak: string | null;
  weldingNotes?: string;
}

export interface SpecificationInspection {
  methods: string[];
  standards: string[];
}

export interface SpecificationCompliance {
  regulatory: string[];
  documentation: string[];
}

export interface SpecificationMarking {
  required: boolean;
  method?: string;
  content: string[];
}

export interface PartSpecificationContent {
  material: SpecificationMaterial;
  process: SpecificationProcess;
  tolerances: SpecificationTolerances;
  surfaceFinish: SpecificationSurfaceFinish;
  heatTreatment: SpecificationHeatTreatment;
  secondaryOps: SpecificationSecondaryOps;
  inspection: SpecificationInspection;
  compliance: SpecificationCompliance;
  marking: SpecificationMarking;
}

export interface PartSpecificationRecord
  extends Omit<PartSpecificationsSchema, 'specifications'> {
  specifications: PartSpecificationContent;
}
