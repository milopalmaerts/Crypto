# Deploy Supabase Backend to Railway with CORS Fix
Write-Host "=== Deploying Supabase Backend to Railway ===" -ForegroundColor Green
Write-Host ""

# Check Railway CLI
try {
    railway --version | Out-Null
    Write-Host "✓ Railway CLI found" -ForegroundColor Green
} catch {
    Write-Host "✗ Railway CLI not found. Install with: npm install -g @railway/cli" -ForegroundColor Red
    exit 1
}

# Navigate to backend directory  
Push-Location backend

Write-Host "Setting Railway environment variables..." -ForegroundColor Yellow

# Set basic environment variables
railway variables --set NODE_ENV=production
railway variables --set PORT=3001

# Set JWT secret
$jwtSecret = "crypto-jwt-$(Get-Random -Minimum 100000 -Maximum 999999)"
railway variables --set JWT_SECRET=$jwtSecret

# Set Supabase URL
railway variables --set SUPABASE_URL=https://fnggwmxkdgwxsbjekics.supabase.co

# Get service role key
Write-Host ""
Write-Host "You need your Supabase SERVICE ROLE KEY for Railway deployment:" -ForegroundColor Yellow
Write-Host "1. Go to: https://supabase.com/dashboard/project/fnggwmxkdgwxsbjekics/settings/api" -ForegroundColor White
Write-Host "2. Copy the 'service_role' key (the long JWT token)" -ForegroundColor White
Write-Host ""

$serviceKey = Read-Host "Paste your SERVICE ROLE key here"

if ([string]::IsNullOrWhiteSpace($serviceKey)) {
    Write-Host "Service role key is required for Railway deployment!" -ForegroundColor Red
    exit 1
}

# Set service role key
railway variables --set SUPABASE_SERVICE_ROLE_KEY=$serviceKey

Write-Host ""
Write-Host "✓ Environment variables configured" -ForegroundColor Green

# Make sure we're using the Supabase server file
if (-not (Test-Path "server.supabase.js")) {
    Write-Host "✗ server.supabase.js not found!" -ForegroundColor Red
    exit 1
}

# Update package.json start script to use Supabase server
$packageJson = Get-Content "package.json" | ConvertFrom-Json
$packageJson.scripts.start = "node server.supabase.js"
$packageJson | ConvertTo-Json -Depth 10 | Set-Content "package.json"

Write-Host "✓ Updated package.json to use Supabase server" -ForegroundColor Green

# Deploy to Railway
Write-Host ""
Write-Host "Deploying to Railway..." -ForegroundColor Yellow
try {
    railway up
    Write-Host "✓ Deployment initiated" -ForegroundColor Green
    
    # Wait a moment for deployment
    Write-Host "Waiting for deployment to complete..." -ForegroundColor Cyan
    Start-Sleep -Seconds 30
    
    # Test the deployed backend
    Write-Host "Testing deployed backend..." -ForegroundColor Cyan
    try {
        $healthResponse = Invoke-RestMethod -Uri "https://cryptoportfolio-production.up.railway.app/health" -Method GET -TimeoutSec 15
        Write-Host "✓ Backend deployed successfully!" -ForegroundColor Green
        Write-Host "  Status: $($healthResponse.status)" -ForegroundColor White
        Write-Host "  Database: $($healthResponse.database)" -ForegroundColor White
        Write-Host "  Service: $($healthResponse.service)" -ForegroundColor White
    } catch {
        Write-Host "⚠ Backend deployment may still be in progress" -ForegroundColor Yellow
        Write-Host "  Error: $($_.Exception.Message)" -ForegroundColor Gray
        Write-Host "  Wait a few minutes and test manually" -ForegroundColor Gray
    }
    
} catch {
    Write-Host "✗ Deployment failed: $($_.Exception.Message)" -ForegroundColor Red
}

Pop-Location

Write-Host ""
Write-Host "=== Deployment Summary ===" -ForegroundColor Green
Write-Host "Backend URL: https://cryptoportfolio-production.up.railway.app" -ForegroundColor Cyan
Write-Host "Frontend URL: https://cryptoportfolio-psi.vercel.app" -ForegroundColor Cyan
Write-Host ""
Write-Host "Test your CORS fix:" -ForegroundColor Yellow
Write-Host "1. Open: https://cryptoportfolio-psi.vercel.app" -ForegroundColor White
Write-Host "2. Try logging in or registering" -ForegroundColor White
Write-Host "3. Check if the CORS error is resolved" -ForegroundColor White
Write-Host ""
Write-Host "If CORS issues persist:" -ForegroundColor Red
Write-Host "- Wait 2-3 minutes for Railway deployment to complete" -ForegroundColor White
Write-Host "- Check Railway logs for any errors" -ForegroundColor White
Write-Host "- Verify the service is using server.supabase.js" -ForegroundColor White