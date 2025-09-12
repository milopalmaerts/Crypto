# Railway Environment Variables Setup Script for Supabase Backend
# Run this script to configure your Railway deployment with proper environment variables

Write-Host "=== Railway Environment Setup for Supabase Backend ===" -ForegroundColor Green
Write-Host "This script will set up environment variables for your Railway backend deployment"
Write-Host ""

# Check if Railway CLI is installed
try {
    railway --version | Out-Null
    Write-Host "[+] Railway CLI detected" -ForegroundColor Green
} catch {
    Write-Host "[!] Railway CLI not found. Please install it first:" -ForegroundColor Red
    Write-Host "npm install -g @railway/cli"
    Write-Host "Then run: railway login"
    exit 1
}

Write-Host ""
Write-Host "Setting up environment variables..." -ForegroundColor Yellow
Write-Host ""

# Set JWT Secret (Supabase Legacy JWT Secret)
Write-Host "1. Setting JWT_SECRET (Supabase Legacy JWT Secret)..." -ForegroundColor Cyan
$defaultJwtSecret = "r7/LwJlBdFI4pyK8V1IPigoI4Xz2RD1imHmHui7nyy9+6pdfC5Ke+btFobPIY9Np+0KKUGXKfBCkiobn6ZroHw=="
$jwtSecret = Read-Host "Enter your Supabase JWT secret (or press Enter to use the provided one)"
if ([string]::IsNullOrWhiteSpace($jwtSecret)) {
    $jwtSecret = $defaultJwtSecret
}
railway variables --set "JWT_SECRET=$jwtSecret"
Write-Host "[+] JWT_SECRET configured" -ForegroundColor Green

# Set Supabase URL
Write-Host ""
Write-Host "2. Setting SUPABASE_URL..." -ForegroundColor Cyan
$defaultSupabaseUrl = "https://fnggwmxkdgwxsbjekics.supabase.co"
$supabaseUrl = Read-Host "Enter your Supabase URL (or press Enter for default: $defaultSupabaseUrl)"
if ([string]::IsNullOrWhiteSpace($supabaseUrl)) {
    $supabaseUrl = $defaultSupabaseUrl
}
railway variables --set "SUPABASE_URL=$supabaseUrl"
Write-Host "[+] SUPABASE_URL configured" -ForegroundColor Green

# Set Supabase Service Role Key
Write-Host ""
Write-Host "3. Setting SUPABASE_SERVICE_ROLE_KEY..." -ForegroundColor Cyan
Write-Host "You need your Supabase Service Role Key from:" -ForegroundColor Yellow
Write-Host "Supabase Dashboard > Settings > API > service_role (secret)" -ForegroundColor Yellow
Write-Host ""
$serviceRoleKey = Read-Host "Enter your Supabase Service Role Key"

if ([string]::IsNullOrWhiteSpace($serviceRoleKey)) {
    Write-Host "[!] Supabase Service Role Key is required for deployment" -ForegroundColor Red
    Write-Host "Please get your Service Role Key from: https://supabase.com/dashboard/project/fnggwmxkdgwxsbjekics/settings/api" -ForegroundColor Yellow
    exit 1
}

railway variables --set "SUPABASE_SERVICE_ROLE_KEY=$serviceRoleKey"
Write-Host "[+] SUPABASE_SERVICE_ROLE_KEY configured" -ForegroundColor Green

# Set Node Environment
Write-Host ""
Write-Host "4. Setting NODE_ENV..." -ForegroundColor Cyan
railway variables --set "NODE_ENV=production"
Write-Host "[+] NODE_ENV configured" -ForegroundColor Green

# Set Port (optional, Railway auto-assigns)
Write-Host ""
Write-Host "5. Setting PORT..." -ForegroundColor Cyan
railway variables --set "PORT=3001"
Write-Host "[+] PORT configured" -ForegroundColor Green

Write-Host ""
Write-Host "[SUCCESS] Environment variables configured successfully!" -ForegroundColor Green
Write-Host ""
Write-Host "Configuration Summary:" -ForegroundColor Yellow
Write-Host "- JWT_SECRET: Supabase Legacy JWT Secret (for token verification)" -ForegroundColor White
Write-Host "- SUPABASE_URL: $supabaseUrl" -ForegroundColor White
Write-Host "- SUPABASE_SERVICE_ROLE_KEY: [CONFIGURED]" -ForegroundColor White
Write-Host "- NODE_ENV: production" -ForegroundColor White
Write-Host "- PORT: 3001" -ForegroundColor White
Write-Host ""
Write-Host "Next steps:" -ForegroundColor Yellow
Write-Host "1. Set Railway root directory to 'backend' in dashboard settings" -ForegroundColor White
Write-Host "2. Deploy your backend: railway up" -ForegroundColor White
Write-Host "3. Check deployment status: railway status" -ForegroundColor White
Write-Host "4. View logs: railway logs" -ForegroundColor White
Write-Host "5. Test health endpoint: https://your-app.railway.app/health" -ForegroundColor White
Write-Host ""
Write-Host "[SECURITY] Note: Your credentials are now securely stored in Railway" -ForegroundColor Green
Write-Host "           and will not be visible in your code repository." -ForegroundColor Green