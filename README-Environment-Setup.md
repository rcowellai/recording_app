# Love Retold Recording App - Environment Setup

## 🔥 Firebase Environment Configuration

The recording app now uses **environment variables** for Firebase configuration following best practices.

## 📁 Environment Files Structure

```
recording-app/
├── .env.production     ✅ Production config (committed)
├── .env.local         ✅ Local development (committed)  
└── .env.*.local       🔒 Environment overrides (gitignored)
```

## 🚀 Environment Variables

### Required Variables
```env
# Love Retold Firebase Project
VITE_FIREBASE_API_KEY=AIzaSyDzmURSpnS3fJhDgWDk5wDRt4I5tBv-Vb8
VITE_FIREBASE_AUTH_DOMAIN=love-retold-webapp.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=love-retold-webapp
VITE_FIREBASE_STORAGE_BUCKET=love-retold-webapp.firebasestorage.app
VITE_FIREBASE_MESSAGING_SENDER_ID=313648890321
VITE_FIREBASE_APP_ID=1:313648890321:web:542b6ac1a778495e4fa0f0
VITE_FIREBASE_MEASUREMENT_ID=G-RBB0F7DBBC
```

### Configuration Variables
```env
# Recording Settings
VITE_MAX_RECORDING_TIME_MINUTES=15
VITE_CHUNK_DURATION_SECONDS=45
VITE_MAX_FILE_SIZE_MB=500

# Supported Formats (MP4-first strategy)
VITE_SUPPORTED_AUDIO_TYPES=audio/mp4,audio/webm,audio/wav
VITE_SUPPORTED_VIDEO_TYPES=video/mp4,video/webm

# Love Retold Integration
VITE_LOVE_RETOLD_SESSION_TIMEOUT_DAYS=7
VITE_ANONYMOUS_AUTH_ENABLED=true
```

## 🛡️ Security Features

### Environment Variable Validation
The app validates all required environment variables at startup:
```javascript
const requiredEnvVars = [
  'VITE_FIREBASE_API_KEY',
  'VITE_FIREBASE_AUTH_DOMAIN', 
  'VITE_FIREBASE_PROJECT_ID',
  'VITE_FIREBASE_STORAGE_BUCKET',
  'VITE_FIREBASE_MESSAGING_SENDER_ID',
  'VITE_FIREBASE_APP_ID'
];
```

### Git Configuration
- **`.env.production`** and **`.env.local`** are committed (safe, client-side config)
- **`.env.*.local`** files are gitignored for environment-specific overrides
- Old/obsolete environment files have been removed

## 🔧 Development Setup

### Local Development
1. The app will automatically use **`.env.local`** for development
2. No additional setup needed - Firebase credentials are already configured
3. Run: `npm run dev`

### Production Build  
1. Uses **`.env.production`** for production builds
2. Run: `npm run build`

### Custom Environment Overrides
Create `.env.development.local` or `.env.production.local` to override specific variables without committing changes.

## ✅ Verification

Build verification shows successful environment variable integration:
- ✅ Clean build with no errors
- ✅ Firebase configuration loaded from environment variables  
- ✅ All Love Retold credentials properly configured

## 🧹 Cleanup Completed

**Removed obsolete files:**
- ❌ `recording-app/.env` (old dev config)
- ❌ `recording-app/.env.dev` (redundant)
- ❌ `recording-app/.env.example` (replaced by production config)
- ❌ Root-level `.env.*` files (not used by recording app)

**Current clean structure:**
- ✅ Environment variables in `firebase.js`
- ✅ Proper `.gitignore` configuration
- ✅ Production-ready environment management

The recording app now follows best practices for environment configuration while maintaining full Love Retold Firebase integration.