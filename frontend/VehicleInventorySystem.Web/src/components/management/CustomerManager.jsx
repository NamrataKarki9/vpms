import React from 'react';

function CustomerManager({ customers, onNavigate }) {

  return (
    <div className="staff-card">
      <div className="staff-card-header">
        <div className="staff-card-title">Customer Database Overview</div>
        <button onClick={() => onNavigate('manage-customers')} className="btn-view-customer">View All</button>
      </div>

      <div className="staff-card-body">
        <table className="staff-table">
          <thead>
            <tr>
              <th>Customer</th>
              <th>Vehicle info</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            {(customers || []).slice(0, 5).map(c => (
              <tr key={c.id}>
                <td>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <div className="avatar-circle" style={{ width: '28px', height: '28px', fontSize: '10px' }}>{(c.name || 'U')[0].toUpperCase()}</div>
                    <div>
                      <div style={{ fontSize: '13px', fontWeight: 600 }}>{c.name}</div>
                      <div style={{ fontSize: '11px', color: '#94A3B8' }}>{c.phone || c.email || 'No contact'}</div>
                    </div>
                  </div>
                </td>
                <td>
                  <div style={{ fontSize: '12px', color: '#64748B' }}>
                    {c.vehicleInfo ? (
                      `${c.vehicleInfo.make} ${c.vehicleInfo.model}`
                    ) : (
                      c.plate || 'N/A'
                    )}
                  </div>
                </td>
                <td>
                  <span className="badge-pill badge-paid" style={{ fontSize: '10px' }}>Active</span>
                </td>
              </tr>
            ))}
            {(customers || []).length === 0 && (
              <tr><td colSpan="3" style={{ padding: '24px', textAlign: 'center', color: '#64748B' }}>No customers registered.</td></tr>
            )}
          </tbody>
        </table>
        {(customers || []).length > 5 && (
           <div style={{ padding: '12px', textAlign: 'center', fontSize: '11px', color: '#94A3B8', borderTop: '1px solid #F1F5F9' }}>
             + {customers.length - 5} more customers in database.
           </div>
        )}
      </div>
    </div>
  );
}

export default CustomerManager;
