import React, { useEffect, useMemo, useState } from 'react';
import { X } from 'lucide-react';
import VendorSearchSelect from '../VendorSearchSelect';
import { useToast } from '../../context/ToastContext';

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
  const showToast = useToast();
  const [form, setForm] = useState(EMPTY_FORM);
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
      return;
    }

    if (isOpen && !initialPart) {
      setForm(EMPTY_FORM);
    }
  }, [isOpen, initialPart]);

  if (!isOpen) {
    return null;
  }

  const handleChange = (field) => (event) => {
    setForm((current) => ({ ...current, [field]: event.target.value }));
  };

  const validate = () => {
    const trimmedName = form.name.trim();
    const trimmedCode = form.partCode.trim();
    const priceValue = Number(form.price);
    const stockValue = Number(form.stockLevel);
    const vendorValue = Number(form.vendorId);

    // Validate in priority order and show toast for first error
    if (!trimmedName) {
      showToast('error', 'Name is required.');
      return false;
    }

    if (!trimmedCode) {
      showToast('error', 'Part code is required.');
      return false;
    }

    if (form.price === '' || Number.isNaN(priceValue)) {
      showToast('error', 'Price is required.');
      return false;
    } else if (priceValue < 0) {
      showToast('error', 'Price must be 0 or greater.');
      return false;
    }

    if (form.stockLevel === '' || Number.isNaN(stockValue)) {
      showToast('error', 'Stock level is required.');
      return false;
    } else if (stockValue < 0) {
      showToast('error', 'Stock level must be 0 or greater.');
      return false;
    }

    if (!form.vendorId || Number.isNaN(vendorValue) || vendorValue <= 0) {
      showToast('error', 'Vendor is required.');
      return false;
    }

    return true;
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    console.log('PartFormModal handleSubmit called');

    if (!validate()) {
      console.log('Validation failed');
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

    console.log('Payload:', payload);

    try {
      console.log('Calling onSubmit');
      await onSubmit(payload);
      console.log('onSubmit completed successfully');
    } catch (error) {
      console.error('Error submitting part form:', error);
      showToast('error', error?.message || 'Failed to submit form.');
    }
  };

  return (
    <div className="modal-overlay" role="presentation" onClick={onClose}>
      <div
        className="modal-card staff-card"
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
          <button type="button" className="btn-icon-square modal-close-btn" onClick={onClose} aria-label="Close modal">
            <X size={16} />
          </button>
        </div>

        <form className="vendor-form" onSubmit={handleSubmit}>
          <div className="vendor-form-grid">
            <label>
              <span>Name</span>
              <input className="search-input-field" type="text" value={form.name} onChange={handleChange('name')} placeholder="Part name" />
            </label>
            <label>
              <span>Part Code</span>
              <input className="search-input-field" type="text" value={form.partCode} onChange={handleChange('partCode')} placeholder="PRT-001" />
            </label>
            <label>
              <span>Price</span>
              <input className="search-input-field" type="number" min="0" step="0.01" value={form.price} onChange={handleChange('price')} placeholder="0.00" />
            </label>
            <label>
              <span>Initial Stock Level</span>
              <input className="search-input-field" type="number" min="0" step="1" value={form.stockLevel} onChange={handleChange('stockLevel')} placeholder="0" />
            </label>
            <VendorSearchSelect
              vendors={activeVendors}
              value={form.vendorId ? Number(form.vendorId) : null}
              onChange={(id) => setForm((current) => ({ ...current, vendorId: id ? String(id) : '' }))}
              label="Vendor"
            />
            <label className="vendor-form-full">
              <span>Description</span>
              <textarea className="search-input-field" value={form.description} onChange={handleChange('description')} placeholder="Part description" rows={4} />
            </label>
          </div>

          <div className="modal-actions">
            <button type="button" className="btn-view-customer" onClick={onClose}>
              Cancel
            </button>
            <button type="submit" className="btn-sale-primary" disabled={isSaving}>
              {isSaving ? 'Saving...' : isEditing ? 'Update Part' : 'Create Part'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
