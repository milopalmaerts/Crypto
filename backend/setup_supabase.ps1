# Supabase Setup for EindRersult
Write-Host "=== Supabase Configuration Setup ===" -ForegroundColor Green
Write-Host ""

Write-Host "You provided:" -ForegroundColor Cyan
Write-Host "URL: https://fnggwmxkdgwxsbjekics.supabase.co" -ForegroundColor White
Write-Host "Anon Key: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..." -ForegroundColor White
Write-Host ""

Write-Host "To complete the setup, you need your SERVICE ROLE KEY:" -ForegroundColor Yellow
Write-Host "1. Go to https://supabase.com/dashboard/project/fnggwmxkdgwxsbjekics" -ForegroundColor White
Write-Host "2. Click on Settings (gear icon)" -ForegroundColor White  
Write-Host "3. Go to API section" -ForegroundColor White
Write-Host "4. Copy the 'service_role' key (NOT the anon key)" -ForegroundColor White
Write-Host ""

$serviceKey = Read-Host "Paste your Supabase SERVICE ROLE key here"

if ([string]::IsNullOrWhiteSpace($serviceKey)) {
    Write-Host "Service role key is required. Please get it from your Supabase dashboard." -ForegroundColor Red
    exit 1
}

# Update the .env file
$envContent = @"
# Backend Environment Variables for Supabase
SUPABASE_URL=https://fnggwmxkdgwxsbjekics.supabase.co
SUPABASE_SERVICE_ROLE_KEY=$serviceKey

# Database Connection
DATABASE_URL=postgresql://postgres:[EigenProject1]@db.fnggwmxkdgwxsbjekics.supabase.co:5432/postgres

# JWT Secret
JWT_SECRET=crypto-jwt-secure-$(Get-Random)

# CoinGecko API (optional)
COINGECKO_API_KEY=your-api-key-here

# Port
PORT=3001
"@

$envContent | Out-File -FilePath ".env" -Encoding UTF8

Write-Host ""
Write-Host "✓ Environment file updated" -ForegroundColor Green
Write-Host ""
Write-Host "Now testing the backend with Supabase..." -ForegroundColor Yellow

# Start the Supabase backend
Write-Host "Starting Supabase backend..." -ForegroundColor Cyan
try {
    Start-Process -FilePath "node" -ArgumentList "server.supabase.js" -NoNewWindow
    Write-Host "✓ Backend started successfully" -ForegroundColor Green
    
    # Wait a moment for the server to start
    Start-Sleep -Seconds 3
    
    # Test the health endpoint
    Write-Host "Testing health endpoint..." -ForegroundColor Cyan
    $healthResponse = Invoke-RestMethod -Uri "http://127.0.0.1:3001/health" -Method GET -TimeoutSec 5
    Write-Host "✓ Health check passed:" -ForegroundColor Green
    Write-Host "  Status: $($healthResponse.status)" -ForegroundColor White
    Write-Host "  Database: $($healthResponse.database)" -ForegroundColor White
    
} catch {
    Write-Host "✗ Error starting backend: $($_.Exception.Message)" -ForegroundColor Red
}

Write-Host ""
Write-Host "=== Next Steps ===" -ForegroundColor Green
Write-Host "1. The backend is now configured for Supabase" -ForegroundColor White
Write-Host "2. Make sure your Supabase database has the required tables:" -ForegroundColor White
Write-Host "   - users (id, first_name, last_name, email, password_hash, created_at, updated_at)" -ForegroundColor Gray
Write-Host "   - holdings (id, user_id, crypto_id, symbol, name, amount, avg_price, created_at, updated_at)" -ForegroundColor Gray
Write-Host "3. Start the frontend: cd ../client && npm run dev" -ForegroundColor White
Write-Host "4. Test the application at http://localhost:8082" -ForegroundColor White
Write-Host ""
Write-Host "For mobile access, use: http://192.168.0.131:8082" -ForegroundColor Cyan