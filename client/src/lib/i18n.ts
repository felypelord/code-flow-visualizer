export type Language = 'en' | 'pt-BR' | 'es' | 'zh' | 'hi';

export interface Translations {
  // Header
  challenges: string;
  jsOrPython: string;
  progress: string;
  home: string;
  learn: string;
  pro: string;
  
  // Hero section
  heroTitle1: string;
  heroTitle2: string;
  heroSubtitle: string;
  getStarted: string;
  exploreObjects: string;
  languageSupport: string;
  
  // Lesson names
  learningModules: string;
  lessonFunctions: string;
  lessonConditionals: string;
  lessonLoopsArrays: string;
  lessonObjects: string;
  lessonClasses: string;
  lessonRecursion: string;
  lessonClosures: string;
  lessonAsyncAwait: string;
  lessonDebugging: string;
  
  // Lesson descriptions
  lessonFunctionsDesc: string;
  lessonConditionalsDesc: string;
  lessonLoopsArraysDesc: string;
  lessonObjectsDesc: string;
  lessonClassesDesc: string;
  lessonRecursionDesc: string;
  
  // Lesson page
  lessonNotFound: string;
  step: string;
  lesson: string;
  playground: string;
  restart: string;
  pause: string;
  play: string;
  legend: string;
  howToUse: string;
  understandAreas: string;
  callStackTitle: string;
  callStackDesc: string;
  heapMemoryTitle: string;
  heapMemoryDesc: string;
  controlsTitle: string;
  controlsDesc: string;
  explanation: string;
  start: string;
  
  // Exercise selection
  exercises: string;
  clickToSelect: string;
  
  // Difficulty
  beginner: string;
  intermediate: string;
  advanced: string;
  
  // Tabs
  editor: string;
  tests: string;
  
  // Buttons
  execute: string;
  executing: string;
  clear: string;
  hint: string;
  viewSolution: string;
  testCode: string;
  
  // Editor
  executionSpeed: string;
  variables: string;
  memory: string;
  executed: string;
  executeToSeeSteps: string;
  
  // Test results
  runToSeeResults: string;
  allTestsPassed: string;
  someTestsFailed: string;
  input: string;
  expected: string;
  received: string;
  error: string;
  writeCodeFirst: string;
  nextExercise: string;
  
  // Hints and solutions
  hintTitle: string;
  solutionTitle: string;
  
  // Stats
  completed: string;
  score: string;
  attempts: string;
  
  // Execution confirmation
  enableExecution: string;
  codeWillRunInBrowser: string;
  yes: string;
  no: string;
  
  // Security messages
  codeBlocked: string;
  timeoutError: string;
  securityPattern: string;
  useSimpleLogic: string;
  codeTooLong: string;
  tooManyLoops: string;
  maxLoops: string;
  
  // Language names
  javascript: string;
  python: string;
  c: string;
  csharp: string;
  java: string;
  
  // Errors
  noFunctionFound: string;
  useFunctionKeyword: string;
  useDefKeyword: string;
  syntaxError: string;
  pythonLoadError: string;
  failedToLoadPython: string;
  
  // Logs
  emptyLineSkipped: string;
  assigned: string;
  to: string;
  checked: string;
  startedLoop: string;
  returned: string;
  printed: string;
  
  // Compiled languages
  runningTests: string;
  compiledLanguagesRunFullTests: string;
}

export const translations: Record<Language, Translations> = {
  'en': {
    // Header
    challenges: 'Challenges',
    jsOrPython: 'JavaScript or Python',
    progress: 'Progress',
    home: 'Home',
    learn: 'Learn',
    pro: 'Pro',
    
    // Hero section
    heroTitle1: 'Watch your code',
    heroTitle2: 'come to life.',
    heroSubtitle: 'Stop imagining what happens "under the hood". Our tool visualizes exactly how memory, call stack, and objects work while your code runs.',
    getStarted: 'Get Started',
    exploreObjects: 'Explore Objects',
    languageSupport: 'Support for JS, Python, Java, C# and C',
    
    // Lesson names
    learningModules: 'Learning Modules',
    lessonFunctions: 'Functions & Stack',
    lessonConditionals: 'Conditionals',
    lessonLoopsArrays: 'Loops & Arrays',
    lessonObjects: 'Objects & Refs',
    lessonClasses: 'Classes',
    lessonRecursion: 'Recursion',
    lessonClosures: 'Closures',
    lessonAsyncAwait: 'Async/Await',
    lessonDebugging: 'Debugging',
    
    // Lesson descriptions
    lessonFunctionsDesc: 'Call and scope management.',
    lessonConditionalsDesc: 'Decision making with If/Else.',
    lessonLoopsArraysDesc: 'Iteration and array memory.',
    lessonObjectsDesc: 'Value vs Reference in Heap.',
    lessonClassesDesc: "Instances, 'new' and 'this'.",
    lessonRecursionDesc: 'Visualizing stack growth.',
    
    // Lesson page
    lessonNotFound: 'Lesson not found or incomplete',
    step: 'Step',
    lesson: 'Lesson',
    playground: 'Playground',
    restart: 'Restart',
    pause: 'Pause',
    play: 'Play',
    legend: 'Legend',
    howToUse: 'How to use this visualizer?',
    understandAreas: 'Understand what each area represents.',
    callStackTitle: 'Call Stack',
    callStackDesc: 'This is where code "remembers" where it is. Each called function creates a new block here. Simple variables (numbers, booleans) live here.',
    heapMemoryTitle: 'Heap Memory',
    heapMemoryDesc: 'Complex data lives here: Objects, Arrays and Classes. They are too large for the Stack, so they stay here and are accessed by "reference" (invisible arrows).',
    controlsTitle: 'Controls',
    controlsDesc: 'Use the buttons at the top to Pause, Skip or change the Speed of the animation.',
    explanation: 'Explanation',
    start: 'Start',
    
    // Exercise selection
    exercises: 'Exercises',
    clickToSelect: 'Click to select',
    
    // Difficulty
    beginner: 'Beginner',
    intermediate: 'Intermediate',
    advanced: 'Advanced',
    
    // Tabs
    editor: 'Editor',
    tests: 'Tests',
    
    // Buttons
    execute: 'Execute',
    executing: 'Executing...',
    clear: 'Clear',
    hint: 'Hint',
    viewSolution: 'View Solution',
    testCode: 'Test Code',
    
    // Editor
    executionSpeed: 'Execution Speed',
    variables: 'Variables',
    memory: 'Memory',
    executed: 'Executed',
    executeToSeeSteps: 'Execute code to see steps.',
    
    // Test results
    runToSeeResults: 'Run to see results',
    allTestsPassed: 'All tests passed!',
    someTestsFailed: 'Some tests failed',
    input: 'Input',
    expected: 'Expected',
    received: 'Received',
    error: 'Error',
    writeCodeFirst: 'Write your code first!',
    nextExercise: 'Next',
    
    // Hints and solutions
    hintTitle: 'Hint',
    solutionTitle: 'Solution',
    
    // Stats
    completed: 'Completed',
    score: 'Score',
    attempts: 'Attempts',
    
    // Execution confirmation
    enableExecution: 'Enable execution?',
    codeWillRunInBrowser: 'Code will run in the browser.',
    yes: 'Yes',
    no: 'No',
    
    // Security messages
    codeBlocked: 'Code Blocked',
    timeoutError: 'Timeout! Code took more than 10 seconds. Check for infinite loops.',
    securityPattern: 'Code blocked for security: pattern',
    useSimpleLogic: 'not allowed. Use only simple programming logic.',
    codeTooLong: 'Code too long. Limit: 10,000 characters.',
    tooManyLoops: 'Too many loops detected.',
    maxLoops: 'Maximum allowed: 5.',
    
    // Language names
    javascript: 'JavaScript',
    python: 'Python',
    c: 'C',
    csharp: 'C#',
    java: 'Java',
    
    // Errors
    noFunctionFound: 'No function found.',
    useFunctionKeyword: "Use 'function' to declare your function.",
    useDefKeyword: "Use 'def' to declare your function in Python.",
    syntaxError: 'Syntax Error',
    pythonLoadError: 'Failed to load Python',
    failedToLoadPython: 'Failed to load Python interpreter:',
    
    // Logs
    emptyLineSkipped: 'Empty line skipped',
    assigned: 'Assigned',
    to: 'to',
    checked: 'Checked',
    startedLoop: 'Started a loop',
    returned: 'Returned',
    printed: 'Printed',
    
    // Compiled languages
    runningTests: 'Running tests...',
    compiledLanguagesRunFullTests: 'Compiled languages execute full tests.',
  },
  
  'pt-BR': {
    // Header
    challenges: 'Desafios',
    jsOrPython: 'JavaScript ou Python',
    progress: 'Progresso',
    home: 'Início',
    learn: 'Aprender',
    pro: 'Pro',
    
    // Hero section
    heroTitle1: 'Veja seu código',
    heroTitle2: 'ganhar vida.',
    heroSubtitle: 'Pare de imaginar o que acontece "por baixo dos panos". Nossa ferramenta visualiza exatamente como memória, pilha de chamadas e objetos funcionam enquanto seu código roda.',
    getStarted: 'Começar',
    exploreObjects: 'Explorar Objetos',
    languageSupport: 'Suporte para JS, Python, Java, C# e C',
    
    // Lesson names
    learningModules: 'Módulos de Aprendizado',
    lessonFunctions: 'Funções e Pilha',
    lessonConditionals: 'Condicionais',
    lessonLoopsArrays: 'Loops e Arrays',
    lessonObjects: 'Objetos e Refs',
    lessonClasses: 'Classes',
    lessonRecursion: 'Recursão',
    lessonClosures: 'Closures',
    lessonAsyncAwait: 'Async/Await',
    lessonDebugging: 'Depuração',
    
    // Lesson descriptions
    lessonFunctionsDesc: 'Gerenciamento de chamadas e escopo.',
    lessonConditionalsDesc: 'Tomada de decisão com If/Else.',
    lessonLoopsArraysDesc: 'Iteração e memória de arrays.',
    lessonObjectsDesc: 'Valor vs Referência no Heap.',
    lessonClassesDesc: "Instâncias, 'new' e 'this'.",
    lessonRecursionDesc: 'Visualizando crescimento da pilha.',
    
    // Lesson page
    lessonNotFound: 'Lição não encontrada ou incompleta',
    step: 'Passo',
    lesson: 'Lição',
    playground: 'Playground',
    restart: 'Reiniciar',
    pause: 'Pausar',
    play: 'Executar',
    legend: 'Legenda',
    howToUse: 'Como usar este visualizador?',
    understandAreas: 'Entenda o que cada área representa.',
    callStackTitle: 'Call Stack (Pilha)',
    callStackDesc: 'Aqui é onde o código "lembra" onde está. Cada função chamada cria um novo bloco aqui. Variáveis simples (números, booleanos) vivem aqui.',
    heapMemoryTitle: 'Heap Memory (Memória)',
    heapMemoryDesc: 'Aqui vivem os dados complexos: Objetos, Arrays e Classes. Eles são grandes demais para a Pilha, então ficam aqui e são acessados por "referência" (flechas invisíveis).',
    controlsTitle: 'Controles',
    controlsDesc: 'Use os botões no topo para Pausar, Avançar ou mudar a Velocidade da animação.',
    explanation: 'Explicação',
    start: 'Iniciar',
    
    // Exercise selection
    exercises: 'Exercícios',
    clickToSelect: 'Clique para selecionar',
    
    // Difficulty
    beginner: 'Iniciante',
    intermediate: 'Intermediário',
    advanced: 'Avançado',
    
    // Tabs
    editor: 'Editor',
    tests: 'Testes',
    
    // Buttons
    execute: 'Executar',
    executing: 'Executando...',
    clear: 'Limpar',
    hint: 'Dica',
    viewSolution: 'Ver Solução',
    testCode: 'Testar Código',
    
    // Editor
    executionSpeed: 'Velocidade de execução',
    variables: 'Variáveis',
    memory: 'Memória',
    executed: 'Executado',
    executeToSeeSteps: 'Execute o código para ver os passos.',
    
    // Test results
    runToSeeResults: 'Execute para ver resultados',
    allTestsPassed: 'Todos os testes passaram!',
    someTestsFailed: 'Alguns testes falharam',
    input: 'Entrada',
    expected: 'Esperado',
    received: 'Recebido',
    error: 'Erro',
    writeCodeFirst: 'Escreva seu código primeiro!',
    nextExercise: 'Próximo',
    
    // Hints and solutions
    hintTitle: 'Dica',
    solutionTitle: 'Solução',
    
    // Stats
    completed: 'Completo',
    score: 'Pontuação',
    attempts: 'Tentativas',
    
    // Execution confirmation
    enableExecution: 'Ativar execução?',
    codeWillRunInBrowser: 'Código será executado no navegador.',
    yes: 'Sim',
    no: 'Não',
    
    // Security messages
    codeBlocked: 'Código Bloqueado',
    timeoutError: 'Tempo esgotado! Código demorou mais de 10 segundos. Verifique se há loops infinitos.',
    securityPattern: 'Código bloqueado por segurança: padrão',
    useSimpleLogic: 'não permitido. Use apenas lógica de programação simples.',
    codeTooLong: 'Código muito longo. Limite: 10.000 caracteres.',
    tooManyLoops: 'Muitos loops detectados.',
    maxLoops: 'Máximo permitido: 5.',
    
    // Language names
    javascript: 'JavaScript',
    python: 'Python',
    c: 'C',
    csharp: 'C#',
    java: 'Java',
    
    // Errors
    noFunctionFound: 'Nenhuma função encontrada.',
    useFunctionKeyword: "Use 'function' para declarar sua função.",
    useDefKeyword: "Use 'def' para declarar sua função em Python.",
    syntaxError: 'Erro de Sintaxe',
    pythonLoadError: 'Erro ao carregar Python',
    failedToLoadPython: 'Falha ao carregar o interpretador Python:',
    
    // Logs
    emptyLineSkipped: 'Linha vazia pulada',
    assigned: 'Colocou',
    to: 'em',
    checked: 'Verificou',
    startedLoop: 'Iniciou um laço',
    returned: 'Retornou',
    printed: 'Imprimiu na tela',
    
    // Compiled languages
    runningTests: 'Executando testes...',
    compiledLanguagesRunFullTests: 'Linguagens compiladas executam testes completos.',
  },
  
  'es': {
    // Header
    challenges: 'Desafíos',
    jsOrPython: 'JavaScript o Python',
    progress: 'Progreso',
    home: 'Inicio',
    learn: 'Aprender',
    pro: 'Pro',
    
    // Hero section
    heroTitle1: 'Observa tu código',
    heroTitle2: 'cobrar vida.',
    heroSubtitle: 'Deja de imaginar qué sucede "bajo el capó". Nuestra herramienta visualiza exactamente cómo funcionan la memoria, la pila de llamadas y los objetos mientras se ejecuta tu código.',
    getStarted: 'Comenzar',
    exploreObjects: 'Explorar Objetos',
    languageSupport: 'Soporte para JS, Python, Java, C# y C',
    
    // Lesson names
    learningModules: 'Módulos de Aprendizaje',
    lessonFunctions: 'Funciones y Pila',
    lessonConditionals: 'Condicionales',
    lessonLoopsArrays: 'Bucles y Arrays',
    lessonObjects: 'Objetos y Refs',
    lessonClasses: 'Clases',
    lessonRecursion: 'Recursión',
    lessonClosures: 'Closures',
    lessonAsyncAwait: 'Async/Await',
    lessonDebugging: 'Depuración',
    
    // Lesson descriptions
    lessonFunctionsDesc: 'Gestión de llamadas y ámbito.',
    lessonConditionalsDesc: 'Toma de decisiones con If/Else.',
    lessonLoopsArraysDesc: 'Iteración y memoria de arrays.',
    lessonObjectsDesc: 'Valor vs Referencia en Heap.',
    lessonClassesDesc: "Instancias, 'new' y 'this'.",
    lessonRecursionDesc: 'Visualizando crecimiento de pila.',
    
    // Lesson page
    lessonNotFound: 'Lección no encontrada o incompleta',
    step: 'Paso',
    lesson: 'Lección',
    playground: 'Playground',
    restart: 'Reiniciar',
    pause: 'Pausar',
    play: 'Ejecutar',
    legend: 'Leyenda',
    howToUse: '¿Cómo usar este visualizador?',
    understandAreas: 'Comprende qué representa cada área.',
    callStackTitle: 'Call Stack (Pila)',
    callStackDesc: 'Aquí es donde el código "recuerda" dónde está. Cada función llamada crea un nuevo bloque aquí. Variables simples (números, booleanos) viven aquí.',
    heapMemoryTitle: 'Heap Memory (Memoria)',
    heapMemoryDesc: 'Aquí viven los datos complejos: Objetos, Arrays y Clases. Son demasiado grandes para la Pila, así que quedan aquí y se acceden por "referencia" (flechas invisibles).',
    controlsTitle: 'Controles',
    controlsDesc: 'Usa los botones en la parte superior para Pausar, Saltar o cambiar la Velocidad de la animación.',
    explanation: 'Explicación',
    start: 'Iniciar',
    
    // Exercise selection
    exercises: 'Ejercicios',
    clickToSelect: 'Haz clic para seleccionar',
    
    // Difficulty
    beginner: 'Principiante',
    intermediate: 'Intermedio',
    advanced: 'Avanzado',
    
    // Tabs
    editor: 'Editor',
    tests: 'Pruebas',
    
    // Buttons
    execute: 'Ejecutar',
    executing: 'Ejecutando...',
    clear: 'Limpiar',
    hint: 'Pista',
    viewSolution: 'Ver Solución',
    testCode: 'Probar Código',
    
    // Editor
    executionSpeed: 'Velocidad de ejecución',
    variables: 'Variables',
    memory: 'Memoria',
    executed: 'Ejecutado',
    executeToSeeSteps: 'Ejecuta el código para ver los pasos.',
    
    // Test results
    runToSeeResults: 'Ejecutar para ver resultados',
    allTestsPassed: '¡Todas las pruebas pasaron!',
    someTestsFailed: 'Algunas pruebas fallaron',
    input: 'Entrada',
    expected: 'Esperado',
    received: 'Recibido',
    error: 'Error',
    writeCodeFirst: '¡Escribe tu código primero!',
    nextExercise: 'Siguiente',
    
    // Hints and solutions
    hintTitle: 'Pista',
    solutionTitle: 'Solución',
    
    // Stats
    completed: 'Completado',
    score: 'Puntuación',
    attempts: 'Intentos',
    
    // Execution confirmation
    enableExecution: '¿Habilitar ejecución?',
    codeWillRunInBrowser: 'El código se ejecutará en el navegador.',
    yes: 'Sí',
    no: 'No',
    
    // Security messages
    codeBlocked: 'Código Bloqueado',
    timeoutError: '¡Tiempo agotado! El código tardó más de 10 segundos. Verifica si hay bucles infinitos.',
    securityPattern: 'Código bloqueado por seguridad: patrón',
    useSimpleLogic: 'no permitido. Usa solo lógica de programación simple.',
    codeTooLong: 'Código demasiado largo. Límite: 10.000 caracteres.',
    tooManyLoops: 'Demasiados bucles detectados.',
    maxLoops: 'Máximo permitido: 5.',
    
    // Language names
    javascript: 'JavaScript',
    python: 'Python',
    c: 'C',
    csharp: 'C#',
    java: 'Java',
    
    // Errors
    noFunctionFound: 'No se encontró ninguna función.',
    useFunctionKeyword: "Usa 'function' para declarar tu función.",
    useDefKeyword: "Usa 'def' para declarar tu función en Python.",
    syntaxError: 'Error de Sintaxis',
    pythonLoadError: 'Error al cargar Python',
    failedToLoadPython: 'Falló la carga del intérprete de Python:',
    
    // Logs
    emptyLineSkipped: 'Línea vacía omitida',
    assigned: 'Asignó',
    to: 'a',
    checked: 'Verificó',
    startedLoop: 'Inició un bucle',
    returned: 'Devolvió',
    printed: 'Imprimió en pantalla',
    
    // Compiled languages
    runningTests: 'Ejecutando pruebas...',
    compiledLanguagesRunFullTests: 'Los lenguajes compilados ejecutan pruebas completas.',
  },
  
  'zh': {
    // Header
    challenges: '挑战',
    jsOrPython: 'JavaScript 或 Python',
    progress: '进度',
    home: '首页',
    learn: '学习',
    pro: 'Pro',
    
    // Hero section
    heroTitle1: '观看你的代码',
    heroTitle2: '栩栩如生。',
    heroSubtitle: '停止想象"底层"发生了什么。我们的工具可以精确可视化代码运行时内存、调用栈和对象的工作方式。',
    getStarted: '开始',
    exploreObjects: '探索对象',
    languageSupport: '支持 JS、Python、Java、C# 和 C',
    
    // Lesson names
    learningModules: '学习模块',
    lessonFunctions: '函数和堆栈',
    lessonConditionals: '条件语句',
    lessonLoopsArrays: '循环和数组',
    lessonObjects: '对象和引用',
    lessonClasses: '类',
    lessonRecursion: '递归',
    lessonClosures: '闭包',
    lessonAsyncAwait: '异步/等待',
    lessonDebugging: '调试',
    
    // Lesson descriptions
    lessonFunctionsDesc: '调用和作用域管理。',
    lessonConditionalsDesc: '使用If/Else进行决策。',
    lessonLoopsArraysDesc: '迭代和数组内存。',
    lessonObjectsDesc: '堆中的值与引用。',
    lessonClassesDesc: "实例、'new'和'this'。",
    lessonRecursionDesc: '可视化堆栈增长。',
    
    // Lesson page
    lessonNotFound: '找不到课程或不完整',
    step: '步骤',
    lesson: '课程',
    playground: '游戏场',
    restart: '重启',
    pause: '暂停',
    play: '播放',
    legend: '图例',
    howToUse: '如何使用这个可视化工具？',
    understandAreas: '了解每个区域代表什么。',
    callStackTitle: '调用栈',
    callStackDesc: '这是代码"记忆"其位置的地方。每个被调用的函数都会在这里创建一个新块。简单变量（数字、布尔值）住在这里。',
    heapMemoryTitle: '堆内存',
    heapMemoryDesc: '复杂数据住在这里：对象、数组和类。它们对于栈来说太大了，所以它们留在这里，并通过"引用"（不可见的箭头）访问。',
    controlsTitle: '控制',
    controlsDesc: '使用顶部的按钮暂停、跳过或更改动画速度。',
    explanation: '解释',
    start: '开始',
    
    // Exercise selection
    exercises: '练习',
    clickToSelect: '点击选择',
    
    // Difficulty
    beginner: '初级',
    intermediate: '中级',
    advanced: '高级',
    
    // Tabs
    editor: '编辑器',
    tests: '测试',
    
    // Buttons
    execute: '执行',
    executing: '执行中...',
    clear: '清除',
    hint: '提示',
    viewSolution: '查看解决方案',
    testCode: '测试代码',
    
    // Editor
    executionSpeed: '执行速度',
    variables: '变量',
    memory: '内存',
    executed: '已执行',
    executeToSeeSteps: '执行代码以查看步骤。',
    
    // Test results
    runToSeeResults: '运行以查看结果',
    allTestsPassed: '所有测试通过！',
    someTestsFailed: '某些测试失败',
    input: '输入',
    expected: '预期',
    received: '收到',
    error: '错误',    writeCodeFirst: '请先编写代码！',
    nextExercise: '下一个',    
    // Hints and solutions
    hintTitle: '提示',
    solutionTitle: '解决方案',
    
    // Stats
    completed: '已完成',
    score: '分数',
    attempts: '尝试次数',
    
    // Execution confirmation
    enableExecution: '启用执行？',
    codeWillRunInBrowser: '代码将在浏览器中运行。',
    yes: '是',
    no: '否',
    
    // Security messages
    codeBlocked: '代码被阻止',
    timeoutError: '超时！代码执行超过10秒。检查是否存在无限循环。',
    securityPattern: '出于安全考虑阻止代码：模式',
    useSimpleLogic: '不允许。仅使用简单的编程逻辑。',
    codeTooLong: '代码太长。限制：10,000个字符。',
    tooManyLoops: '检测到太多循环。',
    maxLoops: '最多允许：5个。',
    
    // Language names
    javascript: 'JavaScript',
    python: 'Python',
    c: 'C',
    csharp: 'C#',
    java: 'Java',
    
    // Errors
    noFunctionFound: '未找到函数。',
    useFunctionKeyword: "使用 'function' 声明您的函数。",
    useDefKeyword: "在Python中使用 'def' 声明您的函数。",
    syntaxError: '语法错误',
    pythonLoadError: '加载Python失败',
    failedToLoadPython: '加载Python解释器失败：',
    
    // Logs
    emptyLineSkipped: '跳过空行',
    assigned: '分配',
    to: '到',
    checked: '检查',
    startedLoop: '开始循环',
    returned: '返回',
    printed: '打印',
    
    // Compiled languages
    runningTests: '运行测试...',
    compiledLanguagesRunFullTests: '编译语言执行完整测试。',
  },
  
  'hi': {
    // Header
    challenges: 'चुनौतियाँ',
    jsOrPython: 'JavaScript या Python',
    progress: 'प्रगति',
    home: 'मुख्य',
    learn: 'सीखें',
    pro: 'Pro',
    
    // Hero section
    heroTitle1: 'अपने कोड को',
    heroTitle2: 'जीवंत होते देखें।',
    heroSubtitle: 'कल्पना करना बंद करें कि "हुड के नीचे" क्या होता है। हमारा टूल दिखाता है कि आपका कोड चलते समय मेमोरी, कॉल स्टैक और ऑब्जेक्ट्स कैसे काम करते हैं।',
    getStarted: 'शुरू करें',
    exploreObjects: 'ऑब्जेक्ट्स एक्सप्लोर करें',
    languageSupport: 'JS, Python, Java, C# और C के लिए समर्थन',
    
    // Lesson names
    learningModules: 'सीखने के मॉड्यूल',
    lessonFunctions: 'फंक्शन और स्टैक',
    lessonConditionals: 'कंडीशनल',
    lessonLoopsArrays: 'लूप्स और ऐरे',
    lessonObjects: 'ऑब्जेक्ट्स और Refs',
    lessonClasses: 'क्लासेस',
    lessonRecursion: 'रिकर्शन',
    lessonClosures: 'क्लोज़र्स',
    lessonAsyncAwait: 'Async/Await',
    lessonDebugging: 'डिबगिंग',
    
    // Lesson descriptions
    lessonFunctionsDesc: 'कॉल और स्कोप प्रबंधन।',
    lessonConditionalsDesc: 'If/Else के साथ निर्णय लेना।',
    lessonLoopsArraysDesc: 'पुनरावृत्ति और ऐरे मेमोरी।',
    lessonObjectsDesc: 'हीप में मूल्य बनाम संदर्भ।',
    lessonClassesDesc: "इंस्टेंस, 'new' और 'this'।",
    lessonRecursionDesc: 'स्टैक वृद्धि की कल्पना।',
    
    // Lesson page
    lessonNotFound: 'पाठ नहीं मिला या अपूर्ण',
    step: 'कदम',
    lesson: 'पाठ',
    playground: 'प्लेग्राउंड',
    restart: 'फिर से शुरू करें',
    pause: 'रोकें',
    play: 'चलाएं',
    legend: 'लेजेंड',
    howToUse: 'इस विज़ुअलाइज़र का उपयोग कैसे करें?',
    understandAreas: 'समझें कि प्रत्येक क्षेत्र क्या दर्शाता है।',
    callStackTitle: 'कॉल स्टैक (ढेर)',
    callStackDesc: 'यह वह जगह है जहां कोड "याद" रखता है कि वह कहां है। प्रत्येक कॉल किए गए फंक्शन यहां एक नया ब्लॉक बनाता है। साधारण चर (संख्याएं, बूलियन) यहां रहते हैं।',
    heapMemoryTitle: 'हीप मेमोरी',
    heapMemoryDesc: 'जटिल डेटा यहां रहता है: ऑब्जेक्ट्स, ऐरे और क्लासेस। वे स्टैक के लिए बहुत बड़े हैं, इसलिए वे यहां रहते हैं और "संदर्भ" (अदृश्य तीर) द्वारा एक्सेस किए जाते हैं।',
    controlsTitle: 'नियंत्रण',
    controlsDesc: 'एनिमेशन को रोकने, छोड़ने या गति बदलने के लिए शीर्ष पर बटन का उपयोग करें।',
    explanation: 'व्याख्या',
    start: 'शुरू करें',
    
    // Exercise selection
    exercises: 'अभ्यास',
    clickToSelect: 'चुनने के लिए क्लिक करें',
    
    // Difficulty
    beginner: 'शुरुआती',
    intermediate: 'मध्यवर्ती',
    advanced: 'उन्नत',
    
    // Tabs
    editor: 'संपादक',
    tests: 'परीक्षण',
    
    // Buttons
    execute: 'निष्पादित करें',
    executing: 'निष्पादित हो रहा है...',
    clear: 'साफ़ करें',
    hint: 'संकेत',
    viewSolution: 'समाधान देखें',
    testCode: 'कोड परीक्षण करें',
    
    // Editor
    executionSpeed: 'निष्पादन गति',
    variables: 'चर',
    memory: 'मेमोरी',
    executed: 'निष्पादित',
    executeToSeeSteps: 'चरण देखने के लिए कोड निष्पादित करें।',
    
    // Test results
    runToSeeResults: 'परिणाम देखने के लिए चलाएं',
    allTestsPassed: 'सभी परीक्षण पास हो गए!',
    someTestsFailed: 'कुछ परीक्षण विफल रहे',
    input: 'इनपुट',
    expected: 'अपेक्षित',
    received: 'प्राप्त',
    error: 'त्रुटि',
    writeCodeFirst: 'पहले अपना कोड लिखें!',
    nextExercise: 'अगला',
    
    // Hints and solutions
    hintTitle: 'संकेत',
    solutionTitle: 'समाधान',
    
    // Stats
    completed: 'पूर्ण',
    score: 'स्कोर',
    attempts: 'प्रयास',
    
    // Execution confirmation
    enableExecution: 'निष्पादन सक्षम करें?',
    codeWillRunInBrowser: 'कोड ब्राउज़र में चलेगा।',
    yes: 'हाँ',
    no: 'नहीं',
    
    // Security messages
    codeBlocked: 'कोड अवरुद्ध',
    timeoutError: 'समय समाप्त! कोड को 10 सेकंड से अधिक समय लगा। अनंत लूप की जाँच करें।',
    securityPattern: 'सुरक्षा के लिए कोड अवरुद्ध: पैटर्न',
    useSimpleLogic: 'अनुमति नहीं है। केवल सरल प्रोग्रामिंग तर्क का उपयोग करें।',
    codeTooLong: 'कोड बहुत लंबा है। सीमा: 10,000 वर्ण।',
    tooManyLoops: 'बहुत सारे लूप का पता चला।',
    maxLoops: 'अधिकतम अनुमति: 5।',
    
    // Language names
    javascript: 'JavaScript',
    python: 'Python',
    c: 'C',
    csharp: 'C#',
    java: 'Java',
    
    // Errors
    noFunctionFound: 'कोई फ़ंक्शन नहीं मिला।',
    useFunctionKeyword: "अपने फ़ंक्शन को घोषित करने के लिए 'function' का उपयोग करें।",
    useDefKeyword: "Python में अपने फ़ंक्शन को घोषित करने के लिए 'def' का उपयोग करें।",
    syntaxError: 'वाक्यविन्यास त्रुटि',
    pythonLoadError: 'Python लोड करने में विफल',
    failedToLoadPython: 'Python इंटरप्रेटर लोड करने में विफल:',
    
    // Logs
    emptyLineSkipped: 'खाली पंक्ति छोड़ी गई',
    assigned: 'आवंटित',
    to: 'को',
    checked: 'जाँचा',
    startedLoop: 'लूप शुरू किया',
    returned: 'वापस किया',
    printed: 'प्रिंट किया',
    
    // Compiled languages
    runningTests: 'परीक्षण चल रहे हैं...',
    compiledLanguagesRunFullTests: 'संकलित भाषाएँ पूर्ण परीक्षण निष्पादित करती हैं।',
  },
};

export const getTranslation = (lang: Language): Translations => {
  return translations[lang] || translations['en'];
};

export const getLanguageName = (lang: Language): string => {
  const names: Record<Language, string> = {
    'en': 'English',
    'pt-BR': 'Português (BR)',
    'es': 'Español',
    'zh': '中文',
    'hi': 'हिन्दी',
  };
  return names[lang];
};
