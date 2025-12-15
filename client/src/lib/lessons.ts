// ... (previous imports)
import { Lesson } from "./types";

// ... (keep previous lessons: functionLesson, objectLesson, classLesson, recursionLesson)

// Need to read the file first to append properly or I can just rewrite the whole file since I have it in context?
// I have the file in context from the previous turn's write. I will rewrite it to include the new lesson.

// ==========================================
// 1. Functions Lesson
// ==========================================
const functionLesson: Lesson = {
  id: "functions",
  title: "Como funcionam as Funções?",
  description: "Entenda o conceito de 'Escopo' e 'Call Stack' (Pilha de Chamadas). Veja como variáveis são criadas e destruídas.",
  difficulty: "Iniciante",
  variants: {
    javascript: {
      code: `function somar(a, b) {
  const resultado = a + b;
  return resultado;
}

function main() {
  const x = 5;
  const y = 3;
  const total = somar(x, y);
  console.log(total);
}

main();`,
      steps: [
        {
          stepId: 0,
          line: 11,
          stack: [],
          heap: [],
          explanation: "O programa começa. O interpretador lê as definições das funções, mas nada é executado até chamarmos alguém."
        },
        {
          stepId: 1,
          line: 11,
          stack: [{ id: "main", name: "main()", variables: [], active: true }],
          heap: [],
          explanation: "A função 'main()' é chamada. Um novo 'Stack Frame' (quadro) é criado na pilha de memória para ela."
        },
        {
          stepId: 2,
          line: 7,
          stack: [{ id: "main", name: "main()", variables: [{ name: "x", value: 5, type: "primitive", changed: true }], active: true }],
          heap: [],
          explanation: "A variável 'x' é declarada e inicializada com o valor 5 dentro do escopo de 'main'."
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
          explanation: "A variável 'y' é declarada e inicializada com o valor 3."
        },
        {
          stepId: 4,
          line: 9,
          stack: [
            { id: "main", name: "main()", variables: [{ name: "x", value: 5, type: "primitive" }, { name: "y", value: 3, type: "primitive" }, { name: "total", value: undefined, type: "primitive" }], active: false },
            { id: "somar", name: "somar(5, 3)", variables: [{ name: "a", value: 5, type: "primitive", changed: true }, { name: "b", value: 3, type: "primitive", changed: true }], active: true }
          ],
          heap: [],
          explanation: "A função 'somar' é chamada. Um NOVO quadro é colocado NO TOPO da pilha. Os valores de x e y são copiados."
        },
        {
          stepId: 5,
          line: 2,
          stack: [
            { id: "main", name: "main()", variables: [{ name: "x", value: 5, type: "primitive" }, { name: "y", value: 3, type: "primitive" }, { name: "total", value: undefined, type: "primitive" }], active: false },
            { id: "somar", name: "somar(5, 3)", variables: [{ name: "a", value: 5, type: "primitive" }, { name: "b", value: 3, type: "primitive" }, { name: "resultado", value: 8, type: "primitive", changed: true }], active: true }
          ],
          heap: [],
          explanation: "O cálculo é feito e armazenado na variável local 'resultado'."
        },
        {
          stepId: 6,
          line: 3,
          stack: [
            { id: "main", name: "main()", variables: [{ name: "x", value: 5, type: "primitive" }, { name: "y", value: 3, type: "primitive" }, { name: "total", value: undefined, type: "primitive" }], active: false },
            { id: "somar", name: "somar(5, 3)", variables: [{ name: "a", value: 5, type: "primitive" }, { name: "b", value: 3, type: "primitive" }, { name: "resultado", value: 8, type: "primitive" }], active: true, isClosing: true }
          ],
          heap: [],
          explanation: "A função retorna 8. O quadro da função 'somar' será removido."
        },
        {
          stepId: 7,
          line: 9,
          stack: [{ id: "main", name: "main()", variables: [{ name: "x", value: 5, type: "primitive" }, { name: "y", value: 3, type: "primitive" }, { name: "total", value: 8, type: "primitive", changed: true }], active: true }],
          heap: [],
          explanation: "Voltamos para 'main'. O valor retornado (8) é atribuído à variável 'total'."
        },
        {
          stepId: 8,
          line: 10,
          stack: [{ id: "main", name: "main()", variables: [{ name: "x", value: 5, type: "primitive" }, { name: "y", value: 3, type: "primitive" }, { name: "total", value: 8, type: "primitive" }], active: true }],
          heap: [],
          explanation: "O valor é exibido. Fim da execução."
        }
      ]
    },
    csharp: {
      code: `using System;

class Program {
    static int Somar(int a, int b) {
        int resultado = a + b;
        return resultado;
    }

    static void Main() {
        int x = 5;
        int y = 3;
        int total = Somar(x, y);
        Console.WriteLine(total);
    }
}`,
      steps: [
        {
          stepId: 0,
          line: 9,
          stack: [],
          heap: [],
          explanation: "Em C#, a execução começa pelo método estático 'Main'. O CLR carrega o programa."
        },
        {
          stepId: 1,
          line: 9,
          stack: [{ id: "Main", name: "Main()", variables: [], active: true }],
          heap: [],
          explanation: "O método 'Main' é alocado na Stack."
        },
        {
          stepId: 2,
          line: 10,
          stack: [{ id: "Main", name: "Main()", variables: [{ name: "x", value: 5, type: "primitive", changed: true }], active: true }],
          heap: [],
          explanation: "A variável inteira 'x' é alocada na Stack (Value Type)."
        },
        {
          stepId: 3,
          line: 11,
          stack: [{ id: "Main", name: "Main()", variables: [{ name: "x", value: 5, type: "primitive" }, { name: "y", value: 3, type: "primitive", changed: true }], active: true }],
          heap: [],
          explanation: "A variável 'y' é alocada."
        },
        {
          stepId: 4,
          line: 12,
          stack: [
             { id: "Main", name: "Main()", variables: [{ name: "x", value: 5, type: "primitive" }, { name: "y", value: 3, type: "primitive" }, { name: "total", value: 0, type: "primitive" }], active: false },
             { id: "Somar", name: "Somar(5, 3)", variables: [{ name: "a", value: 5, type: "primitive", changed: true }, { name: "b", value: 3, type: "primitive", changed: true }], active: true }
          ],
          heap: [],
          explanation: "Chamamos 'Somar'. Um novo Frame é empilhado. Os valores são copiados."
        },
        {
          stepId: 5,
          line: 5,
          stack: [
             { id: "Main", name: "Main()", variables: [{ name: "x", value: 5, type: "primitive" }, { name: "y", value: 3, type: "primitive" }, { name: "total", value: 0, type: "primitive" }], active: false },
             { id: "Somar", name: "Somar(5, 3)", variables: [{ name: "a", value: 5, type: "primitive" }, { name: "b", value: 3, type: "primitive" }, { name: "resultado", value: 8, type: "primitive", changed: true }], active: true }
          ],
          heap: [],
          explanation: "O cálculo ocorre e é salvo na variável local 'resultado'."
        },
        {
          stepId: 6,
          line: 6,
          stack: [
             { id: "Main", name: "Main()", variables: [{ name: "x", value: 5, type: "primitive" }, { name: "y", value: 3, type: "primitive" }, { name: "total", value: 0, type: "primitive" }], active: false },
             { id: "Somar", name: "Somar(5, 3)", variables: [{ name: "a", value: 5, type: "primitive" }, { name: "b", value: 3, type: "primitive" }, { name: "resultado", value: 8, type: "primitive" }], active: true, isClosing: true }
          ],
          heap: [],
          explanation: "O método retorna 8 e o Frame é desempilhado."
        },
        {
          stepId: 7,
          line: 12,
          stack: [{ id: "Main", name: "Main()", variables: [{ name: "x", value: 5, type: "primitive" }, { name: "y", value: 3, type: "primitive" }, { name: "total", value: 8, type: "primitive", changed: true }], active: true }],
          heap: [],
          explanation: "De volta ao Main, 'total' recebe 8."
        },
         {
          stepId: 8,
          line: 13,
          stack: [{ id: "Main", name: "Main()", variables: [{ name: "x", value: 5, type: "primitive" }, { name: "y", value: 3, type: "primitive" }, { name: "total", value: 8, type: "primitive" }], active: true }],
          heap: [],
          explanation: "Imprime no console. Fim."
        }
      ]
    },
    java: {
      code: `public class Main {
    public static int somar(int a, int b) {
        int resultado = a + b;
        return resultado;
    }

    public static void main(String[] args) {
        int x = 5;
        int y = 3;
        int total = somar(x, y);
        System.out.println(total);
    }
}`,
      steps: [
        {
          stepId: 0,
          line: 7,
          stack: [],
          heap: [],
          explanation: "A JVM inicia a execução pelo método 'main'."
        },
        {
          stepId: 1,
          line: 7,
          stack: [{ id: "main", name: "main()", variables: [], active: true }],
          heap: [],
          explanation: "O Frame do método main é criado na Stack."
        },
        {
           stepId: 2,
           line: 8,
           stack: [{ id: "main", name: "main()", variables: [{ name: "x", value: 5, type: "primitive", changed: true }], active: true }],
           heap: [],
           explanation: "Variável primitiva 'x' (int) é criada na Stack."
        },
        {
           stepId: 3,
           line: 9,
           stack: [{ id: "main", name: "main()", variables: [{ name: "x", value: 5, type: "primitive" }, { name: "y", value: 3, type: "primitive", changed: true }], active: true }],
           heap: [],
           explanation: "Variável primitiva 'y' é criada."
        },
        {
           stepId: 4,
           line: 10,
           stack: [
             { id: "main", name: "main()", variables: [{ name: "x", value: 5, type: "primitive" }, { name: "y", value: 3, type: "primitive" }, { name: "total", value: 0, type: "primitive" }], active: false },
             { id: "somar", name: "somar(5, 3)", variables: [{ name: "a", value: 5, type: "primitive", changed: true }, { name: "b", value: 3, type: "primitive", changed: true }], active: true }
           ],
           heap: [],
           explanation: "Método 'somar' é chamado. Novo quadro na pilha."
        },
        {
           stepId: 5,
           line: 3,
           stack: [
             { id: "main", name: "main()", variables: [{ name: "x", value: 5, type: "primitive" }, { name: "y", value: 3, type: "primitive" }, { name: "total", value: 0, type: "primitive" }], active: false },
             { id: "somar", name: "somar(5, 3)", variables: [{ name: "a", value: 5, type: "primitive" }, { name: "b", value: 3, type: "primitive" }, { name: "resultado", value: 8, type: "primitive", changed: true }], active: true }
           ],
           heap: [],
           explanation: "Cálculo realizado e armazenado em 'resultado'."
        },
        {
           stepId: 6,
           line: 4,
           stack: [
             { id: "main", name: "main()", variables: [{ name: "x", value: 5, type: "primitive" }, { name: "y", value: 3, type: "primitive" }, { name: "total", value: 0, type: "primitive" }], active: false },
             { id: "somar", name: "somar(5, 3)", variables: [{ name: "a", value: 5, type: "primitive" }, { name: "b", value: 3, type: "primitive" }, { name: "resultado", value: 8, type: "primitive" }], active: true, isClosing: true }
           ],
           heap: [],
           explanation: "Retorno do método 'somar'. O quadro será destruído."
        },
        {
           stepId: 7,
           line: 10,
           stack: [{ id: "main", name: "main()", variables: [{ name: "x", value: 5, type: "primitive" }, { name: "y", value: 3, type: "primitive" }, { name: "total", value: 8, type: "primitive", changed: true }], active: true }],
           heap: [],
           explanation: "De volta ao main, valor atribuído a 'total'."
        },
        {
           stepId: 8,
           line: 11,
           stack: [{ id: "main", name: "main()", variables: [{ name: "x", value: 5, type: "primitive" }, { name: "y", value: 3, type: "primitive" }, { name: "total", value: 8, type: "primitive" }], active: true }],
           heap: [],
           explanation: "Impressão no console."
        }
      ]
    },
    c: {
      code: `#include <stdio.h>

int somar(int a, int b) {
    int resultado = a + b;
    return resultado;
}

int main() {
    int x = 5;
    int y = 3;
    int total = somar(x, y);
    printf("%d", total);
    return 0;
}`,
      steps: [
        { stepId: 0, line: 8, stack: [], heap: [], explanation: "O ponto de entrada em C é a função 'main'." },
        { stepId: 1, line: 8, stack: [{ id: "main", name: "main()", variables: [], active: true }], heap: [], explanation: "O Stack Frame para main é alocado." },
        { stepId: 2, line: 9, stack: [{ id: "main", name: "main()", variables: [{ name: "x", value: 5, type: "primitive", changed: true }], active: true }], heap: [], explanation: "Inteiro 'x' alocado na pilha." },
        { stepId: 3, line: 10, stack: [{ id: "main", name: "main()", variables: [{ name: "x", value: 5, type: "primitive" }, { name: "y", value: 3, type: "primitive", changed: true }], active: true }], heap: [], explanation: "Inteiro 'y' alocado na pilha." },
        { stepId: 4, line: 11, stack: [{ id: "main", name: "main()", variables: [{ name: "x", value: 5, type: "primitive" }, { name: "y", value: 3, type: "primitive" }, { name: "total", value: 0, type: "primitive" }], active: false }, { id: "somar", name: "somar(5, 3)", variables: [{ name: "a", value: 5, type: "primitive", changed: true }, { name: "b", value: 3, type: "primitive", changed: true }], active: true }], heap: [], explanation: "Chamada de função 'somar'. Argumentos passados por cópia." },
        { stepId: 5, line: 4, stack: [{ id: "main", name: "main()", variables: [{ name: "x", value: 5, type: "primitive" }, { name: "y", value: 3, type: "primitive" }, { name: "total", value: 0, type: "primitive" }], active: false }, { id: "somar", name: "somar(5, 3)", variables: [{ name: "a", value: 5, type: "primitive" }, { name: "b", value: 3, type: "primitive" }, { name: "resultado", value: 8, type: "primitive", changed: true }], active: true }], heap: [], explanation: "Variável local 'resultado' alocada no frame de 'somar'." },
        { stepId: 6, line: 5, stack: [{ id: "main", name: "main()", variables: [{ name: "x", value: 5, type: "primitive" }, { name: "y", value: 3, type: "primitive" }, { name: "total", value: 0, type: "primitive" }], active: false }, { id: "somar", name: "somar(5, 3)", variables: [{ name: "a", value: 5, type: "primitive" }, { name: "b", value: 3, type: "primitive" }, { name: "resultado", value: 8, type: "primitive" }], active: true, isClosing: true }], heap: [], explanation: "Retorno da função." },
        { stepId: 7, line: 11, stack: [{ id: "main", name: "main()", variables: [{ name: "x", value: 5, type: "primitive" }, { name: "y", value: 3, type: "primitive" }, { name: "total", value: 8, type: "primitive", changed: true }], active: true }], heap: [], explanation: "Valor retornado atribuído a 'total' em main." },
        { stepId: 8, line: 12, stack: [{ id: "main", name: "main()", variables: [{ name: "x", value: 5, type: "primitive" }, { name: "y", value: 3, type: "primitive" }, { name: "total", value: 8, type: "primitive" }], active: true }], heap: [], explanation: "printf exibe o resultado." }
      ]
    }
  }
};

// ==========================================
// 2. Objects Lesson
// ==========================================
const objectLesson: Lesson = {
  id: "objects",
  title: "Referências e Objetos",
  description: "Descubra a diferença entre a 'Pilha' (Stack) e o 'Heap' (Memória Livre). Variáveis de objeto apenas APONTAM para o objeto real.",
  difficulty: "Intermediário",
  variants: {
    javascript: {
      code: `function criarUsuario(nome) {
  const usuario = {
    nome: nome,
    admin: false
  };
  return usuario;
}

const u1 = criarUsuario("Ana");
const u2 = u1;
u2.admin = true;`,
      steps: [
        { stepId: 0, line: 1, stack: [], heap: [], explanation: "Início do programa. Objetos vivem na Heap." },
        { stepId: 1, line: 8, stack: [{ id: "global", name: "Global", variables: [{ name: "u1", value: undefined, type: "primitive" }], active: true }], heap: [], explanation: "Preparando chamada de criarUsuario." },
        { stepId: 2, line: 2, stack: [{ id: "global", name: "Global", variables: [{ name: "u1", value: undefined, type: "primitive" }], active: false }, { id: "criarUsuario", name: "criarUsuario('Ana')", variables: [{ name: "nome", value: "Ana", type: "primitive" }], active: true }], heap: [], explanation: "Entramos na função." },
        { stepId: 3, line: 5, stack: [{ id: "global", name: "Global", variables: [{ name: "u1", value: undefined, type: "primitive" }], active: false }, { id: "criarUsuario", name: "criarUsuario('Ana')", variables: [{ name: "nome", value: "Ana", type: "primitive" }, { name: "usuario", value: "REF:obj1", type: "reference", refId: "obj1", changed: true }], active: true }], heap: [{ id: "obj1", className: "Object", properties: [{ name: "nome", value: "Ana", type: "primitive" }, { name: "admin", value: false, type: "primitive" }], highlight: true }], explanation: "Objeto criado na HEAP. Variável na Stack guarda o ENDEREÇO (Referência)." },
        { stepId: 4, line: 6, stack: [{ id: "global", name: "Global", variables: [{ name: "u1", value: undefined, type: "primitive" }], active: false }, { id: "criarUsuario", name: "criarUsuario('Ana')", variables: [{ name: "nome", value: "Ana", type: "primitive" }, { name: "usuario", value: "REF:obj1", type: "reference", refId: "obj1" }], active: true, isClosing: true }], heap: [{ id: "obj1", className: "Object", properties: [{ name: "nome", value: "Ana", type: "primitive" }, { name: "admin", value: false, type: "primitive" }] }], explanation: "Retorna a REFERÊNCIA." },
        { stepId: 5, line: 8, stack: [{ id: "global", name: "Global", variables: [{ name: "u1", value: "REF:obj1", type: "reference", refId: "obj1", changed: true }], active: true }], heap: [{ id: "obj1", className: "Object", properties: [{ name: "nome", value: "Ana", type: "primitive" }, { name: "admin", value: false, type: "primitive" }] }], explanation: "'u1' aponta para o objeto na Heap." },
        { stepId: 6, line: 9, stack: [{ id: "global", name: "Global", variables: [{ name: "u1", value: "REF:obj1", type: "reference", refId: "obj1" }, { name: "u2", value: "REF:obj1", type: "reference", refId: "obj1", changed: true }], active: true }], heap: [{ id: "obj1", className: "Object", properties: [{ name: "nome", value: "Ana", type: "primitive" }, { name: "admin", value: false, type: "primitive" }] }], explanation: "'u2 = u1' copia o endereço. Ambos apontam para o MESMO objeto." },
        { stepId: 7, line: 10, stack: [{ id: "global", name: "Global", variables: [{ name: "u1", value: "REF:obj1", type: "reference", refId: "obj1" }, { name: "u2", value: "REF:obj1", type: "reference", refId: "obj1" }], active: true }], heap: [{ id: "obj1", className: "Object", properties: [{ name: "nome", value: "Ana", type: "primitive" }, { name: "admin", value: true, type: "primitive", changed: true }], highlight: true }], explanation: "Alterar 'u2' afeta o objeto real, então 'u1' também vê a mudança." }
      ]
    },
    csharp: {
        code: `class Usuario {
    public string Nome;
    public bool Admin;
}

class Program {
    static void Main() {
        Usuario u1 = new Usuario();
        u1.Nome = "Ana";
        
        Usuario u2 = u1;
        u2.Admin = true;
    }
}`,
        steps: [
            { stepId: 0, line: 7, stack: [], heap: [], explanation: "Início. Classes em C# são Reference Types (ficam na Heap)." },
            { stepId: 1, line: 8, stack: [{ id: "Main", name: "Main()", variables: [{ name: "u1", value: "REF:obj1", type: "reference", refId: "obj1", changed: true }], active: true }], heap: [{ id: "obj1", className: "Usuario", properties: [{ name: "Nome", value: null, type: "primitive" }, { name: "Admin", value: false, type: "primitive" }], highlight: true }], explanation: "'new Usuario()' aloca memória na Heap. 'u1' na Stack aponta para lá." },
            { stepId: 2, line: 9, stack: [{ id: "Main", name: "Main()", variables: [{ name: "u1", value: "REF:obj1", type: "reference", refId: "obj1" }], active: true }], heap: [{ id: "obj1", className: "Usuario", properties: [{ name: "Nome", value: "Ana", type: "primitive", changed: true }, { name: "Admin", value: false, type: "primitive" }], highlight: true }], explanation: "Atribuímos 'Ana' à propriedade Nome do objeto na Heap." },
            { stepId: 3, line: 11, stack: [{ id: "Main", name: "Main()", variables: [{ name: "u1", value: "REF:obj1", type: "reference", refId: "obj1" }, { name: "u2", value: "REF:obj1", type: "reference", refId: "obj1", changed: true }], active: true }], heap: [{ id: "obj1", className: "Usuario", properties: [{ name: "Nome", value: "Ana", type: "primitive" }, { name: "Admin", value: false, type: "primitive" }] }], explanation: "'u2 = u1' copia a referência. Agora temos duas variáveis apontando para o mesmo objeto." },
            { stepId: 4, line: 12, stack: [{ id: "Main", name: "Main()", variables: [{ name: "u1", value: "REF:obj1", type: "reference", refId: "obj1" }, { name: "u2", value: "REF:obj1", type: "reference", refId: "obj1" }], active: true }], heap: [{ id: "obj1", className: "Usuario", properties: [{ name: "Nome", value: "Ana", type: "primitive" }, { name: "Admin", value: true, type: "primitive", changed: true }], highlight: true }], explanation: "Alterar u2 altera o objeto compartilhado." }
        ]
    }
  }
};

// ==========================================
// 3. Recursion Lesson
// ==========================================
const recursionLesson: Lesson = {
    id: "recursion",
    title: "Recursão (Call Stack)",
    description: "Visualize como a pilha de chamadas cresce quando uma função chama a si mesma.",
    difficulty: "Intermediário",
    variants: {
        javascript: {
            code: `function fatorial(n) {
  if (n === 1) return 1;
  return n * fatorial(n - 1);
}

const resultado = fatorial(3);`,
            steps: [
                { stepId: 0, line: 6, stack: [], heap: [], explanation: "Vamos calcular o fatorial de 3 recursivamente." },
                { stepId: 1, line: 6, stack: [{ id: "global", name: "Global", variables: [], active: false }, { id: "fat3", name: "fatorial(3)", variables: [{ name: "n", value: 3, type: "primitive" }], active: true }], heap: [], explanation: "Chamada inicial: fatorial(3)." },
                { stepId: 2, line: 2, stack: [{ id: "global", name: "Global", variables: [], active: false }, { id: "fat3", name: "fatorial(3)", variables: [{ name: "n", value: 3, type: "primitive" }], active: true }], heap: [], explanation: "n é 3, não é 1. Continua." },
                { stepId: 3, line: 3, stack: [{ id: "global", name: "Global", variables: [], active: false }, { id: "fat3", name: "fatorial(3)", variables: [{ name: "n", value: 3, type: "primitive" }], active: false }, { id: "fat2", name: "fatorial(2)", variables: [{ name: "n", value: 2, type: "primitive" }], active: true }], heap: [], explanation: "PAUSA fatorial(3) para chamar fatorial(2). Empilha novo quadro." },
                { stepId: 4, line: 2, stack: [{ id: "global", name: "Global", variables: [], active: false }, { id: "fat3", name: "fatorial(3)", variables: [{ name: "n", value: 3, type: "primitive" }], active: false }, { id: "fat2", name: "fatorial(2)", variables: [{ name: "n", value: 2, type: "primitive" }], active: true }], heap: [], explanation: "n é 2. Continua." },
                { stepId: 5, line: 3, stack: [{ id: "global", name: "Global", variables: [], active: false }, { id: "fat3", name: "fatorial(3)", variables: [{ name: "n", value: 3, type: "primitive" }], active: false }, { id: "fat2", name: "fatorial(2)", variables: [{ name: "n", value: 2, type: "primitive" }], active: false }, { id: "fat1", name: "fatorial(1)", variables: [{ name: "n", value: 1, type: "primitive" }], active: true }], heap: [], explanation: "PAUSA fatorial(2) para chamar fatorial(1). A pilha cresce!" },
                { stepId: 6, line: 2, stack: [{ id: "global", name: "Global", variables: [], active: false }, { id: "fat3", name: "fatorial(3)", variables: [{ name: "n", value: 3, type: "primitive" }], active: false }, { id: "fat2", name: "fatorial(2)", variables: [{ name: "n", value: 2, type: "primitive" }], active: false }, { id: "fat1", name: "fatorial(1)", variables: [{ name: "n", value: 1, type: "primitive" }], active: true, isClosing: true }], heap: [], explanation: "BASE CASE: n é 1. Retorna 1." },
                { stepId: 7, line: 3, stack: [{ id: "global", name: "Global", variables: [], active: false }, { id: "fat3", name: "fatorial(3)", variables: [{ name: "n", value: 3, type: "primitive" }], active: false }, { id: "fat2", name: "fatorial(2)", variables: [{ name: "n", value: 2, type: "primitive" }, { name: "return", value: 2, type: "primitive", changed: true }], active: true, isClosing: true }], heap: [], explanation: "Volta para fatorial(2). Calcula 2 * 1 = 2. Retorna 2." },
                { stepId: 8, line: 3, stack: [{ id: "global", name: "Global", variables: [], active: false }, { id: "fat3", name: "fatorial(3)", variables: [{ name: "n", value: 3, type: "primitive" }, { name: "return", value: 6, type: "primitive", changed: true }], active: true, isClosing: true }], heap: [], explanation: "Volta para fatorial(3). Calcula 3 * 2 = 6. Retorna 6." },
                { stepId: 9, line: 6, stack: [{ id: "global", name: "Global", variables: [{ name: "resultado", value: 6, type: "primitive", changed: true }], active: true }], heap: [], explanation: "Resultado final 6 armazenado." }
            ]
        }
    }
};

// ==========================================
// 4. Classes Lesson
// ==========================================
const classLesson: Lesson = {
  id: "classes",
  title: "Classes e Instâncias",
  description: "Aprenda como a palavra-chave 'this' funciona e como classes geram objetos.",
  difficulty: "Avançado",
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
            { stepId: 0, line: 11, stack: [], heap: [], explanation: "Definimos a classe. Vamos instanciar com 'new'." },
            { stepId: 1, line: 2, stack: [{ id: "global", name: "Global", variables: [], active: false }, { id: "constructor", name: "Carro.constructor", variables: [{ name: "modelo", value: "Fusca", type: "primitive" }, { name: "this", value: "REF:car1", type: "reference", refId: "car1", changed: true }], active: true }], heap: [{ id: "car1", className: "Carro", properties: [], highlight: true }], explanation: "'new' cria objeto vazio na Heap e atribui a 'this'." },
            { stepId: 2, line: 3, stack: [{ id: "global", name: "Global", variables: [], active: false }, { id: "constructor", name: "Carro.constructor", variables: [{ name: "modelo", value: "Fusca", type: "primitive" }, { name: "this", value: "REF:car1", type: "reference", refId: "car1" }], active: true }], heap: [{ id: "car1", className: "Carro", properties: [{ name: "modelo", value: "Fusca", type: "primitive", changed: true }], highlight: true }], explanation: "Configura 'this.modelo'." },
            { stepId: 3, line: 4, stack: [{ id: "global", name: "Global", variables: [], active: false }, { id: "constructor", name: "Carro.constructor", variables: [{ name: "modelo", value: "Fusca", type: "primitive" }, { name: "this", value: "REF:car1", type: "reference", refId: "car1" }], active: true }], heap: [{ id: "car1", className: "Carro", properties: [{ name: "modelo", value: "Fusca", type: "primitive" }, { name: "velocidade", value: 0, type: "primitive", changed: true }], highlight: true }], explanation: "Configura 'this.velocidade'." },
            { stepId: 4, line: 11, stack: [{ id: "global", name: "Global", variables: [{ name: "c1", value: "REF:car1", type: "reference", refId: "car1", changed: true }], active: true }], heap: [{ id: "car1", className: "Carro", properties: [{ name: "modelo", value: "Fusca", type: "primitive" }, { name: "velocidade", value: 0, type: "primitive" }] }], explanation: "Retorna a instância para 'c1'." },
            { stepId: 5, line: 12, stack: [{ id: "global", name: "Global", variables: [{ name: "c1", value: "REF:car1", type: "reference", refId: "car1" }], active: false }, { id: "acelerar", name: "c1.acelerar", variables: [{ name: "this", value: "REF:car1", type: "reference", refId: "car1", changed: true }], active: true }], heap: [{ id: "car1", className: "Carro", properties: [{ name: "modelo", value: "Fusca", type: "primitive" }, { name: "velocidade", value: 0, type: "primitive" }] }], explanation: "Chama método. 'this' é o objeto c1." },
            { stepId: 6, line: 8, stack: [{ id: "global", name: "Global", variables: [{ name: "c1", value: "REF:car1", type: "reference", refId: "car1" }], active: false }, { id: "acelerar", name: "c1.acelerar", variables: [{ name: "this", value: "REF:car1", type: "reference", refId: "car1" }], active: true }], heap: [{ id: "car1", className: "Carro", properties: [{ name: "modelo", value: "Fusca", type: "primitive" }, { name: "velocidade", value: 10, type: "primitive", changed: true }], highlight: true }], explanation: "Atualiza propriedade na Heap." }
          ]
      }
  }
};

// ==========================================
// 5. Loops & Arrays Lesson (NEW)
// ==========================================
const loopsArraysLesson: Lesson = {
  id: "loops-arrays",
  title: "Loops & Arrays",
  description: "Entenda como arrays são armazenados e como loops os percorrem índice por índice.",
  difficulty: "Iniciante",
  variants: {
    javascript: {
      code: `const numeros = [10, 20, 30];
let soma = 0;

for (let i = 0; i < numeros.length; i++) {
  soma = soma + numeros[i];
}`,
      steps: [
        { stepId: 0, line: 1, stack: [], heap: [], explanation: "Vamos criar um array de números." },
        { stepId: 1, line: 1, stack: [{ id: "global", name: "Global", variables: [{ name: "numeros", value: "REF:arr1", type: "reference", refId: "arr1", changed: true }], active: true }], heap: [{ id: "arr1", className: "Array", properties: [{ name: "0", value: 10, type: "primitive" }, { name: "1", value: 20, type: "primitive" }, { name: "2", value: 30, type: "primitive" }, { name: "length", value: 3, type: "primitive" }], highlight: true }], explanation: "Array criado na Heap. 'numeros' guarda a referência." },
        { stepId: 2, line: 2, stack: [{ id: "global", name: "Global", variables: [{ name: "numeros", value: "REF:arr1", type: "reference", refId: "arr1" }, { name: "soma", value: 0, type: "primitive", changed: true }], active: true }], heap: [{ id: "arr1", className: "Array", properties: [{ name: "0", value: 10, type: "primitive" }, { name: "1", value: 20, type: "primitive" }, { name: "2", value: 30, type: "primitive" }, { name: "length", value: 3, type: "primitive" }] }], explanation: "Inicializamos 'soma' com 0." },
        
        // Loop Iteration 0
        { stepId: 3, line: 4, stack: [{ id: "global", name: "Global", variables: [{ name: "numeros", value: "REF:arr1", type: "reference", refId: "arr1" }, { name: "soma", value: 0, type: "primitive" }, { name: "i", value: 0, type: "primitive", changed: true }], active: true }], heap: [{ id: "arr1", className: "Array", properties: [{ name: "0", value: 10, type: "primitive" }, { name: "1", value: 20, type: "primitive" }, { name: "2", value: 30, type: "primitive" }, { name: "length", value: 3, type: "primitive" }] }], explanation: "Início do loop. 'i' é 0. 0 < 3 é verdadeiro." },
        { stepId: 4, line: 5, stack: [{ id: "global", name: "Global", variables: [{ name: "numeros", value: "REF:arr1", type: "reference", refId: "arr1" }, { name: "soma", value: 10, type: "primitive", changed: true }, { name: "i", value: 0, type: "primitive" }], active: true }], heap: [{ id: "arr1", className: "Array", properties: [{ name: "0", value: 10, type: "primitive", highlight: true }, { name: "1", value: 20, type: "primitive" }, { name: "2", value: 30, type: "primitive" }, { name: "length", value: 3, type: "primitive" }] }], explanation: "Acessamos numeros[0] (10) e somamos. soma = 0 + 10 = 10." },
        
        // Loop Iteration 1
        { stepId: 5, line: 4, stack: [{ id: "global", name: "Global", variables: [{ name: "numeros", value: "REF:arr1", type: "reference", refId: "arr1" }, { name: "soma", value: 10, type: "primitive" }, { name: "i", value: 1, type: "primitive", changed: true }], active: true }], heap: [{ id: "arr1", className: "Array", properties: [{ name: "0", value: 10, type: "primitive" }, { name: "1", value: 20, type: "primitive" }, { name: "2", value: 30, type: "primitive" }, { name: "length", value: 3, type: "primitive" }] }], explanation: "Incrementamos 'i' para 1. 1 < 3 é verdadeiro." },
        { stepId: 6, line: 5, stack: [{ id: "global", name: "Global", variables: [{ name: "numeros", value: "REF:arr1", type: "reference", refId: "arr1" }, { name: "soma", value: 30, type: "primitive", changed: true }, { name: "i", value: 1, type: "primitive" }], active: true }], heap: [{ id: "arr1", className: "Array", properties: [{ name: "0", value: 10, type: "primitive" }, { name: "1", value: 20, type: "primitive", highlight: true }, { name: "2", value: 30, type: "primitive" }, { name: "length", value: 3, type: "primitive" }] }], explanation: "Acessamos numeros[1] (20). soma = 10 + 20 = 30." },
        
        // Loop Iteration 2
        { stepId: 7, line: 4, stack: [{ id: "global", name: "Global", variables: [{ name: "numeros", value: "REF:arr1", type: "reference", refId: "arr1" }, { name: "soma", value: 30, type: "primitive" }, { name: "i", value: 2, type: "primitive", changed: true }], active: true }], heap: [{ id: "arr1", className: "Array", properties: [{ name: "0", value: 10, type: "primitive" }, { name: "1", value: 20, type: "primitive" }, { name: "2", value: 30, type: "primitive" }, { name: "length", value: 3, type: "primitive" }] }], explanation: "Incrementamos 'i' para 2. 2 < 3 é verdadeiro." },
        { stepId: 8, line: 5, stack: [{ id: "global", name: "Global", variables: [{ name: "numeros", value: "REF:arr1", type: "reference", refId: "arr1" }, { name: "soma", value: 60, type: "primitive", changed: true }, { name: "i", value: 2, type: "primitive" }], active: true }], heap: [{ id: "arr1", className: "Array", properties: [{ name: "0", value: 10, type: "primitive" }, { name: "1", value: 20, type: "primitive" }, { name: "2", value: 30, type: "primitive", highlight: true }, { name: "length", value: 3, type: "primitive" }] }], explanation: "Acessamos numeros[2] (30). soma = 30 + 30 = 60." },
        
        // Loop End
        { stepId: 9, line: 4, stack: [{ id: "global", name: "Global", variables: [{ name: "numeros", value: "REF:arr1", type: "reference", refId: "arr1" }, { name: "soma", value: 60, type: "primitive" }, { name: "i", value: 3, type: "primitive", changed: true }], active: true }], heap: [{ id: "arr1", className: "Array", properties: [{ name: "0", value: 10, type: "primitive" }, { name: "1", value: 20, type: "primitive" }, { name: "2", value: 30, type: "primitive" }, { name: "length", value: 3, type: "primitive" }] }], explanation: "Incrementamos 'i' para 3. 3 < 3 é FALSO. O loop termina." }
      ]
    }
  }
};

export const lessons: Record<string, Lesson> = {
  functions: functionLesson,
  objects: objectLesson,
  classes: classLesson,
  recursion: recursionLesson,
  "loops-arrays": loopsArraysLesson
};
