# Railway Deployment Guide for Backend

## Issue Resolved
The deployment was failing because Railway was trying to build from the root directory instead of the backend directory, causing "Cannot find module 'express'" errors.

## Solution Applied
1. **Updated nixpacks.toml** - Configured proper build process for monorepo
2. **Updated package.json** - Ensured all dependencies are properly listed
3. **Created .railwayignore** - Prevents confusion from monorepo structure
4. **Updated railway.json** - Proper Railway-specific configuration

## Deployment Steps

### Option 1: Redeploy Current Service
1. Go to your Railway dashboard
2. Find your current backend service
3. Go to Settings → General → Service Settings
4. Trigger a new deployment by pushing the updated files

### Option 2: Create New Service (Recommended)
1. In Railway dashboard, create a new service
2. Connect to your GitHub repository
3. **IMPORTANT**: Select only the `backend` directory as the deployment source
4. Railway should automatically detect the nixpacks.toml configuration

### Environment Variables
Make sure these environment variables are set in Railway:

```
JWT_SECRET=your-production-jwt-secret-here
FIREBASE_SERVICE_ACCOUNT={"type":"service_account",...your-firebase-json...}
NODE_ENV=production
PORT=3001
```

### Verification
Once deployed, check:
1. Build logs show "Dependencies installed successfully"
2. Express module is found during installation
3. Health check endpoint responds: `https://your-app.railway.app/health`

## Files Updated
- `nixpacks.toml` - Fixed monorepo build configuration
- `package.json` - Updated firebase-admin version
- `railway.json` - Proper Railway configuration
- `.railwayignore` - Exclude unnecessary files

## Troubleshooting
If deployment still fails:
1. Check Railway build logs for specific errors
2. Ensure environment variables are properly set
3. Verify the service is connected to the correct repository directory
4. Try deploying from a fresh Railway service pointed directly at the backend folder