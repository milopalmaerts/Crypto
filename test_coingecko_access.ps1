# Comprehensive CoinGecko API Test Script
# Tests multiple approaches to resolve ERR_BLOCKED_BY_CLIENT

Write-Host "🧪 Testing CoinGecko API Access Methods" -ForegroundColor Cyan
Write-Host "=======================================" -ForegroundColor Cyan

# Test 1: Backend API via localhost
Write-Host "`n1. Testing Backend API (localhost:3001)..." -ForegroundColor Yellow
try {
    $response1 = Invoke-RestMethod -Uri "http://localhost:3001/api/coins" -Method GET -TimeoutSec 5
    Write-Host "✅ localhost:3001 SUCCESS! Received $($response1.length) coins" -ForegroundColor Green
} catch {
    Write-Host "❌ localhost:3001 FAILED: $($_.Exception.Message)" -ForegroundColor Red
}

# Test 2: Backend API via 127.0.0.1 (often bypasses ad blockers)
Write-Host "`n2. Testing Backend API (127.0.0.1:3001)..." -ForegroundColor Yellow
try {
    $response2 = Invoke-RestMethod -Uri "http://127.0.0.1:3001/api/coins" -Method GET -TimeoutSec 5
    Write-Host "✅ 127.0.0.1:3001 SUCCESS! Received $($response2.length) coins" -ForegroundColor Green
} catch {
    Write-Host "❌ 127.0.0.1:3001 FAILED: $($_.Exception.Message)" -ForegroundColor Red
}

# Test 3: Direct CoinGecko API (bypasses backend completely)
Write-Host "`n3. Testing Direct CoinGecko API..." -ForegroundColor Yellow
try {
    $response3 = Invoke-RestMethod -Uri "https://api.coingecko.com/api/v3/coins/markets?vs_currency=usd&order=market_cap_desc&per_page=5&page=1&sparkline=false" -Method GET -TimeoutSec 10
    Write-Host "✅ Direct CoinGecko SUCCESS! Received $($response3.length) coins" -ForegroundColor Green
} catch {
    Write-Host "❌ Direct CoinGecko FAILED: $($_.Exception.Message)" -ForegroundColor Red
}

# Test 4: Backend Health Check
Write-Host "`n4. Testing Backend Health Check..." -ForegroundColor Yellow
try {
    $healthResponse = Invoke-RestMethod -Uri "http://localhost:3001/health" -Method GET -TimeoutSec 5
    Write-Host "✅ Backend Health: $($healthResponse.status)" -ForegroundColor Green
} catch {
    Write-Host "❌ Backend Health FAILED: $($_.Exception.Message)" -ForegroundColor Red
}

Write-Host "`n📋 Summary and Solutions:" -ForegroundColor Cyan
Write-Host "=========================" -ForegroundColor Cyan
Write-Host "If localhost:3001 failed but 127.0.0.1:3001 worked:" -ForegroundColor Yellow
Write-Host "  → Your ad blocker is blocking localhost requests" -ForegroundColor White
Write-Host "  → Solution: Use 127.0.0.1 instead of localhost" -ForegroundColor Green
Write-Host ""
Write-Host "If both backend tests failed but direct CoinGecko worked:" -ForegroundColor Yellow
Write-Host "  → Backend is down or ad blocker blocks all localhost" -ForegroundColor White
Write-Host "  → Solution: Use direct CoinGecko API calls" -ForegroundColor Green
Write-Host ""
Write-Host "If everything failed:" -ForegroundColor Yellow
Write-Host "  → Check internet connection and firewall settings" -ForegroundColor White
Write-Host "  → Try disabling browser extensions temporarily" -ForegroundColor Green

# Browser-specific instructions
Write-Host "`n🌐 Browser Solutions:" -ForegroundColor Cyan
Write-Host "Chrome: chrome://settings/content/insecureContent → Add localhost:*" -ForegroundColor Gray
Write-Host "Firefox: about:config → network.dns.disableIPv6 → true" -ForegroundColor Gray
Write-Host "Edge: Settings → Cookies and site permissions → Add localhost" -ForegroundColor Gray