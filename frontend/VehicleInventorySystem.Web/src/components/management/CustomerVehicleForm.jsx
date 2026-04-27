import React, { useState } from 'react';

function CustomerVehicleForm({ onRegister }) {
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState({
    name: '', phone: '', email: '', password: '',
    vehicleModel: '', vehicleYear: '', plateNumber: ''
  });
  const [showPassword, setShowPassword] = useState(false);


  const handleSubmit = (e) => {
    e.preventDefault();
    if (onRegister) {
      onRegister({
        name: formData.name,
        plate: formData.plateNumber,
        email: formData.email,
        password: formData.password,
        vehicle: `${formData.vehicleModel} (${formData.vehicleYear})`
      });
    }
    alert(`Success: ${formData.name} registered with vehicle ${formData.plateNumber}`);
    setStep(1);
    setFormData({ name: '', phone: '', email: '', password: '', vehicleModel: '', vehicleYear: '', plateNumber: '' });
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
            <input 
              type="text" placeholder="Customer Name" required 
              value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})}
            />
            <input 
              type="tel" placeholder="Phone Number" required 
              value={formData.phone} onChange={e => setFormData({...formData, phone: e.target.value})}
            />
            <input 
              type="email" placeholder="Email Address" required 
              value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})}
            />
            <div style={{ position: 'relative', width: '100%' }}>
              <input 
                type={showPassword ? "text" : "password"} placeholder="Password" required 
                value={formData.password} onChange={e => setFormData({...formData, password: e.target.value})}
                style={{ width: '100%', marginBottom: 0 }}
              />
              <button type="button" onClick={() => setShowPassword(!showPassword)} style={{ position: 'absolute', right: '10px', top: '12px', background: 'none', border: 'none', color: 'var(--primary)', cursor: 'pointer', padding: 0, boxShadow: 'none' }}>
                {showPassword ? 'Hide' : 'Show'}
              </button>
            </div>
            <button type="button" onClick={() => setStep(2)}>Next: Vehicle Details</button>

          </div>
        ) : (
          <div className="mini-form">
            <h4>Step 2: Vehicle Details</h4>
            <input 
              type="text" placeholder="Vehicle Model (e.g. Toyota Camry)" required 
              value={formData.vehicleModel} onChange={e => setFormData({...formData, vehicleModel: e.target.value})}
            />
            <input 
              type="number" placeholder="Year" required 
              value={formData.vehicleYear} onChange={e => setFormData({...formData, vehicleYear: e.target.value})}
            />
            <input 
              type="text" placeholder="Plate Number" required 
              value={formData.plateNumber} onChange={e => setFormData({...formData, plateNumber: e.target.value})}
            />
            <div style={{ display: 'flex', gap: '10px' }}>
              <button type="button" onClick={() => setStep(1)} style={{ background: '#cbd5e1', color: '#0f172a' }}>Back</button>
              <button type="submit">Complete Registration</button>
            </div>

          </div>
        )}
      </form>
    </div>
  );
}

export default CustomerVehicleForm;
