# Test CORS with the production frontend origin
$headers = @{
    'Origin' = 'https://cryptoportfolio-psi.vercel.app'
    'Content-Type' = 'application/json'
}

Write-Host "Testing CORS for Vercel origin..."
try {
    $response = Invoke-RestMethod -Uri "http://localhost:3001/health" -Method GET -Headers $headers -TimeoutSec 10
    Write-Host "✅ CORS Test Successful!" -ForegroundColor Green
    Write-Host "Response: $($response | ConvertTo-Json -Depth 2)" -ForegroundColor Cyan
} catch {
    Write-Host "❌ CORS Test Failed!" -ForegroundColor Red
    Write-Host "Error: $($_.Exception.Message)" -ForegroundColor Yellow
}

Write-Host "`nTesting API endpoints..."
try {
    $coinsResponse = Invoke-RestMethod -Uri "http://localhost:3001/api/coins" -Method GET -Headers $headers -TimeoutSec 10
    Write-Host "✅ /api/coins endpoint works!" -ForegroundColor Green
} catch {
    Write-Host "❌ /api/coins endpoint failed!" -ForegroundColor Red
    Write-Host "Error: $($_.Exception.Message)" -ForegroundColor Yellow
}