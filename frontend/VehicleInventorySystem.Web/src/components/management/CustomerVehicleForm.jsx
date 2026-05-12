import React, { useState } from 'react';
import { useToast } from '../../context/ToastContext';
import VehicleForm from '../forms/VehicleForm';

function CustomerVehicleForm({ onRegister }) {
  const showToast = useToast();
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState({
    name: '', phone: '', email: '', password: '',
    plateNumber: '', make: '', model: '', year: new Date().getFullYear(), fuelType: '', mileage: 0
  });
  const [showPassword, setShowPassword] = useState(false);
  const [errors, setErrors] = useState({
    name: '', phone: '', email: '', password: '',
    plateNumber: '', make: '', model: '', year: '', fuelType: '', mileage: ''
  });

  const validateName = (nameVal) => {
    if (!nameVal.trim()) return 'Name is required';
    if (!/^[a-zA-Z\s]*$/.test(nameVal)) return 'Name must contain only letters and spaces';
    return '';
  };

  const validatePhone = (phoneVal) => {
    if (!phoneVal.trim()) return 'Phone is required';
    if (!/^\d{10}$/.test(phoneVal)) return 'Phone must be exactly 10 digits (numbers only)';
    return '';
  };

  const validateEmail = (emailVal) => {
    if (!emailVal.trim()) return 'Email is required';
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(emailVal)) return 'Invalid email format';
    return '';
  };

  const validatePassword = (passwordVal) => {
    if (!passwordVal.trim()) return 'Password is required';
    if (passwordVal.length < 6) return 'Password must be at least 6 characters';
    return '';
  };

  const validateVehicleModel = (modelVal) => {
    if (!modelVal.trim()) return 'Vehicle model is required';
    return '';
  };

  const validateVehicleMake = (makeVal) => {
    if (!makeVal.trim()) return 'Vehicle make is required';
    return '';
  };

  const validateVehicleYear = (yearVal) => {
    if (!yearVal) return 'Year is required';
    const year = parseInt(yearVal, 10);
    const currentYear = new Date().getFullYear();
    if (year < 1900 || year > currentYear + 1) return `Year must be between 1900 and ${currentYear + 1}`;
    return '';
  };

  const validatePlateNumber = (plateVal) => {
    if (!plateVal.trim()) return 'Plate number is required';
    return '';
  };

  const validateFuelType = (fuelVal) => {
    if (!fuelVal.trim()) return 'Fuel type is required';
    return '';
  };

  const validateMileage = (mileageVal) => {
    if (mileageVal === '' || mileageVal === null || typeof mileageVal === 'undefined') return 'Mileage is required';
    const mileage = Number(mileageVal);
    if (Number.isNaN(mileage) || mileage < 0) return 'Mileage must be 0 or greater';
    return '';
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (onRegister) {
      onRegister({
        name: formData.name,
        phone: formData.phone,
        email: formData.email,
        password: formData.password,
        vehicle: {
          plateNumber: formData.plateNumber,
          make: formData.make,
          model: formData.model,
          year: parseInt(formData.year, 10),
          fuelType: formData.fuelType,
          mileage: Number(formData.mileage)
        }
      });
    }
    showToast('success', `${formData.name} registered with vehicle ${formData.plateNumber}`);
    setStep(1);
    setFormData({ name: '', phone: '', email: '', password: '', plateNumber: '', make: '', model: '', year: new Date().getFullYear(), fuelType: '', mileage: 0 });
    setErrors({ name: '', phone: '', email: '', password: '', plateNumber: '', make: '', model: '', year: '', fuelType: '', mileage: '' });
  };

  const canProceedStep1 = () => {
    const nameError = validateName(formData.name);
    const phoneError = validatePhone(formData.phone);
    const emailError = validateEmail(formData.email);
    const passwordError = validatePassword(formData.password);
    return !nameError && !phoneError && !emailError && !passwordError;
  };

  const canSubmitStep2 = () => {
    const plateError = validatePlateNumber(formData.plateNumber);
    const makeError = validateVehicleMake(formData.make);
    const modelError = validateVehicleModel(formData.model);
    const yearError = validateVehicleYear(formData.year);
    const fuelError = validateFuelType(formData.fuelType);
    const mileageError = validateMileage(formData.mileage);
    return !plateError && !makeError && !modelError && !yearError && !fuelError && !mileageError;
  };

  return (
    <div className="management-card">
      <h3>Customer & Vehicle Registration</h3>
      <div className="progress-bar" style={{ display: 'flex', gap: '5px', margin: '1rem 0' }}>
        <div style={{ flex: 1, height: '4px', background: step >= 1 ? 'var(--primary)' : '#e2e8f0' }}></div>
        <div style={{ flex: 1, height: '4px', background: step >= 2 ? 'var(--primary)' : '#e2e8f0' }}></div>
      </div>

      <form onSubmit={handleSubmit}>
        {step === 1 ? (
          <div className="mini-form">
            <h4>Step 1: Customer Details</h4>
            <div>
              <input 
                type="text" placeholder="Customer Name" required 
                value={formData.name} 
                onChange={e => {
                  setFormData({...formData, name: e.target.value});
                  setErrors({...errors, name: validateName(e.target.value)});
                }}
                style={{ borderColor: errors.name ? '#ef4444' : '' }}
              />
              {errors.name && <span style={{ fontSize: '0.75rem', color: '#ef4444' }}>{errors.name}</span>}
            </div>
            <div>
              <input 
                type="tel" 
                placeholder="Phone Number (10 digits)" 
                required 
                value={formData.phone} 
                onChange={e => {
                  const onlyNumbers = e.target.value.replace(/\D/g, '');
                  setFormData({...formData, phone: onlyNumbers});
                  setErrors({...errors, phone: validatePhone(onlyNumbers)});
                }}
                style={{ borderColor: errors.phone ? '#ef4444' : '' }}
                maxLength="10"
              />
              {errors.phone && <span style={{ fontSize: '0.75rem', color: '#ef4444' }}>{errors.phone}</span>}
            </div>
            <div>
              <input 
                type="email" placeholder="Email Address" required 
                value={formData.email} 
                onChange={e => {
                  setFormData({...formData, email: e.target.value});
                  setErrors({...errors, email: validateEmail(e.target.value)});
                }}
                style={{ borderColor: errors.email ? '#ef4444' : '' }}
              />
              {errors.email && <span style={{ fontSize: '0.75rem', color: '#ef4444' }}>{errors.email}</span>}
            </div>
            <div style={{ position: 'relative', width: '100%' }}>
              <input 
                type={showPassword ? "text" : "password"} placeholder="Password" required 
                value={formData.password} 
                onChange={e => {
                  setFormData({...formData, password: e.target.value});
                  setErrors({...errors, password: validatePassword(e.target.value)});
                }}
                style={{ width: '100%', marginBottom: '0.25rem', borderColor: errors.password ? '#ef4444' : '' }}
              />
              <button type="button" onClick={() => setShowPassword(!showPassword)} style={{ position: 'absolute', right: '10px', top: '12px', background: 'none', border: 'none', color: 'var(--primary)', cursor: 'pointer', padding: 0, boxShadow: 'none' }}>
                {showPassword ? 'Hide' : 'Show'}
              </button>
            </div>
            {errors.password && <span style={{ fontSize: '0.75rem', color: '#ef4444', display: 'block', marginBottom: '1rem' }}>{errors.password}</span>}
            <button type="button" onClick={() => setStep(2)} disabled={!canProceedStep1()}>Next: Vehicle Details</button>
          </div>
        ) : (
          <div className="mini-form">
            <h4>Step 2: Vehicle Details</h4>
            <VehicleForm
              value={{
                plateNumber: formData.plateNumber,
                make: formData.make,
                model: formData.model,
                year: formData.year,
                fuelType: formData.fuelType,
                mileage: formData.mileage
              }}
              onChange={(next) => {
                setFormData({ ...formData, ...next });
                setErrors({
                  ...errors,
                  plateNumber: validatePlateNumber(next.plateNumber ?? formData.plateNumber),
                  make: validateVehicleMake(next.make ?? formData.make),
                  model: validateVehicleModel(next.model ?? formData.model),
                  year: validateVehicleYear(next.year ?? formData.year),
                  fuelType: validateFuelType(next.fuelType ?? formData.fuelType),
                  mileage: validateMileage(next.mileage ?? formData.mileage)
                });
              }}
              errors={errors}
            />
            <div style={{ display: 'flex', gap: '10px' }}>
              <button type="button" onClick={() => setStep(1)} style={{ background: '#cbd5e1', color: '#0f172a' }}>Back</button>
              <button type="submit" disabled={!canSubmitStep2()}>Complete Registration</button>
            </div>
          </div>
        )}
      </form>
    </div>
  );
}

export default CustomerVehicleForm;
