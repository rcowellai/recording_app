import React from 'react';

const StatusMessage = ({ status, message, title = null, actionButton = null }) => {
  const getStatusIcon = (status) => {
    switch (status) {
      case 'completed':
        return '✅';
      case 'expired':
        return '⏰';
      case 'removed':
        return '🗑️';
      case 'error':
        return '❌';
      default:
        return 'ℹ️';
    }
  };

  const getStatusClass = (status) => {
    switch (status) {
      case 'completed':
        return 'status-success';
      case 'expired':
        return 'status-warning';
      case 'removed':
      case 'error':
        return 'status-error';
      default:
        return 'status-info';
    }
  };

  return (
    <div className={`status-message ${getStatusClass(status)}`}>
      <div className="status-icon">
        {getStatusIcon(status)}
      </div>
      
      <div className="status-content">
        {title && <h2 className="status-title">{title}</h2>}
        <p className="status-text">{message}</p>
        
        {actionButton && (
          <div className="status-actions">
            {actionButton}
          </div>
        )}
      </div>
    </div>
  );
};

export default StatusMessage;