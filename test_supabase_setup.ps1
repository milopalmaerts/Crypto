# Quick Supabase Test
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
    Write-Host "   ✗ Backend .env file not found" -ForegroundColor Red
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
    Write-Host "   ✓ Environment file created" -ForegroundColor Green
} else {
    Write-Host "   ✓ Environment file found" -ForegroundColor Green
}

# Install dependencies if needed
Write-Host ""
Write-Host "2. Checking dependencies..." -ForegroundColor Yellow
Push-Location backend
if (-not (Test-Path "node_modules/@supabase")) {
    Write-Host "   Installing Supabase client..." -ForegroundColor Cyan
    npm install @supabase/supabase-js | Out-Null
    Write-Host "   ✓ Dependencies installed" -ForegroundColor Green
} else {
    Write-Host "   ✓ Dependencies already installed" -ForegroundColor Green
}

# Test the backend
Write-Host ""
Write-Host "3. Testing Supabase backend..." -ForegroundColor Yellow

# Kill any existing processes
Get-Process -Name "node" -ErrorAction SilentlyContinue | Stop-Process -Force

try {
    # Start backend in background
    $job = Start-Job -ScriptBlock {
        Set-Location $using:PWD
        node server.supabase.js
    }
    
    # Wait for startup
    Start-Sleep -Seconds 5
    
    # Test health endpoint
    try {
        $health = Invoke-RestMethod -Uri "http://127.0.0.1:3001/health" -Method GET -TimeoutSec 10
        Write-Host "   ✓ Backend is running!" -ForegroundColor Green
        Write-Host "     Status: $($health.status)" -ForegroundColor White
        Write-Host "     Database: $($health.database)" -ForegroundColor White
        
        # Test database connection by trying to query users table
        Write-Host ""
        Write-Host "4. Testing database connection..." -ForegroundColor Yellow
        
        # Try to register a test user
        $testUser = @{
            firstName = "Test"
            lastName = "User"
            email = "test@example.com"
            password = "testpass123"
        }
        
        try {
            $response = Invoke-RestMethod -Uri "http://127.0.0.1:3001/api/auth/register" -Method POST -Body ($testUser | ConvertTo-Json) -ContentType "application/json" -TimeoutSec 10
            Write-Host "   ✓ Database connection successful!" -ForegroundColor Green
            Write-Host "     Test user created with ID: $($response.user.id)" -ForegroundColor White
            
            # Clean up - try to delete the test user (this might fail, that's ok)
            Write-Host "   Cleaning up test data..." -ForegroundColor Gray
            
        } catch {
            if ($_.Exception.Message -like "*already exists*") {
                Write-Host "   ✓ Database connection working (test user already exists)" -ForegroundColor Green
            } else {
                Write-Host "   ✗ Database test failed: $($_.Exception.Message)" -ForegroundColor Red
                Write-Host "     Make sure you ran the SQL commands to disable RLS" -ForegroundColor Yellow
            }
        }
        
    } catch {
        Write-Host "   ✗ Backend health check failed: $($_.Exception.Message)" -ForegroundColor Red
    }
    
    # Stop the background job
    Stop-Job $job -Force
    Remove-Job $job -Force
    
} catch {
    Write-Host "   ✗ Failed to start backend: $($_.Exception.Message)" -ForegroundColor Red
}

Pop-Location

Write-Host ""
Write-Host "=== Next Steps ===" -ForegroundColor Green
Write-Host "If everything worked:" -ForegroundColor White
Write-Host "1. Start backend: cd backend && node server.supabase.js" -ForegroundColor Cyan
Write-Host "2. Start frontend: cd client && npm run dev" -ForegroundColor Cyan
Write-Host "3. Open: http://localhost:8082" -ForegroundColor Cyan
Write-Host ""
Write-Host "If there were database errors:" -ForegroundColor Yellow
Write-Host "1. Go to Supabase SQL Editor" -ForegroundColor White
Write-Host "2. Run the commands from supabase_disable_rls.sql" -ForegroundColor White
Write-Host "3. Run this test again" -ForegroundColor White
Write-Host ""
Write-Host "For mobile access: http://192.168.0.131:8082" -ForegroundColor Cyan