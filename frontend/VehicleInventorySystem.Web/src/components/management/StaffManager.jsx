import React, { useState, useEffect } from 'react';
import Dialog from '../Dialog';
import { useToast } from '../../context/ToastContext';
import { authApi } from '../../services/api';

function StaffManager({ userRole, staffList, onNavigate, onRemove, onUpdate }) {
  const showToast = useToast();
  const isAdmin = userRole === 'Admin';
  const [editingId, setEditingId] = useState(null);
  const [editData, setEditData] = useState({ name: '', email: '', password: '' });
  const [errors, setErrors] = useState({});
  const [staff, setStaff] = useState([]);
  const [initialLoading, setInitialLoading] = useState(true);
  const [loadError, setLoadError] = useState(null);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    loadStaff();
  }, []);

  const loadStaff = async () => {
    setInitialLoading(true);
    setLoadError(null);
    try {
      const data = await authApi.getStaff();
      setStaff(Array.isArray(data) ? data : []);
    } catch (err) {
      setLoadError(err.message || 'Failed to load staff.');
      showToast('error', 'Failed to load staff list.');
    } finally {
      setInitialLoading(false);
    }
  };

  const displayStaff = staff.length > 0 ? staff : (staffList || []);

  const validateForm = () => {
    const newErrors = {};
    if (!editData.name || editData.name.trim().length < 2) newErrors.name = 'Name is required';
    if (!editData.email) newErrors.email = 'Email is required';
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const startEdit = (s) => {
    setEditingId(s.id);
    setEditData({ name: s.name, email: s.email, password: '' });
    setErrors({});
  };

  const handleSave = async (id) => {
    if (!validateForm()) return;
    setIsSaving(true);
    try {
      const updated = await authApi.updateUser(id, {
        name: editData.name.trim(),
        email: editData.email.trim(),
        ...(editData.password.trim() ? { password: editData.password.trim() } : {})
      });
      setStaff(prev => prev.map(s => s.id === id ? { ...s, ...updated } : s));
      setEditingId(null);
      showToast('success', 'Staff updated successfully.');
    } catch (error) { showToast('error', 'Update failed.'); }
    finally { setIsSaving(false); }
  };

  return (
    <div className="staff-card">
      <div className="staff-card-header">
        <div className="staff-card-title">Staff Management</div>
        <div style={{ display: 'flex', gap: '8px' }}>
          <button onClick={() => onNavigate('view-all-staff')} className="btn-view-customer">View All</button>
          {isAdmin && (
            <button onClick={() => onNavigate('add-staff')} className="btn-view-customer" style={{ background: '#DBEAFE', color: '#1D4ED8' }}>
              + Add
            </button>
          )}
        </div>
      </div>
      <div className="staff-card-body">
        {initialLoading ? (
          <div style={{ padding: '24px', textAlign: 'center' }}><div className="spinner" style={{ margin: '0 auto' }}></div></div>
        ) : (
          <table className="staff-table">
            <thead>
              <tr>
                <th>Member</th>
                <th>Role</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {displayStaff.slice(0, 5).map(s => (
                <tr key={s.id}>
                  {editingId === s.id ? (
                    <td colSpan="3" style={{ padding: '16px', background: '#F8FAFC' }}>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                        <input className="search-input-field" value={editData.name} onChange={e => setEditData({...editData, name: e.target.value})} placeholder="Name" />
                        <input className="search-input-field" value={editData.email} onChange={e => setEditData({...editData, email: e.target.value})} placeholder="Email" />
                        <div style={{ display: 'flex', gap: '8px' }}>
                          <button onClick={() => handleSave(s.id)} className="btn-view-customer" style={{ background: '#10B981', color: '#fff' }} disabled={isSaving}>Save</button>
                          <button onClick={() => setEditingId(null)} className="btn-view-customer">Cancel</button>
                        </div>
                      </div>
                    </td>
                  ) : (
                    <>
                      <td>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                          <div className="avatar-circle" style={{ width: '28px', height: '28px', fontSize: '10px' }}>{s.name[0].toUpperCase()}</div>
                          <div style={{ fontSize: '13px', fontWeight: 600 }}>{s.name}</div>
                        </div>
                      </td>
                      <td><span className="badge-pill badge-loyalty">{s.role}</span></td>
                      <td>
                        <button onClick={() => startEdit(s)} className="btn-view-customer">Edit</button>
                      </td>
                    </>
                  )}
                </tr>
              ))}
              {displayStaff.length === 0 && !initialLoading && (
                 <tr><td colSpan="3" style={{ padding: '24px', textAlign: 'center', color: '#64748B' }}>No staff members.</td></tr>
              )}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}


export default StaffManager;
