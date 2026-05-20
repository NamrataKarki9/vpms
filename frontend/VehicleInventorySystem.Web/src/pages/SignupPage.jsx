import React from 'react';
import { useNavigate } from 'react-router-dom';
import CustomerVehicleForm from '../components/management/CustomerVehicleForm';
import { LandingPageNavbar } from '../components/LandingPageNavbar';
import { useToast } from '../context/ToastContext';
import '../styles/auth.css';
import '../styles/landing-page.css';

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
    <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh', width: '100vw', marginLeft: 'calc(50% - 50vw)', marginRight: 'calc(50% - 50vw)' }}>
      <LandingPageNavbar />
      <div className="auth-wrapper" style={{ flex: 1 }}>
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

      <footer className="landing-footer">
        <div className="footer-content">
          <div className="footer-column">
            <div className="footer-logo">
              <span className="footer-logo-icon">⚙️</span>
              <span className="footer-logo-text">VPMS</span>
            </div>
            <p className="footer-description">
              Your trusted partner for premium vehicle parts and professional service solutions.
            </p>
          </div>

          <div className="footer-column">
            <h4>Navigation</h4>
            <ul className="footer-links">
              <li><button className="footer-link-btn" onClick={() => window.location.href = '/'}>Home</button></li>
              <li><button className="footer-link-btn" onClick={() => window.location.href = '/login'}>Login</button></li>
              <li><button className="footer-link-btn" onClick={() => window.location.href = '/signup'}>Sign Up</button></li>
            </ul>
          </div>

          <div className="footer-column">
            <h4>Contact Information</h4>
            <ul className="footer-contact">
              <li>📧 support@vpms.com</li>
              <li>📞 1-800-VPMS-HELP</li>
              <li>📍 Automotive Service Center, City, Country</li>
            </ul>
          </div>

          <div className="footer-column">
            <h4>Business Hours</h4>
            <ul className="footer-hours">
              <li>Monday - Friday: 8AM - 6PM</li>
              <li>Saturday: 9AM - 4PM</li>
              <li>Sunday: Closed</li>
            </ul>
          </div>
        </div>

        <div className="footer-bottom">
          <p>&copy; 2026 Vehicle Parts Management System. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}
