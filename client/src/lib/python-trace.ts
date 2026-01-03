type PyTraceVar = { name: string; repr: string; refId?: string };

type PyTraceFrame = {
  name: string;
  line: number;
  locals: PyTraceVar[];
};

type PyTraceHeapProp = { name: string; value: string; type: "primitive" | "reference" };

type PyTraceHeapObject = {
  id: string;
  className: string;
  properties: PyTraceHeapProp[];
};

type PyTraceEvent = {
  line: number;
  stack: PyTraceFrame[];
  heap: PyTraceHeapObject[];
};

type PyTraceOutputEntry = {
  stream: "stdout" | "stderr";
  text: string;
  line?: number;
  eventIndex: number;
};

export type PythonTraceResult = {
  ok: boolean;
  events: PyTraceEvent[];
  output: PyTraceOutputEntry[];
  error?: string;
  line?: number;
};

declare global {
  interface Window {
    loadPyodide?: (opts: { indexURL: string }) => Promise<any>;
    __cf_pyodide?: any;
    __cf_pyodide_loading?: Promise<any>;
  }
}

function loadScriptOnce(src: string): Promise<void> {
  return new Promise((resolve, reject) => {
    const existing = document.querySelector(`script[data-cf-pyodide="${src}"]`) as HTMLScriptElement | null;
    if (existing) {
      if ((existing as any).__loaded) resolve();
      else existing.addEventListener("load", () => resolve(), { once: true });
      return;
    }
    const s = document.createElement("script");
    s.src = src;
    s.async = true;
    s.defer = true;
    s.dataset.cfPyodide = src;
    s.onload = () => {
      (s as any).__loaded = true;
      resolve();
    };
    s.onerror = () => reject(new Error(`Failed to load ${src}`));
    document.head.appendChild(s);
  });
}

export async function getPyodide(): Promise<any> {
  if (typeof window === "undefined") throw new Error("Pyodide requires a browser environment");
  if (window.__cf_pyodide) return window.__cf_pyodide;
  if (window.__cf_pyodide_loading) return window.__cf_pyodide_loading;

  window.__cf_pyodide_loading = (async () => {
    const base = "https://cdn.jsdelivr.net/pyodide/v0.25.1/full/";
    await loadScriptOnce(base + "pyodide.js");
    if (!window.loadPyodide) throw new Error("Pyodide loader not found after script load");
    const py = await window.loadPyodide({ indexURL: base });
    window.__cf_pyodide = py;
    return py;
  })();

  return window.__cf_pyodide_loading;
}

const PY_TRACE_DRIVER = `
import sys, json, traceback

_USER_FILENAME = 'codeflow_user.py'

USER_CODE = globals().get('USER_CODE', '')
MAX_EVENTS = int(globals().get('MAX_EVENTS', 2000))
MAX_STACK = int(globals().get('MAX_STACK', 10))
MAX_LOCALS = int(globals().get('MAX_LOCALS', 40))
MAX_HEAP_ITEMS = int(globals().get('MAX_HEAP_ITEMS', 20))
MAX_REPR = int(globals().get('MAX_REPR', 200))

_events = []
_output = []
_current_line = 0

class _Stream:
  def __init__(self, stream):
    self.stream = stream
  def write(self, s):
    global _current_line
    if s is None:
      return
    txt = str(s)
    if not txt:
      return
    # keep order; map this write to the current event count
    _output.append({"stream": self.stream, "text": txt.rstrip("\\n"), "line": _current_line or None, "eventIndex": len(_events)})
  def flush(self):
    return

def _safe_repr(v):
  try:
    r = repr(v)
  except Exception:
    r = '<unrepr>'
  if r is None:
    r = ''
  r = str(r)
  if len(r) > MAX_REPR:
    r = r[:MAX_REPR-3] + '...'
  return r

def _ref_id(v):
  try:
    return 'py_' + str(id(v))
  except Exception:
    return None

def _is_heap_obj(v):
  return isinstance(v, (list, dict, tuple, set))

def _heap_object(v):
  rid = _ref_id(v)
  if rid is None:
    return None
  class_name = type(v).__name__
  props = []
  try:
    if isinstance(v, dict):
      i = 0
      for k, val in v.items():
        if i >= MAX_HEAP_ITEMS:
          break
        props.append({"name": _safe_repr(k), "value": _safe_repr(val), "type": "reference" if _is_heap_obj(val) else "primitive"})
        i += 1
    else:
      # list/tuple/set: enumerate
      i = 0
      for idx, val in enumerate(list(v)):
        if i >= MAX_HEAP_ITEMS:
          break
        props.append({"name": str(idx), "value": _safe_repr(val), "type": "reference" if _is_heap_obj(val) else "primitive"})
        i += 1
  except Exception:
    pass
  return {"id": rid, "className": class_name, "properties": props}

def _frame_locals(frame):
  out = []
  try:
    items = list(frame.f_locals.items())
  except Exception:
    items = []
  # stable-ish order
  try:
    items = sorted(items, key=lambda kv: str(kv[0]))
  except Exception:
    pass
  for i, (k, v) in enumerate(items):
    if i >= MAX_LOCALS:
      break
    if k is None:
      continue
    ks = str(k)
    if ks.startswith('__'):
      continue
    ref = _ref_id(v) if _is_heap_obj(v) else None
    out.append({"name": ks, "repr": _safe_repr(v), "refId": ref})
  return out

def _build_stack(frame):
  stack = []
  cur = frame
  depth = 0
  while cur is not None and depth < MAX_STACK:
    try:
      nm = cur.f_code.co_name
    except Exception:
      nm = '?' 
    try:
      ln = int(cur.f_lineno)
    except Exception:
      ln = 0
    stack.append({"name": nm or '?', "line": ln, "locals": _frame_locals(cur)})
    try:
      cur = cur.f_back
    except Exception:
      cur = None
    depth += 1
  return stack

def _collect_heap(stack_frames):
  seen = set()
  heap = []
  for fr in stack_frames:
    for v in fr.get('locals', []):
      rid = v.get('refId')
      if not rid or rid in seen:
        continue
      seen.add(rid)
      # We cannot reconstruct the object from id; so we rebuild from the repr/locals context best-effort.
  return heap

def _tracer(frame, event, arg):
  global _current_line
  try:
    if frame is None or frame.f_code is None or frame.f_code.co_filename != _USER_FILENAME:
      return _tracer
  except Exception:
    return _tracer
  if event == 'line':
    try:
      _current_line = int(frame.f_lineno)
    except Exception:
      _current_line = 0

    if len(_events) >= MAX_EVENTS:
      raise RuntimeError('Trace limit exceeded')

    st = _build_stack(frame)
    # heap objects: best-effort from locals (only the current frame's locals values we can access here)
    heap = []
    try:
      # gather from current frame only (fast)
      items = list(frame.f_locals.items())
      for k, v in items:
        if _is_heap_obj(v):
          ho = _heap_object(v)
          if ho is not None:
            heap.append(ho)
    except Exception:
      pass

    _events.append({"line": _current_line, "stack": st, "heap": heap})
  return _tracer

_orig_out = sys.stdout
_orig_err = sys.stderr
sys.stdout = _Stream('stdout')
sys.stderr = _Stream('stderr')

_globs = {}
_ok = True
_error = None
_err_line = None

sys.settrace(_tracer)
try:
  _code = compile(USER_CODE, _USER_FILENAME, 'exec')
  exec(_code, _globs, _globs)
except Exception as e:
  _ok = False
  try:
    _error = ''.join(traceback.format_exception_only(type(e), e)).strip()
  except Exception:
    _error = str(e)
  try:
    tb = traceback.extract_tb(e.__traceback__)
    best = None
    if tb and len(tb):
      for fr in tb:
        try:
          if getattr(fr, 'filename', None) == _USER_FILENAME:
            best = fr
        except Exception:
          pass
    if best is not None:
      _err_line = int(best.lineno)
    else:
      _err_line = _current_line or None
  except Exception:
    _err_line = _current_line or None
finally:
  try:
    sys.settrace(None)
  except Exception:
    pass
  sys.stdout = _orig_out
  sys.stderr = _orig_err

json.dumps({"ok": _ok, "events": _events, "output": _output, "error": _error, "line": _err_line})
`;

export async function runPythonTrace(code: string, opts?: { maxEvents?: number }): Promise<PythonTraceResult> {
  const py = await getPyodide();
  const maxEvents = typeof opts?.maxEvents === "number" ? opts.maxEvents : 2000;

  py.globals.set("USER_CODE", String(code || ""));
  py.globals.set("MAX_EVENTS", maxEvents);

  const raw = await py.runPythonAsync(PY_TRACE_DRIVER);
  const txt = typeof raw === "string" ? raw : String(raw);
  const parsed = JSON.parse(txt);

  return {
    ok: !!parsed.ok,
    events: Array.isArray(parsed.events) ? parsed.events : [],
    output: Array.isArray(parsed.output) ? parsed.output : [],
    error: parsed.error ? String(parsed.error) : undefined,
    line: typeof parsed.line === "number" ? parsed.line : undefined,
  };
}
