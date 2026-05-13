import React from 'react';
import { Hash, Car, Gauge, Calendar, Droplets } from 'lucide-react';

const DEFAULT_FUEL_TYPES = ['Petrol', 'Diesel', 'Hybrid', 'Electric', 'Other'];

function VehicleForm({ value, onChange, errors = {}, fuelTypes = DEFAULT_FUEL_TYPES, showMileageHint = true, useAuthStyles = false }) {
  const updateField = (field) => (event) => {
    const nextValue = event.target.value;
    onChange({ ...value, [field]: nextValue });
  };

  if (useAuthStyles) {
    return (
      <>
        <div className="auth-form-group">
          <label className="auth-label">Plate Number</label>
          <div className="auth-input-wrapper">
            <Hash className="auth-input-icon" size={18} />
            <input
              type="text"
              placeholder="e.g., BA-1-PA-1234"
              className={`auth-input ${errors.plateNumber ? 'error' : ''}`}
              value={value.plateNumber}
              onChange={updateField('plateNumber')}
            />
          </div>
          {errors.plateNumber && <span className="auth-error-text">{errors.plateNumber}</span>}
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
          <div className="auth-form-group">
            <label className="auth-label">Vehicle Make</label>
            <div className="auth-input-wrapper">
              <Car className="auth-input-icon" size={18} />
              <input
                type="text"
                placeholder="e.g., Toyota"
                className={`auth-input ${errors.make ? 'error' : ''}`}
                value={value.make}
                onChange={updateField('make')}
              />
            </div>
            {errors.make && <span className="auth-error-text">{errors.make}</span>}
          </div>

          <div className="auth-form-group">
            <label className="auth-label">Vehicle Model</label>
            <div className="auth-input-wrapper">
              <Car className="auth-input-icon" size={18} />
              <input
                type="text"
                placeholder="e.g., Camry"
                className={`auth-input ${errors.model ? 'error' : ''}`}
                value={value.model}
                onChange={updateField('model')}
              />
            </div>
            {errors.model && <span className="auth-error-text">{errors.model}</span>}
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
          <div className="auth-form-group">
            <label className="auth-label">Year</label>
            <div className="auth-input-wrapper">
              <Calendar className="auth-input-icon" size={18} />
              <input
                type="number"
                min="1900"
                max={new Date().getFullYear() + 1}
                className={`auth-input ${errors.year ? 'error' : ''}`}
                value={value.year}
                onChange={updateField('year')}
              />
            </div>
            {errors.year && <span className="auth-error-text">{errors.year}</span>}
          </div>
          <div className="auth-form-group">
            <label className="auth-label">Fuel Type</label>
            <div className="auth-input-wrapper">
              <Droplets className="auth-input-icon" size={18} />
              <select 
                className={`auth-input ${errors.fuelType ? 'error' : ''}`}
                value={value.fuelType} 
                onChange={updateField('fuelType')}
                style={{ paddingLeft: '44px' }}
              >
                <option value="">Select...</option>
                {fuelTypes.map((fuel) => (
                  <option key={fuel} value={fuel}>{fuel}</option>
                ))}
              </select>
            </div>
            {errors.fuelType && <span className="auth-error-text">{errors.fuelType}</span>}
          </div>
        </div>

        <div className="auth-form-group">
          <label className="auth-label">Mileage (km)</label>
          <div className="auth-input-wrapper">
            <Gauge className="auth-input-icon" size={18} />
            <input
              type="number"
              min="0"
              placeholder="Total kilometers driven"
              className={`auth-input ${errors.mileage ? 'error' : ''}`}
              value={value.mileage}
              onChange={updateField('mileage')}
            />
          </div>
          {errors.mileage && <span className="auth-error-text">{errors.mileage}</span>}
        </div>
      </>
    );
  }

  // Legacy fallback for other pages (e.g. Dashboard)
  return (
    <>
      <div className="mini-form-field">
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

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
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

      <div className="mini-form-field">
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
