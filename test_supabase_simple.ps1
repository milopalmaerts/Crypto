# Quick Supabase Test - Fixed
Write-Host "=== Testing Supabase Setup ===" -ForegroundColor Green
Write-Host ""

# Check if we're in the right directory
if (-not (Test-Path "backend/server.supabase.js")) {
    Write-Host "Please run this from the project root directory" -ForegroundColor Red
    exit 1
}

# Check if service role key is set
Write-Host "1. Checking environment..." -ForegroundColor Yellow
if (-not (Test-Path "backend/.env")) {
    Write-Host "   Backend .env file not found" -ForegroundColor Red
    Write-Host "   You need your Supabase SERVICE ROLE KEY:" -ForegroundColor Cyan
    Write-Host "   1. Go to: https://supabase.com/dashboard/project/fnggwmxkdgwxsbjekics/settings/api" -ForegroundColor White
    Write-Host "   2. Copy the 'service_role' key (NOT the anon key)" -ForegroundColor White
    Write-Host ""
    
    $serviceKey = Read-Host "   Paste your SERVICE ROLE key here"
    
    if ([string]::IsNullOrWhiteSpace($serviceKey)) {
        Write-Host "   Service role key is required!" -ForegroundColor Red
        exit 1
    }
    
    # Create .env file
    $envContent = @"
SUPABASE_URL=https://fnggwmxkdgwxsbjekics.supabase.co
SUPABASE_SERVICE_ROLE_KEY=$serviceKey
JWT_SECRET=crypto-jwt-$(Get-Random -Minimum 100000 -Maximum 999999)
PORT=3001
"@
    $envContent | Out-File -FilePath "backend/.env" -Encoding UTF8
    Write-Host "   Environment file created" -ForegroundColor Green
} else {
    Write-Host "   Environment file found" -ForegroundColor Green
}

Write-Host ""
Write-Host "2. Installing dependencies..." -ForegroundColor Yellow
cd backend
npm install @supabase/supabase-js
Write-Host "   Dependencies installed" -ForegroundColor Green

Write-Host ""
Write-Host "3. Starting backend test..." -ForegroundColor Yellow
Write-Host "   Manual steps:" -ForegroundColor Cyan
Write-Host "   1. Open a new terminal" -ForegroundColor White
Write-Host "   2. Run: cd backend" -ForegroundColor White
Write-Host "   3. Run: node server.supabase.js" -ForegroundColor White
Write-Host "   4. Test health: http://127.0.0.1:3001/health" -ForegroundColor White
Write-Host ""
Write-Host "   Then start frontend:" -ForegroundColor Cyan
Write-Host "   1. Open another terminal" -ForegroundColor White
Write-Host "   2. Run: cd client" -ForegroundColor White
Write-Host "   3. Run: npm run dev" -ForegroundColor White
Write-Host "   4. Open: http://localhost:8082" -ForegroundColor White
Write-Host ""
Write-Host "=== Ready to Test! ===" -ForegroundColor Green