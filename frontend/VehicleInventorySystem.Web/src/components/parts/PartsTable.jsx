import React from 'react';

const LOW_STOCK_THRESHOLD = 5;

function StatusBadge({ isActive }) {
  return (
    <span className={`vendor-status-badge ${isActive ? 'is-active' : 'is-inactive'}`}>
      {isActive ? 'Active' : 'Inactive'}
    </span>
  );
}

function formatPrice(value) {
  const amount = Number(value);
  if (Number.isNaN(amount)) {
    return '-';
  }
  return `Rs. ${amount.toFixed(2)}`;
}

export default function PartsTable({ parts, onEdit, onToggleStatus }) {
  return (
    <div className="vendor-table-card card">
      <div className="vendor-table-wrap">
        <table className="vendor-table">
          <thead>
            <tr>
              <th>Part Name</th>
              <th>Part Code</th>
              <th>Description</th>
              <th>Price</th>
              <th>Stock Level</th>
              <th>Vendor Name</th>
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {parts.map((part) => {
              const isLowStock = Number(part.stockLevel) <= LOW_STOCK_THRESHOLD;
              return (
                <tr key={part.id}>
                  <td>
                    <div className="vendor-name-cell">
                      <div className="vendor-name-badge">{String(part.name || '').slice(0, 1).toUpperCase()}</div>
                      <div>
                        <div className="vendor-name-text">{part.name}</div>
                        <div className="vendor-id-text">Code: {part.partCode || '-'}</div>
                      </div>
                    </div>
                  </td>
                  <td>{part.partCode || '-'}</td>
                  <td>{part.description || '-'}</td>
                  <td>{formatPrice(part.price)}</td>
                  <td>
                    <div>
                      <div>{Number.isFinite(Number(part.stockLevel)) ? part.stockLevel : '-'}</div>
                      {isLowStock && <div className="vendor-id-text">Low stock</div>}
                    </div>
                  </td>
                  <td>{part.vendorName || '-'}</td>
                  <td><StatusBadge isActive={part.isActive} /></td>
                  <td>
                    <div className="vendor-actions">
                      <button type="button" className="icon-btn" onClick={() => onEdit(part.id)} aria-label={`Edit ${part.name}`}>
                        Edit
                      </button>
                      <button
                        type="button"
                        className={`icon-btn ${part.isActive ? 'danger' : 'success'}`}
                        onClick={() => onToggleStatus(part)}
                        aria-label={`${part.isActive ? 'Deactivate' : 'Reactivate'} ${part.name}`}
                      >
                        {part.isActive ? 'Deactivate' : 'Reactivate'}
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>

        {parts.length === 0 && (
          <div className="vendor-empty-state">
            <h3>No parts found</h3>
            <p>Try adjusting the search or status filter, or add a new part.</p>
          </div>
        )}
      </div>
    </div>
  );
}
