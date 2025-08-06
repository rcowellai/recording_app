/**
 * Love Retold Recording Integration - Cloud Functions
 * Enterprise-scale serverless backend with security-first architecture
 */

import * as functions from 'firebase-functions';
import * as admin from 'firebase-admin';
import { setGlobalOptions } from 'firebase-functions/v2';

// Initialize Firebase Admin SDK
admin.initializeApp();

// Set global options for all functions
setGlobalOptions({
  maxInstances: 100,
  region: 'us-central1',
  memory: '512MiB',
  timeoutSeconds: 60,
});

// Import function modules
import { createPrompt } from './prompts/createPrompt';
import { getRecordingSession } from './sessions/getRecordingSession';
import { processRecording } from './recordings/processRecording';
import { sendScheduledEmails } from './notifications/sendScheduledEmails';
import { validateSession } from './sessions/validateSession';
import { createStory } from './stories/createStory';
import { deleteExpiredSessions } from './maintenance/deleteExpiredSessions';
import { healthCheck } from './monitoring/healthCheck';

// Export HTTP callable functions
export {
  createPrompt,
  getRecordingSession,
  validateSession,
  createStory,
  healthCheck,
};

// Export storage triggered functions
export {
  processRecording,
};

// Export scheduled functions
export {
  sendScheduledEmails,
  deleteExpiredSessions,
};

// Export utility functions for testing
export { validateInput } from './utils/validation';
export { loggerInstance as logger } from './utils/logger';

/**
 * Warmup function to prevent cold starts
 */
export const warmup = functions
  .runWith({
    memory: '128MB',
    timeoutSeconds: 10,
  })
  .pubsub.schedule('every 5 minutes')
  .onRun(async (context) => {
    functions.logger.info('Warmup ping executed', {
      timestamp: context.timestamp,
      eventId: context.eventId,
    });
    return null;
  });

/**
 * Global error handler for unhandled promise rejections
 */
process.on('unhandledRejection', (reason, promise) => {
  functions.logger.error('Unhandled Rejection at:', promise, 'reason:', reason);
});

/**
 * Global error handler for uncaught exceptions
 */
process.on('uncaughtException', (error) => {
  functions.logger.error('Uncaught Exception:', error);
  process.exit(1);
});

functions.logger.info('Love Retold Functions initialized successfully', {
  nodeVersion: process.version,
  timestamp: new Date().toISOString(),
});