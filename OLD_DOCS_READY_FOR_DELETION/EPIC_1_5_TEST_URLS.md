# Epic 1.5 Integration Testing URLs

## 🚀 Recording App Base URL
- **Development**: http://localhost:3001
- **Production**: https://love-retold-dev.web.app (when deployed)

## 🧪 Test Session URLs for Manual Testing

### ✅ Valid Sessions (should allow recording)
- http://localhost:3001/record/epic15_active_session_1
- http://localhost:3001/record/epic15_active_session_2

### ⏰ Expired Session (should show expired message)
- http://localhost:3001/record/epic15_expired_session

### ✅ Completed Session (should show already completed message)
- http://localhost:3001/record/epic15_completed_session

### 🚫 Removed Session (should show removed message)
- http://localhost:3001/record/epic15_removed_session

### ❌ Invalid Session (should show not found message)
- http://localhost:3001/record/invalid_session_id_test

---

## 📋 Manual Test Data Creation Steps

**Since the automated seeding failed, create these manually in Firebase Console:**

### 1. Go to Firestore Database
https://console.firebase.google.com/project/love-retold-dev/firestore

### 2. Create Collection: `recordingSessions`

### 3. Add Test Documents:

#### Document ID: `epic15_active_session_1`
```json
{
  "id": "epic15_active_session_1",
  "userId": "epic15_test_user",
  "questionText": "Tell me about your favorite childhood memory.",
  "status": "active",
  "createdAt": [current timestamp],
  "expiresAt": [timestamp 7 days from now],
  "updatedAt": [current timestamp],
  "metadata": {
    "testSession": true,
    "epic": "1.5",
    "expectedResult": "valid"
  }
}
```

#### Document ID: `epic15_expired_session`
```json
{
  "id": "epic15_expired_session", 
  "userId": "epic15_test_user",
  "questionText": "This session has expired.",
  "status": "active",
  "createdAt": [yesterday timestamp],
  "expiresAt": [yesterday timestamp],
  "updatedAt": [yesterday timestamp],
  "metadata": {
    "testSession": true,
    "epic": "1.5", 
    "expectedResult": "expired"
  }
}
```

#### Document ID: `epic15_completed_session`
```json
{
  "id": "epic15_completed_session",
  "userId": "epic15_test_user", 
  "questionText": "This recording has already been completed.",
  "status": "completed",
  "createdAt": [current timestamp],
  "expiresAt": [timestamp 7 days from now],
  "completedAt": [current timestamp],
  "updatedAt": [current timestamp],
  "storyId": "story_epic15_completed_session_test",
  "metadata": {
    "testSession": true,
    "epic": "1.5",
    "expectedResult": "completed"
  }
}
```

---

## 🎯 Expected Test Results

| Test Case | URL | Expected Behavior |
|-----------|-----|-------------------|
| **Valid Session** | `/record/epic15_active_session_1` | Shows recording interface, allows recording |
| **Expired Session** | `/record/epic15_expired_session` | Shows "Link has expired" error message |
| **Completed Session** | `/record/epic15_completed_session` | Shows "Already completed" error message |
| **Invalid Session** | `/record/invalid_session_id_test` | Shows "Session not found" error message |

## 🔗 Epic 1.5 Integration Flow Test

**Complete Happy Path:**
1. Click valid session URL → Recording page loads
2. Grant microphone permission → Recording interface appears  
3. Click record → Audio recording starts
4. Click stop → Audio stops, upload begins
5. Upload completes → Cloud Function triggers
6. Cloud Function creates story → Story appears in StoryDisplay
7. **SUCCESS**: End-to-end flow working ✅

## 📊 Success Criteria Validation

- [ ] Recording success rate: ≥90% (test multiple attempts)
- [ ] Upload success rate: ≥95% (test multiple uploads)
- [ ] Cross-browser compatibility: 100% (test Chrome/Firefox/Edge)
- [ ] Story creation success rate: 100% (verify in Firestore)
- [ ] Session validation accuracy: 100% (test all error cases)

---

## 🚨 Next Steps After Manual Data Creation

1. **Test Session Validation**: Visit each URL and verify expected behavior
2. **Test Recording Flow**: Complete full recording on valid session
3. **Verify Cloud Function**: Check Firestore for created story documents
4. **Cross-Browser Testing**: Test on multiple browsers
5. **Performance Testing**: Measure upload times and success rates
6. **Generate Epic 1.5 Validation Report**: Document all results