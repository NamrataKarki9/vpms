import React from 'react';

const NAV_ITEMS = [
  { label: 'Dashboard', path: '/' },
  { label: 'Vendors', path: '/vendors' },
  { label: 'Inventory', path: '/inventory' },
  { label: 'Purchase Orders', path: '/purchase-orders' },
  { label: 'Sales', path: '/sales' },
  { label: 'Customers', path: '/customers' },
  { label: 'Reports', path: '/reports' },
  { label: 'Settings', path: '/settings' },
];

export default function Sidebar({ currentPath, onNavigate }) {
  return (
    <aside className="sidebar-shell">
      <div className="sidebar-brand">
        <div className="sidebar-brand-mark">V</div>
        <div>
          <div className="sidebar-brand-title">VehicleOps</div>
          <div className="sidebar-brand-subtitle">Operations Suite</div>
        </div>
      </div>

      <nav className="sidebar-nav" aria-label="Primary">
        {NAV_ITEMS.map((item) => {
          const isActive = item.path === currentPath || (item.path === '/' && currentPath === '/');
          return (
            <a
              key={item.path}
              href={item.path}
              className={`sidebar-link${isActive ? ' is-active' : ''}`}
              onClick={(event) => onNavigate(event, item.path)}
            >
              <span className="sidebar-link-dot" />
              <span>{item.label}</span>
            </a>
          );
        })}
      </nav>

      <div className="sidebar-health-card">
        <div className="sidebar-health-label">Vendor Health</div>
        <div className="sidebar-health-bar">
          <span style={{ width: '85%' }} />
        </div>
        <div className="sidebar-health-value">85% Fulfillment Rate</div>
      </div>
    </aside>
  );
}
