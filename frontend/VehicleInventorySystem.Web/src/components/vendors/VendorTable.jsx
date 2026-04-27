import React from 'react';

function StatusBadge({ isActive }) {
  return <span className={`vendor-status-badge ${isActive ? 'is-active' : 'is-inactive'}`}>{isActive ? 'Active' : 'Inactive'}</span>;
}

export default function VendorTable({ vendors, onEdit, onToggleStatus }) {
  return (
    <div className="vendor-table-card card">
      <div className="vendor-table-wrap">
        <table className="vendor-table">
          <thead>
            <tr>
              <th>Vendor Name</th>
              <th>Contact Person</th>
              <th>Phone Number</th>
              <th>Email Address</th>
              <th>Address</th>
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {vendors.map((vendor) => (
              <tr key={vendor.id}>
                <td>
                  <div className="vendor-name-cell">
                    <div className="vendor-name-badge">{String(vendor.name || '').slice(0, 1).toUpperCase()}</div>
                    <div>
                      <div className="vendor-name-text">{vendor.name}</div>
                      <div className="vendor-id-text">ID: {vendor.id}</div>
                    </div>
                  </div>
                </td>
                <td>{vendor.contactPerson}</td>
                <td>{vendor.phoneNumber || vendor.phone || '-'}</td>
                <td>{vendor.emailAddress || vendor.email || '-'}</td>
                <td>{vendor.address || '-'}</td>
                <td><StatusBadge isActive={vendor.isActive} /></td>
                <td>
                  <div className="vendor-actions">
                    <button type="button" className="icon-btn" onClick={() => onEdit(vendor.id)} aria-label={`Edit ${vendor.name}`}>
                      Edit
                    </button>
                    <button
                      type="button"
                      className={`icon-btn ${vendor.isActive ? 'danger' : 'success'}`}
                      onClick={() => onToggleStatus(vendor)}
                      aria-label={`${vendor.isActive ? 'Deactivate' : 'Reactivate'} ${vendor.name}`}
                    >
                      {vendor.isActive ? 'Deactivate' : 'Reactivate'}
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {vendors.length === 0 && (
          <div className="vendor-empty-state">
            <h3>No vendors found</h3>
            <p>Try adjusting the search or status filter, or add a new vendor.</p>
          </div>
        )}
      </div>
    </div>
  );
}
