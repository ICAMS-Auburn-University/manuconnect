import type { StepWorkerMesh, StepWorkerRequest, StepWorkerResponse } from './stepParserProtocol';

// A single shared worker handles all STEP parsing so the ~7MB OCCT wasm
// binary is only loaded once, while keeping parsing off the main thread.
let worker: Worker | null = null;
let nextRequestId = 0;
const pending = new Map<
  number,
  { resolve: (meshes: StepWorkerMesh[]) => void; reject: (err: Error) => void }
>();

function getWorker(): Worker {
  if (worker) {
    return worker;
  }

  worker = new Worker(
    new URL('./stepParser.worker.ts', import.meta.url),
    { type: 'module' }
  );

  worker.onmessage = (event: MessageEvent<StepWorkerResponse>) => {
    const response = event.data;
    const entry = pending.get(response.id);
    if (!entry) {
      return;
    }
    pending.delete(response.id);

    if (response.ok) {
      entry.resolve(response.meshes);
    } else {
      entry.reject(new Error(response.error));
    }
  };

  worker.onerror = (event) => {
    const error = new Error(event.message || 'STEP parsing worker crashed');
    pending.forEach(({ reject }) => reject(error));
    pending.clear();
  };

  return worker;
}

export function parseStepBufferInWorker(
  buffer: ArrayBuffer,
  signal?: AbortSignal
): Promise<StepWorkerMesh[]> {
  return new Promise((resolve, reject) => {
    if (signal?.aborted) {
      reject(new DOMException('Aborted', 'AbortError'));
      return;
    }

    const id = nextRequestId++;
    const activeWorker = getWorker();

    const onAbort = () => {
      pending.delete(id);
      reject(new DOMException('Aborted', 'AbortError'));
    };

    signal?.addEventListener('abort', onAbort, { once: true });

    pending.set(id, {
      resolve: (meshes) => {
        signal?.removeEventListener('abort', onAbort);
        resolve(meshes);
      },
      reject: (err) => {
        signal?.removeEventListener('abort', onAbort);
        reject(err);
      },
    });

    const request: StepWorkerRequest = { id, buffer };
    activeWorker.postMessage(request, [buffer]);
  });
}
