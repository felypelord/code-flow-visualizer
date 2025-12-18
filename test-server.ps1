Set-Location "c:\Users\Al-inglity\Downloads\site codeflow\Code-Flow-Visualizer"
$env:JWT_SECRET="dev-secret-12345"
$env:DATABASE_URL="postgresql://postgres:felype.BARRETO10@localhost:5432/codeflow"
$env:NODE_ENV="development"

Write-Host "Starting server test..."
npm run dev
