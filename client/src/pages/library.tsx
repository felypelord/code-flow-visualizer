import React, { useEffect, useMemo, useState } from "react";
import Layout from "@/components/layout";
import { BookOpen, Star, Printer, Search } from "lucide-react";
import { exercises } from "@/lib/exercises-new";

// Card storage helpers (module scope)
const loadAllCards = (): Record<string, any[]> => {
  try { return JSON.parse(localStorage.getItem('library:cards') || '{}'); } catch { return {}; }
};
const saveAllCards = (data: Record<string, any[]>) => { try { localStorage.setItem('library:cards', JSON.stringify(data)); } catch {} };

const loadStats = (): Record<string, any> => { try { return JSON.parse(localStorage.getItem('library:cardstats') || '{}'); } catch { return {}; } };
const saveStats = (s: Record<string, any>) => { try { localStorage.setItem('library:cardstats', JSON.stringify(s)); } catch {} };

export default function LibraryPage() {
  const [filter, setFilter] = useState<"all" | "Beginner" | "Intermediate" | "Advanced">("all");
  const [query, setQuery] = useState("");
  const [bookmarks, setBookmarks] = useState<Record<string, boolean>>({});

  useEffect(() => {
    try {
      const raw = localStorage.getItem("library:bookmarks");
      if (raw) setBookmarks(JSON.parse(raw));
    } catch {}
  }, []);

  // set page meta for export / PDF friendliness
  useEffect(() => {
    document.title = 'Library — Cheatsheet & Reference';
    let m = document.querySelector('meta[name="description"]');
    if (!m) {
      m = document.createElement('meta');
      m.setAttribute('name','description');
      document.head.appendChild(m);
    }
    m.setAttribute('content', 'Compact programming cheatsheet, snippets and patterns for JS, Python, Java and C#. Printable one-page view included.');
  }, []);

  useEffect(() => {
    try {
      localStorage.setItem("library:bookmarks", JSON.stringify(bookmarks));
    } catch {}
  }, [bookmarks]);

  const topics = useMemo(() => ([
    { id: "variables", title: "1 — Variables & Data Types", emoji: "🔢", level: "Beginner" },
    { id: "functions", title: "2 — Functions & Procedures", emoji: "🛠️", level: "Beginner" },
    { id: "control-flow", title: "3 — Control Flow (Conditionals & Loops)", emoji: "🔁", level: "Beginner" },
    { id: "data-structures", title: "4 — Data Structures & Collections", emoji: "🗂️", level: "Beginner" },
    { id: "oop", title: "5 — Object-Oriented Programming", emoji: "🏗️", level: "Intermediate" },
    { id: "errors", title: "6 — Error Handling & Debugging", emoji: "🐞", level: "Beginner" },
    { id: "async", title: "7 — Asynchronous Programming", emoji: "⏳", level: "Intermediate" },
    { id: "testing", title: "8 — Testing & Quality", emoji: "✅", level: "Intermediate" },
  ]), []);

  const visibleTopics = topics.filter(t => (filter === "all" || t.level === filter) && (query.trim() === "" || `${t.title} ${t.emoji}`.toLowerCase().includes(query.toLowerCase())));

  const toggleBookmark = (id: string) => setBookmarks(prev => ({ ...prev, [id]: !prev[id] }));

  

  return (
    <Layout>
      <div id="library-root" style={{
        background: 'linear-gradient(180deg, var(--color-card), var(--color-background))',
        padding: 28,
        borderRadius: 12,
        boxShadow: '0 12px 40px rgba(2,6,23,0.6)',
        border: '1px solid var(--color-border)',
        maxWidth: 1120,
        margin: '0 auto'
      }}>

        <style>{`
          :root { --accent-gold: #d4af37; --muted-gold: #c9a94a; }
          /* language badge & lightweight token styling */
          pre[data-lang] { position: relative; padding-top: 28px; }
          pre[data-lang]::before { content: attr(data-lang); position: absolute; top: 6px; left: 10px; background: rgba(0,0,0,0.2); color: #fff; padding: 4px 8px; border-radius: 6px; font-size: 12px; text-transform: uppercase; letter-spacing: .6px; }
          pre .kw { color: #7fc1ff; font-weight: 600; }
          pre .str { color: #ffcc99; }
          pre .num { color: #ffb86b; }
          pre { box-sizing: border-box; display: block; width: 100%; white-space: pre-wrap; word-break: break-word; }
          .card { background: var(--color-card); border: 1px solid var(--color-border); padding: 12px; border-radius: 8px; }
          /* responsive: stack aside above content on narrow screens to avoid overlap */
          .library-flex { display: flex; gap: 20px; }
          @media (max-width: 900px) {
            .library-flex { flex-direction: column; }
            .library-flex aside { position: static !important; width: 100% !important; }
          }
          pre[data-lang]::before { z-index: 3; }
          .print-only { display: none; }
          /* Layout and typographic tuning for screen */
          #library-root h1 { font-size: 22px; margin-bottom: 4px; }
          #library-root h2 { font-size: 18px; color: var(--accent-gold); margin: 6px 0; }
          #library-root h3 { font-size: 16px; color: var(--accent-gold); margin: 6px 0; }
          #library-root h4 { font-size: 14px; color: var(--muted-gold); margin: 6px 0; }
          #library-root p { font-size: 15px; color: var(--color-foreground); line-height: 1.5; }
          #library-root pre { font-size: 13px; font-family: Menlo, Monaco, 'Courier New', monospace; line-height: 1.45; background: #061217; color: #f3e9c8; padding: 10px; border-radius: 6px; }
          #library-root article { padding: 14px; border-radius: 10px; }
          #library-root section { border-top: 1px solid rgba(212,175,55,0.04); padding-top: 12px; margin-top: 12px; }
          #library-root .card { background: var(--color-card); border: 1px solid var(--color-border); padding: 10px; border-radius: 8px; }
          /* Smaller controls */
          #library-root input { font-size: 14px; }
          #library-root button { font-size: 14px; }

          @media print {
            body * { visibility: hidden !important; }
            #library-root, #library-root * { visibility: visible !important; }
            #library-root { position: static !important; top: 0; left: 0; width: 100% !important; box-shadow: none !important; background: white !important; }
            aside, .no-print, button.no-print, input { display: none !important; }
            /* ensure topics break cleanly between pages when printing */
            article, section { page-break-inside: avoid; page-break-after: always; }
            header, footer { display: block; }
            pre { background: #fff !important; box-shadow: none !important; border: 1px solid #ddd !important; }
            .print-only { display: block !important; }
            /* condensed print sizing */
            #library-root h1 { font-size: 18px; }
            #library-root p, #library-root li { font-size: 12px; }
            #library-root pre { font-size: 11px; }
          }
        `}</style>

        <header style={{ display: "flex", gap: 16, alignItems: "center", marginBottom: 20 }}>
          <div style={{ width: 80, height: 80, borderRadius: 12, background: "linear-gradient(135deg,#071629,#091b2d)", display: "flex", alignItems: "center", justifyContent: "center", boxShadow: "0 8px 22px rgba(2,6,23,0.65)", border: '1px solid rgba(212,175,55,0.12)' }}>
            <BookOpen color="#d4af37" size={44} />
          </div>
          <div>
            <h1 style={{ margin: 0, fontSize: 28, color: 'var(--color-foreground)', textShadow: '0 1px 0 rgba(0,0,0,0.25)'}}>Library</h1>
            <p style={{ margin: 0, color: "var(--color-muted-foreground)" }}>A polished, complete programming guide — from basics to advanced, with examples in JavaScript, Python, Java and C#.</p>
          </div>
        </header>

        <section style={{ marginBottom: 28 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <h2 style={{ margin: 0 }}>Welcome 👋</h2>
              <p style={{ margin: 0, color: '#3f2f15' }}>
                This Library is a single-page programming encyclopedia made to teach concepts, patterns and practical applications.
                Use the left menu to jump between topics, filter by level, search and bookmark sections for later.
              </p>
            </div>
            <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, background: 'var(--color-popover)', padding: '6px 10px', borderRadius: 8, border: '1px solid var(--color-border)' }}>
                  <Search className="text-blue-300" />
                  <input value={query} onChange={e => setQuery(e.target.value)} placeholder="Search topics" style={{ border: 'none', outline: 'none', background: 'transparent', color: 'var(--color-foreground)' }} />
                </div>
                <button onClick={() => window.print()} className="no-print" style={{ display: 'inline-flex', gap: 8, alignItems: 'center', background: 'linear-gradient(90deg,#b88b3a,#d4af37)', border: 'none', padding: '8px 12px', borderRadius: 10, color: '#08101b' }}><Printer /> Print Cheatsheet</button>
                <button onClick={() => window.print()} className="no-print" style={{ display: 'inline-flex', gap: 8, alignItems: 'center', background: 'transparent', border: '1px solid rgba(212,175,55,0.12)', padding: '8px 12px', borderRadius: 10, marginLeft: 8, color: 'var(--color-foreground)' }}><Printer /> Export PDF (use Print dialog)</button>
              </div>
          </div>
        </section>

            <div className="library-flex" style={{ gap: 20 }}>
          <aside style={{ width: 260, minWidth: 220, position: 'sticky', top: 96, alignSelf: 'flex-start' }}>
            <div style={{ padding: 12, borderRadius: 10, background: 'var(--color-card)', border: '1px solid var(--color-border)' }}>
              <div style={{ fontWeight: 700, marginBottom: 8, color: 'var(--color-foreground)' }}>Contents</div>
              <div style={{ display: 'flex', gap: 6, marginBottom: 10 }}>
                <button onClick={() => setFilter('all')} className={filter === 'all' ? 'font-bold text-blue-300' : 'text-muted-foreground'}>All</button>
                <button onClick={() => setFilter('Beginner')} className={filter === 'Beginner' ? 'font-bold text-blue-300' : 'text-muted-foreground'}>Beginner</button>
                <button onClick={() => setFilter('Intermediate')} className={filter === 'Intermediate' ? 'font-bold text-blue-300' : 'text-muted-foreground'}>Intermediate</button>
                <button onClick={() => setFilter('Advanced')} className={filter === 'Advanced' ? 'font-bold text-blue-300' : 'text-muted-foreground'}>Advanced</button>
              </div>
                  <nav>
                {topics.map(t => (
                  <div key={t.id} style={{ display: visibleTopics.some(v => v.id === t.id) ? 'block' : 'none', marginBottom: 6 }}>
                    <a href={`#${t.id}`} style={{ color: bookmarks[t.id] ? 'var(--color-primary)' : 'var(--color-foreground)', textDecoration: 'none' }}>{t.emoji} {t.title}</a>
                    <button onClick={() => toggleBookmark(t.id)} style={{ float: 'right', background: 'transparent', border: 'none' }} title="Bookmark">
                      <Star color={bookmarks[t.id] ? 'var(--color-primary)' : 'var(--color-muted-foreground)'} size={14} />
                    </button>
                  </div>
                ))}
                  </nav>
            </div>
          </aside>

          <div style={{ flex: 1, minWidth: 0 }}>

        <Topic id="variables" level="Beginner" title="1 — Variables & Data Types" emoji="🔢" miniTOC={[{anchor:'variables-js',title:'JavaScript'},{anchor:'variables-py',title:'Python'},{anchor:'variables-java',title:'Java'},{anchor:'variables-csharp',title:'C#'}]}>
          <p style={{ fontSize: 18, lineHeight: 1.6 }}>
            Variables are named containers for values. They let programs hold and manipulate data. Below are the common declaration patterns and best practices you will use every day.
          </p>
          <p style={{ marginTop: 10, fontSize: 16, lineHeight: 1.6 }}>
            JavaScript: use `const` for values that won't be reassigned, `let` for block-scoped mutable values, and avoid `var`. JavaScript is dynamically typed; prefer clear naming and add runtime checks or TypeScript for larger codebases.
          </p>
          <h4 id="variables-js">JavaScript</h4>
          <pre data-lang="js" style={{ background: '#071424', color: '#f3e9c8', padding: 12, borderRadius: 8, border: '1px solid rgba(212,175,55,0.06)', overflowX: 'auto', maxWidth: '100%' }}>
{`// JS
const count = 10;
let name = "Alice";
let active = true;`}
          </pre>

          <p style={{ marginTop: 10, fontSize: 16, lineHeight: 1.6 }}>
            Python: assignment is simple (`x = 1`). Use type hints (`x: int = 1`) when helpful and prefer immutable tuples for fixed collections. `None` is the canonical empty value.
          </p>
          <h4 id="variables-py">Python</h4>
          <pre data-lang="py" style={{ background: '#071424', color: '#f3e9c8', padding: 12, borderRadius: 8, border: '1px solid rgba(212,175,55,0.06)', overflowX: 'auto', maxWidth: '100%' }}>
{`# Python
count = 10
name = "Alice"
active = True`}
          </pre>

          <p style={{ marginTop: 10, fontSize: 16, lineHeight: 1.6 }}>
            Java and C#: statically typed. Declare variables with types (e.g. `int`, `String`/`string`). Favor immutability (final/readonly) for shared data and use small, focused types.
          </p>
          <h4 id="variables-java">Java</h4>
          <pre data-lang="java" style={{ background: '#071424', color: '#f3e9c8', padding: 12, borderRadius: 8, border: '1px solid rgba(212,175,55,0.06)', overflowX: 'auto', maxWidth: '100%' }}>
{`// Java
int count = 10;
String name = "Alice";
boolean active = true;`}
          </pre>
          <h4 id="variables-csharp">C#</h4>
          <pre data-lang="c#" style={{ background: '#071424', color: '#f3e9c8', padding: 12, borderRadius: 8, border: '1px solid rgba(212,175,55,0.06)', overflowX: 'auto', maxWidth: '100%' }}>
{`// C#
int count = 10;
string name = "Alice";
bool active = true;`}
          </pre>
        </Topic>
        {/* flashcards removed per user request */}

        <Topic id="functions" level="Beginner" title="2 — Functions & Procedures" emoji="🛠️" miniTOC={[{anchor:'functions-analogy',title:'Analogy'},{anchor:'functions-js',title:'JavaScript'},{anchor:'functions-py',title:'Python'},{anchor:'functions-java',title:'Java'},{anchor:'functions-csharp',title:'C#'}]}>
          <p>
            Functions are reusable pieces of code that perform a task. They accept inputs (parameters) and often return outputs. Use them to break problems into smaller parts.
          </p>

          <h4>Analogy</h4>
          <p>Think of a function as a small kitchen appliance: you give it ingredients and settings, it returns a result.</p>
          <p style={{ marginTop: 8 }}>{`Common patterns:
JavaScript: regular function and arrow functions (() => {}); prefer small, single-purpose functions.
Python: def with optional type hints; use keyword arguments for clarity in long parameter lists.
Java / C#: methods on classes; prefer pure functions for logic and methods for behavior on objects.`}</p>

          <h4 id="functions-js">JavaScript</h4>
            <pre data-lang="js" style={{ background: '#071424', color: '#f3e9c8', padding: 12, borderRadius: 8, border: '1px solid rgba(212,175,55,0.06)', overflowX: 'auto', maxWidth: '100%' }}>
{`function sum(a, b) {
  return a + b;
}`}
          </pre>

          <h4 id="functions-py">Python</h4>
            <pre data-lang="py" style={{ background: '#071424', color: '#f3e9c8', padding: 12, borderRadius: 8, border: '1px solid rgba(212,175,55,0.06)', overflowX: 'auto', maxWidth: '100%' }}>
{`def sum(a, b):
    return a + b`}
          </pre>

          <h4 id="functions-java">Java</h4>
            <pre data-lang="java" style={{ background: '#071424', color: '#f3e9c8', padding: 12, borderRadius: 8, border: '1px solid rgba(212,175,55,0.06)', overflowX: 'auto', maxWidth: '100%' }}>
      {`public static int sum(int a, int b) {
        return a + b;
      }`}
            </pre>

          <h4 id="functions-csharp">C#</h4>
            <pre data-lang="c#" style={{ background: '#071424', color: '#f3e9c8', padding: 12, borderRadius: 8, border: '1px solid rgba(212,175,55,0.06)', overflowX: 'auto', maxWidth: '100%' }}>
      {`static int Sum(int a, int b) {
        return a + b;
      }`}
            </pre>
        </Topic>
        {/* flashcards removed per user request */}

        <Topic id="control-flow" level="Beginner" title="3 — Control Flow (Conditionals & Loops)" emoji="🔁">
          <p>
            Control flow decides which instructions run and when. Conditionals choose paths (if/else). Loops repeat work (for, while).
          </p>
          <p style={{ marginTop: 8 }}>
            Best practices: prefer early returns/guard clauses to reduce nesting, use descriptive boolean variables for complex conditions, and choose the appropriate loop (for-each vs index loop) for clarity. In JS, use `for...of` for arrays and `for...in` carefully (object keys).
          </p>

          <h4 id="control-flow-example">Example (JS)</h4>
          <pre data-lang="js" style={{ background: '#071424', color: '#f3e9c8', padding: 12, borderRadius: 8, border: '1px solid rgba(212,175,55,0.06)', overflowX: 'auto', maxWidth: '100%' }}>
{`for (let i = 0; i < 5; i++) {
  console.log(i);
}

if (score >= 60) {
  console.log('pass');
}`}
          </pre>
        </Topic>
        {/* flashcards removed per user request */}

        <Topic id="data-structures" level="Beginner" title="4 — Data Structures & Collections" emoji="🗂️">
          <p>
            Arrays, lists, maps/dictionaries and sets are ways to group values. Each has different performance and use-cases.
          </p>
          <p style={{ marginTop: 8 }}>
            Common structures you will use often:
            Arrays / Lists (ordered collections), Maps / Dictionaries (key-value lookups), Sets (unique items), and Tuples/Records (fixed groups). Choose based on access patterns: index access vs lookup vs membership.
          </p>

          <h4 id="data-structures-quick">Quick examples</h4>
          <pre data-lang="js" style={{ background: '#071424', color: '#f3e9c8', padding: 12, borderRadius: 8, border: '1px solid rgba(212,175,55,0.06)', overflowX: 'auto', maxWidth: '100%' }}>
{`// JS: array and object
const nums = [1,2,3];
const user = { name: 'Ana', age: 30 };`}
          </pre>
          <pre data-lang="py" style={{ background: '#071424', color: '#f3e9c8', padding: 12, borderRadius: 8, border: '1px solid rgba(212,175,55,0.06)', overflowX: 'auto', maxWidth: '100%' }}>
{`# Python: list and dict
nums = [1,2,3]
user = {'name': 'Ana', 'age': 30}`}
          </pre>
        </Topic>
        {/* flashcards removed per user request */}

        <Topic id="oop" level="Intermediate" title="5 — Object-Oriented Programming" emoji="🏗️">
          <p>
            OOP organizes code around objects with state (attributes) and behavior (methods). Use classes for modeling domain concepts, prefer composition over inheritance in many cases, and keep object responsibilities small.
          </p>
          <p style={{ marginTop: 8 }}>
            Key ideas: encapsulation (hide internals), single responsibility (one reason to change), composition (building objects from smaller parts), and clear public APIs for objects.
          </p>

          <h4 id="oop-class">Simple class (JavaScript)</h4>
          <pre style={{ background: '#071424', color: '#f3e9c8', padding: 12, borderRadius: 8, border: '1px solid rgba(212,175,55,0.06)', overflowX: 'auto', maxWidth: '100%' }}>
{`class Car {
  constructor(model) { this.model = model; }
  drive() { console.log('vroom'); }
}`}
          </pre>
        </Topic>
        {/* flashcards removed per user request */}

        <Topic id="errors" level="Beginner" title="6 — Error Handling & Debugging" emoji="🐞" miniTOC={[{anchor:'errors-debug',title:'Debugging Tips'}]}>
          <p>
            Errors happen. Learn to read stack traces, use logs and breakpoints. Handle expected errors with try/catch and validate inputs. Prefer failing fast early with clear error messages.
          </p>
          <h4 id="errors-debug">Debugging tips</h4>
          <p style={{ marginTop: 8 }}>
            Debugging tips: reproduce in small steps, add logging (structured when helpful), use a debugger to inspect stack frames and variables, and write tests that cover error cases.
          </p>
        </Topic>
        {/* flashcards removed per user request */}

        <Topic id="async" level="Intermediate" title="7 — Asynchronous Programming" emoji="⏳">
          <p>
            Modern apps rely on async I/O. Understand callbacks, promises/futures and async/await. Use them to avoid blocking the main thread and to compose concurrent work.
          </p>
          <p style={{ marginTop: 8 }}>
            Common patterns:
            JavaScript: Promises and async/await; avoid unhandled promise rejections and prefer `async` functions for readability.
            Python: `asyncio` and `await` for concurrency; use threads/processes for CPU-bound work.
            Java/C#: CompletableFuture / Task-based APIs and libraries for async operations.
          </p>
        </Topic>
        {/* flashcards removed per user request */}

        <Topic id="testing" level="Intermediate" title="8 — Testing & Quality" emoji="✅" miniTOC={[{anchor:'testing-tools',title:'Tools & Tips'}]}>
          <p>
            Tests give you confidence. Start with unit tests, then integration and end-to-end tests. Use assertions and test frameworks in each language.
          </p>
          <h4 id="testing-tools">Tools & tips</h4>
          <p style={{ marginTop: 8 }}>
            JavaScript — Jest/Mocha for unit tests, Playwright/Cypress for e2e; Python — pytest/unittest; Java — JUnit; C# — NUnit/xUnit. Write small, deterministic tests and mock external dependencies.
          </p>
        </Topic>
        <section id="syntax-compare" style={{ marginTop: 18, marginBottom: 18, padding: 16, borderRadius: 10, background: 'linear-gradient(180deg, rgba(8,20,36,0.7), rgba(6,14,28,0.66))', border: '1px solid rgba(212,175,55,0.06)' }} aria-labelledby="syntax-compare-title">
          <h3>Syntax Comparison — JS / Python / Java / C#</h3>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 12 }}>
            <div>
              <strong>JavaScript</strong>
              <pre data-lang="js" style={{ background: '#071424', color: '#f3e9c8', padding: 10, borderRadius: 8, border: '1px solid rgba(212,175,55,0.06)', overflowX: 'auto', maxWidth: '100%' }}>{`function greet(name) {
  return 'Hello ' + name;
}`}</pre>
            </div>
            <div>
              <strong>Python</strong>
              <pre data-lang="py" style={{ background: '#071424', color: '#f3e9c8', padding: 10, borderRadius: 8, border: '1px solid rgba(212,175,55,0.06)', overflowX: 'auto', maxWidth: '100%' }}>{`def greet(name):
    return 'Hello ' + name`}</pre>
            </div>
            <div>
              <strong>Java</strong>
                <pre data-lang="java" style={{ background: '#071424', color: '#f3e9c8', padding: 10, borderRadius: 8, border: '1px solid rgba(212,175,55,0.06)', overflowX: 'auto', maxWidth: '100%' }}>{`public static String greet(String name) {
          return "Hello " + name;
        }`}</pre>
            </div>
            <div>
              <strong>C#</strong>
                <pre data-lang="c#" style={{ background: '#071424', color: '#f3e9c8', padding: 10, borderRadius: 8, border: '1px solid rgba(212,175,55,0.06)', overflowX: 'auto', maxWidth: '100%' }}>{`static string Greet(string name) {
          return "Hello " + name;
        }`}</pre>
            </div>
          </div>
        </section>

        <section id="glossary" style={{ marginBottom: 18 }}>
          <h3>Glossary</h3>
          <dl style={{ display: 'grid', gridTemplateColumns: '1fr 3fr', gap: 8 }}>
            <dt><strong>Variable</strong></dt><dd>A named container for a value — like a labeled jar.</dd>
            <dt><strong>Function</strong></dt><dd>Reusable block of code (like a small appliance).</dd>
            <dt><strong>Stack</strong></dt><dd>Call stack: where function frames live during execution.</dd>
            <dt><strong>Heap</strong></dt><dd>Memory for objects and dynamic data.</dd>
          </dl>
        </section>

        {/* Additional static reference content (cheatsheet, snippets, patterns, recipes) */}
        <section id="extras-cheatsheet" style={{ marginBottom: 24 }}>
          <h3>Cheatsheet — Quick Reference</h3>
          <p style={{ marginTop: 6 }}>Compact commands, idioms and the most-used snippets per language. Designed to be printed or pinned next to your editor.</p>

          <h4 style={{ marginTop: 12 }}>One-line essentials</h4>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <div style={{ padding: 12, borderRadius: 8, background: 'var(--color-card)', border: '1px solid var(--color-border)' }}>
              <strong>JavaScript</strong>
              <pre data-lang="js" style={{ background: '#071424', color: '#f3e9c8', padding: 8, borderRadius: 6, overflowX: 'auto' }}>{`// run
node index.js

// fetch JSON
await fetch(url).then(r => r.json())`}</pre>
            </div>
            <div style={{ padding: 12, borderRadius: 8, background: 'var(--color-card)', border: '1px solid var(--color-border)' }}>
              <strong>Python</strong>
              <pre data-lang="py" style={{ background: '#071424', color: '#f3e9c8', padding: 8, borderRadius: 6, overflowX: 'auto' }}>{`# run
python script.py

# read JSON
import json
json.load(open('file.json'))`}</pre>
            </div>
          </div>

          <h4 style={{ marginTop: 12 }}>Snippets Essentials</h4>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: 12 }}>
            <div style={{ padding: 12, borderRadius: 8, background: 'var(--color-card)', border: '1px solid var(--color-border)' }}>
              <strong>HTTP GET (JS)</strong>
              <pre data-lang="js" style={{ background: '#071424', color: '#f3e9c8', padding: 8, borderRadius: 6, overflowX: 'auto' }}>{`fetch('https://api.example.com/data')
  .then(r => r.json())
  .then(data => console.log(data));`}</pre>
            </div>
            <div style={{ padding: 12, borderRadius: 8, background: 'var(--color-card)', border: '1px solid var(--color-border)' }}>
              <strong>Read file (Node.js)</strong>
              <pre data-lang="js" style={{ background: '#071424', color: '#f3e9c8', padding: 8, borderRadius: 6, overflowX: 'auto' }}>{`import { readFile } from 'fs/promises';
const contents = await readFile('./data.txt', 'utf8');`}</pre>
            </div>
            <div style={{ padding: 12, borderRadius: 8, background: 'var(--color-card)', border: '1px solid var(--color-border)' }}>
              <strong>HTTP GET (Python)</strong>
              <pre data-lang="py" style={{ background: '#071424', color: '#f3e9c8', padding: 8, borderRadius: 6, overflowX: 'auto' }}>{`import requests
r = requests.get('https://api.example.com/data')
print(r.json())`}</pre>
            </div>
          </div>

          <h4 style={{ marginTop: 12 }}>Patterns & Anti‑patterns</h4>
          <ul style={{ marginTop: 8 }}>
            <li><strong>Prefer composition</strong> over deep inheritance chains.</li>
            <li><strong>Avoid global mutable state</strong>; pass dependencies explicitly.</li>
            <li><strong>Use guard clauses</strong> to reduce nesting and clarify intent.</li>
            <li><strong>Anti-pattern:</strong> copying-and-pasting logic instead of extracting a function.</li>
          </ul>

          <h4 style={{ marginTop: 12 }}>Errors Common & Fixes</h4>
          <div style={{ padding: 12, borderRadius: 8, background: 'var(--color-card)', border: '1px solid var(--color-border)' }}>
            <strong>TypeError (JS) — common causes</strong>
            <ol style={{ marginTop: 8 }}>
              <li>Accessing property of undefined/null — check existence before access.</li>
              <li>Wrong import default vs named — verify exported symbol names.</li>
              <li>Passing wrong types to third-party APIs — consult docs and add validation.</li>
            </ol>
          </div>

          <h4 style={{ marginTop: 12 }}>Checklist — Good Practices</h4>
          <ul style={{ marginTop: 8 }}>
            <li>Use descriptive names for variables and functions.</li>
            <li>Write small, focused functions (single responsibility).</li>
            <li>Add unit tests for core logic and edge cases.</li>
            <li>Log errors with context (but do not log secrets).</li>
          </ul>

          <h4 style={{ marginTop: 12 }}>Project Skeletons (static examples)</h4>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: 8 }}>
            <div style={{ padding: 12, borderRadius: 8, background: 'var(--color-card)', border: '1px solid var(--color-border)' }}>
              <strong>Minimal Node service</strong>
              <pre style={{ background: '#071424', color: '#f3e9c8', padding: 8, borderRadius: 6, overflowX: 'auto' }}>{`/project
  /src
    index.js  // express app, simple route
  package.json`}</pre>
            </div>
            <div style={{ padding: 12, borderRadius: 8, background: 'var(--color-card)', border: '1px solid var(--color-border)' }}>
              <strong>Minimal Python script</strong>
              <pre style={{ background: '#071424', color: '#f3e9c8', padding: 8, borderRadius: 6, overflowX: 'auto' }}>{`/project
  main.py  # performs tasks, writes output
  requirements.txt`}</pre>
            </div>
          </div>

          <h4 style={{ marginTop: 12 }}>Commands & Tools</h4>
          <p style={{ marginTop: 6 }}>Common commands you will use locally (build, test, lint):</p>
          <pre style={{ background: '#071424', color: '#f3e9c8', padding: 8, borderRadius: 6, overflowX: 'auto' }}>{`# JavaScript
npm install
npm run build
npm test

# Python
pip install -r requirements.txt
pytest`}</pre>

          <h4 style={{ marginTop: 12 }}>Security Tips (quick)</h4>
          <ul style={{ marginTop: 8 }}>
            <li>Never commit secrets; use environment variables or secret managers.</li>
            <li>Validate and sanitize all external inputs.</li>
            <li>Prefer parameterized queries for DB access to avoid SQL injection.</li>
          </ul>

          <h4 style={{ marginTop: 12 }}>Performance Rules of Thumb</h4>
          <ul style={{ marginTop: 8 }}>
            <li>Avoid O(n^2) operations on large inputs; prefer maps/sets for lookups.</li>
            <li>Cache expensive operations when results are stable.</li>
            <li>Profile before optimizing — measure hotspots first.</li>
          </ul>

          <h4 style={{ marginTop: 12 }}>Testing Recipes</h4>
          <p style={{ marginTop: 6 }}>Small, deterministic tests are best. Example (JS/Jest):</p>
          <pre style={{ background: '#071424', color: '#f3e9c8', padding: 8, borderRadius: 6, overflowX: 'auto' }}>{`// sum.test.js
const sum = require('./sum');
test('adds', () => expect(sum(1,2)).toBe(3));`}</pre>

          <h4 style={{ marginTop: 12 }}>Design Patterns — quick</h4>
          <ul style={{ marginTop: 8 }}>
            <li><strong>Factory:</strong> centralize object creation; useful for test doubles.</li>
            <li><strong>Strategy:</strong> swap algorithms via interfaces/closures.</li>
            <li><strong>Singleton (use sparingly):</strong> shared instances with care.</li>
          </ul>

          <h4 style={{ marginTop: 12 }}>APIs & HTTP</h4>
          <p style={{ marginTop: 6 }}>Status code quick guide:</p>
          <ul>
            <li>200 — OK</li>
            <li>201 — Created</li>
            <li>400 — Bad Request (client validation)</li>
            <li>401 — Unauthorized</li>
            <li>403 — Forbidden</li>
            <li>404 — Not Found</li>
            <li>500 — Internal Server Error (investigate logs)</li>
          </ul>

          <h4 style={{ marginTop: 12 }}>SQL / NoSQL Cheats</h4>
          <p style={{ marginTop: 6 }}>Common queries and advice:</p>
          <pre style={{ background: '#071424', color: '#f3e9c8', padding: 8, borderRadius: 6, overflowX: 'auto' }}>{`-- SQL: select
SELECT id, name FROM users WHERE active = true LIMIT 100;

-- NoSQL: find by key (example)
db.users.find({ active: true }).limit(100);`}</pre>

          <h4 style={{ marginTop: 12 }}>Printable One‑Page Summary</h4>
          <p style={{ marginTop: 6 }}>Use the Print button above to render a condensed view with the important snippets and checklists; the print CSS hides navigation and extraneous UI.</p>
        </section>

        {/* Expanded reference sections as requested */}
        <section id="expanded-cheats" style={{ marginBottom: 18 }}>
          <h3>Snippets Essenciais (por linguagem)</h3>
          <p>Short, copy‑pasteable snippets for the most common tasks.</p>

          <h4>Create / Read file</h4>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(260px,1fr))', gap: 12 }}>
            <div style={{ padding: 12, borderRadius: 8, background: 'var(--color-card)', border: '1px solid var(--color-border)' }}>
              <strong>Node.js — write & read</strong>
              <pre style={{ background: '#071424', color: '#f3e9c8', padding: 8, borderRadius: 6, overflowX: 'auto' }}>{`import { writeFile, readFile } from 'fs/promises';
await writeFile('./out.txt','hello');
const s = await readFile('./out.txt','utf8');`}</pre>
            </div>
            <div style={{ padding: 12, borderRadius: 8, background: 'var(--color-card)', border: '1px solid var(--color-border)' }}>
              <strong>Python — write & read</strong>
              <pre style={{ background: '#071424', color: '#f3e9c8', padding: 8, borderRadius: 6, overflowX: 'auto' }}>{`with open('out.txt','w') as f:
    f.write('hello')
with open('out.txt') as f:
    s = f.read()`}</pre>
            </div>
          </div>

          <h4>HTTP requests & JSON parse</h4>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(260px,1fr))', gap: 12 }}>
            <div style={{ padding: 12, borderRadius: 8, background: 'var(--color-card)', border: '1px solid var(--color-border)' }}>
              <strong>JS (fetch)</strong>
              <pre style={{ background: '#071424', color: '#f3e9c8', padding: 8, borderRadius: 6, overflowX: 'auto' }}>{`const res = await fetch(url);
if (!res.ok) throw new Error(res.statusText);
const data = await res.json();`}</pre>
            </div>
            <div style={{ padding: 12, borderRadius: 8, background: 'var(--color-card)', border: '1px solid var(--color-border)' }}>
              <strong>Python (requests)</strong>
              <pre style={{ background: '#071424', color: '#f3e9c8', padding: 8, borderRadius: 6, overflowX: 'auto' }}>{`import requests
r = requests.get(url)
r.raise_for_status()
data = r.json()`}</pre>
            </div>
          </div>

          <h4>Read stdin</h4>
          <pre style={{ background: '#071424', color: '#f3e9c8', padding: 8, borderRadius: 6, overflowX: 'auto' }}>{`# Node.js
const input = await new Promise(r => {
  let s=''; process.stdin.on('data',c=>s+=c); process.stdin.on('end',()=>r(s));
});

# Python
import sys
data = sys.stdin.read()`}</pre>

          <h4 style={{ marginTop: 12 }}>Patterns & Anti‑patterns (short examples)</h4>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <div style={{ padding: 12, borderRadius: 8, background: 'var(--color-card)', border: '1px solid var(--color-border)' }}>
              <strong>Prefer composição</strong>
              <pre style={{ background: '#071424', color: '#f3e9c8', padding: 8, borderRadius: 6, overflowX: 'auto' }}>{`// composition over inheritance (JS)
function Engine() { return { start: () => console.log('go') }; }
function Car(engine){ return { drive: () => engine.start() }; }
const car = Car(Engine());`}</pre>
            </div>
            <div style={{ padding: 12, borderRadius: 8, background: 'var(--color-card)', border: '1px solid var(--color-border)' }}>
              <strong>Avoid global mutation</strong>
              <pre style={{ background: '#071424', color: '#f3e9c8', padding: 8, borderRadius: 6, overflowX: 'auto' }}>{`// bad
window.count = 0; // shared mutable state
// better: pass state explicitly or use module scope encapsulation`}</pre>
            </div>
          </div>

          <h4 style={{ marginTop: 12 }}>Tabelas de Referência Rápida</h4>
          <div style={{ overflowX: 'auto', borderRadius: 8, border: '1px solid var(--color-border)', background: 'var(--color-card)', padding: 8 }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead><tr style={{ textAlign: 'left' }}><th>Language</th><th>Primitive Types</th><th>Declaration</th></tr></thead>
              <tbody>
                <tr><td>JavaScript</td><td>number, string, boolean, null, undefined, symbol, bigint</td><td><code>const x = 1</code></td></tr>
                <tr><td>Python</td><td>int, float, str, bool, NoneType</td><td><code>x = 1</code></td></tr>
                <tr><td>Java</td><td>int, long, double, boolean, String</td><td><code>int x = 1;</code></td></tr>
                <tr><td>C#</td><td>int, double, bool, string</td><td><code>int x = 1;</code></td></tr>
              </tbody>
            </table>
          </div>

          <h4 style={{ marginTop: 12 }}>Complexidade (Time / Space) — referência</h4>
          <pre style={{ background: '#071424', color: '#f3e9c8', padding: 8, borderRadius: 6, overflowX: 'auto' }}>{`Array/List: access O(1), insert O(n)
Map/Dict: lookup O(1) avg, Set: membership O(1)
LinkedList: traversal O(n)
Sorting: O(n log n) typical`}</pre>

          <h4 style={{ marginTop: 12 }}>Erros Comuns e Como Corrigir</h4>
          <div style={{ padding: 12, borderRadius: 8, background: 'var(--color-card)', border: '1px solid var(--color-border)' }}>
            <strong>TypeError example (JS)</strong>
            <pre style={{ background: '#071424', color: '#f3e9c8', padding: 8, borderRadius: 6, overflowX: 'auto' }}>{`TypeError: Cannot read properties of undefined (reading 'map')
at Object.<anonymous> (index.js:10:20)
Cause: calling .map on undefined — check the variable before using or default to []
Fix: const list = maybeList || []; list.map(...)`}</pre>
          </div>

          <h4 style={{ marginTop: 12 }}>Checklist de Boas Práticas (do / don't)</h4>
          <ul>
            <li><strong>Do:</strong> name functions clearly, write tests, add docs for public APIs.</li>
            <li><strong>Don't:</strong> Rely on magic numbers or copy/paste; avoid silent catches that hide errors.</li>
            <li><strong>Do:</strong> Validate inputs and fail fast with helpful messages.</li>
          </ul>

          <h4 style={{ marginTop: 12 }}>Minimal Project Examples</h4>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(260px,1fr))', gap: 12 }}>
            <div style={{ padding: 12, borderRadius: 8, background: 'var(--color-card)', border: '1px solid var(--color-border)' }}>
              <strong>Microservice (Node + Express)</strong>
              <pre style={{ background: '#071424', color: '#f3e9c8', padding: 8, borderRadius: 6, overflowX: 'auto' }}>{`/service
  /src
    app.js  // express routes
    handlers/
  package.json
  Dockerfile`}</pre>
            </div>
            <div style={{ padding: 12, borderRadius: 8, background: 'var(--color-card)', border: '1px solid var(--color-border)' }}>
              <strong>CLI (Python)</strong>
              <pre style={{ background: '#071424', color: '#f3e9c8', padding: 8, borderRadius: 6, overflowX: 'auto' }}>{`/cli
  main.py  # parse args, call runner
  README.md`}</pre>
            </div>
          </div>

          <h4 style={{ marginTop: 12 }}>Useful Commands & Tools</h4>
          <ul>
            <li><strong>Git:</strong> <code>git status</code>, <code>git add -p</code>, <code>git commit --amend</code>, <code>git rebase -i</code></li>
            <li><strong>Docker:</strong> <code>docker build -t app .</code>, <code>docker-compose up</code></li>
            <li><strong>Node:</strong> <code>npm run dev</code>, <code>npm test</code></li>
          </ul>

          <h4 style={{ marginTop: 12 }}>Security Basics (examples)</h4>
          <div style={{ padding: 12, borderRadius: 8, background: 'var(--color-card)', border: '1px solid var(--color-border)' }}>
            <strong>Unsafe SQL (bad)</strong>
            <pre style={{ background: '#071424', color: '#f3e9c8', padding: 8, borderRadius: 6, overflowX: 'auto' }}>{`query = "SELECT * FROM users WHERE id = " + user_input
// vulnerable to injection`}</pre>
            <strong>Safe (parameterized)</strong>
            <pre style={{ background: '#071424', color: '#f3e9c8', padding: 8, borderRadius: 6, overflowX: 'auto' }}>{`cursor.execute('SELECT * FROM users WHERE id = %s', (user_id,))`}</pre>
          </div>

          <h4 style={{ marginTop: 12 }}>Performance Tips — Practical rules</h4>
          <ul>
            <li>Prefer maps/sets for frequent membership checks.</li>
            <li>Batch DB writes instead of per-row inserts when possible.</li>
            <li>Use streaming for large files instead of reading all into memory.</li>
          </ul>

          <h4 style={{ marginTop: 12 }}>Testing Recipes (expanded)</h4>
          <p>Unit test skeletons for quick copy:</p>
          <pre style={{ background: '#071424', color: '#f3e9c8', padding: 8, borderRadius: 6, overflowX: 'auto' }}>{`// JS (Jest)
test('sum', ()=> expect(sum(1,2)).toBe(3));

# Python (pytest)
def test_sum():
    assert sum(1,2) == 3`}</pre>

          <h4 style={{ marginTop: 12 }}>Design Patterns — short examples</h4>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: 8 }}>
            <div style={{ padding: 12, borderRadius: 8, background: 'var(--color-card)', border: '1px solid var(--color-border)' }}>
              <strong>Factory (JS)</strong>
              <pre style={{ background: '#071424', color: '#f3e9c8', padding: 8, borderRadius: 6, overflowX: 'auto' }}>{`function createLogger(level){
  return { log: msg => console.log(level,msg) };
}
const logger = createLogger('info');`}</pre>
            </div>
            <div style={{ padding: 12, borderRadius: 8, background: 'var(--color-card)', border: '1px solid var(--color-border)' }}>
              <strong>Strategy (Python)</strong>
              <pre style={{ background: '#071424', color: '#f3e9c8', padding: 8, borderRadius: 6, overflowX: 'auto' }}>{`def sort_strategy(data, cmp):
    return sorted(data, key=cmp)
# pass different cmp functions`}</pre>
            </div>
          </div>

          <h4 style={{ marginTop: 12 }}>APIs & HTTP — quick examples</h4>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: 8 }}>
            <div style={{ padding: 12, borderRadius: 8, background: 'var(--color-card)', border: '1px solid var(--color-border)' }}>
              <strong>Node — simple GET route (Express)</strong>
              <pre style={{ background: '#071424', color: '#f3e9c8', padding: 8, borderRadius: 6, overflowX: 'auto' }}>{`app.get('/health', (req,res)=> res.json({ ok:true }));`}</pre>
            </div>
            <div style={{ padding: 12, borderRadius: 8, background: 'var(--color-card)', border: '1px solid var(--color-border)' }}>
              <strong>Client — POST JSON</strong>
              <pre style={{ background: '#071424', color: '#f3e9c8', padding: 8, borderRadius: 6, overflowX: 'auto' }}>{`fetch('/api', { method:'POST', body: JSON.stringify({a:1}), headers: {'Content-Type':'application/json'} })`}</pre>
            </div>
          </div>

          <h4 style={{ marginTop: 12 }}>SQL / NoSQL — common snippets</h4>
          <pre style={{ background: '#071424', color: '#f3e9c8', padding: 8, borderRadius: 6, overflowX: 'auto' }}>{`-- INSERT many
INSERT INTO users (name,email) VALUES
  ('a','a@x.com'),('b','b@x.com');

-- Mongo find + projection
db.users.find({active:true}, {name:1,email:1}).limit(100);`}</pre>

          <h4 style={{ marginTop: 12 }}>Expanded Glossary</h4>
          <dl style={{ display: 'grid', gridTemplateColumns: '1fr 3fr', gap: 8 }}>
            <dt><strong>Idempotent</strong></dt><dd>An operation that can be applied multiple times without changing the result beyond the initial application.</dd>
            <dt><strong>Stateless</strong></dt><dd>No session data stored on server between requests; useful for scaling.</dd>
            <dt><strong>Concurrency</strong></dt><dd>Handling multiple tasks at once — async vs parallel are different concepts.</dd>
          </dl>

          <h4 style={{ marginTop: 12 }}>Diagramas / Imagens estáticas</h4>
          <div style={{ borderRadius: 8, overflow: 'hidden', border: '1px solid var(--color-border)' }}>
            <svg viewBox="0 0 800 120" width="100%" height={120} preserveAspectRatio="xMidYMid meet" style={{ display: 'block' }}>
              <rect x="0" y="0" width="800" height="120" fill="#071424" />
              <text x="20" y="30" fill="#d4af37" fontSize="16">Client → API → DB</text>
              <line x1="120" y1="40" x2="360" y2="40" stroke="#d4af37" strokeWidth="2"/>
              <circle cx="120" cy="40" r="12" fill="#d4af37" />
              <circle cx="360" cy="40" r="12" fill="#d4af37" />
              <line x1="400" y1="40" x2="620" y2="40" stroke="#d4af37" strokeWidth="2"/>
              <circle cx="620" cy="40" r="12" fill="#d4af37" />
            </svg>
          </div>

          <h4 style={{ marginTop: 12 }}>Printable condensed one‑page (automatically shown in print)</h4>
          <div className="print-only" style={{ padding: 12, borderRadius: 8, background: '#fff', color: '#071018', border: '1px solid #ddd' }}>
            <h4 style={{ marginTop: 0 }}>One‑page Cheatsheet (condensed)</h4>
            <ul>
              <li>JS: const/let, async/await, Array.map/filter, fetch + json</li>
              <li>Python: def, list/dict, with open(), requests</li>
              <li>SQL: SELECT ... WHERE ... LIMIT</li>
              <li>Git: add -p, commit, rebase -i</li>
            </ul>
          </div>

          <h4 style={{ marginTop: 12 }}>What To Learn First — Roadmap by Level</h4>
          <ol>
            <li><strong>Beginner:</strong> variables, control flow, functions, basic data structures, debugging basics.</li>
            <li><strong>Intermediate:</strong> async patterns, testing, modules, basic design patterns, simple DB usage.</li>
            <li><strong>Advanced:</strong> performance, distributed systems basics, security, scalable architecture.</li>
          </ol>
        </section>

        <footer style={{ marginTop: 28, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ color: 'var(--color-foreground)' }}>Made with ❤️ — Comprehensive examples in JS, Python, Java and C#.</div>
          <div>
            <button style={{ background: 'linear-gradient(90deg,#b88b3a,#d4af37)', border: 'none', padding: '10px 16px', borderRadius: 10, color: '#071018', boxShadow: '0 10px 26px rgba(2,6,23,0.6)' }}>Explore Exercises</button>
          </div>
        </footer>
      </div>
    </div>
  </div>
    </Layout>
  );
}

function Topic({ id, title, children, emoji, level, miniTOC }: { id?: string; title: string; children: React.ReactNode; emoji?: string; level?: string; miniTOC?: { anchor: string; title: string }[] }) {
  const levelColor = level === 'Beginner' ? 'rgba(72,187,120,0.9)' : level === 'Intermediate' ? 'rgba(212,175,55,0.9)' : 'rgba(194,85,255,0.9)';
  return (
    <article id={id} role="region" aria-labelledby={`${id}-title`} style={{ marginBottom: 18, padding: 16, borderRadius: 10, background: 'linear-gradient(180deg, rgba(8,16,30,0.75), rgba(6,12,22,0.7))', border: '1px solid rgba(212,175,55,0.06)', borderLeft: `6px solid ${levelColor}`, paddingLeft: 14 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <h3 id={`${id}-title`} style={{ marginTop: 0, color: 'var(--color-foreground)', fontSize: 18 }}>{emoji} {title} {level ? <small style={{ marginLeft: 8, color: levelColor, fontSize: 13 }}>· {level}</small> : null}</h3>
      </div>
      {miniTOC && miniTOC.length ? (
        <nav aria-label="Section quick links" style={{ marginTop: 8, marginBottom: 8 }}>
          <strong style={{ display: 'block', marginBottom: 6, color: 'var(--muted-gold)' }}>Quick links</strong>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            {miniTOC.map(m => (<a key={m.anchor} href={`#${m.anchor}`} style={{ background: 'rgba(255,255,255,0.03)', padding: '6px 8px', borderRadius: 8, color: 'var(--color-foreground)', textDecoration: 'none', fontSize: 13 }}>{m.title}</a>))}
          </div>
        </nav>
      ) : null}
      <div style={{ color: 'var(--color-foreground)', fontSize: 15, lineHeight: 1.6 }}>{children}</div>
    </article>
  );
}

/* Flashcards removed per user request */

function Sparkline({ values = [] }: { values?: number[] }) {
  const w = 88; const h = 28; const pad = 4;
  if (!values || values.length === 0) return <svg width={w} height={h} />;
  const max = 1; const min = 0;
  const step = (w - pad * 2) / Math.max(1, values.length - 1);
  const points = values.map((v, i) => {
    const x = pad + i * step;
    const norm = (v - min) / (max - min || 1);
    const y = h - pad - norm * (h - pad * 2);
    return `${x},${y}`;
  }).join(' ');
  const last = values[values.length - 1];
  return (
    <svg width={w} height={h} style={{ display: 'block' }}>
      <polyline points={points} fill="none" stroke="#c49a2a" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
      <circle cx={w - pad} cy={h - pad - ((last - min) / (max - min || 1)) * (h - pad * 2)} r={3} fill="#d4af37" />
    </svg>
  );
}

/* Topic-specific flashcards removed per user request */
