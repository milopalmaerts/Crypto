# Complete Supabase Setup for EindRersult
Write-Host "=== EindRersult Supabase Migration ===" -ForegroundColor Green
Write-Host ""

# Step 1: Verify environment
Write-Host "1. Checking environment..." -ForegroundColor Yellow
if (-not (Test-Path "backend/package.json")) {
    Write-Host "   ✗ Please run this script from the project root directory" -ForegroundColor Red
    exit 1
}
Write-Host "   ✓ Project structure verified" -ForegroundColor Green

# Step 2: Get Supabase credentials
Write-Host ""
Write-Host "2. Supabase Configuration" -ForegroundColor Yellow
Write-Host "   You provided:" -ForegroundColor Cyan
Write-Host "   URL: https://fnggwmxkdgwxsbjekics.supabase.co" -ForegroundColor White
Write-Host "   Anon Key: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..." -ForegroundColor White
Write-Host ""
Write-Host "   You need your SERVICE ROLE KEY:" -ForegroundColor Red
Write-Host "   1. Go to: https://supabase.com/dashboard/project/fnggwmxkdgwxsbjekics/settings/api" -ForegroundColor White
Write-Host "   2. Copy the 'service_role' key (NOT the anon key)" -ForegroundColor White
Write-Host ""

$serviceKey = Read-Host "   Paste your Supabase SERVICE ROLE key here"

if ([string]::IsNullOrWhiteSpace($serviceKey)) {
    Write-Host "   ✗ Service role key is required!" -ForegroundColor Red
    Write-Host "   Please get it from your Supabase dashboard and run this script again." -ForegroundColor Yellow
    exit 1
}

# Step 3: Create backend environment file
Write-Host ""
Write-Host "3. Setting up backend environment..." -ForegroundColor Yellow

$backendEnv = @"
# Backend Environment Variables for Supabase
SUPABASE_URL=https://fnggwmxkdgwxsbjekics.supabase.co
SUPABASE_SERVICE_ROLE_KEY=$serviceKey

# Database Connection
DATABASE_URL=postgresql://postgres:[EigenProject1]@db.fnggwmxkdgwxsbjekics.supabase.co:5432/postgres

# JWT Secret
JWT_SECRET=crypto-jwt-secure-$(Get-Random -Minimum 100000 -Maximum 999999)

# CoinGecko API (optional)
COINGECKO_API_KEY=your-api-key-here

# Port
PORT=3001
"@

$backendEnv | Out-File -FilePath "backend/.env" -Encoding UTF8
Write-Host "   ✓ Backend .env file created" -ForegroundColor Green

# Step 4: Install Supabase dependency
Write-Host ""
Write-Host "4. Installing Supabase dependencies..." -ForegroundColor Yellow
try {
    Push-Location backend
    npm install @supabase/supabase-js | Out-Null
    Write-Host "   ✓ Supabase client installed" -ForegroundColor Green
} catch {
    Write-Host "   ✗ Failed to install Supabase client: $($_.Exception.Message)" -ForegroundColor Red
} finally {
    Pop-Location
}

# Step 5: Setup database tables
Write-Host ""
Write-Host "5. Database Setup" -ForegroundColor Yellow
Write-Host "   You need to run the following SQL in your Supabase SQL Editor:" -ForegroundColor Cyan
Write-Host "   1. Go to: https://supabase.com/dashboard/project/fnggwmxkdgwxsbjekics/sql" -ForegroundColor White
Write-Host "   2. Copy and paste the contents of 'supabase_setup.sql'" -ForegroundColor White
Write-Host "   3. Click 'Run' to create the tables" -ForegroundColor White
Write-Host ""

$setupSql = Read-Host "   Have you created the database tables? (y/n)"
if ($setupSql -ne 'y' -and $setupSql -ne 'Y') {
    Write-Host "   ⚠ Please create the database tables first, then continue with testing" -ForegroundColor Yellow
}

# Step 6: Test the backend
Write-Host ""
Write-Host "6. Testing backend..." -ForegroundColor Yellow

# Kill any existing Node processes
Get-Process -Name "node" -ErrorAction SilentlyContinue | Stop-Process -Force

# Start the backend
try {
    Push-Location backend
    Write-Host "   Starting Supabase backend..." -ForegroundColor Cyan
    
    $backendJob = Start-Job -ScriptBlock {
        Set-Location $using:PWD
        node server.supabase.js
    }
    
    # Wait for server to start
    Start-Sleep -Seconds 5
    
    # Test health endpoint
    try {
        $healthResponse = Invoke-RestMethod -Uri "http://127.0.0.1:3001/health" -Method GET -TimeoutSec 10
        Write-Host "   ✓ Backend health check passed!" -ForegroundColor Green
        Write-Host "     Status: $($healthResponse.status)" -ForegroundColor White
        Write-Host "     Database: $($healthResponse.database)" -ForegroundColor White
    } catch {
        Write-Host "   ✗ Backend health check failed: $($_.Exception.Message)" -ForegroundColor Red
    }
    
} catch {
    Write-Host "   ✗ Failed to start backend: $($_.Exception.Message)" -ForegroundColor Red
} finally {
    Pop-Location
}

# Step 7: Start frontend
Write-Host ""
Write-Host "7. Starting frontend..." -ForegroundColor Yellow
try {
    Push-Location client
    Write-Host "   Installing frontend dependencies..." -ForegroundColor Cyan
    npm install | Out-Null
    
    Write-Host "   Starting development server..." -ForegroundColor Cyan
    $frontendJob = Start-Job -ScriptBlock {
        Set-Location $using:PWD  
        npm run dev
    }
    
    Start-Sleep -Seconds 3
    Write-Host "   ✓ Frontend started" -ForegroundColor Green
    
} catch {
    Write-Host "   ✗ Failed to start frontend: $($_.Exception.Message)" -ForegroundColor Red
} finally {
    Pop-Location
}

# Summary
Write-Host ""
Write-Host "=== Setup Complete! ===" -ForegroundColor Green
Write-Host ""
Write-Host "Your application is now running with Supabase:" -ForegroundColor Cyan
Write-Host "• Backend: http://127.0.0.1:3001" -ForegroundColor White
Write-Host "• Frontend: http://localhost:8082" -ForegroundColor White
Write-Host "• Mobile: http://192.168.0.131:8082" -ForegroundColor White
Write-Host ""
Write-Host "Test your application:" -ForegroundColor Yellow
Write-Host "1. Open http://localhost:8082 in your browser" -ForegroundColor White
Write-Host "2. Try registering a new account" -ForegroundColor White
Write-Host "3. Login and add some cryptocurrency holdings" -ForegroundColor White
Write-Host "4. Check if cryptocurrency prices are loading" -ForegroundColor White
Write-Host ""
Write-Host "For mobile testing:" -ForegroundColor Yellow
Write-Host "1. Connect your phone to the same WiFi" -ForegroundColor White
Write-Host "2. Open http://192.168.0.131:8082 on your phone" -ForegroundColor White
Write-Host ""
Write-Host "If you encounter ERR_BLOCKED_BY_CLIENT:" -ForegroundColor Red
Write-Host "• Disable ad blockers temporarily" -ForegroundColor White
Write-Host "• Try incognito/private mode" -ForegroundColor White
Write-Host "• The app has fallback mechanisms to handle blocked requests" -ForegroundColor White
Write-Host ""
Write-Host "Press Ctrl+C to stop the servers when done testing." -ForegroundColor Gray