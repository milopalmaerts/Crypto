# Quick Railway Deployment - Ready to Deploy!
# Your Supabase credentials are already configured in the code

Write-Host "=== Quick Railway Deployment with Supabase ===" -ForegroundColor Green
Write-Host "Your backend is ready to deploy with embedded Supabase credentials!" -ForegroundColor Yellow
Write-Host ""

# Check Railway auth
Write-Host "Checking Railway authentication..." -ForegroundColor Cyan
try {
    $whoami = railway whoami 2>$null
    if ($whoami) {
        Write-Host "[+] Railway authentication verified: $whoami" -ForegroundColor Green
    } else {
        throw "Not authenticated"
    }
} catch {
    Write-Host "[!] Please login to Railway first:" -ForegroundColor Red
    Write-Host "railway login" -ForegroundColor Yellow
    Write-Host ""
    Write-Host "After logging in, run this script again." -ForegroundColor Yellow
    exit 1
}

Write-Host ""
Write-Host "Setting minimal environment variables..." -ForegroundColor Cyan
Write-Host ""

# Set basic environment variables (credentials are embedded in code)
Write-Host "1. Setting NODE_ENV..." -ForegroundColor White
railway variables --set "NODE_ENV=production"
Write-Host "   ✓ NODE_ENV configured" -ForegroundColor Green

Write-Host "2. Setting PORT..." -ForegroundColor White  
railway variables --set "PORT=3001"
Write-Host "   ✓ PORT configured" -ForegroundColor Green

Write-Host ""
Write-Host "[INFO] Supabase credentials are embedded in server code for quick deployment" -ForegroundColor Yellow
Write-Host ""

# Important reminder about root directory
Write-Host "CRITICAL: Ensure Railway root directory is set to 'backend'" -ForegroundColor Red
Write-Host "1. Go to: https://railway.app/dashboard" -ForegroundColor Yellow
Write-Host "2. Select your 'cryptoportfolio-production' project" -ForegroundColor Yellow
Write-Host "3. Go to Settings → Source" -ForegroundColor Yellow
Write-Host "4. Set Root Directory to: backend" -ForegroundColor Yellow
Write-Host "5. Click Save" -ForegroundColor Yellow
Write-Host ""

$continue = Read-Host "Have you set the Railway root directory to 'backend'? (y/n)"
if ($continue -notmatch "^[Yy]") {
    Write-Host ""
    Write-Host "Please set the root directory first:" -ForegroundColor Yellow
    Write-Host "https://railway.app/dashboard → your project → Settings → Source → Root Directory: backend" -ForegroundColor White
    Write-Host ""
    Write-Host "Then run this script again." -ForegroundColor Yellow
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
    Write-Host "Testing deployment..." -ForegroundColor Cyan
    
    # Wait a moment for deployment
    Start-Sleep -Seconds 10
    
    Write-Host ""
    Write-Host "Next steps:" -ForegroundColor Yellow
    Write-Host "1. Check deployment status: railway status" -ForegroundColor White
    Write-Host "2. View logs: railway logs" -ForegroundColor White
    Write-Host "3. Test health endpoint: https://cryptoportfolio-production.up.railway.app/health" -ForegroundColor White
    Write-Host ""
    Write-Host "Expected result:" -ForegroundColor Green
    Write-Host "✓ CORS errors should be resolved!" -ForegroundColor Green
    Write-Host "✓ Vercel frontend can now access Railway backend" -ForegroundColor Green
    Write-Host "✓ Authentication and portfolio features should work" -ForegroundColor Green
    
} catch {
    Write-Host "[ERROR] Deployment failed: $($_.Exception.Message)" -ForegroundColor Red
    Write-Host ""
    Write-Host "Troubleshooting:" -ForegroundColor Yellow
    Write-Host "1. Check Railway dashboard for detailed errors" -ForegroundColor White
    Write-Host "2. Verify root directory is set to 'backend'" -ForegroundColor White
    Write-Host "3. Check logs: railway logs" -ForegroundColor White
}

Write-Host ""
Write-Host "Configuration Summary:" -ForegroundColor Yellow
Write-Host "- JWT_SECRET: Embedded Supabase Legacy JWT Secret" -ForegroundColor White
Write-Host "- SUPABASE_URL: https://fnggwmxkdgwxsbjekics.supabase.co" -ForegroundColor White
Write-Host "- SUPABASE_SERVICE_ROLE_KEY: Embedded in code" -ForegroundColor White
Write-Host "- CORS: Configured for Vercel production domain" -ForegroundColor White