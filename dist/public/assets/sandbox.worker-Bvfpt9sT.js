(function(){"use strict";async function y(s,e,n){try{s=String(s).replace(/function\s+(\w+)\s*\(/g,"async function $1(")}catch{}const o=[],c=s.match(/function\s+\w+\s*\(([^)]*)\)/);c&&c[1]&&c[1].split(",").map(t=>t.trim()).filter(Boolean).forEach(t=>{const r=t.replace(/[^a-zA-Z0-9_$]/g,"");r&&o.push(r)});const f=/\b(?:var|let|const)\s+([^;\n]+)/g;let i;for(;(i=f.exec(s))!==null;)i[1].split(",").map(r=>r.trim().split(/=|\s/)[0]).forEach(r=>{const p=(r||"").replace(/[^a-zA-Z0-9_$]/g,"");p&&o.push(p)});const u=Array.from(new Set(o)),_=s.split(`
`).map((t,r)=>{const p=r+1;return`${t}
__stepHook(${p});
__captureSnapshot(${p});`}).join(`
`),l=`
    const __captureNames = ${JSON.stringify(u)};
    function __stepHook(line){ try { self.postMessage({ type: 'step', line: line }); } catch(e){} }
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
          if (typeof ${e} === 'function') { __stack.push({ id: 'frame-1', name: '${e}', variables: makeVars(obj) }); }
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
    ${_}
    ; (typeof ${e} === 'function') ? ${e} : null;
  `;let a;try{a=new Function(l)()}catch(t){try{self.postMessage({type:"wrapper-error",error:"Wrapper SyntaxError: "+String(t),wrapper:l.slice(0,2e3)})}catch{}return}if(!a){const t=`Function not found: ${e}`;self.postMessage({ok:!1,error:t});return}try{let t=a(...Array.isArray(n)?n:[]);t&&typeof t.then=="function"&&(t=await t),self.postMessage({ok:!0,result:t})}catch(t){self.postMessage({ok:!1,error:String(t)})}}async function h(s,e,n){const o=[];try{s=String(s).replace(/function\s+(\w+)\s*\(/g,"async function $1(")}catch{}const c=s.match(/function\s+\w+\s*\(([^)]*)\)/);c&&c[1]&&c[1].split(",").map(a=>a.trim()).filter(Boolean).forEach(a=>{const t=a.replace(/[^a-zA-Z0-9_$]/g,"");t&&o.push(t)});const f=/\b(?:var|let|const)\s+([^;\n]+)/g;let i;for(;(i=f.exec(s))!==null;)i[1].split(",").map(t=>t.trim().split(/=|\s/)[0]).forEach(t=>{const r=(t||"").replace(/[^a-zA-Z0-9_$]/g,"");r&&o.push(r)});const u=Array.from(new Set(o)),_=s.split(`
`).map((a,t)=>{const r=t+1;return`${a}
__stepHook(${r});
__captureSnapshot(${r});
await __wait();`}).join(`
`),l=`
    const __captureNames = ${JSON.stringify(u)};
    function __stepHook(line){ try { self.postMessage({ type: 'step', line: line }); } catch(e){} }
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
          if (typeof ${e} === 'function') { __stack.push({ id: 'frame-1', name: '${e}', variables: makeVars(obj) }); }
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
        ${_}
        const res = (typeof ${e} === 'function') ? await ${e}(...(Array.isArray(args) ? args : [])) : null;
        self.postMessage({ ok: true, result: res });
      } catch(e) {
        self.postMessage({ ok: false, error: String(e) });
      }
    })();
    // expose resolver array access via global
    (self as any).__resolveNext = function(){ try { if(__res && __res.length) { const r = __res.shift(); r(); } } catch(e){} };
    (self as any).__resolveAll = function(){ try { while(__res && __res.length) { const r = __res.shift(); r(); } } catch(e){} };
  `;try{new Function("args",l)(n)}catch(a){try{self.postMessage({type:"wrapper-error",error:"Wrapper SyntaxError: "+String(a),wrapper:l.slice(0,2e3)})}catch{}return}}self.onmessage=s=>{try{const e=s.data||{};if(e&&(e.code||e.functionName)&&e.mode==="manual"){h(String(e.code||""),String(e.functionName||""),Array.isArray(e.args)?e.args:[]);return}if(e&&(e.code||e.functionName)&&(!e.mode||e.mode==="auto")){y(String(e.code||""),String(e.functionName||""),Array.isArray(e.args)?e.args:[]);return}if(e&&e.cmd==="step"){try{self.__resolveNext&&self.__resolveNext()}catch{}return}if(e&&e.cmd==="resume"){try{self.__resolveAll&&self.__resolveAll()}catch{}return}if(e&&e.cmd==="terminate"){try{self.close()}catch{}return}}catch(e){const n=e?.message||String(e);self.postMessage({ok:!1,error:n})}}})();
