# Love Retold Architecture Blueprint
## Recording App & Main Platform Integration

**Version:** 1.0  
**Date:** January 2025  
**Status:** Final Design

---

## 1. System Architecture Overview

```
┌─────────────────────────────────────────────────────────────────┐
│                     LOVE RETOLD ECOSYSTEM                        │
├─────────────────────────────────────────────────────────────────┤
│                                                                   │
│  ┌──────────────────┐        ┌──────────────────────┐          │
│  │  Main Platform   │        │   Recording App      │          │
│  │ loveretold.com   │        │ record.loveretold.com│          │
│  └────────┬─────────┘        └──────────┬───────────┘          │
│           │                              │                       │
│           └──────────┬───────────────────┘                      │
│                      │                                           │
│              ┌───────▼────────┐                                 │
│              │  Firebase       │                                 │
│              │  Backend        │                                 │
│              ├─────────────────┤                                 │
│              │ • Firestore     │                                 │
│              │ • Storage       │                                 │
│              │ • Functions     │                                 │
│              │ • Auth          │                                 │
│              └─────────────────┘                                 │
└─────────────────────────────────────────────────────────────────┘
```

---

## 2. Firebase Data Architecture

### 2.1 Firestore Collections Structure

```javascript
// USERS COLLECTION - Account holders (couples)
/users/{userId}
{
  // Profile Information
  uid: string,
  email: string,
  phoneNumber: string,
  displayName: string,
  partnerName: string,
  weddingDate: Timestamp,
  storyTitle: string,
  timezone: string,
  profilePhotoUrl: string,
  
  // Preferences
  preferences: {
    promptFrequency: 'weekly' | 'biweekly' | 'monthly',
    promptDeliveryDay: 0-6, // 0 = Sunday
    promptDeliveryTime: string, // "09:00"
    promptDeliveryMethod: 'email' | 'sms' | 'both',
    notificationSettings: {
      newRecording: boolean,
      promptReminder: boolean,
      weeklyDigest: boolean
    }
  },
  
  // Account Status
  accountStatus: 'active' | 'paused' | 'cancelled',
  subscriptionTier: 'basic' | 'premium',
  createdAt: Timestamp,
  updatedAt: Timestamp,
  
  // Statistics
  stats: {
    totalPromptsSent: number,
    totalRecordings: number,
    totalStorytellers: number,
    storageUsed: number // bytes
  }
}

// STORYTELLERS COLLECTION - People who can record
/users/{userId}/storytellers/{storytellerId}
{
  storytellerId: string,
  name: string,
  email: string,
  phoneNumber: string,
  relationship: string, // "Mother of Bride", "Best Man", etc.
  inviteStatus: 'pending' | 'accepted' | 'declined',
  invitedAt: Timestamp,
  acceptedAt: Timestamp | null,
  photoUrl: string,
  stats: {
    promptsAssigned: number,
    recordingsCompleted: number
  }
}

// PROMPTS COLLECTION - Question library and queue
/prompts/{promptId}
{
  promptId: string,
  userId: string, // Owner of this prompt instance
  
  // Prompt Content
  questionText: string,
  category: 'first-meeting' | 'proposal' | 'wedding-day' | 'family' | 'custom',
  isCustom: boolean,
  suggestedFor: string[], // ['bride', 'groom', 'parents', 'friends']
  
  // Assignment
  assignedTo: {
    storytellerId: string,
    storytellerName: string,
    storytellerEmail: string
  },
  
  // Scheduling
  scheduledFor: Timestamp,
  deliveryMethod: 'email' | 'sms' | 'both',
  status: 'queued' | 'sent' | 'recorded' | 'cancelled',
  
  // Tracking
  queuePosition: number,
  sentAt: Timestamp | null,
  recordingSessionId: string | null,
  
  // Metadata
  createdAt: Timestamp,
  updatedAt: Timestamp
}

// RECORDING SESSIONS COLLECTION - Active recording links
/recordingSessions/{sessionId}
{
  sessionId: string, // Format: {random}-{promptId}-{userId}-{storytellerId}-{timestamp}
  
  // Relations
  userId: string,
  promptId: string,
  storytellerId: string,
  
  // Display Data (denormalized for recording app)
  promptText: string,
  storytellerName: string,
  coupleNames: string,
  
  // Session Configuration
  maxDuration: 900, // 15 minutes in seconds
  videoQuality: '480p',
  allowAudio: boolean,
  allowVideo: boolean,
  
  // Session Status
  status: 'pending' | 'active' | 'recording' | 'uploading' | 'processing' | 'completed' | 'failed' | 'expired' | 'deleted',
  
  // Timestamps
  createdAt: Timestamp,
  expiresAt: Timestamp, // createdAt + 365 days
  recordingStartedAt: Timestamp | null,
  recordingCompletedAt: Timestamp | null,
  
  // Recording Data
  recordingData: {
    duration: number | null, // seconds
    fileSize: number | null, // bytes
    mimeType: string | null, // 'video/mp4' or 'audio/webm'
    chunksCount: number | null,
    uploadProgress: number, // 0-100
    lastChunkUploaded: number | null
  },
  
  // Storage References
  storagePaths: {
    chunksFolder: string | null, // users/{userId}/recordings/{sessionId}/chunks/
    finalVideo: string | null,   // users/{userId}/recordings/{sessionId}/final/recording.mp4
    thumbnail: string | null     // users/{userId}/recordings/{sessionId}/thumbnail.jpg
  },
  
  // Processing Status
  transcription: {
    status: 'pending' | 'processing' | 'completed' | 'failed',
    startedAt: Timestamp | null,
    completedAt: Timestamp | null,
    whisperJobId: string | null,
    wordCount: number | null
  },
  
  // Error Tracking
  error: {
    code: string | null,
    message: string | null,
    timestamp: Timestamp | null,
    retryable: boolean,
    retryCount: number
  } | null,
  
  // Device Info (optional)
  deviceInfo: {
    userAgent: string,
    platform: string,
    browser: string
  } | null
}

// STORIES COLLECTION - Transcribed and edited content
/stories/{storyId}
{
  storyId: string,
  userId: string,
  
  // Relations
  promptId: string,
  sessionId: string,
  storytellerId: string,
  
  // Content
  title: string,
  originalTranscription: string,
  editedTranscription: string,
  finalText: string, // What will appear in book
  
  // Media References
  recordingUrl: string, // Storage URL
  thumbnailUrl: string,
  duration: number, // seconds
  
  // Story Metadata
  chapter: string, // "How We Met", "The Proposal", etc.
  orderInChapter: number,
  includeInBook: boolean,
  
  // Photos
  photos: [
    {
      photoId: string,
      url: string,
      caption: string,
      orderIndex: number
    }
  ],
  
  // AI Enhancement
  aiEnhancements: {
    tone: 'romantic' | 'humorous' | 'heartfelt' | 'formal',
    perspective: 'first-person' | 'third-person',
    length: 'concise' | 'detailed',
    lastRewriteAt: Timestamp
  },
  
  // Timestamps
  createdAt: Timestamp,
  updatedAt: Timestamp,
  
  // Sharing
  shareableLink: string | null,
  shareExpiresAt: Timestamp | null
}
```

### 2.2 Firebase Storage Structure

```
love-retold-production.appspot.com/
├── users/
│   └── {userId}/
│       ├── profile/
│       │   └── avatar.jpg
│       ├── recordings/
│       │   └── {sessionId}/
│       │       ├── chunks/
│       │       │   ├── chunk_0.mp4
│       │       │   ├── chunk_1.mp4
│       │       │   └── chunk_n.mp4
│       │       ├── final/
│       │       │   └── recording.mp4
│       │       └── thumbnail.jpg
│       └── photos/
│           └── {photoId}/
│               └── photo.jpg
└── temp/
    └── processing/
        └── {jobId}/
```

---

## 3. Cloud Functions Architecture

### 3.1 Core Functions Overview

```typescript
// functions/src/index.ts

// ============================================
// PROMPT MANAGEMENT FUNCTIONS
// ============================================

/**
 * Scheduled function - Runs every hour
 * Processes prompt queue and sends emails/SMS
 */
export const processPromptQueue = functions.pubsub
  .schedule('0 * * * *')
  .onRun(async (context) => {
    // Query prompts due for sending
    // Generate recording sessions
    // Send emails/SMS with unique links
    // Update prompt status
  });

/**
 * HTTP Callable - Record Now feature
 * Creates immediate recording session
 */
export const createImmediateRecordingSession = functions.https
  .onCall(async (data, context) => {
    // Validate user authentication
    // Create recording session
    // Return session URL
  });

// ============================================
// RECORDING PROCESSING FUNCTIONS
// ============================================

/**
 * Storage Trigger - Processes completed recordings
 * Triggers when final recording is uploaded
 */
export const processCompletedRecording = functions.storage
  .object()
  .onFinalize(async (object) => {
    // Validate file is in recordings/final/ path
    // Merge chunks if needed
    // Generate thumbnail
    // Trigger transcription
    // Update session status
  });

/**
 * Firestore Trigger - Handles session status changes
 * Orchestrates different processing stages
 */
export const onRecordingSessionUpdate = functions.firestore
  .document('recordingSessions/{sessionId}')
  .onUpdate(async (change, context) => {
    const before = change.before.data();
    const after = change.after.data();
    
    // Handle status transitions
    switch(after.status) {
      case 'processing':
        await startTranscription(context.params.sessionId);
        break;
      case 'completed':
        await createStory(context.params.sessionId);
        break;
      case 'failed':
        await handleRecordingFailure(context.params.sessionId);
        break;
    }
  });

// ============================================
// TRANSCRIPTION FUNCTIONS
// ============================================

/**
 * HTTP Queue - Processes transcription with OpenAI Whisper
 * Handles retry logic and chunking for long recordings
 */
export const transcribeRecording = functions.tasks
  .taskQueue({
    retryConfig: {
      maxAttempts: 3,
      minBackoffSeconds: 60
    },
    rateLimits: {
      maxConcurrentDispatches: 5
    }
  })
  .onDispatch(async (data) => {
    // Download recording from Storage
    // Split if >25MB for Whisper API
    // Send to OpenAI Whisper
    // Store transcription
    // Update session and create story
  });

// ============================================
// STORY MANAGEMENT FUNCTIONS
// ============================================

/**
 * HTTP Callable - AI-powered story rewriting
 * Enhances transcription with better narrative
 */
export const rewriteStory = functions.https
  .onCall(async (data, context) => {
    // Validate user owns story
    // Call OpenAI GPT-4 with parameters
    // Save enhanced version
    // Return rewritten text
  });

/**
 * HTTP Callable - Generate shareable link
 * Creates temporary public access to story
 */
export const createShareableLink = functions.https
  .onCall(async (data, context) => {
    // Generate unique share ID
    // Set expiration (7 days)
    // Create signed URL for media
    // Return shareable link
  });

// ============================================
// MAINTENANCE FUNCTIONS
// ============================================

/**
 * Scheduled function - Daily cleanup
 * Removes expired sessions and temp files
 */
export const cleanupExpiredSessions = functions.pubsub
  .schedule('0 2 * * *') // 2 AM daily
  .onRun(async (context) => {
    // Query expired sessions (>365 days)
    // Delete associated storage files
    // Update session status to 'expired'
    // Clean temp processing files
  });

/**
 * Scheduled function - Storage optimization
 * Compresses and archives old recordings
 */
export const optimizeStorage = functions.pubsub
  .schedule('0 3 * * 0') // Weekly at 3 AM Sunday
  .onRun(async (context) => {
    // Find recordings >30 days old
    // Compress video files
    // Move to archive bucket
    // Update storage references
  });
```

### 3.2 Detailed Function Implementations

```typescript
// functions/src/prompts/processQueue.ts

import * as functions from 'firebase-functions';
import * as admin from 'firebase-admin';
import { sendEmail, sendSMS } from '../utils/notifications';

export async function processPromptQueue() {
  const now = admin.firestore.Timestamp.now();
  const db = admin.firestore();
  
  // Get all prompts due for sending
  const promptsSnapshot = await db
    .collection('prompts')
    .where('status', '==', 'queued')
    .where('scheduledFor', '<=', now)
    .limit(50) // Process in batches
    .get();
  
  const batch = db.batch();
  const sessions: any[] = [];
  
  for (const doc of promptsSnapshot.docs) {
    const prompt = doc.data();
    
    // Generate unique session ID
    const sessionId = generateSessionId(
      prompt.promptId,
      prompt.userId,
      prompt.assignedTo.storytellerId
    );
    
    // Create recording session
    const session = {
      sessionId,
      userId: prompt.userId,
      promptId: prompt.promptId,
      storytellerId: prompt.assignedTo.storytellerId,
      promptText: prompt.questionText,
      storytellerName: prompt.assignedTo.storytellerName,
      coupleNames: await getCoupleNames(prompt.userId),
      maxDuration: 900,
      videoQuality: '480p',
      allowAudio: true,
      allowVideo: true,
      status: 'pending',
      createdAt: now,
      expiresAt: admin.firestore.Timestamp.fromDate(
        new Date(Date.now() + 365 * 24 * 60 * 60 * 1000)
      ),
      recordingData: {
        uploadProgress: 0
      },
      transcription: {
        status: 'pending'
      }
    };
    
    // Add session to batch
    batch.set(db.collection('recordingSessions').doc(sessionId), session);
    
    // Update prompt status
    batch.update(doc.ref, {
      status: 'sent',
      sentAt: now,
      recordingSessionId: sessionId
    });
    
    sessions.push({
      session,
      prompt,
      recordingUrl: `https://record.loveretold.com/?session=${sessionId}`
    });
  }
  
  // Commit batch
  await batch.commit();
  
  // Send notifications
  for (const item of sessions) {
    const { prompt, recordingUrl } = item;
    
    if (prompt.deliveryMethod === 'email' || prompt.deliveryMethod === 'both') {
      await sendEmail({
        to: prompt.assignedTo.storytellerEmail,
        subject: 'You have a new memory to record',
        templateId: 'prompt-notification',
        data: {
          storytellerName: prompt.assignedTo.storytellerName,
          questionText: prompt.questionText,
          recordingUrl,
          coupleNames: item.session.coupleNames
        }
      });
    }
    
    if (prompt.deliveryMethod === 'sms' || prompt.deliveryMethod === 'both') {
      await sendSMS({
        to: prompt.assignedTo.storytellerPhone,
        message: `Hi ${prompt.assignedTo.storytellerName}! You have a new memory to record for ${item.session.coupleNames}. Click here: ${recordingUrl}`
      });
    }
  }
  
  console.log(`Processed ${sessions.length} prompts`);
}

// Helper function to generate secure session ID
function generateSessionId(promptId: string, userId: string, storytellerId: string): string {
  const random = Math.random().toString(36).substring(2, 9);
  const timestamp = Date.now();
  return `${random}-${promptId}-${userId}-${storytellerId}-${timestamp}`;
}
```

```typescript
// functions/src/transcription/whisperService.ts

import * as functions from 'firebase-functions';
import OpenAI from 'openai';
import * as admin from 'firebase-admin';

const openai = new OpenAI({
  apiKey: functions.config().openai.api_key
});

export async function transcribeWithWhisper(
  sessionId: string,
  videoPath: string
): Promise<string> {
  
  const storage = admin.storage();
  const db = admin.firestore();
  
  try {
    // Update transcription status
    await db.collection('recordingSessions').doc(sessionId).update({
      'transcription.status': 'processing',
      'transcription.startedAt': admin.firestore.FieldValue.serverTimestamp()
    });
    
    // Download video file
    const bucket = storage.bucket();
    const file = bucket.file(videoPath);
    const [buffer] = await file.download();
    
    // Convert to File object for Whisper API
    const audioFile = new File([buffer], 'recording.mp4', { type: 'video/mp4' });
    
    // Call Whisper API
    const transcription = await openai.audio.transcriptions.create({
      file: audioFile,
      model: 'whisper-1',
      response_format: 'verbose_json',
      timestamp_granularities: ['word']
    });
    
    // Update session with transcription
    await db.collection('recordingSessions').doc(sessionId).update({
      'transcription.status': 'completed',
      'transcription.completedAt': admin.firestore.FieldValue.serverTimestamp(),
      'transcription.wordCount': transcription.text.split(' ').length
    });
    
    // Create story document
    await createStoryFromTranscription(sessionId, transcription.text);
    
    return transcription.text;
    
  } catch (error) {
    console.error('Transcription failed:', error);
    
    // Update with error status
    await db.collection('recordingSessions').doc(sessionId).update({
      'transcription.status': 'failed',
      'error': {
        code: 'TRANSCRIPTION_FAILED',
        message: error.message,
        timestamp: admin.firestore.FieldValue.serverTimestamp(),
        retryable: true
      }
    });
    
    throw error;
  }
}

async function createStoryFromTranscription(
  sessionId: string,
  transcriptionText: string
): Promise<void> {
  
  const db = admin.firestore();
  
  // Get session data
  const sessionDoc = await db.collection('recordingSessions').doc(sessionId).get();
  const session = sessionDoc.data();
  
  if (!session) throw new Error('Session not found');
  
  // Get prompt data for chapter assignment
  const promptDoc = await db.collection('prompts').doc(session.promptId).get();
  const prompt = promptDoc.data();
  
  // Create story document
  const storyId = `story_${sessionId}`;
  await db.collection('stories').doc(storyId).set({
    storyId,
    userId: session.userId,
    promptId: session.promptId,
    sessionId: sessionId,
    storytellerId: session.storytellerId,
    
    // Content
    title: prompt?.questionText || 'Untitled Story',
    originalTranscription: transcriptionText,
    editedTranscription: transcriptionText,
    finalText: transcriptionText,
    
    // Media
    recordingUrl: session.storagePaths?.finalVideo || '',
    thumbnailUrl: session.storagePaths?.thumbnail || '',
    duration: session.recordingData?.duration || 0,
    
    // Organization
    chapter: mapCategoryToChapter(prompt?.category),
    orderInChapter: await getNextOrderInChapter(session.userId, prompt?.category),
    includeInBook: true,
    
    // Photos (empty initially)
    photos: [],
    
    // Timestamps
    createdAt: admin.firestore.FieldValue.serverTimestamp(),
    updatedAt: admin.firestore.FieldValue.serverTimestamp()
  });
  
  // Update user stats
  await db.collection('users').doc(session.userId).update({
    'stats.totalRecordings': admin.firestore.FieldValue.increment(1)
  });
  
  // Mark prompt as recorded
  await db.collection('prompts').doc(session.promptId).update({
    status: 'recorded'
  });
}

function mapCategoryToChapter(category: string): string {
  const mapping = {
    'first-meeting': 'How We Met',
    'proposal': 'The Proposal',
    'wedding-day': 'Our Wedding Day',
    'family': 'Family & Friends',
    'custom': 'Our Story'
  };
  return mapping[category] || 'Our Story';
}
```

---

## 4. Real-Time Data Synchronization

### 4.1 Main Platform Listeners

```typescript
// webapp/src/services/realtimeSync.ts

import { 
  collection, 
  query, 
  where, 
  onSnapshot,
  orderBy 
} from 'firebase/firestore';

export class RealtimeSync {
  private unsubscribers: Map<string, () => void> = new Map();
  
  // Listen for new recordings
  subscribeToRecordings(userId: string, callback: (stories: Story[]) => void) {
    const q = query(
      collection(db, 'stories'),
      where('userId', '==', userId),
      orderBy('createdAt', 'desc')
    );
    
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const stories = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Story[];
      
      callback(stories);
    });
    
    this.unsubscribers.set(`recordings_${userId}`, unsubscribe);
  }
  
  // Listen for prompt status changes
  subscribeToPrompts(userId: string, callback: (prompts: Prompt[]) => void) {
    const q = query(
      collection(db, 'prompts'),
      where('userId', '==', userId),
      where('status', 'in', ['queued', 'sent']),
      orderBy('scheduledFor', 'asc')
    );
    
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const prompts = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Prompt[];
      
      callback(prompts);
    });
    
    this.unsubscribers.set(`prompts_${userId}`, unsubscribe);
  }
  
  // Listen for recording session updates
  subscribeToActiveSessions(userId: string, callback: (sessions: RecordingSession[]) => void) {
    const q = query(
      collection(db, 'recordingSessions'),
      where('userId', '==', userId),
      where('status', 'in', ['recording', 'uploading', 'processing'])
    );
    
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const sessions = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as RecordingSession[];
      
      // Show processing indicator in UI
      callback(sessions);
    });
    
    this.unsubscribers.set(`sessions_${userId}`, unsubscribe);
  }
  
  // Cleanup subscriptions
  unsubscribeAll() {
    this.unsubscribers.forEach(unsubscribe => unsubscribe());
    this.unsubscribers.clear();
  }
}
```

### 4.2 Recording App Real-Time Updates

```typescript
// recording-app/src/services/sessionMonitor.ts

import { doc, onSnapshot } from 'firebase/firestore';

export class SessionMonitor {
  private unsubscribe: (() => void) | null = null;
  
  // Monitor session for external changes
  watchSession(sessionId: string, callbacks: {
    onDeleted: () => void,
    onExpired: () => void,
    onStatusChange: (status: string) => void
  }) {
    const sessionRef = doc(db, 'recordingSessions', sessionId);
    
    this.unsubscribe = onSnapshot(sessionRef, (snapshot) => {
      if (!snapshot.exists()) {
        callbacks.onDeleted();
        return;
      }
      
      const data = snapshot.data();
      
      // Check expiration
      if (new Date() > data.expiresAt.toDate()) {
        callbacks.onExpired();
        return;
      }
      
      // Monitor status changes
      callbacks.onStatusChange(data.status);
    });
  }
  
  cleanup() {
    if (this.unsubscribe) {
      this.unsubscribe();
      this.unsubscribe = null;
    }
  }
}
```

---

## 5. Security Implementation

### 5.1 Firebase Security Rules

```javascript
// firestore.rules

rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    
    // Helper functions
    function isAuthenticated() {
      return request.auth != null;
    }
    
    function isOwner(userId) {
      return isAuthenticated() && request.auth.uid == userId;
    }
    
    function isValidSession(sessionId) {
      let session = get(/databases/$(database)/documents/recordingSessions/$(sessionId));
      return session != null && 
             session.data.expiresAt > request.time &&
             session.data.status in ['pending', 'active'];
    }
    
    // Users collection - only owner can read/write
    match /users/{userId} {
      allow read, write: if isOwner(userId);
      
      // Storytellers subcollection
      match /storytellers/{storytellerId} {
        allow read, write: if isOwner(userId);
      }
    }
    
    // Prompts - owner only
    match /prompts/{promptId} {
      allow read: if isAuthenticated() && 
                     resource.data.userId == request.auth.uid;
      allow create: if isOwner(request.resource.data.userId);
      allow update: if isOwner(resource.data.userId);
      allow delete: if isOwner(resource.data.userId);
    }
    
    // Recording Sessions - public read for valid links, limited updates
    match /recordingSessions/{sessionId} {
      // Anyone with link can read
      allow read: if true;
      
      // Only allow status updates from recording app (no auth)
      allow update: if request.auth == null &&
                      request.resource.data.status in ['active', 'recording', 'uploading', 'processing', 'failed'] &&
                      resource.data.status in ['pending', 'active', 'recording', 'uploading', 'failed'] &&
                      request.resource.data.userId == resource.data.userId && // Can't change owner
                      request.resource.data.promptId == resource.data.promptId; // Can't change prompt
      
      // Only owner can create or delete
      allow create: if isOwner(request.resource.data.userId);
      allow delete: if isOwner(resource.data.userId);
    }
    
    // Stories - owner only
    match /stories/{storyId} {
      allow read: if isOwner(resource.data.userId);
      allow write: if isOwner(request.resource.data.userId);
    }
    
    // Shareable links - public read with valid link
    match /shareableLinks/{linkId} {
      allow read: if resource.data.expiresAt > request.time;
    }
  }
}
```

```javascript
// storage.rules

rules_version = '2';
service firebase.storage {
  match /b/{bucket}/o {
    
    // Helper functions
    function isOwner(userId) {
      return request.auth != null && request.auth.uid == userId;
    }
    
    function isVideoFile() {
      return request.resource.contentType.matches('video/.*') ||
             request.resource.contentType.matches('audio/.*');
    }
    
    function isImageFile() {
      return request.resource.contentType.matches('image/.*');
    }
    
    function isReasonableSize() {
      return request.resource.size < 500 * 1024 * 1024; // 500MB
    }
    
    // User profile photos
    match /users/{userId}/profile/{fileName} {
      allow read: if isOwner(userId);
      allow write: if isOwner(userId) && isImageFile() && request.resource.size < 5 * 1024 * 1024;
    }
    
    // Recording uploads - anonymous writes allowed, owner reads
    match /users/{userId}/recordings/{sessionId}/chunks/{fileName} {
      allow write: if request.auth == null && // Anonymous upload
                      isVideoFile() && 
                      isReasonableSize();
      allow read: if isOwner(userId);
    }
    
    match /users/{userId}/recordings/{sessionId}/final/{fileName} {
      allow write: if request.auth == null && isVideoFile() && isReasonableSize();
      allow read: if isOwner(userId);
    }
    
    match /users/{userId}/recordings/{sessionId}/thumbnail.jpg {
      allow write: if request.auth == null && isImageFile();
      allow read: if isOwner(userId);
    }
    
    // User photos for stories
    match /users/{userId}/photos/{photoId}/{fileName} {
      allow read, write: if isOwner(userId) && isImageFile() && request.resource.size < 10 * 1024 * 1024;
    }
    
    // Temporary processing files - system only
    match /temp/{allPaths=**} {
      allow read, write: if false; // Cloud Functions only
    }
  }
}
```

---

## 6. State Management & Error Handling

### 6.1 State Machine for Recording Sessions

```typescript
// State transition diagram and implementation

enum SessionStatus {
  PENDING = 'pending',        // Link created, not yet accessed
  ACTIVE = 'active',         // User on recording page
  RECORDING = 'recording',   // Recording in progress
  UPLOADING = 'uploading',   // Chunks uploading
  PROCESSING = 'processing', // Transcription running
  COMPLETED = 'completed',   // Story created
  FAILED = 'failed',        // Error occurred
  EXPIRED = 'expired',      // 365 days passed
  DELETED = 'deleted'       // Prompt deleted
}

// Valid state transitions
const STATE_TRANSITIONS = {
  [SessionStatus.PENDING]: [SessionStatus.ACTIVE, SessionStatus.EXPIRED, SessionStatus.DELETED],
  [SessionStatus.ACTIVE]: [SessionStatus.RECORDING, SessionStatus.EXPIRED, SessionStatus.DELETED],
  [SessionStatus.RECORDING]: [SessionStatus.UPLOADING, SessionStatus.FAILED],
  [SessionStatus.UPLOADING]: [SessionStatus.PROCESSING, SessionStatus.FAILED],
  [SessionStatus.PROCESSING]: [SessionStatus.COMPLETED, SessionStatus.FAILED],
  [SessionStatus.COMPLETED]: [], // Terminal state
  [SessionStatus.FAILED]: [SessionStatus.PENDING, SessionStatus.ACTIVE], // Can retry
  [SessionStatus.EXPIRED]: [], // Terminal state
  [SessionStatus.DELETED]: []  // Terminal state
};

// State transition validator
export function validateStateTransition(
  currentState: SessionStatus,
  newState: SessionStatus
): boolean {
  const validTransitions = STATE_TRANSITIONS[currentState] || [];
  return validTransitions.includes(newState);
}
```

### 6.2 Error Recovery Strategies

```typescript
// Comprehensive error handling system

interface ErrorRecoveryStrategy {
  errorCode: string;
  maxRetries: number;
  backoffMs: number;
  recoveryAction: () => Promise<void>;
}

const ERROR_RECOVERY_MAP: Map<string, ErrorRecoveryStrategy> = new Map([
  ['UPLOAD_FAILED', {
    errorCode: 'UPLOAD_FAILED',
    maxRetries: 3,
    backoffMs: 2000,
    recoveryAction: async () => {
      // Resume from last successful chunk
      const lastChunk = await getLastUploadedChunk();
      await resumeUploadFromChunk(lastChunk + 1);
    }
  }],
  
  ['TRANSCRIPTION_FAILED', {
    errorCode: 'TRANSCRIPTION_FAILED',
    maxRetries: 3,
    backoffMs: 60000, // 1 minute
    recoveryAction: async () => {
      // Retry with different Whisper parameters
      await retryTranscriptionWithFallback();
    }
  }],
  
  ['NETWORK_ERROR', {
    errorCode: 'NETWORK_ERROR',
    maxRetries: 5,
    backoffMs: 1000,
    recoveryAction: async () => {
      // Implement exponential backoff
      await waitForNetworkRecovery();
      await retryLastOperation();
    }
  }],
  
  ['QUOTA_EXCEEDED', {
    errorCode: 'QUOTA_EXCEEDED',
    maxRetries: 0, // Don't retry
    backoffMs: 0,
    recoveryAction: async () => {
      // Notify user and provide options
      await notifyUserQuotaExceeded();
      await suggestAlternatives();
    }
  }]
]);

// Global error handler
export async function handleError(
  error: any,
  context: { sessionId: string; operation: string }
): Promise<void> {
  
  const errorCode = error.code || 'UNKNOWN_ERROR';
  const strategy = ERROR_RECOVERY_MAP.get(errorCode);
  
  if (strategy && context.retryCount < strategy.maxRetries) {
    // Wait before retry
    await new Promise(resolve => setTimeout(resolve, strategy.backoffMs));
    
    // Attempt recovery
    try {
      await strategy.recoveryAction();
    } catch (recoveryError) {
      // Log and escalate
      await logError({
        originalError: error,
        recoveryError,
        context,
        timestamp: new Date()
      });
    }
  } else {
    // Mark as failed and notify
    await markSessionAsFailed(context.sessionId, error);
    await notifyUserOfFailure(context.sessionId);
  }
}
```

---

## 7. Implementation Roadmap

### Phase 1: Foundation (Week 1)
- [ ] Set up shared Firebase project
- [ ] Configure Firestore collections
- [ ] Implement security rules
- [ ] Deploy basic Cloud Functions

### Phase 2: Integration (Week 2)
- [ ] Recording app Firebase SDK integration
- [ ] Session creation and management
- [ ] Chunked upload implementation
- [ ] Status synchronization

### Phase 3: Processing (Week 3)
- [ ] Whisper transcription pipeline
- [ ] Story creation automation
- [ ] Error handling and recovery
- [ ] Real-time updates

### Phase 4: Polish (Week 4)
- [ ] Performance optimization
- [ ] Comprehensive testing
- [ ] Monitoring and logging
- [ ] Production deployment

### Phase 5: Enhancement (Post-MVP)
- [ ] AI story rewriting
- [ ] Photo integration
- [ ] Shareable links
- [ ] Analytics dashboard

---

## 8. Monitoring & Observability

### 8.1 Key Metrics to Track

```typescript
// Firebase Functions monitoring

export const metricsCollector = functions.pubsub
  .schedule('*/5 * * * *') // Every 5 minutes
  .onRun(async () => {
    const metrics = {
      // Recording metrics
      activeRecordings: await countDocuments('recordingSessions', 'status', 'recording'),
      pendingSessions: await countDocuments('recordingSessions', 'status', 'pending'),
      failedSessions: await countDocuments('recordingSessions', 'status', 'failed'),
      
      // Processing metrics
      transcriptionQueue: await countDocuments('recordingSessions', 'transcription.status', 'processing'),
      averageTranscriptionTime: await calculateAverageProcessingTime(),
      
      // Storage metrics
      totalStorageUsed: await calculateStorageUsage(),
      averageRecordingSize: await calculateAverageFileSize(),
      
      // User engagement
      dailyActiveUsers: await countDailyActiveUsers(),
      recordingsPerDay: await countDailyRecordings(),
      promptCompletionRate: await calculateCompletionRate()
    };
    
    // Send to monitoring service
    await sendToMonitoring(metrics);
  });
```

### 8.2 Alerts Configuration

```yaml
# monitoring/alerts.yaml

alerts:
  - name: high_failure_rate
    condition: failedSessions > 10 OR failureRate > 0.1
    notification: email, slack
    severity: critical
    
  - name: transcription_backlog
    condition: transcriptionQueue > 50
    notification: slack
    severity: warning
    
  - name: storage_quota_warning
    condition: storageUsed > 0.8 * storageQuota
    notification: email
    severity: warning
    
  - name: expired_sessions_cleanup
    condition: expiredSessionsNotCleaned > 100
    notification: email
    severity: info
```

---

## 9. Testing Strategy

### 9.1 End-to-End Test Scenarios

```typescript
// e2e/tests/recording-flow.test.ts

describe('Complete Recording Flow', () => {
  it('should handle happy path from prompt to story', async () => {
    // 1. Create prompt
    const prompt = await createTestPrompt();
    
    // 2. Process queue (trigger function)
    await processPromptQueue();
    
    // 3. Verify session created
    const session = await getRecordingSession(prompt.sessionId);
    expect(session.status).toBe('pending');
    
    // 4. Simulate recording
    await simulateRecording(session.sessionId);
    
    // 5. Upload chunks
    await uploadTestChunks(session.sessionId);
    
    // 6. Complete recording
    await completeRecording(session.sessionId);
    
    // 7. Wait for transcription
    await waitForStatus(session.sessionId, 'completed', 30000);
    
    // 8. Verify story created
    const story = await getStoryBySessionId(session.sessionId);
    expect(story).toBeDefined();
    expect(story.originalTranscription).toBeTruthy();
  });
  
  it('should handle network failure during upload', async () => {
    // Test retry logic
  });
  
  it('should handle transcription failure', async () => {
    // Test fallback strategy
  });
  
  it('should enforce 365-day expiration', async () => {
    // Test expiration logic
  });
});
```

---

## Conclusion

This architecture provides a robust, scalable foundation for connecting the Love Retold main platform with the recording app. The design prioritizes:

1. **Simplicity** - Single Firebase backend, clear separation of concerns
2. **Reliability** - Comprehensive error handling and recovery strategies
3. **Performance** - Real-time updates, chunked uploads, efficient processing
4. **Security** - Granular access controls, anonymous recording capability
5. **Scalability** - Serverless functions, automatic scaling, efficient storage

The implementation roadmap provides a clear path to production with minimal risk and maximum flexibility for future enhancements.