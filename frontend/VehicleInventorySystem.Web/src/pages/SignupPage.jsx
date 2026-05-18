import React from 'react';
import { useNavigate } from 'react-router-dom';
import CustomerVehicleForm from '../components/management/CustomerVehicleForm';
import { useToast } from '../context/ToastContext';
import '../styles/auth.css';

const ROLES = { CUSTOMER: 'Customer' };

export function SignupPage({ onAddCustomer }) {
  const navigate = useNavigate();
  const showToast = useToast();

  const handleRegistrationComplete = async (data) => {
    try {
      const savedCustomer = await onAddCustomer(data);
      if (savedCustomer) {
        showToast('success', 'Registration successful! Redirecting to login...');
        // Redirect to login page after successful registration
        setTimeout(() => {
          navigate('/login', { 
            state: { 
              message: `Registration successful! Please log in with your email: ${savedCustomer.email}` 
            } 
          });
        }, 1500);
        return savedCustomer;
      }
    } catch (error) {
      showToast('error', error.message || 'Registration failed');
      return null;
    }
  };

  return (
    <div className="auth-wrapper" style={{ minHeight: '100vh', padding: '40px 20px' }}>
      <div className="auth-card" style={{ maxWidth: '500px' }}>
        <div className="auth-header">
          <div className="auth-logo-icon">🚗</div>
          <h2>Join Us</h2>
          <p>Register your account and vehicle details</p>
        </div>
        
        <div className="auth-body">
          <CustomerVehicleForm onRegister={handleRegistrationComplete} />
          
          <div className="auth-footer">
            <span className="auth-text-muted">Already have an account? </span>
            <button onClick={() => navigate('/login')} className="auth-link">Sign In Instead</button>
          </div>
        </div>
      </div>
    </div>
  );
}
