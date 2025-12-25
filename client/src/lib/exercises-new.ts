import { Lesson } from "./types";

// ==========================================
// EXERCISES/TASKS SYSTEM WITH MULTI-LANGUAGE SUPPORT
// ==========================================

export type Language = "javascript" | "python" | "c" | "csharp" | "java";

export interface LanguageVariant {
  language: Language;
  initialCode: string;
  solution: string;
  hint?: string;
}

export interface Exercise {
  id: string;
  title: string;
  description: string;
  difficulty: "Beginner" | "Intermediate" | "Advanced";
  variants: {
    javascript?: LanguageVariant;
    python?: LanguageVariant;
    c?: LanguageVariant;
    csharp?: LanguageVariant;
    java?: LanguageVariant;
  };
  tests: {
    name: string;
    input: any[];
    expected: any;
  }[];
  // Optional teaching helpers
  freeTips?: string[]; // small tips shown for free
  paidHint?: string; // more detailed hint purchasable
  paidSolution?: string; // full solution purchasable
  hintPrice?: number;
  solutionPrice?: number;
}

// ==========================================
// 20 EXERCISES WITH MULTI-LANGUAGE SUPPORT
// ==========================================

export const exercises: Exercise[] = [
  {
    id: "sum-two-numbers",
    title: "Sum Two Numbers",
    description: "Write a function that takes two numbers and returns their sum.",
    difficulty: "Beginner",
    variants: {
      javascript: {
        language: "javascript",
        initialCode: `function sum(a, b) {\n  // Your code here\n  \n}`,
        solution: `function sum(a, b) {\n  return a + b;\n}`,
        hint: "Use the + operator to add the parameters",
      },
      python: {
        language: "python",
        initialCode: `def sum(a, b):\n    # Your code here\n    pass`,
        solution: `def sum(a, b):\n    return a + b`,
        hint: "Use the + operator to add the parameters",
      },
      c: {
        language: "c",
        initialCode: `#include <stdio.h>\n\nint sum(int a, int b) {\n  // Your code here\n  \n}\n\nint main() {\n  return 0;\n}`,
        solution: `#include <stdio.h>\n\nint sum(int a, int b) {\n  return a + b;\n}\n\nint main() {\n  return 0;\n}`,
        hint: "Use the + operator to add the parameters",
      },
      csharp: {
        language: "csharp",
        initialCode: `public class Program {\n  public static int sum(int a, int b) {\n    // Your code here\n    \n  }\n}`,
        solution: `public class Program {\n  public static int sum(int a, int b) {\n    return a + b;\n  }\n}`,
        hint: "Use the + operator to add the parameters",
      },
      java: {
        language: "java",
        initialCode: `public class Program {\n  public static int sum(int a, int b) {\n    // Your code here\n    \n  }\n}`,
        solution: `public class Program {\n  public static int sum(int a, int b) {\n    return a + b;\n  }\n}`,
        hint: "Use the + operator to add the parameters",
      },
    },
    tests: [
      { name: "Sum(2, 3)", input: [2, 3], expected: 5 },
      { name: "Sum(10, 5)", input: [10, 5], expected: 15 },
      { name: "Sum(-5, 5)", input: [-5, 5], expected: 0 },
    ],
  },
  {
    id: "even-or-odd",
    title: "Even or Odd",
    description: "Write a function that checks if a number is even or odd.",
    difficulty: "Beginner",
    variants: {
      javascript: {
        language: "javascript",
        initialCode: `function isEven(number) {\n  // Your code here\n  \n}`,
        solution: `function isEven(number) {\n  return number % 2 === 0 ? "even" : "odd";\n}`,
        hint: "Use the modulo operator (%) to get the remainder",
      },
      python: {
        language: "python",
        initialCode: `def is_even(number):\n    # Your code here\n    pass`,
        solution: `def is_even(number):\n    return "even" if number % 2 == 0 else "odd"`,
        hint: "Use the modulo operator (%) to get the remainder",
      },
      c: {
        language: "c",
        initialCode: `#include <stdio.h>\n\nchar* isEven(int number) {\n  // Your code here\n  \n}`,
        solution: `#include <stdio.h>\n\nchar* isEven(int number) {\n  return number % 2 == 0 ? "even" : "odd";\n}`,
        hint: "Use the modulo operator (%) to get the remainder",
      },
      csharp: {
        language: "csharp",
        initialCode: `public class Program {\n  public static string isEven(int number) {\n    // Your code here\n    \n  }\n}`,
        solution: `public class Program {\n  public static string isEven(int number) {\n    return number % 2 == 0 ? "even" : "odd";\n  }\n}`,
        hint: "Use the modulo operator (%) to get the remainder",
      },
      java: {
        language: "java",
        initialCode: `public class Program {\n  public static String isEven(int number) {\n    // Your code here\n    \n  }\n}`,
        solution: `public class Program {\n  public static String isEven(int number) {\n    return number % 2 == 0 ? "even" : "odd";\n  }\n}`,
        hint: "Use the modulo operator (%) to get the remainder",
      },
    },
    tests: [
      { name: "isEven(4)", input: [4], expected: "even" },
      { name: "isEven(7)", input: [7], expected: "odd" },
      { name: "isEven(0)", input: [0], expected: "even" },
    ],
  },
  {
    id: "find-max",
    title: "Find Maximum",
    description: "Write a function that receives three numbers and returns the largest one.",
    difficulty: "Beginner",
    variants: {
      javascript: {
        language: "javascript",
        initialCode: `function findMax(a, b, c) {\n  // Your code here\n  \n}`,
        solution: `function findMax(a, b, c) {\n  return Math.max(a, b, c);\n}`,
        hint: "Use Math.max() or compare with if statements",
      },
      python: {
        language: "python",
        initialCode: `def find_max(a, b, c):\n    # Your code here\n    pass`,
        solution: `def find_max(a, b, c):\n    return max(a, b, c)`,
        hint: "Use the max() function or compare with if statements",
      },
      c: {
        language: "c",
        initialCode: `#include <stdio.h>\n\nint findMax(int a, int b, int c) {\n  // Your code here\n  \n}`,
        solution: `#include <stdio.h>\n\nint findMax(int a, int b, int c) {\n  int max = a;\n  if (b > max) max = b;\n  if (c > max) max = c;\n  return max;\n}`,
        hint: "Compare the values using if statements",
      },
      csharp: {
        language: "csharp",
        initialCode: `public class Program {\n  public static int findMax(int a, int b, int c) {\n    // Your code here\n    \n  }\n}`,
        solution: `public class Program {\n  public static int findMax(int a, int b, int c) {\n    return a > b ? (a > c ? a : c) : (b > c ? b : c);\n  }\n}`,
        hint: "Use ternary operators or Math.Max()",
      },
      java: {
        language: "java",
        initialCode: `public class Program {\n  public static int findMax(int a, int b, int c) {\n    // Your code here\n    \n  }\n}`,
        solution: `public class Program {\n  public static int findMax(int a, int b, int c) {\n    return Math.max(a, Math.max(b, c));\n  }\n}`,
        hint: "Use nested Math.max()",
      },
    },
    tests: [
      { name: "findMax(1, 2, 3)", input: [1, 2, 3], expected: 3 },
      { name: "findMax(10, 3, 7)", input: [10, 3, 7], expected: 10 },
    ],
  },
  {
    id: "reverse-str",
    title: "Reverse String",
    description: "Write a function that reverses a string.",
    difficulty: "Beginner",
    variants: {
      javascript: {
        language: "javascript",
        initialCode: `function reverseString(text) {\n  // Your code here\n  \n}`,
        solution: `function reverseString(text) {\n  return text.split('').reverse().join('');\n}`,
        hint: "Use split(), reverse() and join()",
      },
      python: {
        language: "python",
        initialCode: `def reverse_string(text):\n    # Your code here\n    pass`,
        solution: `def reverse_string(text):\n    return text[::-1]`,
        hint: "Use slicing with [::-1] or reversed()",
      },
      c: {
        language: "c",
        initialCode: `#include <stdio.h>\n#include <string.h>\n\nvoid reverseString(char* text) {\n  // Your code here\n  \n}\n\nint main() {\n  char text[] = "hello";\n  reverseString(text);\n  printf("%s", text);\n  return 0;\n}`,
        solution: `#include <stdio.h>\n#include <string.h>\n\nvoid reverseString(char* text) {\n  int n = strlen(text);\n  for (int i = 0; i < n / 2; i++) {\n    char temp = text[i];\n    text[i] = text[n - 1 - i];\n    text[n - 1 - i] = temp;\n  }\n}\n\nint main() {\n  char text[] = "hello";\n  reverseString(text);\n  printf("%s", text);\n  return 0;\n}`,
        hint: "Use two pointers to swap characters",
      },
      csharp: {
        language: "csharp",
        initialCode: `using System;\n\npublic class Program {\n  static string reverseString(string text) {\n    // Your code here\n    \n  }\n  \n  static void Main() {\n    Console.WriteLine(reverseString("hello"));\n  }\n}`,
        solution: `using System;\n\npublic class Program {\n  static string reverseString(string text) {\n    char[] chars = text.ToCharArray();\n    System.Array.Reverse(chars);\n    return new string(chars);\n  }\n  \n  static void Main() {\n    Console.WriteLine(reverseString("hello"));\n  }\n}`,
        hint: "Use Array.Reverse() or a loop",
      },
      java: {
        language: "java",
        initialCode: `public class Program {\n  static String reverseString(String text) {\n    // Your code here\n    \n  }\n  \n  public static void main(String[] args) {\n    System.out.println(reverseString("hello"));\n  }\n}`,
        solution: `public class Program {\n  static String reverseString(String text) {\n    return new StringBuilder(text).reverse().toString();\n  }\n  \n  public static void main(String[] args) {\n    System.out.println(reverseString("hello"));\n  }\n}`,
        hint: "Use StringBuilder.reverse()",
      },
    },
    tests: [
      { name: "reverseString('hello')", input: ["hello"], expected: "olleh" },
      { name: "reverseString('123')", input: ["123"], expected: "321" },
    ],
  },
  {
    id: "count-vowels",
    title: "Count Vowels",
    description: "Write a function that counts how many vowels exist in a string.",
    difficulty: "Beginner",
    variants: {
      javascript: {
        language: "javascript",
        initialCode: `function countVowels(text) {\n  // Your code here\n  \n}`,
        solution: `function countVowels(text) {\n  return (text.match(/[aeiouAEIOU]/g) || []).length;\n}`,
        hint: "Use a loop or regex to check for vowels",
      },
      python: {
        language: "python",
        initialCode: `def count_vowels(text):\n    # Your code here\n    pass`,
        solution: `def count_vowels(text):\n    return sum(1 for c in text if c.lower() in 'aeiou')`,
        hint: "Use a loop or list comprehension to count vowels",
      },
      c: {
        language: "c",
        initialCode: `#include <stdio.h>\n#include <string.h>\n#include <ctype.h>\n\nint countVowels(char* text) {\n  // Your code here\n  \n}\n\nint main() {\n  printf("%d", countVowels("hello"));\n  return 0;\n}`,
        solution: `#include <stdio.h>\n#include <string.h>\n#include <ctype.h>\n\nint countVowels(char* text) {\n  int count = 0;\n  for (int i = 0; text[i]; i++) {\n    char c = tolower(text[i]);\n    if (c == 'a' || c == 'e' || c == 'i' || c == 'o' || c == 'u') count++;\n  }\n  return count;\n}\n\nint main() {\n  printf("%d", countVowels("hello"));\n  return 0;\n}`,
        hint: "Use a loop and check each character",
      },
      csharp: {
        language: "csharp",
        initialCode: `using System;\nusing System.Linq;\n\npublic class Program {\n  static int countVowels(string text) {\n    // Your code here\n    \n  }\n  \n  static void Main() {\n    Console.WriteLine(countVowels("hello"));\n  }\n}`,
        solution: `using System;\nusing System.Linq;\n\npublic class Program {\n  static int countVowels(string text) {\n    return text.Count(c => "aeiouAEIOU".Contains(c));\n  }\n  \n  static void Main() {\n    Console.WriteLine(countVowels("hello"));\n  }\n}`,
        hint: "Use LINQ Count() with a condition",
      },
      java: {
        language: "java",
        initialCode: `public class Program {\n  static int countVowels(String text) {\n    // Your code here\n    \n  }\n  \n  public static void main(String[] args) {\n    System.out.println(countVowels("hello"));\n  }\n}`,
        solution: `public class Program {\n  static int countVowels(String text) {\n    int count = 0;\n    for (char c : text.toLowerCase().toCharArray()) {\n      if ("aeiou".indexOf(c) >= 0) count++;\n    }\n    return count;\n  }\n  \n  public static void main(String[] args) {\n    System.out.println(countVowels("hello"));\n  }\n}`,
        hint: "Use a loop on the character array",
      },
    },
    tests: [
      { name: "countVowels('hello')", input: ["hello"], expected: 2 },
      { name: "countVowels('programming')", input: ["programming"], expected: 3 },
    ],
  },
  {
    id: "filter-even",
    title: "Filter Even Numbers",
    description: "Return only even numbers from an array.",
    difficulty: "Beginner",
    variants: {
      javascript: {
        language: "javascript",
        initialCode: `function filterEven(array) {\n  // Your code here\n  \n}`,
        solution: `function filterEven(array) {\n  return array.filter(n => n % 2 === 0);\n}`,
        hint: "Use .filter() with a condition for even numbers",
      },
      python: {
        language: "python",
        initialCode: `def filter_even(array):\n    # Your code here\n    pass`,
        solution: `def filter_even(array):\n    return [n for n in array if n % 2 == 0]`,
        hint: "Use list comprehension or filter()",
      },
      c: {
        language: "c",
        initialCode: `#include <stdio.h>\n\nvoid filterEven(int* array, int size, int* result, int* resultSize) {\n  // Your code here\n  *resultSize = 0;\n}\n\nint main() {\n  int array[] = {1, 2, 3, 4, 5};\n  int result[5];\n  int resultSize;\n  filterEven(array, 5, result, &resultSize);\n  return 0;\n}`,
        solution: `#include <stdio.h>\n\nvoid filterEven(int* array, int size, int* result, int* resultSize) {\n  *resultSize = 0;\n  for (int i = 0; i < size; i++) {\n    if (array[i] % 2 == 0) {\n      result[(*resultSize)++] = array[i];\n    }\n  }\n}\n\nint main() {\n  int array[] = {1, 2, 3, 4, 5};\n  int result[5];\n  int resultSize;\n  filterEven(array, 5, result, &resultSize);\n  return 0;\n}`,
        hint: "Use a loop and check n % 2 == 0",
      },
      csharp: {
        language: "csharp",
        initialCode: `using System;\nusing System.Linq;\n\npublic class Program {\n  static int[] filterEven(int[] array) {\n    // Your code here\n    \n  }\n  \n  static void Main() {\n    int[] result = filterEven(new[] { 1, 2, 3, 4, 5 });\n  }\n}`,
        solution: `using System;\nusing System.Linq;\n\npublic class Program {\n  static int[] filterEven(int[] array) {\n    return array.Where(n => n % 2 == 0).ToArray();\n  }\n  \n  static void Main() {\n    int[] result = filterEven(new[] { 1, 2, 3, 4, 5 });\n  }\n}`,
        hint: "Use LINQ Where() with a condition",
      },
      java: {
        language: "java",
        initialCode: `import java.util.*;\nimport java.util.stream.Collectors;\n\npublic class Program {\n  static List<Integer> filterEven(int[] array) {\n    // Your code here\n    \n  }\n  \n  public static void main(String[] args) {\n    filterEven(new int[] { 1, 2, 3, 4, 5 });\n  }\n}`,
        solution: `import java.util.*;\nimport java.util.stream.Collectors;\n\npublic class Program {\n  static List<Integer> filterEven(int[] array) {\n    return Arrays.stream(array).filter(n -> n % 2 == 0).boxed().collect(Collectors.toList());\n  }\n  \n  public static void main(String[] args) {\n    filterEven(new int[] { 1, 2, 3, 4, 5 });\n  }\n}`,
        hint: "Use stream() with filter()",
      },
    },
    tests: [
      { name: "filterEven([1,2,3,4,5])", input: [[1, 2, 3, 4, 5]], expected: [2, 4] },
      { name: "filterEven([2,4,6])", input: [[2, 4, 6]], expected: [2, 4, 6] },
    ],
  },
  {
    id: "factorial",
    title: "Factorial",
    description: "Calculate the factorial of a number. (5! = 5×4×3×2×1 = 120)",
    difficulty: "Intermediate",
    variants: {
      javascript: {
        language: "javascript",
        initialCode: `function factorial(n) {\n  // Your code here\n  \n}`,
        solution: `function factorial(n) {\n  if (n === 0 || n === 1) return 1;\n  let result = 1;\n  for (let i = 2; i <= n; i++) result *= i;\n  return result;\n}`,
        hint: "Use recursion or a loop to multiply the numbers",
      },
      python: {
        language: "python",
        initialCode: `def factorial(n):\n    # Your code here\n    pass`,
        solution: `def factorial(n):\n    if n == 0 or n == 1:\n        return 1\n    result = 1\n    for i in range(2, n + 1):\n        result *= i\n    return result`,
        hint: "Use recursion or a loop to multiply the numbers",
      },
      c: {
        language: "c",
        initialCode: `#include <stdio.h>\n\nint factorial(int n) {\n  // Your code here\n  \n}\n\nint main() {\n  printf("%d", factorial(5));\n  return 0;\n}`,
        solution: `#include <stdio.h>\n\nint factorial(int n) {\n  if (n == 0 || n == 1) return 1;\n  int result = 1;\n  for (int i = 2; i <= n; i++) result *= i;\n  return result;\n}\n\nint main() {\n  printf("%d", factorial(5));\n  return 0;\n}`,
        hint: "Use a loop to multiply",
      },
      csharp: {
        language: "csharp",
        initialCode: `using System;\n\npublic class Program {\n  static int factorial(int n) {\n    // Your code here\n    \n  }\n  \n  static void Main() {\n    Console.WriteLine(factorial(5));\n  }\n}`,
        solution: `using System;\n\npublic class Program {\n  static int factorial(int n) {\n    if (n == 0 || n == 1) return 1;\n    int result = 1;\n    for (int i = 2; i <= n; i++) result *= i;\n    return result;\n  }\n  \n  static void Main() {\n    Console.WriteLine(factorial(5));\n  }\n}`,
        hint: "Use a loop to multiply",
      },
      java: {
        language: "java",
        initialCode: `public class Program {\n  static int factorial(int n) {\n    // Your code here\n    \n  }\n  \n  public static void main(String[] args) {\n    System.out.println(factorial(5));\n  }\n}`,
        solution: `public class Program {\n  static int factorial(int n) {\n    if (n == 0 || n == 1) return 1;\n    int result = 1;\n    for (int i = 2; i <= n; i++) result *= i;\n    return result;\n  }\n  \n  public static void main(String[] args) {\n    System.out.println(factorial(5));\n  }\n}`,
        hint: "Use a loop to multiply",
      },
    },
    tests: [
      { name: "factorial(5)", input: [5], expected: 120 },
      { name: "factorial(0)", input: [0], expected: 1 },
      { name: "factorial(4)", input: [4], expected: 24 },
    ],
  },
  // Additional exercises (to reach 15 total)
  {
    id: "fibonacci",
    title: "Fibonacci",
    description: "Return the n-th Fibonacci number (0-indexed).",
    difficulty: "Intermediate",
    variants: {
      javascript: {
        language: "javascript",
        initialCode: `function fibonacci(n) {\n  // Your code here\n}`,
        solution: `function fibonacci(n) {\n  if (n < 2) return n;\n  let a = 0, b = 1;\n  for (let i = 2; i <= n; i++) { const c = a + b; a = b; b = c; }\n  return b;\n}`,
        hint: "Start from base cases n=0 and n=1 and iterate",
      },
      python: {
        language: "python",
        initialCode: `def fibonacci(n):\n    # Your code here\n    pass`,
        solution: `def fibonacci(n):\n    if n < 2: return n\n    a, b = 0, 1\n    for _ in range(2, n+1):\n        a, b = b, a + b\n    return b`,
        hint: "Use iterative approach to avoid recursion depth",
      }
    },
    tests: [
      { name: "fib(0)", input: [0], expected: 0 },
      { name: "fib(1)", input: [1], expected: 1 },
      { name: "fib(7)", input: [7], expected: 13 }
    ],
    freeTips: ["Draw the first few Fibonacci numbers: 0,1,1,2,3,...","Remember base cases n=0 and n=1"],
    paidHint: "Try maintaining two variables and iterate up to n (I can show step-by-step).",
    paidSolution: "Full iterative solution with complexity explanation.",
    hintPrice: 30,
    solutionPrice: 80,
  },
  {
    id: "is-prime",
    title: "Is Prime",
    description: "Check whether a number is prime.",
    difficulty: "Intermediate",
    variants: {
      javascript: {
        language: "javascript",
        initialCode: `function isPrime(n) {\n  // Your code here\n}`,
        solution: `function isPrime(n) {\n  if (n <= 1) return false;\n  if (n <= 3) return true;\n  if (n % 2 === 0) return false;\n  for (let i = 3; i * i <= n; i += 2) if (n % i === 0) return false;\n  return true;\n}`,
        hint: "Check divisibility up to sqrt(n)",
      }
    },
    tests: [
      { name: "isPrime(2)", input: [2], expected: true },
      { name: "isPrime(15)", input: [15], expected: false },
      { name: "isPrime(17)", input: [17], expected: true }
    ],
    freeTips: ["Even numbers >2 are not prime","You only need to test divisors up to sqrt(n)"],
    paidHint: "I'll show trial division steps for a sample number.",
    paidSolution: "Complete optimized primality check with explanation.",
    hintPrice: 25,
    solutionPrice: 70,
  },
  {
    id: "two-sum",
    title: "Two Sum",
    description: "Given an array and target, return indices of two numbers that add up to target.",
    difficulty: "Intermediate",
    variants: {
      javascript: {
        language: "javascript",
        initialCode: `function twoSum(nums, target) {\n  // Your code here\n}`,
        solution: `function twoSum(nums, target) {\n  const map = new Map();\n  for (let i = 0; i < nums.length; i++) {\n    const need = target - nums[i];\n    if (map.has(need)) return [map.get(need), i];\n    map.set(nums[i], i);\n  }\n  return null;\n}`,
        hint: "Use a hash map to store seen values",
      }
    },
    tests: [
      { name: "twoSum([2,7,11,15],9)", input: [[2,7,11,15],9], expected: [0,1] }
    ],
    freeTips: ["Brute force is O(n^2). Consider storing seen values."],
    paidHint: "Step-by-step hash map approach with example.",
    paidSolution: "Full solution with explanation and complexity.",
    hintPrice: 30,
    solutionPrice: 75,
  },
  {
    id: "palindrome-check",
    title: "Palindrome Check",
    description: "Check if a string is a palindrome.",
    difficulty: "Beginner",
    variants: {
      javascript: {
        language: "javascript",
        initialCode: `function isPalindrome(s) {\n  // Your code here\n}`,
        solution: `function isPalindrome(s) {\n  const cleaned = s.replace(/[^a-z0-9]/gi,'').toLowerCase();\n  return cleaned === cleaned.split('').reverse().join('');\n}`,
        hint: "Normalize the string and compare with its reverse",
      }
    },
    tests: [
      { name: "isPalindrome('madam')", input: ['madam'], expected: true }
    ],
    freeTips: ["Remove non-alphanumeric chars and normalize case"],
    hintPrice: 10,
    solutionPrice: 40,
  },
  {
    id: "anagram",
    title: "Anagram Check",
    description: "Check if two strings are anagrams.",
    difficulty: "Intermediate",
    variants: {
      javascript: {
        language: "javascript",
        initialCode: `function isAnagram(a, b) {\n  // Your code here\n}`,
        solution: `function isAnagram(a, b) {\n  const norm = s => s.replace(/\s+/g,'').toLowerCase().split('').sort().join('');\n  return norm(a) === norm(b);\n}`,
        hint: "Sort characters or use frequency maps",
      }
    },
    tests: [
      { name: "isAnagram('listen','silent')", input: ['listen','silent'], expected: true }
    ],
    freeTips: ["Try sorting characters or counting frequency"],
    hintPrice: 20,
    solutionPrice: 60,
  },
  {
    id: "binary-search",
    title: "Binary Search",
    description: "Implement binary search on a sorted array.",
    difficulty: "Intermediate",
    variants: {
      javascript: {
        language: "javascript",
        initialCode: `function binarySearch(arr, target) {\n  // Your code here\n}`,
        solution: `function binarySearch(arr, target) {\n  let l = 0, r = arr.length - 1;\n  while (l <= r) {\n    const m = Math.floor((l+r)/2);\n    if (arr[m] === target) return m;\n    if (arr[m] < target) l = m+1; else r = m-1;\n  }\n  return -1;\n}`,
        hint: "Keep a left and right pointer and cut the search space in half",
      }
    },
    tests: [
      { name: "binarySearch([1,2,3],2)", input: [[1,2,3],2], expected: 1 }
    ],
    freeTips: ["Visualize mid = Math.floor((l+r)/2)","Check off-by-one carefully"],
    hintPrice: 20,
    solutionPrice: 50,
  },
  {
    id: "quick-sort",
    title: "Quick Sort",
    description: "Implement Quick Sort (advanced).",
    difficulty: "Advanced",
    variants: {
      javascript: {
        language: "javascript",
        initialCode: `function quickSort(arr) {\n  // Your code here\n}`,
        solution: `function quickSort(arr) {\n  if (arr.length <= 1) return arr;\n  const pivot = arr[Math.floor(arr.length/2)];\n  const left = arr.filter(x => x < pivot);\n  const right = arr.filter(x => x > pivot);\n  const middle = arr.filter(x => x === pivot);\n  return [...quickSort(left), ...middle, ...quickSort(right)];\n}`,
        hint: "Pick a pivot and partition the array",
      }
    },
    tests: [
      { name: "quickSort([3,1,2])", input: [[3,1,2]], expected: [1,2,3] }
    ],
    freeTips: ["Recursively sort partitions"],
    paidHint: "I'll show partition example step-by-step.",
    paidSolution: "Full implementation with pivot selection notes.",
    hintPrice: 50,
    solutionPrice: 120,
  },
  {
    id: "matrix-transpose",
    title: "Matrix Transpose",
    description: "Transpose a 2D matrix.",
    difficulty: "Advanced",
    variants: {
      javascript: {
        language: "javascript",
        initialCode: `function transpose(matrix) {\n  // Your code here\n}`,
        solution: `function transpose(matrix) {\n  const rows = matrix.length;\n  const cols = matrix[0].length;\n  const out = Array.from({length: cols}, () => Array(rows));\n  for (let r=0;r<rows;r++) for (let c=0;c<cols;c++) out[c][r] = matrix[r][c];\n  return out;\n}`,
        hint: "Swap indices: result[c][r] = matrix[r][c]",
      }
    },
    tests: [
      { name: "transpose([[1,2],[3,4]])", input: [[[1,2],[3,4]]], expected: [[1,3],[2,4]] }
    ],
    freeTips: ["Think in terms of rows and columns indexes"],
    hintPrice: 40,
    solutionPrice: 100,
  },
];
