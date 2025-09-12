# Quick Firebase Setup for Railway
Write-Host "Setting up Firebase for Railway deployment..." -ForegroundColor Yellow
Write-Host ""

# You need to replace this with your actual Firebase service account JSON
# Get it from: https://console.firebase.google.com > Project Settings > Service Accounts > Generate new private key

$firebaseServiceAccount = @'
{
  "type": "service_account",
  "project_id": "YOUR_PROJECT_ID",
  "private_key_id": "YOUR_PRIVATE_KEY_ID",
  "private_key": "-----BEGIN PRIVATE KEY-----\nYOUR_PRIVATE_KEY\n-----END PRIVATE KEY-----\n",
  "client_email": "firebase-adminsdk-XXXXX@YOUR_PROJECT.iam.gserviceaccount.com",
  "client_id": "YOUR_CLIENT_ID",
  "auth_uri": "https://accounts.google.com/o/oauth2/auth",
  "token_uri": "https://oauth2.googleapis.com/token",
  "auth_provider_x509_cert_url": "https://www.googleapis.com/oauth2/v1/certs",
  "client_x509_cert_url": "YOUR_CERT_URL"
}
'@

Write-Host "IMPORTANT: You need to update this script with your actual Firebase credentials!" -ForegroundColor Red
Write-Host ""
Write-Host "1. Go to https://console.firebase.google.com" -ForegroundColor Cyan
Write-Host "2. Select your project" -ForegroundColor Cyan  
Write-Host "3. Go to Project Settings > Service Accounts" -ForegroundColor Cyan
Write-Host "4. Click 'Generate new private key'" -ForegroundColor Cyan
Write-Host "5. Replace the template above with your actual JSON" -ForegroundColor Cyan
Write-Host "6. Run this command to set the environment variable:" -ForegroundColor Cyan
Write-Host ""
Write-Host 'railway variables --set "FIREBASE_SERVICE_ACCOUNT=$firebaseServiceAccount"' -ForegroundColor White
Write-Host ""
Write-Host "After setting up Firebase credentials, deploy with:" -ForegroundColor Green
Write-Host "railway up" -ForegroundColor White