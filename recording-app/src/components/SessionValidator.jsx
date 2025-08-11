import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { validateSession, getSessionStatusMessage, canRecord } from '../services/session.js';
import { parseSessionId, validateSessionId } from '../utils/sessionParser.js';
import LoadingSpinner from './LoadingSpinner.jsx';
import StatusMessage from './StatusMessage.jsx';
import EnhancedRecordingInterface from './EnhancedRecordingInterface.jsx';

const SessionValidator = ({ sessionId: propSessionId, sessionComponents: propSessionComponents }) => {
  const { sessionId: paramSessionId } = useParams();
  const sessionId = propSessionId || paramSessionId; // Support both prop and URL parameter
  const [sessionData, setSessionData] = useState(null);
  const [sessionComponents, setSessionComponents] = useState(propSessionComponents);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const loadSession = async () => {
      if (!sessionId) {
        setError('No session ID provided');
        setLoading(false);
        return;
      }

      try {
        setLoading(true);

        // Parse session components if not provided (from URL parameter)
        if (!propSessionComponents && sessionId) {
          try {
            if (!validateSessionId(sessionId)) {
              setError('Invalid recording link format. This recording link appears to be corrupted or expired.');
              setLoading(false);
              return;
            }
            const parsedComponents = parseSessionId(sessionId);
            setSessionComponents(parsedComponents);
            console.log('🔍 Session components parsed from URL:', {
              userId: parsedComponents.userId,
              promptId: parsedComponents.promptId,
              storytellerId: parsedComponents.storytellerId
            });
          } catch (parseError) {
            console.error('❌ Session parsing failed:', parseError);
            setError('Unable to process recording link. Please contact the sender for a new link.');
            setLoading(false);
            return;
          }
        }
        
        // validateSession now handles all error cases and timeouts internally
        const data = await validateSession(sessionId);
        
        setSessionData(data);
        
        // Check if the validation returned an error status
        if (data.status === 'error') {
          setError(data.message);
        }
      } catch (error) {
        console.error('Unexpected error in session validation:', error);
        // This should not happen since validateSession always returns an object,
        // but handle it just in case
        setError('Unable to validate session. Please check your connection and try again.');
      } finally {
        setLoading(false);
      }
    };

    loadSession();
  }, [sessionId, propSessionComponents]);

  // Loading state
  if (loading) {
    return (
      <div className="session-validator">
        <LoadingSpinner 
          message="Validating recording session..." 
          size="large" 
        />
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="session-validator">
        <StatusMessage
          status="error"
          title="Session Error"
          message={error}
          actionButton={
            <button 
              onClick={() => window.location.reload()}
              className="btn btn-primary"
            >
              Try Again
            </button>
          }
        />
      </div>
    );
  }

  // No session data
  if (!sessionData) {
    return (
      <div className="session-validator">
        <StatusMessage
          status="error"
          title="Invalid Session"
          message="No session data available"
        />
      </div>
    );
  }

  // Active session - show recording interface
  if (canRecord(sessionData.status)) {
    return (
      <div className="session-validator">
        <EnhancedRecordingInterface 
          sessionData={sessionData}
          sessionId={sessionId}
          sessionComponents={sessionComponents}
        />
      </div>
    );
  }

  // Other session states (completed, expired, removed)
  const statusTitles = {
    completed: 'Memory Recorded',
    expired: 'Link Expired',
    removed: 'Question Removed'
  };

  return (
    <div className="session-validator">
      <StatusMessage
        status={sessionData.status}
        title={statusTitles[sessionData.status] || 'Session Status'}
        message={getSessionStatusMessage(sessionData.status, sessionData.message)}
        actionButton={
          sessionData.status === 'expired' ? (
            <button 
              onClick={() => window.open('mailto:support@loveretold.com?subject=Expired Recording Link', '_blank')}
              className="btn btn-secondary"
            >
              Contact Support
            </button>
          ) : null
        }
      />
    </div>
  );
};

export default SessionValidator;