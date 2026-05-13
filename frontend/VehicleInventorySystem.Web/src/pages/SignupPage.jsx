import React from 'react';
import CustomerVehicleForm from '../components/management/CustomerVehicleForm';
import { ArrowLeft } from 'lucide-react';
import '../styles/auth.css';

const ROLES = { CUSTOMER: 'Customer' };

export function SignupPage({ onComplete, onBack, onAddCustomer }) {
  return (
    <div className="auth-wrapper" style={{ minHeight: '100vh', padding: '40px 20px' }}>
      <div className="auth-card" style={{ maxWidth: '500px' }}>
        <div className="auth-header">
          <div className="auth-logo-icon">🚗</div>
          <h2>Join Us</h2>
          <p>Register your account and vehicle details</p>
        </div>
        
        <div className="auth-body">
          <CustomerVehicleForm onRegister={async (data) => {
            const savedCustomer = await onAddCustomer(data);
            if (savedCustomer) {
              onComplete({ ...savedCustomer, role: savedCustomer.role || ROLES.CUSTOMER });
            }
          }} />
          
          <div className="auth-footer">
            <span className="auth-text-muted">Already have an account? </span>
            <button onClick={onBack} className="auth-link">Sign In Instead</button>
          </div>
        </div>
      </div>
    </div>
  );
}
