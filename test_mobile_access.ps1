# Test mobile access to the application
Write-Host "Testing EindRersult Mobile Access" -ForegroundColor Green
Write-Host "=================================" -ForegroundColor Green

# Test network IP health endpoint
$networkIP = "192.168.0.131"
$backendUrl = "http://${networkIP}:3001"
$frontendUrl = "http://${networkIP}:8082"

Write-Host "`nTesting Backend Health (for mobile access)..." -ForegroundColor Yellow
try {
    $healthResponse = Invoke-RestMethod -Uri "$backendUrl/health" -Method GET -TimeoutSec 5
    Write-Host "✓ Backend accessible at $backendUrl" -ForegroundColor Green
    Write-Host "  Status: $($healthResponse.status)"
    Write-Host "  Firebase: $($healthResponse.firebase)"
    Write-Host "  CORS: $($healthResponse.cors)"
} catch {
    Write-Host "✗ Backend NOT accessible at $backendUrl" -ForegroundColor Red
    Write-Host "  Error: $($_.Exception.Message)"
}

Write-Host "`nMobile Access Instructions:" -ForegroundColor Cyan
Write-Host "===========================" -ForegroundColor Cyan
Write-Host "1. Make sure your phone is connected to the same WiFi network"
Write-Host "2. Open a browser on your phone"
Write-Host "3. Navigate to: $frontendUrl" -ForegroundColor White
Write-Host "4. You should now be able to:"
Write-Host "   - See cryptocurrency prices"
Write-Host "   - Register a new account"
Write-Host "   - Login with existing credentials"
Write-Host "   - Add crypto holdings to your portfolio"

Write-Host "`nCurrent Status:" -ForegroundColor Magenta
Write-Host "Backend: http://${networkIP}:3001"
Write-Host "Frontend: http://${networkIP}:8082"
Write-Host "Ready for mobile access!" -ForegroundColor Green