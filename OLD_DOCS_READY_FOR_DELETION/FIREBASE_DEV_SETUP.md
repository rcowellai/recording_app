# Firebase Dev Project Setup Guide

## 🔧 Services to Enable (Manual Console Steps)

Your Firebase project: **love-retold-dev**
Console URL: https://console.firebase.google.com/project/love-retold-dev

### 1. Enable Firestore Database
1. Go to **Firestore Database** in left menu
2. Click **"Create database"**
3. Choose **"Start in test mode"** (we'll update rules later)
4. Select region: **us-central** (recommended)
5. Click **"Done"**

### 2. Enable Cloud Storage
1. Go to **Storage** in left menu  
2. Click **"Get started"**
3. Keep default rules (will update later)
4. Select region: **us-central** (same as Firestore)
5. Click **"Done"**

### 3. Enable Authentication
1. Go to **Authentication** in left menu
2. Click **"Get started"**
3. Go to **"Sign-in method"** tab
4. Enable **"Anonymous"** provider
5. Click **"Save"**

### 4. Enable Functions & Upgrade to Blaze Plan
1. Go to **Functions** in left menu
2. Click **"Get started"**
3. You'll be prompted to upgrade to **Blaze (Pay as you go)**
4. **Upgrade is required** for Cloud Functions
5. Set spending limit if desired (e.g., $10/month)

## ✅ Verification Steps

Once you've completed the above:
- Firestore Database shows "Cloud Firestore" tab
- Storage shows empty bucket
- Authentication shows "Anonymous" as enabled
- Functions shows getting started page
- Project is on Blaze plan

## 🚨 Important Notes
- All services should use **us-central** region for consistency
- Test mode rules are temporary - we'll deploy proper security rules
- Blaze plan has generous free tier - charges only for usage beyond limits

Let me know when these steps are complete! ✅