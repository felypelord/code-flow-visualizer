// Minimal JS sandbox worker: compiles user code and executes a named function
// Receives: { code: string, functionName: string, args: any[] }
// Responds: { ok: true, result } or { ok: false, error }

export type WorkerRequest = {
  code: string;
  functionName: string;
  args: any[];
};

export type WorkerResponse =
  | { ok: true; result: any }
  | { ok: false; error: string };

self.onmessage = (evt: MessageEvent<WorkerRequest>) => {
  const { code, functionName, args } = evt.data || ({} as WorkerRequest);
  try {
    // Compile user code in isolated worker context
    // Expect the user-defined function name to exist on global scope after eval
    const wrapped = `\n${code}\n; (typeof ${functionName} === 'function') ? ${functionName} : null;`;
    const getFn = new Function(wrapped);
    const fn = getFn();
    if (!fn) {
      const msg = `Function not found: ${functionName}`;
      (self as any).postMessage({ ok: false, error: msg } as WorkerResponse);
      return;
    }
    const result = fn(...(Array.isArray(args) ? args : []));
    (self as any).postMessage({ ok: true, result } as WorkerResponse);
  } catch (err: any) {
    const msg = err?.message || String(err);
    (self as any).postMessage({ ok: false, error: msg } as WorkerResponse);
  }
};
