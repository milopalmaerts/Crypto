# Update Supabase Environment - Interactive Setup
Write-Host "=== Supabase Service Role Key Setup ===" -ForegroundColor Green
Write-Host ""

Write-Host "You have the anon key (for client-side):" -ForegroundColor Cyan
Write-Host "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZuZ2d3bXhrZGd3eHNiamVraWNzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTc1Mjg1NjUsImV4cCI6MjA3MzEwNDU2NX0.EGubRmswEmLJXqysazlvhmrfRdpqNMtsla3pBV_uSgk" -ForegroundColor Gray
Write-Host ""

Write-Host "Now you need the SERVICE ROLE key (for backend):" -ForegroundColor Yellow
Write-Host "1. Go to: https://supabase.com/dashboard/project/fnggwmxkdgwxsbjekics/settings/api" -ForegroundColor White
Write-Host "2. Scroll down to find 'service_role' key" -ForegroundColor White
Write-Host "3. It should be much longer and start with 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...'" -ForegroundColor White
Write-Host "4. Copy that entire key" -ForegroundColor White
Write-Host ""

$serviceKey = Read-Host "Paste your SERVICE ROLE key here"

if ([string]::IsNullOrWhiteSpace($serviceKey)) {
    Write-Host "Service role key is required!" -ForegroundColor Red
    exit 1
}

# Validate it looks like a JWT token
if (-not $serviceKey.StartsWith("eyJ")) {
    Write-Host "Warning: This doesn't look like a JWT token. Make sure you copied the service_role key." -ForegroundColor Yellow
}

# Update the .env file
$envContent = @"
# Backend Environment Variables for Supabase
SUPABASE_URL=https://fnggwmxkdgwxsbjekics.supabase.co
SUPABASE_SERVICE_ROLE_KEY=$serviceKey

# Database Connection (for direct database access if needed)
DATABASE_URL=postgresql://postgres:[EigenProject1]@db.fnggwmxkdgwxsbjekics.supabase.co:5432/postgres

# JWT Secret
JWT_SECRET=crypto-jwt-$(Get-Random -Minimum 100000 -Maximum 999999)

# CoinGecko API (optional)
COINGECKO_API_KEY=your-api-key-here

# Port
PORT=3001
"@

$envContent | Out-File -FilePath "backend/.env" -Encoding UTF8

Write-Host ""
Write-Host "✓ Environment file updated!" -ForegroundColor Green
Write-Host ""

# Test the backend
Write-Host "Testing backend with new service key..." -ForegroundColor Yellow

# Kill existing processes
Get-Process -Name "node" -ErrorAction SilentlyContinue | Stop-Process -Force

# Start backend
Push-Location backend
try {
    $job = Start-Job -ScriptBlock {
        Set-Location $using:PWD
        node server.supabase.js
    }
    
    # Wait for startup
    Start-Sleep -Seconds 5
    
    # Test health endpoint
    try {
        $health = Invoke-RestMethod -Uri "http://127.0.0.1:3001/health" -Method GET -TimeoutSec 10
        Write-Host "✓ Backend health check passed!" -ForegroundColor Green
        Write-Host "  Status: $($health.status)" -ForegroundColor White
        Write-Host "  Database: $($health.database)" -ForegroundColor White
        
        # Test user registration
        Write-Host ""
        Write-Host "Testing user registration..." -ForegroundColor Cyan
        $testUser = @{
            firstName = "Test"
            lastName = "User"  
            email = "test$(Get-Random)@example.com"
            password = "testpass123"
        }
        
        try {
            $regResponse = Invoke-RestMethod -Uri "http://127.0.0.1:3001/api/auth/register" -Method POST -Body ($testUser | ConvertTo-Json) -ContentType "application/json" -TimeoutSec 10
            Write-Host "✓ User registration successful!" -ForegroundColor Green
            Write-Host "  User ID: $($regResponse.user.id)" -ForegroundColor White
            Write-Host "  Token received: Yes" -ForegroundColor White
        } catch {
            Write-Host "✗ Registration failed: $($_.Exception.Message)" -ForegroundColor Red
            Write-Host "  Make sure you disabled RLS in Supabase" -ForegroundColor Yellow
        }
        
    } catch {
        Write-Host "✗ Backend health check failed: $($_.Exception.Message)" -ForegroundColor Red
    }
    
    # Stop background job
    Stop-Job $job -Force
    Remove-Job $job -Force
    
} catch {
    Write-Host "✗ Failed to start backend: $($_.Exception.Message)" -ForegroundColor Red
}

Pop-Location

Write-Host ""
Write-Host "=== Setup Complete! ===" -ForegroundColor Green
Write-Host "If everything worked, you can now:" -ForegroundColor White
Write-Host "1. Start backend: cd backend && node server.supabase.js" -ForegroundColor Cyan
Write-Host "2. Start frontend: cd client && npm run dev" -ForegroundColor Cyan  
Write-Host "3. Test your app at: http://localhost:8082" -ForegroundColor Cyan
Write-Host ""
Write-Host "Mobile access: http://192.168.0.131:8082" -ForegroundColor Magenta