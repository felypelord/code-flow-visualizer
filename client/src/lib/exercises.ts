import { Lesson } from "./types";

// ==========================================
// EXERCISES/TASKS SYSTEM WITH MULTI-LANGUAGE SUPPORT
// ==========================================

export type Language = "javascript" | "python";

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
  difficulty: "Iniciante" | "Intermediário" | "Avançado";
  variants: {
    javascript?: LanguageVariant;
    python?: LanguageVariant;
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
    title: "Soma de Dois Números",
    description: "Escreva uma função que recebe dois números e retorna a soma deles.",
    difficulty: "Iniciante",
    variants: {
      javascript: {
        language: "javascript",
        initialCode: `function somar(a, b) {\n  // Seu código aqui\n  \n}`,
        solution: `function somar(a, b) {\n  return a + b;\n}`,
        hint: "Use o operador + para somar os parâmetros",
      },
      python: {
        language: "python",
        initialCode: `def somar(a, b):\n    # Seu código aqui\n    pass`,
        solution: `def somar(a, b):\n    return a + b`,
        hint: "Use o operador + para somar os parâmetros",
      },
    },
    tests: [
      { name: "somar(2, 3)", input: [2, 3], expected: 5 },
      { name: "somar(10, 5)", input: [10, 5], expected: 15 },
      { name: "somar(-5, 5)", input: [-5, 5], expected: 0 },
    ],
  },
  {
    id: "even-or-odd",
    title: "Par ou Ímpar",
    description: "Escreva uma função que verifica se um número é par ou ímpar.",
    difficulty: "Iniciante",
    variants: {
      javascript: {
        language: "javascript",
        initialCode: `function verificarParOuImpar(numero) {\n  // Seu código aqui\n  \n}`,
        solution: `function verificarParOuImpar(numero) {\n  return numero % 2 === 0 ? "par" : "ímpar";\n}`,
        hint: "Use o operador módulo (%) para obter o resto da divisão",
      },
      python: {
        language: "python",
        initialCode: `def verificar_par_ou_impar(numero):\n    # Seu código aqui\n    pass`,
        solution: `def verificar_par_ou_impar(numero):\n    return "par" if numero % 2 == 0 else "ímpar"`,
        hint: "Use o operador módulo (%) para obter o resto da divisão",
      },
    },
    tests: [
      { name: "verificarParOuImpar(4)", input: [4], expected: "par" },
      { name: "verificarParOuImpar(7)", input: [7], expected: "ímpar" },
      { name: "verificarParOuImpar(0)", input: [0], expected: "par" },
    ],
  },
  {
    id: "find-max",
    title: "Encontrar o Maior",
    description: "Escreva uma função que recebe três números e retorna o maior deles.",
    difficulty: "Iniciante",
    variants: {
      javascript: {
        language: "javascript",
        initialCode: `function encontrarMaior(a, b, c) {\n  // Seu código aqui\n  \n}`,
        solution: `function encontrarMaior(a, b, c) {\n  return Math.max(a, b, c);\n}`,
        hint: "Use Math.max() ou compare com if statements",
      },
      python: {
        language: "python",
        initialCode: `def encontrar_maior(a, b, c):\n    # Seu código aqui\n    pass`,
        solution: `def encontrar_maior(a, b, c):\n    return max(a, b, c)`,
        hint: "Use a função max() ou compare com if statements",
      },
    },
    tests: [
      { name: "encontrarMaior(1, 2, 3)", input: [1, 2, 3], expected: 3 },
      { name: "encontrarMaior(10, 3, 7)", input: [10, 3, 7], expected: 10 },
    ],
  },
  {
    id: "reverse-string",
    title: "Inverter String",
    description: "Escreva uma função que inverte uma string.",
    difficulty: "Iniciante",
    variants: {
      javascript: {
        language: "javascript",
        initialCode: `function inverterString(texto) {\n  // Seu código aqui\n  \n}`,
        solution: `function inverterString(texto) {\n  return texto.split('').reverse().join('');\n}`,
        hint: "Use split(), reverse() e join()",
      },
      python: {
        language: "python",
        initialCode: `def inverter_string(texto):\n    # Seu código aqui\n    pass`,
        solution: `def inverter_string(texto):\n    return texto[::-1]`,
        hint: "Use slicing com [::-1] ou reversed()",
      },
    },
    tests: [
      { name: "inverterString('hello')", input: ["hello"], expected: "olleh" },
      { name: "inverterString('123')", input: ["123"], expected: "321" },
    ],
  },
  {
    id: "count-vowels",
    title: "Contar Vogais",
    description: "Escreva uma função que conta quantas vogais existem em uma string.",
    difficulty: "Iniciante",
    variants: {
      javascript: {
        language: "javascript",
        initialCode: `function contarVogais(texto) {\n  // Seu código aqui\n  \n}`,
        solution: `function contarVogais(texto) {\n  return (texto.match(/[aeiouAEIOU]/g) || []).length;\n}`,
        hint: "Use um loop ou regex para verificar vogais",
      },
      python: {
        language: "python",
        initialCode: `def contar_vogais(texto):\n    # Seu código aqui\n    pass`,
        solution: `def contar_vogais(texto):\n    return sum(1 for c in texto if c.lower() in 'aeiou')`,
        hint: "Use um loop ou list comprehension para contar vogais",
      },
    },
    tests: [
      { name: "contarVogais('hello')", input: ["hello"], expected: 2 },
      { name: "contarVogais('programacao')", input: ["programacao"], expected: 5 },
    ],
  },
  {
    id: "filter-even",
    title: "Filtrar Pares",
    description: "Retorne apenas os números pares de um array.",
    difficulty: "Iniciante",
    variants: {
      javascript: {
        language: "javascript",
        initialCode: `function filtrarPares(array) {\n  // Seu código aqui\n  \n}`,
        solution: `function filtrarPares(array) {\n  return array.filter(n => n % 2 === 0);\n}`,
        hint: "Use .filter() com uma condição para números pares",
      },
      python: {
        language: "python",
        initialCode: `def filtrar_pares(array):\n    # Seu código aqui\n    pass`,
        solution: `def filtrar_pares(array):\n    return [n for n in array if n % 2 == 0]`,
        hint: "Use list comprehension ou filter()",
      },
    },
    tests: [
      { name: "filtrarPares([1,2,3,4,5])", input: [[1, 2, 3, 4, 5]], expected: [2, 4] },
      { name: "filtrarPares([2,4,6])", input: [[2, 4, 6]], expected: [2, 4, 6] },
    ],
  },
  {
    id: "factorial",
    title: "Fatorial",
    description: "Calcule o fatorial de um número. (5! = 5×4×3×2×1 = 120)",
    difficulty: "Intermediário",
    variants: {
      javascript: {
        language: "javascript",
        initialCode: `function fatorial(n) {\n  // Seu código aqui\n  \n}`,
        solution: `function fatorial(n) {\n  if (n === 0 || n === 1) return 1;\n  let result = 1;\n  for (let i = 2; i <= n; i++) result *= i;\n  return result;\n}`,
        hint: "Use recursão ou um loop para multiplicar os números",
      },
      python: {
        language: "python",
        initialCode: `def fatorial(n):\n    # Seu código aqui\n    pass`,
        solution: `def fatorial(n):\n    if n == 0 or n == 1:\n        return 1\n    result = 1\n    for i in range(2, n + 1):\n        result *= i\n    return result`,
        hint: "Use recursão ou um loop para multiplicar os números",
      },
    },
    tests: [
      { name: "fatorial(5)", input: [5], expected: 120 },
      { name: "fatorial(0)", input: [0], expected: 1 },
      { name: "fatorial(4)", input: [4], expected: 24 },
    ],
  },
  {
    id: "palindrome",
    title: "Palíndromo",
    description: "Verifique se uma palavra é um palíndromo (lê-se igual de trás para frente).",
    difficulty: "Intermediário",
    variants: {
      javascript: {
        language: "javascript",
        initialCode: `function ehPalindromo(palavra) {\n  // Seu código aqui\n  \n}`,
        solution: `function ehPalindromo(palavra) {\n  const invertida = palavra.split('').reverse().join('');\n  return palavra === invertida;\n}`,
        hint: "Compare a palavra com ela mesma invertida",
      },
      python: {
        language: "python",
        initialCode: `def eh_palindromo(palavra):\n    # Seu código aqui\n    pass`,
        solution: `def eh_palindromo(palavra):\n    return palavra == palavra[::-1]`,
        hint: "Compare a palavra com ela mesma invertida usando slicing",
      },
    },
    tests: [
      { name: "ehPalindromo('arara')", input: ["arara"], expected: true },
      { name: "ehPalindromo('hello')", input: ["hello"], expected: false },
      { name: "ehPalindromo('aba')", input: ["aba"], expected: true },
    ],
  },
  {
    id: "count-occurrences",
    title: "Contar Ocorrências",
    description: "Conte quantas vezes um elemento aparece em um array.",
    difficulty: "Iniciante",
    variants: {
      javascript: {
        language: "javascript",
        initialCode: `function contarOcorrencias(array, elemento) {\n  // Seu código aqui\n  \n}`,
        solution: `function contarOcorrencias(array, elemento) {\n  return array.filter(item => item === elemento).length;\n}`,
        hint: "Use .filter() para contar elementos iguais",
      },
      python: {
        language: "python",
        initialCode: `def contar_ocorrencias(array, elemento):\n    # Seu código aqui\n    pass`,
        solution: `def contar_ocorrencias(array, elemento):\n    return array.count(elemento)`,
        hint: "Use o método .count() da lista",
      },
    },
    tests: [
      { name: "contarOcorrencias([1,2,2,3,2], 2)", input: [[1, 2, 2, 3, 2], 2], expected: 3 },
      { name: "contarOcorrencias([1,1,1], 1)", input: [[1, 1, 1], 1], expected: 3 },
    ],
  },
  {
    id: "sum-array",
    title: "Somar Array",
    description: "Some todos os números de um array.",
    difficulty: "Iniciante",
    variants: {
      javascript: {
        language: "javascript",
        initialCode: `function somarArray(array) {\n  // Seu código aqui\n  \n}`,
        solution: `function somarArray(array) {\n  return array.reduce((sum, n) => sum + n, 0);\n}`,
        hint: "Use .reduce() ou um loop",
      },
      python: {
        language: "python",
        initialCode: `def somar_array(array):\n    # Seu código aqui\n    pass`,
        solution: `def somar_array(array):\n    return sum(array)`,
        hint: "Use a função sum() ou um loop",
      },
    },
    tests: [
      { name: "somarArray([1,2,3,4])", input: [[1, 2, 3, 4]], expected: 10 },
      { name: "somarArray([10,20])", input: [[10, 20]], expected: 30 },
    ],
  },
  {
    id: "quick-sort",
    title: "Quick Sort",
    description: "Implemente o algoritmo Quick Sort para ordenar um array.",
    difficulty: "Avançado",
    variants: {
      javascript: {
        language: "javascript",
        initialCode: `function quickSort(array) {\n  // Seu código aqui\n  \n}`,
        solution: `function quickSort(array) {\n  if (array.length <= 1) return array;\n  const pivot = array[0];\n  const left = array.slice(1).filter(x => x <= pivot);\n  const right = array.slice(1).filter(x => x > pivot);\n  return [...quickSort(left), pivot, ...quickSort(right)];\n}`,
        hint: "Escolha um pivot e particione recursivamente",
      },
      python: {
        language: "python",
        initialCode: `def quick_sort(array):\n    # Seu código aqui\n    pass`,
        solution: `def quick_sort(array):\n    if len(array) <= 1:\n        return array\n    pivot = array[0]\n    left = [x for x in array[1:] if x <= pivot]\n    right = [x for x in array[1:] if x > pivot]\n    return quick_sort(left) + [pivot] + quick_sort(right)`,
        hint: "Escolha um pivot e particione recursivamente",
      },
    },
    tests: [
      { name: "quickSort([3,1,2])", input: [[3, 1, 2]], expected: [1, 2, 3] },
      { name: "quickSort([5,2,8,1])", input: [[5, 2, 8, 1]], expected: [1, 2, 5, 8] },
    ],
  },
  {
    id: "merge-sorted",
    title: "Mesclar Arrays",
    description: "Mescle dois arrays já ordenados mantendo a ordem.",
    difficulty: "Avançado",
    variants: {
      javascript: {
        language: "javascript",
        initialCode: `function mesclarOrdenados(arr1, arr2) {\n  // Seu código aqui\n  \n}`,
        solution: `function mesclarOrdenados(arr1, arr2) {\n  const result = [];\n  let i = 0, j = 0;\n  while (i < arr1.length && j < arr2.length) {\n    if (arr1[i] <= arr2[j]) result.push(arr1[i++]);\n    else result.push(arr2[j++]);\n  }\n  return [...result, ...arr1.slice(i), ...arr2.slice(j)];\n}`,
        hint: "Use dois ponteiros para comparar elementos",
      },
      python: {
        language: "python",
        initialCode: `def mesclar_ordenados(arr1, arr2):\n    # Seu código aqui\n    pass`,
        solution: `def mesclar_ordenados(arr1, arr2):\n    result = []\n    i = j = 0\n    while i < len(arr1) and j < len(arr2):\n        if arr1[i] <= arr2[j]:\n            result.append(arr1[i])\n            i += 1\n        else:\n            result.append(arr2[j])\n            j += 1\n    return result + arr1[i:] + arr2[j:]`,
        hint: "Use dois ponteiros para comparar elementos",
      },
    },
    tests: [
      { name: "mesclarOrdenados([1,3,5], [2,4,6])", input: [[1, 3, 5], [2, 4, 6]], expected: [1, 2, 3, 4, 5, 6] },
    ],
  },
  {
    id: "binary-search",
    title: "Busca Binária",
    description: "Implemente busca binária em um array ordenado.",
    difficulty: "Intermediário",
    variants: {
      javascript: {
        language: "javascript",
        initialCode: `function buscaBinaria(array, alvo) {\n  // Seu código aqui\n  \n}`,
        solution: `function buscaBinaria(array, alvo) {\n  let left = 0, right = array.length - 1;\n  while (left <= right) {\n    const mid = Math.floor((left + right) / 2);\n    if (array[mid] === alvo) return mid;\n    if (array[mid] < alvo) left = mid + 1;\n    else right = mid - 1;\n  }\n  return -1;\n}`,
        hint: "Divida o espaço de busca pela metade a cada iteração",
      },
      python: {
        language: "python",
        initialCode: `def busca_binaria(array, alvo):\n    # Seu código aqui\n    pass`,
        solution: `def busca_binaria(array, alvo):\n    left, right = 0, len(array) - 1\n    while left <= right:\n        mid = (left + right) // 2\n        if array[mid] == alvo:\n            return mid\n        elif array[mid] < alvo:\n            left = mid + 1\n        else:\n            right = mid - 1\n    return -1`,
        hint: "Divida o espaço de busca pela metade a cada iteração",
      },
    },
    tests: [
      { name: "buscaBinaria([1,3,5,7,9], 5)", input: [[1, 3, 5, 7, 9], 5], expected: 2 },
      { name: "buscaBinaria([1,3,5,7,9], 10)", input: [[1, 3, 5, 7, 9], 10], expected: -1 },
    ],
  },
  {
    id: "anagrams",
    title: "Anagramas",
    description: "Verifique se duas palavras são anagramas.",
    difficulty: "Iniciante",
    variants: {
      javascript: {
        language: "javascript",
        initialCode: `function saoAnagramas(p1, p2) {\n  // Seu código aqui\n  \n}`,
        solution: `function saoAnagramas(p1, p2) {\n  return p1.split('').sort().join('') === p2.split('').sort().join('');\n}`,
        hint: "Ordene as letras e compare",
      },
      python: {
        language: "python",
        initialCode: `def sao_anagramas(p1, p2):\n    # Seu código aqui\n    pass`,
        solution: `def sao_anagramas(p1, p2):\n    return sorted(p1) == sorted(p2)`,
        hint: "Use sorted() para ordenar as letras",
      },
    },
    tests: [
      { name: "saoAnagramas('listen', 'silent')", input: ["listen", "silent"], expected: true },
      { name: "saoAnagramas('hello', 'world')", input: ["hello", "world"], expected: false },
    ],
  },
  {
    id: "longest-substring",
    title: "Substring Mais Longa",
    description: "Encontre a substring mais longa sem caracteres repetidos.",
    difficulty: "Avançado",
    variants: {
      javascript: {
        language: "javascript",
        initialCode: `function substringMaisLonga(s) {\n  // Seu código aqui\n  \n}`,
        solution: `function substringMaisLonga(s) {\n  const map = {};\n  let maxLen = 0, start = 0;\n  for (let i = 0; i < s.length; i++) {\n    if (map[s[i]] !== undefined) start = Math.max(start, map[s[i]] + 1);\n    map[s[i]] = i;\n    maxLen = Math.max(maxLen, i - start + 1);\n  }\n  return maxLen;\n}`,
        hint: "Use sliding window com um Map",
      },
      python: {
        language: "python",
        initialCode: `def substring_mais_longa(s):\n    # Seu código aqui\n    pass`,
        solution: `def substring_mais_longa(s):\n    char_map = {}\n    max_len = 0\n    start = 0\n    for i, char in enumerate(s):\n        if char in char_map:\n            start = max(start, char_map[char] + 1)\n        char_map[char] = i\n        max_len = max(max_len, i - start + 1)\n    return max_len`,
        hint: "Use sliding window com um dicionário",
      },
    },
    tests: [
      { name: "substringMaisLonga('abcabcbb')", input: ["abcabcbb"], expected: 3 },
      { name: "substringMaisLonga('dvdf')", input: ["dvdf"], expected: 3 },
    ],
  },
  {
    id: "matrix-spiral",
    title: "Matriz em Espiral",
    description: "Percorra uma matriz em padrão espiral.",
    difficulty: "Avançado",
    variants: {
      javascript: {
        language: "javascript",
        initialCode: `function matrizEspiral(m) {\n  // Seu código aqui\n  \n}`,
        solution: `function matrizEspiral(m) {\n  const r = [];\n  let top = 0, bot = m.length - 1, left = 0, right = m[0].length - 1;\n  while (top <= bot && left <= right) {\n    for (let i = left; i <= right; i++) r.push(m[top][i]);\n    top++;\n    for (let i = top; i <= bot; i++) r.push(m[i][right]);\n    right--;\n    if (top <= bot) for (let i = right; i >= left; i--) r.push(m[bot][i]);\n    bot--;\n    if (left <= right) for (let i = bot; i >= top; i--) r.push(m[i][left]);\n    left++;\n  }\n  return r;\n}`,
        hint: "Controle os limites e reduza-os",
      },
      python: {
        language: "python",
        initialCode: `def matriz_espiral(m):\n    # Seu código aqui\n    pass`,
        solution: `def matriz_espiral(m):\n    r = []\n    top, bot, left, right = 0, len(m) - 1, 0, len(m[0]) - 1\n    while top <= bot and left <= right:\n        for i in range(left, right + 1):\n            r.append(m[top][i])\n        top += 1\n        for i in range(top, bot + 1):\n            r.append(m[i][right])\n        right -= 1\n        if top <= bot:\n            for i in range(right, left - 1, -1):\n                r.append(m[bot][i])\n            bot -= 1\n        if left <= right:\n            for i in range(bot, top - 1, -1):\n                r.append(m[i][left])\n            left += 1\n    return r`,
        hint: "Controle os limites e reduza-os",
      },
    },
    tests: [
      { name: "matrizEspiral([[1,2,3],[4,5,6],[7,8,9]])", input: [[[1,2,3],[4,5,6],[7,8,9]]], expected: [1,2,3,6,9,8,7,4,5] },
    ],
  },
  {
    id: "balanced-parens",
    title: "Parênteses Balanceados",
    description: "Verifique se parênteses/colchetes/chaves estão balanceados.",
    difficulty: "Intermediário",
    variants: {
      javascript: {
        language: "javascript",
        initialCode: `function balanceado(s) {\n  // Seu código aqui\n  \n}`,
        solution: `function balanceado(s) {\n  const stack = [];\n  const map = { ')': '(', '}': '{', ']': '[' };\n  for (let c of s) {\n    if (c in map) {\n      if (stack.pop() !== map[c]) return false;\n    } else stack.push(c);\n  }\n  return stack.length === 0;\n}`,
        hint: "Use uma stack para rastrear parênteses",
      },
      python: {
        language: "python",
        initialCode: `def balanceado(s):\n    # Seu código aqui\n    pass`,
        solution: `def balanceado(s):\n    stack = []\n    map = { ')': '(', '}': '{', ']': '[' }\n    for c in s:\n        if c in map:\n            if not stack or stack.pop() != map[c]:\n                return False\n        else:\n            stack.append(c)\n    return len(stack) == 0`,
        hint: "Use uma stack para rastrear parênteses",
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
    title: "Achatar Array",
    description: "Achate arrays aninhados em qualquer profundidade.",
    difficulty: "Intermediário",
    variants: {
      javascript: {
        language: "javascript",
        initialCode: `function achatar(a) {\n  // Seu código aqui\n  \n}`,
        solution: `function achatar(a) {\n  return a.reduce((flat, item) => flat.concat(Array.isArray(item) ? achatar(item) : item), []);\n}`,
        hint: "Use recursão e reduce",
      },
      python: {
        language: "python",
        initialCode: `def achatar(a):\n    # Seu código aqui\n    pass`,
        solution: `def achatar(a):\n    result = []\n    for item in a:\n        if isinstance(item, list):\n            result.extend(achatar(item))\n        else:\n            result.append(item)\n    return result`,
        hint: "Use recursão e isinstance()",
      },
    },
    tests: [
      { name: "achatar([1,[2,3,[4,5]]])", input: [[1, [2, 3, [4, 5]]]], expected: [1, 2, 3, 4, 5] },
    ],
  },
  {
    id: "group-by",
    title: "Agrupar por Propriedade",
    description: "Agrupe array de objetos por uma propriedade.",
    difficulty: "Intermediário",
    variants: {
      javascript: {
        language: "javascript",
        initialCode: `function agrupar(arr, prop) {\n  // Seu código aqui\n  \n}`,
        solution: `function agrupar(arr, prop) {\n  return arr.reduce((groups, item) => {\n    const key = item[prop];\n    if (!groups[key]) groups[key] = [];\n    groups[key].push(item);\n    return groups;\n  }, {});\n}`,
        hint: "Use reduce() para agrupar",
      },
      python: {
        language: "python",
        initialCode: `def agrupar(arr, prop):\n    # Seu código aqui\n    pass`,
        solution: `def agrupar(arr, prop):\n    groups = {}\n    for item in arr:\n        key = item[prop]\n        if key not in groups:\n            groups[key] = []\n        groups[key].append(item)\n    return groups`,
        hint: "Use um dicionário para agrupar",
      },
    },
    tests: [
      { name: "agrupar([{'tipo':'A'},{'tipo':'B'},{'tipo':'A'}], 'tipo')", input: [[{"tipo":"A"},{"tipo":"B"},{"tipo":"A"}], "tipo"], expected: {"A": [{"tipo":"A"},{"tipo":"A"}], "B": [{"tipo":"B"}]} },
    ],
  },
  {
    id: "fibonacci",
    title: "Fibonacci com Memoização",
    description: "Calcule Fibonacci otimizado com memoização.",
    difficulty: "Avançado",
    variants: {
      javascript: {
        language: "javascript",
        initialCode: `function fibonacci(n, memo = {}) {\n  // Seu código aqui\n  \n}`,
        solution: `function fibonacci(n, memo = {}) {\n  if (n in memo) return memo[n];\n  if (n <= 1) return n;\n  memo[n] = fibonacci(n - 1, memo) + fibonacci(n - 2, memo);\n  return memo[n];\n}`,
        hint: "Armazene resultados para evitar recalcular",
      },
      python: {
        language: "python",
        initialCode: `def fibonacci(n, memo={}):\n    # Seu código aqui\n    pass`,
        solution: `def fibonacci(n, memo={}):\n    if n in memo:\n        return memo[n]\n    if n <= 1:\n        return n\n    memo[n] = fibonacci(n - 1, memo) + fibonacci(n - 2, memo)\n    return memo[n]`,
        hint: "Armazene resultados para evitar recalcular",
      },
    },
    tests: [
      { name: "fibonacci(5)", input: [5], expected: 5 },
      { name: "fibonacci(10)", input: [10], expected: 55 },
      { name: "fibonacci(0)", input: [0], expected: 0 },
    ],
  },
];
