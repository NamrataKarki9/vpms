import React, { useState } from 'react';

const ROLES = { ADMIN: 'Admin', STAFF: 'Staff', CUSTOMER: 'Customer' };

export function LoginPage({ onLogin, onSignUp, staff, customers }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [errors, setErrors] = useState({ email: '', password: '' });
  const [loginError, setLoginError] = useState('');

  const validateEmail = (emailVal) => {
    if (!emailVal.trim()) return 'Email is required';
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(emailVal)) return 'Invalid email format';
    return '';
  };

  const validatePassword = (passwordVal) => {
    if (!passwordVal.trim()) return 'Password is required';
    if (passwordVal.length < 1) return 'Password is required';
    return '';
  };

  const handleLogin = () => {
    const emailError = validateEmail(email);
    const passwordError = validatePassword(password);
    setErrors({ email: emailError, password: passwordError });
    setLoginError('');

    if (emailError || passwordError) return;

    // 1. Admin Verification
    if (email === 'np01cp4s230131@islingtoncollege.edu.np') {
      if (password === '1234') {
        onLogin({ name: 'System Admin', role: ROLES.ADMIN });
        return;
      }
      setLoginError('Access Denied: Incorrect Admin password.');
      return;
    }

    // 2. Staff Verification
    const staffMember = staff.find(s => s.email.toLowerCase() === email.toLowerCase());
    if (staffMember) {
      if (staffMember.password === password || (!staffMember.password && password === 'password')) {
        onLogin({ id: staffMember.id, name: staffMember.name || email.split('@')[0], role: ROLES.STAFF });
        return;
      }
      setLoginError('Access Denied: Incorrect password for Staff.');
      return;
    }

    // 3. Customer Verification
    const customer = customers.find(c => c.email && c.email.toLowerCase() === email.toLowerCase());
    if (customer) {
      if (customer.password === password || (!customer.password && password === 'password')) {
        onLogin({ ...customer, role: ROLES.CUSTOMER });
        return;
      }
      setLoginError('Access Denied: Incorrect password for Customer.');
      return;
    }

    setLoginError('Access Denied: Account not found. Please sign up or contact Admin.');
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
        />
        <button type="button" onClick={() => setShowPassword(!showPassword)} style={{ position: 'absolute', right: '10px', top: '12px', background: 'none', border: 'none', color: 'var(--primary)', cursor: 'pointer', padding: 0, boxShadow: 'none' }}>
          {showPassword ? 'Hide' : 'Show'}
        </button>
      </div>
      {errors.password && <span style={{ fontSize: '0.75rem', color: '#ef4444', display: 'block', marginBottom: '1rem' }}>{errors.password}</span>}
      {loginError && <div style={{ fontSize: '0.85rem', color: '#ef4444', background: '#fee2e2', padding: '0.75rem', borderRadius: '6px', marginBottom: '1rem', borderLeft: '4px solid #ef4444' }}>{loginError}</div>}
      <button onClick={handleLogin} disabled={!!errors.email || !!errors.password}>Enter System</button>
      <p style={{ marginTop: '1.5rem', textAlign: 'center', fontSize: '0.9rem' }}>New customer? <button onClick={onSignUp} className="btn-small">Sign Up Here</button></p>
    </div>
  );
}
