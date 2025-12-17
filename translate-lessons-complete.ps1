# Complete Portuguese to English translation for lessons.ts
$file = "client\src\lib\lessons.ts"
$c = Get-Content $file -Raw -Encoding UTF8

Write-Host "Translating lessons.ts completely..."

# Remove duplicate text from description
$c = $c -replace 'Understand the concepts of Scope and Call Stack\. See how variables are created and destroyed\. Veja como vari.+veis s.+o criadas e destru.+das\.', 'Understand the concepts of Scope and Call Stack. See how variables are created and destroyed.'

# All Portuguese explanations to English
$c = $c -replace 'A vari.+vel .x. .+ declarada e inicializada com o valor 5 dentro do escopo de .main.\.', 'The variable x is declared and initialized with value 5 within the main scope.'
$c = $c -replace 'A vari.+vel .y. .+ declarada e inicializada com o valor 3\.', 'The variable y is declared and initialized with value 3.'
$c = $c -replace 'A fun.+o .somar. .+ chamada\. Um NOVO quadro .+ colocado NO TOPO da pilha\. Os valores de x e y s.+o copiados\.', 'The sum function is called. A NEW frame is placed ON TOP of the stack. The x and y values are copied.'
$c = $c -replace 'O c.+lculo .+ feito e armazenado na vari.+vel local .result.\.', 'The calculation is performed and stored in the local variable result.'
$c = $c -replace 'A fun.+o retorna 8\. O quadro da fun.+o .somar. ser.+ removido\.', 'The function returns 8. The sum function frame will be removed.'
$c = $c -replace 'Voltamos para .main.\. O valor retornado \(8\) .+ atribu.+do .+ vari.+vel .total.\.', 'We return to main. The returned value (8) is assigned to the total variable.'
$c = $c -replace 'O valor .+ exibido\. Fim da execu.+o\.', 'The value is displayed. End of execution.'

# C# explanations
$c = $c -replace 'Em C#, a execu.+o come.+a pelo m.+todo est.+tico .Main.\. O CLR carrega o programa\.', 'In C#, execution starts with the static Main method. The CLR loads the program.'
$c = $c -replace 'O m.+todo .Main. .+ alocado na Stack\.', 'The Main method is allocated on the Stack.'
$c = $c -replace 'A vari.+vel inteira .x. .+ alocada na Stack \(Value Type\)\.', 'The integer variable x is allocated on the Stack (Value Type).'
$c = $c -replace 'A vari.+vel .y. .+ alocada\.', 'The variable y is allocated.'
$c = $c -replace 'Chamamos .Somar.\. Um novo Frame .+ empilhado\. Os valores s.+o copiados\.', 'We call sum. A new Frame is pushed. Values are copied.'
$c = $c -replace 'O c.+lculo ocorre e .+ salvo na vari.+vel local .result.\.', 'The calculation occurs and is saved in the local variable result.'
$c = $c -replace 'O m.+todo retorna 8 e o Frame .+ desempilhado\.', 'The method returns 8 and the Frame is popped.'
$c = $c -replace 'De volta ao Main, .total. recebe 8\.', 'Back to Main, total receives 8.'
$c = $c -replace 'Imprime no console\. Fim\.', 'Prints to console. End.'

# Java explanations
$c = $c -replace 'A JVM inicia a execu.+o pelo m.+todo .main.\.', 'The JVM starts execution with the main method.'
$c = $c -replace 'O Frame do m.+todo main .+ criado na Stack\.', 'The main method Frame is created on the Stack.'
$c = $c -replace 'Vari.+vel primitiva .x. \(int\) .+ criada na Stack\.', 'Primitive variable x (int) is created on the Stack.'
$c = $c -replace 'Vari.+vel primitiva .y. .+ criada\.', 'Primitive variable y is created.'
$c = $c -replace 'M.+todo .somar. .+ chamado\. Novo quadro na pilha\.', 'sum method is called. New frame on the stack.'
$c = $c -replace 'C.+lculo realizado e armazenado em .result.\.', 'Calculation performed and stored in result.'
$c = $c -replace 'Retorno do m.+todo .somar.\. O quadro ser.+ destru.+do\.', 'Return from sum method. The frame will be destroyed.'
$c = $c -replace 'De volta ao main, valor atribu.+do a .total.\.', 'Back to main, value assigned to total.'
$c = $c -replace 'Impress.+o no console\.', 'Print to console.'

# C explanations
$c = $c -replace 'O ponto de entrada em C .+ a fun.+o .main.\.', 'The entry point in C is the main function.'
$c = $c -replace 'O Stack Frame para main .+ alocado\.', 'The Stack Frame for main is allocated.'
$c = $c -replace 'Inteiro .x. alocado na pilha\.', 'Integer x allocated on the stack.'
$c = $c -replace 'Inteiro .y. alocado na pilha\.', 'Integer y allocated on the stack.'
$c = $c -replace 'Chamada de fun.+o .somar.\. Argumentos passados por c.+pia\.', 'Function call to sum. Arguments passed by copy.'
$c = $c -replace 'Vari.+vel local .result. alocada no frame de .somar.\.', 'Local variable result allocated in sum frame.'
$c = $c -replace 'Retorno da fun.+o\.', 'Function return.'
$c = $c -replace 'Valor retornado atribu.+do a .total. em main\.', 'Returned value assigned to total in main.'
$c = $c -replace 'printf exibe o result\.', 'printf displays the result.'

# Objects lesson
$c = $c -replace 'Refer.+ncias e Objetos', 'References and Objects'
$c = $c -replace 'Descubra a diferen.+a entre a .Pilha. \(Stack\) e o .Heap. \(Mem.+ria Livre\)\. Vari.+veis de objeto apenas APONTAM para o objeto real\.', 'Discover the difference between the Stack and the Heap (Free Memory). Object variables only POINT to the real object.'
$c = $c -replace 'In.+cio do programa\. Objetos vivem na Heap\.', 'Program start. Objects live on the Heap.'
$c = $c -replace 'Preparando chamada de criarUsuario\.', 'Preparing call to createUser.'
$c = $c -replace 'Entramos na fun.+o\.', 'We enter the function.'
$c = $c -replace 'Objeto criado na HEAP\. Vari.+vel na Stack guarda o ENDERE.+O \(Refer.+ncia\)\.', 'Object created on the HEAP. Variable on Stack holds the ADDRESS (Reference).'
$c = $c -replace 'Retorna a REFER.+NCIA\.', 'Returns the REFERENCE.'
$c = $c -replace '.u1. aponta para o objeto na Heap\.', 'u1 points to the object on the Heap.'
$c = $c -replace '.u2 = u1. copia o endere.+o\. Ambos apontam para o MESMO objeto\.', 'u2 = u1 copies the address. Both point to the SAME object.'
$c = $c -replace 'Alterar .u2. afeta o objeto real, ent.+o .u1. tamb.+m v.+ a mudan.+a\.', 'Changing u2 affects the real object, so u1 also sees the change.'

$c = $c -replace 'In.+cio\. Classes em C# s.+o Reference Types \(ficam na Heap\)\.', 'Start. Classes in C# are Reference Types (stored on Heap).'
$c = $c -replace '.new Usuario\(\). aloca mem.+ria na Heap\. .u1. na Stack aponta para l.+\.', 'new Usuario() allocates memory on the Heap. u1 on Stack points there.'
$c = $c -replace 'Atribu.+mos .Ana. .+ propriedade Nome do objeto na Heap\.', 'We assign Ana to the Name property of the object on the Heap.'
$c = $c -replace '.u2 = u1. copia a refer.+ncia\. Agora temos duas vari.+veis apontando para o mesmo objeto\.', 'u2 = u1 copies the reference. Now we have two variables pointing to the same object.'
$c = $c -replace 'Alterar u2 altera o objeto compartilhado\.', 'Changing u2 changes the shared object.'

# Recursion
$c = $c -replace 'Recurs.+o \(Call Stack\)', 'Recursion (Call Stack)'
$c = $c -replace 'Visualize como a pilha de chamadas cresce quando uma fun.+o chama a si mesma\.', 'Visualize how the call stack grows when a function calls itself.'
$c = $c -replace 'Vamos calcular o fatorial de 3 recursivamente\.', 'Lets calculate the factorial of 3 recursively.'
$c = $c -replace 'Chamada inicial: fatorial\(3\)\.', 'Initial call: factorial(3).'
$c = $c -replace 'n .+ 3, n.+o .+ 1\. Continua\.', 'n is 3, not 1. Continues.'
$c = $c -replace 'n .+ 2\. Continua\.', 'n is 2. Continues.'
$c = $c -replace 'PAUSA fatorial\(3\) para chamar fatorial\(2\)\. Empilha novo quadro\.', 'PAUSE factorial(3) to call factorial(2). Pushes new frame.'
$c = $c -replace 'PAUSA fatorial\(2\) para chamar fatorial\(1\)\. A pilha cresce!', 'PAUSE factorial(2) to call factorial(1). The stack grows!'
$c = $c -replace 'BASE CASE: n .+ 1\. Retorna 1\.', 'BASE CASE: n is 1. Returns 1.'
$c = $c -replace 'Volta para fatorial\(2\)\. Calcula 2 \* 1 = 2\. Retorna 2\.', 'Back to factorial(2). Calculates 2 * 1 = 2. Returns 2.'
$c = $c -replace 'Volta para fatorial\(3\)\. Calcula 3 \* 2 = 6\. Retorna 6\.', 'Back to factorial(3). Calculates 3 * 2 = 6. Returns 6.'
$c = $c -replace 'result final 6 armazenado\.', 'Final result 6 stored.'

# Classes
$c = $c -replace 'Classes e Inst.+ncias', 'Classes and Instances'
$c = $c -replace 'Aprenda como a palavra-chave .this. funciona e como classes geram objetos\.', 'Learn how the this keyword works and how classes generate objects.'
$c = $c -replace 'Avan.+ado', 'Advanced'
$c = $c -replace 'Definimos a classe\. Vamos instanciar com .new.\.', 'We define the class. Lets instantiate with new.'
$c = $c -replace '.new. cria objeto vazio na Heap e atribui a .this.\.', 'new creates empty object on Heap and assigns to this.'
$c = $c -replace 'Configura .this\.modelo.\.', 'Configures this.model.'
$c = $c -replace 'Configura .this\.velocidade.\.', 'Configures this.speed.'
$c = $c -replace 'Retorna a inst.+ncia para .c1.\.', 'Returns the instance to c1.'
$c = $c -replace 'Chama m.+todo\. .this. .+ o objeto c1\.', 'Calls method. this is the c1 object.'
$c = $c -replace 'Atualiza propriedade na Heap\.', 'Updates property on Heap.'

# Loops & Arrays
$c = $c -replace 'Entenda como arrays s.+o armazenados e como loops os percorrem .+ndice por .+ndice\.', 'Understand how arrays are stored and how loops traverse them index by index.'
$c = $c -replace 'Vamos criar um array de n.+meros\.', 'Lets create an array of numbers.'
$c = $c -replace 'Array criado na Heap\. .numeros. guarda a refer.+ncia\.', 'Array created on Heap. numbers holds the reference.'
$c = $c -replace 'Inicializamos .soma. com 0\.', 'We initialize sum with 0.'
$c = $c -replace 'In.+cio do loop\. .i. .+ 0\. 0 < 3 .+ verdadeiro\.', 'Loop start. i is 0. 0 < 3 is true.'
$c = $c -replace 'Acessamos numeros\[0\] \(10\) e somamos\. soma = 0 \+ 10 = 10\.', 'We access numbers[0] (10) and add. sum = 0 + 10 = 10.'
$c = $c -replace 'Incrementamos .i. para 1\. 1 < 3 .+ verdadeiro\.', 'We increment i to 1. 1 < 3 is true.'
$c = $c -replace 'Acessamos numeros\[1\] \(20\)\. soma = 10 \+ 20 = 30\.', 'We access numbers[1] (20). sum = 10 + 20 = 30.'
$c = $c -replace 'Incrementamos .i. para 2\. 2 < 3 .+ verdadeiro\.', 'We increment i to 2. 2 < 3 is true.'
$c = $c -replace 'Acessamos numeros\[2\] \(30\)\. soma = 30 \+ 30 = 60\.', 'We access numbers[2] (30). sum = 30 + 30 = 60.'
$c = $c -replace 'Incrementamos .i. para 3\. 3 < 3 .+ FALSO\. O loop termina\.', 'We increment i to 3. 3 < 3 is FALSE. The loop ends.'

# Conditionals
$c = $c -replace 'Condicionais \(If/Else\)', 'Conditionals (If/Else)'
$c = $c -replace 'Veja como o computador toma decis.+es e escolhe qual caminho seguir no c.+digo\.', 'See how the computer makes decisions and chooses which path to follow in the code.'
$c = $c -replace 'Vamos verificar uma idade\.', 'Lets check an age.'
$c = $c -replace 'Chamamos a fun.+o com idade = 15\.', 'We call the function with age = 15.'
$c = $c -replace 'Vari.+vel .status. .+ criada, mas ainda indefinida\.', 'Variable status is created but still undefined.'
$c = $c -replace 'O .if. verifica: 15 >= 18.* FALSO\.', 'The if checks: 15 >= 18? FALSE.'
$c = $c -replace 'Como foi falso, pulamos para o .else.\.', 'Since it was false, we jump to the else.'
$c = $c -replace 'Executamos o bloco else\. status recebe .Menor de idade.\.', 'We execute the else block. status receives Minor.'
$c = $c -replace 'Retornamos o valor\.', 'We return the value.'
$c = $c -replace 'result final armazenado\.', 'Final result stored.'

# Closures
$c = $c -replace 'Closures \(Fun.+es e Escopo\)', 'Closures (Functions and Scope)'
$c = $c -replace 'Entenda como fun.+es lembram vari.+veis do escopo onde foram criadas\.', 'Understand how functions remember variables from the scope where they were created.'
$c = $c -replace 'Interm.+dio', 'Intermediate'
$c = $c -replace 'Definimos criarContador e criamos o contador\.', 'We define createCounter and create the counter.'
$c = $c -replace 'A fun.+o retornada mant.+m refer.+ncia ao ambiente \(closure\)\.', 'The returned function maintains a reference to the environment (closure).'
$c = $c -replace 'Ao chamar contador\(\), .cont. .+ incrementado e preservado na closure\.', 'When calling counter(), cont is incremented and preserved in the closure.'
$c = $c -replace 'Chamar novamente aumenta cont para 2 .+ o estado foi mantido\.', 'Calling again increases cont to 2 - the state was maintained.'

# Async
$c = $c -replace 'Ass.+ncrono: Callbacks, Promises e async/await', 'Asynchronous: Callbacks, Promises and async/await'
$c = $c -replace 'Mostra a diferen.+a entre execu.+o s.+ncrona e ass.+ncrona e como o event loop funciona\.', 'Shows the difference between synchronous and asynchronous execution and how the event loop works.'
$c = $c -replace 'Execu.+o inicial: log .A. e agendamento de callbacks\.', 'Initial execution: log A and scheduling callbacks.'
$c = $c -replace 'Imprime .A. imediatamente\.', 'Prints A immediately.'
$c = $c -replace 'Imprime .D. em seguida \(s.+ncrono\)\.', 'Prints D next (synchronous).'
$c = $c -replace 'Microtasks \(Promises\) executam antes dos callbacks de setTimeout: imprime .C.\.', 'Microtasks (Promises) execute before setTimeout callbacks: prints C.'
$c = $c -replace 'Por fim, event loop processa macrotasks: setTimeout imprime .B.\. Ordem: A, D, C, B\.', 'Finally, event loop processes macrotasks: setTimeout prints B. Order: A, D, C, B.'

# Debugging
$c = $c -replace 'Depura.+o e Console', 'Debugging and Console'
$c = $c -replace 'Como usar logs e breakpoints para entender passo a passo o que acontece no c.+digo\.', 'How to use logs and breakpoints to understand step by step what happens in the code.'
$c = $c -replace 'Chamamos busca\. O loop itera e imprime cada .+ndice para ajudar a depurar\.', 'We call search. The loop iterates and prints each index to help debug.'
$c = $c -replace 'checando', 'checking'
$c = $c -replace 'encontramos 3 e retornamos .+ndice 2', 'we find 3 and return index 2'

# Variable names in code
$c = $c -replace 'function criarUsuario\(', 'function createUser('
$c = $c -replace 'criarUsuario\(', 'createUser('
$c = $c -replace '\busuario\b', 'user'
$c = $c -replace 'class Carro', 'class Car'
$c = $c -replace '\bmodelo\b', 'model'
$c = $c -replace '\bvelocidade\b', 'speed'
$c = $c -replace '\bacelerar\b', 'accelerate'
$c = $c -replace 'verificarIdade', 'checkAge'
$c = $c -replace '\bidade\b', 'age'
$c = $c -replace 'Maior de idade', 'Adult'
$c = $c -replace 'Menor de idade', 'Minor'
$c = $c -replace 'function criarContador', 'function createCounter'
$c = $c -replace '\bcontador\b', 'counter'
$c = $c -replace '\bcont\b', 'count'
$c = $c -replace '\bnumeros\b', 'numbers'
$c = $c -replace '\bsoma\b', 'sum'
$c = $c -replace '\bbusca\b', 'search'

Set-Content $file $c -Encoding UTF8 -NoNewline
Write-Host "✅ lessons.ts fully translated!"
