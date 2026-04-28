import React, { useState } from 'react';
import Dialog from '../Dialog';

function StaffManager({ userRole, staffList, onNavigate, onRemove, onUpdate }) {
  const isAdmin = userRole === 'Admin';
  const [editingId, setEditingId] = useState(null);
  const [editData, setEditData] = useState({ name: '', email: '', password: '' });
  const [errors, setErrors] = useState({});
  
  // Dialog states
  const [removeDialog, setRemoveDialog] = useState({ isOpen: false, staffId: null, staffName: '' });
  const [successDialog, setSuccessDialog] = useState({ isOpen: false, message: '' });
  const [errorDialog, setErrorDialog] = useState({ isOpen: false, message: '' });
  const [isLoading, setIsLoading] = useState(false);

  // Validation function
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
    
    // Validate password only if provided
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
    const staff = staffList.find(s => s.id === id);
    setRemoveDialog({ isOpen: true, staffId: id, staffName: staff?.name || 'Unknown' });
  };

  const handleConfirmRemove = async () => {
    setIsLoading(true);
    try {
      await onRemove(removeDialog.staffId);
      setRemoveDialog({ isOpen: false, staffId: null, staffName: '' });
      setSuccessDialog({ 
        isOpen: true, 
        message: `${removeDialog.staffName} has been successfully removed from the system.` 
      });
    } catch (error) {
      setErrorDialog({ 
        isOpen: true, 
        message: error.message || 'Failed to remove staff member. Please try again.' 
      });
    } finally {
      setIsLoading(false);
    }
  };

  const startEdit = (s) => {
    setEditingId(s.id);
    setEditData({ name: s.name, email: s.email, password: '' });
    setErrors({});
  };

  const handleSave = async (id) => {
    if (!validateForm()) {
      return;
    }

    setIsLoading(true);
    try {
      await onUpdate(id, editData);
      setEditingId(null);
      setErrors({});
      setErrorDialog({ isOpen: false, message: '' });
      setSuccessDialog({ 
        isOpen: true, 
        message: `Staff member ${editData.name} has been updated successfully.` 
      });
    } catch (error) {
      // Extract error message from API response
      const errorMessage = error.message || 'Failed to update staff member';
      
      // Check if error is about password field
      if (errorMessage.toLowerCase().includes('password')) {
        setErrors({ ...errors, password: errorMessage });
      } else if (errorMessage.toLowerCase().includes('email')) {
        setErrors({ ...errors, email: errorMessage });
      } else if (errorMessage.toLowerCase().includes('name')) {
        setErrors({ ...errors, name: errorMessage });
      } else {
        // Show generic error dialog for other errors
        setErrorDialog({ 
          isOpen: true, 
          message: errorMessage
        });
      }
    } finally {
      setIsLoading(false);
    }
  };

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

      <div className="data-list">
        {staffList.slice(0, 5).map(s => (
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
                    disabled={isLoading}
                  >
                    {isLoading ? 'Saving...' : 'Save Changes'}
                  </button>
                  <button 
                    onClick={() => {
                      setEditingId(null);
                      setErrors({});
                    }} 
                    className="btn-small" 
                    style={{ background: '#e2e8f0', color: '#0f172a', padding: '0.5rem 1rem', fontWeight: '500', cursor: 'pointer' }}
                    disabled={isLoading}
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
                        Remove
                      </button>
                    </>
                  )}
                </div>
              </>
            )}
          </div>
        ))}
      </div>

      {/* Remove Confirmation Dialog */}
      <Dialog
        isOpen={removeDialog.isOpen}
        title="Remove Staff Member"
        message={`Are you sure you want to remove ${removeDialog.staffName} from the system? This action cannot be undone.`}
        type="confirm"
        confirmText="Remove"
        cancelText="Cancel"
        onConfirm={handleConfirmRemove}
        onCancel={() => setRemoveDialog({ isOpen: false, staffId: null, staffName: '' })}
        isLoading={isLoading}
      />

      {/* Success Dialog */}
      <Dialog
        isOpen={successDialog.isOpen}
        title="Success"
        message={successDialog.message}
        type="success"
        confirmText="Done"
        onConfirm={() => setSuccessDialog({ isOpen: false, message: '' })}
      />

      {/* Error Dialog */}
      <Dialog
        isOpen={errorDialog.isOpen}
        title="Error"
        message={errorDialog.message}
        type="error"
        confirmText="Close"
        onConfirm={() => setErrorDialog({ isOpen: false, message: '' })}
      />
    </div>
  );
}

export default StaffManager;
