import React, { useEffect, useMemo, useState, useRef } from "react";
import Layout from "@/components/layout";
import { BookOpen, Star, Printer, Search } from "lucide-react";
import { exercises } from "@/lib/exercises-new";
import { useUser } from "@/hooks/use-user";

// Card storage helpers (module scope)
const loadAllCards = (): Record<string, any[]> => {
  try { return JSON.parse(localStorage.getItem('library:cards') || '{}'); } catch { return {}; }
};
const saveAllCards = (data: Record<string, any[]>) => { try { localStorage.setItem('library:cards', JSON.stringify(data)); } catch {} };

const loadStats = (): Record<string, any> => { try { return JSON.parse(localStorage.getItem('library:cardstats') || '{}'); } catch { return {}; } };
const saveStats = (s: Record<string, any>) => { try { localStorage.setItem('library:cardstats', JSON.stringify(s)); } catch {} };

export default function LibraryPage() {
  const { user } = useUser();
  const [filter, setFilter] = useState<"all" | "Beginner" | "Intermediate" | "Advanced">("all");
  const [query, setQuery] = useState("");
  const [bookmarks, setBookmarks] = useState<Record<string, boolean>>({});
  const [liveText, setLiveText] = useState('');

  const watermarkText = useMemo(() => {
    if (!user || !user.customWatermark) return '';
    const raw = String(user.watermarkText || '').trim();
    return raw;
  }, [user]);

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
    // canonical link for PDF export / sharing
    let c = document.querySelector('link[rel="canonical"]');
    if (!c) {
      c = document.createElement('link');
      c.setAttribute('rel','canonical');
      c.setAttribute('href', window.location.href);
      document.head.appendChild(c);
    }
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

  // Keyboard navigation (left/right) between topic anchors
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== 'ArrowLeft' && e.key !== 'ArrowRight') return;
      const hash = window.location.hash ? window.location.hash.replace('#','') : null;
      const idx = topics.findIndex(t => t.id === hash);
      let next = -1;
      if (idx === -1) {
        // find first visible topic near top
        const topId = topics.map(t => t.id).find(id => {
          const el = document.getElementById(id);
          if (!el) return false;
          const r = el.getBoundingClientRect();
          return r.top >= 0 && r.top < window.innerHeight * 0.6;
        });
        next = topics.findIndex(t => t.id === topId);
      } else next = idx;

      if (e.key === 'ArrowLeft' && next > 0) {
        const prevId = topics[next-1].id; document.getElementById(prevId)?.scrollIntoView({ behavior: 'smooth' });
      }
      if (e.key === 'ArrowRight' && next < topics.length - 1) {
        const nextId = topics[next+1].id; document.getElementById(nextId)?.scrollIntoView({ behavior: 'smooth' });
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [topics]);

  useEffect(() => {
    setLiveText(`${visibleTopics.length} topics visible`);
  }, [visibleTopics.length]);

  // Lightweight client-side token highlighter for pre[data-lang]
  useEffect(() => {
    const kws = {
      js: ['const','let','var','function','return','await','async','if','else','for','while','switch','case','break','continue','try','catch','throw','new'],
      py: ['def','return','import','from','as','if','elif','else','for','while','try','except','class','with','yield','async','await','lambda','pass','raise'],
      java: ['public','private','protected','class','static','void','int','boolean','new','return','if','else','for','while','try','catch','throws','import'],
      'c#': ['public','private','class','static','void','int','string','bool','new','return','if','else','for','while','try','catch']
    };

    document.querySelectorAll('pre[data-lang]').forEach((el) => {
      const pre = el as HTMLElement;
      if ((pre.dataset as any).highlighted) return;
      const lang = (pre.getAttribute('data-lang') || 'js').toLowerCase();
      const list = (kws as any)[lang] || kws.js;
      const text = pre.innerText || '';

      // Build a combined regex to find strings, numbers and keywords in source order
      const escapedList = list.map((w: string) => w.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'));
      const kwPattern = '\\b(' + escapedList.join('|') + ')\\b';
      const combined = new RegExp('(["' + "`" + '])(?:\\\\.|[^\\\\])*?\\1|\\b\\d+(?:\\.\\d+)?\\b|' + kwPattern, 'g');

      const frag = document.createDocumentFragment();
      let lastIndex = 0;
      for (const match of text.matchAll(combined)) {
        const idx = match.index || 0;
        if (idx > lastIndex) {
          frag.appendChild(document.createTextNode(text.slice(lastIndex, idx)));
        }
        const token = match[0];
        let span = document.createElement('span');
        if (/^["'`]/.test(token)) {
          span.className = 'str';
          span.textContent = token;
        } else if (/^\d/.test(token)) {
          span.className = 'num';
          span.textContent = token;
        } else {
          span.className = 'kw';
          span.textContent = token;
        }
        frag.appendChild(span);
        lastIndex = idx + token.length;
      }
      if (lastIndex < text.length) frag.appendChild(document.createTextNode(text.slice(lastIndex)));

      // Replace content safely (using textContent and nodes, never innerHTML)
      pre.textContent = '';
      pre.appendChild(frag);
      (pre.dataset as any).highlighted = '1';
    });
  }, []);

  

  return (
    <Layout>
      <a href="#library-root" className="skip-link" style={{position:'absolute',left:-9999,top:'auto',width:1,height:1,overflow:'hidden'}} onFocus={(e:any)=>{e.currentTarget.style.left='8px';e.currentTarget.style.top='8px';e.currentTarget.style.width='auto';e.currentTarget.style.height='auto';e.currentTarget.style.padding='8px 12px';e.currentTarget.style.background='var(--color-card)';e.currentTarget.style.borderRadius='6px';e.currentTarget.style.boxShadow='0 6px 18px rgba(2,6,23,0.5)';}}>Skip to content</a>
      <div id="library-root" role="main" style={{
        background: 'linear-gradient(180deg, var(--color-card), var(--color-background))',
        padding: 28,
        borderRadius: 12,
        boxShadow: '0 12px 40px rgba(2,6,23,0.6)',
        border: '1px solid var(--color-border)',
        maxWidth: 1120,
        margin: '0 auto'
      }}>

        {watermarkText ? (
          <div className="print-only watermark-print" aria-hidden="true">
            <div className="watermark-print__inner">{watermarkText}</div>
          </div>
        ) : null}

        <style>{`
          <p className="no-print" style={{ marginTop: 10, fontSize: 16, lineHeight: 1.6 }}>
            Functions are reusable pieces of code that perform a task. They accept inputs (parameters) and often return outputs. Use them to break problems into smaller parts.
          </p>
          pre[data-lang="py"]::before { background: #2b8bb4; }
          pre[data-lang="java"]::before { background: #b4762a; }
          pre[data-lang="c#"]::before { background: #8b5cf6; }
          /* language badge & lightweight token styling */
          pre[data-lang] { position: relative; padding-top: 28px; }
          pre[data-lang]::before { content: attr(data-lang); position: absolute; top: 6px; left: 10px; background: rgba(0,0,0,0.2); color: #fff; padding: 4px 8px; border-radius: 6px; font-size: 12px; text-transform: uppercase; letter-spacing: .6px; }
          pre .kw { color: #7fc1ff; font-weight: 600; }
          pre .str { color: #ffcc99; }
          pre .num { color: #ffb86b; }
          pre { box-sizing: border-box; display: block; width: 100%; white-space: pre-wrap; word-break: break-word; font-family: Menlo, Monaco, 'Courier New', monospace; }
          .card { background: var(--color-card); border: 1px solid var(--color-border); padding: 12px; border-radius: 8px; box-shadow: 0 10px 22px rgba(2,6,23,0.5); display:flex; flex-direction:column; gap:8px; position: relative; z-index: 1; }
          /* accessibility: visible focus outlines and skip link */
          .skip-link:focus { left: 8px !important; top: 8px !important; width: auto !important; height: auto !important; padding: 8px 12px !important; overflow: visible !important; }
          a:focus, button:focus { outline: 3px solid rgba(212,175,55,0.18); outline-offset: 2px; }
          a:focus:not(.no-outline), button:focus:not(.no-outline) { box-shadow: 0 6px 18px rgba(2,6,23,0.45); }
          .cheats-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(280px, 1fr)); gap: var(--cheats-gap); grid-auto-rows: minmax(80px, auto); align-items: start; }
          .cheats-grid > * { min-width: 0; }
          .cheats-grid > section, .cheats-grid > .card { padding: 8px; }
          /* readable line-length */
          .card p, article p { max-width: 70ch; }
          /* mini-TOC mobile toggle */
          .miniTOC-toggle { display: none; border: none; background: transparent; color: var(--color-foreground); cursor: pointer; }
          article.miniTOC-open nav[aria-label="Section quick links"] { display: block !important; }
          /* accessible helper (visually hidden) */
          .sr-only { position: absolute !important; width: 1px !important; height: 1px !important; padding: 0 !important; margin: -1px !important; overflow: hidden !important; clip: rect(0,0,0,0) !important; white-space: nowrap !important; border: 0 !important; }
          /* layout: two-column area with a fixed-width aside and flexible main column */
          .library-flex { display: grid; grid-template-columns: 220px minmax(0,1fr); gap: 18px; align-items: start; }
          .library-flex aside { z-index: 2; box-sizing: border-box; }
          .library-flex > div { min-width: 0; }

          /* constrain aside contents so they don't overflow into main column */
          .library-flex aside .card { max-width: 100%; box-sizing: border-box; overflow: hidden; }
          nav[aria-label="Library contents"] { display: block; }
          nav[aria-label="Library contents"] > div { display: flex; align-items: center; gap: 8px; margin-bottom: 6px; word-break: break-word; }
          nav[aria-label="Library contents"] a { display: inline-flex; align-items: center; gap: 8px; max-width: 100%; color: inherit; }
          nav[aria-label="Library contents"] span[role="level-badge"], nav[aria-label="Library contents"] .level-badge { margin-left: 6px; padding: 4px 6px; font-size: 11px; border-radius: 6px; white-space: nowrap; flex-shrink: 0; }
          nav[aria-label="Library contents"] button { margin-left: 6px; flex-shrink: 0; }
          @media (max-width: 900px) {
            .library-flex { grid-template-columns: 1fr; }
            .library-flex aside { position: static !important; width: 100% !important; }
            /* collapse topic mini-TOC on small screens for brevity */
            article nav[aria-label="Section quick links"] { display: none !important; }
            .miniTOC-toggle { display: inline-block; }
          }
          pre[data-lang]::before { z-index: 3; }
          .print-only { display: none; }
          .watermark-print { display: none; }
          .watermark-print__inner { display: none; }
          /* print tuning: show condensed grid as single column and hide quick links */
          .cheats-grid { gap: 12px; }
          nav[aria-label="Section quick links"] { display: none; }
          /* Layout and typographic tuning for screen */
          #library-root h1 { font-size: 22px; margin-bottom: 4px; font-weight:700 }
          #library-root h2 { font-size: 18px; color: var(--accent-gold); margin: 6px 0; font-weight:700 }
          #library-root h3 { font-size: 16px; color: var(--accent-gold); margin: 6px 0; font-weight:700 }
          #library-root h4 { font-size: 13px; color: var(--muted-gold); margin: 6px 0; }
          #library-root p { font-size: 14px; color: var(--color-foreground); line-height: 1.45; }
          #library-root pre { font-size: 13px; font-family: Menlo, Monaco, 'Courier New', monospace; line-height: 1.4; background: #061217; color: #f3e9c8; padding: 8px; border-radius: 6px; }
          #library-root article { padding: 12px; }
          #library-root article { padding: 14px; border-radius: 10px; }
          #library-root section { border-top: 1px solid rgba(212,175,55,0.04); padding-top: 12px; margin-top: 12px; }
          #library-root .card { background: var(--color-card); border: 1px solid var(--color-border); padding: 10px; border-radius: 8px; }
          /* Smaller controls */
          #library-root input { font-size: 14px; }
          #library-root button { font-size: 14px; }

          @media print {
            @page { margin: 12mm; }
            body * { visibility: hidden !important; }
            #library-root, #library-root * { visibility: visible !important; }
            #library-root { position: static !important; top: 0; left: 0; width: 100% !important; box-shadow: none !important; background: white !important; }
            aside, .no-print, button.no-print, input { display: none !important; }
            /* ensure topics break cleanly between pages when printing */
            article, section { page-break-inside: avoid; page-break-after: always; }
            header, footer { display: block; }
            pre { background: #fff !important; box-shadow: none !important; border: 1px solid #ddd !important; }
            .print-only { display: block !important; }
            .watermark-print { display: block !important; position: fixed; inset: 0; pointer-events: none; z-index: 0; }
            .watermark-print__inner { position: absolute; top: 50%; left: 50%; transform: translate(-50%, -50%) rotate(-30deg); font-size: 64px; font-weight: 700; letter-spacing: 2px; color: rgba(0,0,0,0.12); white-space: nowrap; }
            /* Print: show condensed grid as single column and hide expanded verbose sections */
            .cheats-grid { grid-template-columns: 1fr !important; gap: 8px !important; }
            #expanded-cheats { display: none !important; }
            /* prevent splitting individual cards across pages */
            .cheats-grid .card, article, section { page-break-inside: avoid !important; }
            /* reduce padding for print to fit more content */
            #library-root { padding: 6px !important; }
            /* condensed print sizing */
            #library-root h1 { font-size: 18px; }
            #library-root p, #library-root li { font-size: 12px; }
            #library-root pre { font-size: 13px; }
          }
        `}</style>

        <header style={{ display: "flex", gap: 16, alignItems: "center", marginBottom: 20 }}>
          <div style={{ width: 80, height: 80, borderRadius: 12, background: "linear-gradient(135deg,#071629,#091b2d)", display: "flex", alignItems: "center", justifyContent: "center", boxShadow: "0 8px 22px rgba(2,6,23,0.65)", border: '1px solid rgba(212,175,55,0.12)' }}>
            <BookOpen color="#d4af37" size={44} />
          </div>

          <div style={{ borderRadius: 8, overflow: 'hidden', border: '1px solid var(--color-border)', marginTop: 8 }}>
            <svg role="img" viewBox="0 0 700 100" width="100%" height={100} preserveAspectRatio="xMidYMid meet">
              <title>Request to Worker to Database flow diagram</title>
              <rect x="0" y="0" width="700" height="100" fill="#071424" />
              <g fill="#d4af37" fontSize="12">
                <text x="20" y="24">Request → Worker → DB → Response</text>
              </g>
              <g stroke="#d4af37" strokeWidth="2" fill="none">
                <line x1="40" y1="55" x2="180" y2="55" />
                <circle cx="40" cy="55" r="10" fill="#d4af37" />
                <circle cx="180" cy="55" r="10" fill="#d4af37" />
                <line x1="220" y1="55" x2="400" y2="55" />
                <circle cx="400" cy="55" r="10" fill="#d4af37" />
                <line x1="440" y1="55" x2="620" y2="55" />
                <circle cx="620" cy="55" r="10" fill="#d4af37" />
              </g>
            </svg>
          </div>
          <div>
            <h1 style={{ margin: 0, fontSize: 28, color: 'var(--color-foreground)', textShadow: '0 1px 0 rgba(0,0,0,0.25)'}}>Library</h1>
            <p className="no-print" style={{ margin: 0, color: "var(--color-muted-foreground)" }}>A polished, complete programming guide — from basics to advanced, with examples in JavaScript, Python, Java and C#.</p>
          </div>
        </header>

        <div style={{ display: 'flex', gap: 10, alignItems: 'center', marginBottom: 12 }} className="no-print">
          <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
              <span style={{ background: '#2563eb', color: '#fff', padding: '4px 8px', borderRadius: 6, fontSize: 12 }}>JS</span>
              <span style={{ background: '#2b8bb4', color: '#fff', padding: '4px 8px', borderRadius: 6, fontSize: 12 }}>PY</span>
              <span style={{ background: '#b4762a', color: '#fff', padding: '4px 8px', borderRadius: 6, fontSize: 12 }}>JAVA</span>
              <span style={{ background: '#8b5cf6', color: '#fff', padding: '4px 8px', borderRadius: 6, fontSize: 12 }}>C#</span>
              <span style={{ marginLeft: 12, background: '#15803d', color: '#fff', padding: '4px 8px', borderRadius: 6, fontSize: 12 }}>Beginner</span>
              <span style={{ background: '#b8860b', color: '#071018', padding: '4px 8px', borderRadius: 6, fontSize: 12 }}>Intermediate</span>
              <span style={{ background: '#6d28d9', color: '#fff', padding: '4px 8px', borderRadius: 6, fontSize: 12 }}>Advanced</span>
            </div>
            <div style={{ marginLeft: 12, color: 'var(--color-muted-foreground)', fontSize: 13 }}>
              Legend: language badges • difficulty pills • code color = <span style={{ display:'inline-block', marginLeft:6, padding:'2px 8px', borderRadius:6, background:'#071424', color:'#7fc1ff' }}>kw</span> <span style={{ display:'inline-block', marginLeft:6, padding:'2px 8px', borderRadius:6, background:'#071424', color:'#ffcc99' }}>str</span> <span style={{ display:'inline-block', marginLeft:6, padding:'2px 8px', borderRadius:6, background:'#071424', color:'#ffb86b' }}>num</span>
            </div>
        </div>

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
                  <div role="search" aria-label="Library search" style={{ display: 'flex', alignItems: 'center', gap: 6, background: 'var(--color-popover)', padding: '6px 10px', borderRadius: 8, border: '1px solid var(--color-border)' }}>
                    <Search className="text-blue-300" />
                    <input aria-label="Search topics" value={query} onChange={e => setQuery(e.target.value)} placeholder="Search topics" style={{ border: 'none', outline: 'none', background: 'transparent', color: 'var(--color-foreground)' }} />
                  </div>
                  <div id="search-live" className="sr-only" aria-live="polite">{liveText}</div>
                <button onClick={() => window.print()} className="no-print" style={{ display: 'inline-flex', gap: 8, alignItems: 'center', background: 'linear-gradient(90deg,#b88b3a,#d4af37)', border: 'none', padding: '8px 12px', borderRadius: 10, color: '#08101b' }}><Printer /> Print Cheatsheet</button>
                <button onClick={() => window.print()} className="no-print" style={{ display: 'inline-flex', gap: 8, alignItems: 'center', background: 'transparent', border: '1px solid rgba(212,175,55,0.12)', padding: '8px 12px', borderRadius: 10, marginLeft: 8, color: 'var(--color-foreground)' }}><Printer /> Export PDF (use Print dialog)</button>
              </div>
          </div>
          <section id="cheat-index" className="card" style={{ marginBottom: 18 }}>
            <h3 style={{ marginTop: 0 }}>Cheat Index — One-line commands</h3>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(180px,1fr))', gap: 8 }}>
              <div className="card" style={{ padding: 8 }}>
                <strong>JavaScript</strong>
                <pre data-lang="js" style={{ padding: 6, marginTop: 6 }}>{`node index.js
  npm install
  npm run build`}</pre>
              </div>
              <div className="card" style={{ padding: 8 }}>
                <strong>Python</strong>
                <pre data-lang="py" style={{ padding: 6, marginTop: 6 }}>{`python main.py
  pip install -r requirements.txt
  pytest`}</pre>
              </div>
              <div className="card" style={{ padding: 8 }}>
                <strong>Git</strong>
                <pre style={{ padding: 6, marginTop: 6 }}>{`git status
  git add -p
  git commit -m "..."`}</pre>
              </div>
            </div>
          </section>
        </section>

            <div className="library-flex" style={{ gap: 20 }}>
          <aside style={{ width: 220, minWidth: 200, position: 'sticky', top: 96, alignSelf: 'flex-start' }}>
            <div className="card" style={{ padding: 10, borderRadius: 10 }}>
              <div style={{ fontWeight: 700, marginBottom: 8, color: 'var(--color-foreground)' }}>Contents</div>
                <div style={{ display: 'flex', gap: 6, marginBottom: 10, flexWrap: 'wrap', alignItems: 'center' }}>
                  <button onClick={() => setFilter('all')} style={{ padding: '6px 8px', fontSize: 12, borderRadius: 8, border: '1px solid transparent', background: filter === 'all' ? 'rgba(127,193,255,0.08)' : 'transparent', color: 'var(--color-foreground)', cursor: 'pointer', minWidth: 44 }} aria-pressed={filter === 'all'}>All</button>
                  <button onClick={() => setFilter('Beginner')} style={{ padding: '6px 8px', fontSize: 12, borderRadius: 8, border: '1px solid transparent', background: filter === 'Beginner' ? 'rgba(127,193,255,0.08)' : 'transparent', color: 'var(--color-foreground)', cursor: 'pointer', minWidth: 72 }} aria-pressed={filter === 'Beginner'}>Beginner</button>
                  <button onClick={() => setFilter('Intermediate')} style={{ padding: '6px 8px', fontSize: 12, borderRadius: 8, border: '1px solid transparent', background: filter === 'Intermediate' ? 'rgba(127,193,255,0.08)' : 'transparent', color: 'var(--color-foreground)', cursor: 'pointer', minWidth: 86 }} aria-pressed={filter === 'Intermediate'}>Intermediate</button>
                  <button onClick={() => setFilter('Advanced')} style={{ padding: '6px 8px', fontSize: 12, borderRadius: 8, border: '1px solid transparent', background: filter === 'Advanced' ? 'rgba(127,193,255,0.08)' : 'transparent', color: 'var(--color-foreground)', cursor: 'pointer', minWidth: 64 }} aria-pressed={filter === 'Advanced'}>Advanced</button>
                  <nav aria-label="Library contents">
                {topics.map(t => (
                  <div key={t.id} style={{ display: visibleTopics.some(v => v.id === t.id) ? 'block' : 'none', marginBottom: 6 }}>
                      <a href={`#${t.id}`} style={{ color: bookmarks[t.id] ? 'var(--color-primary)' : 'var(--color-foreground)', textDecoration: 'none' }}>
                              <span style={{ display:'inline-flex', alignItems:'center', gap:8 }}>
                                <span style={{ lineHeight: 1 }}>{t.emoji}</span>
                                <span style={{ display: 'inline-block', maxWidth: 120, overflow: 'hidden', textOverflow: 'ellipsis', verticalAlign: 'middle' }}>{t.title}</span>
                              </span>
                              <span role="level-badge" className="level-badge" style={{ marginLeft: 6, background: t.level === 'Beginner' ? '#15803d' : t.level === 'Intermediate' ? '#b8860b' : '#6d28d9', color: t.level === 'Intermediate' ? '#071018' : '#ffffff', padding: '4px 6px', borderRadius: 8, fontSize: 11, fontWeight:700 }}>{t.level}</span>
                            </a>
                      <button onClick={() => toggleBookmark(t.id)} style={{ float: 'right', background: 'transparent', border: 'none' }} title={bookmarks[t.id] ? 'Remove bookmark' : 'Add bookmark'} aria-pressed={!!bookmarks[t.id]} aria-label={bookmarks[t.id] ? `Remove bookmark for ${t.title}` : `Add bookmark for ${t.title}`}>
                        <Star color={bookmarks[t.id] ? 'var(--color-primary)' : 'var(--color-muted-foreground)'} size={14} />
                      </button>
                  </div>
                ))}
                </nav>
              </div>
            </div>
          </aside>

          <div style={{ minWidth: 0 }}>

        <Topic id="variables" level="Beginner" title="1 — Variables & Data Types" emoji="🔢" miniTOC={[{anchor:'variables-js',title:'JavaScript'},{anchor:'variables-py',title:'Python'},{anchor:'variables-java',title:'Java'},{anchor:'variables-csharp',title:'C#'}]}>
          <p className="no-print" style={{ fontSize: 18, lineHeight: 1.6 }}>
            Variables are named containers for values. They let programs hold and manipulate data. Below are the common declaration patterns and best practices you will use every day.
          </p>
          <p className="no-print" style={{ marginTop: 10, fontSize: 16, lineHeight: 1.6 }}>
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
            <p className="no-print">Think of a function as a small kitchen appliance: you give it ingredients and settings, it returns a result.</p>
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
          <p className="no-print" style={{ marginTop: 8 }}>
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
        <div className="cheats-grid">
        <section id="extras-cheatsheet" style={{ marginBottom: 24 }}>
          <h3>Cheatsheet — Quick Reference</h3>
          <p className="no-print" style={{ marginTop: 6 }}>Compact commands, idioms and the most-used snippets per language. Designed to be printed or pinned next to your editor.</p>

          <h4 style={{ marginTop: 12 }}>One-line essentials</h4>
          <div style={{ display: 'flex', justifyContent: 'flex-end' }} className="no-print"><a href="#expanded-cheats" style={{ color: 'var(--accent-gold)', textDecoration: 'none', fontSize: 13 }}>See full examples →</a></div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <div className="card" style={{ padding: 12, borderRadius: 8 }}>
              <strong>JavaScript</strong>
              <pre data-lang="js" style={{ background: '#071424', color: '#f3e9c8', padding: 8, borderRadius: 6, overflowX: 'auto' }}>{`// run
node index.js

// fetch JSON
await fetch(url).then(r => r.json())`}</pre>
            </div>
            <div className="card" style={{ padding: 12, borderRadius: 8 }}>
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
            <div className="card" style={{ padding: 12, borderRadius: 8 }}>
              <strong>HTTP GET (JS)</strong>
              <pre data-lang="js" style={{ background: '#071424', color: '#f3e9c8', padding: 8, borderRadius: 6, overflowX: 'auto' }}>{`fetch('https://api.example.com/data')
  .then(r => r.json())
  .then(data => console.log(data));`}</pre>
            </div>
            <div className="card" style={{ padding: 12, borderRadius: 8 }}>
              <strong>Read file (Node.js)</strong>
              <pre data-lang="js" style={{ background: '#071424', color: '#f3e9c8', padding: 8, borderRadius: 6, overflowX: 'auto' }}>{`import { readFile } from 'fs/promises';
const contents = await readFile('./data.txt', 'utf8');`}</pre>
            </div>
            <div className="card" style={{ padding: 12, borderRadius: 8 }}>
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
          <div className="card" style={{ padding: 12, borderRadius: 8 }}>
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
            <div className="card" style={{ padding: 12, borderRadius: 8 }}>
              <strong>Minimal Node service</strong>
              <pre style={{ background: '#071424', color: '#f3e9c8', padding: 8, borderRadius: 6, overflowX: 'auto' }}>{`/project
  /src
    index.js  // express app, simple route
  package.json`}</pre>
            </div>
            <div className="card" style={{ padding: 12, borderRadius: 8 }}>
              <strong>Minimal Python script</strong>
              <pre style={{ background: '#071424', color: '#f3e9c8', padding: 8, borderRadius: 6, overflowX: 'auto' }}>{`/project
  main.py  # performs tasks, writes output
  requirements.txt`}</pre>
            </div>
          </div>

          <h4 style={{ marginTop: 12 }}>Commands & Tools</h4>
          <p className="no-print" style={{ marginTop: 6 }}>Common commands you will use locally (build, test, lint):</p>
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
          <p className="no-print" style={{ marginTop: 6 }}>Small, deterministic tests are best. Example (JS/Jest):</p>
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
          <p className="no-print" style={{ marginTop: 6 }}>Status code quick guide:</p>
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
          <p className="no-print" style={{ marginTop: 6 }}>Common queries and advice:</p>
          <pre style={{ background: '#071424', color: '#f3e9c8', padding: 8, borderRadius: 6, overflowX: 'auto' }}>{`-- SQL: select
SELECT id, name FROM users WHERE active = true LIMIT 100;

-- NoSQL: find by key (example)
db.users.find({ active: true }).limit(100);`}</pre>

          <h4 style={{ marginTop: 12 }}>Printable One‑Page Summary</h4>
          <p className="no-print" style={{ marginTop: 6 }}>Use the Print button above to render a condensed view with the important snippets and checklists; the print CSS hides navigation and extraneous UI.</p>
        </section>

        {/* Expanded reference sections as requested */}
        <section id="expanded-cheats" style={{ marginBottom: 18 }}>
          <h3>Essential Snippets (by language)</h3>
          <p>Short, copy‑pasteable snippets for the most common tasks.</p>

          <h4>Create / Read file</h4>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(260px,1fr))', gap: 12 }}>
            <div className="card" style={{ padding: 12, borderRadius: 8 }}>
              <strong>Node.js — write & read</strong>
              <pre style={{ background: '#071424', color: '#f3e9c8', padding: 8, borderRadius: 6, overflowX: 'auto' }}>{`import { writeFile, readFile } from 'fs/promises';
await writeFile('./out.txt','hello');
const s = await readFile('./out.txt','utf8');`}</pre>
            </div>
            <div className="card" style={{ padding: 12, borderRadius: 8 }}>
              <strong>Python — write & read</strong>
              <pre style={{ background: '#071424', color: '#f3e9c8', padding: 8, borderRadius: 6, overflowX: 'auto' }}>{`with open('out.txt','w') as f:
    f.write('hello')
with open('out.txt') as f:
    s = f.read()`}</pre>
            </div>
          </div>

          <h4>HTTP requests & JSON parse</h4>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(260px,1fr))', gap: 12 }}>
            <div className="card" style={{ padding: 12, borderRadius: 8 }}>
              <strong>JS (fetch)</strong>
              <pre style={{ background: '#071424', color: '#f3e9c8', padding: 8, borderRadius: 6, overflowX: 'auto' }}>{`const res = await fetch(url);
if (!res.ok) throw new Error(res.statusText);
const data = await res.json();`}</pre>
            </div>
            <div className="card" style={{ padding: 12, borderRadius: 8 }}>
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
            <div className="card" style={{ padding: 12, borderRadius: 8 }}>
              <strong>Prefer composition</strong>
              <pre style={{ background: '#071424', color: '#f3e9c8', padding: 8, borderRadius: 6, overflowX: 'auto' }}>{`// composition over inheritance (JS)
function Engine() { return { start: () => console.log('go') }; }
function Car(engine){ return { drive: () => engine.start() }; }
const car = Car(Engine());`}</pre>
            </div>
            <div className="card" style={{ padding: 12, borderRadius: 8 }}>
              <strong>Avoid global mutation</strong>
              <pre style={{ background: '#071424', color: '#f3e9c8', padding: 8, borderRadius: 6, overflowX: 'auto' }}>{`// bad
window.count = 0; // shared mutable state
// better: pass state explicitly or use module scope encapsulation`}</pre>
            </div>
          </div>

          <h4 style={{ marginTop: 12 }}>Quick Reference Tables</h4>
          <div className="card" style={{ overflowX: 'auto', borderRadius: 8, padding: 8, border: '1px solid var(--color-border)' }}>
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

          <h4 style={{ marginTop: 12 }}>Complexity (Time / Space) — reference</h4>
          <pre style={{ background: '#071424', color: '#f3e9c8', padding: 8, borderRadius: 6, overflowX: 'auto' }}>{`Array/List: access O(1), insert O(n)
Map/Dict: lookup O(1) avg, Set: membership O(1)
LinkedList: traversal O(n)
Sorting: O(n log n) typical`}</pre>

          <h4 style={{ marginTop: 12 }}>Common Errors and How to Fix</h4>
          <div className="card" style={{ padding: 12, borderRadius: 8 }}>
            <strong>TypeError example (JS)</strong>
            <pre style={{ background: '#071424', color: '#f3e9c8', padding: 8, borderRadius: 6, overflowX: 'auto' }}>{`TypeError: Cannot read properties of undefined (reading 'map')
at Object.<anonymous> (index.js:10:20)
Cause: calling .map on undefined — check the variable before using or default to []
Fix: const list = maybeList || []; list.map(...)`}</pre>
          </div>

          <h4 style={{ marginTop: 12 }}>Best Practices Checklist (do / don't)</h4>
          <ul>
            <li><strong>Do:</strong> name functions clearly, write tests, add docs for public APIs.</li>
            <li><strong>Don't:</strong> Rely on magic numbers or copy/paste; avoid silent catches that hide errors.</li>
            <li><strong>Do:</strong> Validate inputs and fail fast with helpful messages.</li>
          </ul>

          <h4 style={{ marginTop: 12 }}>Minimal Project Examples</h4>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(260px,1fr))', gap: 12 }}>
            <div className="card" style={{ padding: 12, borderRadius: 8 }}>
              <strong>Microservice (Node + Express)</strong>
              <pre style={{ background: '#071424', color: '#f3e9c8', padding: 8, borderRadius: 6, overflowX: 'auto' }}>{`/service
  /src
    app.js  // express routes
    handlers/
  package.json
  Dockerfile`}</pre>
            </div>
            <div className="card" style={{ padding: 12, borderRadius: 8 }}>
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
          <div className="card" style={{ padding: 12, borderRadius: 8 }}>
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
            <div className="card" style={{ padding: 12, borderRadius: 8 }}>
              <strong>Factory (JS)</strong>
              <pre style={{ background: '#071424', color: '#f3e9c8', padding: 8, borderRadius: 6, overflowX: 'auto' }}>{`function createLogger(level){
  return { log: msg => console.log(level,msg) };
}
const logger = createLogger('info');`}</pre>
            </div>
            <div className="card" style={{ padding: 12, borderRadius: 8 }}>
              <strong>Strategy (Python)</strong>
              <pre style={{ background: '#071424', color: '#f3e9c8', padding: 8, borderRadius: 6, overflowX: 'auto' }}>{`def sort_strategy(data, cmp):
    return sorted(data, key=cmp)
# pass different cmp functions`}</pre>
            </div>
          </div>

          <h4 style={{ marginTop: 12 }}>APIs & HTTP — quick examples</h4>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: 8 }}>
            <div className="card" style={{ padding: 12, borderRadius: 8 }}>
              <strong>Node — simple GET route (Express)</strong>
              <pre style={{ background: '#071424', color: '#f3e9c8', padding: 8, borderRadius: 6, overflowX: 'auto' }}>{`app.get('/health', (req,res)=> res.json({ ok:true }));`}</pre>
            </div>
            <div className="card" style={{ padding: 12, borderRadius: 8 }}>
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

          <h4 style={{ marginTop: 12 }}>Diagrams / Static images</h4>
          <div style={{ borderRadius: 8, overflow: 'hidden', border: '1px solid var(--color-border)' }}>
            <svg role="img" viewBox="0 0 800 120" width="100%" height={120} preserveAspectRatio="xMidYMid meet" style={{ display: 'block' }}>
              <title>Client to API to Database flow</title>
              <rect x="0" y="0" width="800" height="120" fill="#071424" />
              <text x="20" y="30" fill="#d4af37" fontSize="16">Client → API → DB</text>
              <line x1="120" y1="40" x2="360" y2="40" stroke="#d4af37" strokeWidth="2"/>
              <circle cx="120" cy="40" r="12" fill="#d4af37" />
              <circle cx="360" cy="40" r="12" fill="#d4af37" />
              <line x1="400" y1="40" x2="620" y2="40" stroke="#d4af37" strokeWidth="2"/>
              <circle cx="620" cy="40" r="12" fill="#d4af37" />
            </svg>
          </div>

          <div style={{ marginTop: 8 }}>
            <svg role="img" viewBox="0 0 600 80" width="100%" height={80} preserveAspectRatio="xMidYMid meet" aria-labelledby="async-title">
              <title id="async-title">Async lifecycle: call → promise → resolve/reject</title>
              <rect x="0" y="0" width="600" height="80" fill="#071424" />
              <g fill="#d4af37" fontSize="12">
                <text x="12" y="18">Caller → Promise → Handler</text>
              </g>
              <g stroke="#d4af37" strokeWidth="2" fill="none">
                <line x1="80" y1="46" x2="220" y2="46" />
                <circle cx="80" cy="46" r="8" fill="#d4af37" />
                <rect x="220" y="36" width="120" height="20" rx="6" stroke="#d4af37" />
                <line x1="360" y1="46" x2="480" y2="46" />
                <circle cx="480" cy="46" r="8" fill="#d4af37" />
              </g>
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
        </div>

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
  const levelColor = level === 'Beginner' ? '#15803d' : level === 'Intermediate' ? '#b8860b' : '#6d28d9';
  const ref = useRef<HTMLElement | null>(null);
  const [prevId, setPrevId] = useState<string | null>(null);
  const [nextId, setNextId] = useState<string | null>(null);
  const [miniOpen, setMiniOpen] = useState(false);
  useEffect(() => {
    const el = ref.current as HTMLElement | null;
    if (!el) return;
    const prev = el.previousElementSibling as HTMLElement | null;
    const next = el.nextElementSibling as HTMLElement | null;
    setPrevId(prev && prev.id ? prev.id : null);
    setNextId(next && next.id ? next.id : null);
  }, []);
  return (
    <article ref={ref as any} className={miniOpen ? 'miniTOC-open' : undefined} id={id} role="region" aria-labelledby={`${id}-title`} style={{ marginBottom: 18, padding: 16, borderRadius: 10, background: 'linear-gradient(180deg, rgba(8,16,30,0.75), rgba(6,12,22,0.7))', border: '1px solid rgba(212,175,55,0.06)', borderLeft: `6px solid ${levelColor}`, paddingLeft: 14 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <h3 id={`${id}-title`} style={{ marginTop: 0, color: 'var(--color-foreground)', fontSize: 18 }}>{emoji} {title} {level ? <span style={{ marginLeft: 8, background: levelColor, color: level === 'Intermediate' ? '#071018' : '#fff', padding: '4px 8px', borderRadius: 8, fontSize: 12, fontWeight:700 }}>{level}</span> : null}</h3>
        <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
          <button className="miniTOC-toggle" aria-controls={`${id}-miniTOC`} aria-expanded={miniOpen} onClick={() => setMiniOpen(v => !v)} title="Toggle quick links">Quick</button>
          {prevId ? <a href={`#${prevId}`} style={{ display: 'inline-block', padding: '6px 8px', borderRadius: 6, background: 'rgba(255,255,255,0.02)', color: 'var(--color-foreground)', textDecoration: 'none' }} title="Previous topic">◀</a> : null}
          {nextId ? <a href={`#${nextId}`} style={{ display: 'inline-block', padding: '6px 8px', borderRadius: 6, background: 'rgba(255,255,255,0.02)', color: 'var(--color-foreground)', textDecoration: 'none' }} title="Next topic">▶</a> : null}
        </div>
      </div>
      {miniTOC && miniTOC.length ? (
        <nav id={`${id}-miniTOC`} aria-label="Section quick links" style={{ marginTop: 8, marginBottom: 8 }}>
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
