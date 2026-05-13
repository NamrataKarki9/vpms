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
    if (!/^\d{10}$/.test(phoneVal)) return 'Phone must be exactly 10 digits';
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
    if (passwordVal.length < 6) return 'At least 6 characters';
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
    if (year < 1900 || year > currentYear + 1) return `Between 1900 and ${currentYear + 1}`;
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
    if (e) e.preventDefault();
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
    return !nameError && !phoneError && !emailError && !passwordError && formData.name && formData.phone && formData.email && formData.password;
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
    <div className="registration-container">
      {/* Progress Indicator */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '25px' }}>
        <div style={{ 
          width: '32px', height: '32px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center',
          background: step >= 1 ? 'linear-gradient(135deg, #1E3A5F 0%, #2563A8 100%)' : '#E2E8F0',
          color: '#fff', fontSize: '13px', fontWeight: '700'
        }}>
          {step > 1 ? <CheckCircle size={16} /> : '1'}
        </div>
        <div style={{ flex: 1, height: '2px', background: step >= 2 ? '#2563A8' : '#E2E8F0' }}></div>
        <div style={{ 
          width: '32px', height: '32px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center',
          background: step >= 2 ? 'linear-gradient(135deg, #1E3A5F 0%, #2563A8 100%)' : '#E2E8F0',
          color: '#fff', fontSize: '13px', fontWeight: '700'
        }}>
          2
        </div>
      </div>

      <form onSubmit={handleSubmit}>
        {step === 1 ? (
          <div className="auth-step-content">
            <h4 style={{ margin: '0 0 20px', color: '#1E293B', fontSize: '16px', fontWeight: '700' }}>Customer Details</h4>
            
            <div className="auth-form-group">
              <label className="auth-label">Full Name</label>
              <div className="auth-input-wrapper">
                <User className="auth-input-icon" size={18} />
                <input 
                  type="text" placeholder="John Doe" 
                  className={`auth-input ${errors.name ? 'error' : ''}`}
                  value={formData.name} 
                  onChange={e => {
                    setFormData({...formData, name: e.target.value});
                    setErrors({...errors, name: validateName(e.target.value)});
                  }}
                />
              </div>
              {errors.name && <span className="auth-error-text">{errors.name}</span>}
            </div>

            <div className="auth-form-group">
              <label className="auth-label">Phone Number</label>
              <div className="auth-input-wrapper">
                <Phone className="auth-input-icon" size={18} />
                <input 
                  type="tel" placeholder="10-digit number" 
                  className={`auth-input ${errors.phone ? 'error' : ''}`}
                  value={formData.phone} 
                  onChange={e => {
                    const onlyNumbers = e.target.value.replace(/\D/g, '');
                    setFormData({...formData, phone: onlyNumbers});
                    setErrors({...errors, phone: validatePhone(onlyNumbers)});
                  }}
                  maxLength="10"
                />
              </div>
              {errors.phone && <span className="auth-error-text">{errors.phone}</span>}
            </div>

            <div className="auth-form-group">
              <label className="auth-label">Email Address</label>
              <div className="auth-input-wrapper">
                <Mail className="auth-input-icon" size={18} />
                <input 
                  type="email" placeholder="name@example.com" 
                  className={`auth-input ${errors.email ? 'error' : ''}`}
                  value={formData.email} 
                  onChange={e => {
                    setFormData({...formData, email: e.target.value});
                    setErrors({...errors, email: validateEmail(e.target.value)});
                  }}
                />
              </div>
              {errors.email && <span className="auth-error-text">{errors.email}</span>}
            </div>

            <div className="auth-form-group">
              <label className="auth-label">Create Password</label>
              <div className="auth-input-wrapper">
                <Lock className="auth-input-icon" size={18} />
                <input 
                  type={showPassword ? "text" : "password"} placeholder="Minimum 6 characters" 
                  className={`auth-input ${errors.password ? 'error' : ''}`}
                  value={formData.password} 
                  onChange={e => {
                    setFormData({...formData, password: e.target.value});
                    setErrors({...errors, password: validatePassword(e.target.value)});
                  }}
                />
                <button 
                  type="button" className="auth-password-toggle"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
              {errors.password && <span className="auth-error-text">{errors.password}</span>}
            </div>

            <button 
              type="button" 
              className="auth-btn-primary" 
              onClick={() => setStep(2)} 
              disabled={!canProceedStep1()}
              style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}
            >
              <span>Next: Vehicle Details</span>
              <ChevronRight size={18} />
            </button>
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
