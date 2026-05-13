import React, { useState } from 'react';

function VehicleForm({ onSubmit, onCancel, isSaving }) {
  const [form, setForm] = useState({
    plateNumber: '',
    make: '',
    model: '',
    year: new Date().getFullYear(),
    fuelType: 'Petrol',
    mileage: 0
  });

  const fuelTypes = ['Petrol', 'Diesel', 'Hybrid', 'Electric', 'CNG'];

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit(form);
  };

  return (
    <form onSubmit={handleSubmit} className="mini-form">
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
        <label>
          <span>Plate Number *</span>
          <input
            type="text"
            required
            value={form.plateNumber}
            onChange={(e) => setForm({ ...form, plateNumber: e.target.value.toUpperCase() })}
            placeholder="BA 1 PA 1234"
          />
        </label>
        <label>
          <span>Make *</span>
          <input
            type="text"
            required
            value={form.make}
            onChange={(e) => setForm({ ...form, make: e.target.value })}
            placeholder="Toyota"
          />
        </label>
        <label>
          <span>Model *</span>
          <input
            type="text"
            required
            value={form.model}
            onChange={(e) => setForm({ ...form, model: e.target.value })}
            placeholder="Corolla"
          />
        </label>
        <label>
          <span>Year *</span>
          <input
            type="number"
            required
            min="1900"
            max={new Date().getFullYear() + 1}
            value={form.year}
            onChange={(e) => setForm({ ...form, year: parseInt(e.target.value) })}
          />
        </label>
        <label>
          <span>Fuel Type</span>
          <select value={form.fuelType} onChange={(e) => setForm({ ...form, fuelType: e.target.value })}>
            {fuelTypes.map((t) => (
              <option key={t} value={t}>{t}</option>
            ))}
          </select>
        </label>
        <label>
          <span>Mileage (km)</span>
          <input
            type="number"
            min="0"
            value={form.mileage}
            onChange={(e) => setForm({ ...form, mileage: parseInt(e.target.value) })}
          />
        </label>
      </div>
      <div style={{ display: 'flex', gap: '1rem', marginTop: '1.5rem' }}>
        <button type="button" onClick={onCancel} className="btn-secondary" style={{ flex: 1 }} disabled={isSaving}>
          Cancel
        </button>
        <button type="submit" style={{ flex: 1 }} disabled={isSaving}>
          {isSaving ? 'Saving...' : 'Add Vehicle'}
        </button>
      </div>
    </form>
  );
}

export default VehicleForm;
