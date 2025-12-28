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

// Support two modes:
// - default: execute fully and post step/snapshot events as before
// - manual: wait for 'step'/'resume' commands from main thread and execute one line per 'step'

type InitMsg = WorkerRequest & { mode?: 'manual' | 'auto' };

let __resolvers: Array<() => void> = [];

function __createWait() {
  return function __wait() {
    return new Promise<void>((res) => {
      __resolvers.push(res);
    });
  };
}

async function runAuto(src: string, functionName: string, args: any[]) {
  // same heuristic capture as before
  const captureNames: string[] = [];
  const fnMatch = src.match(/function\s+\w+\s*\(([^)]*)\)/);
  if (fnMatch && fnMatch[1]) {
    fnMatch[1].split(',').map(s => s.trim()).filter(Boolean).forEach(a => {
      const id = a.replace(/[^a-zA-Z0-9_$]/g, '');
      if (id) captureNames.push(id);
    });
  }
  const declRegex = /\b(?:var|let|const)\s+([^;\n]+)/g;
  let m: RegExpExecArray | null;
  while ((m = declRegex.exec(src)) !== null) {
    const decl = m[1];
    decl.split(',').map(s => s.trim().split(/=|\s/)[0]).forEach(n => {
      const id = (n || '').replace(/[^a-zA-Z0-9_$]/g, '');
      if (id) captureNames.push(id);
    });
  }
  const uniqueNames = Array.from(new Set(captureNames));

  const lines = src.split('\n');
  const instrumented = lines.map((l, i) => {
    const lineNum = i + 1;
    return `__stepHook(${lineNum});\ntry{${l}}catch(e){throw e;}\n__captureSnapshot(${lineNum});`;
  }).join('\n');

  const wrapper = `
    const __captureNames = ${JSON.stringify(uniqueNames)};
    function __stepHook(line){ try { (self as any).postMessage({ type: 'step', line: line }); } catch(e){} }
    function __captureSnapshot(line){ try {
        const obj = {};
        for (let i=0;i<__captureNames.length;i++){ const n=__captureNames[i]; try { obj[n]=eval(n); } catch(e) {} }
        // build stack (simple frame using functionName) and heap (shallow object snapshots)
        const __stack = [];
        try {
          if (typeof ${functionName} === 'function') { __stack.push({ id: 'frame-1', name: '${functionName}', variables: obj }); }
          else { __stack.push({ id: 'global', name: 'global', variables: obj }); }
        } catch(e){}
        const __heap = [];
        try {
          for (const k in obj) {
            try {
              const v = obj[k];
              if (v && typeof v === 'object') {
                const shallow = {};
                for (const p in v) { try { shallow[p] = v[p]; } catch(e){} }
                __heap.push({ id: 'heap_' + k, ref: k, value: shallow });
              }
            } catch(e){}
          }
        } catch(e){}
        (self as any).postMessage({ type: 'snapshot', line: line, vars: obj, stack: __stack, heap: __heap });
      } catch(e){} }
    ${instrumented}
    ; (typeof ${functionName} === 'function') ? ${functionName} : null;
  `;

  const getFn = new Function(wrapper);
  const fn = getFn();
  if (!fn) {
    const msg = `Function not found: ${functionName}`;
    (self as any).postMessage({ ok: false, error: msg } as WorkerResponse);
    return;
  }
  const result = fn(...(Array.isArray(args) ? args : []));
  (self as any).postMessage({ ok: true, result } as WorkerResponse);
}

async function runManual(src: string, functionName: string, args: any[]) {
  const captureNames: string[] = [];
  const fnMatch = src.match(/function\s+\w+\s*\(([^)]*)\)/);
  if (fnMatch && fnMatch[1]) {
    fnMatch[1].split(',').map(s => s.trim()).filter(Boolean).forEach(a => {
      const id = a.replace(/[^a-zA-Z0-9_$]/g, '');
      if (id) captureNames.push(id);
    });
  }
  const declRegex = /\b(?:var|let|const)\s+([^;\n]+)/g;
  let m: RegExpExecArray | null;
  while ((m = declRegex.exec(src)) !== null) {
    const decl = m[1];
    decl.split(',').map(s => s.trim().split(/=|\s/)[0]).forEach(n => {
      const id = (n || '').replace(/[^a-zA-Z0-9_$]/g, '');
      if (id) captureNames.push(id);
    });
  }
  const uniqueNames = Array.from(new Set(captureNames));

  const lines = src.split('\n');
  // Build an async wrapper that yields (awaits) between lines
  const instrumented = lines.map((l, i) => {
    const lineNum = i + 1;
    return `__stepHook(${lineNum});\ntry{${l}}catch(e){throw e;}\n__captureSnapshot(${lineNum});\nawait __wait();`;
  }).join('\n');

  const wrapper = `
    const __captureNames = ${JSON.stringify(uniqueNames)};
    function __stepHook(line){ try { (self as any).postMessage({ type: 'step', line: line }); } catch(e){} }
    function __captureSnapshot(line){ try {
        const obj = {};
        for (let i=0;i<__captureNames.length;i++){ const n=__captureNames[i]; try { obj[n]=eval(n); } catch(e) {} }
        const __stack = [];
        try {
          if (typeof ${functionName} === 'function') { __stack.push({ id: 'frame-1', name: '${functionName}', variables: obj }); }
          else { __stack.push({ id: 'global', name: 'global', variables: obj }); }
        } catch(e){}
        const __heap = [];
        try {
          for (const k in obj) {
            try {
              const v = obj[k];
              if (v && typeof v === 'object') {
                const shallow = {};
                for (const p in v) { try { shallow[p] = v[p]; } catch(e){} }
                __heap.push({ id: 'heap_' + k, ref: k, value: shallow });
              }
            } catch(e){}
          }
        } catch(e){}
        (self as any).postMessage({ type: 'snapshot', line: line, vars: obj, stack: __stack, heap: __heap });
      } catch(e){} }
    var __res = [];
    function __wait(){ return new Promise(res=>{ __res.push(res); }); }
    (async function(){
      try {
        ${instrumented}
        const res = (typeof ${functionName} === 'function') ? ${functionName}(...(Array.isArray(args) ? args : [])) : null;
        (self as any).postMessage({ ok: true, result: res });
      } catch(e) {
        (self as any).postMessage({ ok: false, error: (e && e.message) || String(e) });
      }
    })();
    // expose resolver array access via global
    (self as any).__resolveNext = function(){ try { if(__res && __res.length) { const r = __res.shift(); r(); } } catch(e){} };
    (self as any).__resolveAll = function(){ try { while(__res && __res.length) { const r = __res.shift(); r(); } } catch(e){} };
  `;

  const getFn = new Function(wrapper);
  getFn();
}

self.onmessage = (evt: MessageEvent<any>) => {
  try {
    const data = evt.data || {};
    // initialization message
    if (data && (data.code || data.functionName) && data.mode === 'manual') {
      // start manual runner but it will await on __wait until steps are triggered
      runManual(String(data.code || ''), String(data.functionName || ''), Array.isArray(data.args) ? data.args : []);
      return;
    }

    if (data && (data.code || data.functionName) && (!data.mode || data.mode === 'auto')) {
      runAuto(String(data.code || ''), String(data.functionName || ''), Array.isArray(data.args) ? data.args : []);
      return;
    }

    // command messages
    if (data && data.cmd === 'step') {
      try { (self as any).__resolveNext && (self as any).__resolveNext(); } catch(e){}
      return;
    }
    if (data && data.cmd === 'resume') {
      try { (self as any).__resolveAll && (self as any).__resolveAll(); } catch(e){}
      return;
    }
    if (data && data.cmd === 'terminate') {
      try { (self as any).close(); } catch(e){}
      return;
    }
  } catch (err: any) {
    const msg = err?.message || String(err);
    (self as any).postMessage({ ok: false, error: msg } as WorkerResponse);
  }
};
