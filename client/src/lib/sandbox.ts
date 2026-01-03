import type { WorkerRequest, WorkerResponse } from "./sandbox.worker";

export type SandboxOptions = {
  timeoutMs?: number;
  // optional step callback to receive line-execution events from the worker
  onStep?: (line: number) => void;
  // optional snapshot callback to receive full snapshots { vars, stack, heap }
  onSnapshot?: (snapshot: { vars: Record<string, any>; stack?: any[]; heap?: any[] }, line?: number) => void;
  // optional stdout callback to receive console/print output
  onStdout?: (entry: { stream: 'stdout' | 'stderr'; text: string; line?: number }) => void;
};

export async function runInWorker(
  code: string,
  functionName: string,
  args: any[] = [],
  opts: SandboxOptions = {},
): Promise<any> {
  const timeoutMs = typeof opts.timeoutMs === "number" ? opts.timeoutMs : 3000;
  const stepDelayMs = typeof (opts as any).stepDelayMs === 'number' ? (opts as any).stepDelayMs : 0;
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
      if (data && data.type === 'wrapper-error') {
        try { console.error('Sandbox worker wrapper error:', data.error); console.error(data.wrapper); } catch(e) {}
        settled = true;
        clearTimeout(timer);
        try { worker.terminate(); } catch {}
        const errMsg = (data && data.error) || 'Wrapper SyntaxError';
        const wrapperSnippet = data && data.wrapper ? String(data.wrapper).slice(0, 2000) : '';
        const err: any = new Error(errMsg + '\n' + wrapperSnippet);
        if (data && typeof data.line === 'number') err.line = data.line;
        reject(err);
        return;
      }
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

      // Stdout events from console.log / console.error
      if (data && data.type === 'stdout') {
        try {
          opts.onStdout?.({ stream: data.stream === 'stderr' ? 'stderr' : 'stdout', text: String(data.text || ''), line: typeof data.line === 'number' ? data.line : undefined });
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
        const err: any = new Error(msg);
        if (data && typeof data.line === 'number') err.line = data.line;
        reject(err);
      }
    };

    worker.onerror = (evt) => {
      if (settled) return;
      settled = true;
      clearTimeout(timer);
      try { worker.terminate(); } catch {}
      try {
        const info = {
          message: (evt as any)?.message,
          filename: (evt as any)?.filename,
          lineno: (evt as any)?.lineno,
          colno: (evt as any)?.colno,
        };
        const details = JSON.stringify(info);
        const msg = (evt as any)?.message || 'Worker error';
        reject(new Error(msg + ' - ' + details));
      } catch (e) {
        reject(new Error('Worker error'));
      }
    };

    // If a step delay is requested, use the manual controller mechanism and
    // advance the worker one step at a time so the UI can observe each step.
    if (stepDelayMs && stepDelayMs > 0) {
      try { worker.terminate(); } catch {}
      const controller = createWorkerController(code, functionName, args, {
        onStep: (line) => { try { opts.onStep?.(line); } catch {} },
        onSnapshot: (snapshot, line) => { try { opts.onSnapshot?.(snapshot, line); } catch {} },
      });
          (async () => {
            try {
              while (true) {
                controller.step();
                await new Promise((res) => setTimeout(res, stepDelayMs));
                // check if resolved
                try {
                  const r = await Promise.race([controller.result.then((v:any)=>({ok:true,v})).catch((e:any)=>({ok:false,e})), new Promise((res)=>setTimeout(res,0))]);
                  if (r && typeof r === 'object' && (r as any).ok !== undefined) {
                    if ((r as any).ok) resolve((r as any).v);
                    else reject((r as any).e);
                    try { controller.terminate(); } catch {}
                    break;
                  }
                } catch (e) {
                  try { controller.terminate(); } catch {}
                  reject(e);
                  break;
                }
              }
            } catch (err) {
              try { controller.terminate(); } catch {}
              reject(err);
            }
          })();
      return;
    }

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
  // ready resolves when the worker emits the first step/snapshot or wrapper-error
  let readyResolve: () => void;
  let readyReject: (e:any) => void;
  const readyPromise = new Promise<void>((res, rej) => { readyResolve = res; readyReject = rej; });
  let _readyResolved = false;

  worker.onmessage = (evt: MessageEvent<any>) => {
    const data = evt.data as any;
    if (data && data.type === 'wrapper-error') {
      try { console.error('Sandbox worker wrapper error:', data.error); console.error(data.wrapper); } catch(e) {}
      settled = true;
      if (!_readyResolved) { _readyResolved = true; try { readyResolve(); } catch(e){} }
      const err: any = new Error((data && data.error) || 'Wrapper SyntaxError');
      if (data && typeof data.line === 'number') err.line = data.line;
      resultReject(err);
      return;
    }
    if (data && data.type === 'step') {
      try { opts.onStep?.(Number(data.line) || 0); } catch {}
      if (!_readyResolved) { _readyResolved = true; try { readyResolve(); } catch(e){} }
      return;
    }
    if (data && data.type === 'snapshot') {
      try { opts.onSnapshot?.({ vars: data.vars || {}, stack: data.stack || [], heap: data.heap || [] }, Number(data.line) || 0); } catch {}
      if (!_readyResolved) { _readyResolved = true; try { readyResolve(); } catch(e){} }
      return;
    }

    if (data && data.type === 'stdout') {
      try {
        opts.onStdout?.({ stream: data.stream === 'stderr' ? 'stderr' : 'stdout', text: String(data.text || ''), line: typeof data.line === 'number' ? data.line : undefined });
      } catch {}
      if (!_readyResolved) { _readyResolved = true; try { readyResolve(); } catch(e){} }
      return;
    }

    // final
    settled = true;
    if (data && data.ok) resultResolve(data.result);
    else {
      const err: any = new Error((data && data.error) || 'Unknown error');
      if (data && typeof data.line === 'number') err.line = data.line;
      resultReject(err);
    }
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
    // promise that resolves when the worker reports first step/snapshot (useful to avoid stepping too early)
    ready: readyPromise,
    worker,
  };
}
