import React, { useState } from 'react';

function StaffManager({ userRole, staffList, onNavigate, onRemove, onUpdate }) {
  const isAdmin = userRole === 'Admin';
  const [editingId, setEditingId] = useState(null);
  const [editData, setEditData] = useState({ name: '', email: '', password: '' });

  const handleRemove = (id) => {
    if (!isAdmin) return;
    if (window.confirm('Are you sure you want to remove this staff member?')) {
      onRemove(id);
    }
  };

  const startEdit = (s) => {
    setEditingId(s.id);
    setEditData({ name: s.name, email: s.email, password: s.password || '' });
  };

  const handleSave = async (id) => {
    await onUpdate(id, editData);
    setEditingId(null);
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
              <div className="mini-form" style={{ padding: 0, margin: 0, background: 'none' }}>
                <input type="text" value={editData.name} onChange={e => setEditData({...editData, name: e.target.value})} placeholder="Full Name" />
                <input type="email" value={editData.email} onChange={e => setEditData({...editData, email: e.target.value})} placeholder="Email" />
                <input type="password" value={editData.password} onChange={e => setEditData({...editData, password: e.target.value})} placeholder="New Password (optional)" />
                <div style={{ display: 'flex', gap: '8px' }}>
                  <button onClick={() => handleSave(s.id)} className="btn-small" style={{ background: 'var(--success)' }}>Save</button>
                  <button onClick={() => setEditingId(null)} className="btn-small" style={{ background: '#cbd5e1', color: '#0f172a' }}>Cancel</button>
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
                      <button onClick={() => startEdit(s)} className="btn-small" style={{ background: 'rgba(79, 70, 229, 0.1)', color: 'var(--primary)', border: '1px solid var(--primary)' }}>Edit</button>
                      <button 
                        onClick={() => handleRemove(s.id)} 
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
    </div>
  );
}

export default StaffManager;
