import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { apiFetch } from '../../services/api';
import { ArrowLeft, Car, ShoppingBag, Mail, Phone, Edit2, Trash2, CheckCircle } from 'lucide-react';

const CustomerDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [customer, setCustomer] = useState(null);
  const [vehicles, setVehicles] = useState([]);
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [successDialog, setSuccessDialog] = useState({ isOpen: false, message: '' });
  const [editFormData, setEditFormData] = useState({ name: '', email: '', phoneNumber: '' });
  const [editVehicleData, setEditVehicleData] = useState({ plateNumber: '', make: '', model: '', year: '', fuelType: '', mileage: '' });
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    const loadData = async () => {
      try {
        const [custRes, vehiclesRes, historyRes] = await Promise.all([
          apiFetch(`/Customers/${id}`),
          apiFetch(`/Customers/${id}/vehicles`),
          apiFetch(`/Customers/${id}/history`),
        ]);
        setCustomer(custRes);
        setEditFormData({ name: custRes.name, email: custRes.email, phoneNumber: custRes.phoneNumber });
        setVehicles(vehiclesRes || []);
        if (vehiclesRes && vehiclesRes.length > 0) {
          const firstVehicle = vehiclesRes[0];
          setEditVehicleData({
            plateNumber: firstVehicle.plateNumber || '',
            make: firstVehicle.make || '',
            model: firstVehicle.model || '',
            year: firstVehicle.year || '',
            fuelType: firstVehicle.fuelType || '',
            mileage: firstVehicle.mileage || ''
          });
        }
        setHistory(historyRes || []);
      } catch (err) {
        console.error('Failed to load customer details:', err);
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, [id]);

  const handleEditClick = () => {
    setEditFormData({ name: customer.name, email: customer.email, phoneNumber: customer.phoneNumber });
    setIsEditModalOpen(true);
  };

  const handleEditFormChange = (e) => {
    const { name, value } = e.target;
    if (['plateNumber', 'make', 'model', 'year', 'fuelType', 'mileage'].includes(name)) {
      setEditVehicleData(prev => ({ ...prev, [name]: value }));
    } else {
      setEditFormData(prev => ({ ...prev, [name]: value }));
    }
  };

  const handleEditSubmit = async (e) => {
    e.preventDefault();
    if (!editFormData.name.trim() || !editFormData.email.trim() || !editFormData.phoneNumber.trim()) {
      alert('Please fill in all customer fields');
      return;
    }

    setIsSubmitting(true);
    try {
      // Update customer info
      const response = await apiFetch(`/Users/${id}`, {
        method: 'PUT',
        body: JSON.stringify(editFormData)
      });
      setCustomer(prev => ({ ...prev, ...editFormData }));

      // Update vehicle info if vehicle exists
      if (vehicles.length > 0) {
        const firstVehicleId = vehicles[0].id;
        await apiFetch(`/Customers/${id}/vehicles/${firstVehicleId}`, {
          method: 'PUT',
          body: JSON.stringify({
            plateNumber: editVehicleData.plateNumber,
            make: editVehicleData.make,
            model: editVehicleData.model,
            year: editVehicleData.year,
            fuelType: editVehicleData.fuelType,
            mileage: editVehicleData.mileage
          })
        });
        setVehicles(prev => [
          { ...prev[0], ...editVehicleData },
          ...prev.slice(1)
        ]);
      }

      setIsEditModalOpen(false);
      setSuccessDialog({ isOpen: true, message: 'Customer and vehicle information updated successfully' });
    } catch (err) {
      console.error('Failed to update customer:', err);
      alert('Failed to update: ' + err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteClick = () => {
    setIsDeleteDialogOpen(true);
  };

  const handleDeleteConfirm = async () => {
    setIsSubmitting(true);
    try {
      await apiFetch(`/users/${id}/status`, {
        method: 'PATCH'
      });
      setSuccessDialog({ isOpen: true, message: 'Customer deleted successfully. Redirecting...' });
      setTimeout(() => {
        navigate('/staff/customers');
      }, 1500);
    } catch (err) {
      console.error('Failed to delete customer:', err);
      alert('Failed to delete customer: ' + err.message);
    } finally {
      setIsSubmitting(false);
      setIsDeleteDialogOpen(false);
    }
  };

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
          {/* Action Buttons */}
          <div style={{ display: 'flex', gap: '10px', flexShrink: 0 }}>
            <button
              onClick={handleEditClick}
              style={{ display: 'flex', alignItems: 'center', gap: '6px', background: 'rgba(255,255,255,0.2)', color: '#fff', border: '1px solid rgba(255,255,255,0.3)', padding: '8px 14px', borderRadius: '8px', cursor: 'pointer', fontSize: '13px', fontWeight: 600, transition: 'all 0.15s' }}
              onMouseEnter={(e) => { e.target.style.background = 'rgba(255,255,255,0.3)'; }}
              onMouseLeave={(e) => { e.target.style.background = 'rgba(255,255,255,0.2)'; }}
            >
              <Edit2 size={14} /> Edit
            </button>
            <button
              onClick={handleDeleteClick}
              style={{ display: 'flex', alignItems: 'center', gap: '6px', background: 'rgba(239, 68, 68, 0.3)', color: '#FCA5A5', border: '1px solid rgba(239, 68, 68, 0.5)', padding: '8px 14px', borderRadius: '8px', cursor: 'pointer', fontSize: '13px', fontWeight: 600, transition: 'all 0.15s' }}
              onMouseEnter={(e) => { e.target.style.background = 'rgba(239, 68, 68, 0.4)'; }}
              onMouseLeave={(e) => { e.target.style.background = 'rgba(239, 68, 68, 0.3)'; }}
            >
              <Trash2 size={14} /> Delete
            </button>
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

      {/* Edit Modal */}
      {isEditModalOpen && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
          <div style={{ background: '#fff', borderRadius: '12px', padding: '32px', maxWidth: '500px', width: '90%', boxShadow: '0 10px 40px rgba(0,0,0,0.2)', maxHeight: '90vh', overflowY: 'auto' }}>
            <h3 style={{ fontSize: '18px', fontWeight: 700, color: '#1E293B', marginBottom: '20px' }}>Edit Customer & Vehicle Details</h3>
            <form onSubmit={handleEditSubmit}>
              {/* Customer Section */}
              <div style={{ marginBottom: '24px', paddingBottom: '20px', borderBottom: '1px solid #E2E8F0' }}>
                <h4 style={{ fontSize: '14px', fontWeight: 600, color: '#475569', marginBottom: '12px', textTransform: 'uppercase' }}>Customer Information</h4>
                <div style={{ marginBottom: '16px' }}>
                  <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: '#475569', marginBottom: '6px' }}>Name</label>
                  <input
                    type="text"
                    name="name"
                    value={editFormData.name}
                    onChange={handleEditFormChange}
                    style={{ width: '100%', padding: '10px 12px', border: '1px solid #E2E8F0', borderRadius: '8px', fontSize: '14px', fontFamily: 'inherit', boxSizing: 'border-box' }}
                  />
                </div>
                <div style={{ marginBottom: '16px' }}>
                  <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: '#475569', marginBottom: '6px' }}>Email</label>
                  <input
                    type="email"
                    name="email"
                    value={editFormData.email}
                    onChange={handleEditFormChange}
                    style={{ width: '100%', padding: '10px 12px', border: '1px solid #E2E8F0', borderRadius: '8px', fontSize: '14px', fontFamily: 'inherit', boxSizing: 'border-box' }}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: '#475569', marginBottom: '6px' }}>Phone Number</label>
                  <input
                    type="tel"
                    name="phoneNumber"
                    value={editFormData.phoneNumber}
                    onChange={handleEditFormChange}
                    style={{ width: '100%', padding: '10px 12px', border: '1px solid #E2E8F0', borderRadius: '8px', fontSize: '14px', fontFamily: 'inherit', boxSizing: 'border-box' }}
                  />
                </div>
              </div>

              {/* Vehicle Section */}
              {vehicles.length > 0 && (
                <div style={{ marginBottom: '24px' }}>
                  <h4 style={{ fontSize: '14px', fontWeight: 600, color: '#475569', marginBottom: '12px', textTransform: 'uppercase' }}>Primary Vehicle</h4>
                  <div style={{ marginBottom: '16px' }}>
                    <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: '#475569', marginBottom: '6px' }}>Plate Number</label>
                    <input
                      type="text"
                      name="plateNumber"
                      value={editVehicleData.plateNumber}
                      onChange={handleEditFormChange}
                      style={{ width: '100%', padding: '10px 12px', border: '1px solid #E2E8F0', borderRadius: '8px', fontSize: '14px', fontFamily: 'inherit', boxSizing: 'border-box' }}
                    />
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '16px' }}>
                    <div>
                      <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: '#475569', marginBottom: '6px' }}>Make</label>
                      <input
                        type="text"
                        name="make"
                        value={editVehicleData.make}
                        onChange={handleEditFormChange}
                        style={{ width: '100%', padding: '10px 12px', border: '1px solid #E2E8F0', borderRadius: '8px', fontSize: '14px', fontFamily: 'inherit', boxSizing: 'border-box' }}
                      />
                    </div>
                    <div>
                      <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: '#475569', marginBottom: '6px' }}>Model</label>
                      <input
                        type="text"
                        name="model"
                        value={editVehicleData.model}
                        onChange={handleEditFormChange}
                        style={{ width: '100%', padding: '10px 12px', border: '1px solid #E2E8F0', borderRadius: '8px', fontSize: '14px', fontFamily: 'inherit', boxSizing: 'border-box' }}
                      />
                    </div>
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '16px' }}>
                    <div>
                      <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: '#475569', marginBottom: '6px' }}>Year</label>
                      <input
                        type="number"
                        name="year"
                        value={editVehicleData.year}
                        onChange={handleEditFormChange}
                        style={{ width: '100%', padding: '10px 12px', border: '1px solid #E2E8F0', borderRadius: '8px', fontSize: '14px', fontFamily: 'inherit', boxSizing: 'border-box' }}
                      />
                    </div>
                    <div>
                      <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: '#475569', marginBottom: '6px' }}>Fuel Type</label>
                      <input
                        type="text"
                        name="fuelType"
                        value={editVehicleData.fuelType}
                        onChange={handleEditFormChange}
                        style={{ width: '100%', padding: '10px 12px', border: '1px solid #E2E8F0', borderRadius: '8px', fontSize: '14px', fontFamily: 'inherit', boxSizing: 'border-box' }}
                      />
                    </div>
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: '#475569', marginBottom: '6px' }}>Mileage (km)</label>
                    <input
                      type="number"
                      name="mileage"
                      value={editVehicleData.mileage}
                      onChange={handleEditFormChange}
                      style={{ width: '100%', padding: '10px 12px', border: '1px solid #E2E8F0', borderRadius: '8px', fontSize: '14px', fontFamily: 'inherit', boxSizing: 'border-box' }}
                    />
                  </div>
                </div>
              )}

              <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end', marginTop: '24px' }}>
                <button
                  type="button"
                  onClick={() => setIsEditModalOpen(false)}
                  style={{ padding: '8px 16px', border: '1px solid #E2E8F0', borderRadius: '8px', background: '#F1F5F9', color: '#475569', cursor: 'pointer', fontSize: '13px', fontWeight: 600 }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  style={{ padding: '8px 16px', borderRadius: '8px', background: '#1E3A5F', color: '#fff', border: 'none', cursor: isSubmitting ? 'not-allowed' : 'pointer', fontSize: '13px', fontWeight: 600, opacity: isSubmitting ? 0.6 : 1 }}
                >
                  {isSubmitting ? 'Saving...' : 'Save Changes'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Dialog */}
      {isDeleteDialogOpen && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
          <div style={{ background: '#fff', borderRadius: '12px', padding: '32px', maxWidth: '400px', width: '90%', boxShadow: '0 10px 40px rgba(0,0,0,0.2)' }}>
            <div style={{ width: '50px', height: '50px', borderRadius: '50%', background: '#FEE2E2', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '16px' }}>
              <Trash2 size={24} color='#DC2626' />
            </div>
            <h3 style={{ fontSize: '18px', fontWeight: 700, color: '#1E293B', marginBottom: '8px' }}>Delete Customer</h3>
            <p style={{ fontSize: '14px', color: '#64748B', marginBottom: '24px' }}>
              Are you sure you want to delete <strong>{customer.name}</strong>? This action cannot be undone.
            </p>
            <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
              <button
                onClick={() => setIsDeleteDialogOpen(false)}
                style={{ padding: '8px 16px', border: '1px solid #E2E8F0', borderRadius: '8px', background: '#F1F5F9', color: '#475569', cursor: 'pointer', fontSize: '13px', fontWeight: 600 }}
              >
                Cancel
              </button>
              <button
                onClick={handleDeleteConfirm}
                disabled={isSubmitting}
                style={{ padding: '8px 16px', borderRadius: '8px', background: '#DC2626', color: '#fff', border: 'none', cursor: isSubmitting ? 'not-allowed' : 'pointer', fontSize: '13px', fontWeight: 600, opacity: isSubmitting ? 0.6 : 1 }}
              >
                {isSubmitting ? 'Deleting...' : 'Delete'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Success Dialog */}
      {successDialog.isOpen && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1001 }}>
          <div style={{ background: '#fff', borderRadius: '12px', padding: '32px', maxWidth: '400px', width: '90%', boxShadow: '0 10px 40px rgba(0,0,0,0.2)', textAlign: 'center' }}>
            <div style={{ width: '60px', height: '60px', borderRadius: '50%', background: '#ECFDF5', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '16px', margin: '0 auto 16px' }}>
              <CheckCircle size={32} color='#10B981' />
            </div>
            <h3 style={{ fontSize: '18px', fontWeight: 700, color: '#1E293B', marginBottom: '8px' }}>Success!</h3>
            <p style={{ fontSize: '14px', color: '#64748B', marginBottom: '24px' }}>
              {successDialog.message}
            </p>
            <button
              onClick={() => setSuccessDialog({ isOpen: false, message: '' })}
              style={{ padding: '10px 24px', borderRadius: '8px', background: '#10B981', color: '#fff', border: 'none', cursor: 'pointer', fontSize: '13px', fontWeight: 600, transition: 'all 0.15s' }}
              onMouseEnter={(e) => { e.target.style.background = '#059669'; }}
              onMouseLeave={(e) => { e.target.style.background = '#10B981'; }}
            >
              OK
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default CustomerDetail;
