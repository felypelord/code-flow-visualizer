export function extractFunctionName(code: string): string | null {
  if (!code) return null;
  const fnMatch = code.match(/function\s+([a-zA-Z0-9_$]+)\s*\(/);
  if (fnMatch) return fnMatch[1];
  const constMatch = code.match(/const\s+([a-zA-Z0-9_$]+)\s*=\s*\(/);
  if (constMatch) return constMatch[1];
  const arrowMatch = code.match(/([a-zA-Z0-9_$]+)\s*=\s*\([^\)]*\)\s*=>/);
  if (arrowMatch) return arrowMatch[1];
  return null;
}

export function deepEqual(a: any, b: any) {
  return JSON.stringify(a) === JSON.stringify(b);
}

export function runTestsInWorker(starterCode: string, userCode: string, tests: any[]): Promise<{ ok: boolean; messages?: string[] }> {
  return new Promise((resolve) => {
    try {
      const worker = new Worker(new URL('./testRunner.worker.ts', import.meta.url));
      const id = String(Math.random()).slice(2);
      const onMsg = (ev: MessageEvent) => {
        if (ev.data && ev.data.id === id) {
          resolve({ ok: Boolean(ev.data.ok), messages: ev.data.messages });
          worker.removeEventListener('message', onMsg as any);
          worker.terminate();
        }
      };
      worker.addEventListener('message', onMsg as any);
      // send payload with id
      worker.postMessage({ id, starterCode, userCode, tests });
    } catch (e:any) {
      resolve({ ok: false, messages: [e?.message || String(e)] });
    }
  });
}
