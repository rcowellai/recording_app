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
    // Add timeout directly to the Firebase function call
    const timeoutMs = 4000; // 4 seconds (must be shorter than test timeout)
    const timeoutPromise = new Promise((_, reject) => {
      setTimeout(() => reject(new Error('Firebase function timeout')), timeoutMs);
    });
    
    const result = await Promise.race([
      validateSessionFunction({ sessionId }),
      timeoutPromise
    ]);
    
    return result.data;
  } catch (error) {
    console.error('Error validating session:', error);
    
    // Handle timeout specifically
    if (error.message === 'Firebase function timeout') {
      return {
        status: 'error',
        message: 'Connection timeout. Please check your internet connection and try again.'
      };
    }
    
    // Handle network-related errors specifically
    if (error.code === 'functions/network-error' || 
        error.code === 'functions/internal' ||
        error.name === 'NetworkError' ||
        error.message?.includes('fetch') ||
        error.message?.includes('Failed to fetch')) {
      return {
        status: 'error',
        message: 'Connection problem. Please check your internet and try again.'
      };
    }
    
    // Handle different error types
    if (error.code === 'functions/not-found') {
      return {
        status: 'removed',
        message: 'This question has been removed by the account owner'
      };
    }
    
    // Handle expired sessions
    if (error.code === 'functions/failed-precondition' || 
        error.code === 'functions/permission-denied' ||
        error.message?.includes('expired') ||
        error.message?.includes('link expired')) {
      return {
        status: 'expired',
        message: 'This recording link has expired (links are valid for 7 days)'
      };
    }
    
    if (error.code === 'functions/unavailable') {
      return {
        status: 'error',
        message: 'Service temporarily unavailable. Please try again later.'
      };
    }
    
    // Default error handling - always return error status, never throw
    return {
      status: 'error',
      message: 'Unable to validate session. Please check your connection and try again.'
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