# Firebase Infrastructure Setup Guide
## Love Retold Recording Integration - Slice 1.1

**Backend Engineering Focus**: Enterprise-scale foundation with 99.9% uptime target  
**Security Standard**: Zero-trust architecture with defense-in-depth  
**Performance Target**: <200ms API response times with auto-scaling

---

## 🚀 Quick Start Checklist

- [ ] **Prerequisites installed** (Node.js 18+, Firebase CLI)
- [ ] **Firebase project created** ("love-retold-backend")
- [ ] **Blaze plan enabled** (required for external API calls)
- [ ] **Core services activated** (Firestore, Storage, Auth, Functions, Scheduler)
- [ ] **Security rules deployed** (Firestore + Storage)
- [ ] **Environment configured** (development, staging, production)
- [ ] **Local emulators running** (for development)

---

## 📋 Prerequisites

### Required Tools
```bash
# Node.js 18+ (LTS recommended)
node --version  # Should be 18.0.0 or higher

# Firebase CLI (latest version)
npm install -g firebase-tools

# Verify Firebase CLI installation
firebase --version
```

### Required Accounts
- **Google Account** with billing enabled
- **OpenAI Account** with API access (for transcription)
- **SendGrid Account** (for email notifications)

---

## 🏗️ Firebase Project Creation

### Step 1: Create Firebase Project

1. **Visit Firebase Console**: https://console.firebase.google.com/
2. **Create New Project**:
   - Project name: `love-retold-backend`
   - Enable Google Analytics: ✅ **Recommended**
   - Analytics account: Create new or use existing

### Step 2: Upgrade to Blaze Plan

> **⚠️ Critical**: Blaze plan required for external API calls (OpenAI, SendGrid)

1. Go to **Project Settings** → **Usage and billing**
2. Click **Modify plan**
3. Select **Blaze (Pay as you go)**
4. Set up billing alerts:
   - Budget alert at $50/month
   - Critical alert at $100/month

### Step 3: Enable Required Services

#### 🔥 Firestore Database
1. Navigate to **Firestore Database**
2. Click **Create database**
3. **Security rules**: Start in **test mode** (we'll secure later)
4. **Location**: Choose closest to your users:
   - US: `us-central1` or `us-east1`
   - Europe: `europe-west1`
   - Asia: `asia-northeast1`

#### 📦 Cloud Storage
1. Navigate to **Storage**
2. Click **Get started**
3. **Security rules**: Start in **test mode**
4. **Location**: Use same region as Firestore

#### 🔐 Authentication
1. Navigate to **Authentication**
2. Click **Get started**
3. **Sign-in methods**:
   - Enable **Email/Password** ✅
   - Enable **Anonymous** ✅ (for recording sessions)
4. **Settings**:
   - Set authorized domains for production

#### ⚡ Cloud Functions
1. Go to **Google Cloud Console**
2. Enable **Cloud Functions API**
3. Enable **Cloud Build API**
4. Return to Firebase Console → **Functions**

#### ⏰ Cloud Scheduler
1. Navigate to **Extensions**
2. Install **Firestore TTL** extension (for cleanup)
3. Cloud Scheduler will be auto-enabled

---

## 🛡️ Security Configuration

### Deploy Security Rules

```bash
# From project root directory
firebase deploy --only firestore:rules,storage:rules
```

### Verify Security Rules
1. **Firestore**: Go to Rules tab, verify rules are active
2. **Storage**: Go to Rules tab, verify rules are active
3. **Test with Firebase emulator**:
   ```bash
   firebase emulators:start --only firestore,storage,auth
   ```

---

## 🗄️ Database Setup

### Deploy Indexes
```bash
firebase deploy --only firestore:indexes
```

### Verify Index Creation
1. Go to **Firestore** → **Indexes**
2. Wait for all indexes to build (may take several minutes)
3. Status should show **Enabled** for all indexes

---

## 🔧 Local Development Setup

### Initialize Firebase in Project
```bash
# Login to Firebase (if not already logged in)
firebase login

# Initialize Firebase in your project directory
cd /path/to/New_Recording_App
firebase init

# Select the following services:
# ✅ Firestore: Configure security rules and indexes files
# ✅ Functions: Configure and write Cloud Functions
# ✅ Hosting: Configure files for Firebase Hosting and configure GitHub Action deploys
# ✅ Storage: Configure security rules for Cloud Storage
# ✅ Emulators: Set up local emulators for Firebase products

# Project Selection:
# → Use existing project: love-retold-backend
```

### Start Development Environment
```bash
# Install dependencies
npm install

# Start Firebase emulators
firebase emulators:start

# The emulator UI will be available at:
# http://localhost:4000
```

---

## 🌍 Environment Configuration

### Development Environment
```bash
# Copy template and configure for development
cp .env.template .env.development

# Configure development values:
# - Use emulator endpoints
# - Enable debug mode
# - Use test API keys
```

### Staging Environment
```bash
# Create staging Firebase project
firebase projects:create love-retold-backend-staging

# Configure staging environment
cp .env.template .env.staging

# Deploy to staging
firebase use staging
firebase deploy
```

### Production Environment
```bash
# Configure production environment
cp .env.template .env.production

# Set production secrets via CI/CD
# Never commit production API keys to git
```

---

## 📊 Monitoring Setup

### Enable Analytics
1. **Firebase Analytics**: Already enabled during project creation
2. **Performance Monitoring**:
   ```bash
   npm install firebase
   # Add Performance Monitoring SDK to your app
   ```

### Error Monitoring
```bash
# Install Sentry for error tracking
npm install @sentry/browser @sentry/tracing

# Configure in your app initialization
```

### Custom Metrics
```javascript
// Track business metrics
analytics.logEvent('recording_completed', {
  duration: recordingDuration,
  format: recordingFormat,
  transcription_confidence: confidence
});
```

---

## 🚨 Production Readiness Checklist

### Security
- [ ] **Firestore rules** deployed and tested
- [ ] **Storage rules** deployed and tested
- [ ] **Authentication** configured with proper domains
- [ ] **API keys** secured (not in source code)
- [ ] **Rate limiting** configured
- [ ] **CORS** properly configured

### Performance
- [ ] **Indexes** created and optimized
- [ ] **CDN** configured for global distribution
- [ ] **Caching** strategies implemented
- [ ] **Bundle size** optimized (<2MB total)
- [ ] **Lighthouse score** >90

### Monitoring
- [ ] **Analytics** configured and collecting data
- [ ] **Error tracking** catching and reporting issues
- [ ] **Performance monitoring** tracking Core Web Vitals
- [ ] **Uptime monitoring** configured
- [ ] **Alerting** configured for critical issues

### Backup & Recovery
- [ ] **Database backups** configured (point-in-time recovery)
- [ ] **Storage backups** configured
- [ ] **Disaster recovery** plan documented
- [ ] **Rollback procedures** tested

---

## 🔍 Troubleshooting

### Common Issues

**1. "Insufficient permissions" error**
```bash
# Ensure you're logged in as project owner
firebase login
firebase projects:list
```

**2. "Quota exceeded" error**
```bash
# Check usage in Firebase Console
# Upgrade to Blaze plan if needed
# Configure budget alerts
```

**3. "Index not found" error**
```bash
# Deploy indexes
firebase deploy --only firestore:indexes

# Wait for indexes to build (check console)
```

**4. "CORS error" in development**
```bash
# Use Firebase emulators for local development
firebase emulators:start

# Configure CORS in production
```

### Getting Help

1. **Firebase Documentation**: https://firebase.google.com/docs
2. **Stack Overflow**: Tag questions with `firebase`
3. **Firebase GitHub**: https://github.com/firebase/firebase-js-sdk
4. **Firebase Slack**: https://firebase.community/

---

## 📈 Performance Optimization

### Database Optimization
```javascript
// Use compound indexes for complex queries
// Limit result sets with pagination
// Use subcollections for 1-to-many relationships
// Cache frequently accessed data
```

### Storage Optimization
```javascript
// Use appropriate file formats (WebM for web)
// Implement progressive upload for large files
// Use Cloud CDN for global distribution
// Compress files on client-side before upload
```

### Function Optimization
```javascript
// Keep functions warm with scheduled pings
// Use connection pooling for external APIs
// Implement proper error handling and retries
// Monitor cold start times and optimize
```

---

## 🔐 Security Best Practices

### Authentication Security
- **Strong password requirements**
- **Email verification** for new accounts
- **Account lockout** after failed attempts
- **Session timeout** configuration

### Data Security
- **Encrypt sensitive data** at rest and in transit
- **Input validation** on all user inputs
- **SQL injection prevention** (Firestore is NoSQL but still validate)
- **XSS protection** with proper escaping

### API Security
- **Rate limiting** per user and IP
- **API key rotation** schedule
- **Access token expiration**
- **Audit logging** for all data access

---

This setup guide ensures your Firebase infrastructure meets enterprise standards with proper security, performance, and monitoring from day one. Follow each step carefully and verify all configurations before proceeding to the next phase.