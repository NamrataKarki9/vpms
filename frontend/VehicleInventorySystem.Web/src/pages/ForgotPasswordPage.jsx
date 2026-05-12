import React, { useState } from 'react';
import { useToast } from '../context/ToastContext';
import { authApi } from '../services/api';

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

  const handleSubmit = async () => {
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
    <div className="card" style={{ maxWidth: '420px', margin: 'auto' }}>
      <button onClick={onBack} className="btn-small" disabled={isLoading}>Back</button>
      <h2 style={{ marginTop: '1rem' }}>Forgot Password</h2>
      <p style={{ fontSize: '0.9rem', opacity: 0.7 }}>
        Enter your email and we will send an OTP to reset your password.
      </p>
      <input
        type="email"
        placeholder="Email"
        value={email}
        onChange={(event) => {
          setEmail(event.target.value);
          setError(validateEmail(event.target.value));
        }}
        style={{ borderColor: error ? '#ef4444' : '' }}
        disabled={isLoading}
      />
      {error && (
        <span style={{ fontSize: '0.75rem', color: '#ef4444', display: 'block', marginBottom: '1rem' }}>
          {error}
        </span>
      )}
      <button onClick={handleSubmit} disabled={!!error || isLoading}>
        {isLoading ? 'Sending OTP...' : 'Send OTP'}
      </button>
    </div>
  );
}
