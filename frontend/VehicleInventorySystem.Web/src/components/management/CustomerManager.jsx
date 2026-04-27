import React, { useState } from 'react';

function CustomerManager({ customers, onNavigate }) {


  return (
    <div className="management-card">
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1.5rem', alignItems: 'center' }}>
        <div>
          <h3 style={{ margin: 0 }}>Customer Database</h3>
          <p style={{ fontSize: '0.85rem', opacity: 0.6, margin: 0 }}>Overview of registered customers.</p>
        </div>
        <button onClick={() => onNavigate('manage-customers')} className="btn-small" style={{ background: '#f1f5f9', color: '#0f172a' }}>View All</button>
      </div>

      <div className="data-list">
        {customers.length === 0 ? (
          <p style={{ opacity: 0.5, textAlign: 'center', padding: '2rem' }}>No customers registered yet.</p>
        ) : (
          customers.slice(0, 5).map(c => (
            <div key={c.id} className="list-item" style={{ flexDirection: 'column', alignItems: 'flex-start', gap: '1rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', width: '100%', alignItems: 'center' }}>
              <div>
                <strong style={{ fontSize: '1.1rem', color: 'var(--primary)' }}>{c.name}</strong>
                <div style={{ fontSize: '0.85rem' }}>
                  <span style={{ opacity: 0.6 }}>Vehicle: </span>{c.plate}
                </div>
                <div style={{ fontSize: '0.85rem' }}>
                  <span style={{ opacity: 0.6 }}>Total Spend: </span>Rs. {c.spend?.toFixed(2) || '0.00'}
                </div>
              </div>
            </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

export default CustomerManager;
