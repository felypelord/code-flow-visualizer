import { Lesson } from "./types";

// ... (Previous lessons: functions, objects, classes, recursion, loops-arrays)

// I will read the file first to make sure I don't overwrite existing lessons, or I can just append/replace the export.
// Since I have the full content in my context from previous turns (I wrote it), I can recreate the file with the new lesson added.

// ==========================================
// 1. Functions Lesson
// ==========================================
const functionLesson: Lesson = {
  id: "functions",
  title: "How do Functions Work?",
  description: "Understand the concept of 'Scope' and 'Call Stack'. See how variables are created and destroyed.",
  difficulty: "Beginner",
  variants: {
    javascript: {
      code: `function add(a, b) {
  const result = a + b;
  return result;
}

function main() {
  const x = 5;
  const y = 3;
  const total = add(x, y);
  console.log(total);
}

main();`,
      steps: [
        {
          stepId: 0,
          line: 11,
          stack: [],
          heap: [],
          explanation: "The program starts. The interpreter reads function definitions, but nothing is executed until we call someone."
        },
        {
          stepId: 1,
          line: 11,
          stack: [{ id: "main", name: "main()", variables: [], active: true }],
          heap: [],
          explanation: "The function 'main()' is called. A new 'Stack Frame' is created for it."
        },
        {
          stepId: 2,
          line: 7,
          stack: [{ id: "main", name: "main()", variables: [{ name: "x", value: 5, type: "primitive", changed: true }], active: true }],
          heap: [],
          explanation: "Variable 'x' is declared and initialized with value 5 within 'main' scope."
        },
        {
          stepId: 3,
          line: 8,
          stack: [{ 
            id: "main", 
            name: "main()", 
            variables: [{ name: "x", value: 5, type: "primitive" }, { name: "y", value: 3, type: "primitive", changed: true }], 
            active: true 
          }],
          heap: [],
          explanation: "Variable 'y' is declared and initialized with value 3."
        },
        {
          stepId: 4,
          line: 9,
          stack: [
            { id: "main", name: "main()", variables: [{ name: "x", value: 5, type: "primitive" }, { name: "y", value: 3, type: "primitive" }, { name: "total", value: undefined, type: "primitive" }], active: false },
            { id: "add", name: "add(5, 3)", variables: [{ name: "a", value: 5, type: "primitive", changed: true }, { name: "b", value: 3, type: "primitive", changed: true }], active: true }
          ],
          heap: [],
          explanation: "Function 'add' is called. A NEW frame is pushed to the stack. Values are copied."
        },
        {
          stepId: 5,
          line: 2,
          stack: [
            { id: "main", name: "main()", variables: [{ name: "x", value: 5, type: "primitive" }, { name: "y", value: 3, type: "primitive" }, { name: "total", value: undefined, type: "primitive" }], active: false },
            { id: "add", name: "add(5, 3)", variables: [{ name: "a", value: 5, type: "primitive" }, { name: "b", value: 3, type: "primitive" }, { name: "result", value: 8, type: "primitive", changed: true }], active: true }
          ],
          heap: [],
          explanation: "The calculation is done and stored in the local variable 'result'."
        },
        {
          stepId: 6,
          line: 3,
          stack: [
            { id: "main", name: "main()", variables: [{ name: "x", value: 5, type: "primitive" }, { name: "y", value: 3, type: "primitive" }, { name: "total", value: undefined, type: "primitive" }], active: false },
            { id: "add", name: "add(5, 3)", variables: [{ name: "a", value: 5, type: "primitive" }, { name: "b", value: 3, type: "primitive" }, { name: "result", value: 8, type: "primitive" }], active: true, isClosing: true }
          ],
          heap: [],
          explanation: "The function returns 8. The 'add' frame will be removed."
        },
        {
          stepId: 7,
          line: 9,
          stack: [{ id: "main", name: "main()", variables: [{ name: "x", value: 5, type: "primitive" }, { name: "y", value: 3, type: "primitive" }, { name: "total", value: 8, type: "primitive", changed: true }], active: true }],
          heap: [],
          explanation: "We return to 'main'. The returned value (8) is assigned to 'total'."
        },
        {
          stepId: 8,
          line: 10,
          stack: [{ id: "main", name: "main()", variables: [{ name: "x", value: 5, type: "primitive" }, { name: "y", value: 3, type: "primitive" }, { name: "total", value: 8, type: "primitive" }], active: true }],
          heap: [],
          explanation: "The value is displayed. Execution ends."
        }
      ]
    },
    csharp: {
      code: `using System;

class Program {
    static int Add(int a, int b) {
        int result = a + b;
        return result;
    }

    static void Main() {
        int x = 5;
        int y = 3;
        int total = Add(x, y);
        Console.WriteLine(total);
    }
}`,
      steps: [
        {
          stepId: 0,
          line: 9,
          stack: [],
          heap: [],
          explanation: "In C#, execution starts with the static method 'Main'. The CLR loads the program."
        },
        {
          stepId: 1,
          line: 9,
          stack: [{ id: "Main", name: "Main()", variables: [], active: true }],
          heap: [],
          explanation: "The 'Main' method is allocated on the Stack."
        },
        {
          stepId: 2,
          line: 10,
          stack: [{ id: "Main", name: "Main()", variables: [{ name: "x", value: 5, type: "primitive", changed: true }], active: true }],
          heap: [],
          explanation: "Integer variable 'x' is allocated on the Stack (Value Type)."
        },
        {
          stepId: 3,
          line: 11,
          stack: [{ id: "Main", name: "Main()", variables: [{ name: "x", value: 5, type: "primitive" }, { name: "y", value: 3, type: "primitive", changed: true }], active: true }],
          heap: [],
          explanation: "Variable 'y' is allocated."
        },
        {
          stepId: 4,
          line: 12,
          stack: [
             { id: "Main", name: "Main()", variables: [{ name: "x", value: 5, type: "primitive" }, { name: "y", value: 3, type: "primitive" }, { name: "total", value: 0, type: "primitive" }], active: false },
             { id: "Add", name: "Add(5, 3)", variables: [{ name: "a", value: 5, type: "primitive", changed: true }, { name: "b", value: 3, type: "primitive", changed: true }], active: true }
          ],
          heap: [],
          explanation: "We call 'Add'. A new Frame is pushed. Values are copied."
        },
        {
          stepId: 5,
          line: 5,
          stack: [
             { id: "Main", name: "Main()", variables: [{ name: "x", value: 5, type: "primitive" }, { name: "y", value: 3, type: "primitive" }, { name: "total", value: 0, type: "primitive" }], active: false },
             { id: "Add", name: "Add(5, 3)", variables: [{ name: "a", value: 5, type: "primitive" }, { name: "b", value: 3, type: "primitive" }, { name: "result", value: 8, type: "primitive", changed: true }], active: true }
          ],
          heap: [],
          explanation: "The calculation occurs and is saved in the local variable 'result'."
        },
        {
          stepId: 6,
          line: 6,
          stack: [
             { id: "Main", name: "Main()", variables: [{ name: "x", value: 5, type: "primitive" }, { name: "y", value: 3, type: "primitive" }, { name: "total", value: 0, type: "primitive" }], active: false },
             { id: "Add", name: "Add(5, 3)", variables: [{ name: "a", value: 5, type: "primitive" }, { name: "b", value: 3, type: "primitive" }, { name: "result", value: 8, type: "primitive" }], active: true, isClosing: true }
          ],
          heap: [],
          explanation: "The method returns 8 and the Frame is popped."
        },
        {
          stepId: 7,
          line: 12,
          stack: [{ id: "Main", name: "Main()", variables: [{ name: "x", value: 5, type: "primitive" }, { name: "y", value: 3, type: "primitive" }, { name: "total", value: 8, type: "primitive", changed: true }], active: true }],
          heap: [],
          explanation: "Back to Main, 'total' receives 8."
        },
         {
          stepId: 8,
          line: 13,
          stack: [{ id: "Main", name: "Main()", variables: [{ name: "x", value: 5, type: "primitive" }, { name: "y", value: 3, type: "primitive" }, { name: "total", value: 8, type: "primitive" }], active: true }],
          heap: [],
          explanation: "Print to console. Done."
        }
      ]
    },
    java: {
      code: `public class Main {
    public static int add(int a, int b) {
        int result = a + b;
        return result;
    }

    public static void main(String[] args) {
        int x = 5;
        int y = 3;
        int total = add(x, y);
        System.out.println(total);
    }
}`,
      steps: [
        {
          stepId: 0,
          line: 7,
          stack: [],
          heap: [],
          explanation: "The JVM starts execution with the 'main' method."
        },
        {
          stepId: 1,
          line: 7,
          stack: [{ id: "main", name: "main()", variables: [], active: true }],
          heap: [],
          explanation: "The main method's Stack Frame is created."
        },
        {
           stepId: 2,
           line: 8,
           stack: [{ id: "main", name: "main()", variables: [{ name: "x", value: 5, type: "primitive", changed: true }], active: true }],
           heap: [],
           explanation: "Primitive variable 'x' (int) is created on the Stack."
        },
        {
           stepId: 3,
           line: 9,
           stack: [{ id: "main", name: "main()", variables: [{ name: "x", value: 5, type: "primitive" }, { name: "y", value: 3, type: "primitive", changed: true }], active: true }],
           heap: [],
           explanation: "Primitive variable 'y' is created."
        },
        {
           stepId: 4,
           line: 10,
           stack: [
             { id: "main", name: "main()", variables: [{ name: "x", value: 5, type: "primitive" }, { name: "y", value: 3, type: "primitive" }, { name: "total", value: 0, type: "primitive" }], active: false },
             { id: "add", name: "add(5, 3)", variables: [{ name: "a", value: 5, type: "primitive", changed: true }, { name: "b", value: 3, type: "primitive", changed: true }], active: true }
           ],
           heap: [],
           explanation: "Method 'add' is called. New frame on the stack."
        },
        {
           stepId: 5,
           line: 3,
           stack: [
             { id: "main", name: "main()", variables: [{ name: "x", value: 5, type: "primitive" }, { name: "y", value: 3, type: "primitive" }, { name: "total", value: 0, type: "primitive" }], active: false },
             { id: "add", name: "add(5, 3)", variables: [{ name: "a", value: 5, type: "primitive" }, { name: "b", value: 3, type: "primitive" }, { name: "result", value: 8, type: "primitive", changed: true }], active: true }
           ],
           heap: [],
           explanation: "Calculation performed and stored in 'result'."
        },
        {
           stepId: 6,
           line: 4,
           stack: [
             { id: "main", name: "main()", variables: [{ name: "x", value: 5, type: "primitive" }, { name: "y", value: 3, type: "primitive" }, { name: "total", value: 0, type: "primitive" }], active: false },
             { id: "add", name: "add(5, 3)", variables: [{ name: "a", value: 5, type: "primitive" }, { name: "b", value: 3, type: "primitive" }, { name: "result", value: 8, type: "primitive" }], active: true, isClosing: true }
           ],
           heap: [],
           explanation: "The method returns 8 and the Frame is popped."
        },
        {
           stepId: 7,
           line: 10,
           stack: [{ id: "main", name: "main()", variables: [{ name: "x", value: 5, type: "primitive" }, { name: "y", value: 3, type: "primitive" }, { name: "total", value: 8, type: "primitive", changed: true }], active: true }],
           heap: [],
           explanation: "Back in main, value assigned to 'total'."
        },
        {
           stepId: 8,
           line: 11,
           stack: [{ id: "main", name: "main()", variables: [{ name: "x", value: 5, type: "primitive" }, { name: "y", value: 3, type: "primitive" }, { name: "total", value: 8, type: "primitive" }], active: true }],
           heap: [],
           explanation: "Print to console."
        }
      ]
    },
    c: {
      code: `#include <stdio.h>

int add(int a, int b) {
    int result = a + b;
    return result;
}

int main() {
    int x = 5;
    int y = 3;
    int total = add(x, y);
    printf("%d", total);
    return 0;
}`,
      steps: [
        { stepId: 0, line: 8, stack: [], heap: [], explanation: "The entry point in C is the 'main' function." },
        { stepId: 1, line: 8, stack: [{ id: "main", name: "main()", variables: [], active: true }], heap: [], explanation: "The Stack Frame for main is allocated." },
        { stepId: 2, line: 9, stack: [{ id: "main", name: "main()", variables: [{ name: "x", value: 5, type: "primitive", changed: true }], active: true }], heap: [], explanation: "Integer 'x' allocated on the stack." },
        { stepId: 3, line: 10, stack: [{ id: "main", name: "main()", variables: [{ name: "x", value: 5, type: "primitive" }, { name: "y", value: 3, type: "primitive", changed: true }], active: true }], heap: [], explanation: "Integer 'y' allocated on the stack." },
        { stepId: 4, line: 11, stack: [{ id: "main", name: "main()", variables: [{ name: "x", value: 5, type: "primitive" }, { name: "y", value: 3, type: "primitive" }, { name: "total", value: 0, type: "primitive" }], active: false }, { id: "add", name: "add(5, 3)", variables: [{ name: "a", value: 5, type: "primitive", changed: true }, { name: "b", value: 3, type: "primitive", changed: true }], active: true }], heap: [], explanation: "Function 'add' is called. Arguments passed by copy." },
        { stepId: 5, line: 4, stack: [{ id: "main", name: "main()", variables: [{ name: "x", value: 5, type: "primitive" }, { name: "y", value: 3, type: "primitive" }, { name: "total", value: 0, type: "primitive" }], active: false }, { id: "add", name: "add(5, 3)", variables: [{ name: "a", value: 5, type: "primitive" }, { name: "b", value: 3, type: "primitive" }, { name: "result", value: 8, type: "primitive", changed: true }], active: true }], heap: [], explanation: "Local variable 'result' allocated in the 'add' frame." },
        { stepId: 6, line: 5, stack: [{ id: "main", name: "main()", variables: [{ name: "x", value: 5, type: "primitive" }, { name: "y", value: 3, type: "primitive" }, { name: "total", value: 0, type: "primitive" }], active: false }, { id: "add", name: "add(5, 3)", variables: [{ name: "a", value: 5, type: "primitive" }, { name: "b", value: 3, type: "primitive" }, { name: "result", value: 8, type: "primitive" }], active: true, isClosing: true }], heap: [], explanation: "Function return." },
        { stepId: 7, line: 11, stack: [{ id: "main", name: "main()", variables: [{ name: "x", value: 5, type: "primitive" }, { name: "y", value: 3, type: "primitive" }, { name: "total", value: 8, type: "primitive", changed: true }], active: true }], heap: [], explanation: "Returned value assigned to 'total' in main." },
        { stepId: 8, line: 12, stack: [{ id: "main", name: "main()", variables: [{ name: "x", value: 5, type: "primitive" }, { name: "y", value: 3, type: "primitive" }, { name: "total", value: 8, type: "primitive" }], active: true }], heap: [], explanation: "printf displays the result." }
      ]
    }
  }
};

// ==========================================
// 2. Objects Lesson
// ==========================================
const objectLesson: Lesson = {
  id: "objects",
  title: "References and Objects",
  description: "Discover the difference between the 'Stack' and the 'Heap' (Memory). Object variables only POINT to the real object.",
  difficulty: "Intermediate",
  variants: {
    javascript: {
      code: `function createUser(name) {
  const user = {
    name: name,
    admin: false
  };
  return user;
}

const u1 = createUser("Ana");
const u2 = u1;
u2.admin = true;`,
      steps: [
        { stepId: 0, line: 1, stack: [], heap: [], explanation: "Program starts. Objects live in the Heap." },
        { stepId: 1, line: 8, stack: [{ id: "global", name: "Global", variables: [{ name: "u1", value: undefined, type: "primitive" }], active: true }], heap: [], explanation: "Preparing call to createUser." },
        { stepId: 2, line: 2, stack: [{ id: "global", name: "Global", variables: [{ name: "u1", value: undefined, type: "primitive" }], active: false }, { id: "createUser", name: "createUser('Ana')", variables: [{ name: "name", value: "Ana", type: "primitive" }], active: true }], heap: [], explanation: "We enter the function." },
        { stepId: 3, line: 5, stack: [{ id: "global", name: "Global", variables: [{ name: "u1", value: undefined, type: "primitive" }], active: false }, { id: "createUser", name: "createUser('Ana')", variables: [{ name: "name", value: "Ana", type: "primitive" }, { name: "user", value: "REF:obj1", type: "reference", refId: "obj1", changed: true }], active: true }], heap: [{ id: "obj1", className: "Object", properties: [{ name: "name", value: "Ana", type: "primitive" }, { name: "admin", value: false, type: "primitive" }], highlight: true }], explanation: "Object created in HEAP. Variable on Stack stores the ADDRESS (Reference)." },
        { stepId: 4, line: 6, stack: [{ id: "global", name: "Global", variables: [{ name: "u1", value: undefined, type: "primitive" }], active: false }, { id: "createUser", name: "createUser('Ana')", variables: [{ name: "name", value: "Ana", type: "primitive" }, { name: "user", value: "REF:obj1", type: "reference", refId: "obj1" }], active: true, isClosing: true }], heap: [{ id: "obj1", className: "Object", properties: [{ name: "name", value: "Ana", type: "primitive" }, { name: "admin", value: false, type: "primitive" }] }], explanation: "Returns the REFERENCE." },
        { stepId: 5, line: 8, stack: [{ id: "global", name: "Global", variables: [{ name: "u1", value: "REF:obj1", type: "reference", refId: "obj1", changed: true }], active: true }], heap: [{ id: "obj1", className: "Object", properties: [{ name: "name", value: "Ana", type: "primitive" }, { name: "admin", value: false, type: "primitive" }] }], explanation: "'u1' points to the object in the Heap." },
        { stepId: 6, line: 9, stack: [{ id: "global", name: "Global", variables: [{ name: "u1", value: "REF:obj1", type: "reference", refId: "obj1" }, { name: "u2", value: "REF:obj1", type: "reference", refId: "obj1", changed: true }], active: true }], heap: [{ id: "obj1", className: "Object", properties: [{ name: "name", value: "Ana", type: "primitive" }, { name: "admin", value: false, type: "primitive" }] }], explanation: "'u2 = u1' copies the address. Both point to the SAME object." },
        { stepId: 7, line: 10, stack: [{ id: "global", name: "Global", variables: [{ name: "u1", value: "REF:obj1", type: "reference", refId: "obj1" }, { name: "u2", value: "REF:obj1", type: "reference", refId: "obj1" }], active: true }], heap: [{ id: "obj1", className: "Object", properties: [{ name: "name", value: "Ana", type: "primitive" }, { name: "admin", value: true, type: "primitive", changed: true }], highlight: true }], explanation: "Modifying 'u2' affects the real object, so 'u1' also sees the change." }
      ]
    },
    csharp: {
        code: `class User {
    public string Name;
    public bool Admin;
}

class Program {
    static void Main() {
        User u1 = new User();
        u1.Name = "Ana";
        
        User u2 = u1;
        u2.Admin = true;
    }
}`,
        steps: [
            { stepId: 0, line: 7, stack: [], heap: [], explanation: "Start. Classes in C# are Reference Types (stored in Heap)." },
            { stepId: 1, line: 8, stack: [{ id: "Main", name: "Main()", variables: [{ name: "u1", value: "REF:obj1", type: "reference", refId: "obj1", changed: true }], active: true }], heap: [{ id: "obj1", className: "User", properties: [{ name: "Name", value: null, type: "primitive" }, { name: "Admin", value: false, type: "primitive" }], highlight: true }], explanation: "'new User()' allocates memory in Heap. 'u1' in Stack points to it." },
            { stepId: 2, line: 9, stack: [{ id: "Main", name: "Main()", variables: [{ name: "u1", value: "REF:obj1", type: "reference", refId: "obj1" }], active: true }], heap: [{ id: "obj1", className: "User", properties: [{ name: "Name", value: "Ana", type: "primitive", changed: true }, { name: "Admin", value: false, type: "primitive" }], highlight: true }], explanation: "We assign 'Ana' to the Name property of the object in Heap." },
            { stepId: 3, line: 11, stack: [{ id: "Main", name: "Main()", variables: [{ name: "u1", value: "REF:obj1", type: "reference", refId: "obj1" }, { name: "u2", value: "REF:obj1", type: "reference", refId: "obj1", changed: true }], active: true }], heap: [{ id: "obj1", className: "User", properties: [{ name: "Name", value: "Ana", type: "primitive" }, { name: "Admin", value: false, type: "primitive" }] }], explanation: "'u2 = u1' copies the reference. Now we have two variables pointing to the same object." },
            { stepId: 4, line: 12, stack: [{ id: "Main", name: "Main()", variables: [{ name: "u1", value: "REF:obj1", type: "reference", refId: "obj1" }, { name: "u2", value: "REF:obj1", type: "reference", refId: "obj1" }], active: true }], heap: [{ id: "obj1", className: "User", properties: [{ name: "Name", value: "Ana", type: "primitive" }, { name: "Admin", value: true, type: "primitive", changed: true }], highlight: true }], explanation: "Modifying u2 changes the shared object." }
        ]
    }
  }
};

// ==========================================
// 3. Recursion Lesson
// ==========================================
const recursionLesson: Lesson = {
    id: "recursion",
    title: "Recursion (Call Stack)",
    description: "Visualize how the call stack grows when a function calls itself.",
    difficulty: "Intermediate",
    variants: {
        javascript: {
            code: `function factorial(n) {
  if (n === 1) return 1;
  return n * factorial(n - 1);
}

const result = factorial(3);`,
            steps: [
                { stepId: 0, line: 6, stack: [], heap: [], explanation: "Let's calculate the factorial of 3 recursively." },
                { stepId: 1, line: 6, stack: [{ id: "global", name: "Global", variables: [], active: false }, { id: "fact3", name: "factorial(3)", variables: [{ name: "n", value: 3, type: "primitive" }], active: true }], heap: [], explanation: "Initial call: factorial(3)." },
                { stepId: 2, line: 2, stack: [{ id: "global", name: "Global", variables: [], active: false }, { id: "fact3", name: "factorial(3)", variables: [{ name: "n", value: 3, type: "primitive" }], active: true }], heap: [], explanation: "n is 3, not 1. Continue." },
                { stepId: 3, line: 3, stack: [{ id: "global", name: "Global", variables: [], active: false }, { id: "fact3", name: "factorial(3)", variables: [{ name: "n", value: 3, type: "primitive" }], active: false }, { id: "fact2", name: "factorial(2)", variables: [{ name: "n", value: 2, type: "primitive" }], active: true }], heap: [], explanation: "PAUSE factorial(3) to call factorial(2). Push new frame." },
                { stepId: 4, line: 2, stack: [{ id: "global", name: "Global", variables: [], active: false }, { id: "fact3", name: "factorial(3)", variables: [{ name: "n", value: 3, type: "primitive" }], active: false }, { id: "fact2", name: "factorial(2)", variables: [{ name: "n", value: 2, type: "primitive" }], active: true }], heap: [], explanation: "n is 2. Continue." },
                { stepId: 5, line: 3, stack: [{ id: "global", name: "Global", variables: [], active: false }, { id: "fact3", name: "factorial(3)", variables: [{ name: "n", value: 3, type: "primitive" }], active: false }, { id: "fact2", name: "factorial(2)", variables: [{ name: "n", value: 2, type: "primitive" }], active: false }, { id: "fact1", name: "factorial(1)", variables: [{ name: "n", value: 1, type: "primitive" }], active: true }], heap: [], explanation: "PAUSE factorial(2) to call factorial(1). The stack grows!" },
                { stepId: 6, line: 2, stack: [{ id: "global", name: "Global", variables: [], active: false }, { id: "fact3", name: "factorial(3)", variables: [{ name: "n", value: 3, type: "primitive" }], active: false }, { id: "fact2", name: "factorial(2)", variables: [{ name: "n", value: 2, type: "primitive" }], active: false }, { id: "fact1", name: "factorial(1)", variables: [{ name: "n", value: 1, type: "primitive" }], active: true, isClosing: true }], heap: [], explanation: "BASE CASE: n is 1. Return 1." },
                { stepId: 7, line: 3, stack: [{ id: "global", name: "Global", variables: [], active: false }, { id: "fact3", name: "factorial(3)", variables: [{ name: "n", value: 3, type: "primitive" }], active: false }, { id: "fact2", name: "factorial(2)", variables: [{ name: "n", value: 2, type: "primitive" }, { name: "return", value: 2, type: "primitive", changed: true }], active: true, isClosing: true }], heap: [], explanation: "Return to factorial(2). Calculate 2 * 1 = 2. Return 2." },
                { stepId: 8, line: 3, stack: [{ id: "global", name: "Global", variables: [], active: false }, { id: "fact3", name: "factorial(3)", variables: [{ name: "n", value: 3, type: "primitive" }, { name: "return", value: 6, type: "primitive", changed: true }], active: true, isClosing: true }], heap: [], explanation: "Return to factorial(3). Calculate 3 * 2 = 6. Return 6." },
                { stepId: 9, line: 6, stack: [{ id: "global", name: "Global", variables: [{ name: "result", value: 6, type: "primitive", changed: true }], active: true }], heap: [], explanation: "Final result 6 stored." }
            ]
        }
    }
};

// ==========================================
// 4. Classes Lesson
// ==========================================
const classLesson: Lesson = {
  id: "classes",
  title: "Classes and Instances",
  description: "Learn how the 'this' keyword works and how classes create objects.",
  difficulty: "Advanced",
  variants: {
      javascript: {
          code: `class Carro {
  constructor(modelo) {
    this.modelo = modelo;
    this.velocidade = 0;
  }
  
  acelerar() {
    this.velocidade += 10;
  }
}

const c1 = new Carro("Fusca");
c1.acelerar();`,
          steps: [
            { stepId: 0, line: 11, stack: [], heap: [], explanation: "We define the class. Let's instantiate with 'new'." },
            { stepId: 1, line: 2, stack: [{ id: "global", name: "Global", variables: [], active: false }, { id: "constructor", name: "Carro.constructor", variables: [{ name: "modelo", value: "Fusca", type: "primitive" }, { name: "this", value: "REF:car1", type: "reference", refId: "car1", changed: true }], active: true }], heap: [{ id: "car1", className: "Carro", properties: [], highlight: true }], explanation: "'new' creates an empty object on the Heap and assigns it to 'this'." },
            { stepId: 2, line: 3, stack: [{ id: "global", name: "Global", variables: [], active: false }, { id: "constructor", name: "Carro.constructor", variables: [{ name: "modelo", value: "Fusca", type: "primitive" }, { name: "this", value: "REF:car1", type: "reference", refId: "car1" }], active: true }], heap: [{ id: "car1", className: "Carro", properties: [{ name: "modelo", value: "Fusca", type: "primitive", changed: true }], highlight: true }], explanation: "Sets 'this.modelo'." },
            { stepId: 3, line: 4, stack: [{ id: "global", name: "Global", variables: [], active: false }, { id: "constructor", name: "Carro.constructor", variables: [{ name: "modelo", value: "Fusca", type: "primitive" }, { name: "this", value: "REF:car1", type: "reference", refId: "car1" }], active: true }], heap: [{ id: "car1", className: "Carro", properties: [{ name: "modelo", value: "Fusca", type: "primitive" }, { name: "velocidade", value: 0, type: "primitive", changed: true }], highlight: true }], explanation: "Sets 'this.velocidade'." },
            { stepId: 4, line: 11, stack: [{ id: "global", name: "Global", variables: [{ name: "c1", value: "REF:car1", type: "reference", refId: "car1", changed: true }], active: true }], heap: [{ id: "car1", className: "Carro", properties: [{ name: "modelo", value: "Fusca", type: "primitive" }, { name: "velocidade", value: 0, type: "primitive" }] }], explanation: "Returns the instance to 'c1'." },
            { stepId: 5, line: 12, stack: [{ id: "global", name: "Global", variables: [{ name: "c1", value: "REF:car1", type: "reference", refId: "car1" }], active: false }, { id: "acelerar", name: "c1.acelerar", variables: [{ name: "this", value: "REF:car1", type: "reference", refId: "car1", changed: true }], active: true }], heap: [{ id: "car1", className: "Carro", properties: [{ name: "modelo", value: "Fusca", type: "primitive" }, { name: "velocidade", value: 0, type: "primitive" }] }], explanation: "Calls method. 'this' is the object c1." },
            { stepId: 6, line: 8, stack: [{ id: "global", name: "Global", variables: [{ name: "c1", value: "REF:car1", type: "reference", refId: "car1" }], active: false }, { id: "acelerar", name: "c1.acelerar", variables: [{ name: "this", value: "REF:car1", type: "reference", refId: "car1" }], active: true }], heap: [{ id: "car1", className: "Carro", properties: [{ name: "modelo", value: "Fusca", type: "primitive" }, { name: "velocidade", value: 10, type: "primitive", changed: true }], highlight: true }], explanation: "Updates property on the Heap." }
          ]
      }
  }
};

// ==========================================
// 5. Loops & Arrays Lesson
// ==========================================
const loopsArraysLesson: Lesson = {
  id: "loops-arrays",
  title: "Loops & Arrays",
  description: "Understand how arrays are stored and how loops traverse them index by index.",
  difficulty: "Beginner",
  variants: {
    javascript: {
      code: `const numbers = [10, 20, 30];
let sum = 0;

for (let i = 0; i < numbers.length; i++) {
  sum = sum + numbers[i];
}`,
      steps: [
        { stepId: 0, line: 1, stack: [], heap: [], explanation: "Let's create an array of numbers." },
        { stepId: 1, line: 1, stack: [{ id: "global", name: "Global", variables: [{ name: "numbers", value: "REF:arr1", type: "reference", refId: "arr1", changed: true }], active: true }], heap: [{ id: "arr1", className: "Array", properties: [{ name: "0", value: 10, type: "primitive" }, { name: "1", value: 20, type: "primitive" }, { name: "2", value: 30, type: "primitive" }, { name: "length", value: 3, type: "primitive" }], highlight: true }], explanation: "Array created on the Heap. 'numbers' holds the reference." },
        { stepId: 2, line: 2, stack: [{ id: "global", name: "Global", variables: [{ name: "numbers", value: "REF:arr1", type: "reference", refId: "arr1" }, { name: "sum", value: 0, type: "primitive", changed: true }], active: true }], heap: [{ id: "arr1", className: "Array", properties: [{ name: "0", value: 10, type: "primitive" }, { name: "1", value: 20, type: "primitive" }, { name: "2", value: 30, type: "primitive" }, { name: "length", value: 3, type: "primitive" }] }], explanation: "Initialize 'sum' with 0." },
        
        // Loop Iteration 0
        { stepId: 3, line: 4, stack: [{ id: "global", name: "Global", variables: [{ name: "numbers", value: "REF:arr1", type: "reference", refId: "arr1" }, { name: "sum", value: 0, type: "primitive" }, { name: "i", value: 0, type: "primitive", changed: true }], active: true }], heap: [{ id: "arr1", className: "Array", properties: [{ name: "0", value: 10, type: "primitive" }, { name: "1", value: 20, type: "primitive" }, { name: "2", value: 30, type: "primitive" }, { name: "length", value: 3, type: "primitive" }] }], explanation: "Loop start. 'i' is 0. 0 < 3 is true." },
        { stepId: 4, line: 5, stack: [{ id: "global", name: "Global", variables: [{ name: "numbers", value: "REF:arr1", type: "reference", refId: "arr1" }, { name: "sum", value: 10, type: "primitive", changed: true }, { name: "i", value: 0, type: "primitive" }], active: true }], heap: [{ id: "arr1", className: "Array", properties: [{ name: "0", value: 10, type: "primitive", highlight: true }, { name: "1", value: 20, type: "primitive" }, { name: "2", value: 30, type: "primitive" }, { name: "length", value: 3, type: "primitive" }] }], explanation: "Access numbers[0] (10) and add. sum = 0 + 10 = 10." },
        
        // Loop Iteration 1
        { stepId: 5, line: 4, stack: [{ id: "global", name: "Global", variables: [{ name: "numbers", value: "REF:arr1", type: "reference", refId: "arr1" }, { name: "sum", value: 10, type: "primitive" }, { name: "i", value: 1, type: "primitive", changed: true }], active: true }], heap: [{ id: "arr1", className: "Array", properties: [{ name: "0", value: 10, type: "primitive" }, { name: "1", value: 20, type: "primitive" }, { name: "2", value: 30, type: "primitive" }, { name: "length", value: 3, type: "primitive" }] }], explanation: "Increment 'i' to 1. 1 < 3 is true." },
        { stepId: 6, line: 5, stack: [{ id: "global", name: "Global", variables: [{ name: "numbers", value: "REF:arr1", type: "reference", refId: "arr1" }, { name: "sum", value: 30, type: "primitive", changed: true }, { name: "i", value: 1, type: "primitive" }], active: true }], heap: [{ id: "arr1", className: "Array", properties: [{ name: "0", value: 10, type: "primitive" }, { name: "1", value: 20, type: "primitive", highlight: true }, { name: "2", value: 30, type: "primitive" }, { name: "length", value: 3, type: "primitive" }] }], explanation: "Access numbers[1] (20). sum = 10 + 20 = 30." },
        
        // Loop Iteration 2
        { stepId: 7, line: 4, stack: [{ id: "global", name: "Global", variables: [{ name: "numbers", value: "REF:arr1", type: "reference", refId: "arr1" }, { name: "sum", value: 30, type: "primitive" }, { name: "i", value: 2, type: "primitive", changed: true }], active: true }], heap: [{ id: "arr1", className: "Array", properties: [{ name: "0", value: 10, type: "primitive" }, { name: "1", value: 20, type: "primitive" }, { name: "2", value: 30, type: "primitive" }, { name: "length", value: 3, type: "primitive" }] }], explanation: "Increment 'i' to 2. 2 < 3 is true." },
        { stepId: 8, line: 5, stack: [{ id: "global", name: "Global", variables: [{ name: "numbers", value: "REF:arr1", type: "reference", refId: "arr1" }, { name: "sum", value: 60, type: "primitive", changed: true }, { name: "i", value: 2, type: "primitive" }], active: true }], heap: [{ id: "arr1", className: "Array", properties: [{ name: "0", value: 10, type: "primitive" }, { name: "1", value: 20, type: "primitive" }, { name: "2", value: 30, type: "primitive", highlight: true }, { name: "length", value: 3, type: "primitive" }] }], explanation: "Access numbers[2] (30). sum = 30 + 30 = 60." },
        
        // Loop End
        { stepId: 9, line: 4, stack: [{ id: "global", name: "Global", variables: [{ name: "numbers", value: "REF:arr1", type: "reference", refId: "arr1" }, { name: "sum", value: 60, type: "primitive" }, { name: "i", value: 3, type: "primitive", changed: true }], active: true }], heap: [{ id: "arr1", className: "Array", properties: [{ name: "0", value: 10, type: "primitive" }, { name: "1", value: 20, type: "primitive" }, { name: "2", value: 30, type: "primitive" }, { name: "length", value: 3, type: "primitive" }] }], explanation: "Increment 'i' to 3. 3 < 3 is FALSE. Loop ends." }
      ]
    }
  }
};

// ==========================================
// 6. Conditionals Lesson (NEW)
// ==========================================
const conditionalsLesson: Lesson = {
  id: "conditionals",
  title: "Conditionals (If/Else)",
  description: "See how the computer makes decisions and chooses which path to follow in the code.",
  difficulty: "Beginner",
  variants: {
    javascript: {
      code: `function verificarIdade(idade) {
  let status;
  
  if (idade >= 18) {
    status = "Maior de idade";
  } else {
    status = "Menor de idade";
  }
  
  return status;
}

const resultado = verificarIdade(15);`,
      steps: [
        { stepId: 0, line: 11, stack: [], heap: [], explanation: "Let's verify an age." },
        { stepId: 1, line: 11, stack: [{ id: "global", name: "Global", variables: [], active: false }, { id: "verificar", name: "verificarIdade(15)", variables: [{ name: "idade", value: 15, type: "primitive" }], active: true }], heap: [], explanation: "We call the function with age = 15." },
        { stepId: 2, line: 2, stack: [{ id: "global", name: "Global", variables: [], active: false }, { id: "verificar", name: "verificarIdade(15)", variables: [{ name: "idade", value: 15, type: "primitive" }, { name: "status", value: undefined, type: "primitive", changed: true }], active: true }], heap: [], explanation: "Variable 'status' is created but still undefined." },
        { stepId: 3, line: 4, stack: [{ id: "global", name: "Global", variables: [], active: false }, { id: "verificar", name: "verificarIdade(15)", variables: [{ name: "idade", value: 15, type: "primitive" }, { name: "status", value: undefined, type: "primitive" }], active: true }], heap: [], explanation: "The 'if' checks: 15 >= 18? FALSE." },
        { stepId: 4, line: 6, stack: [{ id: "global", name: "Global", variables: [], active: false }, { id: "verificar", name: "verificarIdade(15)", variables: [{ name: "idade", value: 15, type: "primitive" }, { name: "status", value: undefined, type: "primitive" }], active: true }], heap: [], explanation: "Since it's false, we jump to the 'else'." },
        { stepId: 5, line: 7, stack: [{ id: "global", name: "Global", variables: [], active: false }, { id: "verificar", name: "verificarIdade(15)", variables: [{ name: "idade", value: 15, type: "primitive" }, { name: "status", value: "Menor de idade", type: "primitive", changed: true }], active: true }], heap: [], explanation: "We execute the else block. status becomes 'Menor de idade'." },
        { stepId: 6, line: 10, stack: [{ id: "global", name: "Global", variables: [], active: false }, { id: "verificar", name: "verificarIdade(15)", variables: [{ name: "idade", value: 15, type: "primitive" }, { name: "status", value: "Menor de idade", type: "primitive" }], active: true, isClosing: true }], heap: [], explanation: "We return the value." },
        { stepId: 7, line: 11, stack: [{ id: "global", name: "Global", variables: [{ name: "resultado", value: "Menor de idade", type: "primitive", changed: true }], active: true }], heap: [], explanation: "Final result stored." }
      ]
    }
  }
};

// ==========================================
// Premium Lessons (Modelos)
// ==========================================
const closuresLesson: Lesson = {
  id: "closures",
  title: "Closures (Functions and Scope)",
  description: "Understand how functions remember variables from the scope where they were created.",
  difficulty: "Intermediate",
  variants: {
    javascript: {
      code: `function criarContador() {
  let cont = 0;
  return function() {
    cont = cont + 1;
    return cont;
  }
}

const contador = criarContador();
contador();
contador();`,
      steps: [
        { stepId: 0, line: 8, stack: [], heap: [], explanation: "We define createCounter and create the counter." },
        { stepId: 1, line: 8, stack: [{ id: 'global', name: 'Global', variables: [{ name: 'contador', value: 'REF:fn1', type: 'reference', refId: 'fn1', changed: true }], active: true }], heap: [{ id: 'fn1', className: 'Function', properties: [{ name: '[[Scope]]', value: 'REF:env1', type: 'reference' }], highlight: true }], explanation: "The returned function keeps a reference to the environment (closure)." },
        { stepId: 2, line: 9, stack: [{ id: 'global', name: 'Global', variables: [{ name: 'contador', value: 'REF:fn1', type: 'reference', refId: 'fn1' }], active: true }], heap: [{ id: 'env1', className: 'Env', properties: [{ name: 'cont', value: 1, type: 'primitive', changed: true }] }], explanation: "When calling contador(), 'cont' is incremented and preserved in the closure." },
        { stepId: 3, line: 10, stack: [{ id: 'global', name: 'Global', variables: [{ name: 'contador', value: 'REF:fn1', type: 'reference', refId: 'fn1' }], active: true }], heap: [{ id: 'env1', className: 'Env', properties: [{ name: 'cont', value: 2, type: 'primitive', changed: true }] }], explanation: "Calling it again increases cont to 2 — the state was preserved." }
      ]
    }
  }
};

const asyncLesson: Lesson = {
  id: "async-await",
  title: "Asynchronous: Callbacks, Promises and async/await",
  description: "Shows the difference between synchronous and asynchronous execution and how the event loop works.",
  difficulty: "Intermediate",
  variants: {
    javascript: {
      code: `console.log('A');
setTimeout(() => console.log('B'), 0);
Promise.resolve().then(() => console.log('C'));
console.log('D');`,
      steps: [
        { stepId: 0, line: 1, stack: [], heap: [], explanation: "Initial execution: log 'A' and scheduling callbacks." },
        { stepId: 1, line: 1, stack: [{ id: 'global', name: 'Global', variables: [], active: true }], heap: [], explanation: "Prints 'A' immediately." },
        { stepId: 2, line: 4, stack: [{ id: 'global', name: 'Global', variables: [], active: true }], heap: [], explanation: "Prints 'D' next (synchronous)." },
        { stepId: 3, line: 3, stack: [{ id: 'global', name: 'Global', variables: [], active: true }], heap: [], explanation: "Microtasks (Promises) run before setTimeout callbacks: prints 'C'." },
        { stepId: 4, line: 2, stack: [], heap: [], explanation: "Finally, the event loop processes macrotasks: setTimeout prints 'B'. Order: A, D, C, B." }
      ]
    }
  }
};

const debuggingLesson: Lesson = {
  id: "debugging",
  title: "Debugging and Console",
  description: "How to use logs and breakpoints to understand step by step what happens in the code.",
  difficulty: "Beginner",
  variants: {
    javascript: {
      code: `function busca(arr, target) {
  for (let i = 0; i < arr.length; i++) {
    console.log('checando', i);
    if (arr[i] === target) return i;
  }
  return -1;
}

busca([1,2,3,4], 3);`,
      steps: [
        { stepId: 0, line: 1, stack: [], heap: [], explanation: "We call search. The loop iterates and logs each index to help debug." },
        { stepId: 1, line: 3, stack: [{ id: 'global', name: 'Global', variables: [], active: true }], heap: [], explanation: "checking 0" },
        { stepId: 2, line: 3, stack: [{ id: 'global', name: 'Global', variables: [], active: true }], heap: [], explanation: "checking 1" },
        { stepId: 3, line: 3, stack: [{ id: 'global', name: 'Global', variables: [], active: true }], heap: [], explanation: "checking 2 -> found 3 and return index 2" }
      ]
    }
  }
};

export const lessons: Record<string, Lesson> = {
  functions: functionLesson,
  objects: objectLesson,
  classes: classLesson,
  recursion: recursionLesson,
  "loops-arrays": loopsArraysLesson,
  conditionals: conditionalsLesson,
  closures: closuresLesson,
  "async-await": asyncLesson,
  debugging: debuggingLesson
};
