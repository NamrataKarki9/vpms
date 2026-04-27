import React, { useState } from 'react';

function InventoryManager({ inventory, onNavigate }) {

  return (
    <div className="management-card">
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1rem' }}>
        <h3>Inventory & Stock Purchases</h3>
        <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
          <button onClick={() => onNavigate('view-all-inventory')} className="btn-small" style={{ background: '#f1f5f9', color: '#0f172a', border: '1px solid #e2e8f0' }}>View All</button>
          <button onClick={() => onNavigate('add-part')} className="btn-small" style={{ background: '#10b981', color: '#fff' }}>
            + New Part
          </button>
          <button onClick={() => onNavigate('manage-inventory')} className="btn-small" style={{ background: 'var(--primary)', color: '#fff' }}>
            + Purchase
          </button>
        </div>
      </div>

      <div className="data-list">
        {inventory.length === 0 && <p style={{ opacity: 0.5, textAlign: 'center', padding: '1rem' }}>No parts registered yet.</p>}
        {inventory.slice(0, 5).map(p => (
          <div key={p.id} className="list-item">
            <div>
              <strong>{p.name}</strong>
              <div style={{ fontSize: '0.8rem', color: p.stock < 10 ? 'var(--secondary)' : 'inherit' }}>
                 Stock: {p.stock} {p.stock < 10 && '(LOW)'}
              </div>
            </div>
            <span>Rs. {p.price}</span>
          </div>
        ))}
        {inventory.length > 5 && <p style={{ textAlign: 'center', fontSize: '0.8rem', opacity: 0.5, marginTop: '0.5rem' }}>+ {inventory.length - 5} more items in database.</p>}
      </div>


    </div>
  );
}

export default InventoryManager;
