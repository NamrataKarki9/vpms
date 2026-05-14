import React, { useState } from 'react';

function InventoryManager({ inventory, onNavigate, onAddPart }) {

  return (
    <div className="staff-card">
      <div className="staff-card-header">
        <div className="staff-card-title">Inventory & Stock Control</div>
        <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
          <button onClick={() => onNavigate('view-all-inventory')} className="btn-view-customer">View All</button>
          <button onClick={onAddPart} className="btn-view-customer" style={{ background: '#DBEAFE', color: '#1D4ED8' }}>
            + New Part
          </button>
          <button onClick={() => onNavigate('manage-inventory')} className="btn-view-customer" style={{ background: '#1E293B', color: '#fff' }}>
            + Purchase
          </button>
        </div>
      </div>

      <div className="staff-card-body">
        <table className="staff-table">
          <thead>
            <tr>
              <th>Part Name</th>
              <th>Vendor</th>
              <th>Stock</th>
              <th>Price</th>
            </tr>
          </thead>
          <tbody>
            {(inventory || []).slice(0, 5).map(p => (
              <tr key={p.id}>
                <td><div style={{ fontWeight: 600, fontSize: '13px' }}>{p.name}</div></td>
                <td><div style={{ fontSize: '12px', color: '#64748B' }}>{p.vendorName || p.vendor || 'Unknown Vendor'}</div></td>
                <td>
                   <span className={`badge-pill ${p.stock < 10 ? 'badge-overdue' : 'badge-paid'}`} style={{ minWidth: '40px', textAlign: 'center' }}>
                     {p.stock}
                   </span>
                </td>
                <td><strong style={{ fontSize: '13px' }}>Rs. {p.price.toLocaleString()}</strong></td>
              </tr>
            ))}
            {(inventory || []).length === 0 && (
              <tr><td colSpan="4" style={{ padding: '24px', textAlign: 'center', color: '#64748B' }}>No parts registered.</td></tr>
            )}
          </tbody>
        </table>
        {(inventory || []).length > 5 && (
           <div style={{ padding: '12px', textAlign: 'center', fontSize: '11px', color: '#94A3B8', borderTop: '1px solid #F1F5F9' }}>
             + {inventory.length - 5} more items in database.
           </div>
        )}
      </div>
    </div>
  );
}

export default InventoryManager;
