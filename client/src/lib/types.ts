export type Language = 'javascript' | 'python' | 'csharp' | 'java' | 'c';

export interface Variable {
  name: string;
  value: string | number | boolean | null | undefined;
  type: 'primitive' | 'reference';
  refId?: string; // If type is reference, this points to a HeapObject id
  changed?: boolean; // For highlighting changes
  highlight?: boolean; // For highlighting specific variable (e.g. array index)
}

export interface StackFrame {
  id: string;
  name: string; // Function name like "main()" or "calculate()"
  variables: Variable[];
  active: boolean;
  isClosing?: boolean; // For animation out
}

export interface HeapObject {
  id: string;
  className: string; // "Object", "Array", "User", etc.
  properties: Variable[];
  highlight?: boolean;
}

export interface Step {
  stepId: number;
  line: number; // The line number in the code that is currently executing
  stack: StackFrame[];
  heap: HeapObject[];
  explanation: string; // What is happening right now?
}

export interface LessonVariant {
  code: string;
  steps: Step[];
}

export interface QuizQuestion {
  id: string;
  prompt: string;
  options: string[];
  correctIndex: number;
  explanation: string;
}

export interface Lesson {
  id: string;
  // Optional mapping to an exercise id for deterministic Practice/Check wiring
  exerciseId?: string;
  title: string;
  description: string;
  difficulty: 'Beginner' | 'Intermediate' | 'Advanced';
  // Learning metadata (optional)
  estimatedMinutes?: number;
  prerequisites?: string[];
  outcomes?: string[];
  quiz?: QuizQuestion[];
  variants: Partial<Record<Language, LessonVariant>>; // Not all lessons might exist for all languages
}
