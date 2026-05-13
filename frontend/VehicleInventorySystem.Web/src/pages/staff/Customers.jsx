import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useToast } from '../../context/ToastContext';
import { apiFetch } from '../../services/api';

const Customers = ({ customers = [], onSelectCustomer }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const navigate = useNavigate();

  const filtered = (customers || []).filter(c => 
    (c.name || '').toLowerCase().includes(searchTerm.toLowerCase()) || 
    (c.plate || '').toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="staff-card">
      <div className="staff-card-header">
        <h3 className="staff-card-title">Customer Directory</h3>
        <input 
          type="text" 
          placeholder="Search name or plate..." 
          value={searchTerm} 
          onChange={e => setSearchTerm(e.target.value)} 
          className="search-input-field"
          style={{ width: '200px' }}
        />
      </div>
      <div className="staff-card-body">
        <table className="staff-table">
          <thead>
            <tr>
              <th>Customer Name</th>
              <th>Vehicle</th>
              <th>Plate No.</th>
              <th>Phone</th>
              <th>Action</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map(c => (
              <tr key={c.id}>
                <td><strong>{c.name}</strong></td>
                <td>{c.vehicleInfo ? `${c.vehicleInfo.make} ${c.vehicleInfo.model}` : 'N/A'}</td>
                <td><span className="badge-pill" style={{ background: '#E6F1FB', color: '#185FA5' }}>{c.plate}</span></td>
                <td>{c.phone}</td>
                <td>
                  <button 
                    onClick={() => navigate(`/staff/customers/${c.id}`)} 
                    className="btn-view-customer"
                  >
                    View
                  </button>
                </td>
              </tr>
            ))}
            {filtered.length === 0 && (
              <tr><td colSpan="5" style={{ textAlign: 'center', padding: '2rem', opacity: 0.5 }}>No customers found.</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default Customers;
