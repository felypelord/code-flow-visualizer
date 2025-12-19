# Script para ativar Pro em conta existente

Write-Host "=== Ativando Pro Account ===" -ForegroundColor Cyan

# Ler DATABASE_URL do .env
$databaseUrl = Get-Content .env | Where-Object { $_ -match '^DATABASE_URL=' } | ForEach-Object { $_ -replace '^DATABASE_URL=','' } | Select-Object -First 1

if (!$databaseUrl) {
    Write-Host "ERROR: DATABASE_URL not found in .env" -ForegroundColor Red
    exit 1
}

Write-Host "Database URL found" -ForegroundColor Green

# Pegar email do usuário
$email = Read-Host "Digite o email da conta para ativar Pro"

if (!$email) {
    Write-Host "ERROR: Email não fornecido" -ForegroundColor Red
    exit 1
}

Write-Host "Conectando ao banco de dados..." -ForegroundColor Yellow

# Executar query SQL diretamente via psql
$env:PGPASSWORD = if ($databaseUrl -match "://[^:]+:([^@]+)@") { $matches[1] } else { "" }
$dbHost = if ($databaseUrl -match "@([^:]+):") { $matches[1] } else { "localhost" }
$port = if ($databaseUrl -match ":(\d+)/") { $matches[1] } else { "5432" }
$database = if ($databaseUrl -match "/([^?]+)") { $matches[1] } else { "codeflow" }
$dbUser = if ($databaseUrl -match "://([^:]+):") { $matches[1] } else { "postgres" }

Write-Host "Host: $dbHost" -ForegroundColor Gray
Write-Host "Port: $port" -ForegroundColor Gray
Write-Host "Database: $database" -ForegroundColor Gray
Write-Host "User: $dbUser" -ForegroundColor Gray

# SQL query para update
$sqlQuery = "UPDATE users SET is_pro = true WHERE email = '$email'; SELECT email, is_pro FROM users WHERE email = '$email';"

# Executar via psql
try {
    Write-Host "`nExecutando UPDATE..." -ForegroundColor Yellow
    
    # Usar psql se disponível, senão usar Node.js
    $psqlPath = Get-Command psql -ErrorAction SilentlyContinue
    
    if ($psqlPath) {
        Write-Host "Usando psql..." -ForegroundColor Green
        Write-Output $sqlQuery | psql -h $dbHost -p $port -U $dbUser -d $database
    } else {
        Write-Host "psql não encontrado, usando Node.js..." -ForegroundColor Yellow
        
        # Criar script Node.js temporário
        $nodeScript = @"
const postgres = require('postgres');
const sql = postgres('$databaseUrl', { ssl: false });

(async () => {
  try {
    await sql``UPDATE users SET is_pro = true WHERE email = '$email'``;
    const result = await sql``SELECT email, is_pro FROM users WHERE email = '$email'``;
    console.log('✓ Updated successfully!');
    console.log('Result:', result);
    await sql.end();
    process.exit(0);
  } catch (err) {
    console.error('✗ Error:', err);
    process.exit(1);
  }
})();
"@
        
        $nodeScript | Out-File -FilePath "temp-fix-pro.js" -Encoding UTF8
        node temp-fix-pro.js
        Remove-Item "temp-fix-pro.js" -ErrorAction SilentlyContinue
    }
    
    Write-Host "`n✓ Conta atualizada para Pro!" -ForegroundColor Green
    Write-Host "Faça logout e login novamente para ver as mudanças." -ForegroundColor Cyan
    
} catch {
    Write-Host "`n✗ Erro ao atualizar conta: $_" -ForegroundColor Red
    exit 1
}
