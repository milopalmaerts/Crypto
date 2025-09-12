# Complete Deployment Script for EindRersult
# This script will deploy both backend (Railway) and frontend (Vercel)

Write-Host "=== EindRersult Complete Deployment ===" -ForegroundColor Green
Write-Host ""

# Step 1: Check prerequisites
Write-Host "1. Checking prerequisites..." -ForegroundColor Yellow

# Check Railway CLI
try {
    railway --version | Out-Null
    Write-Host "   ✓ Railway CLI found" -ForegroundColor Green
} catch {
    Write-Host "   ✗ Railway CLI not found. Install with: npm install -g @railway/cli" -ForegroundColor Red
    exit 1
}

# Check Vercel CLI
try {
    vercel --version | Out-Null  
    Write-Host "   ✓ Vercel CLI found" -ForegroundColor Green
} catch {
    Write-Host "   ✗ Vercel CLI not found. Install with: npm install -g vercel" -ForegroundColor Red
    exit 1
}

Write-Host ""

# Step 2: Set Railway Environment Variables
Write-Host "2. Setting up Railway environment..." -ForegroundColor Yellow
cd backend

# Set basic environment variables
Write-Host "   Setting NODE_ENV..." -ForegroundColor Gray
railway variables --set NODE_ENV=production

Write-Host "   Setting PORT..." -ForegroundColor Gray  
railway variables --set PORT=3001

Write-Host "   Setting JWT_SECRET..." -ForegroundColor Gray
$jwtSecret = "crypto-jwt-" + (Get-Random -Minimum 100000 -Maximum 999999)
railway variables --set JWT_SECRET=$jwtSecret

Write-Host "   ✓ Basic environment variables set" -ForegroundColor Green

# Firebase setup
Write-Host ""
Write-Host "3. Firebase Setup Required" -ForegroundColor Yellow
Write-Host "   You need to manually set your Firebase service account:" -ForegroundColor Cyan
Write-Host "   1. Get your Firebase service account JSON from:" -ForegroundColor White
Write-Host "      https://console.firebase.google.com > Project Settings > Service Accounts" -ForegroundColor White
Write-Host "   2. Run this command with your actual JSON:" -ForegroundColor White
Write-Host "      railway variables --set 'FIREBASE_SERVICE_ACCOUNT={your-json-here}'" -ForegroundColor White
Write-Host ""

$skipFirebase = Read-Host "Skip Firebase setup for now? (y/n)"
if ($skipFirebase -ne 'y' -and $skipFirebase -ne 'Y') {
    Write-Host "Please set up Firebase first, then run this script again." -ForegroundColor Yellow
    exit 0
}

Write-Host ""

# Step 3: Deploy Backend to Railway
Write-Host "4. Deploying backend to Railway..." -ForegroundColor Yellow
try {
    railway up
    Write-Host "   ✓ Backend deployed successfully" -ForegroundColor Green
} catch {
    Write-Host "   ✗ Backend deployment failed" -ForegroundColor Red
    Write-Host "   Check Railway logs for details" -ForegroundColor Yellow
}

Write-Host ""

# Step 4: Deploy Frontend to Vercel  
Write-Host "5. Deploying frontend to Vercel..." -ForegroundColor Yellow
cd ..

try {
    # Build and deploy
    vercel --prod --yes
    Write-Host "   ✓ Frontend deployed successfully" -ForegroundColor Green
} catch {
    Write-Host "   ✗ Frontend deployment failed" -ForegroundColor Red
    Write-Host "   Try running 'vercel' manually" -ForegroundColor Yellow
}

Write-Host ""
Write-Host "=== Deployment Summary ===" -ForegroundColor Green
Write-Host "Backend URL: https://crypto-production-0847.up.railway.app" -ForegroundColor Cyan
Write-Host "Frontend URL: https://cryptoportfolio-psi.vercel.app" -ForegroundColor Cyan
Write-Host ""
Write-Host "Test your deployment:" -ForegroundColor Yellow
Write-Host "1. Visit your frontend URL" -ForegroundColor White
Write-Host "2. Try registering a new account" -ForegroundColor White
Write-Host "3. Check if cryptocurrencies load" -ForegroundColor White
Write-Host ""
Write-Host "If there are issues:" -ForegroundColor Yellow
Write-Host "- Make sure Firebase credentials are set in Railway" -ForegroundColor White
Write-Host "- Check Railway logs: railway logs" -ForegroundColor White
Write-Host "- Verify CORS settings in backend" -ForegroundColor White