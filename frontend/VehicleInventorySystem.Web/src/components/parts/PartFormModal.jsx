import React, { useEffect, useMemo, useState } from 'react';
import VendorSearchSelect from '../VendorSearchSelect';

const EMPTY_FORM = {
  name: '',
  partCode: '',
  description: '',
  price: '',
  stockLevel: '',
  vendorId: '',
};

export default function PartFormModal({
  isOpen,
  isEditing,
  initialPart,
  vendors,
  onClose,
  onSubmit,
  isSaving,
}) {
  const [form, setForm] = useState(EMPTY_FORM);
  const [errors, setErrors] = useState({});
  const activeVendors = useMemo(() => {
    return (vendors || [])
      .map((vendor) => ({
        id: Number(vendor.id ?? vendor.Id ?? 0),
        name: vendor.name ?? vendor.Name ?? '',
        contactPerson: vendor.contactPerson ?? vendor.ContactPerson ?? '',
        emailAddress: vendor.emailAddress ?? vendor.EmailAddress ?? '',
        isActive: Boolean(vendor.isActive ?? vendor.IsActive ?? false),
      }))
      .filter((vendor) => vendor.id > 0 && vendor.name && vendor.isActive);
  }, [vendors]);

  useEffect(() => {
    if (isOpen && initialPart) {
      setForm({
        name: initialPart.name || '',
        partCode: initialPart.partCode || '',
        description: initialPart.description || '',
        price: Number.isFinite(Number(initialPart.price)) ? String(initialPart.price) : '',
        stockLevel: Number.isFinite(Number(initialPart.stockLevel)) ? String(initialPart.stockLevel) : '',
        vendorId: initialPart.vendorId ? String(initialPart.vendorId) : '',
      });
      setErrors({});
      return;
    }

    if (isOpen && !initialPart) {
      setForm(EMPTY_FORM);
      setErrors({});
    }
  }, [isOpen, initialPart]);

  if (!isOpen) {
    return null;
  }

  console.log('Vendors used in Add Part modal:', activeVendors);

  const handleChange = (field) => (event) => {
    setForm((current) => ({ ...current, [field]: event.target.value }));
  };

  const validate = () => {
    const nextErrors = {};
    const trimmedName = form.name.trim();
    const trimmedCode = form.partCode.trim();
    const priceValue = Number(form.price);
    const stockValue = Number(form.stockLevel);
    const vendorValue = Number(form.vendorId);

    if (!trimmedName) {
      nextErrors.name = 'Name is required.';
    }

    if (!trimmedCode) {
      nextErrors.partCode = 'Part code is required.';
    }

    if (form.price === '' || Number.isNaN(priceValue)) {
      nextErrors.price = 'Price is required.';
    } else if (priceValue < 0) {
      nextErrors.price = 'Price must be 0 or greater.';
    }

    if (form.stockLevel === '' || Number.isNaN(stockValue)) {
      nextErrors.stockLevel = 'Stock level is required.';
    } else if (stockValue < 0) {
      nextErrors.stockLevel = 'Stock level must be 0 or greater.';
    }

    if (!form.vendorId || Number.isNaN(vendorValue) || vendorValue <= 0) {
      nextErrors.vendorId = 'Vendor is required.';
    }

    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    if (!validate()) {
      return;
    }

    const payload = {
      name: form.name.trim(),
      partCode: form.partCode.trim(),
      description: form.description.trim(),
      price: Number(form.price),
      stockLevel: Number(form.stockLevel),
      vendorId: Number(form.vendorId),
    };

    await onSubmit(payload);
  };

  const errorMessages = Object.values(errors);

  return (
    <div className="modal-overlay" role="presentation" onClick={onClose}>
      <div
        className="modal-card card"
        role="dialog"
        aria-modal="true"
        aria-labelledby="part-modal-title"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="modal-header">
          <div>
            <h2 id="part-modal-title">{isEditing ? 'Edit Part' : 'Add Part'}</h2>
            <p>{isEditing ? 'Update the part details below.' : 'Create a new part record.'}</p>
          </div>
          <button type="button" className="icon-btn modal-close-btn" onClick={onClose} aria-label="Close modal">
            ×
          </button>
        </div>

        <form className="vendor-form" onSubmit={handleSubmit}>
          <div className="vendor-form-grid">
            <label>
              <span>Name</span>
              <input type="text" value={form.name} onChange={handleChange('name')} placeholder="Part name" />
            </label>
            <label>
              <span>Part Code</span>
              <input type="text" value={form.partCode} onChange={handleChange('partCode')} placeholder="PRT-001" />
            </label>
            <label>
              <span>Price</span>
              <input type="number" min="0" step="0.01" value={form.price} onChange={handleChange('price')} placeholder="0.00" />
            </label>
            <label>
              <span>Initial Stock Level</span>
              <input type="number" min="0" step="1" value={form.stockLevel} onChange={handleChange('stockLevel')} placeholder="0" />
            </label>
            <VendorSearchSelect
              vendors={activeVendors}
              value={form.vendorId ? Number(form.vendorId) : null}
              onChange={(id) => setForm((current) => ({ ...current, vendorId: id ? String(id) : '' }))}
              label="Vendor"
            />
            <label className="vendor-form-full">
              <span>Description</span>
              <textarea value={form.description} onChange={handleChange('description')} placeholder="Part description" rows={4} />
            </label>
          </div>

          {errorMessages.length > 0 && (
            <div className="form-error">
              {errorMessages.map((message) => (
                <div key={message}>{message}</div>
              ))}
            </div>
          )}

          <div className="modal-actions">
            <button type="button" className="btn-secondary" onClick={onClose}>
              Cancel
            </button>
            <button type="submit" disabled={isSaving}>
              {isSaving ? 'Saving...' : isEditing ? 'Update Part' : 'Create Part'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
