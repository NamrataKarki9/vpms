import React, { useState } from 'react';
import { useToast } from '../context/ToastContext';
import { authApi } from '../services/api';
import { Mail, ArrowLeft, Send, AlertCircle } from 'lucide-react';
import '../styles/auth.css';

const EMAIL_STORAGE_KEY = 'vis_reset_email';

export function ForgotPasswordPage({ onContinue, onBack }) {
  const showToast = useToast();
  const [email, setEmail] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const validateEmail = (value) => {
    if (!value.trim()) return 'Email is required';
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(value)) return 'Invalid email format';
    return '';
  };

  const handleSubmit = async (e) => {
    if (e) e.preventDefault();
    const errorMessage = validateEmail(email);
    setError(errorMessage);
    if (errorMessage) return;

    setIsLoading(true);
    try {
      await authApi.forgotPassword(email.trim());
      localStorage.setItem(EMAIL_STORAGE_KEY, email.trim());
      showToast('success', 'OTP sent successfully.');
      onContinue();
    } catch (err) {
      showToast('error', err.message || 'Something went wrong. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="auth-wrapper">
      <div className="auth-card">
        <div className="auth-header">
          <div className="auth-logo-icon">🔑</div>
          <h2>Reset Password</h2>
          <p>We'll send you an OTP to your email</p>
        </div>

        <div className="auth-body">
          <form onSubmit={handleSubmit}>
            <div className="auth-form-group">
              <label className="auth-label">Email Address</label>
              <div className="auth-input-wrapper">
                <Mail className="auth-input-icon" size={18} />
                <input
                  type="email"
                  placeholder="name@company.com"
                  className={`auth-input ${error ? 'error' : ''}`}
                  value={email}
                  onChange={(event) => {
                    setEmail(event.target.value);
                    if (error) setError('');
                  }}
                  disabled={isLoading}
                  autoFocus
                />
              </div>
              {error && (
                <div style={{ display: 'flex', alignItems: 'center', gap: '5px', marginTop: '6px', color: '#EF4444' }}>
                  <AlertCircle size={14} />
                  <span className="auth-error-text" style={{ marginTop: 0 }}>{error}</span>
                </div>
              )}
            </div>

            <button 
              type="submit" 
              className="auth-btn-primary" 
              disabled={!!error || !email || isLoading}
              style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px' }}
            >
              {isLoading ? (
                'Sending OTP...'
              ) : (
                <>
                  <Send size={18} />
                  <span>Send OTP</span>
                </>
              )}
            </button>
          </form>

          <div className="auth-footer">
            <button 
              onClick={onBack} 
              className="auth-link" 
              style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', margin: '0 auto' }}
              disabled={isLoading}
            >
              <ArrowLeft size={16} />
              <span>Back to Login</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
