# Development startup script
$env:JWT_SECRET = "dev-secret-12345"
$env:DATABASE_URL = "postgresql://postgres:felype.BARRETO10@localhost:5432/codeflow"
$env:NODE_ENV = "development"

Write-Host "Starting development server..."
Write-Host "JWT_SECRET: set"
Write-Host "DATABASE_URL: set"
Write-Host "NODE_ENV: $($env:NODE_ENV)"
Write-Host ""

npm run dev
