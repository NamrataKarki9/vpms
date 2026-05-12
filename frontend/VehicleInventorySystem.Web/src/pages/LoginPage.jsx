import React, { useState } from 'react';
import { authApi } from '../services/api';

export function LoginPage({ onLogin, onSignUp, onForgotPassword }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [errors, setErrors] = useState({ email: '', password: '' });
  const [loginError, setLoginError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const validateEmail = (emailVal) => {
    if (!emailVal.trim()) return 'Email is required';
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(emailVal)) return 'Invalid email format';
    return '';
  };

  const validatePassword = (passwordVal) => {
    if (!passwordVal.trim()) return 'Password is required';
    return '';
  };

  const handleLogin = async () => {
    const emailError = validateEmail(email);
    const passwordError = validatePassword(password);
    setErrors({ email: emailError, password: passwordError });
    setLoginError('');

    if (emailError || passwordError) return;

    setIsLoading(true);
    try {
      const user = await authApi.login(email.trim(), password);
      onLogin({
        id: user.id,
        name: user.fullName,
        email: user.emailAddress,
        role: user.role,
        token: user.token
      });
    } catch (err) {
      setLoginError(err.message || 'Invalid email or password.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="card" style={{ maxWidth: '400px', margin: 'auto' }}>
      <h2>Login</h2>
      <div>
        <input
          type="text"
          placeholder="Email"
          value={email}
          onChange={e => {
            setEmail(e.target.value);
            setErrors({...errors, email: validateEmail(e.target.value)});
          }}
          style={{ borderColor: errors.email ? '#ef4444' : '' }}
          disabled={isLoading}
        />
        {errors.email && <span style={{ fontSize: '0.75rem', color: '#ef4444' }}>{errors.email}</span>}
      </div>
      <div style={{ position: 'relative', width: '100%' }}>
        <input
          type={showPassword ? "text" : "password"}
          placeholder="Password"
          value={password}
          onChange={e => {
            setPassword(e.target.value);
            setErrors({...errors, password: validatePassword(e.target.value)});
          }}
          style={{ width: '100%', marginBottom: '0.25rem', borderColor: errors.password ? '#ef4444' : '' }}
          disabled={isLoading}
        />
        <button type="button" onClick={() => setShowPassword(!showPassword)} style={{ position: 'absolute', right: '10px', top: '12px', background: 'none', border: 'none', color: 'var(--primary)', cursor: 'pointer', padding: 0, boxShadow: 'none' }} disabled={isLoading}>
          {showPassword ? 'Hide' : 'Show'}
        </button>
      </div>
      {errors.password && <span style={{ fontSize: '0.75rem', color: '#ef4444', display: 'block', marginBottom: '1rem' }}>{errors.password}</span>}
      {loginError && <div style={{ fontSize: '0.85rem', color: '#ef4444', background: '#fee2e2', padding: '0.75rem', borderRadius: '6px', marginBottom: '1rem', borderLeft: '4px solid #ef4444' }}>{loginError}</div>}
      <button onClick={handleLogin} disabled={!!errors.email || !!errors.password || isLoading}>
        {isLoading ? 'Signing in...' : 'Enter System'}
      </button>
      <p style={{ marginTop: '0.75rem', textAlign: 'center', fontSize: '0.85rem' }}>
        <button onClick={onForgotPassword} className="btn-small" disabled={isLoading}>
          Forgot Password?
        </button>
      </p>
      <p style={{ marginTop: '1.5rem', textAlign: 'center', fontSize: '0.9rem' }}>New customer? <button onClick={onSignUp} className="btn-small">Sign Up Here</button></p>
    </div>
  );
}
