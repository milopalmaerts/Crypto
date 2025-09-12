# Supabase + Railway Deployment Guide

## ✅ Updated Configuration

Your backend has been updated with the correct Supabase JWT secret and configuration. Here's what's been configured:

### JWT Configuration
- **JWT Secret**: `r7/LwJlBdFI4pyK8V1IPigoI4Xz2RD1imHmHui7nyy9+6pdfC5Ke+btFobPIY9Np+0KKUGXKfBCkiobn6ZroHw==`
- **Token Expiry**: 3600 seconds (1 hour) - matches your Supabase settings
- **Purpose**: Signs and verifies JWTs issued by Supabase Auth

### Backend Updates
1. ✅ Updated `server.supabase.js` with your Supabase JWT secret
2. ✅ Enhanced CORS configuration for Vercel production domain
3. ✅ Updated `nixpacks.toml` to use `server.supabase.js`
4. ✅ Updated PowerShell deployment script for Supabase

## 🚀 Railway Deployment Steps

### Step 1: Set Railway Root Directory
**CRITICAL**: Railway needs to deploy only the backend folder.

1. Go to your Railway dashboard: https://railway.app/dashboard
2. Select your `cryptoportfolio-production` project
3. Go to **Settings** → **Source**
4. Set **Root Directory** to: `backend`
5. Click **Save**

### Step 2: Set Environment Variables
Run the updated PowerShell script:

```powershell
cd backend
.\set_railway_env.ps1
```

This will configure:
- `JWT_SECRET`: Your Supabase JWT secret
- `SUPABASE_URL`: https://fnggwmxkdgwxsbjekics.supabase.co
- `SUPABASE_SERVICE_ROLE_KEY`: [You need to provide this]
- `NODE_ENV`: production
- `PORT`: 3001

### Step 3: Get Supabase Service Role Key
1. Go to: https://supabase.com/dashboard/project/fnggwmxkdgwxsbjekics/settings/api
2. Copy the **service_role** key (marked as secret)
3. Paste it when the script prompts for it

### Step 4: Deploy to Railway
```bash
railway up
```

## 🔧 CORS Configuration

Your backend now includes enhanced CORS settings:

```javascript
const corsOptions = {
  origin: function (origin, callback) {
    const allowedOrigins = [
      // ... development origins ...
      'https://cryptoportfolio-psi.vercel.app' // Your production frontend
    ];
    
    // Allow all .vercel.app and .railway.app domains
    if (origin && (origin.includes('.vercel.app') || origin.includes('.railway.app'))) {
      return callback(null, true);
    }
    // ... rest of logic
  }
};
```

## 🧪 Testing the Deployment

### 1. Test Health Endpoint
```bash
curl https://cryptoportfolio-production.up.railway.app/health
```

Expected response:
```json
{
  "status": "OK",
  "timestamp": "2025-09-12T...",
  "service": "EindRersult Backend (Supabase)",
  "database": "Supabase Connected",
  "cors": "Enabled"
}
```

### 2. Test Authentication
From your Vercel frontend:
- Try registering a new account
- Try logging in with existing credentials
- Check if portfolio data loads

### 3. Check Railway Logs
```bash
railway logs
```

Look for:
- ✅ "Server listening on port..."
- ✅ "Using Supabase database at: https://fnggwmxkdgwxsbjekics.supabase.co"
- ✅ CORS logs showing successful origin checks

## 🐛 Troubleshooting

### Common Issues

1. **Still getting CORS errors?**
   - Check Railway logs for CORS debug messages
   - Ensure root directory is set to `backend`
   - Verify environment variables are set

2. **Database connection errors?**
   - Verify `SUPABASE_SERVICE_ROLE_KEY` is correct
   - Check Supabase project is active

3. **Authentication failures?**
   - Verify JWT_SECRET matches your Supabase configuration
   - Check token format in frontend requests

### Debug Commands
```bash
# Check environment variables
railway variables

# View deployment logs
railway logs

# Check service status
railway status
```

## 📋 Deployment Checklist

- [ ] Set Railway root directory to `backend`
- [ ] Run `set_railway_env.ps1` script
- [ ] Provide Supabase Service Role Key
- [ ] Deploy with `railway up`
- [ ] Test health endpoint
- [ ] Test authentication from frontend
- [ ] Verify CORS is working
- [ ] Check portfolio data loading

## 🎯 Expected Result

After successful deployment:
1. ✅ Railway backend accessible at: https://cryptoportfolio-production.up.railway.app
2. ✅ Vercel frontend can authenticate users
3. ✅ Portfolio data loads and updates work
4. ✅ No CORS errors in browser console
5. ✅ Mobile access works via Vercel URL

The key fix for your CORS issue is ensuring Railway deploys only the `backend` directory with the updated CORS configuration that explicitly allows your Vercel domain!