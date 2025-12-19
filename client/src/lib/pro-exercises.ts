import { Exercise, Language, LanguageVariant } from "./exercises-new";

// ==========================================
// PRO-ONLY EXERCISES - ADVANCED CHALLENGES
// ==========================================

export interface ProExercise extends Omit<Exercise, 'variants'> {
  isPro: true;
  category: "algorithms" | "data-structures" | "async" | "performance" | "design-patterns";
  estimatedTime: string;
  points?: number;
  complexity?: {
    time: string;
    space: string;
  };
  languages: Language[];
  initialCode: Record<string, string>;
  solution: Record<string, string>;
  hint?: string;
}

export const proExercises: ProExercise[] = [
  {
    id: "binary-search",
    title: "Binary Search Implementation",
    description: "Implement a binary search algorithm that finds the position of a target value within a sorted array. Return -1 if not found.",
    difficulty: "Intermediate",
    isPro: true,
    category: "algorithms",
    estimatedTime: "15-20 min",
    points: 100,
    complexity: {
      time: "O(log n)",
      space: "O(1)",
    },
    languages: ["javascript", "python"],
    initialCode: {
      javascript: `function binarySearch(arr, target) {\n  // Implement binary search\n  // arr is sorted in ascending order\n  \n}`,
      python: `def binary_search(arr, target):\n    # Implement binary search\n    # arr is sorted in ascending order\n    pass`,
    },
    solution: {
      javascript: `function binarySearch(arr, target) {\n  let left = 0;\n  let right = arr.length - 1;\n  \n  while (left <= right) {\n    const mid = Math.floor((left + right) / 2);\n    \n    if (arr[mid] === target) {\n      return mid;\n    } else if (arr[mid] < target) {\n      left = mid + 1;\n    } else {\n      right = mid - 1;\n    }\n  }\n  \n  return -1;\n}`,
      python: `def binary_search(arr, target):\n    left, right = 0, len(arr) - 1\n    \n    while left <= right:\n        mid = (left + right) // 2\n        \n        if arr[mid] == target:\n            return mid\n        elif arr[mid] < target:\n            left = mid + 1\n        else:\n            right = mid - 1\n    \n    return -1`,
    },
    hint: "Use two pointers (left, right) and find the middle. Compare with target and adjust pointers accordingly.",
    tests: [
      { name: "Find 5 in [1,2,3,4,5,6,7]", input: [[1,2,3,4,5,6,7], 5], expected: 4 },
      { name: "Find 1 in [1,2,3,4,5]", input: [[1,2,3,4,5], 1], expected: 0 },
      { name: "Not found", input: [[1,2,3,4,5], 10], expected: -1 },
      { name: "Empty array", input: [[], 5], expected: -1 },
    ],
  },
  {
    id: "merge-sorted-arrays",
    title: "Merge Two Sorted Arrays",
    description: "Given two sorted arrays, merge them into a single sorted array.",
    difficulty: "Intermediate",
    isPro: true,
    category: "algorithms",
    estimatedTime: "20-25 min",
    points: 100,
    complexity: {
      time: "O(n + m)",
      space: "O(n + m)",
    },
    languages: ["javascript", "python"],
    initialCode: {
      javascript: `function mergeSortedArrays(arr1, arr2) {\n  // Merge two sorted arrays\n  \n}`,
      python: `def merge_sorted_arrays(arr1, arr2):\n    # Merge two sorted arrays\n    pass`,
    },
    solution: {
      javascript: `function mergeSortedArrays(arr1, arr2) {\n  const result = [];\n  let i = 0, j = 0;\n  \n  while (i < arr1.length && j < arr2.length) {\n    if (arr1[i] < arr2[j]) {\n      result.push(arr1[i]);\n      i++;\n    } else {\n      result.push(arr2[j]);\n      j++;\n    }\n  }\n  \n  return result.concat(arr1.slice(i)).concat(arr2.slice(j));\n}`,
      python: `def merge_sorted_arrays(arr1, arr2):\n    result = []\n    i, j = 0, 0\n    \n    while i < len(arr1) and j < len(arr2):\n        if arr1[i] < arr2[j]:\n            result.append(arr1[i])\n            i += 1\n        else:\n            result.append(arr2[j])\n            j += 1\n    \n    result.extend(arr1[i:])\n    result.extend(arr2[j:])\n    return result`,
    },
    hint: "Use two pointers, one for each array. Compare elements and push the smaller one to result.",
    tests: [
      { name: "Merge [1,3,5] and [2,4,6]", input: [[1,3,5], [2,4,6]], expected: [1,2,3,4,5,6] },
      { name: "Merge [1,2,3] and [4,5,6]", input: [[1,2,3], [4,5,6]], expected: [1,2,3,4,5,6] },
      { name: "Empty arrays", input: [[], []], expected: [] },
      { name: "One empty", input: [[1,2,3], []], expected: [1,2,3] },
    ],
  },
  {
    id: "linked-list-cycle",
    title: "Detect Cycle in Linked List",
    description: "Detect if a linked list has a cycle using Floyd's algorithm (tortoise and hare).",
    difficulty: "Advanced",
    isPro: true,
    category: "data-structures",
    estimatedTime: "25-30 min",
    points: 150,
    complexity: {
      time: "O(n)",
      space: "O(1)",
    },
    languages: ["javascript", "python"],
    initialCode: {
      javascript: `class Node {\n  constructor(val) {\n    this.val = val;\n    this.next = null;\n  }\n}\n\nfunction hasCycle(head) {\n  // Detect cycle using two pointers\n  \n}`,
      python: `class Node:\n    def __init__(self, val):\n        self.val = val\n        self.next = None\n\ndef has_cycle(head):\n    # Detect cycle using two pointers\n    pass`,
    },
    solution: {
      javascript: `class Node {\n  constructor(val) {\n    this.val = val;\n    this.next = null;\n  }\n}\n\nfunction hasCycle(head) {\n  if (!head || !head.next) return false;\n  \n  let slow = head;\n  let fast = head.next;\n  \n  while (slow !== fast) {\n    if (!fast || !fast.next) return false;\n    slow = slow.next;\n    fast = fast.next.next;\n  }\n  \n  return true;\n}`,
      python: `class Node:\n    def __init__(self, val):\n        self.val = val\n        self.next = None\n\ndef has_cycle(head):\n    if not head or not head.next:\n        return False\n    \n    slow = head\n    fast = head.next\n    \n    while slow != fast:\n        if not fast or not fast.next:\n            return False\n        slow = slow.next\n        fast = fast.next.next\n    \n    return True`,
    },
    hint: "Use two pointers: slow moves one step, fast moves two steps. If they meet, there's a cycle.",
    tests: [
      { name: "No cycle", input: ["test case would need special setup"], expected: false },
      { name: "Has cycle", input: ["test case would need special setup"], expected: true },
    ],
  },
  {
    id: "debounce-function",
    title: "Implement Debounce",
    description: "Create a debounce function that delays the execution of a function until after a specified wait time has elapsed since the last call.",
    difficulty: "Advanced",
    isPro: true,
    category: "async",
    estimatedTime: "30-35 min",
    points: 120,
    complexity: {
      time: "O(1)",
      space: "O(1)",
    },
    languages: ["javascript", "python"],
    initialCode: {
      javascript: `function debounce(fn, delay) {\n  // Implement debounce\n  \n}`,
      python: `import time\nimport threading\n\ndef debounce(fn, delay):\n    # Implement debounce\n    pass`,
    },
    solution: {
      javascript: `function debounce(fn, delay) {\n  let timeoutId = null;\n  \n  return function(...args) {\n    clearTimeout(timeoutId);\n    timeoutId = setTimeout(() => {\n      fn.apply(this, args);\n    }, delay);\n  };\n}`,
      python: `import time\nimport threading\n\ndef debounce(fn, delay):\n    timer = None\n    \n    def debounced(*args, **kwargs):\n        nonlocal timer\n        if timer:\n            timer.cancel()\n        timer = threading.Timer(delay / 1000, fn, args=args, kwargs=kwargs)\n        timer.start()\n    \n    return debounced`,
    },
    hint: "Use setTimeout and clearTimeout. Store the timeout ID in a closure variable.",
    tests: [
      { name: "Basic test", input: ["mock"], expected: "mock" },
    ],
  },
  {
    id: "lru-cache",
    title: "LRU Cache Implementation",
    description: "Implement a Least Recently Used (LRU) cache with get and put operations in O(1) time complexity.",
    difficulty: "Advanced",
    isPro: true,
    category: "data-structures",
    estimatedTime: "40-45 min",
    points: 200,
    complexity: {
      time: "O(1)",
      space: "O(capacity)",
    },
    languages: ["javascript", "python"],
    initialCode: {
      javascript: `class LRUCache {\n  constructor(capacity) {\n    // Initialize cache\n  }\n  \n  get(key) {\n    // Get value by key\n  }\n  \n  put(key, value) {\n    // Put key-value pair\n  }\n}`,
      python: `class LRUCache:\n    def __init__(self, capacity):\n        # Initialize cache\n        pass\n    \n    def get(self, key):\n        # Get value by key\n        pass\n    \n    def put(self, key, value):\n        # Put key-value pair\n        pass`,
    },
    solution: {
      javascript: `class LRUCache {\n  constructor(capacity) {\n    this.capacity = capacity;\n    this.cache = new Map();\n  }\n  \n  get(key) {\n    if (!this.cache.has(key)) return -1;\n    const value = this.cache.get(key);\n    this.cache.delete(key);\n    this.cache.set(key, value);\n    return value;\n  }\n  \n  put(key, value) {\n    if (this.cache.has(key)) {\n      this.cache.delete(key);\n    }\n    this.cache.set(key, value);\n    if (this.cache.size > this.capacity) {\n      const firstKey = this.cache.keys().next().value;\n      this.cache.delete(firstKey);\n    }\n  }\n}`,
      python: `from collections import OrderedDict\n\nclass LRUCache:\n    def __init__(self, capacity):\n        self.capacity = capacity\n        self.cache = OrderedDict()\n    \n    def get(self, key):\n        if key not in self.cache:\n            return -1\n        self.cache.move_to_end(key)\n        return self.cache[key]\n    \n    def put(self, key, value):\n        if key in self.cache:\n            self.cache.move_to_end(key)\n        self.cache[key] = value\n        if len(self.cache) > self.capacity:\n            self.cache.popitem(last=False)`,
    },
    hint: "Use a Map/OrderedDict to maintain insertion order. Move accessed items to the end.",
    tests: [
      { name: "Basic operations", input: ["mock"], expected: "mock" },
    ],
  },
  {
    id: "promise-all",
    title: "Implement Promise.all",
    description: "Create your own implementation of Promise.all that takes an array of promises and returns a promise that resolves when all input promises have resolved.",
    difficulty: "Advanced",
    isPro: true,
    category: "async",
    estimatedTime: "30-40 min",
    points: 150,
    complexity: {
      time: "O(n)",
      space: "O(n)",
    },
    languages: ["javascript", "python"],
    initialCode: {
      javascript: `function promiseAll(promises) {\n  // Implement Promise.all\n  \n}`,
      python: `import asyncio\n\nasync def promise_all(promises):\n    # Implement Promise.all equivalent\n    pass`,
    },
    solution: {
      javascript: `function promiseAll(promises) {\n  return new Promise((resolve, reject) => {\n    if (promises.length === 0) {\n      resolve([]);\n      return;\n    }\n    \n    const results = [];\n    let completed = 0;\n    \n    promises.forEach((promise, index) => {\n      Promise.resolve(promise)\n        .then(value => {\n          results[index] = value;\n          completed++;\n          if (completed === promises.length) {\n            resolve(results);\n          }\n        })\n        .catch(error => reject(error));\n    });\n  });\n}`,
      python: `import asyncio\n\nasync def promise_all(promises):\n    if not promises:\n        return []\n    \n    results = await asyncio.gather(*promises)\n    return results`,
    },
    hint: "Create a new Promise. Track completed promises and resolve when all are done. Reject on first error.",
    tests: [
      { name: "Mock test", input: ["mock"], expected: "mock" },
    ],
  },
  {
    id: "throttle-function",
    title: "Implement Throttle",
    description: "Create a throttle function that limits the rate at which a function can fire - it will only execute once per specified interval.",
    difficulty: "Advanced",
    isPro: true,
    category: "performance",
    estimatedTime: "25-30 min",
    points: 120,
    complexity: {
      time: "O(1)",
      space: "O(1)",
    },
    languages: ["javascript", "python"],
    initialCode: {
      javascript: `function throttle(fn, interval) {\n  // Implement throttle\n  \n}`,
      python: `import time\n\ndef throttle(fn, interval):\n    # Implement throttle\n    pass`,
    },
    solution: {
      javascript: `function throttle(fn, interval) {\n  let lastCall = 0;\n  \n  return function(...args) {\n    const now = Date.now();\n    \n    if (now - lastCall >= interval) {\n      lastCall = now;\n      fn.apply(this, args);\n    }\n  };\n}`,
      python: `import time\n\ndef throttle(fn, interval):\n    last_call = [0]\n    \n    def throttled(*args, **kwargs):\n        now = time.time()\n        if now - last_call[0] >= interval:\n            last_call[0] = now\n            return fn(*args, **kwargs)\n    \n    return throttled`,
    },
    hint: "Track the last execution time. Only execute if enough time has passed since last call.",
    tests: [
      { name: "Mock test", input: ["mock"], expected: "mock" },
    ],
  },
  {
    id: "deep-clone",
    title: "Deep Clone Object",
    description: "Implement a function that creates a deep copy of a nested object, handling circular references.",
    difficulty: "Advanced",
    isPro: true,
    category: "data-structures",
    estimatedTime: "35-40 min",
    points: 180,
    complexity: {
      time: "O(n)",
      space: "O(n)",
    },
    languages: ["javascript", "python"],
    initialCode: {
      javascript: `function deepClone(obj, map = new WeakMap()) {\n  // Implement deep clone with circular reference handling\n  \n}`,
      python: `def deep_clone(obj, memo=None):\n    # Implement deep clone with circular reference handling\n    pass`,
    },
    solution: {
      javascript: `function deepClone(obj, map = new WeakMap()) {\n  if (obj === null || typeof obj !== 'object') {\n    return obj;\n  }\n  \n  if (map.has(obj)) {\n    return map.get(obj);\n  }\n  \n  const clone = Array.isArray(obj) ? [] : {};\n  map.set(obj, clone);\n  \n  for (const key in obj) {\n    if (obj.hasOwnProperty(key)) {\n      clone[key] = deepClone(obj[key], map);\n    }\n  }\n  \n  return clone;\n}`,
      python: `def deep_clone(obj, memo=None):\n    if memo is None:\n        memo = {}\n    \n    if id(obj) in memo:\n        return memo[id(obj)]\n    \n    if isinstance(obj, (int, float, str, bool, type(None))):\n        return obj\n    \n    if isinstance(obj, list):\n        clone = []\n        memo[id(obj)] = clone\n        for item in obj:\n            clone.append(deep_clone(item, memo))\n        return clone\n    \n    if isinstance(obj, dict):\n        clone = {}\n        memo[id(obj)] = clone\n        for key, value in obj.items():\n            clone[key] = deep_clone(value, memo)\n        return clone\n    \n    return obj`,
    },
    hint: "Use recursion and WeakMap/dictionary to track visited objects to handle circular references.",
    tests: [
      { name: "Nested object", input: [{a: {b: {c: 1}}}], expected: {a: {b: {c: 1}}} },
      { name: "Array", input: [[1, [2, [3, 4]]]], expected: [1, [2, [3, 4]]] },
    ],
  },
];

export function isProExercise(exerciseId: string): boolean {
  return proExercises.some(ex => ex.id === exerciseId);
}

export function getProExercisesByCategory(category: ProExercise["category"]): ProExercise[] {
  return proExercises.filter(ex => ex.category === category);
}

export function getAllProExercises(): ProExercise[] {
  return proExercises;
}
