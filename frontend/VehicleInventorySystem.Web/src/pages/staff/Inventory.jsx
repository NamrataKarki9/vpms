import React from 'react';

const Inventory = ({ parts }) => {
  return (
    <div className="staff-card">
      <div className="staff-card-header">
        <h3 className="staff-card-title">Parts Inventory</h3>
      </div>
      <div className="staff-card-body">
        <table className="staff-table">
          <thead>
            <tr>
              <th>Part Name</th>
              <th>Code</th>
              <th>Vendor</th>
              <th>Stock</th>
              <th>Price</th>
            </tr>
          </thead>
          <tbody>
            {parts.map(p => (
              <tr key={p.id}>
                <td><strong>{p.name}</strong></td>
                <td><code style={{ fontSize: '11px', color: '#666' }}>{p.partCode || `P-${p.id}`}</code></td>
                <td>{p.vendor}</td>
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
