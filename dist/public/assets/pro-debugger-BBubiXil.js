const __vite__mapDeps=(i,m=__vite__mapDeps,d=(m.f||(m.f=["assets/index-DKbfUBq8.js","assets/index-P_V9OCG0.css"])))=>i.map(i=>d[i]);
import{c as $,u as Q,a as X,r as u,j as e,S as z,C as v,B as o,P as Y,R as Z,b as ee,T as se,d as te,e as y,f as w,L as I,g as ae,h as re,H as le,i as ne,k as oe,t as N,_ as ie}from"./index-DKbfUBq8.js";import{D as ce}from"./download-DmOic8GG.js";/**
 * @license lucide-react v0.545.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const de=[["path",{d:"M12 6v6h4",key:"135r8i"}],["circle",{cx:"12",cy:"12",r:"10",key:"1mglay"}]],me=$("clock-3",de);/**
 * @license lucide-react v0.545.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const xe=[["path",{d:"M4 22V4a1 1 0 0 1 .4-.8A6 6 0 0 1 8 2c3 0 5 2 7.333 2q2 0 3.067-.8A1 1 0 0 1 20 4v10a1 1 0 0 1-.4.8A6 6 0 0 1 16 16c-3 0-5-2-8-2a6 6 0 0 0-4 1.528",key:"1jaruq"}]],ue=$("flag",xe);let F=null,O=!1;const D=async()=>{if(O)throw new Error("Pyodide failed to load");if(!F)try{F=(await ie(()=>import("./index-DKbfUBq8.js").then(S=>S.v),__vite__mapDeps([0,1]))).getPyodideInstance}catch{throw O=!0,new Error("Unable to load Pyodide")}return F()};function he(){const{user:_}=Q(),[,S]=X(),b=_?.isPro||!1,[h,T]=u.useState(()=>{try{return parseInt(localStorage.getItem("profiler-usage")||"0",10)}catch{return 0}}),[r,c]=u.useState({isRunning:!1,isPaused:!1,currentFrame:0,frames:[],output:[],error:null}),[g,U]=u.useState(`def factorial(n):
    if n <= 1:
        return 1
    return n * factorial(n - 1)

def main():
    numbers = [1, 2, 3, 4, 5]
    total = 0
    results = {}
    for i in numbers:
      result = factorial(i)
      results[i] = result
      total += result
    print(f"Total: {total}")

main()`),[m,C]=u.useState([{line:10,condition:"total > 50"}]),[j,E]=u.useState(["total","i","numbers","results"]),[x,R]=u.useState(()=>{try{const s=localStorage.getItem("pro-debugger-profiler");return s?JSON.parse(s):[]}catch{return[]}}),B=(s,t)=>{try{return!!new Function(...Object.keys(t),`return ${s}`)(...Object.values(t))}catch{return!1}},V=async()=>{try{c(i=>({...i,isRunning:!0,isPaused:!1,frames:[],output:[],error:null}));const s=await D();s.runPython(`
import sys
import io
from contextlib import redirect_stdout

frames = []
output = []
call_stack = []
heap_objects = {}
object_counter = 0

def extract_heap():
    global heap_objects, object_counter
    heap = []
    for obj_id, obj_data in heap_objects.items():
        heap.append({
            'id': obj_id,
            'className': obj_data['className'],
            'properties': obj_data['properties']
        })
    return heap

def track_object(obj, var_name=''):
    global object_counter, heap_objects
    if isinstance(obj, (list, dict, set, tuple)) and len(str(obj)) < 500:
        obj_id = f"obj_{object_counter}"
        object_counter += 1
        
        if isinstance(obj, list):
            props = [{'name': f'[{i}]', 'value': repr(v)[:50]} for i, v in enumerate(obj[:10])]
            heap_objects[obj_id] = {'className': 'list', 'properties': props}
        elif isinstance(obj, dict):
            props = [{'name': str(k), 'value': repr(v)[:50]} for k, v in list(obj.items())[:10]]
            heap_objects[obj_id] = {'className': 'dict', 'properties': props}
        elif isinstance(obj, set):
            props = [{'name': f'{i}', 'value': repr(v)[:50]} for i, v in enumerate(list(obj)[:10])]
            heap_objects[obj_id] = {'className': 'set', 'properties': props}
        elif isinstance(obj, tuple):
            props = [{'name': f'[{i}]', 'value': repr(v)[:50]} for i, v in enumerate(obj[:10])]
            heap_objects[obj_id] = {'className': 'tuple', 'properties': props}
        return obj_id
    return None

def trace_calls(frame, event, arg):
    global call_stack, heap_objects
    if event == 'call':
        call_stack.append(frame.f_code.co_name)
    elif event == 'return':
        if call_stack:
            call_stack.pop()
    elif event == 'line':
        local_vars = {}
        heap_objects = {}
        
        for k, v in frame.f_locals.items():
      try:
        track_object(v, k)
        local_vars[k] = repr(v)[:120]
      except:
        local_vars[k] = '<object>'
        
        frames.append({
            'line': frame.f_lineno,
            'function': frame.f_code.co_name,
            'locals': local_vars,
            'stack': list(call_stack),
            'heap': extract_heap(),
            'timestamp': len(frames)
        })
    return trace_calls

output_buffer = io.StringIO()
`);const l=`
sys.settrace(trace_calls)
with redirect_stdout(output_buffer):
${g.split(`
`).map(i=>"    "+i).join(`
`)}
sys.settrace(None)
output = output_buffer.getvalue().split('\\n')
`;try{s.runPython(l)}catch(i){c(p=>({...p,isRunning:!1,error:`Execution error: ${i.message||String(i)}`}));return}const k=s.globals.get("frames"),d=s.globals.get("output"),f=k?k.toJs():[],P=d?d.toJs():[];let L=0;const M=f.findIndex(i=>m.some(p=>p.line===i.line&&(!p.condition||B(p.condition,i.locals))));M>=0&&(L=M),c(i=>({...i,isRunning:!1,frames:f||[],output:P.filter(p=>p.trim())||[],currentFrame:L}))}catch(s){c(t=>({...t,isRunning:!1,error:`Error loading Pyodide: ${s.message||String(s)}`})),console.error("[ProDebugger] Error:",s)}},n=r.frames[r.currentFrame],A=u.useMemo(()=>(n?.stack||[]).map((t,a,l)=>({id:`${a}-${t}`,name:t,variables:[],active:a===l.length-1})),[n]),J=u.useMemo(()=>n?j.map(s=>({name:s,value:String(n.locals?.[s]??"<undefined>")})):[],[n,j]),W=()=>{const t=(m[m.length-1]?.line||1)+1;C([...m,{line:t}])},H=async()=>{if(!b&&h>=1){N({title:"Pro Required",description:"Profiler Limit",variant:"destructive"});return}try{const s=await D(),t=[];for(let d=0;d<5;d++){const f=performance.now();s.runPython(g);const P=performance.now();t.push(Number((P-f).toFixed(2)))}if(R(t),localStorage.setItem("pro-debugger-profiler",JSON.stringify(t)),!b){const d=h+1;T(d),localStorage.setItem("profiler-usage",d.toString())}const a=(t.reduce((d,f)=>d+f,0)/t.length).toFixed(2),l=Math.min(...t).toFixed(2),k=Math.max(...t).toFixed(2);N({title:"Profiler Complete",description:`Average: ${a}ms | Min: ${l}ms | Max: ${k}ms`})}catch(s){N({title:"Profiler Error",description:s?.message||String(s)})}},q=()=>{const s={frames:r.frames,output:r.output,code:g,exportedAt:new Date().toISOString()},t=new Blob([JSON.stringify(s,null,2)],{type:"application/json"}),a=URL.createObjectURL(t),l=document.createElement("a");l.href=a,l.download="pro-debugger-snapshot.json",l.click(),URL.revokeObjectURL(a),N({title:"Snapshot exportado"})},G=async()=>{const s={frames:r.frames,output:r.output,code:g};await navigator.clipboard.writeText(JSON.stringify(s,null,2)),N({title:"Snapshot copiado"})},K=()=>{c(s=>({...s,currentFrame:Math.max(s.frames.length-1,0)}))};return e.jsxs("div",{className:"w-full max-w-6xl mx-auto p-6 space-y-6 bg-slate-900/60 rounded-3xl border border-slate-700 shadow-sm",children:[e.jsxs("div",{className:"flex flex-col gap-2",children:[e.jsxs("div",{className:"inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-500/15 border border-amber-400/40 text-amber-200 text-xs font-semibold w-fit",children:[e.jsx(z,{className:"w-4 h-4"})," Pro Debugger - Passo a passo + Snapshots"]}),e.jsx("h1",{className:"text-3xl font-bold text-white",children:"Visual Debugger Dourado"}),e.jsx("p",{className:"text-sm text-amber-100/90",children:"Breakpoints condicionais, watch de variaveis, pilha de chamadas, output, export e profiler."})]}),e.jsxs("div",{className:"grid grid-cols-1 xl:grid-cols-3 gap-6",children:[e.jsxs(v,{className:"p-4 bg-slate-900/60 border border-slate-700 rounded-xl shadow-sm xl:col-span-1",children:[e.jsxs("div",{className:"flex items-center justify-between mb-3",children:[e.jsx("h2",{className:"text-lg font-semibold text-white",children:"Code"}),e.jsxs("div",{className:"flex gap-2",children:[e.jsxs(o,{size:"sm",className:"bg-blue-600 hover:bg-blue-700 text-white",onClick:V,disabled:r.isRunning,children:[e.jsx(Y,{className:"w-4 h-4"})," Run"]}),e.jsxs(o,{size:"sm",variant:"outline",onClick:()=>c(s=>({...s,currentFrame:0,frames:[],output:[],error:null})),children:[e.jsx(Z,{className:"w-4 h-4"})," Reset"]})]})]}),e.jsx("textarea",{value:g,onChange:s=>U(s.target.value),className:"w-full h-72 p-3 border rounded-lg font-mono text-sm bg-black/60 text-slate-100 border-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-400/60",placeholder:"Write your Python code here..."}),e.jsxs("div",{className:"grid sm:grid-cols-2 gap-3 mt-4",children:[e.jsxs(v,{className:"p-3 bg-black/30 border border-slate-700",children:[e.jsxs("div",{className:"flex items-center justify-between mb-2",children:[e.jsxs("span",{className:"text-sm font-semibold text-slate-200 flex items-center gap-2",children:[e.jsx(ue,{className:"w-4 h-4"})," Breakpoints"]}),e.jsx(o,{size:"sm",variant:"outline",className:"border-slate-600 text-slate-200",onClick:W,children:"+ linha"})]}),e.jsxs("div",{className:"space-y-2 max-h-32 overflow-y-auto",children:[m.map((s,t)=>e.jsxs("div",{className:"flex items-center gap-2 text-xs",children:[e.jsx("input",{type:"number",value:s.line,onChange:a=>{const l=[...m];l[t]={...s,line:Number(a.target.value)},C(l)},className:"w-16 bg-black/50 border border-slate-700 rounded px-2 py-1 text-slate-200"}),e.jsx("input",{type:"text",placeholder:"optional condition",value:s.condition||"",onChange:a=>{const l=[...m];l[t]={...s,condition:a.target.value},C(l)},className:"flex-1 bg-black/50 border border-slate-700 rounded px-2 py-1 text-slate-200"})]},t)),m.length===0&&e.jsx("div",{className:"text-slate-300 text-xs",children:"Nenhum breakpoint."})]})]}),e.jsxs(v,{className:"p-3 bg-black/30 border border-slate-700",children:[e.jsxs("div",{className:"flex items-center justify-between mb-2",children:[e.jsxs("span",{className:"text-sm font-semibold text-slate-200 flex items-center gap-2",children:[e.jsx(z,{className:"w-4 h-4"})," Watch"]}),e.jsx(o,{size:"sm",variant:"outline",className:"border-slate-600 text-slate-200",onClick:()=>E(s=>[...s,"novaVar"]),children:"+ var"})]}),e.jsxs("div",{className:"space-y-2 max-h-32 overflow-y-auto",children:[j.map((s,t)=>e.jsxs("div",{className:"flex items-center gap-2 text-xs",children:[e.jsx("input",{value:s,onChange:a=>{const l=[...j];l[t]=a.target.value,E(l)},className:"flex-1 bg-black/50 border border-slate-700 rounded px-2 py-1 text-slate-200"}),e.jsx("span",{className:"text-amber-300 font-mono",children:n?String(n.locals?.[s]??"-"):"-"})]},t)),j.length===0&&e.jsx("div",{className:"text-slate-300 text-xs",children:"Sem watch."})]})]})]})]}),e.jsxs(v,{className:"p-4 bg-slate-900/60 border border-slate-700 rounded-xl shadow-sm xl:col-span-2",children:[e.jsxs("div",{className:"flex flex-col lg:flex-row lg:items-center lg:justify-between gap-3 mb-3",children:[e.jsxs("div",{className:"space-y-1",children:[e.jsx("h2",{className:"text-lg font-semibold text-white",children:"Estado da Execucao"}),e.jsx("p",{className:"text-xs text-amber-100/80",children:"Navegue por passos, stack e output; exporte snapshot."})]}),e.jsxs("div",{className:"flex flex-wrap gap-2",children:[e.jsxs(o,{size:"sm",variant:"outline",className:"border-slate-600 text-slate-200",onClick:q,children:[e.jsx(ce,{className:"w-4 h-4"})," Exportar JSON"]}),e.jsxs(o,{size:"sm",variant:"outline",className:"border-slate-600 text-slate-200",onClick:G,children:[e.jsx(ee,{className:"w-4 h-4"})," Copiar snapshot"]})]})]}),e.jsxs(se,{defaultValue:"variables",className:"w-full",children:[e.jsxs(te,{className:"grid w-full grid-cols-4 bg-black/30 border border-slate-700",children:[e.jsx(y,{value:"variables",children:"Variaveis"}),e.jsx(y,{value:"stack",children:"Stack"}),e.jsx(y,{value:"output",children:"Output"}),e.jsx(y,{value:"heap",children:"Heap"})]}),e.jsxs(w,{value:"variables",className:"space-y-2 mt-3 relative",children:[!b&&e.jsx("div",{className:"absolute inset-0 bg-black/70 backdrop-blur-sm rounded-lg z-10 flex items-center justify-center",children:e.jsxs(v,{className:"p-6 bg-slate-900/90 border border-slate-700 shadow-xl max-w-sm text-center",children:[e.jsx(I,{className:"w-12 h-12 text-amber-400 mx-auto mb-3"}),e.jsx("h4",{className:"text-xl font-bold text-white mb-2",children:"Pro Feature"}),e.jsx("p",{className:"text-amber-100/80 text-sm mb-4",children:"Variable Inspector Pro"}),e.jsxs(o,{size:"sm",className:"bg-blue-600 hover:bg-blue-700 text-white font-semibold",onClick:()=>S("/pro"),children:[e.jsx(ae,{className:"w-4 h-4 mr-2"}),"Upgrade to Pro"]})]})}),n?e.jsxs("div",{className:"space-y-3 bg-black/40 p-4 rounded-lg border border-slate-700",children:[e.jsxs("div",{className:"flex items-center justify-between text-sm text-slate-200",children:[e.jsxs("span",{children:["📍 Linha ",n.line," em ",e.jsxs("span",{className:"font-mono",children:[n.function,"()"]})]}),e.jsxs("span",{className:"text-xs text-amber-200/80",children:["Passo ",r.currentFrame+1," / ",r.frames.length]})]}),e.jsx("div",{className:"grid md:grid-cols-2 gap-2",children:Object.entries(n.locals||{}).map(([s,t])=>e.jsxs("div",{className:"text-sm font-mono flex justify-between bg-slate-900/80 p-2 rounded border border-slate-700 text-slate-200",children:[e.jsx("span",{className:"font-semibold text-blue-300",children:s}),e.jsx("span",{className:"text-slate-100 truncate",children:String(t)})]},s))}),Object.keys(n.locals||{}).length===0&&e.jsx("p",{className:"text-sm text-slate-300",children:"Sem variaveis locais"}),e.jsxs("div",{className:"bg-slate-800/80 border border-slate-700 rounded-lg p-3",children:[e.jsx("div",{className:"text-xs uppercase tracking-wide text-slate-200 mb-2",children:"Watch"}),e.jsx("div",{className:"grid sm:grid-cols-2 gap-2",children:J.map(s=>e.jsxs("div",{className:"flex items-center justify-between text-sm font-mono bg-black/40 border border-slate-700 rounded px-2 py-1 text-slate-200",children:[e.jsx("span",{className:"text-blue-300",children:s.name}),e.jsx("span",{children:s.value})]},s.name))})]})]}):e.jsx("p",{className:"text-sm text-slate-300",children:"Execute o codigo para ver variaveis"})]}),e.jsx(w,{value:"stack",className:"mt-3",children:e.jsxs("div",{className:"bg-black/40 border border-slate-700 rounded-lg p-3 grid md:grid-cols-2 gap-4",children:[e.jsxs("div",{children:[e.jsx("div",{className:"text-sm text-amber-100 mb-2",children:"Timeline de passos"}),e.jsxs("div",{className:"max-h-64 overflow-y-auto space-y-1",children:[r.frames.map((s,t)=>e.jsxs("button",{onClick:()=>c(a=>({...a,currentFrame:t})),className:`w-full text-left text-xs p-2 rounded font-mono transition ${t===r.currentFrame?"bg-blue-600 text-white":"bg-slate-900/80 border border-slate-700 text-slate-200 hover:bg-slate-800"}`,children:["L",s.line," ",s.function,"()",s.stack&&s.stack.length>0&&e.jsxs("span",{className:"ml-2 text-slate-300",children:["[",s.stack.join(" » "),"]"]})]},t)),r.frames.length===0&&e.jsx("div",{className:"text-xs text-slate-300",children:"Sem passos."})]})]}),e.jsx("div",{className:"border-l border-slate-700 pl-3",children:e.jsx(re,{stack:A})})]})}),e.jsx(w,{value:"output",className:"mt-3",children:e.jsxs("div",{className:"bg-black/40 border border-slate-700 rounded-lg p-3 font-mono text-sm h-48 overflow-y-auto",children:[r.output&&r.output.length>0?e.jsx("div",{className:"space-y-1 text-slate-200",children:r.output.map((s,t)=>e.jsx("div",{children:s},t))}):e.jsx("p",{className:"text-slate-300",children:r.frames.length>0?"Nenhum output":"Execute para ver output"}),r.error&&e.jsxs("div",{className:"text-red-400 mt-2 font-semibold",children:["❌ ",r.error]})]})}),e.jsx(w,{value:"heap",className:"mt-3",children:e.jsx("div",{className:"bg-black/40 border border-slate-700 rounded-lg p-3",children:e.jsx(le,{heap:(n?.heap||[]).map((s,t)=>({id:s.id,className:s.className,properties:s.properties.map(a=>({name:a.name,value:a.value,type:typeof a.value=="object"&&a.value!==null?"reference":"primitive",changed:!1})),highlight:t===0}))})})})]}),e.jsxs("div",{className:"flex flex-wrap gap-2 mt-4",children:[e.jsxs(o,{variant:"outline",size:"sm",onClick:()=>c(s=>({...s,currentFrame:0})),disabled:r.currentFrame===0,children:[e.jsx(ne,{className:"w-4 h-4"})," Inicio"]}),e.jsx(o,{variant:"outline",size:"sm",onClick:()=>c(s=>({...s,currentFrame:Math.max(0,s.currentFrame-1)})),disabled:r.currentFrame===0,children:"Passo ←"}),e.jsx(o,{variant:"outline",size:"sm",onClick:()=>c(s=>({...s,currentFrame:Math.min(s.frames.length-1,s.currentFrame+1)})),disabled:r.currentFrame>=r.frames.length-1,children:"Passo →"}),e.jsxs(o,{variant:"outline",size:"sm",onClick:K,disabled:r.frames.length===0,children:[e.jsx(oe,{className:"w-4 h-4"})," Final"]})]}),e.jsxs("div",{className:"mt-4 p-3 rounded-lg bg-slate-800/80 border border-slate-700 relative",children:[!b&&h>=1&&e.jsx("div",{className:"absolute inset-0 bg-black/80 backdrop-blur-sm rounded-lg z-10 flex items-center justify-center",children:e.jsxs("div",{className:"text-center",children:[e.jsx(I,{className:"w-10 h-10 text-amber-400 mx-auto mb-2"}),e.jsx("p",{className:"text-amber-100 text-sm font-semibold",children:"Profiler Locked"}),e.jsxs("p",{className:"text-amber-200/70 text-xs mt-1",children:[h,"/1 ","Free Runs Used"]})]})}),e.jsxs("div",{className:"flex items-center justify-between mb-2",children:[e.jsxs("div",{className:"flex items-center gap-2 text-slate-200",children:[e.jsx(me,{className:"w-4 h-4"})," ","Profiler"," (5 ","Executions",")",!b&&e.jsxs("span",{className:"ml-2 px-2 py-0.5 bg-blue-500/20 text-blue-200 text-xs rounded",children:["(",1-h," ","Free Left",")"]})]}),e.jsxs("div",{className:"flex gap-2",children:[e.jsx(o,{size:"sm",className:"bg-blue-600 hover:bg-blue-700 text-white",onClick:H,disabled:!b&&h>=1,children:"Run Profiler"}),x.length>0&&e.jsx(o,{size:"sm",variant:"outline",className:"border-slate-600 text-slate-200",onClick:()=>{R([]),localStorage.removeItem("pro-debugger-profiler")},children:"Clear"})]})]}),x.length>0?e.jsxs("div",{className:"space-y-3",children:[e.jsx("div",{className:"flex items-end gap-2 h-20 bg-black/30 p-3 rounded-lg",children:x.map((s,t)=>{const a=Math.max(...x),l=s/a*60;return e.jsxs("div",{className:"flex flex-col items-center flex-1 gap-1",children:[e.jsxs("div",{className:"text-slate-200 text-[10px] font-mono",children:[s,"ms"]}),e.jsx("div",{className:"w-full bg-gradient-to-t from-blue-400 to-blue-600 rounded-t transition-all duration-300",style:{height:`${l}px`},title:`Execucao ${t+1}: ${s}ms`}),e.jsxs("div",{className:"text-slate-300 text-[10px]",children:["#",t+1]})]},t)})}),e.jsxs("div",{className:"grid grid-cols-3 gap-3 text-xs",children:[e.jsxs("div",{className:"bg-black/30 p-2 rounded border border-slate-700",children:[e.jsx("div",{className:"text-slate-300 mb-1",children:"Media"}),e.jsxs("div",{className:"text-slate-200 font-mono font-semibold",children:[(x.reduce((s,t)=>s+t,0)/x.length).toFixed(2)," ms"]})]}),e.jsxs("div",{className:"bg-black/30 p-2 rounded border border-slate-700",children:[e.jsx("div",{className:"text-slate-300 mb-1",children:"Minimo"}),e.jsxs("div",{className:"text-slate-200 font-mono font-semibold",children:[Math.min(...x).toFixed(2)," ms"]})]}),e.jsxs("div",{className:"bg-black/30 p-2 rounded border border-slate-700",children:[e.jsx("div",{className:"text-slate-300 mb-1",children:"Maximo"}),e.jsxs("div",{className:"text-slate-200 font-mono font-semibold",children:[Math.max(...x).toFixed(2)," ms"]})]})]})]}):e.jsx("div",{className:"text-center text-slate-300 text-sm py-4",children:"Execute o profiler para ver estatisticas de performance"})]})]})]})]})}export{he as ProDebugger};
