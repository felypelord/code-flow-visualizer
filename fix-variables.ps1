# PowerShell script to translate ALL variable names from Portuguese to English
$file = "client\src\lib\exercises.ts"
$content = Get-Content $file -Raw -Encoding UTF8

Write-Host "Translating all Portuguese variable names to English..."

# Function names and parameters
$content = $content -replace 'somar\(', 'sum('
$content = $content -replace 'inverterstr\(', 'reverseString('
$content = $content -replace 'inverter_str\(', 'reverse_string('
$content = $content -replace 'Inverterstr\(', 'ReverseString('

# Variable names
$content = $content -replace '\btexto\b', 'text'
$content = $content -replace '\bresultado\b', 'result'
$content = $content -replace '\bnumero\b', 'number'
$content = $content -replace '\bnumeros\b', 'numbers'
$content = $content -replace '\bvalor\b', 'value'
$content = $content -replace '\bvalores\b', 'values'
$content = $content -replace '\blista\b', 'list'
$content = $content -replace '\barray\b', 'array'

# Comments in Portuguese (more comprehensive)
$content = $content -replace 'Seu c\?digo aqui', 'Your code here'
$content = $content -replace 'Use o operador \+ para somar os par\?metros', 'Use the + operator to add the parameters'
$content = $content -replace 'Use array\.Reverse\(\) ou um loop', 'Use Array.Reverse() or a loop'
$content = $content -replace 'Use um loop no array de caracteres', 'Use a loop on the character array'

# Class and function names in code
$content = $content -replace 'class Programa', 'class Program'
$content = $content -replace 'strBuilder', 'StringBuilder'
$content = $content -replace 'tostr\(\)', 'toString()'
$content = $content -replace 'Chararray\(\)', 'ToCharArray()'

# Fix "str" type back to "string" for C#/Java
$content = $content -replace 'static str Inverter', 'static string Reverse'
$content = $content -replace 'static str inverter', 'static string reverse'
$content = $content -replace 'str texto', 'string text'
$content = $content -replace 'str\[\] args', 'string[] args'
$content = $content -replace 'countVowels\(str ', 'countVowels(string '
$content = $content -replace 'new str\(', 'new string('

# Fix include directives
$content = $content -replace '#include <str\.h>', '#include <string.h>'

Set-Content $file $content -Encoding UTF8 -NoNewline

Write-Host "Variable translation completed!"
