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
        solution: `#include <stdio.h>\n\nchar* isEven(int number) {\n  return number % 2 == 0 ? "even" : "?mpar";\n}`,
        hint: "Use o operador m?dulo (%) para obter o resto da divis?o",
      },
      csharp: {
        language: "csharp",
        initialCode: `public class Program {\n  public static str isEven(int number) {\n    // Your code here\n    \n  }\n}`,
        solution: `public class Program {\n  public static str isEven(int number) {\n    return number % 2 == 0 ? "even" : "?mpar";\n  }\n}`,
        hint: "Use o operador m?dulo (%) para obter o resto da divis?o",
      },
      java: {
        language: "java",
        initialCode: `public class Program {\n  public static str isEven(int number) {\n    // Your code here\n    \n  }\n}`,
        solution: `public class Program {\n  public static str isEven(int number) {\n    return number % 2 == 0 ? "even" : "?mpar";\n  }\n}`,
        hint: "Use o operador m?dulo (%) para obter o resto da divis?o",
      },
    },
    tests: [
      { name: "isEven(4)", input: [4], expected: "even" },
      { name: "isEven(7)", input: [7], expected: "?mpar" },
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
        hint: "Use Math.max() ou compare com if statements",
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
        hint: "Compare os valuees usando if statements",
      },
      csharp: {
        language: "csharp",
        initialCode: `public class Program {\n  public static int findMax(int a, int b, int c) {\n    // Your code here\n    \n  }\n}`,
        solution: `public class Program {\n  public static int findMax(int a, int b, int c) {\n    return a > b ? (a > c ? a : c) : (b > c ? b : c);\n  }\n}`,
        hint: "Use operadores tern?rios ou Math.Max()",
      },
      java: {
        language: "java",
        initialCode: `public class Program {\n  public static int findMax(int a, int b, int c) {\n    // Your code here\n    \n  }\n}`,
        solution: `public class Program {\n  public static int findMax(int a, int b, int c) {\n    return Math.max(a, Math.max(b, c));\n  }\n}`,
        hint: "Use Math.max() aninhado",
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
        hint: "Use split(), reverse() e join()",
      },
      python: {
        language: "python",
        initialCode: `def reverse_string(text):\n    # Your code here\n    pass`,
        solution: `def reverse_string(text):\n    return text[::-1]`,
        hint: "Use slicing com [::-1] ou reversed()",
      },
      c: {
        language: "c",
        initialCode: `#include <stdio.h>\n#include <string.h>\n\nvoid reverseString(char* text) {\n  // Your code here\n  \n}\n\nint main() {\n  char text[] = "hello";\n  reverseString(text);\n  printf("%s", text);\n  return 0;\n}`,
        solution: `#include <stdio.h>\n#include <string.h>\n\nvoid reverseString(char* text) {\n  int n = strlen(text);\n  for (int i = 0; i < n / 2; i++) {\n    char temp = text[i];\n    text[i] = text[n - 1 - i];\n    text[n - 1 - i] = temp;\n  }\n}\n\nint main() {\n  char text[] = "hello";\n  reverseString(text);\n  printf("%s", text);\n  return 0;\n}`,
        hint: "Use dois ponteiros para trocar caracteres",
      },
      csharp: {
        language: "csharp",
        initialCode: `using System;\n\npublic class Program {\n  static str reverseString(str text) {\n    // Your code here\n    \n  }\n  \n  static void Main() {\n    Console.WriteLine(reverseString("hello"));\n  }\n}`,
        solution: `using System;\n\npublic class Program {\n  static str reverseString(str text) {\n    char[] chars = text.ToToToCharArray();\n    System.array.Reverse(chars);\n    return new string(chars);\n  }\n  \n  static void Main() {\n    Console.WriteLine(reverseString("hello"));\n  }\n}`,
        hint: "Use array.Reverse() or a loop",
      },
      java: {
        language: "java",
        initialCode: `public class Program {\n  static str reverseString(str text) {\n    // Your code here\n    \n  }\n  \n  public static void main(string[] args) {\n    System.out.println(reverseString("hello"));\n  }\n}`,
        solution: `public class Program {\n  static str reverseString(str text) {\n    return new StringBuilder(text).reverse().toString();\n  }\n  \n  public static void main(string[] args) {\n    System.out.println(reverseString("hello"));\n  }\n}`,
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
        hint: "Use a loop or regex to check vowels",
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
        hint: "Use um loop e verifique cada caractere",
      },
      csharp: {
        language: "csharp",
        initialCode: `using System;\nusing System.Linq;\n\npublic class Program {\n  static int countVowels(string text) {\n    // Your code here\n    \n  }\n  \n  static void Main() {\n    Console.WriteLine(countVowels("hello"));\n  }\n}`,
        solution: `using System;\nusing System.Linq;\n\npublic class Program {\n  static int countVowels(string text) {\n    return text.Count(c => "aeiouAEIOU".Contains(c));\n  }\n  \n  static void Main() {\n    Console.WriteLine(countVowels("hello"));\n  }\n}`,
        hint: "Use LINQ Count() com uma condition",
      },
      java: {
        language: "java",
        initialCode: `public class Program {\n  static int countVowels(string text) {\n    // Your code here\n    \n  }\n  \n  public static void main(string[] args) {\n    System.out.println(countVowels("hello"));\n  }\n}`,
        solution: `public class Program {\n  static int countVowels(string text) {\n    int count = 0;\n    for (char c : text.toLowerCase().toToToCharArray()) {\n      if ("aeiou".indexOf(c) >= 0) count++;\n    }\n    return count;\n  }\n  \n  public static void main(string[] args) {\n    System.out.println(countVowels("hello"));\n  }\n}`,
        hint: "Use a loop on the character array",
      },
    },
    tests: [
      { name: "countVowels('hello')", input: ["hello"], expected: 2 },
      { name: "countVowels('programacao')", input: ["programacao"], expected: 5 },
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
        hint: "Use list comprehension ou filter()",
      },
      c: {
        language: "c",
        initialCode: `#include <stdio.h>\n\nvoid filterEven(int* array, int size, int* result, int* resultSize) {\n  // Your code here\n  *resultSize = 0;\n}\n\nint main() {\n  int array[] = {1, 2, 3, 4, 5};\n  int result[5];\n  int resultSize;\n  filterEven(array, 5, result, &resultSize);\n  return 0;\n}`,
        solution: `#include <stdio.h>\n\nvoid filterEven(int* array, int size, int* result, int* resultSize) {\n  *resultSize = 0;\n  for (int i = 0; i < size; i++) {\n    if (array[i] % 2 == 0) {\n      result[(*resultSize)++] = array[i];\n    }\n  }\n}\n\nint main() {\n  int array[] = {1, 2, 3, 4, 5};\n  int result[5];\n  int resultSize;\n  filterEven(array, 5, result, &resultSize);\n  return 0;\n}`,
        hint: "Use um loop e verifique n % 2 == 0",
      },
      csharp: {
        language: "csharp",
        initialCode: `using System;\nusing System.Linq;\n\npublic class Program {\n  static int[] filterEven(int[] array) {\n    // Your code here\n    \n  }\n  \n  static void Main() {\n    int[] result = filterEven(new[] { 1, 2, 3, 4, 5 });\n  }\n}`,
        solution: `using System;\nusing System.Linq;\n\npublic class Program {\n  static int[] filterEven(int[] array) {\n    return array.Where(n => n % 2 == 0).Toarray();\n  }\n  \n  static void Main() {\n    int[] result = filterEven(new[] { 1, 2, 3, 4, 5 });\n  }\n}`,
        hint: "Use LINQ Where() com uma condition",
      },
      java: {
        language: "java",
        initialCode: `import java.util.*;\nimport java.util.stream.Collectors;\n\npublic class Program {\n  static List<Integer> filterEven(int[] array) {\n    // Your code here\n    \n  }\n  \n  public static void main(string[] args) {\n    filterEven(new int[] { 1, 2, 3, 4, 5 });\n  }\n}`,
        solution: `import java.util.*;\nimport java.util.stream.Collectors;\n\npublic class Program {\n  static List<Integer> filterEven(int[] array) {\n    return arrays.stream(array).filter(n -> n % 2 == 0).boxed().collect(Collectors.toList());\n  }\n  \n  public static void main(string[] args) {\n    filterEven(new int[] { 1, 2, 3, 4, 5 });\n  }\n}`,
        hint: "Use stream() com filter()",
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
        initialCode: `function Factorial(n) {\n  // Your code here\n  \n}`,
        solution: `function Factorial(n) {\n  if (n === 0 || n === 1) return 1;\n  let result = 1;\n  for (let i = 2; i <= n; i++) result *= i;\n  return result;\n}`,
        hint: "Use recursion or a loop to multiply the numbers",
      },
      python: {
        language: "python",
        initialCode: `def Factorial(n):\n    # Your code here\n    pass`,
        solution: `def Factorial(n):\n    if n == 0 or n == 1:\n        return 1\n    result = 1\n    for i in range(2, n + 1):\n        result *= i\n    return result`,
        hint: "Use recursion or a loop to multiply the numbers",
      },
      c: {
        language: "c",
        initialCode: `#include <stdio.h>\n\nint Factorial(int n) {\n  // Your code here\n  \n}\n\nint main() {\n  printf("%d", Factorial(5));\n  return 0;\n}`,
        solution: `#include <stdio.h>\n\nint Factorial(int n) {\n  if (n == 0 || n == 1) return 1;\n  int result = 1;\n  for (int i = 2; i <= n; i++) result *= i;\n  return result;\n}\n\nint main() {\n  printf("%d", Factorial(5));\n  return 0;\n}`,
        hint: "Use um loop para multiplicar",
      },
      csharp: {
        language: "csharp",
        initialCode: `using System;\n\npublic class Program {\n  static int Factorial(int n) {\n    // Your code here\n    \n  }\n  \n  static void Main() {\n    Console.WriteLine(Factorial(5));\n  }\n}`,
        solution: `using System;\n\npublic class Program {\n  static int Factorial(int n) {\n    if (n == 0 || n == 1) return 1;\n    int result = 1;\n    for (int i = 2; i <= n; i++) result *= i;\n    return result;\n  }\n  \n  static void Main() {\n    Console.WriteLine(Factorial(5));\n  }\n}`,
        hint: "Use um loop para multiplicar",
      },
      java: {
        language: "java",
        initialCode: `public class Program {\n  static int Factorial(int n) {\n    // Your code here\n    \n  }\n  \n  public static void main(string[] args) {\n    System.out.println(Factorial(5));\n  }\n}`,
        solution: `public class Program {\n  static int Factorial(int n) {\n    if (n == 0 || n == 1) return 1;\n    int result = 1;\n    for (int i = 2; i <= n; i++) result *= i;\n    return result;\n  }\n  \n  public static void main(string[] args) {\n    System.out.println(Factorial(5));\n  }\n}`,
        hint: "Use um loop para multiplicar",
      },
    },
    tests: [
      { name: "Factorial(5)", input: [5], expected: 120 },
      { name: "Factorial(0)", input: [0], expected: 1 },
      { name: "Factorial(4)", input: [4], expected: 24 },
    ],
  },
  {
    id: "palindrome",
    title: "Palindrome",
    description: "Check if a word is a palindrome (reads the same forwards and backwards).",
    difficulty: "Intermediate",
    variants: {
      javascript: {
        language: "javascript",
        initialCode: `function isPalindrome(word) {\n  // Your code here\n  \n}`,
        solution: `function isPalindrome(word) {\n  const invertida = word.split('').reverse().join('');\n  return word === invertida;\n}`,
        hint: "Compare a word com ela mesma invertida",
      },
      python: {
        language: "python",
        initialCode: `def is_palindrome(word):\n    # Your code here\n    pass`,
        solution: `def is_palindrome(word):\n    return word == word[::-1]`,
        hint: "Compare a word com ela mesma invertida usando slicing",
      },
      c: {
        language: "c",
        initialCode: `#include <stdio.h>\n#include <string.h>\n#include <stdbool.h>\n\nbool isPalindrome(char* word) {\n  // Your code here\n  \n}\n\nint main() {\n  printf("%s", isPalindrome("arara") ? "true" : "false");\n  return 0;\n}`,
        solution: `#include <stdio.h>\n#include <string.h>\n#include <stdbool.h>\n\nbool isPalindrome(char* word) {\n  int len = strlen(word);\n  for (int i = 0; i < len / 2; i++) {\n    if (word[i] != word[len - 1 - i]) return false;\n  }\n  return true;\n}\n\nint main() {\n  printf("%s", isPalindrome("arara") ? "true" : "false");\n  return 0;\n}`,
        hint: "Use two pointers to compare characters",
      },
      csharp: {
        language: "csharp",
        initialCode: `using System;\n\npublic class Program {\n  static bool isPalindrome(str word) {\n    // Your code here\n    \n  }\n  \n  static void Main() {\n    Console.WriteLine(isPalindrome("arara"));\n  }\n}`,
        solution: `using System;\n\npublic class Program {\n  static bool isPalindrome(str word) {\n    for (int i = 0; i < word.Length / 2; i++) {\n      if (word[i] != word[word.Length - 1 - i]) return false;\n    }\n    return true;\n  }\n  \n  static void Main() {\n    Console.WriteLine(isPalindrome("arara"));\n  }\n}`,
        hint: "Use a loop to compare characters",
      },
      java: {
        language: "java",
        initialCode: `public class Program {\n  static boolean isPalindrome(str word) {\n    // Your code here\n    \n  }\n  \n  public static void main(string[] args) {\n    System.out.println(isPalindrome("arara"));\n  }\n}`,
        solution: `public class Program {\n  static boolean isPalindrome(str word) {\n    for (int i = 0; i < word.length() / 2; i++) {\n      if (word.charAt(i) != word.charAt(word.length() - 1 - i)) return false;\n    }\n    return true;\n  }\n  \n  public static void main(string[] args) {\n    System.out.println(isPalindrome("arara"));\n  }\n}`,
        hint: "Use charAt() to access characters",
      },
    },
    tests: [
      { name: "isPalindrome('arara')", input: ["arara"], expected: true },
      { name: "isPalindrome('hello')", input: ["hello"], expected: false },
      { name: "isPalindrome('aba')", input: ["aba"], expected: true },
    ],
  },
  {
    id: "count-occurrences",
    title: "Contar Ocorr?ncias",
    description: "Conte quantas vezes um element aparece em um array.",
    difficulty: "Beginner",
    variants: {
      javascript: {
        language: "javascript",
        initialCode: `function countOccurrences(array, element) {\n  // Your code here\n  \n}`,
        solution: `function countOccurrences(array, element) {\n  return array.filter(item => item === element).length;\n}`,
        hint: "Use .filter() to count matching elements",
      },
      python: {
        language: "python",
        initialCode: `def count_occurrences(array, element):\n    # Your code here\n    pass`,
        solution: `def count_occurrences(array, element):\n    return array.count(element)`,
        hint: "Use o m?todo .count() da list",
      },
      c: {
        language: "c",
        initialCode: `#include <stdio.h>\n\nint countOccurrences(int* array, int size, int element) {\n  // Your code here\n  \n}\n\nint main() {\n  int array[] = {1, 2, 2, 3, 2};\n  printf("%d", countOccurrences(array, 5, 2));\n  return 0;\n}`,
        solution: `#include <stdio.h>\n\nint countOccurrences(int* array, int size, int element) {\n  int count = 0;\n  for (int i = 0; i < size; i++) {\n    if (array[i] == element) count++;\n  }\n  return count;\n}\n\nint main() {\n  int array[] = {1, 2, 2, 3, 2};\n  printf("%d", countOccurrences(array, 5, 2));\n  return 0;\n}`,
        hint: "Use a loop to count matching elements",
      },
      csharp: {
        language: "csharp",
        initialCode: `using System;\nusing System.Linq;\n\npublic class Program {\n  static int countOccurrences(int[] array, int element) {\n    // Your code here\n    \n  }\n  \n  static void Main() {\n    int[] array = {1, 2, 2, 3, 2};\n    Console.WriteLine(countOccurrences(array, 2));\n  }\n}`,
        solution: `using System;\nusing System.Linq;\n\npublic class Program {\n  static int countOccurrences(int[] array, int element) {\n    return array.Count(n => n == element);\n  }\n  \n  static void Main() {\n    int[] array = {1, 2, 2, 3, 2};\n    Console.WriteLine(countOccurrences(array, 2));\n  }\n}`,
        hint: "Use LINQ Count()",
      },
      java: {
        language: "java",
        initialCode: `import java.util.*;\n\npublic class Program {\n  static int countOccurrences(int[] array, int element) {\n    // Your code here\n    \n  }\n  \n  public static void main(string[] args) {\n    int[] array = {1, 2, 2, 3, 2};\n    System.out.println(countOccurrences(array, 2));\n  }\n}`,
        solution: `import java.util.*;\n\npublic class Program {\n  static int countOccurrences(int[] array, int element) {\n    int count = 0;\n    for (int n : array) {\n      if (n == element) count++;\n    }\n    return count;\n  }\n  \n  public static void main(string[] args) {\n    int[] array = {1, 2, 2, 3, 2};\n    System.out.println(countOccurrences(array, 2));\n  }\n}`,
        hint: "Use an enhanced for loop",
      },
    },
    tests: [
      { name: "countOccurrences([1,2,2,3,2], 2)", input: [[1, 2, 2, 3, 2], 2], expected: 3 },
      { name: "countOccurrences([1,1,1], 1)", input: [[1, 1, 1], 1], expected: 3 },
    ],
  },
  {
    id: "sum-array",
    title: "Sum array",
    description: "Sum all numbers in an array.",
    difficulty: "Beginner",
    variants: {
      javascript: {
        language: "javascript",
        initialCode: `function sumarray(array) {\n  // Your code here\n  \n}`,
        solution: `function sumarray(array) {\n  return array.reduce((sum, n) => sum + n, 0);\n}`,
        hint: "Use .reduce() ou um loop",
      },
      python: {
        language: "python",
        initialCode: `def sum_array(array):\n    # Your code here\n    pass`,
        solution: `def sum_array(array):\n    return sum(array)`,
        hint: "Use the sum() function or a loop",
      },
      c: {
        language: "c",
        initialCode: `#include <stdio.h>\n\nint sumarray(int* array, int size) {\n  // Your code here\n  \n}\n\nint main() {\n  int array[] = {1, 2, 3, 4};\n  printf("%d", sumarray(array, 4));\n  return 0;\n}`,
        solution: `#include <stdio.h>\n\nint sumarray(int* array, int size) {\n  int sum = 0;\n  for (int i = 0; i < size; i++) sum += array[i];\n  return sum;\n}\n\nint main() {\n  int array[] = {1, 2, 3, 4};\n  printf("%d", sumarray(array, 4));\n  return 0;\n}`,
        hint: "Use a loop to sum elements",
      },
      csharp: {
        language: "csharp",
        initialCode: `using System;\nusing System.Linq;\n\npublic class Program {\n  static int sumarray(int[] array) {\n    // Your code here\n    \n  }\n  \n  static void Main() {\n    int[] array = {1, 2, 3, 4};\n    Console.WriteLine(sumarray(array));\n  }\n}`,
        solution: `using System;\nusing System.Linq;\n\npublic class Program {\n  static int sumarray(int[] array) {\n    return array.Sum();\n  }\n  \n  static void Main() {\n    int[] array = {1, 2, 3, 4};\n    Console.WriteLine(sumarray(array));\n  }\n}`,
        hint: "Use LINQ Sum()",
      },
      java: {
        language: "java",
        initialCode: `import java.util.*;\n\npublic class Program {\n  static int sumarray(int[] array) {\n    // Your code here\n    \n  }\n  \n  public static void main(string[] args) {\n    int[] array = {1, 2, 3, 4};\n    System.out.println(sumarray(array));\n  }\n}`,
        solution: `import java.util.*;\n\npublic class Program {\n  static int sumarray(int[] array) {\n    return arrays.stream(array).sum();\n  }\n  \n  public static void main(string[] args) {\n    int[] array = {1, 2, 3, 4};\n    System.out.println(sumarray(array));\n  }\n}`,
        hint: "Use stream().sum()",
      },
    },
    tests: [
      { name: "sumarray([1,2,3,4])", input: [[1, 2, 3, 4]], expected: 10 },
      { name: "sumarray([10,20])", input: [[10, 20]], expected: 30 },
    ],
  },
  {
    id: "quick-sort",
    title: "Quick Sort",
    description: "Implement the Quick Sort algorithm to sort an array.",
    difficulty: "Advanced",
    variants: {
      javascript: {
        language: "javascript",
        initialCode: `function quickSort(array) {\n  // Your code here\n  \n}`,
        solution: `function quickSort(array) {\n  if (array.length <= 1) return array;\n  const pivot = array[0];\n  const left = array.slice(1).filter(x => x <= pivot);\n  const right = array.slice(1).filter(x => x > pivot);\n  return [...quickSort(left), pivot, ...quickSort(right)];\n}`,
        hint: "Choose a pivot and partition recursively",
      },
      python: {
        language: "python",
        initialCode: `def quick_sort(array):\n    # Your code here\n    pass`,
        solution: `def quick_sort(array):\n    if len(array) <= 1:\n        return array\n    pivot = array[0]\n    left = [x for x in array[1:] if x <= pivot]\n    right = [x for x in array[1:] if x > pivot]\n    return quick_sort(left) + [pivot] + quick_sort(right)`,
        hint: "Escolha um pivot e particione recursivamente",
      },
      c: {
        language: "c",
        initialCode: `#include <stdio.h>\n\nvoid quickSort(int* array, int left, int right) {\n  // Your code here\n  \n}\n\nint main() {\n  int array[] = {3, 1, 2};\n  quickSort(array, 0, 2);\n  return 0;\n}`,
        solution: `#include <stdio.h>\n\nvoid swap(int* a, int* b) {\n  int temp = *a;\n  *a = *b;\n  *b = temp;\n}\n\nint partition(int* array, int left, int right) {\n  int pivot = array[right];\n  int i = left - 1;\n  for (int j = left; j < right; j++) {\n    if (array[j] <= pivot) {\n      swap(&array[++i], &array[j]);\n    }\n  }\n  swap(&array[++i], &array[right]);\n  return i;\n}\n\nvoid quickSort(int* array, int left, int right) {\n  if (left < right) {\n    int p = partition(array, left, right);\n    quickSort(array, left, p - 1);\n    quickSort(array, p + 1, right);\n  }\n}\n\nint main() {\n  int array[] = {3, 1, 2};\n  quickSort(array, 0, 2);\n  return 0;\n}`,
        hint: "Use recursion com pivot e particionamento",
      },
      csharp: {
        language: "csharp",
        initialCode: `using System;\n\npublic class Program {\n  static int[] QuickSort(int[] array) {\n    // Your code here\n    \n  }\n  \n  static void Main() {\n    int[] result = QuickSort(new[] { 3, 1, 2 });\n  }\n}`,
        solution: `using System;\nusing System.Linq;\n\npublic class Program {\n  static int[] QuickSort(int[] array) {\n    if (array.Length <= 1) return array;\n    int pivot = array[0];\n    int[] left = array.Skip(1).Where(x => x <= pivot).Toarray();\n    int[] right = array.Skip(1).Where(x => x > pivot).Toarray();\n    return QuickSort(left).Concat(new[] { pivot }).Concat(QuickSort(right)).Toarray();\n  }\n  \n  static void Main() {\n    int[] result = QuickSort(new[] { 3, 1, 2 });\n  }\n}`,
        hint: "Use recursion com LINQ",
      },
      java: {
        language: "java",
        initialCode: `import java.util.*;\n\npublic class Program {\n  static int[] quickSort(int[] array) {\n    // Your code here\n    \n  }\n  \n  public static void main(string[] args) {\n    int[] result = quickSort(new int[] { 3, 1, 2 });\n  }\n}`,
        solution: `import java.util.*;\n\npublic class Program {\n  static int[] quickSort(int[] array) {\n    if (array.length <= 1) return array;\n    int pivot = array[0];\n    List<Integer> left = new arrayList<>();\n    List<Integer> right = new arrayList<>();\n    for (int i = 1; i < array.length; i++) {\n      if (array[i] <= pivot) left.add(array[i]);\n      else right.add(array[i]);\n    }\n    int[] result = new int[array.length];\n    int idx = 0;\n    int[] leftArr = quickSort(left.stream().mapToInt(Integer::intValue).toarray());\n    int[] rightArr = quickSort(right.stream().mapToInt(Integer::intValue).toarray());\n    for (int x : leftArr) result[idx++] = x;\n    result[idx++] = pivot;\n    for (int x : rightArr) result[idx++] = x;\n    return result;\n  }\n  \n  public static void main(string[] args) {\n    int[] result = quickSort(new int[] { 3, 1, 2 });\n  }\n}`,
        hint: "Use recursion com arrays",
      },
    },
    tests: [
      { name: "quickSort([3,1,2])", input: [[3, 1, 2]], expected: [1, 2, 3] },
      { name: "quickSort([5,2,8,1])", input: [[5, 2, 8, 1]], expected: [1, 2, 5, 8] },
    ],
  },
  {
    id: "merge-sorted",
    title: "Merge arrays",
    description: "Merge two already-sorted arrays while maintaining order.",
    difficulty: "Advanced",
    variants: {
      javascript: {
        language: "javascript",
        initialCode: `function mesclarOrdenados(arr1, arr2) {\n  // Your code here\n  \n}`,
        solution: `function mesclarOrdenados(arr1, arr2) {\n  const result = [];\n  let i = 0, j = 0;\n  while (i < arr1.length && j < arr2.length) {\n    if (arr1[i] <= arr2[j]) result.push(arr1[i++]);\n    else result.push(arr2[j++]);\n  }\n  return [...result, ...arr1.slice(i), ...arr2.slice(j)];\n}`,
        hint: "Use two pointers to compare elements",
      },
      python: {
        language: "python",
        initialCode: `def mesclar_ordenados(arr1, arr2):\n    # Your code here\n    pass`,
        solution: `def mesclar_ordenados(arr1, arr2):\n    result = []\n    i = j = 0\n    while i < len(arr1) and j < len(arr2):\n        if arr1[i] <= arr2[j]:\n            result.append(arr1[i])\n            i += 1\n        else:\n            result.append(arr2[j])\n            j += 1\n    return result + arr1[i:] + arr2[j:]`,
        hint: "Use dois ponteiros para comparar elements",
      },
      c: {
        language: "c",
        initialCode: `#include <stdio.h>\n\nvoid mesclarOrdenados(int* arr1, int size1, int* arr2, int size2, int* result) {\n  // Your code here\n  \n}\n\nint main() {\n  int arr1[] = {1, 3, 5};\n  int arr2[] = {2, 4, 6};\n  int result[6];\n  mesclarOrdenados(arr1, 3, arr2, 3, result);\n  return 0;\n}`,
        solution: `#include <stdio.h>\n\nvoid mesclarOrdenados(int* arr1, int size1, int* arr2, int size2, int* result) {\n  int i = 0, j = 0, k = 0;\n  while (i < size1 && j < size2) {\n    if (arr1[i] <= arr2[j]) result[k++] = arr1[i++];\n    else result[k++] = arr2[j++];\n  }\n  while (i < size1) result[k++] = arr1[i++];\n  while (j < size2) result[k++] = arr2[j++];\n}\n\nint main() {\n  int arr1[] = {1, 3, 5};\n  int arr2[] = {2, 4, 6};\n  int result[6];\n  mesclarOrdenados(arr1, 3, arr2, 3, result);\n  return 0;\n}`,
        hint: "Use dois ponteiros para comparar",
      },
      csharp: {
        language: "csharp",
        initialCode: `using System;\nusing System.Linq;\n\npublic class Program {\n  static int[] MesclarOrdenados(int[] arr1, int[] arr2) {\n    // Your code here\n    \n  }\n  \n  static void Main() {\n    int[] result = MesclarOrdenados(new[] { 1, 3, 5 }, new[] { 2, 4, 6 });\n  }\n}`,
        solution: `using System;\nusing System.Linq;\n\npublic class Program {\n  static int[] MesclarOrdenados(int[] arr1, int[] arr2) {\n    int i = 0, j = 0;\n    List<int> result = new List<int>();\n    while (i < arr1.Length && j < arr2.Length) {\n      if (arr1[i] <= arr2[j]) result.Add(arr1[i++]);\n      else result.Add(arr2[j++]);\n    }\n    while (i < arr1.Length) result.Add(arr1[i++]);\n    while (j < arr2.Length) result.Add(arr2[j++]);\n    return result.Toarray();\n  }\n  \n  static void Main() {\n    int[] result = MesclarOrdenados(new[] { 1, 3, 5 }, new[] { 2, 4, 6 });\n  }\n}`,
        hint: "Use List<int> para construir o result",
      },
      java: {
        language: "java",
        initialCode: `import java.util.*;\n\npublic class Program {\n  static int[] mesclarOrdenados(int[] arr1, int[] arr2) {\n    // Your code here\n    \n  }\n  \n  public static void main(string[] args) {\n    int[] result = mesclarOrdenados(new int[] { 1, 3, 5 }, new int[] { 2, 4, 6 });\n  }\n}`,
        solution: `import java.util.*;\n\npublic class Program {\n  static int[] mesclarOrdenados(int[] arr1, int[] arr2) {\n    List<Integer> result = new arrayList<>();\n    int i = 0, j = 0;\n    while (i < arr1.length && j < arr2.length) {\n      if (arr1[i] <= arr2[j]) result.add(arr1[i++]);\n      else result.add(arr2[j++]);\n    }\n    while (i < arr1.length) result.add(arr1[i++]);\n    while (j < arr2.length) result.add(arr2[j++]);\n    return result.stream().mapToInt(Integer::intValue).toarray();\n  }\n  \n  public static void main(string[] args) {\n    int[] result = mesclarOrdenados(new int[] { 1, 3, 5 }, new int[] { 2, 4, 6 });\n  }\n}`,
        hint: "Use List<Integer> para construir o result",
      },
    },
    tests: [
      { name: "mesclarOrdenados([1,3,5], [2,4,6])", input: [[1, 3, 5], [2, 4, 6]], expected: [1, 2, 3, 4, 5, 6] },
    ],
  },
  {
    id: "binary-search",
    title: "Busca Bin?ria",
    description: "Implement binary search on a sorted array.",
    difficulty: "Intermediate",
    variants: {
      javascript: {
        language: "javascript",
        initialCode: `function buscaBinaria(array, alvo) {\n  // Your code here\n  \n}`,
        solution: `function buscaBinaria(array, alvo) {\n  let left = 0, right = array.length - 1;\n  while (left <= right) {\n    const mid = Math.floor((left + right) / 2);\n    if (array[mid] === alvo) return mid;\n    if (array[mid] < alvo) left = mid + 1;\n    else right = mid - 1;\n  }\n  return -1;\n}`,
        hint: "Divida o espa?o de busca pela metade a cada itera??o",
      },
      python: {
        language: "python",
        initialCode: `def busca_binaria(array, alvo):\n    # Your code here\n    pass`,
        solution: `def busca_binaria(array, alvo):\n    left, right = 0, len(array) - 1\n    while left <= right:\n        mid = (left + right) // 2\n        if array[mid] == alvo:\n            return mid\n        elif array[mid] < alvo:\n            left = mid + 1\n        else:\n            right = mid - 1\n    return -1`,
        hint: "Divida o espa?o de busca pela metade a cada itera??o",
      },
      c: {
        language: "c",
        initialCode: `#include <stdio.h>\n\nint buscaBinaria(int* array, int size, int alvo) {\n  // Your code here\n  return -1;\n}\n\nint main() {\n  int array[] = {1, 3, 5, 7, 9};\n  printf("%d", buscaBinaria(array, 5, 5));\n  return 0;\n}`,
        solution: `#include <stdio.h>\n\nint buscaBinaria(int* array, int size, int alvo) {\n  int left = 0, right = size - 1;\n  while (left <= right) {\n    int mid = (left + right) / 2;\n    if (array[mid] == alvo) return mid;\n    if (array[mid] < alvo) left = mid + 1;\n    else right = mid - 1;\n  }\n  return -1;\n}\n\nint main() {\n  int array[] = {1, 3, 5, 7, 9};\n  printf("%d", buscaBinaria(array, 5, 5));\n  return 0;\n}`,
        hint: "Divida o espa?o de busca",
      },
      csharp: {
        language: "csharp",
        initialCode: `using System;\n\npublic class Program {\n  static int BuscaBinaria(int[] array, int alvo) {\n    // Your code here\n    return -1;\n  }\n  \n  static void Main() {\n    int[] array = {1, 3, 5, 7, 9};\n    Console.WriteLine(BuscaBinaria(array, 5));\n  }\n}`,
        solution: `using System;\n\npublic class Program {\n  static int BuscaBinaria(int[] array, int alvo) {\n    int left = 0, right = array.Length - 1;\n    while (left <= right) {\n      int mid = (left + right) / 2;\n      if (array[mid] == alvo) return mid;\n      if (array[mid] < alvo) left = mid + 1;\n      else right = mid - 1;\n    }\n    return -1;\n  }\n  \n  static void Main() {\n    int[] array = {1, 3, 5, 7, 9};\n    Console.WriteLine(BuscaBinaria(array, 5));\n  }\n}`,
        hint: "Use a two-pointer loop with left/right",
      },
      java: {
        language: "java",
        initialCode: `public class Program {\n  static int buscaBinaria(int[] array, int alvo) {\n    // Your code here\n    return -1;\n  }\n  \n  public static void main(string[] args) {\n    int[] array = {1, 3, 5, 7, 9};\n    System.out.println(buscaBinaria(array, 5));\n  }\n}`,
        solution: `public class Program {\n  static int buscaBinaria(int[] array, int alvo) {\n    int left = 0, right = array.length - 1;\n    while (left <= right) {\n      int mid = (left + right) / 2;\n      if (array[mid] == alvo) return mid;\n      if (array[mid] < alvo) left = mid + 1;\n      else right = mid - 1;\n    }\n    return -1;\n  }\n  \n  public static void main(string[] args) {\n    int[] array = {1, 3, 5, 7, 9};\n    System.out.println(buscaBinaria(array, 5));\n  }\n}`,
        hint: "Use um loop com left/right",
      },
    },
    tests: [
      { name: "buscaBinaria([1,3,5,7,9], 5)", input: [[1, 3, 5, 7, 9], 5], expected: 2 },
      { name: "buscaBinaria([1,3,5,7,9], 10)", input: [[1, 3, 5, 7, 9], 10], expected: -1 },
    ],
  },
  {
    id: "anagrams",
    title: "Anagrams",
    description: "Check if two words are anagrams of each other.",
    difficulty: "Beginner",
    variants: {
      javascript: {
        language: "javascript",
        initialCode: `function saoAnagrams(p1, p2) {\n  // Your code here\n  \n}`,
        solution: `function saoAnagrams(p1, p2) {\n  return p1.split('').sort().join('') === p2.split('').sort().join('');\n}`,
        hint: "Sort the letters and compare",
      },
      python: {
        language: "python",
        initialCode: `def sao_Anagrams(p1, p2):\n    # Your code here\n    pass`,
        solution: `def sao_Anagrams(p1, p2):\n    return sorted(p1) == sorted(p2)`,
        hint: "Use sorted() para ordenar as letras",
      },
      c: {
        language: "c",
        initialCode: `#include <stdio.h>\n#include <string.h>\n#include <stdbool.h>\n\nbool saoAnagrams(char* p1, char* p2) {\n  // Your code here\n  return false;\n}\n\nint main() {\n  printf("%s", saoAnagrams("listen", "silent") ? "true" : "false");\n  return 0;\n}`,
        solution: `#include <stdio.h>\n#include <string.h>\n#include <stdbool.h>\n\nint compare(const void* a, const void* b) {\n  return *(char*)a - *(char*)b;\n}\n\nbool saoAnagrams(char* p1, char* p2) {\n  if (strlen(p1) != strlen(p2)) return false;\n  char s1[256], s2[256];\n  strcpy(s1, p1);\n  strcpy(s2, p2);\n  qsort(s1, strlen(s1), 1, compare);\n  qsort(s2, strlen(s2), 1, compare);\n  return strcmp(s1, s2) == 0;\n}\n\nint main() {\n  printf("%s", saoAnagrams("listen", "silent") ? "true" : "false");\n  return 0;\n}`,
        hint: "Sort the strs and compare",
      },
      csharp: {
        language: "csharp",
        initialCode: `using System;\nusing System.Linq;\n\npublic class Program {\n  static bool SaoAnagrams(str p1, str p2) {\n    // Your code here\n    return false;\n  }\n  \n  static void Main() {\n    Console.WriteLine(SaoAnagrams("listen", "silent"));\n  }\n}`,
        solution: `using System;\nusing System.Linq;\n\npublic class Program {\n  static bool SaoAnagrams(str p1, str p2) {\n    return p1.OrderBy(c => c).SequenceEqual(p2.OrderBy(c => c));\n  }\n  \n  static void Main() {\n    Console.WriteLine(SaoAnagrams("listen", "silent"));\n  }\n}`,
        hint: "Use LINQ OrderBy() e SequenceEqual()",
      },
      java: {
        language: "java",
        initialCode: `import java.util.*;\n\npublic class Program {\n  static boolean saoAnagrams(str p1, str p2) {\n    // Your code here\n    return false;\n  }\n  \n  public static void main(string[] args) {\n    System.out.println(saoAnagrams("listen", "silent"));\n  }\n}`,
        solution: `import java.util.*;\n\npublic class Program {\n  static boolean saoAnagrams(str p1, str p2) {\n    char[] c1 = p1.toToToCharArray();\n    char[] c2 = p2.toToToCharArray();\n    arrays.sort(c1);\n    arrays.sort(c2);\n    return arrays.equals(c1, c2);\n  }\n  \n  public static void main(string[] args) {\n    System.out.println(saoAnagrams("listen", "silent"));\n  }\n}`,
        hint: "Use arrays.sort() e arrays.equals()",
      },
    },
    tests: [
      { name: "saoAnagrams('listen', 'silent')", input: ["listen", "silent"], expected: true },
      { name: "saoAnagrams('hello', 'world')", input: ["hello", "world"], expected: false },
    ],
  },
  {
    id: "longest-substr",
    title: "Longest Substr",
    description: "Find the longest substring without repeating characters.",
    difficulty: "Advanced",
    variants: {
      javascript: {
        language: "javascript",
        initialCode: `function substrMaisLonga(s) {\n  // Your code here\n  \n}`,
        solution: `function substrMaisLonga(s) {\n  const map = {};\n  let maxLen = 0, start = 0;\n  for (let i = 0; i < s.length; i++) {\n    if (map[s[i]] !== undefined) start = Math.max(start, map[s[i]] + 1);\n    map[s[i]] = i;\n    maxLen = Math.max(maxLen, i - start + 1);\n  }\n  return maxLen;\n}`,
        hint: "Use a sliding window with a Map",
      },
      python: {
        language: "python",
        initialCode: `def substr_mais_longa(s):\n    # Your code here\n    pass`,
        solution: `def substr_mais_longa(s):\n    char_map = {}\n    max_len = 0\n    start = 0\n    for i, char in enumerate(s):\n        if char in char_map:\n            start = max(start, char_map[char] + 1)\n        char_map[char] = i\n        max_len = max(max_len, i - start + 1)\n    return max_len`,
        hint: "Use sliding window com um dicion?rio",
      },
      c: {
        language: "c",
        initialCode: `#include <stdio.h>\n#include <string.h>\n\nint substrMaisLonga(char* s) {\n  // Your code here\n  return 0;\n}\n\nint main() {\n  printf("%d", substrMaisLonga("abcabcbb"));\n  return 0;\n}`,
        solution: `#include <stdio.h>\n#include <string.h>\n\nint substrMaisLonga(char* s) {\n  int map[256];\n  for (int i = 0; i < 256; i++) map[i] = -1;\n  int maxLen = 0, start = 0;\n  for (int i = 0; s[i]; i++) {\n    if (map[(unsigned char)s[i]] >= start) start = map[(unsigned char)s[i]] + 1;\n    map[(unsigned char)s[i]] = i;\n    int len = i - start + 1;\n    if (len > maxLen) maxLen = len;\n  }\n  return maxLen;\n}\n\nint main() {\n  printf("%d", substrMaisLonga("abcabcbb"));\n  return 0;\n}`,
        hint: "Use an array to store positions",
      },
      csharp: {
        language: "csharp",
        initialCode: `using System;\nusing System.Collections.Generic;\n\npublic class Program {\n  static int SubstrMaisLonga(str s) {\n    // Your code here\n    return 0;\n  }\n  \n  static void Main() {\n    Console.WriteLine(SubstrMaisLonga("abcabcbb"));\n  }\n}`,
        solution: `using System;\nusing System.Collections.Generic;\n\npublic class Program {\n  static int SubstrMaisLonga(str s) {\n    Dictionary<char, int> map = new Dictionary<char, int>();\n    int maxLen = 0, start = 0;\n    for (int i = 0; i < s.Length; i++) {\n      if (map.ContainsKey(s[i])) start = Math.Max(start, map[s[i]] + 1);\n      map[s[i]] = i;\n      maxLen = Math.Max(maxLen, i - start + 1);\n    }\n    return maxLen;\n  }\n  \n  static void Main() {\n    Console.WriteLine(SubstrMaisLonga("abcabcbb"));\n  }\n}`,
        hint: "Use Dictionary to store positions",
      },
      java: {
        language: "java",
        initialCode: `import java.util.*;\n\npublic class Program {\n  static int substrMaisLonga(str s) {\n    // Your code here\n    return 0;\n  }\n  \n  public static void main(string[] args) {\n    System.out.println(substrMaisLonga("abcabcbb"));\n  }\n}`,
        solution: `import java.util.*;\n\npublic class Program {\n  static int substrMaisLonga(str s) {\n    Map<Character, Integer> map = new HashMap<>();\n    int maxLen = 0, start = 0;\n    for (int i = 0; i < s.length(); i++) {\n      if (map.containsKey(s.charAt(i))) start = Math.max(start, map.get(s.charAt(i)) + 1);\n      map.put(s.charAt(i), i);\n      maxLen = Math.max(maxLen, i - start + 1);\n    }\n    return maxLen;\n  }\n  \n  public static void main(string[] args) {\n    System.out.println(substrMaisLonga("abcabcbb"));\n  }\n}`,
        hint: "Use HashMap para armazenar posi??es",
      },
    },
    tests: [
      { name: "substrMaisLonga('abcabcbb')", input: ["abcabcbb"], expected: 3 },
      { name: "substrMaisLonga('dvdf')", input: ["dvdf"], expected: 3 },
    ],
  },
  {
    id: "matrix-spiral",
    title: "Spiral Matrix",
    description: "Traverse a matrix in spiral order.",
    difficulty: "Advanced",
    variants: {
      javascript: {
        language: "javascript",
        initialCode: `function matrizEspiral(m) {\n  // Your code here\n  \n}`,
        solution: `function matrizEspiral(m) {\n  const r = [];\n  let top = 0, bot = m.length - 1, left = 0, right = m[0].length - 1;\n  while (top <= bot && left <= right) {\n    for (let i = left; i <= right; i++) r.push(m[top][i]);\n    top++;\n    for (let i = top; i <= bot; i++) r.push(m[i][right]);\n    right--;\n    if (top <= bot) for (let i = right; i >= left; i--) r.push(m[bot][i]);\n    bot--;\n    if (left <= right) for (let i = bot; i >= top; i--) r.push(m[i][left]);\n    left++;\n  }\n  return r;\n}`,
        hint: "Manage window bounds and shrink them",
      },
      python: {
        language: "python",
        initialCode: `def matriz_espiral(m):\n    # Your code here\n    pass`,
        solution: `def matriz_espiral(m):\n    r = []\n    top, bot, left, right = 0, len(m) - 1, 0, len(m[0]) - 1\n    while top <= bot and left <= right:\n        for i in range(left, right + 1):\n            r.append(m[top][i])\n        top += 1\n        for i in range(top, bot + 1):\n            r.append(m[i][right])\n        right -= 1\n        if top <= bot:\n            for i in range(right, left - 1, -1):\n                r.append(m[bot][i])\n            bot -= 1\n        if left <= right:\n            for i in range(bot, top - 1, -1):\n                r.append(m[i][left])\n            left += 1\n    return r`,
        hint: "Manage window bounds and shrink them",
      },
      c: {
        language: "c",
        initialCode: `#include <stdio.h>\n\nvoid matrizEspiral(int** m, int rows, int cols, int* result, int* resultSize) {\n  // Your code here\n  *resultSize = 0;\n}\n\nint main() {\n  return 0;\n}`,
        solution: `#include <stdio.h>\n\nvoid matrizEspiral(int** m, int rows, int cols, int* result, int* resultSize) {\n  *resultSize = 0;\n  int top = 0, bot = rows - 1, left = 0, right = cols - 1;\n  while (top <= bot && left <= right) {\n    for (int i = left; i <= right; i++) result[(*resultSize)++] = m[top][i];\n    top++;\n    for (int i = top; i <= bot; i++) result[(*resultSize)++] = m[i][right];\n    right--;\n    if (top <= bot) for (int i = right; i >= left; i--) result[(*resultSize)++] = m[bot][i];\n    bot--;\n    if (left <= right) for (int i = bot; i >= top; i--) result[(*resultSize)++] = m[i][left];\n    left++;\n  }\n}\n\nint main() {\n  return 0;\n}`,
        hint: "Manage window bounds and shrink them",
      },
      csharp: {
        language: "csharp",
        initialCode: `using System;\nusing System.Collections.Generic;\n\npublic class Program {\n  static int[] MatrizEspiral(int[][] m) {\n    // Your code here\n    \n  }\n  \n  static void Main() {\n  }\n}`,
        solution: `using System;\nusing System.Collections.Generic;\n\npublic class Program {\n  static int[] MatrizEspiral(int[][] m) {\n    List<int> r = new List<int>();\n    int top = 0, bot = m.Length - 1, left = 0, right = m[0].Length - 1;\n    while (top <= bot && left <= right) {\n      for (int i = left; i <= right; i++) r.Add(m[top][i]);\n      top++;\n      for (int i = top; i <= bot; i++) r.Add(m[i][right]);\n      right--;\n      if (top <= bot) for (int i = right; i >= left; i--) r.Add(m[bot][i]);\n      bot--;\n      if (left <= right) for (int i = bot; i >= top; i--) r.Add(m[i][left]);\n      left++;\n    }\n    return r.Toarray();\n  }\n  \n  static void Main() {\n  }\n}`,
        hint: "Manage window bounds and shrink them",
      },
      java: {
        language: "java",
        initialCode: `import java.util.*;\n\npublic class Program {\n  static int[] matrizEspiral(int[][] m) {\n    // Your code here\n    \n  }\n  \n  public static void main(string[] args) {\n  }\n}`,
        solution: `import java.util.*;\n\npublic class Program {\n  static int[] matrizEspiral(int[][] m) {\n    List<Integer> r = new arrayList<>();\n    int top = 0, bot = m.length - 1, left = 0, right = m[0].length - 1;\n    while (top <= bot && left <= right) {\n      for (int i = left; i <= right; i++) r.add(m[top][i]);\n      top++;\n      for (int i = top; i <= bot; i++) r.add(m[i][right]);\n      right--;\n      if (top <= bot) for (int i = right; i >= left; i--) r.add(m[bot][i]);\n      bot--;\n      if (left <= right) for (int i = bot; i >= top; i--) r.add(m[i][left]);\n      left++;\n    }\n    return r.stream().mapToInt(Integer::intValue).toarray();\n  }\n  \n  public static void main(string[] args) {\n  }\n}`,
        hint: "Manage window bounds and shrink them",
      },
    },
    tests: [
      { name: "matrizEspiral([[1,2,3],[4,5,6],[7,8,9]])", input: [[[1,2,3],[4,5,6],[7,8,9]]], expected: [1,2,3,6,9,8,7,4,5] },
    ],
  },
  {
    id: "balanced-parens",
    title: "Par?nteses Balanceados",
    description: "Check if parentheses/brackets/braces are balanced.",
    difficulty: "Intermediate",
    variants: {
      javascript: {
        language: "javascript",
        initialCode: `function balanceado(s) {\n  // Your code here\n  \n}`,
        solution: `function balanceado(s) {\n  const stack = [];\n  const map = { ')': '(', '}': '{', ']': '[' };\n  for (let c of s) {\n    if (c in map) {\n      if (stack.pop() !== map[c]) return false;\n    } else stack.push(c);\n  }\n  return stack.length === 0;\n}`,
        hint: "Use a stack to track parentheses",
      },
      python: {
        language: "python",
        initialCode: `def balanceado(s):\n    # Your code here\n    pass`,
        solution: `def balanceado(s):\n    stack = []\n    map = { ')': '(', '}': '{', ']': '[' }\n    for c in s:\n        if c in map:\n            if not stack or stack.pop() != map[c]:\n                return False\n        else:\n            stack.append(c)\n    return len(stack) == 0`,
        hint: "Use uma stack para rastrear par?nteses",
      },
      c: {
        language: "c",
        initialCode: `#include <stdio.h>\n#include <string.h>\n#include <stdbool.h>\n\nbool balanceado(char* s) {\n  // Your code here\n  return true;\n}\n\nint main() {\n  printf("%s", balanceado("()") ? "true" : "false");\n  return 0;\n}`,
        solution: `#include <stdio.h>\n#include <string.h>\n#include <stdbool.h>\n\nbool balanceado(char* s) {\n  int stack[1000], top = -1;\n  for (int i = 0; s[i]; i++) {\n    if (s[i] == '(' || s[i] == '[' || s[i] == '{') {\n      stack[++top] = s[i];\n    } else if (s[i] == ')' || s[i] == ']' || s[i] == '}') {\n      if (top < 0) return false;\n      int open = stack[top--];\n      if ((s[i] == ')' && open != '(') || (s[i] == ']' && open != '[') || (s[i] == '}' && open != '{')) return false;\n    }\n  }\n  return top == -1;\n}\n\nint main() {\n  printf("%s", balanceado("()") ? "true" : "false");\n  return 0;\n}`,
        hint: "Use an array as a stack",
      },
      csharp: {
        language: "csharp",
        initialCode: `using System;\nusing System.Collections.Generic;\n\npublic class Program {\n  static bool Balanceado(str s) {\n    // Your code here\n    return true;\n  }\n  \n  static void Main() {\n    Console.WriteLine(Balanceado("()"));\n  }\n}`,
        solution: `using System;\nusing System.Collections.Generic;\n\npublic class Program {\n  static bool Balanceado(str s) {\n    Stack<char> stack = new Stack<char>();\n    Dictionary<char, char> map = new Dictionary<char, char> { { ')', '(' }, { '}', '{' }, { ']', '[' } };\n    foreach (char c in s) {\n      if (map.ContainsKey(c)) {\n        if (stack.Count == 0 || stack.Pop() != map[c]) return false;\n      } else {\n        stack.Push(c);\n      }\n    }\n    return stack.Count == 0;\n  }\n  \n  static void Main() {\n    Console.WriteLine(Balanceado("()"));\n  }\n}`,
        hint: "Use Stack<char> e Dictionary",
      },
      java: {
        language: "java",
        initialCode: `import java.util.*;\n\npublic class Program {\n  static boolean balanceado(str s) {\n    // Your code here\n    return true;\n  }\n  \n  public static void main(string[] args) {\n    System.out.println(balanceado("()"));\n  }\n}`,
        solution: `import java.util.*;\n\npublic class Program {\n  static boolean balanceado(str s) {\n    Stack<Character> stack = new Stack<>();\n    Map<Character, Character> map = new HashMap<>();\n    map.put(')', '('); map.put('}', '{'); map.put(']', '[');\n    for (char c : s.toToToCharArray()) {\n      if (map.containsKey(c)) {\n        if (stack.isEmpty() || stack.pop() != map.get(c)) return false;\n      } else {\n        stack.push(c);\n      }\n    }\n    return stack.isEmpty();\n  }\n  \n  public static void main(string[] args) {\n    System.out.println(balanceado("()"));\n  }\n}`,
        hint: "Use Stack e HashMap",
      },
    },
    tests: [
      { name: "balanceado('()')", input: ["()"], expected: true },
      { name: "balanceado('({[]})')", input: ["({[]})"], expected: true },
      { name: "balanceado('({[}])')", input: ["({[}])"], expected: false },
    ],
  },
  {
    id: "flatten-array",
    title: "Flatten array",
    description: "Flatten nested arrays to any depth.",
    difficulty: "Intermediate",
    variants: {
      javascript: {
        language: "javascript",
        initialCode: `function achatar(a) {\n  // Your code here\n  \n}`,
        solution: `function achatar(a) {\n  return a.reduce((flat, item) => flat.concat(array.isarray(item) ? achatar(item) : item), []);\n}`,
        hint: "Use recursion e reduce",
      },
      python: {
        language: "python",
        initialCode: `def achatar(a):\n    # Your code here\n    pass`,
        solution: `def achatar(a):\n    result = []\n    for item in a:\n        if isinstance(item, list):\n            result.extend(achatar(item))\n        else:\n            result.append(item)\n    return result`,
        hint: "Use recursion e isinstance()",
      },
      c: {
        language: "c",
        initialCode: `#include <stdio.h>\n\nvoid achatar(int* array, int size, int* result, int* resultSize) {\n  // Your code here\n  *resultSize = 0;\n}\n\nint main() {\n  return 0;\n}`,
        solution: `#include <stdio.h>\n\nvoid achatar(int* array, int size, int* result, int* resultSize) {\n  *resultSize = 0;\n  for (int i = 0; i < size; i++) {\n    result[(*resultSize)++] = array[i];\n  }\n}\n\nint main() {\n  return 0;\n}`,
        hint: "Use a loop to copy elements",
      },
      csharp: {
        language: "csharp",
        initialCode: `using System;\nusing System.Collections.Generic;\n\npublic class Program {\n  static List<int> Achatar(object a) {\n    // Your code here\n    return new List<int>();\n  }\n  \n  static void Main() {\n  }\n}`,
        solution: `using System;\nusing System.Collections.Generic;\n\npublic class Program {\n  static List<int> Achatar(object a) {\n    List<int> result = new List<int>();\n    if (a is int) {\n      result.Add((int)a);\n    } else if (a is List<object>) {\n      foreach (var item in (List<object>)a) {\n        result.AddRange(Achatar(item));\n      }\n    }\n    return result;\n  }\n  \n  static void Main() {\n  }\n}`,
        hint: "Use recursion e type checking",
      },
      java: {
        language: "java",
        initialCode: `import java.util.*;\n\npublic class Program {\n  static List<Integer> achatar(Object a) {\n    // Your code here\n    return new arrayList<>();\n  }\n  \n  public static void main(string[] args) {\n  }\n}`,
        solution: `import java.util.*;\n\npublic class Program {\n  static List<Integer> achatar(Object a) {\n    List<Integer> result = new arrayList<>();\n    if (a instanceof Integer) {\n      result.add((Integer)a);\n    } else if (a instanceof List) {\n      for (Object item : (List<?>) a) {\n        result.addAll(achatar(item));\n      }\n    }\n    return result;\n  }\n  \n  public static void main(string[] args) {\n  }\n}`,
        hint: "Use recursion e instanceof",
      },
    },
    tests: [
      { name: "achatar([1,[2,3,[4,5]]])", input: [[1, [2, 3, [4, 5]]]], expected: [1, 2, 3, 4, 5] },
    ],
  },
  {
    id: "group-by",
    title: "Group By Propriedade",
    description: "Agrupe array de objetos por uma propriedade.",
    difficulty: "Intermediate",
    variants: {
      javascript: {
        language: "javascript",
        initialCode: `function agrupar(arr, prop) {\n  // Your code here\n  \n}`,
        solution: `function agrupar(arr, prop) {\n  return arr.reduce((groups, item) => {\n    const key = item[prop];\n    if (!groups[key]) groups[key] = [];\n    groups[key].push(item);\n    return groups;\n  }, {});\n}`,
        hint: "Use reduce() para agrupar",
      },
      python: {
        language: "python",
        initialCode: `def agrupar(arr, prop):\n    # Your code here\n    pass`,
        solution: `def agrupar(arr, prop):\n    groups = {}\n    for item in arr:\n        key = item[prop]\n        if key not in groups:\n            groups[key] = []\n        groups[key].append(item)\n    return groups`,
        hint: "Use a dictionary to group items",
      },
      c: {
        language: "c",
        initialCode: `#include <stdio.h>\n\n// C does not have native dictionaries; use a struct instead\nvoid agrupar(void) {\n  // Your code here\n  \n}\n\nint main() {\n  return 0;\n}`,
        solution: `#include <stdio.h>\n#include <string.h>\n\n// Implementa??o simplificada\nstruct Group {\n  char key[100];\n  int count;\n};\n\nint main() {\n  return 0;\n}`,
        hint: "Use a struct to group items",
      },
      csharp: {
        language: "csharp",
        initialCode: `using System;\nusing System.Collections.Generic;\nusing System.Linq;\n\npublic class Program {\n  static Dictionary<str, List<object>> Agrupar(List<Dictionary<str, object>> arr, str prop) {\n    // Your code here\n    return new Dictionary<str, List<object>>();\n  }\n  \n  static void Main() {\n  }\n}`,
        solution: `using System;\nusing System.Collections.Generic;\nusing System.Linq;\n\npublic class Program {\n  static Dictionary<str, List<object>> Agrupar(List<Dictionary<str, object>> arr, str prop) {\n    Dictionary<str, List<object>> groups = new Dictionary<str, List<object>>();\n    foreach (var item in arr) {\n      str key = item[prop].toString();\n      if (!groups.ContainsKey(key)) groups[key] = new List<object>();\n      groups[key].Add(item);\n    }\n    return groups;\n  }\n  \n  static void Main() {\n  }\n}`,
        hint: "Use Dictionary e um loop",
      },
      java: {
        language: "java",
        initialCode: `import java.util.*;\n\npublic class Program {\n  static Map<str, List<Map<str, Object>>> agrupar(List<Map<str, Object>> arr, str prop) {\n    // Your code here\n    return new HashMap<>();\n  }\n  \n  public static void main(string[] args) {\n  }\n}`,
        solution: `import java.util.*;\n\npublic class Program {\n  static Map<str, List<Map<str, Object>>> agrupar(List<Map<str, Object>> arr, str prop) {\n    Map<str, List<Map<str, Object>>> groups = new HashMap<>();\n    for (Map<str, Object> item : arr) {\n      str key = item.get(prop).toString();\n      groups.putIfAbsent(key, new arrayList<>());\n      groups.get(key).add(item);\n    }\n    return groups;\n  }\n  \n  public static void main(string[] args) {\n  }\n}`,
        hint: "Use HashMap e putIfAbsent",
      },
    },
    tests: [
      { name: "agrupar([{'tipo':'A'},{'tipo':'B'},{'tipo':'A'}], 'tipo')", input: [[{"tipo":"A"},{"tipo":"B"},{"tipo":"A"}], "tipo"], expected: {"A": [{"tipo":"A"},{"tipo":"A"}], "B": [{"tipo":"B"}]} },
    ],
  },
  {
    id: "Fibonacci",
    title: "Fibonacci com Memoiza??o",
    description: "Calcule Fibonacci otimizado com memoiza??o.",
    difficulty: "Advanced",
    variants: {
      javascript: {
        language: "javascript",
        initialCode: `function Fibonacci(n, memo = {}) {\n  // Your code here\n  \n}`,
        solution: `function Fibonacci(n, memo = {}) {\n  if (n in memo) return memo[n];\n  if (n <= 1) return n;\n  memo[n] = Fibonacci(n - 1, memo) + Fibonacci(n - 2, memo);\n  return memo[n];\n}`,
        hint: "Armazene resultados para evitar recalcular",
      },
      python: {
        language: "python",
        initialCode: `def Fibonacci(n, memo={}):\n    # Your code here\n    pass`,
        solution: `def Fibonacci(n, memo={}):\n    if n in memo:\n        return memo[n]\n    if n <= 1:\n        return n\n    memo[n] = Fibonacci(n - 1, memo) + Fibonacci(n - 2, memo)\n    return memo[n]`,
        hint: "Armazene resultados para evitar recalcular",
      },
      c: {
        language: "c",
        initialCode: `#include <stdio.h>\n\nlong Fibonacci(int n, long* memo) {\n  // Your code here\n  return 0;\n}\n\nint main() {\n  long memo[50] = {0};\n  printf("%ld", Fibonacci(5, memo));\n  return 0;\n}`,
        solution: `#include <stdio.h>\n\nlong Fibonacci(int n, long* memo) {\n  if (memo[n] != 0 && n > 1) return memo[n];\n  if (n <= 1) return n;\n  memo[n] = Fibonacci(n - 1, memo) + Fibonacci(n - 2, memo);\n  return memo[n];\n}\n\nint main() {\n  long memo[50] = {0};\n  printf("%ld", Fibonacci(5, memo));\n  return 0;\n}`,
        hint: "Use an array for memoization",
      },
      csharp: {
        language: "csharp",
        initialCode: `using System;\nusing System.Collections.Generic;\n\npublic class Program {\n  static long Fibonacci(int n, Dictionary<int, long> memo) {\n    // Your code here\n    return 0;\n  }\n  \n  static void Main() {\n    Console.WriteLine(Fibonacci(5, new Dictionary<int, long>()));\n  }\n}`,
        solution: `using System;\nusing System.Collections.Generic;\n\npublic class Program {\n  static long Fibonacci(int n, Dictionary<int, long> memo) {\n    if (memo.ContainsKey(n)) return memo[n];\n    if (n <= 1) return n;\n    memo[n] = Fibonacci(n - 1, memo) + Fibonacci(n - 2, memo);\n    return memo[n];\n  }\n  \n  static void Main() {\n    Console.WriteLine(Fibonacci(5, new Dictionary<int, long>()));\n  }\n}`,
        hint: "Use Dictionary para memoiza??o",
      },
      java: {
        language: "java",
        initialCode: `import java.util.*;\n\npublic class Program {\n  static long Fibonacci(int n, Map<Integer, Long> memo) {\n    // Your code here\n    return 0;\n  }\n  \n  public static void main(string[] args) {\n    System.out.println(Fibonacci(5, new HashMap<>()));\n  }\n}`,
        solution: `import java.util.*;\n\npublic class Program {\n  static long Fibonacci(int n, Map<Integer, Long> memo) {\n    if (memo.containsKey(n)) return memo.get(n);\n    if (n <= 1) return n;\n    long result = Fibonacci(n - 1, memo) + Fibonacci(n - 2, memo);\n    memo.put(n, result);\n    return result;\n  }\n  \n  public static void main(string[] args) {\n    System.out.println(Fibonacci(5, new HashMap<>()));\n  }\n}`,
        hint: "Use HashMap para memoiza??o",
      },
    },
    tests: [
      { name: "Fibonacci(5)", input: [5], expected: 5 },
      { name: "Fibonacci(10)", input: [10], expected: 55 },
      { name: "Fibonacci(0)", input: [0], expected: 0 },
    ],
  },
];

