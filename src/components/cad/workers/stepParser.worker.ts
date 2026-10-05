import type {
  StepWorkerRequest,
  StepWorkerResponse,
} from './stepParserProtocol';

// Runs in a dedicated Worker thread so OCCT's STEP parsing never blocks the UI.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const ctx: any = self;

// eslint-disable-next-line @typescript-eslint/no-explicit-any
let occtPromise: Promise<any> | null = null;

function getOcct() {
  if (!occtPromise) {
    occtPromise = import('occt-import-js').then((mod) =>
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (mod as any).default({ locateFile: () => '/occt-import-js.wasm' })
    );
  }
  return occtPromise;
}

ctx.onmessage = async (event: MessageEvent<StepWorkerRequest>) => {
  const { id, buffer } = event.data;

  try {
    const occt = await getOcct();
    const fileBuffer = new Uint8Array(buffer);
    const result = occt.ReadStepFile(fileBuffer, null);
    const response: StepWorkerResponse = {
      id,
      ok: true,
      meshes: result.meshes,
    };
    ctx.postMessage(response);
  } catch (err) {
    const message =
      err instanceof Error ? err.message : 'Failed to parse STEP file';
    const response: StepWorkerResponse = { id, ok: false, error: message };
    ctx.postMessage(response);
  }
};

export {};
