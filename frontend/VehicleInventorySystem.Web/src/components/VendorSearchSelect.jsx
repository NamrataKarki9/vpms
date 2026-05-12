import React, { useMemo, useState } from 'react';

export default function VendorSearchSelect({ vendors, value, onChange, label }) {
  const vendorList = useMemo(() => vendors || [], [vendors]);

  const selectedVendor = useMemo(() => {
    if (!value) return null;
    return vendorList.find((v) => v.id === value) || null;
  }, [value, vendorList]);

  const [draft, setDraft] = useState('');

  const searchValue = selectedVendor ? selectedVendor.name : draft;

  const filtered = useMemo(() => {
    const term = searchValue.trim().toLowerCase();
    if (!term) return vendorList;
    return vendorList.filter((v) => String(v.name || '').toLowerCase().includes(term));
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
          if (value) onChange(null);
        }}
      />
      <div className="vendor-select-list">
        {filtered.map((vendor) => (
          <div
            key={vendor.id}
            className={`vendor-select-item${value === vendor.id ? ' selected' : ''}`}
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
