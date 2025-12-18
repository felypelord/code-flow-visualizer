import type { WorkerRequest, WorkerResponse } from "./sandbox.worker";

export type SandboxOptions = {
  timeoutMs?: number;
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

    worker.onmessage = (evt: MessageEvent<WorkerResponse>) => {
      if (settled) return;
      settled = true;
      clearTimeout(timer);
      const data = evt.data as WorkerResponse;
      try {
        worker.terminate();
      } catch {}
      if (data && (data as any).ok) {
        resolve((data as any).result);
      } else {
        const msg = (data as any)?.error || "Unknown error";
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
