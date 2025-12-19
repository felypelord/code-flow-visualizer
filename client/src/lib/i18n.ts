export type Language = 'en' | 'pt-BR' | 'es' | 'zh' | 'hi';

export interface Translations {
  // Header
  challenges: string;
  jsOrPython: string;
  progress: string;
  home: string;
  learn: string;
  pro: string;
  pricing: string;
  
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

  // Auth
  signIn: string;
  createAccount: string;
  signInDescription: string;
  createAccountDescription: string;
  emailLabel: string;
  emailPlaceholder: string;
  passwordLabel: string;
  passwordPlaceholder: string;
  signInButton: string;
  createAccountButton: string;
  toggleMode: string;
  toggleModeLogin: string;
  emailRequired: string;
  passwordRequired: string;
  accountCreatedSuccess: string;
  loginSuccess: string;
  invalidEmail: string;
  passwordTooWeak: string;
  logOut: string;
  hello: string;
  emailHint: string;
  passwordHint: string;
  securityNote: string;

  // Pro features
  proRequired: string;
  aiInspectorLimit: string;
  aiInspectorLimitReached: string;
  profilerLimit: string;
  profilerLocked: string;
  freeAnalysesUsed: string;
  freeRunsUsed: string;
  freeLeft: string;
  upgradeToPro: string;
  proFeature: string;
  variableInspectorPro: string;
  aiCodeInspector: string;
  intelligentAnalysis: string;
  aiCodeInspectorTitle: string;
  aiCodeInspectorDesc: string;
  yourCode: string;
  analyzing: string;
  analyze: string;
  pasteCodeHere: string;
  inspectorFeatures: string;
  optimizationSuggestions: string;
  potentialIssueWarnings: string;
  algorithmExplanations: string;
  bestPracticesTips: string;
  analysisComplete: string;
  noSuggestions: string;
  profilerComplete: string;
  profilerError: string;
  average: string;
  min: string;
  max: string;
  profiler: string;
  executions: string;
  runProfiler: string;
  
  // Pricing & Pro pages
  pricingPlansTitle: string;
  pricingPlansSubtitle: string;
  manageSubscription: string;
  viewPricing: string;
  proLearningTitle: string;
  proLearningSubtitle: string;
  premiumBadge: string;
  premiumHeadline: string;
  premiumDescription: string;
  proTracksBadge: string;
  proTracksSubtitle: string;
  proChallengesBadge: string;
  proChallengesSubtitle: string;
  proMiniDemosSubtitle: string;
  billingTitle: string;
  billingDescription: string;
  openBillingPortal: string;
  downloadReceipts: string;
  proRoadmap1Title: string;
  proRoadmap1Eta: string;
  proRoadmap1Status: string;
  proRoadmap2Title: string;
  proRoadmap2Eta: string;
  proRoadmap2Status: string;
  proRoadmap3Title: string;
  proRoadmap3Eta: string;
  proRoadmap3Status: string;
  proBenefit1: string;
  proBenefit2: string;
  proBenefit3: string;
  proBenefit4: string;
  proTrackBeginnerTitle: string;
  proTrackBeginner1: string;
  proTrackBeginner2: string;
  proTrackBeginner3: string;
  proTrackBeginner4: string;
  proTrackBeginner5: string;
  proTrackBeginner6: string;
  proTrackIntermediateTitle: string;
  proTrackIntermediate1: string;
  proTrackIntermediate2: string;
  proTrackIntermediate3: string;
  proTrackIntermediate4: string;
  proTrackIntermediate5: string;
  proTrackIntermediate6: string;
  proTrackAdvancedTitle: string;
  proTrackAdvanced1: string;
  proTrackAdvanced2: string;
  proTrackAdvanced3: string;
  proTrackAdvanced4: string;
  proTrackAdvanced5: string;
  proTrackAdvanced6: string;
  proFeatureDebuggerTitle: string;
  proFeatureDebuggerDesc: string;
  proFeatureDebuggerB1: string;
  proFeatureDebuggerB2: string;
  proFeatureAnalyzerTitle: string;
  proFeatureAnalyzerDesc: string;
  proFeatureAnalyzerB1: string;
  proFeatureAnalyzerB2: string;
  proFeatureStructuresTitle: string;
  proFeatureStructuresDesc: string;
  proFeatureStructuresB1: string;
  proFeatureStructuresB2: string;
  proFeatureAiTitle: string;
  proFeatureAiDesc: string;
  proFeatureAiB1: string;
  proFeatureAiB2: string;
  proFeatureSnapshotsTitle: string;
  proFeatureSnapshotsDesc: string;
  proFeatureSnapshotsB1: string;
  proFeatureSnapshotsB2: string;
  proFeatureDbTitle: string;
  proFeatureDbDesc: string;
  proFeatureDbB1: string;
  proFeatureDbB2: string;
  proMiniDemosBadge: string;
  proMiniDemosNote: string;
  proInspectorAnalyze: string;
  proInspectorPlaceholder: string;
  proInspectorInvalidJson: string;
  proDebuggerLoading: string;
  proDebuggerRequiresBadge: string;
  proDebuggerRequiresText: string;
  proPlaygroundTitle: string;
  proPlaygroundSubtitle: string;
  proPlaygroundIdea1: string;
  proPlaygroundIdea2: string;
  proPlaygroundIdea3: string;
  proPlaygroundCopy: string;
  proPlaygroundCopied: string;
  proPlaygroundCopyFailed: string;
  proPlaygroundClear: string;
  proPlaygroundPlaceholder: string;
  vipSignupTitle: string;
  vipSignupDesc: string;
  firstName: string;
  lastName: string;
  country: string;
  dateOfBirth: string;
  vipContinueToEmail: string;
  vipCodeSent: string;
  vipCheckEmail: string;
  codeSentTo: string;
  back: string;
  vipProceedToPayment: string;
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
    pricing: 'Pricing',
    
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

    // Auth
    signIn: 'Sign In',
    createAccount: 'Create Account',
    signInDescription: 'Sign in with your email to access your account',
    createAccountDescription: 'Create a new account with your email address',
    emailLabel: 'Email Address',
    emailPlaceholder: 'your@email.com',
    passwordLabel: 'Password',
    passwordPlaceholder: 'At least 10 characters (letters + numbers)',
    signInButton: 'Sign In',
    createAccountButton: 'Create Account',
    toggleMode: "Don't have an account?",
    toggleModeLogin: 'Already have an account?',
    emailRequired: 'Please enter a valid email',
    passwordRequired: 'Password must be at least 10 characters with letters and numbers',
    accountCreatedSuccess: 'Account created! Signing you in...',
    loginSuccess: 'Welcome back!',
    invalidEmail: 'Invalid email address',
    passwordTooWeak: 'Password too weak',
    logOut: 'Sign Out',
    hello: 'Hello',
    emailHint: 'Use your email address',
    passwordHint: '10+ chars, mix letters & numbers',
    securityNote: 'Your data is encrypted. We never share your information.',

    // Pro features
    proRequired: 'Pro Required',
    aiInspectorLimit: "You've used your free analysis. Upgrade to Pro for unlimited access.",
    aiInspectorLimitReached: "You've used your free analysis. Upgrade to Pro for unlimited AI-powered code analysis.",
    profilerLimit: "You've used your free profiler run. Upgrade to Pro for unlimited access.",
    profilerLocked: 'Profiler Locked',
    freeAnalysesUsed: 'free analyses used',
    freeRunsUsed: 'free runs used',
    freeLeft: 'free left',
    upgradeToPro: 'Upgrade to Pro',
    proFeature: 'Pro Feature',
    variableInspectorPro: 'Variable Inspector is available for Pro users only.',
    aiCodeInspector: 'AI Code Inspector',
    intelligentAnalysis: 'Intelligent Analysis',
    aiCodeInspectorTitle: 'AI Code Inspector',
    aiCodeInspectorDesc: 'Automatic analysis with optimization suggestions, warnings, and algorithm explanations.',
    yourCode: 'Your Code',
    analyzing: 'Analyzing...',
    analyze: 'Analyze',
    pasteCodeHere: 'Paste your Python code here...',
    inspectorFeatures: 'The Inspector analyzes your code and provides:',
    optimizationSuggestions: 'Optimization suggestions',
    potentialIssueWarnings: 'Warnings about potential issues',
    algorithmExplanations: 'Algorithm explanations',
    bestPracticesTips: 'Best practices tips',
    analysisComplete: 'Analysis Complete',
    noSuggestions: 'No suggestions found. Code looks good!',
    profilerComplete: 'Profiler Complete',
    profilerError: 'Profiler Error',
    average: 'Average',
    min: 'Min',
    max: 'Max',
    profiler: 'Profiler',
    executions: 'executions',
    runProfiler: 'Run Profiler',
    
    // Pricing & Pro pages
    pricingPlansTitle: 'Subscription Plans',
    pricingPlansSubtitle: 'Choose the perfect plan for your coding journey',
    manageSubscription: 'Manage subscription',
    viewPricing: 'View Pricing',
    proLearningTitle: 'Pro Learning Tools',
    proLearningSubtitle: 'Advanced debugger, AI inspector, and pro exercises to level up fast.',
    premiumBadge: 'Premium Features',
    premiumHeadline: 'Professional Tools for Developers',
    premiumDescription: 'Unlock a complete suite of advanced debugging, performance analysis, and real-time visualization tools.',
    proTracksBadge: 'Pro Exercises (from beginner to advanced)',
    proTracksSubtitle: 'Progressive tracks with exclusive challenges.',
    proChallengesBadge: 'Pro Challenges - Advanced Algorithms',
    proChallengesSubtitle: 'Exercises with full solutions and an integrated debugger',
    proMiniDemosSubtitle: 'Quick preview of Pro labs.',
    billingTitle: 'Billing and payment method',
    billingDescription: 'Manage invoices, update card, and export receipts directly in the secure portal.',
    openBillingPortal: 'Open billing portal',
    downloadReceipts: 'Where do I download receipts?',
    proRoadmap1Title: 'Profiler with timeline and flamegraph',
    proRoadmap1Eta: 'Jan/2026',
    proRoadmap1Status: 'In progress',
    proRoadmap2Title: 'Conditional breakpoints with variable watch',
    proRoadmap2Eta: 'Jan/2026',
    proRoadmap2Status: 'In progress',
    proRoadmap3Title: 'Inspector for large objects + JSON export',
    proRoadmap3Eta: 'Feb/2026',
    proRoadmap3Status: 'Planned',
    proBenefit1: 'Unlimited debugger runs',
    proBenefit2: 'Hints and solutions unlocked in exercises',
    proBenefit3: 'Priority support and voteable roadmap',
    proBenefit4: 'Continuous Pro updates delivered',
    proTrackBeginnerTitle: 'Beginner',
    proTrackBeginner1: 'Hello World with user input',
    proTrackBeginner2: 'Variables, types, and console.log',
    proTrackBeginner3: 'Basic conditionals (if/else)',
    proTrackBeginner4: 'Loops over small arrays',
    proTrackBeginner5: 'Pure functions and parameters',
    proTrackBeginner6: 'Simple step-by-step debugging',
    proTrackIntermediateTitle: 'Intermediate',
    proTrackIntermediate1: 'Arrays + map/filter/reduce',
    proTrackIntermediate2: 'Object and JSON manipulation',
    proTrackIntermediate3: 'Modules and code organization',
    proTrackIntermediate4: 'Quick tests with asserts',
    proTrackIntermediate5: 'Promises and async/await',
    proTrackIntermediate6: 'Profiler: measure 3 implementations',
    proTrackAdvancedTitle: 'Advanced',
    proTrackAdvanced1: 'Data structures (stack/queue)',
    proTrackAdvanced2: 'Optimized search and sorting',
    proTrackAdvanced3: 'APIs with retry and backoff',
    proTrackAdvanced4: 'Caching and invalidation',
    proTrackAdvanced5: 'Debugging async race conditions',
    proTrackAdvanced6: 'Fake microservice end-to-end',
    proFeatureDebuggerTitle: 'Pro Debugger',
    proFeatureDebuggerDesc: 'Advanced visual debugger with breakpoints, watch variables, and detailed stack traces',
    proFeatureDebuggerB1: 'Step-by-step execution',
    proFeatureDebuggerB2: 'Variable inspection',
    proFeatureAnalyzerTitle: 'Performance Analyzer',
    proFeatureAnalyzerDesc: 'Analyze runtime, memory usage, and optimize your code',
    proFeatureAnalyzerB1: 'Execution timeline',
    proFeatureAnalyzerB2: 'Memory usage',
    proFeatureStructuresTitle: 'Structure Visualization',
    proFeatureStructuresDesc: 'See arrays and objects in real time with an interactive diagram',
    proFeatureStructuresB1: 'Complex structures',
    proFeatureStructuresB2: 'Interactive graphs',
    proFeatureAiTitle: 'AI Assistant',
    proFeatureAiDesc: 'Automatic optimization suggestions and error explanations',
    proFeatureAiB1: 'Automatic analysis',
    proFeatureAiB2: 'Real-time suggestions',
    proFeatureSnapshotsTitle: 'Execution Snapshots',
    proFeatureSnapshotsDesc: 'Capture and share full execution states',
    proFeatureSnapshotsB1: 'Capture and replay',
    proFeatureSnapshotsB2: 'Sharing',
    proFeatureDbTitle: 'Database Inspector',
    proFeatureDbDesc: 'Inspect queries, view indexes, and optimize performance',
    proFeatureDbB1: 'Query analysis',
    proFeatureDbB2: 'Optimizations',
    proMiniDemosBadge: 'Mini demos',
    proMiniDemosNote: 'Available in Pro Labs (live demo below).',
    proInspectorAnalyze: 'Analyze',
    proInspectorPlaceholder: 'Paste JSON and click Analyze.',
    proInspectorInvalidJson: 'Invalid JSON',
    proDebuggerLoading: 'Loading debugger...',
    proDebuggerRequiresBadge: 'Pro plan required',
    proDebuggerRequiresText: 'Subscribe to Pro to access the full real-time debugger.',
    proPlaygroundTitle: 'VIP Playground',
    proPlaygroundSubtitle: 'Test snippets, sketch solutions, and take notes without touching production code.',
    proPlaygroundIdea1: 'Warm up with a 5–10 minute kata',
    proPlaygroundIdea2: 'Design data structures before coding',
    proPlaygroundIdea3: 'Paste logs and annotate findings',
    proPlaygroundCopy: 'Copy scratchpad',
    proPlaygroundCopied: 'Scratchpad copied',
    proPlaygroundCopyFailed: 'Could not copy scratchpad',
    proPlaygroundClear: 'Clear scratchpad',
    proPlaygroundPlaceholder: 'Quick notes, pseudo-code, checklists, or test snippets go here...',
    vipSignupTitle: 'Create VIP Account (Pro)',
    vipSignupDesc: 'First verify your email. Then you will complete payment with Stripe.',
    firstName: 'First name',
    lastName: 'Last name',
    country: 'Country',
    dateOfBirth: 'Date of birth',
    vipContinueToEmail: 'Proceed to email confirmation',
    vipCodeSent: 'Code sent',
    vipCheckEmail: 'Check your email and enter the code to continue.',
    codeSentTo: 'Code sent to',
    back: 'Back',
    vipProceedToPayment: 'Proceed to payment',
  },
  
  'pt-BR': {
    // Header
    challenges: 'Desafios',
    jsOrPython: 'JavaScript ou Python',
    progress: 'Progresso',
    home: 'Início',
    learn: 'Aprender',
    pro: 'Pro',
    pricing: 'Preços',
    
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

    // Auth
    signIn: 'Entrar',
    createAccount: 'Criar Conta',
    signInDescription: 'Entre com seu email para acessar sua conta',
    createAccountDescription: 'Crie uma nova conta com seu endereço de email',
    emailLabel: 'Endereço de Email',
    emailPlaceholder: 'seu@email.com',
    passwordLabel: 'Senha',
    passwordPlaceholder: 'No mínimo 10 caracteres (letras + números)',
    signInButton: 'Entrar',
    createAccountButton: 'Criar Conta',
    toggleMode: 'Precisa de uma conta?',
    toggleModeLogin: 'Já tem uma conta?',
    emailRequired: 'Por favor, digite um email válido',
    passwordRequired: 'Senha deve ter no mínimo 10 caracteres com letras e números',
    accountCreatedSuccess: 'Conta criada! Entrando...',
    loginSuccess: 'Bem-vindo de volta!',
    invalidEmail: 'Endereço de email inválido',
    passwordTooWeak: 'Senha fraca',
    logOut: 'Sair',
    hello: 'Olá',
    emailHint: 'Use seu endereço de email',
    passwordHint: '10+ caracteres, misture letras e números',
    securityNote: 'Seus dados são criptografados. Nunca compartilhamos suas informações.',

    // Pro features
    proRequired: 'Pro Necessário',
    aiInspectorLimit: 'Você usou sua análise grátis. Faça upgrade para Pro para acesso ilimitado.',
    aiInspectorLimitReached: 'Você usou sua análise grátis. Faça upgrade para Pro para análise de código ilimitada com IA.',
    profilerLimit: 'Você usou sua execução grátis do profiler. Faça upgrade para Pro para acesso ilimitado.',
    profilerLocked: 'Profiler Bloqueado',
    freeAnalysesUsed: 'análises grátis usadas',
    freeRunsUsed: 'execuções grátis usadas',
    freeLeft: 'grátis restantes',
    upgradeToPro: 'Fazer Upgrade para Pro',
    proFeature: 'Recurso Pro',
    variableInspectorPro: 'Inspetor de Variáveis disponível apenas para usuários Pro.',
    aiCodeInspector: 'Inspetor de Código IA',
    intelligentAnalysis: 'Análise Inteligente',
    aiCodeInspectorTitle: 'Inspetor de Código IA',
    aiCodeInspectorDesc: 'Análise automática com sugestões de otimização, avisos e explicações de algoritmos.',
    yourCode: 'Seu Código',
    analyzing: 'Analisando...',
    analyze: 'Analisar',
    pasteCodeHere: 'Cole seu código Python aqui...',
    inspectorFeatures: 'O Inspector analisa seu código e fornece:',
    optimizationSuggestions: 'Sugestões de otimização',
    potentialIssueWarnings: 'Alertas de potenciais problemas',
    algorithmExplanations: 'Explicações de algoritmos',
    bestPracticesTips: 'Dicas de boas práticas',
    analysisComplete: 'Análise Completa',
    noSuggestions: 'Nenhuma sugestão encontrada. Código parece bom!',
    profilerComplete: 'Profiler Concluído',
    profilerError: 'Erro no Profiler',
    average: 'Média',
    min: 'Mín',
    max: 'Máx',
    profiler: 'Profiler',
    executions: 'execuções',
    runProfiler: 'Rodar Profiler',
    
    // Pricing & Pro pages
    pricingPlansTitle: 'Planos de Assinatura',
    pricingPlansSubtitle: 'Escolha o plano perfeito para sua jornada de programação',
    manageSubscription: 'Gerenciar assinatura',
    viewPricing: 'Ver Preços',
    proLearningTitle: 'Ferramentas Pro de Aprendizado',
    proLearningSubtitle: 'Debugger avançado, inspector de código e exercícios profissionais.',
    premiumBadge: 'Recursos Premium',
    premiumHeadline: 'Ferramentas Profissionais para Desenvolvedores',
    premiumDescription: 'Desbloqueie um conjunto completo de ferramentas avançadas de depuração, análise de performance e visualização em tempo real.',
    proTracksBadge: 'Exercícios Pro (do básico ao avançado)',
    proTracksSubtitle: 'Trilhas progressivas com desafios exclusivos.',
    proChallengesBadge: 'Desafios Pro - Algoritmos Avançados',
    proChallengesSubtitle: 'Exercícios com soluções completas e debugger integrado',
    proMiniDemosSubtitle: 'Visão rápida dos laboratórios Pro.',
    billingTitle: 'Faturas e método de pagamento',
    billingDescription: 'Gerencie faturas, atualize cartão e exporte recibos diretamente no portal seguro.',
    openBillingPortal: 'Abrir portal de cobrança',
    downloadReceipts: 'Onde baixo recibos?',
    proRoadmap1Title: 'Profiler com timeline e flamegraph',
    proRoadmap1Eta: 'Jan/2026',
    proRoadmap1Status: 'Em construção',
    proRoadmap2Title: 'Breakpoints condicionais com watch de variáveis',
    proRoadmap2Eta: 'Jan/2026',
    proRoadmap2Status: 'Em construção',
    proRoadmap3Title: 'Inspector para objetos grandes + export JSON',
    proRoadmap3Eta: 'Fev/2026',
    proRoadmap3Status: 'Planejado',
    proBenefit1: 'Execuções ilimitadas no debugger',
    proBenefit2: 'Dicas e soluções desbloqueadas nos exercícios',
    proBenefit3: 'Suporte prioritário e roadmap votável',
    proBenefit4: 'Atualizações Pro entregues continuamente',
    proTrackBeginnerTitle: 'Iniciante',
    proTrackBeginner1: 'Hello World com entrada do usuário',
    proTrackBeginner2: 'Variáveis, tipos e console.log',
    proTrackBeginner3: 'Condicionais básicas (if/else)',
    proTrackBeginner4: 'Loops sobre arrays pequenos',
    proTrackBeginner5: 'Funções puras e parâmetros',
    proTrackBeginner6: 'Depuração passo a passo simples',
    proTrackIntermediateTitle: 'Intermediário',
    proTrackIntermediate1: 'Arrays + map/filter/reduce',
    proTrackIntermediate2: 'Manipulação de objetos e JSON',
    proTrackIntermediate3: 'Módulos e organização de código',
    proTrackIntermediate4: 'Testes rápidos com asserts',
    proTrackIntermediate5: 'Promises e async/await',
    proTrackIntermediate6: 'Profiler: medir 3 implementações',
    proTrackAdvancedTitle: 'Avançado',
    proTrackAdvanced1: 'Estruturas de dados (pilha/fila)',
    proTrackAdvanced2: 'Busca e ordenação otimizadas',
    proTrackAdvanced3: 'APIs com retry e backoff',
    proTrackAdvanced4: 'Caching + invalidação',
    proTrackAdvanced5: 'Debug de corrida assíncrona',
    proTrackAdvanced6: 'Micro-serviço fake end-to-end',
    proFeatureDebuggerTitle: 'Pro Debugger',
    proFeatureDebuggerDesc: 'Depurador visual avançado com breakpoints, watch variables e stack traces detalhados',
    proFeatureDebuggerB1: 'Execução passo a passo',
    proFeatureDebuggerB2: 'Inspeção de variáveis',
    proFeatureAnalyzerTitle: 'Performance Analyzer',
    proFeatureAnalyzerDesc: 'Analise tempo de execução, uso de memória e otimize seu código',
    proFeatureAnalyzerB1: 'Timeline de execução',
    proFeatureAnalyzerB2: 'Uso de memória',
    proFeatureStructuresTitle: 'Visualização de Estruturas',
    proFeatureStructuresDesc: 'Veja arrays e objetos em tempo real com diagrama interativo',
    proFeatureStructuresB1: 'Estruturas complexas',
    proFeatureStructuresB2: 'Gráficos interativos',
    proFeatureAiTitle: 'IA Assistant',
    proFeatureAiDesc: 'Sugestões automáticas de otimização e explicações de erros',
    proFeatureAiB1: 'Análise automática',
    proFeatureAiB2: 'Sugestões em tempo real',
    proFeatureSnapshotsTitle: 'Snapshots de Execução',
    proFeatureSnapshotsDesc: 'Capture e compartilhe estados de execução completos',
    proFeatureSnapshotsB1: 'Captura e replay',
    proFeatureSnapshotsB2: 'Compartilhamento',
    proFeatureDbTitle: 'Database Inspector',
    proFeatureDbDesc: 'Inspecione queries, visualize índices e otimize performance',
    proFeatureDbB1: 'Análise de queries',
    proFeatureDbB2: 'Otimizações',
    proMiniDemosBadge: 'Mini demos',
    proMiniDemosNote: 'Disponível no Pro Labs (demo ao vivo abaixo).',
    proInspectorAnalyze: 'Analisar',
    proInspectorPlaceholder: 'Cole JSON e clique em Analisar.',
    proInspectorInvalidJson: 'JSON inválido',
    proDebuggerLoading: 'Carregando debugger...',
    proDebuggerRequiresBadge: 'Exige plano Pro',
    proDebuggerRequiresText: 'Assine o Pro para acessar o debugger completo em tempo real.',
    proPlaygroundTitle: 'Parquinho VIP',
    proPlaygroundSubtitle: 'Teste trechos, rascunhe soluções e faça notas sem mexer no código principal.',
    proPlaygroundIdea1: 'Aqueça com um kata de 5–10 minutos',
    proPlaygroundIdea2: 'Desenhe estruturas de dados antes de codar',
    proPlaygroundIdea3: 'Cole logs e anote descobertas',
    proPlaygroundCopy: 'Copiar rascunho',
    proPlaygroundCopied: 'Rascunho copiado',
    proPlaygroundCopyFailed: 'Não foi possível copiar o rascunho',
    proPlaygroundClear: 'Limpar rascunho',
    proPlaygroundPlaceholder: 'Notas rápidas, pseudo-código, checklists ou snippets de teste ficam aqui...',
    vipSignupTitle: 'Criar conta VIP (Pro)',
    vipSignupDesc: 'Primeiro verificamos seu email. Depois você conclui o pagamento com Stripe.',
    firstName: 'Nome',
    lastName: 'Sobrenome',
    country: 'País',
    dateOfBirth: 'Data de nascimento',
    vipContinueToEmail: 'Seguir para confirmação de e-mail',
    vipCodeSent: 'Código enviado',
    vipCheckEmail: 'Verifique seu email e digite o código para continuar.',
    codeSentTo: 'Código enviado para',
    back: 'Voltar',
    vipProceedToPayment: 'Seguir para pagamento',
  },
  
  'es': {
    // Header
    challenges: 'Desafíos',
    jsOrPython: 'JavaScript o Python',
    progress: 'Progreso',
    home: 'Inicio',
    learn: 'Aprender',
    pro: 'Pro',
    pricing: 'Precios',
    
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

    // Auth
    signIn: 'Iniciar Sesión',
    createAccount: 'Crear Cuenta',
    signInDescription: 'Inicia sesión con tu correo electrónico para acceder a tu cuenta',
    createAccountDescription: 'Crea una nueva cuenta con tu dirección de correo electrónico',
    emailLabel: 'Dirección de Correo Electrónico',
    emailPlaceholder: 'tu@correo.com',
    passwordLabel: 'Contraseña',
    passwordPlaceholder: 'Al menos 10 caracteres (letras + números)',
    signInButton: 'Iniciar Sesión',
    createAccountButton: 'Crear Cuenta',
    toggleMode: '¿No tienes cuenta?',
    toggleModeLogin: '¿Ya tienes cuenta?',
    emailRequired: 'Por favor, ingresa un correo electrónico válido',
    passwordRequired: 'La contraseña debe tener al menos 10 caracteres con letras y números',
    accountCreatedSuccess: '¡Cuenta creada! Iniciando sesión...',
    loginSuccess: '¡Bienvenido de vuelta!',
    invalidEmail: 'Dirección de correo electrónico no válida',
    passwordTooWeak: 'Contraseña débil',
    logOut: 'Cerrar Sesión',
    hello: 'Hola',
    emailHint: 'Usa tu dirección de correo electrónico',
    passwordHint: '10+ caracteres, mezcla de letras y números',
    securityNote: 'Tus datos están encriptados. Nunca compartimos tu información.',

    // Pro features (same as English for now)
    proRequired: 'Pro Requerido',
    aiInspectorLimit: 'Has usado tu análisis gratuito. Actualiza a Pro para acceso ilimitado.',
    aiInspectorLimitReached: 'Has usado tu análisis gratuito. Actualiza a Pro para análisis de código ilimitado con IA.',
    profilerLimit: 'Has usado tu ejecución gratuita del profiler. Actualiza a Pro para acceso ilimitado.',
    profilerLocked: 'Profiler Bloqueado',
    freeAnalysesUsed: 'análisis gratuitos usados',
    freeRunsUsed: 'ejecuciones gratuitas usadas',
    freeLeft: 'gratis restantes',
    upgradeToPro: 'Actualizar a Pro',
    proFeature: 'Característica Pro',
    variableInspectorPro: 'Inspector de Variables disponible solo para usuarios Pro.',
    aiCodeInspector: 'Inspector de Código IA',
    intelligentAnalysis: 'Análisis Inteligente',
    aiCodeInspectorTitle: 'Inspector de Código IA',
    aiCodeInspectorDesc: 'Análisis automático con sugerencias de optimización, advertencias y explicaciones de algoritmos.',
    yourCode: 'Tu Código',
    analyzing: 'Analizando...',
    analyze: 'Analizar',
    pasteCodeHere: 'Pega tu código Python aquí...',
    inspectorFeatures: 'El Inspector analiza tu código y proporciona:',
    optimizationSuggestions: 'Sugerencias de optimización',
    potentialIssueWarnings: 'Advertencias sobre problemas potenciales',
    algorithmExplanations: 'Explicaciones de algoritmos',
    bestPracticesTips: 'Consejos de mejores prácticas',
    analysisComplete: 'Análisis Completo',
    noSuggestions: '¡No se encontraron sugerencias. El código se ve bien!',
    profilerComplete: 'Profiler Completo',
    profilerError: 'Error del Profiler',
    average: 'Promedio',
    min: 'Mín',
    max: 'Máx',
    profiler: 'Profiler',
    executions: 'ejecuciones',
    runProfiler: 'Ejecutar Profiler',

    // Pricing & Pro pages
    pricingPlansTitle: 'Planes de Suscripción',
    pricingPlansSubtitle: 'Elige el plan perfecto para tu aprendizaje de programación',
    manageSubscription: 'Administrar suscripción',
    viewPricing: 'Ver Precios',
    proLearningTitle: 'Herramientas Pro de Aprendizaje',
    proLearningSubtitle: 'Depurador avanzado, inspector de código y ejercicios profesionales.',
    premiumBadge: 'Funciones Premium',
    premiumHeadline: 'Herramientas Profesionales para Desarrolladores',
    premiumDescription: 'Desbloquea un conjunto completo de herramientas avanzadas de depuración, análisis de rendimiento y visualización en tiempo real.',
    proTracksBadge: 'Ejercicios Pro (de básico a avanzado)',
    proTracksSubtitle: 'Rutas progresivas con desafíos exclusivos.',
    proChallengesBadge: 'Desafíos Pro - Algoritmos Avanzados',
    proChallengesSubtitle: 'Ejercicios con soluciones completas y depurador integrado',
    proMiniDemosSubtitle: 'Vista rápida de los laboratorios Pro.',
    billingTitle: 'Facturas y método de pago',
    billingDescription: 'Gestiona facturas, actualiza tarjeta y exporta recibos directamente en el portal seguro.',
    openBillingPortal: 'Abrir portal de facturación',
    downloadReceipts: '¿Dónde descargo los recibos?',
    proRoadmap1Title: 'Profiler con timeline y flamegraph',
    proRoadmap1Eta: 'Jan/2026',
    proRoadmap1Status: 'En progreso',
    proRoadmap2Title: 'Breakpoints condicionales con watch de variables',
    proRoadmap2Eta: 'Jan/2026',
    proRoadmap2Status: 'En progreso',
    proRoadmap3Title: 'Inspector para objetos grandes + export JSON',
    proRoadmap3Eta: 'Feb/2026',
    proRoadmap3Status: 'Planificado',
    proBenefit1: 'Ejecuciones ilimitadas en el depurador',
    proBenefit2: 'Pistas y soluciones desbloqueadas en ejercicios',
    proBenefit3: 'Soporte prioritario y roadmap con votos',
    proBenefit4: 'Actualizaciones Pro entregadas continuamente',
    proTrackBeginnerTitle: 'Principiante',
    proTrackBeginner1: 'Hello World con entrada de usuario',
    proTrackBeginner2: 'Variables, tipos y console.log',
    proTrackBeginner3: 'Condicionales básicas (if/else)',
    proTrackBeginner4: 'Bucles sobre arrays pequeños',
    proTrackBeginner5: 'Funciones puras y parámetros',
    proTrackBeginner6: 'Depuración paso a paso simple',
    proTrackIntermediateTitle: 'Intermedio',
    proTrackIntermediate1: 'Arrays + map/filter/reduce',
    proTrackIntermediate2: 'Manipulación de objetos y JSON',
    proTrackIntermediate3: 'Módulos y organización de código',
    proTrackIntermediate4: 'Tests rápidos con asserts',
    proTrackIntermediate5: 'Promises y async/await',
    proTrackIntermediate6: 'Profiler: medir 3 implementaciones',
    proTrackAdvancedTitle: 'Avanzado',
    proTrackAdvanced1: 'Estructuras de datos (pila/cola)',
    proTrackAdvanced2: 'Búsqueda y ordenación optimizadas',
    proTrackAdvanced3: 'APIs con retry y backoff',
    proTrackAdvanced4: 'Caching e invalidación',
    proTrackAdvanced5: 'Depurar condiciones de carrera async',
    proTrackAdvanced6: 'Microservicio falso end-to-end',
    proFeatureDebuggerTitle: 'Pro Debugger',
    proFeatureDebuggerDesc: 'Depurador visual avanzado con breakpoints, watch variables y stack traces detallados',
    proFeatureDebuggerB1: 'Ejecución paso a paso',
    proFeatureDebuggerB2: 'Inspección de variables',
    proFeatureAnalyzerTitle: 'Performance Analyzer',
    proFeatureAnalyzerDesc: 'Analiza tiempo de ejecución, uso de memoria y optimiza tu código',
    proFeatureAnalyzerB1: 'Timeline de ejecución',
    proFeatureAnalyzerB2: 'Uso de memoria',
    proFeatureStructuresTitle: 'Visualización de Estructuras',
    proFeatureStructuresDesc: 'Ve arrays y objetos en tiempo real con un diagrama interactivo',
    proFeatureStructuresB1: 'Estructuras complejas',
    proFeatureStructuresB2: 'Gráficos interactivos',
    proFeatureAiTitle: 'IA Assistant',
    proFeatureAiDesc: 'Sugerencias automáticas de optimización y explicaciones de errores',
    proFeatureAiB1: 'Análisis automático',
    proFeatureAiB2: 'Sugerencias en tiempo real',
    proFeatureSnapshotsTitle: 'Snapshots de Ejecución',
    proFeatureSnapshotsDesc: 'Captura y comparte estados de ejecución completos',
    proFeatureSnapshotsB1: 'Captura y replay',
    proFeatureSnapshotsB2: 'Compartir',
    proFeatureDbTitle: 'Database Inspector',
    proFeatureDbDesc: 'Inspecciona queries, visualiza índices y optimiza performance',
    proFeatureDbB1: 'Análisis de queries',
    proFeatureDbB2: 'Optimizaciones',
    proMiniDemosBadge: 'Mini demos',
    proMiniDemosNote: 'Disponible en Pro Labs (demo en vivo abajo).',
    proInspectorAnalyze: 'Analizar',
    proInspectorPlaceholder: 'Pega JSON y haz clic en Analizar.',
    proInspectorInvalidJson: 'JSON inválido',
    proDebuggerLoading: 'Cargando debugger...',
    proDebuggerRequiresBadge: 'Requiere plan Pro',
    proDebuggerRequiresText: 'Suscríbete a Pro para acceder al debugger en tiempo real.',
    proPlaygroundTitle: 'Playground VIP',
    proPlaygroundSubtitle: 'Prueba fragmentos, bosqueja soluciones y toma notas sin tocar el código principal.',
    proPlaygroundIdea1: 'Calienta con un kata de 5–10 minutos',
    proPlaygroundIdea2: 'Diseña estructuras de datos antes de codificar',
    proPlaygroundIdea3: 'Pega logs y anota hallazgos',
    proPlaygroundCopy: 'Copiar bloc de notas',
    proPlaygroundCopied: 'Bloc copiado',
    proPlaygroundCopyFailed: 'No se pudo copiar el bloc',
    proPlaygroundClear: 'Limpiar bloc',
    proPlaygroundPlaceholder: 'Notas rápidas, pseudo-código, checklists o snippets de prueba van aquí...',
    vipSignupTitle: 'Crear cuenta VIP (Pro)',
    vipSignupDesc: 'Primero verificamos tu email. Luego completas el pago con Stripe.',
    firstName: 'Nombre',
    lastName: 'Apellido',
    country: 'País',
    dateOfBirth: 'Fecha de nacimiento',
    vipContinueToEmail: 'Continuar a confirmación de email',
    vipCodeSent: 'Código enviado',
    vipCheckEmail: 'Revisa tu email y escribe el código para continuar.',
    codeSentTo: 'Código enviado a',
    back: 'Atrás',
    vipProceedToPayment: 'Continuar al pago',
  },
  
  'zh': {
    // Header
    challenges: '挑战',
    jsOrPython: 'JavaScript 或 Python',
    progress: '进度',
    home: '首页',
    learn: '学习',
    pro: 'Pro',
    pricing: '定价',
    
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

    // Auth
    signIn: '登录',
    createAccount: '创建账户',
    signInDescription: '使用你的邮箱登录以访问你的账户',
    createAccountDescription: '用你的邮箱地址创建一个新账户',
    emailLabel: '电子邮箱',
    emailPlaceholder: 'your@email.com',
    passwordLabel: '密码',
    passwordPlaceholder: '至少 10 个字符（字母 + 数字）',
    signInButton: '登录',
    createAccountButton: '创建账户',
    toggleMode: '没有账户?',
    toggleModeLogin: '已有账户?',
    emailRequired: '请输入有效的电子邮箱',
    passwordRequired: '密码必须至少 10 个字符，包含字母和数字',
    accountCreatedSuccess: '账户已创建！正在登录...',
    loginSuccess: '欢迎回来！',
    invalidEmail: '无效的电子邮箱地址',
    passwordTooWeak: '密码过弱',
    logOut: '登出',
    hello: '你好',
    emailHint: '使用你的邮箱地址',
    passwordHint: '10+ 字符，混合字母和数字',
    securityNote: '你的数据已加密。我们从不共享你的信息。',

    // Pro features (English fallback)
    proRequired: 'Pro Required',
    aiInspectorLimit: "You've used your free analysis. Upgrade to Pro for unlimited access.",
    aiInspectorLimitReached: "You've used your free analysis. Upgrade to Pro for unlimited AI-powered code analysis.",
    profilerLimit: "You've used your free profiler run. Upgrade to Pro for unlimited access.",
    profilerLocked: 'Profiler Locked',
    freeAnalysesUsed: 'free analyses used',
    freeRunsUsed: 'free runs used',
    freeLeft: 'free left',
    upgradeToPro: 'Upgrade to Pro',
    proFeature: 'Pro Feature',
    variableInspectorPro: 'Variable Inspector is available for Pro users only.',
    aiCodeInspector: 'AI Code Inspector',
    intelligentAnalysis: 'Intelligent Analysis',
    aiCodeInspectorTitle: 'AI Code Inspector',
    aiCodeInspectorDesc: 'Automatic analysis with optimization suggestions, warnings, and algorithm explanations.',
    yourCode: 'Your Code',
    analyzing: 'Analyzing...',
    analyze: 'Analyze',
    pasteCodeHere: 'Paste your Python code here...',
    inspectorFeatures: 'The Inspector analyzes your code and provides:',
    optimizationSuggestions: 'Optimization suggestions',
    potentialIssueWarnings: 'Warnings about potential issues',
    algorithmExplanations: 'Algorithm explanations',
    bestPracticesTips: 'Best practices tips',
    analysisComplete: 'Analysis Complete',
    noSuggestions: 'No suggestions found. Code looks good!',
    profilerComplete: 'Profiler Complete',
    profilerError: 'Profiler Error',
    average: 'Average',
    min: 'Min',
    max: 'Max',
    profiler: 'Profiler',
    executions: 'executions',
    runProfiler: 'Run Profiler',

    // Pricing & Pro pages
    pricingPlansTitle: '订阅计划',
    pricingPlansSubtitle: '为你的编程之旅选择完美计划',
    manageSubscription: '管理订阅',
    viewPricing: '查看定价',
    proLearningTitle: 'Pro 学习工具',
    proLearningSubtitle: '高级调试器、代码检查器和专业练习。',
    premiumBadge: '高级功能',
    premiumHeadline: '面向开发者的专业工具',
    premiumDescription: '解锁完整的高级调试、性能分析和实时可视化工具套件。',
    proTracksBadge: 'Pro 练习（从基础到高级）',
    proTracksSubtitle: '循序渐进的独家挑战路线。',
    proChallengesBadge: 'Pro 挑战 - 高级算法',
    proChallengesSubtitle: '带完整解答与集成调试器的练习',
    proMiniDemosSubtitle: 'Pro 实验室的快速预览。',
    billingTitle: '账单和支付方式',
    billingDescription: '在安全门户中管理账单、更新卡片并导出收据。',
    openBillingPortal: '打开账单门户',
    downloadReceipts: '在哪里下载收据？',
    proRoadmap1Title: '带时间线和火焰图的 Profiler',
    proRoadmap1Eta: 'Jan/2026',
    proRoadmap1Status: '开发中',
    proRoadmap2Title: '条件断点与变量监视',
    proRoadmap2Eta: 'Jan/2026',
    proRoadmap2Status: '开发中',
    proRoadmap3Title: '大对象检查器 + JSON 导出',
    proRoadmap3Eta: 'Feb/2026',
    proRoadmap3Status: '计划中',
    proBenefit1: '无限次调试器运行',
    proBenefit2: '练习中的提示和解锁的解决方案',
    proBenefit3: '优先支持和可投票路线图',
    proBenefit4: '持续交付的 Pro 更新',
    proTrackBeginnerTitle: '初级',
    proTrackBeginner1: '包含用户输入的 Hello World',
    proTrackBeginner2: '变量、类型与 console.log',
    proTrackBeginner3: '基础条件语句 (if/else)',
    proTrackBeginner4: '遍历小型数组的循环',
    proTrackBeginner5: '纯函数与参数',
    proTrackBeginner6: '简单的逐步调试',
    proTrackIntermediateTitle: '中级',
    proTrackIntermediate1: '数组 + map/filter/reduce',
    proTrackIntermediate2: '对象与 JSON 操作',
    proTrackIntermediate3: '模块化与代码组织',
    proTrackIntermediate4: '使用 asserts 的快速测试',
    proTrackIntermediate5: 'Promises 与 async/await',
    proTrackIntermediate6: 'Profiler：测量 3 个实现',
    proTrackAdvancedTitle: '高级',
    proTrackAdvanced1: '数据结构（栈/队列）',
    proTrackAdvanced2: '优化的搜索与排序',
    proTrackAdvanced3: '带重试与退避的 API',
    proTrackAdvanced4: '缓存与失效',
    proTrackAdvanced5: '调试异步竞态条件',
    proTrackAdvanced6: '端到端的假微服务',
    proFeatureDebuggerTitle: 'Pro 调试器',
    proFeatureDebuggerDesc: '高级可视化调试器，含断点、变量监视和详细堆栈跟踪',
    proFeatureDebuggerB1: '逐步执行',
    proFeatureDebuggerB2: '变量检查',
    proFeatureAnalyzerTitle: '性能分析器',
    proFeatureAnalyzerDesc: '分析运行时间、内存使用并优化代码',
    proFeatureAnalyzerB1: '执行时间线',
    proFeatureAnalyzerB2: '内存使用',
    proFeatureStructuresTitle: '结构可视化',
    proFeatureStructuresDesc: '通过交互式图表实时查看数组和对象',
    proFeatureStructuresB1: '复杂结构',
    proFeatureStructuresB2: '交互式图形',
    proFeatureAiTitle: 'AI 助手',
    proFeatureAiDesc: '自动优化建议和错误解释',
    proFeatureAiB1: '自动分析',
    proFeatureAiB2: '实时建议',
    proFeatureSnapshotsTitle: '执行快照',
    proFeatureSnapshotsDesc: '捕获并分享完整的执行状态',
    proFeatureSnapshotsB1: '捕获与回放',
    proFeatureSnapshotsB2: '共享',
    proFeatureDbTitle: '数据库检查器',
    proFeatureDbDesc: '检查查询、查看索引并优化性能',
    proFeatureDbB1: '查询分析',
    proFeatureDbB2: '优化',
    proMiniDemosBadge: '迷你演示',
    proMiniDemosNote: '在 Pro Labs 可用（下面有实时演示）。',
    proInspectorAnalyze: '分析',
    proInspectorPlaceholder: '粘贴 JSON 并点击分析。',
    proInspectorInvalidJson: '无效的 JSON',
    proDebuggerLoading: '正在加载调试器...',
    proDebuggerRequiresBadge: '需要 Pro 计划',
    proDebuggerRequiresText: '订阅 Pro 以访问完整的实时调试器。',
    proPlaygroundTitle: 'VIP 游乐场',
    proPlaygroundSubtitle: '在不触碰主代码的情况下测试片段、草拟方案并记录笔记。',
    proPlaygroundIdea1: '用 5–10 分钟的 kata 热身',
    proPlaygroundIdea2: '编码前先设计数据结构',
    proPlaygroundIdea3: '粘贴日志并写下发现',
    proPlaygroundCopy: '复制草稿',
    proPlaygroundCopied: '草稿已复制',
    proPlaygroundCopyFailed: '无法复制草稿',
    proPlaygroundClear: '清空草稿',
    proPlaygroundPlaceholder: '在这里写快速笔记、伪代码、检查清单或测试片段...',
    vipSignupTitle: '创建 VIP 账户（Pro）',
    vipSignupDesc: '首先验证您的电子邮件，然后通过 Stripe 完成付款。',
    firstName: '名',
    lastName: '姓',
    country: '国家',
    dateOfBirth: '出生日期',
    vipContinueToEmail: '继续进行电子邮件确认',
    vipCodeSent: '验证码已发送',
    vipCheckEmail: '查看您的电子邮件并输入代码以继续。',
    codeSentTo: '代码已发送至',
    back: '返回',
    vipProceedToPayment: '继续付款',
  },
  
  'hi': {
    // Header
    challenges: 'चुनौतियाँ',
    jsOrPython: 'JavaScript या Python',
    progress: 'प्रगति',
    home: 'मुख्य',
    learn: 'सीखें',
    pro: 'Pro',
    pricing: 'कीमतें',
    
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

    // Auth
    signIn: 'साइन इन करें',
    createAccount: 'खाता बनाएं',
    signInDescription: 'अपने खाते तक पहुँचने के लिए अपने ईमेल से साइन इन करें',
    createAccountDescription: 'अपने ईमेल पते के साथ एक नया खाता बनाएं',
    emailLabel: 'ईमेल पता',
    emailPlaceholder: 'आपका@ईमेल.कॉम',
    passwordLabel: 'पासवर्ड',
    passwordPlaceholder: 'कम से कम 10 वर्ण (अक्षर + संख्याएं)',
    signInButton: 'साइन इन करें',
    createAccountButton: 'खाता बनाएं',
    toggleMode: 'खाता नहीं है?',
    toggleModeLogin: 'पहले से खाता है?',
    emailRequired: 'कृपया एक वैध ईमेल दर्ज करें',
    passwordRequired: 'पासवर्ड कम से कम 10 वर्ण होना चाहिए जिसमें अक्षर और संख्याएं हों',
    accountCreatedSuccess: 'खाता बनाया गया! साइन इन किया जा रहा है...',
    loginSuccess: 'स्वागत है!',
    invalidEmail: 'अमान्य ईमेल पता',
    passwordTooWeak: 'कमजोर पासवर्ड',
    logOut: 'साइन आउट करें',
    hello: 'नमस्ते',
    emailHint: 'अपना ईमेल पता उपयोग करें',
    passwordHint: '10+ वर्ण, अक्षरों और संख्याओं का मिश्रण',
    securityNote: 'आपका डेटा एन्क्रिप्ट किया गया है। हम कभी भी आपकी जानकारी साझा नहीं करते।',

    // Pro features (English fallback)
    proRequired: 'Pro Required',
    aiInspectorLimit: "You've used your free analysis. Upgrade to Pro for unlimited access.",
    aiInspectorLimitReached: "You've used your free analysis. Upgrade to Pro for unlimited AI-powered code analysis.",
    profilerLimit: "You've used your free profiler run. Upgrade to Pro for unlimited access.",
    profilerLocked: 'Profiler Locked',
    freeAnalysesUsed: 'free analyses used',
    freeRunsUsed: 'free runs used',
    freeLeft: 'free left',
    upgradeToPro: 'Upgrade to Pro',
    proFeature: 'Pro Feature',
    variableInspectorPro: 'Variable Inspector is available for Pro users only.',
    aiCodeInspector: 'AI Code Inspector',
    intelligentAnalysis: 'Intelligent Analysis',
    aiCodeInspectorTitle: 'AI Code Inspector',
    aiCodeInspectorDesc: 'Automatic analysis with optimization suggestions, warnings, and algorithm explanations.',
    yourCode: 'Your Code',
    analyzing: 'Analyzing...',
    analyze: 'Analyze',
    pasteCodeHere: 'Paste your Python code here...',
    inspectorFeatures: 'The Inspector analyzes your code and provides:',
    optimizationSuggestions: 'Optimization suggestions',
    potentialIssueWarnings: 'Warnings about potential issues',
    algorithmExplanations: 'Algorithm explanations',
    bestPracticesTips: 'Best practices tips',
    analysisComplete: 'Analysis Complete',
    noSuggestions: 'No suggestions found. Code looks good!',
    profilerComplete: 'Profiler Complete',
    profilerError: 'Profiler Error',
    average: 'Average',
    min: 'Min',
    max: 'Max',
    profiler: 'Profiler',
    executions: 'executions',
    runProfiler: 'Run Profiler',

    // Pricing & Pro pages
    pricingPlansTitle: 'सदस्यता योजनाएँ',
    pricingPlansSubtitle: 'अपनी प्रोग्रामिंग यात्रा के लिए सही योजना चुनें',
    manageSubscription: 'सदस्यता प्रबंधित करें',
    viewPricing: 'कीमतें देखें',
    proLearningTitle: 'Pro सीखने के उपकरण',
    proLearningSubtitle: 'एडवांस्ड डिबगर, कोड इंस्पेक्टर और प्रो अभ्यास।',
    premiumBadge: 'प्रीमियम फीचर्स',
    premiumHeadline: 'डेवलपर्स के लिए प्रो उपकरण',
    premiumDescription: 'उन्नत डिबगिंग, परफॉर्मेंस एनालिसिस और रियल-टाइम विज़ुअलाइज़ेशन का पूरा सेट अनलॉक करें।',
    proTracksBadge: 'Pro अभ्यास (बेसिक से एडवांस्ड)',
    proTracksSubtitle: 'क्रमिक ट्रैक्स जिनमें विशेष चुनौतियाँ हैं।',
    proChallengesBadge: 'Pro चुनौतियाँ - उन्नत एल्गोरिदम',
    proChallengesSubtitle: 'पूर्ण समाधानों और इंटीग्रेटेड डिबगर वाले अभ्यास',
    proMiniDemosSubtitle: 'Pro लैब्स का त्वरित पूर्वावलोकन।',
    billingTitle: 'बिलिंग और भुगतान विधि',
    billingDescription: 'सुरक्षित पोर्टल में बिलिंग, कार्ड अपडेट, और रसीदें एक्सपोर्ट करें।',
    openBillingPortal: 'बिलिंग पोर्टल खोलें',
    downloadReceipts: 'रसीदें कहाँ डाउनलोड करूँ?',
    proRoadmap1Title: 'टाइमलाइन और फ्लेमग्राफ वाला प्रोफाइलर',
    proRoadmap1Eta: 'Jan/2026',
    proRoadmap1Status: 'प्रगति पर',
    proRoadmap2Title: 'कंडीशनल ब्रेकपॉइंट्स और वैरिएबल वॉच',
    proRoadmap2Eta: 'Jan/2026',
    proRoadmap2Status: 'प्रगति पर',
    proRoadmap3Title: 'बड़े ऑब्जेक्ट्स इंस्पेक्टर + JSON एक्सपोर्ट',
    proRoadmap3Eta: 'Feb/2026',
    proRoadmap3Status: 'योजनाबद्ध',
    proBenefit1: 'अनलिमिटेड डिबगर रन',
    proBenefit2: 'अभ्यासों में संकेत और समाधान अनलॉक्ड',
    proBenefit3: 'प्राथमिकता सपोर्ट और वोटेबल रोडमैप',
    proBenefit4: 'सतत Pro अपडेट्स',
    proTrackBeginnerTitle: 'बिगिनर',
    proTrackBeginner1: 'यूजर इनपुट के साथ Hello World',
    proTrackBeginner2: 'वैरिएबल्स, प्रकार, और console.log',
    proTrackBeginner3: 'बेसिक कंडीशनल्स (if/else)',
    proTrackBeginner4: 'छोटे ऐरे पर लूप्स',
    proTrackBeginner5: 'प्योर फंक्शन्स और पैरामीटर्स',
    proTrackBeginner6: 'सरल स्टेप-बाय-स्टेप डिबगिंग',
    proTrackIntermediateTitle: 'इंटरमीडिएट',
    proTrackIntermediate1: 'ऐरे + map/filter/reduce',
    proTrackIntermediate2: 'ऑब्जेक्ट और JSON मैनिपुलेशन',
    proTrackIntermediate3: 'मॉड्यूल्स और कोड संगठन',
    proTrackIntermediate4: 'असर्ट्स के साथ त्वरित परीक्षण',
    proTrackIntermediate5: 'Promises और async/await',
    proTrackIntermediate6: 'Profiler: 3 इम्प्लीमेंटेशन्स मापें',
    proTrackAdvancedTitle: 'एडवांस्ड',
    proTrackAdvanced1: 'डेटा स्ट्रक्चर (स्टैक/क्यू)',
    proTrackAdvanced2: 'ऑप्टिमाइज़्ड सर्च और सॉर्टिंग',
    proTrackAdvanced3: 'रीट्राय और बैकऑफ वाली APIs',
    proTrackAdvanced4: 'कैशिंग और इनवैलिडेशन',
    proTrackAdvanced5: 'असिंक्रोनस रेस कंडीशन डिबग करना',
    proTrackAdvanced6: 'फेक माइक्रोसर्विस एंड-टू-एंड',
    proFeatureDebuggerTitle: 'Pro Debugger',
    proFeatureDebuggerDesc: 'एडवांस्ड विजुअल डिबगर: ब्रेकपॉइंट्स, वॉच वैरिएबल्स, और विस्तृत स्टैक ट्रेसेस',
    proFeatureDebuggerB1: 'स्टेप-बाय-स्टेप निष्पादन',
    proFeatureDebuggerB2: 'वैरिएबल इंस्पेक्शन',
    proFeatureAnalyzerTitle: 'Performance Analyzer',
    proFeatureAnalyzerDesc: 'रनटाइम, मेमोरी उपयोग विश्लेषित करें और कोड ऑप्टिमाइज़ करें',
    proFeatureAnalyzerB1: 'निष्पादन टाइमलाइन',
    proFeatureAnalyzerB2: 'मेमोरी उपयोग',
    proFeatureStructuresTitle: 'स्ट्रक्चर विज़ुअलाइज़ेशन',
    proFeatureStructuresDesc: 'इंटरएक्टिव डायग्राम के साथ रियल-टाइम में ऐरे और ऑब्जेक्ट देखें',
    proFeatureStructuresB1: 'जटिल स्ट्रक्चर',
    proFeatureStructuresB2: 'इंटरएक्टिव ग्राफ़्स',
    proFeatureAiTitle: 'AI Assistant',
    proFeatureAiDesc: 'स्वचालित ऑप्टिमाइजेशन सुझाव और त्रुटि व्याख्याएँ',
    proFeatureAiB1: 'स्वचालित विश्लेषण',
    proFeatureAiB2: 'रियल-टाइम सुझाव',
    proFeatureSnapshotsTitle: 'Execution Snapshots',
    proFeatureSnapshotsDesc: 'पूर्ण निष्पादन स्थितियों को कैप्चर और साझा करें',
    proFeatureSnapshotsB1: 'कैप्चर और रिप्ले',
    proFeatureSnapshotsB2: 'साझा करना',
    proFeatureDbTitle: 'Database Inspector',
    proFeatureDbDesc: 'क्वेरी जांचें, इंडेक्स देखें और प्रदर्शन ऑप्टिमाइज़ करें',
    proFeatureDbB1: 'क्वेरी विश्लेषण',
    proFeatureDbB2: 'ऑप्टिमाइजेशन',
    proMiniDemosBadge: 'Mini demos',
    proMiniDemosNote: 'Pro Labs में उपलब्ध (नीचे लाइव डेमो)।',
    proInspectorAnalyze: 'विश्लेषण करें',
    proInspectorPlaceholder: 'JSON पेस्ट करें और विश्लेषण पर क्लिक करें।',
    proInspectorInvalidJson: 'अमान्य JSON',
    proDebuggerLoading: 'डिबगर लोड हो रहा है...',
    proDebuggerRequiresBadge: 'Pro योजना आवश्यक',
    proDebuggerRequiresText: 'पूर्ण रियल-टाइम डिबगर तक पहुँचने के लिए Pro सब्सक्राइब करें।',
    proPlaygroundTitle: 'VIP Playground',
    proPlaygroundSubtitle: 'मुख्य कोड छुए बिना स्निपेट्स टेस्ट करें, समाधान रेखाचित्र बनाएं और नोट्स लें।',
    proPlaygroundIdea1: '5–10 मिनट का काता करके वार्म-अप करें',
    proPlaygroundIdea2: 'कोडिंग से पहले डेटा स्ट्रक्चर डिज़ाइन करें',
    proPlaygroundIdea3: 'लॉग्स पेस्ट करें और निष्कर्ष लिखें',
    proPlaygroundCopy: 'स्क्रैचपैड कॉपी करें',
    proPlaygroundCopied: 'स्क्रैचपैड कॉपी हुआ',
    proPlaygroundCopyFailed: 'स्क्रैचपैड कॉपी नहीं हो सका',
    proPlaygroundClear: 'स्क्रैचपैड साफ़ करें',
    proPlaygroundPlaceholder: 'यहाँ त्वरित नोट्स, छद्म-कोड, चेकलिस्ट या टेस्ट स्निपेट लिखें...',
    vipSignupTitle: 'VIP खाता बनाएं (Pro)',
    vipSignupDesc: 'पहले हम आपका ईमेल सत्यापित करेंगे। फिर आप Stripe के साथ भुगतान पूरा करेंगे।',
    firstName: 'नाम',
    lastName: 'उपनाम',
    country: 'देश',
    dateOfBirth: 'जन्म तिथि',
    vipContinueToEmail: 'ईमेल पुष्टि के लिए आगे बढ़ें',
    vipCodeSent: 'कोड भेजा गया',
    vipCheckEmail: 'अपना ईमेल जांचें और जारी रखने के लिए कोड दर्ज करें।',
    codeSentTo: 'कोड भेजा गया',
    back: 'वापस',
    vipProceedToPayment: 'भुगतान के लिए आगे बढ़ें',
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
