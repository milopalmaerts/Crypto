# Secure Railway Firebase Setup
Write-Host "=== Secure Firebase Environment Setup for Railway ===" -ForegroundColor Green
Write-Host ""

# Check if user has Firebase service account ready
Write-Host "This script will help you securely set up Firebase credentials for Railway deployment." -ForegroundColor Yellow
Write-Host ""
Write-Host "You'll need your Firebase service account JSON from:" -ForegroundColor Cyan
Write-Host "1. Go to https://console.firebase.google.com" -ForegroundColor White
Write-Host "2. Select your project" -ForegroundColor White
Write-Host "3. Click Settings (gear icon) > Project settings" -ForegroundColor White
Write-Host "4. Go to 'Service accounts' tab" -ForegroundColor White
Write-Host "5. Click 'Generate new private key'" -ForegroundColor White
Write-Host "6. Download the JSON file" -ForegroundColor White
Write-Host ""

$ready = Read-Host "Do you have your Firebase service account JSON ready? (y/n)"

if ($ready -ne 'y' -and $ready -ne 'Y') {
    Write-Host ""
    Write-Host "Please get your Firebase credentials first, then run this script again." -ForegroundColor Yellow
    Write-Host "The JSON should look something like this:" -ForegroundColor Cyan
    Write-Host '{
  "type": "service_account",
  "project_id": "your-project-id",
  "private_key_id": "...",
  "private_key": "-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n",
  "client_email": "firebase-adminsdk-...@your-project.iam.gserviceaccount.com",
  "client_id": "...",
  "auth_uri": "https://accounts.google.com/o/oauth2/auth",
  "token_uri": "https://oauth2.googleapis.com/token",
  "auth_provider_x509_cert_url": "https://www.googleapis.com/oauth2/v1/certs",
  "client_x509_cert_url": "..."
}' -ForegroundColor Gray
    exit
}

Write-Host ""
Write-Host "Great! Now paste your complete Firebase service account JSON below." -ForegroundColor Green
Write-Host "Tip: Copy the entire JSON content from the downloaded file." -ForegroundColor Yellow
Write-Host "Press Ctrl+C to cancel if needed." -ForegroundColor Gray
Write-Host ""

# Get Firebase JSON from user
$firebaseJson = Read-Host "Paste your Firebase service account JSON here"

if ([string]::IsNullOrWhiteSpace($firebaseJson)) {
    Write-Host ""
    Write-Host "ERROR: No Firebase credentials provided. Deployment cannot continue." -ForegroundColor Red
    exit 1
}

# Validate JSON format
Write-Host ""
Write-Host "Validating JSON format..." -ForegroundColor Yellow
try {
    $parsed = $firebaseJson | ConvertFrom-Json
    Write-Host "✓ Valid JSON format detected" -ForegroundColor Green
    
    # Check for required Firebase fields
    $requiredFields = @("type", "project_id", "private_key", "client_email")
    foreach ($field in $requiredFields) {
        if (-not $parsed.$field) {
            Write-Host "✗ Missing required field: $field" -ForegroundColor Red
            exit 1
        }
    }
    Write-Host "✓ All required Firebase fields present" -ForegroundColor Green
    
} catch {
    Write-Host "✗ Invalid JSON format. Please check your Firebase credentials." -ForegroundColor Red
    Write-Host "Error: $($_.Exception.Message)" -ForegroundColor Red
    exit 1
}

# Set the environment variable
Write-Host ""
Write-Host "Setting Firebase credentials in Railway..." -ForegroundColor Yellow
try {
    # Escape the JSON properly for Railway
    $escapedJson = $firebaseJson -replace '"', '\"'
    railway variables --set "FIREBASE_SERVICE_ACCOUNT=$firebaseJson"
    Write-Host "✓ Firebase credentials set successfully" -ForegroundColor Green
} catch {
    Write-Host "✗ Failed to set Firebase credentials" -ForegroundColor Red
    Write-Host "Error: $($_.Exception.Message)" -ForegroundColor Red
    exit 1
}

Write-Host ""
Write-Host "=== Environment Setup Complete ===" -ForegroundColor Green
Write-Host "Your Railway backend is now configured with:" -ForegroundColor White
Write-Host "✓ NODE_ENV = production" -ForegroundColor Green
Write-Host "✓ PORT = 3001" -ForegroundColor Green  
Write-Host "✓ JWT_SECRET = [SECURED]" -ForegroundColor Green
Write-Host "✓ FIREBASE_SERVICE_ACCOUNT = [SECURED]" -ForegroundColor Green
Write-Host ""
Write-Host "Next step: Deploy your backend with:" -ForegroundColor Cyan
Write-Host "railway up" -ForegroundColor White
Write-Host ""
Write-Host "After deployment, your backend will be available at:" -ForegroundColor Cyan
Write-Host "https://crypto-production-0847.up.railway.app" -ForegroundColor White