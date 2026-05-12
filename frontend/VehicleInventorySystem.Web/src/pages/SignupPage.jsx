import React from 'react';
import CustomerVehicleForm from '../components/management/CustomerVehicleForm';

const ROLES = { CUSTOMER: 'Customer' };

export function SignupPage({ onComplete, onBack, onAddCustomer }) {
  return (
    <div style={{ maxWidth: '600px', margin: 'auto' }}>
      <button onClick={onBack} className="btn-small">← Back</button>
      <CustomerVehicleForm onRegister={async (data) => { 
        const savedCustomer = await onAddCustomer(data); 
        if(savedCustomer) onComplete({ ...savedCustomer, role: ROLES.CUSTOMER }); 
      }} />
    </div>
  );
}
