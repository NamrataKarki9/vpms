import React, { useEffect, useState } from 'react';
import { useToast } from '../context/ToastContext';
import { authApi } from '../services/api';

const EMAIL_STORAGE_KEY = 'vis_reset_email';
const OTP_STORAGE_KEY = 'vis_reset_otp';

export function VerifyOtpPage({ onContinue, onBack, onMissingEmail }) {
  const showToast = useToast();
  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState('');
  const [errors, setErrors] = useState({ otp: '' });
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    const storedEmail = localStorage.getItem(EMAIL_STORAGE_KEY) || '';
    if (!storedEmail) {
      onMissingEmail();
      return;
    }
    setEmail(storedEmail);
  }, [onMissingEmail]);

  const validateOtp = (value) => {
    if (!value.trim()) return 'OTP is required';
    if (!/^\d{6}$/.test(value.trim())) return 'OTP must be 6 digits';
    return '';
  };

  const handleVerify = async () => {
    const otpError = validateOtp(otp);
    setErrors({ otp: otpError });
    if (otpError) return;

    setIsLoading(true);
    try {
      await authApi.verifyOtp(email, otp.trim());
      localStorage.setItem(OTP_STORAGE_KEY, otp.trim());
      showToast('success', 'OTP verified successfully.');
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
      <h2 style={{ marginTop: '1rem' }}>Verify OTP</h2>
      <p style={{ fontSize: '0.9rem', opacity: 0.7 }}>
        Enter the 6-digit OTP sent to {email}.
      </p>
      <input
        type="text"
        placeholder="OTP"
        value={otp}
        onChange={(event) => {
          setOtp(event.target.value);
          setErrors({ otp: validateOtp(event.target.value) });
        }}
        style={{ borderColor: errors.otp ? '#ef4444' : '' }}
        disabled={isLoading}
      />
      {errors.otp && (
        <span style={{ fontSize: '0.75rem', color: '#ef4444', display: 'block', marginBottom: '1rem' }}>
          {errors.otp}
        </span>
      )}
      <button onClick={handleVerify} disabled={!!errors.otp || isLoading}>
        {isLoading ? 'Verifying...' : 'Verify OTP'}
      </button>
    </div>
  );
}
