import type { WorkerRequest, WorkerResponse } from "./sandbox.worker";

export type SandboxOptions = {
  timeoutMs?: number;
  // optional step callback to receive line-execution events from the worker
  onStep?: (line: number) => void;
  // optional snapshot callback to receive full snapshots { vars, stack, heap }
  onSnapshot?: (snapshot: { vars: Record<string, any>; stack?: any[]; heap?: any[] }, line?: number) => void;
};

export async function runInWorker(
  code: string,
  functionName: string,
  args: any[] = [],
  opts: SandboxOptions = {},
): Promise<any> {
  const timeoutMs = typeof opts.timeoutMs === "number" ? opts.timeoutMs : 3000;
  const worker = new Worker(new URL("./sandbox.worker.ts", import.meta.url), {
    type: "module",
    name: "sandbox-worker",
  });

  return new Promise((resolve, reject) => {
    let settled = false;
    const timer = setTimeout(() => {
      if (settled) return;
      settled = true;
      try {
        worker.terminate();
      } catch {}
      reject(new Error("Execution timed out"));
    }, Math.max(1, timeoutMs));

    worker.onmessage = (evt: MessageEvent<any>) => {
      if (settled) return;
      const data = evt.data as any;
      // Step events are forwarded to the callback and do not settle the promise
      if (data && data.type === 'step') {
        try {
          opts.onStep?.(Number(data.line) || 0);
        } catch {}
        return;
      }

      // Snapshot events contain variable values and optional stack/heap
      if (data && data.type === 'snapshot') {
        try {
          opts.onSnapshot?.({ vars: data.vars || {}, stack: data.stack || [], heap: data.heap || [] }, Number(data.line) || 0);
        } catch {}
        return;
      }

      // Final result/error message
      settled = true;
      clearTimeout(timer);
      try {
        worker.terminate();
      } catch {}
      if (data && data.ok) {
        resolve(data.result);
      } else {
        const msg = (data && data.error) || 'Unknown error';
        reject(new Error(msg));
      }
    };

    worker.onerror = (evt) => {
      if (settled) return;
      settled = true;
      clearTimeout(timer);
      try {
        worker.terminate();
      } catch {}
      reject(new Error(evt?.message || "Worker error"));
    };

    const payload: WorkerRequest = { code, functionName, args };
    worker.postMessage(payload);
  });
}

// Controller-based worker for manual stepping
export function createWorkerController(
  code: string,
  functionName: string,
  args: any[] = [],
  opts: SandboxOptions = {},
) {
  const worker = new Worker(new URL('./sandbox.worker.ts', import.meta.url), { type: 'module', name: 'sandbox-worker' });

  let settled = false;
  let resultResolve: (v: any) => void;
  let resultReject: (e: any) => void;
  const resultPromise = new Promise((resolve, reject) => { resultResolve = resolve; resultReject = reject; });

  worker.onmessage = (evt: MessageEvent<any>) => {
    const data = evt.data as any;
    if (data && data.type === 'step') {
      try { opts.onStep?.(Number(data.line) || 0); } catch {}
      return;
    }
    if (data && data.type === 'snapshot') {
      try { opts.onSnapshot?.({ vars: data.vars || {}, stack: data.stack || [], heap: data.heap || [] }, Number(data.line) || 0); } catch {}
      return;
    }

    // final
    settled = true;
    if (data && data.ok) resultResolve(data.result);
    else resultReject(new Error((data && data.error) || 'Unknown error'));
  };

  worker.onerror = (evt) => {
    if (settled) return;
    settled = true;
    resultReject(new Error(evt?.message || 'Worker error'));
  };

  // init
  worker.postMessage({ code, functionName, args, mode: 'manual' });

  return {
    step: () => worker.postMessage({ cmd: 'step' }),
    resume: () => worker.postMessage({ cmd: 'resume' }),
    terminate: () => { try { worker.terminate(); } catch {} },
    result: resultPromise,
    worker,
  };
}
