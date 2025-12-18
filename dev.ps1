# Development startup script
$env:JWT_SECRET = "dev-secret-change-in-production"
$env:DATABASE_URL = "postgresql://postgres:felype.BARRETO10@localhost:5432/codeflow"
$env:NODE_ENV = "development"
# Stripe test placeholders (replace with your test keys when available)
$env:STRIPE_SECRET_KEY = $env:STRIPE_SECRET_KEY -or "sk_test_CHANGE_ME"
$env:STRIPE_PRICE_PRO_MONTHLY_USD = $env:STRIPE_PRICE_PRO_MONTHLY_USD -or "price_CHANGE_ME"
$env:STRIPE_WEBHOOK_SECRET = $env:STRIPE_WEBHOOK_SECRET -or "whsec_CHANGE_ME"
$env:PUBLIC_BASE_URL = $env:PUBLIC_BASE_URL -or "http://localhost:5000"

Write-Host "Starting development server..."
Write-Host "JWT_SECRET: set"
Write-Host "DATABASE_URL: set"
Write-Host "NODE_ENV: $($env:NODE_ENV)"
Write-Host "STRIPE_SECRET_KEY: $([string]::IsNullOrWhiteSpace($env:STRIPE_SECRET_KEY) -ne $true)"
Write-Host "STRIPE_PRICE_PRO_MONTHLY_USD: $([string]::IsNullOrWhiteSpace($env:STRIPE_PRICE_PRO_MONTHLY_USD) -ne $true)"
Write-Host "STRIPE_WEBHOOK_SECRET: $([string]::IsNullOrWhiteSpace($env:STRIPE_WEBHOOK_SECRET) -ne $true)"
Write-Host "PUBLIC_BASE_URL: $($env:PUBLIC_BASE_URL)"
Write-Host ""

if ($env:STRIPE_SECRET_KEY -like "*CHANGE_ME*" -or $env:STRIPE_PRICE_PRO_MONTHLY_USD -like "*CHANGE_ME*" -or $env:STRIPE_WEBHOOK_SECRET -like "*CHANGE_ME*") {
	Write-Host "[dev.ps1] Stripe envs are placeholders. Set STRIPE_SECRET_KEY, STRIPE_PRICE_PRO_MONTHLY_USD, STRIPE_WEBHOOK_SECRET before running checkout/webhooks." -ForegroundColor Yellow
}

npm run dev
