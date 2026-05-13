import React from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Search, Bell, Plus } from 'lucide-react';

const StaffTopBar = () => {
  const location = useLocation();
  const navigate = useNavigate();

  const getTitle = (path) => {
    if (path.includes('/dashboard')) return 'Dashboard';
    if (path.includes('/customers/segments')) return 'Customer Segments';
    if (path.includes('/customers')) return 'Customers';
    if (path.includes('/sales/new')) return 'New Sale';
    if (path.includes('/invoices')) return 'Invoices';
    if (path.includes('/parts')) return 'Parts Inventory';
    if (path.includes('/appointments')) return 'Appointments';
    if (path.includes('/analytics')) return 'Analytics';
    if (path.includes('/history')) return 'History';
    return 'Staff Portal';
  };

  return (
    <header className="staff-topbar">
      <h1 className="staff-page-title">{getTitle(location.pathname)}</h1>

      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
        <div className="search-input-container">
          <Search className="search-icon-absolute" size={14} />
          <input
            type="text"
            placeholder="Search dashboard..."
            className="search-input-field"
          />
        </div>

        {/* <button className="btn-icon-square">
          <Bell size={18} color="#555" />
          <div className="red-dot-badge"></div>
        </button> */}

        <button
          className="btn-sale-primary"
          onClick={() => navigate('/staff/sales/new')}
        >
          <Plus size={14} />
          <span>New Sale</span>
        </button>
      </div>
    </header>
  );
};

export default StaffTopBar;
