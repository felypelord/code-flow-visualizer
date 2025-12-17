# PowerShell script to translate ALL remaining Portuguese text to English
$file = "client\src\lib\exercises.ts"
$content = Get-Content $file -Raw -Encoding UTF8

Write-Host "Translating all remaining Portuguese content..."

# Descriptions
$content = $content -replace 'Escreva uma fun\?\?o que recebe dois n\?meros e retorna a soma deles\.', 'Write a function that takes two numbers and returns their sum.'
$content = $content -replace 'Determine se um n\?mero \? par ou \?mpar\.', 'Determine if a number is even or odd.'
$content = $content -replace 'Encontre o maior n\?mero em um array\.', 'Find the largest number in an array.'
$content = $content -replace 'Inverta os caracteres de uma string\.', 'Reverse the characters in a string.'
$content = $content -replace 'Conte quantas vogais existem em uma string\.', 'Count how many vowels exist in a string.'
$content = $content -replace 'Verifique se uma palavra \? um pal\?ndromo\.', 'Check if a word is a palindrome.'
$content = $content -replace 'Calcule o fatorial de um n\?mero\.', 'Calculate the factorial of a number.'
$content = $content -replace 'Gere a sequ\?ncia de Fibonacci at\? N termos\.', 'Generate the Fibonacci sequence up to N terms.'
$content = $content -replace 'Remova duplicatas de um array\.', 'Remove duplicates from an array.'
$content = $content -replace 'Ordene um array de n\?meros\.', 'Sort an array of numbers.'
$content = $content -replace 'Encontre o segundo maior elemento\.', 'Find the second largest element.'
$content = $content -replace 'Fa\?a uma busca bin\?ria em um array ordenado\.', 'Perform a binary search on a sorted array.'
$content = $content -replace 'Fa\?a merge de dois arrays ordenados\.', 'Merge two sorted arrays.'
$content = $content -replace 'Encontre todos os n\?meros primos at\? N\.', 'Find all prime numbers up to N.'
$content = $content -replace 'Encontre pares que somam um valor alvo\.', 'Find pairs that sum to a target value.'
$content = $content -replace 'Rotacione um array K posi\?\?es\.', 'Rotate an array K positions.'
$content = $content -replace 'Encontre o maior produto de dois n\?meros\.', 'Find the largest product of two numbers.'
$content = $content -replace 'Verifique se par\?nteses est\?o balanceados\.', 'Check if parentheses are balanced.'
$content = $content -replace 'Implemente uma pilha \(Stack\)\.', 'Implement a stack.'
$content = $content -replace 'Converta decimal para bin\?rio\.', 'Convert decimal to binary.'

# Additional comments that might remain
$content = $content -replace 'Retorne "par" ou "\?mpar"', 'Return "even" or "odd"'
$content = $content -replace 'Retorne true se for pal\?ndromo', 'Return true if palindrome'
$content = $content -replace 'Use recurs\?o ou loop', 'Use recursion or loop'
$content = $content -replace 'Dica:', 'Hint:'

Set-Content $file $content -Encoding UTF8 -NoNewline

Write-Host "All Portuguese content translated to English!"
