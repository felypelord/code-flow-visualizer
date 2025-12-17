export type Language = 'en' | 'pt-BR' | 'es' | 'zh' | 'hi';

export interface Translations {
  // Header
  challenges: string;
  jsOrPython: string;
  progress: string;
  
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
    error: '错误',
    
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
