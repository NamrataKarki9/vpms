import React, { useEffect, useState } from 'react';
import { useToast } from '../context/ToastContext';
import { authApi } from '../services/api';
import { Lock, Eye, EyeOff, Save, AlertCircle } from 'lucide-react';
import '../styles/auth.css';

const EMAIL_STORAGE_KEY = 'vis_reset_email';
const OTP_STORAGE_KEY = 'vis_reset_otp';

export function ResetPasswordPage({ onComplete, onMissingOtp, onBack }) {
  const showToast = useToast();
  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPass, setShowPass] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
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
    if (value.trim().length < 6) return 'At least 6 characters required';
    return '';
  };

  const validateConfirm = (value, newPassword) => {
    if (!value.trim()) return 'Please confirm your password';
    if (value.trim() !== newPassword.trim()) return 'Passwords do not match';
    return '';
  };

  const handleReset = async (e) => {
    if (e) e.preventDefault();
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
    <div className="auth-wrapper">
      <div className="auth-card">
        <div className="auth-header">
          <div className="auth-logo-icon">🔐</div>
          <h2>New Password</h2>
          <p>Create a secure password for <span style={{ color: '#fff', fontWeight: '700' }}>{email}</span></p>
        </div>

        <div className="auth-body">
          <form onSubmit={handleReset}>
            <div className="auth-form-group">
              <label className="auth-label">New Password</label>
              <div className="auth-input-wrapper">
                <Lock className="auth-input-icon" size={18} />
                <input
                  type={showPass ? "text" : "password"}
                  placeholder="••••••••"
                  className={`auth-input ${errors.password ? 'error' : ''}`}
                  value={password}
                  onChange={(event) => {
                    setPassword(event.target.value);
                    if (errors.password) setErrors(prev => ({ ...prev, password: '' }));
                  }}
                  disabled={isLoading}
                  autoFocus
                />
                <button 
                  type="button" className="auth-password-toggle"
                  onClick={() => setShowPass(!showPass)}
                >
                  {showPass ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
              {errors.password && <span className="auth-error-text">{errors.password}</span>}
            </div>

            <div className="auth-form-group">
              <label className="auth-label">Confirm Password</label>
              <div className="auth-input-wrapper">
                <Lock className="auth-input-icon" size={18} />
                <input
                  type={showConfirm ? "text" : "password"}
                  placeholder="••••••••"
                  className={`auth-input ${errors.confirmPassword ? 'error' : ''}`}
                  value={confirmPassword}
                  onChange={(event) => {
                    setConfirmPassword(event.target.value);
                    if (errors.confirmPassword) setErrors(prev => ({ ...prev, confirmPassword: '' }));
                  }}
                  disabled={isLoading}
                />
                <button 
                  type="button" className="auth-password-toggle"
                  onClick={() => setShowConfirm(!showConfirm)}
                >
                  {showConfirm ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
              {errors.confirmPassword && <span className="auth-error-text">{errors.confirmPassword}</span>}
            </div>

            <button 
              type="submit" 
              className="auth-btn-primary" 
              disabled={!!errors.password || !!errors.confirmPassword || !password || !confirmPassword || isLoading}
              style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px' }}
            >
              {isLoading ? (
                'Resetting...'
              ) : (
                <>
                  <Save size={18} />
                  <span>Update Password</span>
                </>
              )}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
