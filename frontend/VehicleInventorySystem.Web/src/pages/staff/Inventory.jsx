import React, { useState } from 'react';
import { Search, Package } from 'lucide-react';

const Inventory = ({ parts = [] }) => {
  const [search, setSearch] = useState('');
  const filtered = parts.filter(p =>
    (p.name || '').toLowerCase().includes(search.toLowerCase()) ||
    (p.partCode || '').toLowerCase().includes(search.toLowerCase())
  );

  const lowStock = parts.filter(p => p.stock < 10).length;
  const totalValue = parts.reduce((sum, p) => sum + (p.price * p.stock), 0);

  return (
    <div>
      {/* Page Header */}
      <div className="page-section-header" style={{ marginBottom: '24px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', position: 'relative' }}>
          <div>
            <h2>Parts Inventory</h2>
            <p>{parts.length} parts in catalogue</p>
          </div>
          <div style={{ display: 'flex', gap: '12px' }}>
            {[
              { label: 'Total Parts', value: parts.length },
              { label: 'Low Stock', value: lowStock },
              { label: 'Stock Value', value: `Rs. ${(totalValue / 1000).toFixed(1)}k` },
            ].map((s, i) => (
              <div key={i} style={{ background: 'rgba(255,255,255,0.15)', borderRadius: '10px', padding: '10px 16px', textAlign: 'center', backdropFilter: 'blur(4px)' }}>
                <div style={{ fontSize: '18px', fontWeight: 800, color: '#fff' }}>{s.value}</div>
                <div style={{ fontSize: '10px', color: 'rgba(255,255,255,0.65)', marginTop: '2px' }}>{s.label}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="staff-card">
        <div className="staff-card-header">
          <span className="staff-card-title">All Parts</span>
          <div style={{ position: 'relative' }}>
            <Search size={14} color="#94A3B8" style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)' }} />
            <input
              type="text"
              placeholder="Search part or code..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="search-input-field"
              style={{ paddingLeft: '32px', width: '220px' }}
            />
          </div>
        </div>
        <table className="staff-table">
          <thead>
            <tr>
              <th>Part Name</th>
              <th>Code</th>
              <th>Vendor</th>
              <th>Stock Level</th>
              <th>Unit Price</th>
              <th>Stock Value</th>
            </tr>
          </thead>
          <tbody>
            {parts.map(p => (
              <tr key={p.id}>
                <td><strong>{p.name}</strong></td>
                <td><code style={{ fontSize: '11px', color: '#666' }}>{p.partCode || `P-${p.id}`}</code></td>
                <td>{p.vendorName || p.vendor || 'Unknown Vendor'}</td>
                <td>
                  <span className="badge-pill" style={{ background: p.stock < 10 ? '#FCEBEB' : '#EAF3DE', color: p.stock < 10 ? '#A32D2D' : '#3B6D11' }}>
                    {p.stock} units
                  </span>
                </td>
                <td>Rs. {p.price?.toFixed(2)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default Inventory;
