# Railway Environment Variables Setup Script
# Run this script to configure your Railway deployment with proper environment variables

Write-Host "=== Railway Environment Setup ==="
Write-Host "This script will set up environment variables for your Railway backend deployment"
Write-Host ""

# Check if Railway CLI is installed
try {
    railway --version | Out-Null
    Write-Host "✓ Railway CLI detected"
} catch {
    Write-Host "❌ Railway CLI not found. Please install it first:"
    Write-Host "npm install -g @railway/cli"
    Write-Host "Then run: railway login"
    exit 1
}

Write-Host ""
Write-Host "Setting up environment variables..."
Write-Host ""

# Set JWT Secret
Write-Host "1. Setting JWT_SECRET..."
$jwtSecret = Read-Host "Enter your production JWT secret (or press Enter for default)"
if ([string]::IsNullOrWhiteSpace($jwtSecret)) {
    $jwtSecret = "production-jwt-secret-$(Get-Random)"
}
railway variables --set "JWT_SECRET=$jwtSecret"
Write-Host "✓ JWT_SECRET configured"

# Set Firebase Service Account
Write-Host ""
Write-Host "2. Setting FIREBASE_SERVICE_ACCOUNT..."
Write-Host "Please copy your Firebase service account JSON from the Firebase Console"
Write-Host "(Project Settings > Service Accounts > Generate New Private Key)"
Write-Host ""
$firebaseJson = Read-Host "Paste your Firebase service account JSON here"

if ([string]::IsNullOrWhiteSpace($firebaseJson)) {
    Write-Host "❌ Firebase service account JSON is required for deployment"
    Write-Host "Please get your credentials from: https://console.firebase.google.com"
    exit 1
}

# Validate JSON format
try {
    $firebaseJson | ConvertFrom-Json | Out-Null
    Write-Host "✓ Valid JSON format detected"
} catch {
    Write-Host "❌ Invalid JSON format. Please check your Firebase credentials."
    exit 1
}

railway variables --set "FIREBASE_SERVICE_ACCOUNT=$firebaseJson"
Write-Host "✓ FIREBASE_SERVICE_ACCOUNT configured"

# Set Node Environment
Write-Host ""
Write-Host "3. Setting NODE_ENV..."
railway variables --set "NODE_ENV=production"
Write-Host "✓ NODE_ENV configured"

# Set Port (optional, Railway auto-assigns)
Write-Host ""
Write-Host "4. Setting PORT..."
railway variables --set "PORT=3001"
Write-Host "✓ PORT configured"

Write-Host ""
Write-Host "🎉 Environment variables configured successfully!"
Write-Host ""
Write-Host "Next steps:"
Write-Host "1. Deploy your backend: railway up"
Write-Host "2. Check deployment status: railway status"
Write-Host "3. View logs: railway logs"
Write-Host "4. Test health endpoint: https://your-app.railway.app/health"
Write-Host ""
Write-Host "🔒 Security Note: Your credentials are now securely stored in Railway"
Write-Host "    and will not be visible in your code repository."
Write-Host ""