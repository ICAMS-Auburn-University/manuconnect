export interface StepWorkerMeshAttribute {
  array: number[];
}

export interface StepWorkerMesh {
  attributes: {
    position: StepWorkerMeshAttribute;
    normal?: StepWorkerMeshAttribute;
  };
  index?: { array: number[] };
  color?: number[];
}

export interface StepWorkerRequest {
  id: number;
  buffer: ArrayBuffer;
}

export type StepWorkerResponse =
  | { id: number; ok: true; meshes: StepWorkerMesh[] }
  | { id: number; ok: false; error: string };
