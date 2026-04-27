import React, { useEffect, useState } from 'react';

const EMPTY_FORM = {
  name: '',
  contactPerson: '',
  phoneNumber: '',
  emailAddress: '',
  address: '',
};

export default function VendorFormModal({ isOpen, isEditing, initialVendor, onClose, onSubmit, isSaving }) {
  const [form, setForm] = useState(EMPTY_FORM);
  const [error, setError] = useState('');

  useEffect(() => {
    if (isOpen && initialVendor) {
      setForm({
        name: initialVendor.name || '',
        contactPerson: initialVendor.contactPerson || '',
        phoneNumber: initialVendor.phoneNumber || '',
        emailAddress: initialVendor.emailAddress || '',
        address: initialVendor.address || '',
      });
      setError('');
      return;
    }

    if (isOpen && !initialVendor) {
      setForm(EMPTY_FORM);
      setError('');
    }
  }, [isOpen, initialVendor]);

  if (!isOpen) {
    return null;
  }

  const handleChange = (field) => (event) => {
    setForm((current) => ({ ...current, [field]: event.target.value }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    const trimmed = {
      name: form.name.trim(),
      contactPerson: form.contactPerson.trim(),
      phoneNumber: form.phoneNumber.trim(),
      emailAddress: form.emailAddress.trim(),
      address: form.address.trim(),
    };

    if (!trimmed.name || !trimmed.contactPerson || !trimmed.phoneNumber || !trimmed.emailAddress || !trimmed.address) {
      setError('Please complete all required fields.');
      return;
    }

    setError('');
    await onSubmit(trimmed);
  };

  return (
    <div className="modal-overlay" role="presentation" onClick={onClose}>
      <div className="modal-card card" role="dialog" aria-modal="true" aria-labelledby="vendor-modal-title" onClick={(event) => event.stopPropagation()}>
        <div className="modal-header">
          <div>
            <h2 id="vendor-modal-title">{isEditing ? 'Edit Vendor' : 'Add Vendor'}</h2>
            <p>{isEditing ? 'Update the vendor details below.' : 'Create a new vendor record.'}</p>
          </div>
          <button type="button" className="icon-btn modal-close-btn" onClick={onClose} aria-label="Close modal">
            ×
          </button>
        </div>

        <form className="vendor-form" onSubmit={handleSubmit}>
          <div className="vendor-form-grid">
            <label>
              <span>Name</span>
              <input type="text" value={form.name} onChange={handleChange('name')} placeholder="Vendor name" />
            </label>
            <label>
              <span>Contact Person</span>
              <input type="text" value={form.contactPerson} onChange={handleChange('contactPerson')} placeholder="Contact person" />
            </label>
            <label>
              <span>Phone Number</span>
              <input type="text" value={form.phoneNumber} onChange={handleChange('phoneNumber')} placeholder="Phone number" />
            </label>
            <label>
              <span>Email Address</span>
              <input type="email" value={form.emailAddress} onChange={handleChange('emailAddress')} placeholder="Email address" />
            </label>
            <label className="vendor-form-full">
              <span>Address</span>
              <textarea value={form.address} onChange={handleChange('address')} placeholder="Vendor address" rows={4} />
            </label>
          </div>

          {error && <div className="form-error">{error}</div>}

          <div className="modal-actions">
            <button type="button" className="btn-secondary" onClick={onClose}>
              Cancel
            </button>
            <button type="submit" disabled={isSaving}>
              {isSaving ? 'Saving...' : isEditing ? 'Update Vendor' : 'Create Vendor'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
