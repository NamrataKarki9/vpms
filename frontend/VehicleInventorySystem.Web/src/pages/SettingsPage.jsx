import React, { useState, useEffect } from 'react';
import { useToast } from '../context/ToastContext';
import { Eye, EyeOff, User, Lock, Phone, Mail, Save, AlertCircle } from 'lucide-react';
import '../styles/settings.css';

export function SettingsPage({ user, onLogout }) {
  const showToast = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('profile');
  
  // Profile Form State
  const [profileData, setProfileData] = useState({
    name: user?.name || '',
    email: user?.email || '',
    phoneNumber: user?.phoneNumber || ''
  });
  
  // Password Form State
  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });
  
  // Error State
  const [errors, setErrors] = useState({
    profile: {},
    password: {}
  });
  
  // UI State
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [hasProfileChanges, setHasProfileChanges] = useState(false);
  const [isFetchingUser, setIsFetchingUser] = useState(false);

  useEffect(() => {
    if (!user?.id) return;
    const fetchUserData = async () => {
      setIsFetchingUser(true);
      try {
        const { apiFetch } = await import('../services/api');
        const data = await apiFetch(`/users/${user.id}`);
        if (data) {
          setProfileData({
            name: data.name ?? data.Name ?? profileData.name,
            email: data.email ?? data.Email ?? profileData.email,
            phoneNumber: data.phoneNumber ?? data.PhoneNumber ?? profileData.phoneNumber
          });
        }
      } catch {
        // Silently fail — keep values from user prop
      } finally {
        setIsFetchingUser(false);
      }
    };
    fetchUserData();
  }, [user?.id]);

  // Validation Functions
  const validateName = (name) => {
    if (!name.trim()) return 'Name is required';
    if (!/^[a-zA-Z\s'-]+$/.test(name)) return 'Name cannot contain numbers or special characters';
    if (name.length < 2) return 'Name must be at least 2 characters';
    if (name.length > 100) return 'Name must not exceed 100 characters';
    return '';
  };

  const validatePhoneNumber = (phone) => {
    if (!phone.trim()) return 'Phone number is required';
    // Remove any non-digit characters for validation
    const digitsOnly = phone.replace(/\D/g, '');
    if (digitsOnly.length !== 10) return 'Phone number must be exactly 10 digits';
    if (!/^\d+$/.test(digitsOnly)) return 'Phone number cannot contain letters or special characters';
    return '';
  };

  const validateEmail = (email) => {
    if (!email.trim()) return 'Email is required';
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) return 'Invalid email format';
    return '';
  };

  const validateCurrentPassword = (password) => {
    if (!password) return 'Current password is required';
    return '';
  };

  const validateNewPassword = (password) => {
    if (!password) return 'New password is required';
    if (password.length < 8) return 'Password must be at least 8 characters';
    if (!/[A-Z]/.test(password)) return 'Password must contain at least one uppercase letter';
    if (!/[0-9]/.test(password)) return 'Password must contain at least one number';
    if (!/[!@#$%^&*()_+\-=\[\]{};:'",.<>?/\\|`~]/.test(password)) {
      return 'Password must contain at least one special character';
    }
    return '';
  };

  const validateConfirmPassword = (confirm, newPass) => {
    if (!confirm) return 'Please confirm your password';
    if (confirm !== newPass) return 'Passwords do not match';
    return '';
  };

  // Profile Form Handlers
  const handleProfileChange = (field, value) => {
    setProfileData(prev => ({ ...prev, [field]: value }));
    setHasProfileChanges(true);
    // Clear error for this field
    setErrors(prev => ({
      ...prev,
      profile: { ...prev.profile, [field]: '' }
    }));
  };

  const validateProfileForm = () => {
    const newErrors = {};
    
    const nameError = validateName(profileData.name);
    if (nameError) newErrors.name = nameError;
    
    const phoneError = validatePhoneNumber(profileData.phoneNumber);
    if (phoneError) newErrors.phoneNumber = phoneError;
    
    const emailError = validateEmail(profileData.email);
    if (emailError) newErrors.email = emailError;
    
    setErrors(prev => ({ ...prev, profile: newErrors }));
    return Object.keys(newErrors).length === 0;
  };

  const handleProfileSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateProfileForm()) {
      showToast('error', 'Please fix the errors in the form');
      return;
    }

    setIsLoading(true);
    try {
      const { apiFetch } = await import('../services/api');
      await apiFetch(`/users/${user.id}`, {
        method: 'PUT',
        body: JSON.stringify({
          name: profileData.name,
          email: profileData.email,
          phoneNumber: profileData.phoneNumber
        })
      });
      
      setHasProfileChanges(false);
      showToast('success', 'Profile updated successfully!');
    } catch (err) {
      showToast('error', err.message || 'Failed to update profile');
    } finally {
      setIsLoading(false);
    }
  };

  // Password Form Handlers
  const handlePasswordChange = (field, value) => {
    setPasswordData(prev => ({ ...prev, [field]: value }));
    // Clear error for this field
    setErrors(prev => ({
      ...prev,
      password: { ...prev.password, [field]: '' }
    }));
  };

  const validatePasswordForm = () => {
    const newErrors = {};
    
    const currentPassError = validateCurrentPassword(passwordData.currentPassword);
    if (currentPassError) newErrors.currentPassword = currentPassError;
    
    const newPassError = validateNewPassword(passwordData.newPassword);
    if (newPassError) newErrors.newPassword = newPassError;
    
    const confirmPassError = validateConfirmPassword(passwordData.confirmPassword, passwordData.newPassword);
    if (confirmPassError) newErrors.confirmPassword = confirmPassError;
    
    setErrors(prev => ({ ...prev, password: newErrors }));
    return Object.keys(newErrors).length === 0;
  };

  const handlePasswordSubmit = async (e) => {
    e.preventDefault();
    
    if (!validatePasswordForm()) {
      showToast('error', 'Please fix the errors in the form');
      return;
    }

    setIsLoading(true);
    try {
      const { apiFetch } = await import('../services/api');
      await apiFetch(`/users/${user.id}/change-password`, {
        method: 'POST',
        body: JSON.stringify({
          currentPassword: passwordData.currentPassword,
          newPassword: passwordData.newPassword,
          confirmPassword: passwordData.confirmPassword
        })
      });
      
      // Reset password form
      setPasswordData({
        currentPassword: '',
        newPassword: '',
        confirmPassword: ''
      });
      showToast('success', 'Password changed successfully!');
    } catch (err) {
      showToast('error', err.message || 'Failed to change password');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="settings-page">
      <div className="settings-container">
        {/* Header */}
        <div className="settings-header">
          <div className="settings-header-content">
            <h1>Account Settings</h1>
            <p>Manage your account information and security</p>
          </div>
          <div className="user-badge">
            <span className={`role-badge role-${user?.role?.toLowerCase() || 'user'}`}>
              {user?.role || 'User'}
            </span>
          </div>
        </div>

        {/* Tabs */}
        <div className="settings-tabs">
          <button
            className={`tab-button ${activeTab === 'profile' ? 'active' : ''}`}
            onClick={() => setActiveTab('profile')}
          >
            <User size={20} />
            <span>Profile Information</span>
          </button>
          <button
            className={`tab-button ${activeTab === 'password' ? 'active' : ''}`}
            onClick={() => setActiveTab('password')}
          >
            <Lock size={20} />
            <span>Password & Security</span>
          </button>
        </div>

        {/* Tab Content */}
        <div className="settings-content">
          {/* Profile Tab */}
          {activeTab === 'profile' && (
            <form onSubmit={handleProfileSubmit} className="settings-form">
              <div className="form-section">
                <h2>Profile Information</h2>
                <p className="section-description">Update your personal details</p>

                {/* Name Field */}
                <div className="form-group">
                  <label htmlFor="name" className="form-label">
                    Full Name <span className="required">*</span>
                  </label>
                  <div className="input-wrapper">
                    <User size={18} className="input-icon" />
                    <input
                      id="name"
                      type="text"
                      value={profileData.name}
                      onChange={(e) => handleProfileChange('name', e.target.value)}
                      placeholder="Enter your full name"
                      className={`form-input ${errors.profile.name ? 'error' : ''}`}
                    />
                  </div>
                  {errors.profile.name && (
                    <div className="error-message">
                      <AlertCircle size={16} />
                      {errors.profile.name}
                    </div>
                  )}
                  <p className="field-hint">Letters and spaces only, no numbers</p>
                </div>

                {/* Email Field */}
                <div className="form-group">
                  <label htmlFor="email" className="form-label">
                    Email Address <span className="required">*</span>
                  </label>
                  <div className="input-wrapper">
                    <Mail size={18} className="input-icon" />
                    <input
                      id="email"
                      type="email"
                      value={profileData.email}
                      onChange={(e) => handleProfileChange('email', e.target.value)}
                      placeholder="your.email@example.com"
                      className={`form-input ${errors.profile.email ? 'error' : ''}`}
                    />
                  </div>
                  {errors.profile.email && (
                    <div className="error-message">
                      <AlertCircle size={16} />
                      {errors.profile.email}
                    </div>
                  )}
                </div>

                {/* Phone Number Field */}
                <div className="form-group">
                  <label htmlFor="phoneNumber" className="form-label">
                    Phone Number <span className="required">*</span>
                  </label>
                  <div className="input-wrapper">
                    <Phone size={18} className="input-icon" />
                    <input
                      id="phoneNumber"
                      type="tel"
                      value={profileData.phoneNumber}
                      onChange={(e) => {
                        // Only allow numbers and formatting characters
                        const value = e.target.value.replace(/[^\d\-\s+()]/g, '');
                        // Limit to 10 digits
                        const digitsOnly = value.replace(/\D/g, '').slice(0, 10);
                        handleProfileChange('phoneNumber', value.replace(/\d/g, (match, offset) => {
                          if (offset >= 10) return '';
                          return match;
                        }));
                      }}
                      placeholder="0123456789"
                      maxLength="10"
                      className={`form-input ${errors.profile.phoneNumber ? 'error' : ''}`}
                    />
                  </div>
                  {errors.profile.phoneNumber && (
                    <div className="error-message">
                      <AlertCircle size={16} />
                      {errors.profile.phoneNumber}
                    </div>
                  )}
                  <p className="field-hint">10-digit phone number, numbers only</p>
                </div>
              </div>

              {/* Submit Button */}
              <div className="form-actions">
                <button
                  type="submit"
                  disabled={!hasProfileChanges || isLoading}
                  className="btn btn-primary"
                >
                  <Save size={18} />
                  {isLoading ? 'Saving...' : 'Save Changes'}
                </button>
              </div>
            </form>
          )}

          {/* Password Tab */}
          {activeTab === 'password' && (
            <form onSubmit={handlePasswordSubmit} className="settings-form">
              <div className="form-section">
                <h2>Change Password</h2>
                <p className="section-description">Ensure your account security with a strong password</p>

                {/* Current Password Field */}
                <div className="form-group">
                  <label htmlFor="currentPassword" className="form-label">
                    Current Password <span className="required">*</span>
                  </label>
                  <div className="input-wrapper">
                    <Lock size={18} className="input-icon" />
                    <input
                      id="currentPassword"
                      type={showCurrentPassword ? 'text' : 'password'}
                      value={passwordData.currentPassword}
                      onChange={(e) => handlePasswordChange('currentPassword', e.target.value)}
                      placeholder="Enter your current password"
                      className={`form-input ${errors.password.currentPassword ? 'error' : ''}`}
                    />
                    <button
                      type="button"
                      className="toggle-password"
                      onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                    >
                      {showCurrentPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                    </button>
                  </div>
                  {errors.password.currentPassword && (
                    <div className="error-message">
                      <AlertCircle size={16} />
                      {errors.password.currentPassword}
                    </div>
                  )}
                </div>

                {/* New Password Field */}
                <div className="form-group">
                  <label htmlFor="newPassword" className="form-label">
                    New Password <span className="required">*</span>
                  </label>
                  <div className="input-wrapper">
                    <Lock size={18} className="input-icon" />
                    <input
                      id="newPassword"
                      type={showNewPassword ? 'text' : 'password'}
                      value={passwordData.newPassword}
                      onChange={(e) => handlePasswordChange('newPassword', e.target.value)}
                      placeholder="Enter your new password"
                      className={`form-input ${errors.password.newPassword ? 'error' : ''}`}
                    />
                    <button
                      type="button"
                      className="toggle-password"
                      onClick={() => setShowNewPassword(!showNewPassword)}
                    >
                      {showNewPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                    </button>
                  </div>
                  {errors.password.newPassword && (
                    <div className="error-message">
                      <AlertCircle size={16} />
                      {errors.password.newPassword}
                    </div>
                  )}
                  <div className="password-requirements">
                    <p>Password must contain:</p>
                    <ul>
                      <li className={passwordData.newPassword.length >= 8 ? 'valid' : ''}>
                        At least 8 characters
                      </li>
                      <li className={/[A-Z]/.test(passwordData.newPassword) ? 'valid' : ''}>
                        At least one uppercase letter
                      </li>
                      <li className={/[0-9]/.test(passwordData.newPassword) ? 'valid' : ''}>
                        At least one number
                      </li>
                      <li className={/[!@#$%^&*()_+\-=\[\]{};:'",.<>?/\\|`~]/.test(passwordData.newPassword) ? 'valid' : ''}>
                        At least one special character (!@#$%^&* etc.)
                      </li>
                    </ul>
                  </div>
                </div>

                {/* Confirm Password Field */}
                <div className="form-group">
                  <label htmlFor="confirmPassword" className="form-label">
                    Confirm New Password <span className="required">*</span>
                  </label>
                  <div className="input-wrapper">
                    <Lock size={18} className="input-icon" />
                    <input
                      id="confirmPassword"
                      type={showConfirmPassword ? 'text' : 'password'}
                      value={passwordData.confirmPassword}
                      onChange={(e) => handlePasswordChange('confirmPassword', e.target.value)}
                      placeholder="Re-enter your new password"
                      className={`form-input ${errors.password.confirmPassword ? 'error' : ''}`}
                    />
                    <button
                      type="button"
                      className="toggle-password"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    >
                      {showConfirmPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                    </button>
                  </div>
                  {errors.password.confirmPassword && (
                    <div className="error-message">
                      <AlertCircle size={16} />
                      {errors.password.confirmPassword}
                    </div>
                  )}
                  {passwordData.confirmPassword && passwordData.newPassword === passwordData.confirmPassword && (
                    <p className="field-hint success">✓ Passwords match</p>
                  )}
                </div>
              </div>

              {/* Submit Button */}
              <div className="form-actions">
                <button
                  type="submit"
                  disabled={isLoading}
                  className="btn btn-primary"
                >
                  <Lock size={18} />
                  {isLoading ? 'Updating...' : 'Update Password'}
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}

export default SettingsPage;
