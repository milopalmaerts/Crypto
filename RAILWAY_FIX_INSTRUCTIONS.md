# 🚀 Railway CORS Fix Instructions

## ❌ **Current Problem:**
Your Vercel frontend (`https://cryptoportfolio-psi.vercel.app`) cannot connect to your Railway backend (`https://cryptoportfolio-production.up.railway.app`) due to CORS issues.

## ✅ **Quick Fix - Manual Railway Configuration:**

### **Step 1: Fix Railway Root Directory**
1. Go to: https://railway.com/project/b6a30240-1213-47cc-b44b-f1ea50b7cf47
2. Click on your "Crypto" service
3. Go to **Settings** → **Deploy**
4. Set **Root Directory** to: `backend`
5. Click **Save**

### **Step 2: Set Environment Variables**
In Railway dashboard → Variables, set:
```
NODE_ENV=production
PORT=3001
SUPABASE_URL=https://fnggwmxkdgwxsbjekics.supabase.co
SUPABASE_SERVICE_ROLE_KEY=[your-service-role-key-here]
JWT_SECRET=crypto-jwt-secure-2024
```

### **Step 3: Get Your Service Role Key**
1. Go to: https://supabase.com/dashboard/project/fnggwmxkdgwxsbjekics/settings/api
2. Copy the **"service_role"** key (the long JWT token)
3. Add it to Railway environment variables

### **Step 4: Redeploy**
1. In Railway dashboard, click **Deploy**
2. Wait for deployment to complete (2-3 minutes)

## 🧪 **Test the Fix:**

### **Option A: Test Backend Health**
```
https://cryptoportfolio-production.up.railway.app/health
```
Should return:
```json
{
  "status": "OK",
  "service": "EindRersult Backend (Supabase)",
  "database": "Supabase Connected"
}
```

### **Option B: Test Your Frontend**
1. Open: https://cryptoportfolio-psi.vercel.app
2. Try to register or login
3. CORS error should be resolved

## 🔧 **Alternative: Quick Local Fix**
If Railway continues to have issues, you can test locally:

```bash
# Terminal 1: Start backend
cd backend
node server.supabase.js

# Terminal 2: Start frontend  
cd client
npm run dev

# Access: http://localhost:8082
```

## 📱 **Mobile Access:**
- Local: `http://192.168.0.131:8082`
- Production: `https://cryptoportfolio-psi.vercel.app`

---

**The key fix is setting Railway's root directory to `backend` so it only deploys the backend service with proper CORS configuration!** 🎯