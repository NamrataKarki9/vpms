import React, { useEffect, useState } from 'react';
import { X, AlertCircle } from 'lucide-react';

const EMPTY_FORM = {
  name: '',
  contactPerson: '',
  phoneNumber: '',
  emailAddress: '',
  address: '',
};

const EMPTY_ERRORS = {
  name: '',
  contactPerson: '',
  phoneNumber: '',
  emailAddress: '',
  address: '',
};

export default function VendorFormModal({ isOpen, isEditing, initialVendor, onClose, onSubmit, isSaving }) {
  const [form, setForm] = useState(EMPTY_FORM);
  const [errors, setErrors] = useState(EMPTY_ERRORS);

  useEffect(() => {
    if (isOpen && initialVendor) {
      setForm({
        name: initialVendor.name || '',
        contactPerson: initialVendor.contactPerson || '',
        phoneNumber: initialVendor.phoneNumber || '',
        emailAddress: initialVendor.emailAddress || '',
        address: initialVendor.address || '',
      });
      setErrors(EMPTY_ERRORS);
      return;
    }

    if (isOpen && !initialVendor) {
      setForm(EMPTY_FORM);
      setErrors(EMPTY_ERRORS);
    }
  }, [isOpen, initialVendor]);

  if (!isOpen) {
    return null;
  }

  // Validation functions
  const validateEmail = (email) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const validatePhoneNumber = (phone) => {
    const phoneRegex = /^[0-9]{10}$/;
    return phoneRegex.test(phone.replace(/\D/g, ''));
  };

  const handleChange = (field) => (event) => {
    const value = event.target.value;
    setForm((current) => ({ ...current, [field]: value }));

    // Clear error when user starts typing
    if (errors[field]) {
      setErrors((current) => ({ ...current, [field]: '' }));
    }
  };

  const validateForm = () => {
    const newErrors = { ...EMPTY_ERRORS };

    const trimmed = {
      name: form.name.trim(),
      contactPerson: form.contactPerson.trim(),
      phoneNumber: form.phoneNumber.trim(),
      emailAddress: form.emailAddress.trim(),
      address: form.address.trim(),
    };

    if (!trimmed.name) {
      newErrors.name = 'Vendor name is required';
    }

    if (!trimmed.contactPerson) {
      newErrors.contactPerson = 'Contact person is required';
    }

    if (!trimmed.phoneNumber) {
      newErrors.phoneNumber = 'Phone number is required';
    } else if (!validatePhoneNumber(trimmed.phoneNumber)) {
      newErrors.phoneNumber = 'Phone number must be exactly 10 digits';
    }

    if (!trimmed.emailAddress) {
      newErrors.emailAddress = 'Email address is required';
    } else if (!validateEmail(trimmed.emailAddress)) {
      newErrors.emailAddress = 'Please enter a valid email address';
    }

    if (!trimmed.address) {
      newErrors.address = 'Address is required';
    }

    setErrors(newErrors);
    return Object.values(newErrors).every((err) => err === '');
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    if (!validateForm()) {
      return;
    }

    const trimmed = {
      name: form.name.trim(),
      contactPerson: form.contactPerson.trim(),
      phoneNumber: form.phoneNumber.trim(),
      emailAddress: form.emailAddress.trim(),
      address: form.address.trim(),
    };

    await onSubmit(trimmed);
  };

  return (
    <div className="modal-overlay" role="presentation" onClick={onClose}>
      <div
        className="modal-card staff-card"
        role="dialog"
        aria-modal="true"
        aria-labelledby="vendor-modal-title"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="modal-header">
          <div>
            <h2 id="vendor-modal-title">{isEditing ? 'Edit Vendor' : 'Add Vendor'}</h2>
            <p>{isEditing ? 'Update the vendor details below.' : 'Create a new vendor record.'}</p>
          </div>
          <button type="button" className="btn-icon-square modal-close-btn" onClick={onClose} aria-label="Close modal">
            <X size={16} />
          </button>
        </div>

        <form className="vendor-form" onSubmit={handleSubmit}>
          <div className="vendor-form-grid">
            <label>
              <span>Name {errors.name && <span style={{ color: '#DC2626' }}>*</span>}</span>
              <input 
                className={`search-input-field ${errors.name ? 'is-error' : ''}`}
                type="text" 
                value={form.name} 
                onChange={handleChange('name')} 
                placeholder="Vendor name"
                style={{
                  borderColor: errors.name ? '#DC2626' : undefined,
                  backgroundColor: errors.name ? '#FEF2F2' : undefined,
                }}
              />
              {errors.name && (
                <div style={{ display: 'flex', alignItems: 'center', gap: '4px', color: '#DC2626', fontSize: '12px', marginTop: '4px' }}>
                  <AlertCircle size={14} />
                  {errors.name}
                </div>
              )}
            </label>
            
            <label>
              <span>Contact Person {errors.contactPerson && <span style={{ color: '#DC2626' }}>*</span>}</span>
              <input 
                className={`search-input-field ${errors.contactPerson ? 'is-error' : ''}`}
                type="text" 
                value={form.contactPerson} 
                onChange={handleChange('contactPerson')} 
                placeholder="Contact person"
                style={{
                  borderColor: errors.contactPerson ? '#DC2626' : undefined,
                  backgroundColor: errors.contactPerson ? '#FEF2F2' : undefined,
                }}
              />
              {errors.contactPerson && (
                <div style={{ display: 'flex', alignItems: 'center', gap: '4px', color: '#DC2626', fontSize: '12px', marginTop: '4px' }}>
                  <AlertCircle size={14} />
                  {errors.contactPerson}
                </div>
              )}
            </label>
            
            <label>
              <span>Phone Number {errors.phoneNumber && <span style={{ color: '#DC2626' }}>*</span>}</span>
              <input 
                className={`search-input-field ${errors.phoneNumber ? 'is-error' : ''}`}
                type="text" 
                value={form.phoneNumber} 
                onChange={handleChange('phoneNumber')} 
                placeholder="10-digit phone number (e.g., 9988776655)"
                maxLength="10"
                style={{
                  borderColor: errors.phoneNumber ? '#DC2626' : undefined,
                  backgroundColor: errors.phoneNumber ? '#FEF2F2' : undefined,
                }}
              />
              {errors.phoneNumber && (
                <div style={{ display: 'flex', alignItems: 'center', gap: '4px', color: '#DC2626', fontSize: '12px', marginTop: '4px' }}>
                  <AlertCircle size={14} />
                  {errors.phoneNumber}
                </div>
              )}
            </label>
            
            <label>
              <span>Email Address {errors.emailAddress && <span style={{ color: '#DC2626' }}>*</span>}</span>
              <input 
                className={`search-input-field ${errors.emailAddress ? 'is-error' : ''}`}
                type="text" 
                value={form.emailAddress} 
                onChange={handleChange('emailAddress')} 
                placeholder="vendor@example.com"
                style={{
                  borderColor: errors.emailAddress ? '#DC2626' : undefined,
                  backgroundColor: errors.emailAddress ? '#FEF2F2' : undefined,
                }}
              />
              {errors.emailAddress && (
                <div style={{ display: 'flex', alignItems: 'center', gap: '4px', color: '#DC2626', fontSize: '12px', marginTop: '4px' }}>
                  <AlertCircle size={14} />
                  {errors.emailAddress}
                </div>
              )}
            </label>
            
            <label className="vendor-form-full">
              <span>Address {errors.address && <span style={{ color: '#DC2626' }}>*</span>}</span>
              <textarea 
                className={`search-input-field ${errors.address ? 'is-error' : ''}`}
                value={form.address} 
                onChange={handleChange('address')} 
                placeholder="Vendor address" 
                rows={4}
                style={{
                  borderColor: errors.address ? '#DC2626' : undefined,
                  backgroundColor: errors.address ? '#FEF2F2' : undefined,
                }}
              />
              {errors.address && (
                <div style={{ display: 'flex', alignItems: 'center', gap: '4px', color: '#DC2626', fontSize: '12px', marginTop: '4px' }}>
                  <AlertCircle size={14} />
                  {errors.address}
                </div>
              )}
            </label>
          </div>

          <div className="modal-actions">
            <button type="button" className="btn-view-customer" onClick={onClose}>
              Cancel
            </button>
            <button type="submit" className="btn-sale-primary" disabled={isSaving}>
              {isSaving ? 'Saving...' : isEditing ? 'Update Vendor' : 'Create Vendor'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
