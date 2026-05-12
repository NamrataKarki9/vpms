import React, { createContext, useCallback, useContext, useState } from 'react';

const ToastContext = createContext(null);

export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error('useToast must be used within ToastProvider');
  return ctx;
}

export function ToastProvider({ children }) {
  const [toast, setToast] = useState(null);

  const showToast = useCallback((type, message) => {
    setToast({ type, message });
    setTimeout(() => setToast(null), 3000);
  }, []);

  return (
    <ToastContext.Provider value={showToast}>
      {toast && (
        <div
          className={`vendor-toast vendor-toast-${toast.type}`}
          role="status"
        >
          <span className="vendor-toast-icon" aria-hidden="true">
            {toast.type === 'success' ? (
              <svg viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                <path
                  fillRule="evenodd"
                  d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.78-9.22a.75.75 0 00-1.06-1.06L9 11.44 7.28 9.72a.75.75 0 10-1.06 1.06l2.25 2.25c.29.3.77.3 1.06 0l3.25-3.25z"
                  clipRule="evenodd"
                />
              </svg>
            ) : (
              <svg viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                <path
                  fillRule="evenodd"
                  d="M10 18a8 8 0 100-16 8 8 0 000 16zm-.75-11.25a.75.75 0 011.5 0v4.5a.75.75 0 01-1.5 0v-4.5zm.75 8.5a1 1 0 100-2 1 1 0 000 2z"
                  clipRule="evenodd"
                />
              </svg>
            )}
          </span>
          {toast.message}
        </div>
      )}
      {children}
    </ToastContext.Provider>
  );
}
