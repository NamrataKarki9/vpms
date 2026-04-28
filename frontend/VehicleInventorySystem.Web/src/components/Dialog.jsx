import React from 'react';

function Dialog({ isOpen, title, message, type = 'confirm', onConfirm, onCancel, confirmText = 'OK', cancelText = 'Cancel', isLoading = false }) {
  if (!isOpen) return null;

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: 'rgba(0, 0, 0, 0.5)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 9999,
      backdropFilter: 'blur(4px)'
    }}>
      <div style={{
        background: 'white',
        borderRadius: '12px',
        padding: '2rem',
        maxWidth: '400px',
        width: '90%',
        boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1)',
        animation: 'slideUp 0.3s ease-out'
      }}>
        <h3 style={{ marginTop: 0, marginBottom: '1rem', color: '#1e293b', fontSize: '1.25rem' }}>
          {title}
        </h3>
        <p style={{ 
          color: '#475569', 
          marginBottom: '1.5rem', 
          lineHeight: '1.6',
          fontSize: '0.95rem'
        }}>
          {message}
        </p>
        
        <div style={{ 
          display: 'flex', 
          gap: '0.75rem', 
          justifyContent: 'flex-end'
        }}>
          {type === 'confirm' && (
            <button
              onClick={onCancel}
              disabled={isLoading}
              style={{
                padding: '0.5rem 1rem',
                borderRadius: '6px',
                border: '1px solid #e2e8f0',
                background: '#f1f5f9',
                color: '#0f172a',
                cursor: isLoading ? 'not-allowed' : 'pointer',
                fontSize: '0.9rem',
                fontWeight: '500',
                transition: 'all 0.2s',
                opacity: isLoading ? 0.6 : 1
              }}
              onMouseEnter={(e) => !isLoading && (e.target.style.background = '#e2e8f0')}
              onMouseLeave={(e) => (e.target.style.background = '#f1f5f9')}
            >
              {cancelText}
            </button>
          )}
          <button
            onClick={onConfirm}
            disabled={isLoading}
            style={{
              padding: '0.5rem 1rem',
              borderRadius: '6px',
              border: 'none',
              background: type === 'success' ? '#10b981' : type === 'error' ? '#ef4444' : '#4f46e5',
              color: 'white',
              cursor: isLoading ? 'not-allowed' : 'pointer',
              fontSize: '0.9rem',
              fontWeight: '500',
              transition: 'all 0.2s',
              opacity: isLoading ? 0.7 : 1
            }}
            onMouseEnter={(e) => !isLoading && (e.target.style.opacity = '0.9')}
            onMouseLeave={(e) => (e.target.style.opacity = '1')}
          >
            {isLoading ? 'Processing...' : confirmText}
          </button>
        </div>
      </div>
      <style>{`
        @keyframes slideUp {
          from {
            opacity: 0;
            transform: translateY(20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
      `}</style>
    </div>
  );
}

export default Dialog;
