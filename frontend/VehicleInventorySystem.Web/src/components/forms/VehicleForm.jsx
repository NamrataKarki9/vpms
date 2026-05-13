import React from 'react';

const DEFAULT_FUEL_TYPES = ['Petrol', 'Diesel', 'Hybrid', 'Electric', 'Other'];

function VehicleForm({ value, onChange, errors = {}, fuelTypes = DEFAULT_FUEL_TYPES, showMileageHint = true }) {
  const updateField = (field) => (event) => {
    const nextValue = event.target.value;
    onChange({ ...value, [field]: nextValue });
  };

  return (
    <>
      <div>
        <label>Plate Number *</label>
        <input
          type="text"
          placeholder="e.g., ABC-1234"
          value={value.plateNumber}
          onChange={updateField('plateNumber')}
          style={{ borderColor: errors.plateNumber ? '#ef4444' : '' }}
        />
        {errors.plateNumber && <span style={{ fontSize: '0.75rem', color: '#ef4444' }}>{errors.plateNumber}</span>}
      </div>

      <div>
        <label>Vehicle Make *</label>
        <input
          type="text"
          placeholder="e.g., Toyota"
          value={value.make}
          onChange={updateField('make')}
          style={{ borderColor: errors.make ? '#ef4444' : '' }}
        />
        {errors.make && <span style={{ fontSize: '0.75rem', color: '#ef4444' }}>{errors.make}</span>}
      </div>

      <div>
        <label>Vehicle Model *</label>
        <input
          type="text"
          placeholder="e.g., Camry"
          value={value.model}
          onChange={updateField('model')}
          style={{ borderColor: errors.model ? '#ef4444' : '' }}
        />
        {errors.model && <span style={{ fontSize: '0.75rem', color: '#ef4444' }}>{errors.model}</span>}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
        <div>
          <label>Year *</label>
          <input
            type="number"
            min="1900"
            max={new Date().getFullYear() + 1}
            value={value.year}
            onChange={updateField('year')}
            style={{ borderColor: errors.year ? '#ef4444' : '' }}
          />
          {errors.year && <span style={{ fontSize: '0.75rem', color: '#ef4444' }}>{errors.year}</span>}
        </div>
        <div>
          <label>Fuel Type *</label>
          <select value={value.fuelType} onChange={updateField('fuelType')} style={{ borderColor: errors.fuelType ? '#ef4444' : '' }}>
            <option value="">Select...</option>
            {fuelTypes.map((fuel) => (
              <option key={fuel} value={fuel}>{fuel}</option>
            ))}
          </select>
          {errors.fuelType && <span style={{ fontSize: '0.75rem', color: '#ef4444' }}>{errors.fuelType}</span>}
        </div>
      </div>

      <div>
        <label>Mileage (km) *</label>
        <input
          type="number"
          min="0"
          placeholder="Mileage in kilometers"
          value={value.mileage}
          onChange={updateField('mileage')}
          style={{ borderColor: errors.mileage ? '#ef4444' : '' }}
        />
        {showMileageHint && !errors.mileage && (
          <span style={{ fontSize: '0.75rem', color: '#64748b' }}>Mileage in kilometers</span>
        )}
        {errors.mileage && <span style={{ fontSize: '0.75rem', color: '#ef4444' }}>{errors.mileage}</span>}
      </div>
    </>
  );
}

export default VehicleForm;
