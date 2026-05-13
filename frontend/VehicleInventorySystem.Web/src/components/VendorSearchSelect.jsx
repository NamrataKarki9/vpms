import React, { useMemo, useState } from 'react';

export default function VendorSearchSelect({ vendors, value, onChange, label }) {
  const vendorList = useMemo(() => (vendors || []).map((vendor) => ({
    id: Number(vendor.id ?? vendor.Id ?? 0),
    name: vendor.name ?? vendor.Name ?? '',
    contactPerson: vendor.contactPerson ?? vendor.ContactPerson ?? '',
    emailAddress: vendor.emailAddress ?? vendor.EmailAddress ?? '',
    isActive: Boolean(vendor.isActive ?? vendor.IsActive ?? false),
  })).filter((vendor) => vendor.id > 0 && vendor.name), [vendors]);
  const selectedValue = value ? Number(value) : null;

  const selectedVendor = useMemo(() => {
    if (!selectedValue) return null;
    return vendorList.find((v) => v.id === selectedValue) || null;
  }, [selectedValue, vendorList]);

  const [draft, setDraft] = useState('');

  const searchValue = selectedVendor ? selectedVendor.name : draft;

  const filtered = useMemo(() => {
    const term = searchValue.trim().toLowerCase();
    if (!term) return vendorList;
    return vendorList.filter((vendor) => [
      vendor.name,
      vendor.contactPerson,
      vendor.emailAddress,
    ].some((field) => String(field || '').toLowerCase().includes(term)));
  }, [vendorList, searchValue]);

  return (
    <label>
      {label && <span>{label}</span>}
      <input
        type="search"
        placeholder="Search vendors..."
        value={searchValue}
        onChange={(e) => {
          setDraft(e.target.value);
          if (selectedValue) onChange(null);
        }}
      />
      <div className="vendor-select-list">
        {filtered.map((vendor) => (
          <div
            key={vendor.id}
            className={`vendor-select-item${selectedValue === vendor.id ? ' selected' : ''}`}
            onClick={() => {
              onChange(vendor.id);
              setDraft('');
            }}
          >
            {vendor.name}
          </div>
        ))}
        {filtered.length === 0 && (
          <div className="vendor-select-empty">No vendors match that search.</div>
        )}
      </div>
    </label>
  );
}
