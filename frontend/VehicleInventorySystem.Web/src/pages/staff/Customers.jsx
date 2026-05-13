import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, User, ChevronRight } from 'lucide-react';

const Customers = ({ customers = [] }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const navigate = useNavigate();

  const filtered = customers.filter(c =>
    (c.name || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
    (c.plate || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
    (c.phone || '').includes(searchTerm)
  );

  const getInitials = (name = '') => name.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase();

  const AVATAR_COLORS = [
    ['#1E3A5F','#2563A8'], ['#065F46','#059669'], ['#7C3AED','#9333EA'],
    ['#B45309','#D97706'], ['#BE185D','#EC4899'], ['#0E7490','#06B6D4'],
  ];

  return (
    <div>
      {/* Page Header */}
      <div className="page-section-header">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', position: 'relative' }}>
          <div>
            <h2>Customer Directory</h2>
            <p>{customers.length} registered customers</p>
          </div>
          <div style={{ background: 'rgba(255,255,255,0.15)', borderRadius: '10px', padding: '10px 16px', textAlign: 'center', backdropFilter: 'blur(4px)' }}>
            <div style={{ fontSize: '24px', fontWeight: 800, color: '#fff' }}>{customers.length}</div>
            <div style={{ fontSize: '11px', color: 'rgba(255,255,255,0.7)', marginTop: '2px' }}>Total</div>
          </div>
        </div>
      </div>

      {/* Search & Table Card */}
      <div className="staff-card">
        <div className="staff-card-header">
          <span className="staff-card-title">All Customers</span>
          <div style={{ position: 'relative' }}>
            <Search size={14} color="#94A3B8" style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)' }} />
            <input
              type="text"
              placeholder="Search name, plate, phone..."
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              className="search-input-field"
              style={{ paddingLeft: '32px', width: '240px' }}
            />
          </div>
        </div>
        <table className="staff-table">
          <thead>
            <tr>
              <th>Customer</th>
              <th>Vehicle</th>
              <th>Plate No.</th>
              <th>Phone</th>
              <th>Action</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((c, idx) => {
              const [from, to] = AVATAR_COLORS[idx % AVATAR_COLORS.length];
              return (
                <tr key={c.id}>
                  <td>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                      <div style={{ width: 34, height: 34, borderRadius: '50%', background: `linear-gradient(135deg,${from},${to})`, color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '12px', fontWeight: 700, flexShrink: 0 }}>
                        {getInitials(c.name)}
                      </div>
                      <div>
                        <div style={{ fontWeight: 600, fontSize: '13.5px', color: '#1E293B' }}>{c.name}</div>
                        <div style={{ fontSize: '11px', color: '#94A3B8' }}>{c.email || 'No email'}</div>
                      </div>
                    </div>
                  </td>
                  <td style={{ color: '#475569' }}>
                    {c.vehicleInfo ? `${c.vehicleInfo.make} ${c.vehicleInfo.model}` : (
                      <span style={{ color: '#CBD5E1', fontStyle: 'italic' }}>No vehicle</span>
                    )}
                  </td>
                  <td>
                    {c.plate && c.plate !== 'N/A' ? (
                      <span style={{ background: '#EBF2FB', color: '#1E3A5F', padding: '4px 10px', borderRadius: '6px', fontSize: '12px', fontWeight: 700, letterSpacing: '0.5px' }}>
                        {c.plate}
                      </span>
                    ) : (
                      <span style={{ color: '#CBD5E1', fontSize: '12px' }}>—</span>
                    )}
                  </td>
                  <td style={{ color: '#475569', fontSize: '13px' }}>{c.phone || '—'}</td>
                  <td>
                    <button
                      onClick={() => navigate(`/staff/customers/${c.id}`)}
                      style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', background: 'none', border: '1px solid #E2E8F0', borderRadius: '7px', padding: '6px 12px', cursor: 'pointer', fontSize: '12px', fontWeight: 600, color: '#1E3A5F', transition: 'all 0.15s' }}
                      onMouseEnter={e => { e.currentTarget.style.background = '#EBF2FB'; e.currentTarget.style.borderColor = '#93C5FD'; }}
                      onMouseLeave={e => { e.currentTarget.style.background = 'none'; e.currentTarget.style.borderColor = '#E2E8F0'; }}
                    >
                      View <ChevronRight size={13} />
                    </button>
                  </td>
                </tr>
              );
            })}
            {filtered.length === 0 && (
              <tr><td colSpan="5">
                <div className="empty-state">
                  <div className="empty-state-icon">{searchTerm ? '🔍' : '👥'}</div>
                  <h4>{searchTerm ? 'No Results Found' : 'No Customers Yet'}</h4>
                  <p>{searchTerm ? `No customers match "${searchTerm}"` : 'Customers will appear here once registered.'}</p>
                </div>
              </td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default Customers;
