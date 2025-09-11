# Firebase Setup Guide for EindRersult

This guide follows your step-by-step Firebase configuration to migrate from SQLite to Firebase/Firestore.

## ✅ Current Status

Your backend is **already configured** for Firebase! The following is already implemented:

- ✅ Firebase Admin SDK integration (`server.js`)
- ✅ Environment variable parsing for `FIREBASE_SERVICE_ACCOUNT`
- ✅ Firestore database operations (replacing SQLite)
- ✅ All helper functions converted to use Firestore collections
- ✅ Rate limiting and mock data fallbacks
- ✅ Firebase Admin dependency in `package.json`

## 🔧 Firebase Console Setup (Follow Your Steps)

### 1. Create Firebase Project
1. Go to https://console.firebase.google.com/
2. Log in with your Google account
3. Click **"Add project"** or open existing project
4. Follow wizard (project name, analytics optional)

### 2. Create Firestore Database
1. Open your project in Firebase Console
2. Left menu: **Build → Firestore Database**
3. Click **"Create database"**
4. Choose **Test mode** (for development) or **Production mode**
5. Select location (closest to your users)

### 3. Generate Service Account (Private Key)
1. Click settings gear (⚙️) → **Project settings**
2. Go to **Service accounts** tab
3. Click **"Generate new private key"**
4. Download the JSON file
5. **Keep this file secure** - it's your server credential

### 4. Set Up Environment Variable

#### For Local Development
Create your `.env` file in the `backend/` directory (use `.env.example` as template):

**⚠️ IMPORTANT: Never commit the actual `.env` file to Git!**

```env
# Copy backend/.env.example to backend/.env and fill in your actual values:

# Firebase Configuration  
FIREBASE_SERVICE_ACCOUNT='your-actual-firebase-service-account-json-here'

# JWT Secret
JWT_SECRET=your-super-secret-jwt-key-here

# CoinGecko API (Optional)
COINGECKO_API_KEY=your_api_key_here

# Port Configuration
PORT=3001
```

**Security Notes:**
- The `.env` file is already in `.gitignore` - never remove this protection
- Use the `.env.example` template to set up your environment
- Rotate your Firebase service account keys regularly

#### For Production (Vercel/Railway/Render)
1. Go to your hosting platform dashboard
2. Navigate to **Environment Variables** or **Settings**
3. Add new variable:
   - **Name:** `FIREBASE_SERVICE_ACCOUNT`
   - **Value:** The entire JSON content (minified, one line)

### 5. Create Firestore Collections

Your backend expects these collections. You can create them manually in Firebase Console:

#### Users Collection: `users`
```json
{
  "id": "auto-generated-uuid",
  "first_name": "John",
  "last_name": "Doe", 
  "email": "john@example.com",
  "password_hash": "bcrypt-hashed-password",
  "created_at": "firestore-timestamp",
  "updated_at": "firestore-timestamp"
}
```

#### Holdings Collection: `holdings`
```json
{
  "id": "auto-generated-id",
  "user_id": "reference-to-user-id",
  "crypto_id": "bitcoin",
  "symbol": "BTC",
  "name": "Bitcoin",
  "amount": 0.5,
  "avg_price": 45000,
  "created_at": "firestore-timestamp",
  "updated_at": "firestore-timestamp"
}
```

## 🚀 Testing Your Setup

### 1. Start Your Backend
```bash
cd backend
npm start
```

Look for these console messages:
```
Initialized Firebase Admin with provided service account.
Server listening on port 3001
```

### 2. Test API Endpoints

#### Register a new user:
```bash
curl -X POST http://localhost:3001/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "firstName": "Milo",
    "lastName": "Palmaerts", 
    "email": "milo.palmaerts@gmail.com",
    "password": "EigenProject1"
  }'
```

#### Login:
```bash
curl -X POST http://localhost:3001/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "milo.palmaerts@gmail.com",
    "password": "EigenProject1"
  }'
```

### 3. Verify in Firebase Console
1. Go to **Firestore Database → Data**
2. Check if `users` collection was created
3. Verify user document appears after registration

## 🔒 Security Configuration

### Firestore Rules (Recommended)
Update your Firestore rules in Firebase Console:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Users can only access their own data
    match /users/{userId} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
    }
    
    // Holdings can only be accessed by the owner
    match /holdings/{holdingId} {
      allow read, write: if request.auth != null && 
        resource.data.user_id == request.auth.uid;
    }
  }
}
```

**Note:** Since you're using custom JWT authentication (not Firebase Auth), you may need to adjust these rules or keep them open and rely on your backend for security.

## 📁 Project Structure

Your current structure with Firebase:
```
backend/
├── server.js          ← Firebase-enabled backend
├── package.json       ← Includes firebase-admin
└── .env              ← Contains FIREBASE_SERVICE_ACCOUNT

client/
├── src/
│   ├── config/
│   │   └── api.ts     ← Points to your backend
│   └── lib/
│       └── supabase.ts ← Can be removed if not using Supabase
```

## 🔄 Migration from SQLite/Supabase

Your code has already been migrated! The key changes made:

1. **Replaced SQLite with Firestore:**
   - `sqlite3` operations → `admin.firestore()` operations
   - SQL queries → Firestore queries

2. **Updated Helper Functions:**
   - `findUserByEmail()` → uses `where('email', '==', email)`
   - `createUser()` → uses `doc().set()`
   - `getHoldingsByUser()` → uses `where('user_id', '==', userId)`
   - `addOrUpdateHolding()` → uses Firestore transactions

3. **Added Firebase Initialization:**
   - Service account parsing
   - Admin SDK initialization
   - Error handling for credentials

## 🚨 Important Notes

1. **Security:** The downloaded JSON file gives admin access to your Firebase project
2. **Environment Variables:** Never commit the `FIREBASE_SERVICE_ACCOUNT` to Git
3. **Firestore Rules:** Currently open for development; tighten for production
4. **Rate Limiting:** CoinGecko API calls are queued to prevent rate limiting
5. **Backup:** Keep your service account JSON safe and rotate keys periodically

## 🎯 Next Steps

1. ✅ Complete Firebase Console setup (follow steps 1-3 above)
2. ✅ Set environment variable with your service account JSON
3. ✅ Test the endpoints
4. ✅ Deploy to production with proper environment variables
5. 🔄 Optionally tighten Firestore security rules
6. 🔄 Remove unused Supabase dependencies if not needed

Your Firebase migration is **complete and ready to use**! 🎉