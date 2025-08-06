import { httpsCallable } from 'firebase/functions';
import { functions } from './firebase.js';

const validateSessionFunction = httpsCallable(functions, 'validateSession');

/**
 * Validate a recording session
 * @param {string} sessionId - The session ID to validate
 * @returns {Promise<Object>} Session validation result
 */
export const validateSession = async (sessionId) => {
  try {
    const result = await validateSessionFunction({ sessionId });
    return result.data;
  } catch (error) {
    console.error('Error validating session:', error);
    
    // Handle different error types
    if (error.code === 'functions/not-found') {
      return {
        status: 'removed',
        message: 'This question has been removed by the account owner'
      };
    }
    
    if (error.code === 'functions/unavailable') {
      return {
        status: 'error',
        message: 'Service temporarily unavailable. Please try again later.'
      };
    }
    
    return {
      status: 'error',
      message: 'Failed to validate recording session. Please check your connection and try again.'
    };
  }
};

/**
 * Get user-friendly message for session status
 * @param {string} status - Session status
 * @param {string} customMessage - Custom message from server
 * @returns {string} User-friendly message
 */
export const getSessionStatusMessage = (status, customMessage = '') => {
  const messages = {
    active: 'Ready to record your memory',
    completed: 'This memory has already been recorded',
    expired: 'This recording link has expired (links are valid for 7 days)',
    removed: 'This question has been removed by the account owner',
    error: customMessage || 'Unable to load recording session'
  };
  
  return messages[status] || 'Unknown session status';
};

/**
 * Check if session allows recording
 * @param {string} status - Session status
 * @returns {boolean} Whether recording is allowed
 */
export const canRecord = (status) => {
  return status === 'active';
};