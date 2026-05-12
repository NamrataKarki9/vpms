import React, { useEffect, useState } from 'react';
import { useToast } from '../context/ToastContext';
import { authApi } from '../services/api';

const EMAIL_STORAGE_KEY = 'vis_reset_email';
const OTP_STORAGE_KEY = 'vis_reset_otp';

export function ResetPasswordPage({ onComplete, onMissingOtp, onBack }) {
  const showToast = useToast();
  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [errors, setErrors] = useState({ password: '', confirmPassword: '' });
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    const storedEmail = localStorage.getItem(EMAIL_STORAGE_KEY) || '';
    const storedOtp = localStorage.getItem(OTP_STORAGE_KEY) || '';
    if (!storedEmail || !storedOtp) {
      onMissingOtp();
      return;
    }
    setEmail(storedEmail);
    setOtp(storedOtp);
  }, [onMissingOtp]);

  const validatePassword = (value) => {
    if (!value.trim()) return 'New password is required';
    if (value.trim().length < 6) return 'Password must be at least 6 characters';
    return '';
  };

  const validateConfirm = (value, newPassword) => {
    if (!value.trim()) return 'Confirm password is required';
    if (value.trim() !== newPassword.trim()) return 'Passwords do not match';
    return '';
  };

  const handleReset = async () => {
    const passwordError = validatePassword(password);
    const confirmError = validateConfirm(confirmPassword, password);
    setErrors({ password: passwordError, confirmPassword: confirmError });
    if (passwordError || confirmError) return;

    setIsLoading(true);
    try {
      await authApi.resetPassword(email, otp, password.trim(), confirmPassword.trim());
      localStorage.removeItem(EMAIL_STORAGE_KEY);
      localStorage.removeItem(OTP_STORAGE_KEY);
      showToast('success', 'Password reset successfully.');
      onComplete();
    } catch (err) {
      showToast('error', err.message || 'Something went wrong. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="card" style={{ maxWidth: '420px', margin: 'auto' }}>
      <button onClick={onBack} className="btn-small" disabled={isLoading}>Back</button>
      <h2 style={{ marginTop: '1rem' }}>Reset Password</h2>
      <p style={{ fontSize: '0.9rem', opacity: 0.7 }}>
        Create a new password for {email}.
      </p>
      <input
        type="password"
        placeholder="New Password"
        value={password}
        onChange={(event) => {
          setPassword(event.target.value);
          setErrors((prev) => ({ ...prev, password: validatePassword(event.target.value) }));
        }}
        style={{ borderColor: errors.password ? '#ef4444' : '' }}
        disabled={isLoading}
      />
      {errors.password && (
        <span style={{ fontSize: '0.75rem', color: '#ef4444', display: 'block', marginBottom: '1rem' }}>
          {errors.password}
        </span>
      )}
      <input
        type="password"
        placeholder="Confirm Password"
        value={confirmPassword}
        onChange={(event) => {
          setConfirmPassword(event.target.value);
          setErrors((prev) => ({ ...prev, confirmPassword: validateConfirm(event.target.value, password) }));
        }}
        style={{ borderColor: errors.confirmPassword ? '#ef4444' : '' }}
        disabled={isLoading}
      />
      {errors.confirmPassword && (
        <span style={{ fontSize: '0.75rem', color: '#ef4444', display: 'block', marginBottom: '1rem' }}>
          {errors.confirmPassword}
        </span>
      )}
      <button onClick={handleReset} disabled={!!errors.password || !!errors.confirmPassword || isLoading}>
        {isLoading ? 'Resetting...' : 'Reset Password'}
      </button>
    </div>
  );
}
