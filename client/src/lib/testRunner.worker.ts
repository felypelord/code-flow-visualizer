self.onmessage = function(e:any) {
  const { id, starterCode, userCode, tests } = e.data;
  try {
    const combined = (starterCode || '') + '\n' + (userCode || '');
    // try to find function name
    const fnMatch = combined.match(/function\s+([a-zA-Z0-9_$]+)\s*\(/) || combined.match(/const\s+([a-zA-Z0-9_$]+)\s*=\s*\(/) || combined.match(/([a-zA-Z0-9_$]+)\s*=\s*\([^\)]*\)\s*=>/);
    const fnName = fnMatch ? fnMatch[1] : null;
    const wrapper = new Function(`${starterCode || ''}\n${userCode || ''}\nreturn (typeof ${fnName} !== 'undefined') ? ${fnName} : null;`);
    const fn = wrapper();
    if (!fn || typeof fn !== 'function') {
      (self as any).postMessage({ id, ok: false, messages: ['Could not find function to test.'] });
      return;
    }
    const messages:any[] = [];
    for (const t of (tests || [])) {
      try {
        if (Array.isArray(t.input)) {
          const res = fn(...t.input);
          if (JSON.stringify(res) !== JSON.stringify(t.expected)) messages.push(`Failed: input=${JSON.stringify(t.input)} expected=${JSON.stringify(t.expected)} got=${JSON.stringify(res)}`);
        } else if (t.input !== undefined && t.target !== undefined) {
          const res = fn(t.input, t.target);
          if (JSON.stringify(res) !== JSON.stringify(t.expected)) messages.push(`Failed: input=${JSON.stringify(t.input)}, target=${JSON.stringify(t.target)} expected=${JSON.stringify(t.expected)} got=${JSON.stringify(res)}`);
        } else if (t.args !== undefined) {
          const res = fn(...t.args);
          if (JSON.stringify(res) !== JSON.stringify(t.expected)) messages.push(`Failed: args=${JSON.stringify(t.args)} expected=${JSON.stringify(t.expected)} got=${JSON.stringify(res)}`);
        } else {
          const res = fn(t);
          if (JSON.stringify(res) !== JSON.stringify(t.expected)) messages.push(`Failed: test=${JSON.stringify(t)} got=${JSON.stringify(res)}`);
        }
      } catch (er:any) { messages.push(`Error: ${er?.message || String(er)}`); }
    }
    if (messages.length) (self as any).postMessage({ id, ok: false, messages });
    else (self as any).postMessage({ id, ok: true });
  } catch (err:any) {
    (self as any).postMessage({ id, ok: false, messages: [err?.message || String(err)] });
  }
};
