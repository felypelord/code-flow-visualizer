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
  | { ok: false; error: string; line?: number };

export type WorkerStdoutEvent = {
  type: 'stdout';
  stream: 'stdout' | 'stderr';
  text: string;
  line?: number;
};

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
  // Make function declarations async so `await __wait()` inside them is valid
  try { src = String(src).replace(/function\s+(\w+)\s*\(/g, 'async function $1('); } catch(e) {}
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
    return `__stepHook(${lineNum});\n${l}\n__captureSnapshot(${lineNum});`;
  }).join('\n');

  const __cf_blockSize = 3;
  const wrapperHeader = `
    let __currentLine = 0;
    const __captureNames = ${JSON.stringify(uniqueNames)};
    function __setLine(line){ __currentLine = Number(line)||0; try { self.__currentLine = __currentLine; } catch(e){} }
    function __stepHook(line){ __setLine(line); try { self.postMessage({ type: 'step', line: line }); } catch(e){} }
    function __emitStdout(stream, args){
      try {
        const parts = Array.isArray(args) ? args : [args];
        const text = parts.map((a)=>{
          try {
            if (typeof a === 'string') return a;
            return JSON.stringify(a);
          } catch(e) {
            return String(a);
          }
        }).join(' ');
        self.postMessage({ type: 'stdout', stream: stream, text: String(text), line: __currentLine });
      } catch(e){}
    }
    try {
      const __origLog = console.log;
      const __origErr = console.error;
      console.log = (...a) => { __emitStdout('stdout', a); try { __origLog && __origLog(...a); } catch(e){} };
      console.error = (...a) => { __emitStdout('stderr', a); try { __origErr && __origErr(...a); } catch(e){} };
    } catch(e) {}
    // Best-effort async line attribution: when callbacks run later, restore the scheduling line.
    try {
      const __wrapCallback = (cb, line) => {
        if (typeof cb !== 'function') return cb;
        return (...a) => { try { __setLine(line); } catch(e){}; return cb(...a); };
      };
      const __origSetTimeout = self.setTimeout;
      if (typeof __origSetTimeout === 'function') {
        self.setTimeout = (cb, delay, ...a) => __origSetTimeout(__wrapCallback(cb, __currentLine), delay, ...a);
      }
      const __origSetInterval = self.setInterval;
      if (typeof __origSetInterval === 'function') {
        self.setInterval = (cb, delay, ...a) => __origSetInterval(__wrapCallback(cb, __currentLine), delay, ...a);
      }
      const __origQueueMicrotask = self.queueMicrotask;
      if (typeof __origQueueMicrotask === 'function') {
        self.queueMicrotask = (cb) => __origQueueMicrotask(__wrapCallback(cb, __currentLine));
      }
      const __origRAF = self.requestAnimationFrame;
      if (typeof __origRAF === 'function') {
        self.requestAnimationFrame = (cb) => __origRAF(__wrapCallback(cb, __currentLine));
      }
      if (self.Promise && self.Promise.prototype) {
        const __origThen = self.Promise.prototype.then;
        const __origCatch = self.Promise.prototype.catch;
        const __origFinally = self.Promise.prototype.finally;
        if (typeof __origThen === 'function') {
          self.Promise.prototype.then = function(onFulfilled, onRejected){
            const ln = __currentLine;
            return __origThen.call(this, __wrapCallback(onFulfilled, ln), __wrapCallback(onRejected, ln));
          };
        }
        if (typeof __origCatch === 'function') {
          self.Promise.prototype.catch = function(onRejected){
            const ln = __currentLine;
            return __origCatch.call(this, __wrapCallback(onRejected, ln));
          };
        }
        if (typeof __origFinally === 'function') {
          self.Promise.prototype.finally = function(onFinally){
            const ln = __currentLine;
            return __origFinally.call(this, __wrapCallback(onFinally, ln));
          };
        }
      }
    } catch(e) {}
    function __serialize(val, depth){ try { if (depth <= 0) return (Array.isArray(val) ? '[Array]' : (val && typeof val === 'object' ? '[Object]' : val)); if (val && typeof val === 'object') { if (Array.isArray(val)) { return val.map(v => __serialize(v, depth - 1)); } const out = {}; for (const k in val) { try { out[k] = __serialize(val[k], depth - 1); } catch(e) { out[k] = String(val[k]); } } return out; } return val; } catch(e) { return null; } }
    function __captureSnapshot(line){ try {
        const obj = {};
        for (let i=0;i<__captureNames.length;i++){ const n=__captureNames[i]; try { obj[n]=__serialize(eval(n), 2); } catch(e) {} }
        // build stack (simple frame using functionName) and heap (deeper object snapshots)
        const __stack = [];
        try {
          const makeVars = (o) => {
            const arr = [];
            for (const k in o) {
              try {
                const v = o[k];
                arr.push({ name: k, value: __serialize(v, 2), type: (v && typeof v === 'object') ? 'reference' : 'primitive', changed: true });
              } catch(e) {}
            }
            return arr;
          };
          if (typeof ${functionName} === 'function') { __stack.push({ id: 'frame-1', name: '${functionName}', variables: makeVars(obj) }); }
          else { __stack.push({ id: 'global', name: 'global', variables: makeVars(obj) }); }
        } catch(e){}
        const __heap = [];
        try {
          for (const k in obj) {
            try {
              const v = obj[k];
              if (v && typeof v === 'object') {
                const props = [];
                try {
                  for (const pk in v) {
                    try { props.push({ name: pk, value: __serialize(v[pk], 2), type: (v[pk] && typeof v[pk] === 'object') ? 'reference' : 'primitive' }); } catch(e){}
                  }
                } catch(e){}
                __heap.push({ id: 'heap_' + k, className: Array.isArray(v) ? 'Array' : 'Object', properties: props });
              }
            } catch(e){}
          }
        } catch(e){}
        self.postMessage({ type: 'snapshot', line: line, vars: obj, stack: __stack, heap: __heap });
      } catch(e){} }
  `;

  const wrapperFooter = `
    ; (typeof ${functionName} === 'function') ? ${functionName} : null;
    //# sourceURL=codeflow-sandbox.js
  `;

  const __cf_instrumentedStartLine = wrapperHeader.split('\n').length;
  const wrapper = wrapperHeader + instrumented + wrapperFooter;

  let fn: any;
  try {
    const getFn = new Function(wrapper);
    fn = getFn();
  } catch (err) {
    let mappedLine: number | undefined;
    try {
      const stack = String((err as any)?.stack || '');
      const m = stack.match(/codeflow-sandbox\.js:(\d+):(\d+)/);
      if (m && m[1]) {
        const wrapperLine = Number(m[1]);
        if (Number.isFinite(wrapperLine)) {
          const rel = wrapperLine - __cf_instrumentedStartLine + 1;
          if (rel >= 1) mappedLine = Math.ceil(rel / __cf_blockSize);
        }
      }
    } catch(e) {}
    try { self.postMessage({ type: 'wrapper-error', error: 'Wrapper SyntaxError: ' + String(err), wrapper: wrapper.slice(0, 2000), line: mappedLine }); } catch(e){}
    return;
  }
  // Script mode: allow running top-level code without requiring a named function.
  if (!fn && functionName === '__cf_script') {
    fn = async () => null;
  }
  if (!fn) {
    const msg = `Function not found: ${functionName}`;
    self.postMessage({ ok: false, error: msg } as WorkerResponse);
    return;
  }
  try {
    let result: any = fn(...(Array.isArray(args) ? args : []));
    if (result && typeof result.then === 'function') result = await result;
    self.postMessage({ ok: true, result } as WorkerResponse);
  } catch (err) {
    self.postMessage({ ok: false, error: String(err), line: (self as any).__currentLine } as WorkerResponse);
  }
}

async function runManual(src: string, functionName: string, args: any[]) {
  const captureNames: string[] = [];
  // Make user-declared functions async so injected `await __wait()` is valid
  try { src = String(src).replace(/function\s+(\w+)\s*\(/g, 'async function $1('); } catch(e) {}
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
    return `__stepHook(${lineNum});\n${l}\n__captureSnapshot(${lineNum});\nawait __wait();`;
  }).join('\n');

  const __cf_blockSize = 4;
  const wrapperHeader = `
    let __currentLine = 0;
    const __captureNames = ${JSON.stringify(uniqueNames)};
    function __setLine(line){ __currentLine = Number(line)||0; try { self.__currentLine = __currentLine; } catch(e){} }
    function __stepHook(line){ __setLine(line); try { self.postMessage({ type: 'step', line: line }); } catch(e){} }
    function __emitStdout(stream, args){
      try {
        const parts = Array.isArray(args) ? args : [args];
        const text = parts.map((a)=>{
          try {
            if (typeof a === 'string') return a;
            return JSON.stringify(a);
          } catch(e) {
            return String(a);
          }
        }).join(' ');
        self.postMessage({ type: 'stdout', stream: stream, text: String(text), line: __currentLine });
      } catch(e){}
    }
    try {
      const __origLog = console.log;
      const __origErr = console.error;
      console.log = (...a) => { __emitStdout('stdout', a); try { __origLog && __origLog(...a); } catch(e){} };
      console.error = (...a) => { __emitStdout('stderr', a); try { __origErr && __origErr(...a); } catch(e){} };
    } catch(e) {}
    // Best-effort async line attribution
    try {
      const __wrapCallback = (cb, line) => {
        if (typeof cb !== 'function') return cb;
        return (...a) => { try { __setLine(line); } catch(e){}; return cb(...a); };
      };
      const __origSetTimeout = self.setTimeout;
      if (typeof __origSetTimeout === 'function') {
        self.setTimeout = (cb, delay, ...a) => __origSetTimeout(__wrapCallback(cb, __currentLine), delay, ...a);
      }
      const __origSetInterval = self.setInterval;
      if (typeof __origSetInterval === 'function') {
        self.setInterval = (cb, delay, ...a) => __origSetInterval(__wrapCallback(cb, __currentLine), delay, ...a);
      }
      const __origQueueMicrotask = self.queueMicrotask;
      if (typeof __origQueueMicrotask === 'function') {
        self.queueMicrotask = (cb) => __origQueueMicrotask(__wrapCallback(cb, __currentLine));
      }
      if (self.Promise && self.Promise.prototype) {
        const __origThen = self.Promise.prototype.then;
        const __origCatch = self.Promise.prototype.catch;
        const __origFinally = self.Promise.prototype.finally;
        if (typeof __origThen === 'function') {
          self.Promise.prototype.then = function(onFulfilled, onRejected){
            const ln = __currentLine;
            return __origThen.call(this, __wrapCallback(onFulfilled, ln), __wrapCallback(onRejected, ln));
          };
        }
        if (typeof __origCatch === 'function') {
          self.Promise.prototype.catch = function(onRejected){
            const ln = __currentLine;
            return __origCatch.call(this, __wrapCallback(onRejected, ln));
          };
        }
        if (typeof __origFinally === 'function') {
          self.Promise.prototype.finally = function(onFinally){
            const ln = __currentLine;
            return __origFinally.call(this, __wrapCallback(onFinally, ln));
          };
        }
      }
    } catch(e) {}
    function __serialize(val, depth){ try { if (depth <= 0) return (Array.isArray(val) ? '[Array]' : (val && typeof val === 'object' ? '[Object]' : val)); if (val && typeof val === 'object') { if (Array.isArray(val)) { return val.map(v => __serialize(v, depth - 1)); } const out = {}; for (const k in val) { try { out[k] = __serialize(val[k], depth - 1); } catch(e) { out[k] = String(val[k]); } } return out; } return val; } catch(e) { return null; } }
    function __captureSnapshot(line){ try {
        const obj = {};
        for (let i=0;i<__captureNames.length;i++){ const n=__captureNames[i]; try { obj[n]=__serialize(eval(n), 2); } catch(e) {} }
        const __stack = [];
        try {
          const makeVars = (o) => {
            const arr = [];
            for (const k in o) {
              try {
                const v = o[k];
                arr.push({ name: k, value: __serialize(v, 2), type: (v && typeof v === 'object') ? 'reference' : 'primitive', changed: true });
              } catch(e) {}
            }
            return arr;
          };
          if (typeof ${functionName} === 'function') { __stack.push({ id: 'frame-1', name: '${functionName}', variables: makeVars(obj) }); }
          else { __stack.push({ id: 'global', name: 'global', variables: makeVars(obj) }); }
        } catch(e){}
        const __heap = [];
        try {
          for (const k in obj) {
            try {
              const v = obj[k];
              if (v && typeof v === 'object') {
                const props = [];
                try {
                  for (const pk in v) {
                    try { props.push({ name: pk, value: __serialize(v[pk], 2), type: (v[pk] && typeof v[pk] === 'object') ? 'reference' : 'primitive' }); } catch(e){}
                  }
                } catch(e){}
                __heap.push({ id: 'heap_' + k, className: Array.isArray(v) ? 'Array' : 'Object', properties: props });
              }
            } catch(e){}
          }
        } catch(e){}
        self.postMessage({ type: 'snapshot', line: line, vars: obj, stack: __stack, heap: __heap });
      } catch(e){} }
    var __res = [];
    function __wait(){ return new Promise(res=>{ __res.push(res); }); }
    (async function(){
      try {
  `;

  const wrapperFooter = `
        const res = (typeof ${functionName} === 'function') ? await ${functionName}(...(Array.isArray(args) ? args : [])) : null;
        self.postMessage({ ok: true, result: res });
      } catch(e) {
        self.postMessage({ ok: false, error: String(e), line: __currentLine });
      }
    })();
    // expose resolver array access via global
    self.__resolveNext = function(){ try { if(__res && __res.length) { const r = __res.shift(); r(); } } catch(e){} };
    self.__resolveAll = function(){ try { while(__res && __res.length) { const r = __res.shift(); r(); } } catch(e){} };
    //# sourceURL=codeflow-sandbox.js
  `;

  const __cf_instrumentedStartLine = wrapperHeader.split('\n').length;
  const wrapper = wrapperHeader + instrumented + wrapperFooter;

  try {
    const getFn = new Function('args', wrapper);
    getFn(args);
  } catch (err) {
    let mappedLine: number | undefined;
    try {
      const stack = String((err as any)?.stack || '');
      const m = stack.match(/codeflow-sandbox\.js:(\d+):(\d+)/);
      if (m && m[1]) {
        const wrapperLine = Number(m[1]);
        if (Number.isFinite(wrapperLine)) {
          const rel = wrapperLine - __cf_instrumentedStartLine + 1;
          if (rel >= 1) mappedLine = Math.ceil(rel / __cf_blockSize);
        }
      }
    } catch(e) {}
    try { self.postMessage({ type: 'wrapper-error', error: 'Wrapper SyntaxError: ' + String(err), wrapper: wrapper.slice(0, 2000), line: mappedLine }); } catch(e){}
    return;
  }
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
      try { self.close(); } catch(e){}
      return;
    }
  } catch (err: any) {
    const msg = err?.message || String(err);
    self.postMessage({ ok: false, error: msg } as WorkerResponse);
  }
};
