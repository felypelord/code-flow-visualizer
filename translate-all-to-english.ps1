# PowerShell script to translate EVERYTHING to English
Write-Host "Translating ALL content to English..."

# ============================================
# LESSONS.TS - Complete translation
# ============================================
$lessonsFile = "client\src\lib\lessons.ts"
$content = Get-Content $lessonsFile -Raw -Encoding UTF8

# Titles and descriptions
$content = $content -replace 'Como funcionam as Fun[çc][õo]es\?', 'How Do Functions Work?'
$content = $content -replace 'Entenda o conceito de .Escopo. e .Call Stack.*\. Veja como vari[áa]veis s[ãa]o criadas e destru[íi]das\.', 'Understand the concepts of Scope and Call Stack. See how variables are created and destroyed.'

# Function names in code
$content = $content -replace 'function somar\(', 'function sum('
$content = $content -replace 'somar\(', 'sum('

# Variable names
$content = $content -replace '\bresultado\b', 'result'

# Explanations
$content = $content -replace 'O programa come[çc]a\. O interpretador l[êe] as defini[çc][õo]es das fun[çc][õo]es, mas nada [ée] executado at[ée] chamarmos algu[ée]m\.', 'The program starts. The interpreter reads function definitions, but nothing executes until we call something.'
$content = $content -replace 'A fun[çc][ãa]o .main\(\). [ée] chamada\. Um novo .Stack Frame. \(quadro\) [ée] criado na pilha de mem[óo]ria para ela\.', 'The main() function is called. A new Stack Frame is created on the memory stack for it.'
$content = $content -replace 'A fun[çc][ãa]o .somar. [ée] chamada\. Um NOVO quadro [ée] colocado NO TOPO da pilha\. Os valores de x e y s[ãa]o copiados\.', 'The sum function is called. A NEW frame is placed ON TOP of the stack. The x and y values are copied.'
$content = $content -replace 'O c[áa]lculo [ée] feito e armazenado na vari[áa]vel local .resultado.\.', 'The calculation is performed and stored in the local variable result.'
$content = $content -replace 'A fun[çc][ãa]o .somar. retorna 8\. Seu quadro [ée] DESTRU[ÍI]DO\. A mem[óo]ria [ée] liberada\.', 'The sum function returns 8. Its frame is DESTROYED. Memory is freed.'
$content = $content -replace 'O valor retornado [ée] armazenado na vari[áa]vel .total. do quadro da main\.', 'The returned value is stored in the total variable of the main frame.'
$content = $content -replace 'Imprime o valor de .total. no console\.', 'Prints the total value to the console.'
$content = $content -replace 'A fun[çc][ãa]o main termina\. Seu quadro [ée] removido\. A pilha fica vazia\. Programa finalizado!', 'The main function ends. Its frame is removed. The stack is empty. Program finished!'

# Difficulty levels
$content = $content -replace 'Iniciante', 'Beginner'
$content = $content -replace 'Interm[ée]dio', 'Intermediate'
$content = $content -replace 'Avan[çc]ado', 'Advanced'

Set-Content $lessonsFile $content -Encoding UTF8 -NoNewline

# ============================================
# EXERCISES.TSX and EXERCISES-SIMPLE.TSX
# ============================================
$files = @("client\src\components\exercises.tsx", "client\src\components\exercises-simple.tsx")
foreach ($file in $files) {
    $content = Get-Content $file -Raw -Encoding UTF8
    $content = $content -replace 'Iniciou um la[çc]o:', 'Started a loop:'
    $content = $content -replace 'Exerc[íi]cios', 'Exercises'
    $content = $content -replace 'Voltar ao in[íi]cio', 'Back to start'
    Set-Content $file $content -Encoding UTF8 -NoNewline
}

# ============================================
# LESSON.TSX
# ============================================
$lessonFile = "client\src\pages\lesson.tsx"
$content = Get-Content $lessonFile -Raw -Encoding UTF8
$content = $content -replace 'Aqui vivem os dados complexos: Objetos, Arrays e Classes\. Eles s[ãa]o grandes demais para a Pilha, ent[ãa]o ficam aqui e s[ãa]o acessados por "refer[êe]ncia" \(flechas invis[íi]veis\)\.', 'Complex data lives here: Objects, Arrays and Classes. They are too large for the Stack, so they stay here and are accessed by "reference" (invisible arrows).'
Set-Content $lessonFile $content -Encoding UTF8 -NoNewline

# ============================================
# PLAYGROUND.TSX
# ============================================
$playgroundFile = "client\src\components\playground.tsx"
$content = Get-Content $playgroundFile -Raw -Encoding UTF8
$content = $content -replace 'Ir para in[íi]cio', 'Go to start'
Set-Content $playgroundFile $content -Encoding UTF8 -NoNewline

# ============================================
# HEAP-MEMORY.TSX
# ============================================
$heapFile = "client\src\components\visualizer\heap-memory.tsx"
$content = Get-Content $heapFile -Raw -Encoding UTF8
$content = $content -replace 'Heap Memory \(Objetos\)', 'Heap Memory (Objects)'
Set-Content $heapFile $content -Encoding UTF8 -NoNewline

Write-Host "✅ ALL content translated to English!"
