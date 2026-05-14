import React from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Bell, ChevronRight } from 'lucide-react';

const ROUTE_CRUMBS = {
  '/staff/dashboard': [{ label: 'Dashboard' }],
  '/staff/customers/segments': [{ label: 'Customers', path: '/staff/customers' }, { label: 'Reports' }],
  '/staff/customers': [{ label: 'Customers' }],
  '/staff/sales/new': [{ label: 'Sales' }, { label: 'New Sale' }],
  '/staff/transactions': [{ label: 'Transactions' }],
  '/staff/invoices': [{ label: 'Invoices' }],
  '/staff/parts': [{ label: 'Inventory' }, { label: 'Parts' }],
  '/staff/appointments': [{ label: 'Appointments' }],
  '/admin': [{ label: 'Admin Dashboard' }],
  '/admin/staff': [{ label: 'Users & Access' }],
  '/admin/customers': [{ label: 'Customers' }],
  '/admin/inventory': [{ label: 'Inventory' }],
  '/admin/inventory/purchase': [{ label: 'Purchase Orders' }],
  '/admin/transactions': [{ label: 'Sales' }],
  '/admin/reports': [{ label: 'Reports' }],
  '/vendors': [{ label: 'Vendors' }],
  '/parts': [{ label: 'Parts Catalog' }],
};

const TopBar = ({ user }) => {
  const location = useLocation();
  const navigate = useNavigate();

  // Match dynamic routes like /staff/customers/:id or /staff/invoices/:id
  let crumbs = ROUTE_CRUMBS[location.pathname];
  if (!crumbs) {
    if (location.pathname.startsWith('/staff/customers/')) {
      crumbs = [{ label: 'Customers', path: '/staff/customers' }, { label: 'Profile' }];
    } else if (location.pathname.startsWith('/staff/invoices/')) {
      crumbs = [{ label: 'Invoices', path: '/staff/invoices' }, { label: 'Detail' }];
    } else if (location.pathname.startsWith('/admin/customers/')) {
       crumbs = [{ label: 'Customers', path: '/admin/customers' }, { label: 'Details' }];
    } else {
      crumbs = [{ label: 'Portal' }];
    }
  }

  const isAdminPortal =
    location.pathname.startsWith('/admin') ||
    location.pathname.startsWith('/vendors') ||
    location.pathname.startsWith('/parts');
  const initials = (user?.name || 'AD').split(' ').map((word) => word[0]).join('').slice(0, 2).toUpperCase();

  if (isAdminPortal) {
    return (
      <header className="staff-topbar admin-topbar">
        <div className="admin-topbar-left">
          <div className="admin-breadcrumbs">
            {crumbs.map((crumb, i) => (
              <React.Fragment key={i}>
                {i > 0 && <ChevronRight size={14} color="#CBD5E1" />}
                {crumb.path ? (
                  <button type="button" onClick={() => navigate(crumb.path)} className="admin-breadcrumb-link">
                    {crumb.label}
                  </button>
                ) : (
                  <span className="admin-breadcrumb-current">{crumb.label}</span>
                )}
              </React.Fragment>
            ))}
          </div>
        </div>

        <div className="admin-topbar-actions">
          <button type="button" className="admin-icon-btn" aria-label="Notifications">
            <Bell size={16} />
            <span className="admin-notification-dot" />
          </button>
          <div className="admin-profile-avatar" title={user?.name || 'Admin'}>
            {initials}
          </div>
        </div>
      </header>
    );
  }

  return (
    <header style={{
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      height: '58px',
      padding: '0 28px',
      background: '#fff',
      borderBottom: '1px solid #E2E8F0',
      flexShrink: 0,
      boxShadow: '0 1px 8px rgba(30,58,95,0.04)',
    }}>
      {/* Breadcrumb */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
        {crumbs.map((crumb, i) => (
          <React.Fragment key={i}>
            {i > 0 && <ChevronRight size={14} color="#CBD5E1" />}
            {crumb.path ? (
              <button
                onClick={() => navigate(crumb.path)}
                style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0, fontSize: '14px', color: '#64748B', fontWeight: 500, fontFamily: 'Inter, sans-serif' }}
              >
                {crumb.label}
              </button>
            ) : (
              <span style={{ fontSize: '14px', fontWeight: 700, color: '#1E293B' }}>{crumb.label}</span>
            )}
          </React.Fragment>
        ))}
      </div>

      {/* Right Actions */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
        {/* Date chip */}
        <div style={{
          background: '#F8FAFC', border: '1px solid #E2E8F0', borderRadius: '8px',
          padding: '5px 12px', fontSize: '12px', color: '#64748B', fontWeight: 500
        }}>
          {new Date().toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}
        </div>
      </div>
    </header>
  );
};

export default TopBar;

