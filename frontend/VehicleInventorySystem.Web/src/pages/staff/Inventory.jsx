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
            {filtered.map(p => {
              const isLow = p.stock < 10;
              const isCritical = p.stock <= 3;
              const stockPct = Math.min((p.stock / 20) * 100, 100);
              return (
                <tr key={p.id}>
                  <td>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <div style={{ width: 32, height: 32, borderRadius: '8px', background: isLow ? '#FEE2E2' : '#DCFCE7', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                        <Package size={14} color={isLow ? '#B91C1C' : '#15803D'} />
                      </div>
                      <span style={{ fontWeight: 600, color: '#1E293B' }}>{p.name}</span>
                    </div>
                  </td>
                  <td>
                    <code style={{ background: '#F1F5F9', color: '#475569', padding: '3px 8px', borderRadius: '5px', fontSize: '11px', fontWeight: 600 }}>
                      {p.partCode || `P-${p.id}`}
                    </code>
                  </td>
                  <td style={{ color: '#64748B' }}>{p.vendor || '—'}</td>
                  <td>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <div className="stock-bar-track" style={{ width: '70px' }}>
                        <div className="stock-bar-fill" style={{
                          width: `${stockPct}%`,
                          background: isCritical ? '#EF4444' : isLow ? '#F59E0B' : '#10B981'
                        }} />
                      </div>
                      <span className={`badge-pill ${isCritical ? 'badge-overdue' : isLow ? 'badge-credit' : 'badge-paid'}`}>
                        {p.stock} units
                      </span>
                    </div>
                  </td>
                  <td style={{ fontWeight: 600, color: '#1E293B' }}>Rs. {p.price?.toFixed(2)}</td>
                  <td style={{ color: '#475569' }}>Rs. {((p.price || 0) * (p.stock || 0)).toLocaleString()}</td>
                </tr>
              );
            })}
            {filtered.length === 0 && (
              <tr><td colSpan="6">
                <div className="empty-state">
                  <div className="empty-state-icon">📦</div>
                  <h4>No Parts Found</h4>
                  <p>{search ? `No results for "${search}"` : 'No parts in the inventory.'}</p>
                </div>
              </td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default Inventory;
