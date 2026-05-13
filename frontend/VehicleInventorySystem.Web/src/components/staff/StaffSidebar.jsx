import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard,
  Users,
  BarChart2,
  ShoppingCart,
  FileText,
  Package,
  CalendarClock,
  Wrench,
  LogOut
} from 'lucide-react';
import { clearStoredUser } from '../../services/api';

const StaffSidebar = ({ user }) => {
  const navigate = useNavigate();

  const handleLogout = () => {
    clearStoredUser();
    navigate('/login');
    window.location.reload();
  };

  const NavItem = ({ to, icon: Icon, label }) => (
    <NavLink
      to={to}
      end={to === '/staff/customers'}
      className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}
    >
      <Icon size={15} strokeWidth={2} />
      <span>{label}</span>
    </NavLink>
  );

  const initials = (user?.name || 'ST').split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase();

  return (
    <aside className="staff-sidebar">
      {/* Logo */}
      <div className="sidebar-logo">
        <div className="logo-text">
          <div className="logo-icon">🔧</div>
          <span>AutoParts Pro</span>
        </div>
        <div className="logo-sub">Staff Portal</div>
      </div>

      {/* Nav */}
      <div style={{ flex: 1, paddingBottom: '12px' }}>
        <div className="nav-section-label">Main</div>
        <NavItem to="/staff/dashboard" icon={LayoutDashboard} label="Dashboard" />
        <NavItem to="/staff/customers" icon={Users} label="Customers" />
        <NavItem to="/staff/customers/segments" icon={BarChart2} label="Customer Reports" />
        <NavItem to="/staff/sales/new" icon={ShoppingCart} label="Sales" />
        <NavItem to="/staff/invoices" icon={FileText} label="Invoices" />

        <div className="nav-section-label">Inventory</div>
        <NavItem to="/staff/parts" icon={Package} label="Parts" />
        <NavItem to="/staff/appointments" icon={CalendarClock} label="Appointments" />
      </div>

      {/* Footer */}
      {/* User info */}
      <div style={{ borderTop: '1px solid #E2E8F0', padding: '14px 16px', display: 'flex', alignItems: 'center', gap: '10px', background: '#FAFBFD' }}>
        <div className="avatar-circle">{initials}</div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: '13px', fontWeight: 700, color: '#1E293B', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
            {user?.name || 'Staff User'}
          </div>
          <div style={{ fontSize: '11px', color: '#94A3B8', marginTop: '1px' }}>Staff Member</div>
        </div>
      </div>

      {/* Logout Button */}
      <div style={{ padding: '0 10px 14px' }}>
        <button
          onClick={handleLogout}
          style={{
            width: '100%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '8px',
            padding: '9px 14px',
            borderRadius: '8px',
            border: '1.5px solid #FCA5A5',
            background: '#FFF5F5',
            color: '#B91C1C',
            cursor: 'pointer',
            fontSize: '13px',
            fontWeight: 700,
            fontFamily: 'Inter, sans-serif',
            transition: 'all 0.15s',
          }}
          onMouseEnter={e => { e.currentTarget.style.background = '#FEE2E2'; e.currentTarget.style.borderColor = '#F87171'; }}
          onMouseLeave={e => { e.currentTarget.style.background = '#FFF5F5'; e.currentTarget.style.borderColor = '#FCA5A5'; }}
        >
          <LogOut size={14} />
          Logout
        </button>
      </div>
    </aside>
  );
};

export default StaffSidebar;
