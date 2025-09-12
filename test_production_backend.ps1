# Test the deployed Railway backend
$apiUrl = "https://cryptoportfolio-production.up.railway.app"

Write-Host "Testing deployed backend at: $apiUrl" -ForegroundColor Cyan

# Test health endpoint
Write-Host "`n1. Testing /health endpoint..." -ForegroundColor Yellow
try {
    $healthResponse = Invoke-RestMethod -Uri "$apiUrl/health" -Method GET -TimeoutSec 10
    Write-Host "✅ Health check successful!" -ForegroundColor Green
    Write-Host "Response: $($healthResponse | ConvertTo-Json -Depth 2)" -ForegroundColor Cyan
} catch {
    Write-Host "❌ Health check failed!" -ForegroundColor Red
    Write-Host "Error: $($_.Exception.Message)" -ForegroundColor Yellow
}

# Test coins endpoint
Write-Host "`n2. Testing /api/coins endpoint..." -ForegroundColor Yellow
try {
    $coinsResponse = Invoke-RestMethod -Uri "$apiUrl/api/coins" -Method GET -TimeoutSec 10
    Write-Host "✅ Coins endpoint successful!" -ForegroundColor Green
    Write-Host "Received $($coinsResponse.length) coins" -ForegroundColor Cyan
} catch {
    Write-Host "❌ Coins endpoint failed!" -ForegroundColor Red
    Write-Host "Error: $($_.Exception.Message)" -ForegroundColor Yellow
}

Write-Host "`n🚀 Backend deployed at: $apiUrl" -ForegroundColor Green