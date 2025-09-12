# 🚨 CRITICAL: Railway Root Directory Configuration Required

## The Issue
Railway is deploying from the root directory and trying to run the entire monorepo instead of just the backend. This causes the error:
```
Error: Cannot find module 'express'
```

## The Solution
You MUST set Railway's root directory to `backend` in the dashboard:

### Step-by-Step Instructions:
1. **Go to Railway Dashboard**: https://railway.app/dashboard
2. **Select Your Project**: "Crypto" (which we just linked)
3. **Select Your Service**: "Crypto" backend service
4. **Go to Settings**: Click the Settings tab
5. **Find Source Section**: Look for "Source" or "Root Directory"
6. **Set Root Directory**: Enter exactly: `backend`
7. **Save Changes**: Click Save/Apply

### Why This Fixes Everything:
- ✅ Railway will only deploy the `backend` folder
- ✅ Railway will use `backend/package.json` and `backend/node_modules`
- ✅ Railway will find `server.supabase.js` in the correct location
- ✅ All dependencies will be installed correctly
- ✅ CORS configuration will work for your Vercel frontend

## After Setting Root Directory:
Run this command to redeploy:
```bash
railway up
```

## Expected Success:
Once the root directory is set, the deployment should succeed and you'll see:
```
Server listening on port 3001
Using Supabase database at: https://fnggwmxkdgwxsbjekics.supabase.co
```

## Test Your Deployment:
After successful deployment, test:
```bash
curl https://cryptoportfolio-production.up.railway.app/health
```

## Result:
Your CORS errors between Vercel frontend and Railway backend will be completely resolved!

---
**THIS IS THE KEY FIX FOR YOUR CORS ISSUE!** 🎯