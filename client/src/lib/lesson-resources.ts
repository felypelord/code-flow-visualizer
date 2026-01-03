export type LessonResource = {
  title: string;
  youtubeSearchQuery?: string;
  videos?: Array<{ title: string; url: string }>;
  visuals?: Array<
    | {
        kind: 'diagram';
        title: string;
        diagramId: 'call-stack' | 'stack-vs-heap' | 'event-loop';
        description?: string;
      }
    | {
        kind: 'beforeAfter';
        title: string;
        description?: string;
        beforeCode: string;
        afterCode: string;
      }
  >;
  docs?: Array<{ label: string; url: string }>;
};

const JS_FULL_COURSE = {
  title: "JavaScript Full Course (freeCodeCamp)",
  url: "https://www.youtube.com/watch?v=PkZNo7MFNFg",
};

function ytChannelSearch(handle: string, query: string) {
  const q = encodeURIComponent(query);
  return {
    title: `More from ${handle}: ${query}`,
    url: `https://www.youtube.com/@${handle}/search?query=${q}`,
  };
}

const RESOURCES: Record<string, LessonResource> = {
  functions: {
    title: 'Functions',
    videos: [
      JS_FULL_COURSE,
      ytChannelSearch('Fireship', 'functions in 5 minutes'),
      ytChannelSearch("WebDevSimplified", "JavaScript functions"),
      ytChannelSearch("TraversyMedia", "JavaScript functions"),
    ],
    youtubeSearchQuery: 'JavaScript functions tutorial',
    visuals: [
      {
        kind: 'diagram',
        title: 'Call Stack (high level)',
        diagramId: 'call-stack',
        description: 'A function call pushes a frame; returning pops it.',
      },
      {
        kind: 'beforeAfter',
        title: 'Before/After: Extract a function',
        description: 'Same behavior, clearer structure.',
        beforeCode: `// before\nconst total = (5 + 3) * 2;\nconsole.log(total);\n`,
        afterCode: `// after\nfunction add(a, b) {\n  return a + b;\n}\n\nconst total = add(5, 3) * 2;\nconsole.log(total);\n`,
      },
    ],
    docs: [
      { label: 'MDN: Functions', url: 'https://developer.mozilla.org/en-US/docs/Web/JavaScript/Guide/Functions' },
      { label: 'MDN: Arrow functions', url: 'https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Functions/Arrow_functions' },
    ],
  },
  objects: {
    title: 'Objects',
    videos: [
      JS_FULL_COURSE,
      ytChannelSearch('Fireship', 'objects in 5 minutes'),
      ytChannelSearch("WebDevSimplified", "JavaScript objects"),
      ytChannelSearch("Fireship", "JavaScript objects"),
    ],
    youtubeSearchQuery: 'JavaScript objects tutorial',
    visuals: [
      {
        kind: 'diagram',
        title: 'Stack vs Heap (high level)',
        diagramId: 'stack-vs-heap',
        description: 'Stack holds references; objects live on the heap.',
      },
      {
        kind: 'beforeAfter',
        title: 'Before/After: Avoid accidental shared mutation',
        description: 'Copy the object when you need independent state.',
        beforeCode: `// before\nconst u1 = { name: 'Ana', admin: false };\nconst u2 = u1;\nu2.admin = true;\n// u1.admin is now true (same object)\n`,
        afterCode: `// after\nconst u1 = { name: 'Ana', admin: false };\nconst u2 = { ...u1 };\nu2.admin = true;\n// u1.admin stays false (different object)\n`,
      },
    ],
    docs: [
      { label: 'MDN: Objects', url: 'https://developer.mozilla.org/en-US/docs/Web/JavaScript/Guide/Working_with_objects' },
      { label: 'MDN: Object basics', url: 'https://developer.mozilla.org/en-US/docs/Learn/JavaScript/Objects/Basics' },
    ],
  },
  classes: {
    title: 'Classes',
    videos: [
      JS_FULL_COURSE,
      ytChannelSearch("WebDevSimplified", "JavaScript classes"),
      ytChannelSearch("TraversyMedia", "JavaScript classes"),
    ],
    youtubeSearchQuery: 'JavaScript classes tutorial',
    docs: [
      { label: 'MDN: Classes', url: 'https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Classes' },
      { label: 'MDN: this', url: 'https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Operators/this' },
    ],
  },
  recursion: {
    title: 'Recursion',
    videos: [
      JS_FULL_COURSE,
      ytChannelSearch('Fireship', 'recursion in 5 minutes'),
      ytChannelSearch("WebDevSimplified", "recursion"),
      ytChannelSearch("Computerphile", "recursion"),
    ],
    youtubeSearchQuery: 'JavaScript recursion explained',
    visuals: [
      {
        kind: 'diagram',
        title: 'Call stack growth during recursion',
        diagramId: 'call-stack',
        description: 'Each recursive call adds a new frame until the base case.',
      },
      {
        kind: 'beforeAfter',
        title: 'Before/After: Base case clarity',
        description: 'A clear base case prevents infinite recursion.',
        beforeCode: `// before\nfunction fact(n) {\n  return n * fact(n - 1);\n}\n`,
        afterCode: `// after\nfunction fact(n) {\n  if (n <= 1) return 1;\n  return n * fact(n - 1);\n}\n`,
      },
    ],
    docs: [
      { label: 'MDN: Recursion', url: 'https://developer.mozilla.org/en-US/docs/Glossary/Recursion' },
      { label: 'MDN: Call stack', url: 'https://developer.mozilla.org/en-US/docs/Glossary/Call_stack' },
    ],
  },
  'loops-arrays': {
    title: 'Loops & Arrays',
    videos: [
      JS_FULL_COURSE,
      ytChannelSearch('Fireship', 'arrays in 5 minutes'),
      ytChannelSearch("WebDevSimplified", "JavaScript array methods"),
      ytChannelSearch("TraversyMedia", "JavaScript arrays"),
    ],
    youtubeSearchQuery: 'JavaScript loops and arrays tutorial',
    visuals: [
      {
        kind: 'beforeAfter',
        title: 'Before/After: Loop vs array method',
        description: 'Both are valid; methods can be more declarative.',
        beforeCode: `// before\nconst nums = [1,2,3,4];\nconst evens = [];\nfor (let i = 0; i < nums.length; i++) {\n  if (nums[i] % 2 === 0) evens.push(nums[i]);\n}\n`,
        afterCode: `// after\nconst nums = [1,2,3,4];\nconst evens = nums.filter(n => n % 2 === 0);\n`,
      },
    ],
    docs: [
      { label: 'MDN: Loops', url: 'https://developer.mozilla.org/en-US/docs/Web/JavaScript/Guide/Loops_and_iteration' },
      { label: 'MDN: Arrays', url: 'https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Array' },
      { label: 'MDN: Array methods', url: 'https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Array#instance_methods' },
    ],
  },
  conditionals: {
    title: 'Conditionals',
    videos: [
      JS_FULL_COURSE,
      ytChannelSearch("WebDevSimplified", "if else"),
      ytChannelSearch("TraversyMedia", "JavaScript conditionals"),
    ],
    youtubeSearchQuery: 'JavaScript if else tutorial',
    docs: [
      { label: 'MDN: if...else', url: 'https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Statements/if...else' },
      { label: 'MDN: Comparison operators', url: 'https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Operators#comparison_operators' },
    ],
  },
  closures: {
    title: 'Closures',
    videos: [
      JS_FULL_COURSE,
      ytChannelSearch("WebDevSimplified", "closures"),
      ytChannelSearch("Fireship", "closures"),
    ],
    youtubeSearchQuery: 'JavaScript closures tutorial',
    docs: [
      { label: 'MDN: Closures', url: 'https://developer.mozilla.org/en-US/docs/Web/JavaScript/Closures' },
    ],
  },
  'async-await': {
    title: 'Async/Await',
    videos: [
      JS_FULL_COURSE,
      ytChannelSearch('Fireship', 'async await in 5 minutes'),
      ytChannelSearch("WebDevSimplified", "async await"),
      ytChannelSearch("Fireship", "async await"),
    ],
    youtubeSearchQuery: 'JavaScript async await tutorial',
    visuals: [
      {
        kind: 'diagram',
        title: 'Event loop ordering (high level)',
        diagramId: 'event-loop',
        description: 'Microtasks (Promises) run before macrotasks (setTimeout) after the call stack clears.',
      },
      {
        kind: 'beforeAfter',
        title: 'Before/After: Promise chain → async/await',
        description: 'Same async flow, easier to read in many cases.',
        beforeCode: `// before\nfetch('/api')\n  .then(r => r.json())\n  .then(data => console.log(data))\n  .catch(err => console.error(err));\n`,
        afterCode: `// after\nasync function load() {\n  try {\n    const r = await fetch('/api');\n    const data = await r.json();\n    console.log(data);\n  } catch (err) {\n    console.error(err);\n  }\n}\nload();\n`,
      },
    ],
    docs: [
      { label: 'MDN: async function', url: 'https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Statements/async_function' },
      { label: 'MDN: Promises', url: 'https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Promise' },
      { label: 'MDN: Fetch API', url: 'https://developer.mozilla.org/en-US/docs/Web/API/Fetch_API' },
    ],
  },
  debugging: {
    title: 'Debugging',
    videos: [
      JS_FULL_COURSE,
      ytChannelSearch("ChromeDevs", "DevTools debugging"),
      ytChannelSearch("Fireship", "debugging"),
    ],
    youtubeSearchQuery: 'JavaScript debugging tutorial console devtools',
    docs: [
      { label: 'MDN: Debugging JavaScript', url: 'https://developer.mozilla.org/en-US/docs/Learn/Tools_and_testing/Cross_browser_testing/JavaScript' },
      { label: 'Chrome DevTools', url: 'https://developer.chrome.com/docs/devtools/' },
    ],
  },
};

export function getLessonResource(lessonId: string): LessonResource {
  return (
    RESOURCES[lessonId] || {
      title: 'Resources',
      videos: [JS_FULL_COURSE],
      youtubeSearchQuery: `JavaScript ${lessonId} tutorial`,
      docs: [{ label: 'MDN: JavaScript Guide', url: 'https://developer.mozilla.org/en-US/docs/Web/JavaScript/Guide' }],
    }
  );
}

export function buildYouTubeSearchUrl(query: string): string {
  const q = encodeURIComponent(query);
  return `https://www.youtube.com/results?search_query=${q}`;
}
