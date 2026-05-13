import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { apiFetch } from '../../services/api';
import { ArrowLeft } from 'lucide-react';

const CustomerDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [customer, setCustomer] = useState(null);
  const [vehicles, setVehicles] = useState([]);
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadData = async () => {
      try {
        const [custRes, vehiclesRes, historyRes] = await Promise.all([
          apiFetch(`/Customers/${id}`),
          apiFetch(`/Customers/${id}/vehicles`),
          apiFetch(`/Customers/${id}/history`),
        ]);
        setCustomer(custRes);
        setVehicles(vehiclesRes || []);
        setHistory(historyRes || []);
      } catch (err) {
        console.error('Failed to load customer details:', err);
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, [id]);

  if (loading) return <div style={{ padding: '40px', textAlign: 'center' }}>Loading...</div>;
  if (!customer) return <div style={{ padding: '40px', textAlign: 'center' }}>Customer not found</div>;

  return (
    <div>
      <button 
        onClick={() => navigate('/staff/customers')} 
        className="nav-link" 
        style={{ display: 'inline-flex', marginBottom: '20px', background: 'none', padding: 0 }}
      >
        <ArrowLeft size={16} />
        <span>Back to Directory</span>
      </button>

      <div className="staff-card" style={{ padding: '24px' }}>
        <h2 style={{ marginBottom: '8px' }}>{customer.name}</h2>
        <p style={{ color: '#64748b', fontSize: '13px' }}>{customer.email} | {customer.phoneNumber}</p>
        
        <div style={{ marginTop: '32px' }}>
          <h3 style={{ fontSize: '14px', borderBottom: '1px solid #EEE', paddingBottom: '8px', marginBottom: '16px' }}>Registered Vehicles</h3>
          <table className="staff-table">
            <thead>
              <tr>
                <th>Make/Model</th>
                <th>Plate Number</th>
                <th>Year</th>
                <th>Fuel</th>
              </tr>
            </thead>
            <tbody>
              {vehicles.map(v => (
                <tr key={v.id}>
                  <td><strong>{v.make} {v.model}</strong></td>
                  <td><span className="badge-pill" style={{ background: '#E6F1FB', color: '#185FA5' }}>{v.plateNumber}</span></td>
                  <td>{v.year}</td>
                  <td>{v.fuelType}</td>
                </tr>
              ))}
              {vehicles.length === 0 && (
                <tr><td colSpan="4" style={{ textAlign: 'center', opacity: 0.5 }}>No vehicles registered.</td></tr>
              )}
            </tbody>
          </table>
        </div>

        <div style={{ marginTop: '32px' }}>
          <h3 style={{ fontSize: '14px', borderBottom: '1px solid #EEE', paddingBottom: '8px', marginBottom: '16px' }}>Purchase History</h3>
          <table className="staff-table">
            <thead>
              <tr>
                <th>Invoice #</th>
                <th>Date</th>
                <th>Amount</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {history.map(inv => (
                <tr key={inv.id}>
                  <td><strong>#{inv.id}</strong></td>
                  <td>{new Date(inv.date).toLocaleDateString()}</td>
                  <td><strong>Rs. {inv.totalAmount.toFixed(2)}</strong></td>
                  <td>
                    <span className="badge-pill" style={{ background: inv.paymentStatus === 'full-payment' ? '#EAF3DE' : '#FAEEDA', color: inv.paymentStatus === 'full-payment' ? '#3B6D11' : '#854F0B' }}>
                      {inv.paymentStatus === 'full-payment' ? 'Paid' : 'Partial'}
                    </span>
                  </td>
                </tr>
              ))}
              {history.length === 0 && (
                <tr><td colSpan="4" style={{ textAlign: 'center', opacity: 0.5 }}>No purchases recorded.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default CustomerDetail;
