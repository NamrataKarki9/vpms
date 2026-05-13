import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { apiFetch } from '../../services/api';
import { ArrowLeft, Car, ShoppingBag, Mail, Phone } from 'lucide-react';

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

  if (loading) return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '60vh', gap: '16px', flexDirection: 'column' }}>
      <div className="spinner" />
      <span style={{ color: '#64748B', fontSize: '14px' }}>Loading customer profile...</span>
    </div>
  );

  if (!customer) return (
    <div className="empty-state" style={{ paddingTop: '80px' }}>
      <div className="empty-state-icon">👤</div>
      <h4>Customer Not Found</h4>
      <p>Customer #{id} could not be located.</p>
      <button onClick={() => navigate('/staff/customers')} style={{ marginTop: '16px', background: '#1E3A5F', color: '#fff', border: 'none', padding: '10px 24px', borderRadius: '8px', cursor: 'pointer', fontWeight: 600 }}>
        Back to Directory
      </button>
    </div>
  );

  const initials = (customer.name || 'U').split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase();
  const totalSpent = history.reduce((sum, inv) => sum + (inv.totalAmount || 0), 0);

  return (
    <div>
      <button
        onClick={() => navigate('/staff/customers')}
        style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', background: 'none', border: 'none', color: '#64748B', cursor: 'pointer', fontSize: '14px', marginBottom: '20px', fontWeight: 500 }}
      >
        <ArrowLeft size={16} /> Back to Directory
      </button>

      {/* Profile Hero */}
      <div style={{ background: 'linear-gradient(135deg, #1E3A5F 0%, #2563A8 100%)', borderRadius: '14px', padding: '32px', marginBottom: '20px', color: '#fff', position: 'relative', overflow: 'hidden' }}>
        <div style={{ position: 'absolute', top: '-40px', right: '-40px', width: '180px', height: '180px', borderRadius: '50%', background: 'rgba(255,255,255,0.06)' }} />
        <div style={{ display: 'flex', alignItems: 'center', gap: '20px', position: 'relative' }}>
          <div style={{ width: 70, height: 70, borderRadius: '50%', background: 'rgba(255,255,255,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '24px', fontWeight: 800, border: '3px solid rgba(255,255,255,0.3)', backdropFilter: 'blur(4px)', flexShrink: 0 }}>
            {initials}
          </div>
          <div style={{ flex: 1 }}>
            <h2 style={{ color: '#fff', fontSize: '22px', fontWeight: 800, marginBottom: '6px' }}>{customer.name}</h2>
            <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap' }}>
              {customer.email && (
                <span style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '13px', color: 'rgba(255,255,255,0.75)' }}>
                  <Mail size={13} /> {customer.email}
                </span>
              )}
              {customer.phoneNumber && (
                <span style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '13px', color: 'rgba(255,255,255,0.75)' }}>
                  <Phone size={13} /> {customer.phoneNumber}
                </span>
              )}
            </div>
          </div>
          {/* Stats */}
          <div style={{ display: 'flex', gap: '20px' }}>
            {[
              { label: 'Vehicles', value: vehicles.length },
              { label: 'Invoices', value: history.length },
              { label: 'Total Spent', value: `Rs. ${totalSpent.toLocaleString()}` },
            ].map((s, i) => (
              <div key={i} style={{ background: 'rgba(255,255,255,0.12)', borderRadius: '10px', padding: '12px 18px', textAlign: 'center', backdropFilter: 'blur(4px)' }}>
                <div style={{ fontSize: '20px', fontWeight: 800, color: '#fff' }}>{s.value}</div>
                <div style={{ fontSize: '11px', color: 'rgba(255,255,255,0.65)', marginTop: '2px' }}>{s.label}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
        {/* Vehicles */}
        <div className="staff-card">
          <div className="staff-card-header">
            <span className="staff-card-title">Registered Vehicles</span>
            <Car size={16} color="#64748B" />
          </div>
          <table className="staff-table">
            <thead>
              <tr>
                <th>Make / Model</th>
                <th>Plate</th>
                <th>Year</th>
                <th>Fuel</th>
              </tr>
            </thead>
            <tbody>
              {vehicles.map(v => (
                <tr key={v.id}>
                  <td><strong>{v.make} {v.model}</strong></td>
                  <td>
                    <span style={{ background: '#EBF2FB', color: '#1E3A5F', padding: '3px 9px', borderRadius: '6px', fontSize: '11px', fontWeight: 700, letterSpacing: '0.5px' }}>
                      {v.plateNumber}
                    </span>
                  </td>
                  <td style={{ color: '#64748B' }}>{v.year}</td>
                  <td style={{ color: '#64748B' }}>{v.fuelType || '—'}</td>
                </tr>
              ))}
              {vehicles.length === 0 && (
                <tr><td colSpan="4">
                  <div className="empty-state" style={{ padding: '32px' }}>
                    <div className="empty-state-icon">🚗</div>
                    <h4>No Vehicles</h4>
                    <p>No vehicles registered.</p>
                  </div>
                </td></tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Purchase History */}
        <div className="staff-card">
          <div className="staff-card-header">
            <span className="staff-card-title">Purchase History</span>
            <ShoppingBag size={16} color="#64748B" />
          </div>
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
                  <td><strong style={{ color: '#1E3A5F' }}>#{inv.id}</strong></td>
                  <td style={{ color: '#64748B', fontSize: '12px' }}>{new Date(inv.date).toLocaleDateString()}</td>
                  <td><strong>Rs. {inv.totalAmount.toFixed(2)}</strong></td>
                  <td>
                    <span className={`badge-pill ${inv.paymentStatus === 'full-payment' ? 'badge-paid' : 'badge-credit'}`}>
                      {inv.paymentStatus === 'full-payment' ? 'Paid' : 'Credit'}
                    </span>
                  </td>
                </tr>
              ))}
              {history.length === 0 && (
                <tr><td colSpan="4">
                  <div className="empty-state" style={{ padding: '32px' }}>
                    <div className="empty-state-icon">🧾</div>
                    <h4>No Purchases</h4>
                    <p>No purchase history found.</p>
                  </div>
                </td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default CustomerDetail;
