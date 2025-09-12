# Automated Railway Deployment Script for Supabase Backend
# This script automatically configures all environment variables and deploys

Write-Host "=== Automated Railway Deployment for Supabase Backend ===" -ForegroundColor Green
Write-Host "Configuring environment variables with provided Supabase credentials..." -ForegroundColor Yellow
Write-Host ""

# Check if Railway CLI is installed
try {
    railway --version | Out-Null
    Write-Host "[+] Railway CLI detected" -ForegroundColor Green
} catch {
    Write-Host "[!] Railway CLI not found. Installing Railway CLI..." -ForegroundColor Red
    npm install -g @railway/cli
    Write-Host "Please run 'railway login' and then re-run this script" -ForegroundColor Yellow
    exit 1
}

# Verify Railway login
try {
    railway whoami | Out-Null
    Write-Host "[+] Railway authentication verified" -ForegroundColor Green
} catch {
    Write-Host "[!] Please login to Railway first:" -ForegroundColor Red
    Write-Host "railway login" -ForegroundColor Yellow
    exit 1
}

Write-Host ""
Write-Host "Setting up production environment variables..." -ForegroundColor Cyan
Write-Host ""

# Set all environment variables automatically
Write-Host "1. Setting JWT_SECRET (Supabase Legacy JWT Secret)..." -ForegroundColor White
railway variables --set "JWT_SECRET=r7/LwJlBdFI4pyK8V1IPigoI4Xz2RD1imHmHui7nyy9+6pdfC5Ke+btFobPIY9Np+0KKUGXKfBCkiobn6ZroHw=="
Write-Host "   ✓ JWT_SECRET configured" -ForegroundColor Green

Write-Host "2. Setting SUPABASE_URL..." -ForegroundColor White
railway variables --set "SUPABASE_URL=https://fnggwmxkdgwxsbjekics.supabase.co"
Write-Host "   ✓ SUPABASE_URL configured" -ForegroundColor Green

Write-Host "3. Setting SUPABASE_SERVICE_ROLE_KEY..." -ForegroundColor White
railway variables --set "SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZuZ2d3bXhrZGd3eHNiamVraWNzIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NzUyODU2NSwiZXhwIjoyMDczMTA0NTY1fQ.6GnUvkbVRIRJQwswENJxCGhuU2nmer3J0Z_4Ya8HIhA"
Write-Host "   ✓ SUPABASE_SERVICE_ROLE_KEY configured" -ForegroundColor Green

Write-Host "4. Setting NODE_ENV..." -ForegroundColor White
railway variables --set "NODE_ENV=production"
Write-Host "   ✓ NODE_ENV configured" -ForegroundColor Green

Write-Host "5. Setting PORT..." -ForegroundColor White
railway variables --set "PORT=3001"
Write-Host "   ✓ PORT configured" -ForegroundColor Green

Write-Host ""
Write-Host "[SUCCESS] All environment variables configured!" -ForegroundColor Green
Write-Host ""

# Show configuration summary
Write-Host "Configuration Summary:" -ForegroundColor Yellow
Write-Host "- JWT_SECRET: Supabase Legacy JWT Secret (for token verification)" -ForegroundColor White
Write-Host "- SUPABASE_URL: https://fnggwmxkdgwxsbjekics.supabase.co" -ForegroundColor White
Write-Host "- SUPABASE_SERVICE_ROLE_KEY: [CONFIGURED]" -ForegroundColor White
Write-Host "- NODE_ENV: production" -ForegroundColor White
Write-Host "- PORT: 3001" -ForegroundColor White
Write-Host ""

# Check current directory and warn about root directory setting
Write-Host "IMPORTANT: Ensure Railway root directory is set to 'backend'" -ForegroundColor Red
Write-Host "1. Go to Railway dashboard → your project → Settings → Source" -ForegroundColor Yellow
Write-Host "2. Set Root Directory to: backend" -ForegroundColor Yellow
Write-Host "3. Click Save" -ForegroundColor Yellow
Write-Host ""

$continue = Read-Host "Have you set the Railway root directory to 'backend'? (y/n)"
if ($continue -notmatch "^[Yy]") {
    Write-Host "Please set the root directory first, then re-run this script." -ForegroundColor Yellow
    exit 0
}

Write-Host ""
Write-Host "Deploying to Railway..." -ForegroundColor Cyan
Write-Host ""

try {
    railway up
    Write-Host ""
    Write-Host "[SUCCESS] Deployment initiated!" -ForegroundColor Green
    Write-Host ""
    Write-Host "Next steps:" -ForegroundColor Yellow
    Write-Host "1. Check deployment status: railway status" -ForegroundColor White
    Write-Host "2. View logs: railway logs" -ForegroundColor White
    Write-Host "3. Test health endpoint: https://cryptoportfolio-production.up.railway.app/health" -ForegroundColor White
    Write-Host "4. Test frontend authentication from Vercel" -ForegroundColor White
    Write-Host ""
    Write-Host "Expected result: CORS errors should be resolved!" -ForegroundColor Green
    
} catch {
    Write-Host "[ERROR] Deployment failed: $($_.Exception.Message)" -ForegroundColor Red
    Write-Host "Check Railway dashboard for detailed error information" -ForegroundColor Yellow
}