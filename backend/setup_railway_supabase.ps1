# Railway Supabase Environment Setup
Write-Host "=== Railway Environment Setup for Supabase ===" -ForegroundColor Green
Write-Host ""

# Check Railway CLI
try {
    railway --version | Out-Null
    Write-Host "✓ Railway CLI found" -ForegroundColor Green
} catch {
    Write-Host "✗ Railway CLI not found. Install with: npm install -g @railway/cli" -ForegroundColor Red
    exit 1
}

Write-Host ""
Write-Host "Setting up Railway environment variables for Supabase..." -ForegroundColor Yellow

# Navigate to backend directory
Push-Location backend

# Set basic environment variables
Write-Host "Setting NODE_ENV..." -ForegroundColor Gray
railway variables --set NODE_ENV=production

Write-Host "Setting PORT..." -ForegroundColor Gray
railway variables --set PORT=3001

Write-Host "Setting JWT_SECRET..." -ForegroundColor Gray
$jwtSecret = "crypto-jwt-$(Get-Random -Minimum 100000 -Maximum 999999)"
railway variables --set JWT_SECRET=$jwtSecret

# Set Supabase variables
Write-Host "Setting SUPABASE_URL..." -ForegroundColor Gray
railway variables --set SUPABASE_URL=https://fnggwmxkdgwxsbjekics.supabase.co

Write-Host ""
Write-Host "You need your Supabase SERVICE ROLE KEY:" -ForegroundColor Yellow
Write-Host "1. Go to: https://supabase.com/dashboard/project/fnggwmxkdgwxsbjekics/settings/api" -ForegroundColor White
Write-Host "2. Copy the 'service_role' key" -ForegroundColor White
Write-Host ""

$serviceKey = Read-Host "Paste your Supabase SERVICE ROLE key here"

if ([string]::IsNullOrWhiteSpace($serviceKey)) {
    Write-Host "Service role key is required for deployment!" -ForegroundColor Red
    exit 1
}

Write-Host "Setting SUPABASE_SERVICE_ROLE_KEY..." -ForegroundColor Gray
railway variables --set SUPABASE_SERVICE_ROLE_KEY=$serviceKey

Write-Host ""
Write-Host "✓ Railway environment variables configured" -ForegroundColor Green
Write-Host ""

# Deploy to Railway
Write-Host "Deploying to Railway..." -ForegroundColor Yellow
try {
    railway up
    Write-Host "✓ Deployment initiated" -ForegroundColor Green
} catch {
    Write-Host "✗ Deployment failed: $($_.Exception.Message)" -ForegroundColor Red
}

Pop-Location

Write-Host ""
Write-Host "=== Railway Deployment Summary ===" -ForegroundColor Green
Write-Host "Backend URL: https://crypto-production-0847.up.railway.app" -ForegroundColor Cyan
Write-Host ""
Write-Host "Next steps:" -ForegroundColor Yellow
Write-Host "1. Wait for deployment to complete" -ForegroundColor White
Write-Host "2. Test health endpoint: https://crypto-production-0847.up.railway.app/health" -ForegroundColor White
Write-Host "3. Update Vercel frontend to use the Railway backend" -ForegroundColor White
Write-Host "4. Deploy frontend to Vercel" -ForegroundColor White