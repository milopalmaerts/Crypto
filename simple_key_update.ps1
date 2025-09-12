# Simple Supabase Key Update
Write-Host "=== Get Your Supabase Service Role Key ===" -ForegroundColor Green
Write-Host ""
Write-Host "1. Go to: https://supabase.com/dashboard/project/fnggwmxkdgwxsbjekics/settings/api" -ForegroundColor Yellow
Write-Host "2. Look for 'service_role' key (different from anon key)" -ForegroundColor Yellow
Write-Host "3. Copy the long JWT token that starts with 'eyJhbGciOiJIUzI1NiIs...'" -ForegroundColor Yellow
Write-Host ""

$serviceKey = Read-Host "Paste your SERVICE ROLE key here"

if (-not [string]::IsNullOrWhiteSpace($serviceKey)) {
    # Update .env file
    (Get-Content "backend\.env") -replace "SUPABASE_SERVICE_ROLE_KEY=.*", "SUPABASE_SERVICE_ROLE_KEY=$serviceKey" | Set-Content "backend\.env"
    
    # Update JWT secret too
    $jwtSecret = "crypto-jwt-$(Get-Random -Minimum 100000 -Maximum 999999)"
    (Get-Content "backend\.env") -replace "JWT_SECRET=.*", "JWT_SECRET=$jwtSecret" | Set-Content "backend\.env"
    
    Write-Host ""
    Write-Host "Environment updated!" -ForegroundColor Green
    Write-Host "Now restart your backend to test the changes." -ForegroundColor Cyan
} else {
    Write-Host "No key provided. Please get your service role key from Supabase." -ForegroundColor Red
}