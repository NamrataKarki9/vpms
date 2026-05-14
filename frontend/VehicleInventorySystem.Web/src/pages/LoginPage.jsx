import React, { useState } from 'react';
import { authApi } from '../services/api';
import { Mail, Lock, Eye, EyeOff, LogIn, AlertCircle } from 'lucide-react';
import '../styles/auth.css';

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

  const handleLogin = async (e) => {
    if (e) e.preventDefault();
    const emailError = validateEmail(email);
    const passwordError = validatePassword(password);
    setErrors({ email: emailError, password: passwordError });
    setLoginError('');

    if (emailError || passwordError) return;

    setIsLoading(true);
    try {
      const user = await authApi.login(email.trim(), password);
      onLogin({
        id: user.id ?? user.Id,
        name: user.fullName ?? user.FullName ?? user.name ?? user.Name,
        email: user.emailAddress ?? user.EmailAddress ?? user.email ?? user.Email,
        role: user.role ?? user.Role,
        token: user.token ?? user.Token
      });
    } catch (err) {
      setLoginError(err.message || 'Invalid email or password.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="auth-wrapper">
      <div className="auth-card">
        <div className="auth-header">
          <div className="auth-logo-icon">🔧</div>
          <h2>Welcome Back</h2>
          <p>Please enter your details to sign in</p>
        </div>

        <div className="auth-body">
          {loginError && (
            <div className="auth-alert auth-alert-error">
              <AlertCircle size={18} />
              <span>{loginError}</span>
            </div>
          )}

          <form onSubmit={handleLogin}>
            <div className="auth-form-group">
              <label className="auth-label">Email Address</label>
              <div className="auth-input-wrapper">
                <Mail className="auth-input-icon" size={18} />
                <input
                  type="email"
                  autoComplete="username"
                  placeholder="name@company.com"
                  className={`auth-input ${errors.email ? 'error' : ''}`}
                  value={email}
                  onChange={e => {
                    setEmail(e.target.value);
                    if (errors.email) setErrors({...errors, email: ''});
                  }}
                  disabled={isLoading}
                />
              </div>
              {errors.email && <span className="auth-error-text">{errors.email}</span>}
            </div>

            <div className="auth-form-group">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                <label className="auth-label" style={{ margin: 0 }}>Password</label>
                <button 
                  type="button" 
                  onClick={onForgotPassword} 
                  className="auth-link" 
                  style={{ fontSize: '12px' }}
                  disabled={isLoading}
                >
                  Forgot password?
                </button>
              </div>
              <div className="auth-input-wrapper">
                <Lock className="auth-input-icon" size={18} />
                <input
                  type={showPassword ? "text" : "password"}
                  autoComplete="current-password"
                  placeholder="••••••••"
                  className={`auth-input ${errors.password ? 'error' : ''}`}
                  value={password}
                  onChange={e => {
                    setPassword(e.target.value);
                    if (errors.password) setErrors({...errors, password: ''});
                  }}
                  disabled={isLoading}
                />
                <button 
                  type="button" 
                  className="auth-password-toggle"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
              {errors.password && <span className="auth-error-text">{errors.password}</span>}
            </div>

            <button 
              type="submit" 
              className="auth-btn-primary" 
              disabled={isLoading}
              style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px' }}
            >
              {isLoading ? (
                <>Signing in...</>
              ) : (
                <>
                  <LogIn size={18} />
                  <span>Sign In</span>
                </>
              )}
            </button>
          </form>

          <div className="auth-footer">
            <span className="auth-text-muted">New customer? </span>
            <button onClick={onSignUp} className="auth-link">Create an account</button>
          </div>
        </div>
      </div>
    </div>
  );
}
