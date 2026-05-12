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
  const [loading, setLoading] = useState(false);
  const [staff, setStaff] = useState([]);
  const [initialLoading, setInitialLoading] = useState(true);
  const [loadError, setLoadError] = useState(null);

  const [removeDialog, setRemoveDialog] = useState({ isOpen: false, staffId: null, staffName: '' });
  const [isRemoving, setIsRemoving] = useState(false);
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

  const validateEmail = (email) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const validateForm = () => {
    const newErrors = {};

    if (!editData.name || editData.name.trim().length < 2) {
      newErrors.name = 'Name must be at least 2 characters';
    }

    if (!editData.email) {
      newErrors.email = 'Email is required';
    } else if (!validateEmail(editData.email)) {
      newErrors.email = 'Invalid email format';
    }

    if (editData.password && editData.password.trim().length > 0) {
      if (editData.password.trim().length < 8) {
        newErrors.password = 'Password must be at least 8 characters';
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleRemoveClick = (id) => {
    if (!isAdmin) return;
    const found = displayStaff.find(s => s.id === id);
    setRemoveDialog({ isOpen: true, staffId: id, staffName: found?.name || 'Unknown' });
  };

  const handleConfirmRemove = async () => {
    setIsRemoving(true);
    try {
      await authApi.toggleUserStatus(removeDialog.staffId);
      setStaff(prev => prev.filter(s => s.id !== removeDialog.staffId));
      setRemoveDialog({ isOpen: false, staffId: null, staffName: '' });
      showToast('success', `${removeDialog.staffName} has been deactivated successfully.`);
    } catch (error) {
      showToast('error', error.message || 'Failed to deactivate staff member.');
      setRemoveDialog({ isOpen: false, staffId: null, staffName: '' });
    } finally {
      setIsRemoving(false);
    }
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
      setErrors({});
      showToast('success', 'User updated successfully.');
    } catch (error) {
      const msg = error.message || 'Failed to update staff member';
      if (msg.toLowerCase().includes('password')) {
        setErrors(prev => ({ ...prev, password: msg }));
      } else if (msg.toLowerCase().includes('email')) {
        setErrors(prev => ({ ...prev, email: msg }));
      } else if (msg.toLowerCase().includes('name')) {
        setErrors(prev => ({ ...prev, name: msg }));
      } else {
        showToast('error', msg);
      }
    } finally {
      setIsSaving(false);
    }
  };

  if (initialLoading) {
    return (
      <div className="management-card">
        <h3>Staff Management</h3>
        <p style={{ opacity: 0.6, textAlign: 'center', padding: '2rem' }}>Loading staff...</p>
      </div>
    );
  }

  if (loadError && displayStaff.length === 0) {
    return (
      <div className="management-card">
        <h3>Staff Management</h3>
        <p style={{ color: '#ef4444', textAlign: 'center', padding: '1rem' }}>{loadError}</p>
        <button onClick={loadStaff} className="btn-small" style={{ display: 'block', margin: '0 auto' }}>Retry</button>
      </div>
    );
  }

  return (
    <div className="management-card">
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1rem' }}>
        <h3>Staff Management</h3>
        <div style={{ display: 'flex', gap: '8px' }}>
          <button onClick={() => onNavigate('view-all-staff')} className="btn-small" style={{ background: '#f1f5f9', color: '#0f172a' }}>View All</button>
          {isAdmin && (
            <button onClick={() => onNavigate('add-staff')} className="btn-small">
              + Add Staff
            </button>
          )}
        </div>
      </div>

      {displayStaff.length === 0 ? (
        <p style={{ opacity: 0.5, textAlign: 'center', padding: '2rem' }}>No staff members found. Add one to get started.</p>
      ) : (
        <div className="data-list">
          {displayStaff.slice(0, 5).map(s => (
            <div key={s.id} className="list-item" style={{
              flexDirection: editingId === s.id ? 'column' : 'row',
              alignItems: editingId === s.id ? 'stretch' : 'center',
              gap: '1rem',
              flexWrap: 'wrap'
            }}>
              {editingId === s.id ? (
                <div className="mini-form" style={{ padding: 0, margin: 0, background: 'none', width: '100%' }}>
                  <div>
                    <input
                      type="text"
                      value={editData.name}
                      onChange={e => setEditData({...editData, name: e.target.value})}
                      placeholder="Full Name"
                      style={{ borderColor: errors.name ? '#ef4444' : undefined }}
                    />
                    {errors.name && <div style={{ color: '#ef4444', fontSize: '0.8rem', marginTop: '0.25rem' }}>{errors.name}</div>}
                  </div>
                  <div>
                    <input
                      type="email"
                      value={editData.email}
                      onChange={e => setEditData({...editData, email: e.target.value})}
                      placeholder="Email"
                      style={{ borderColor: errors.email ? '#ef4444' : undefined }}
                    />
                    {errors.email && <div style={{ color: '#ef4444', fontSize: '0.8rem', marginTop: '0.25rem' }}>{errors.email}</div>}
                  </div>
                  <div>
                    <input
                      type="password"
                      value={editData.password}
                      onChange={e => setEditData({...editData, password: e.target.value})}
                      placeholder="New Password (leave blank to keep current)"
                      style={{ borderColor: errors.password ? '#ef4444' : undefined }}
                    />
                    {errors.password ? (
                      <div style={{ color: '#ef4444', fontSize: '0.8rem', marginTop: '0.25rem' }}>{errors.password}</div>
                    ) : (
                      <div style={{ color: '#64748b', fontSize: '0.75rem', marginTop: '0.25rem', fontStyle: 'italic' }}>
                        Leave blank if you don't want to change the password
                      </div>
                    )}
                  </div>
                  <div style={{ display: 'flex', gap: '8px', marginTop: '1rem', justifyContent: 'flex-end' }}>
                    <button
                      onClick={() => handleSave(s.id)}
                      className="btn-small"
                      style={{ background: '#10b981', color: 'white', padding: '0.5rem 1rem', fontWeight: '500', cursor: 'pointer' }}
                      disabled={isSaving}
                    >
                      {isSaving ? 'Saving...' : 'Save Changes'}
                    </button>
                    <button
                      onClick={() => { setEditingId(null); setErrors({}); }}
                      className="btn-small"
                      style={{ background: '#e2e8f0', color: '#0f172a', padding: '0.5rem 1rem', fontWeight: '500', cursor: 'pointer' }}
                      disabled={isSaving}
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              ) : (
                <>
                  <div style={{ flex: '1', minWidth: '150px', overflow: 'hidden' }}>
                    <strong style={{ display: 'block', textOverflow: 'ellipsis', overflow: 'hidden', whiteSpace: 'nowrap' }}>{s.name}</strong>
                    <div style={{ fontSize: '0.8rem', opacity: 0.6, textOverflow: 'ellipsis', overflow: 'hidden', whiteSpace: 'nowrap' }}>{s.email}</div>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap', justifyContent: 'flex-end' }}>
                    <span className="badge" style={{ fontSize: '0.65rem' }}>{s.role}</span>
                    {isAdmin && (
                      <>
                        <button
                          onClick={() => startEdit(s)}
                          className="btn-small"
                          style={{ background: 'rgba(79, 70, 229, 0.1)', color: '#000000', border: '1px solid var(--primary)' }}
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => handleRemoveClick(s.id)}
                          className="btn-small"
                          style={{ background: 'rgba(255, 68, 68, 0.1)', color: '#ff4444', border: '1px solid #ff4444' }}
                        >
                          Deactivate
                        </button>
                      </>
                    )}
                  </div>
                </>
              )}
            </div>
          ))}
        </div>
      )}

      <Dialog
        isOpen={removeDialog.isOpen}
        title="Deactivate Staff Member"
        message={`Are you sure you want to deactivate ${removeDialog.staffName}? They will no longer be able to access the system.`}
        type="confirm"
        confirmText="Deactivate"
        cancelText="Cancel"
        onConfirm={handleConfirmRemove}
        onCancel={() => setRemoveDialog({ isOpen: false, staffId: null, staffName: '' })}
        isLoading={isRemoving}
      />
    </div>
  );
}

export default StaffManager;
