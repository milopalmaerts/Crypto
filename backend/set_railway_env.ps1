# Script to set Railway environment variables
# Run this script to configure your Railway deployment

# Set JWT Secret
Write-Host "Setting JWT_SECRET..."
railway variables --set "JWT_SECRET=your-production-jwt-secret-change-this"

# Set Firebase Service Account (you'll need to copy this from your .env file)
Write-Host "Setting FIREBASE_SERVICE_ACCOUNT..."
# IMPORTANT: Replace the placeholder below with your actual Firebase service account JSON
# DO NOT commit real credentials to git!
$firebaseServiceAccount = '{"type":"service_account","project_id":"your-project-id","private_key_id":"your-private-key-id","private_key":"-----BEGIN PRIVATE KEY-----\nyour-private-key-content\n-----END PRIVATE KEY-----\n","client_email":"your-service-account@your-project.iam.gserviceaccount.com","client_id":"your-client-id","auth_uri":"https://accounts.google.com/o/oauth2/auth","token_uri":"https://oauth2.googleapis.com/token","auth_provider_x509_cert_url":"https://www.googleapis.com/oauth2/v1/certs","client_x509_cert_url":"your-client-cert-url","universe_domain":"googleapis.com"}'

railway variables --set "FIREBASE_SERVICE_ACCOUNT=$firebaseServiceAccount"

Write-Host "Environment variables set successfully!"
Write-Host "You can now run 'railway up' to deploy your backend."
Write-Host ""
Write-Host "SECURITY NOTE: Always keep your Firebase credentials secure and never commit them to git!"