import React from 'react';
import { NavLink } from 'react-router-dom';
import { 
  LayoutDashboard, 
  Users, 
  BarChart2, 
  ShoppingCart, 
  FileText, 
  Package, 
  CalendarClock, 
  TrendingUp, 
  History,
  Settings,
  Wrench
} from 'lucide-react';

const StaffSidebar = ({ user }) => {
  const NavItem = ({ to, icon: Icon, label }) => (
    <NavLink 
      to={to} 
      className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}
    >
      <Icon size={16} strokeWidth={1.5} />
      <span>{label}</span>
    </NavLink>
  );

  return (
    <aside className="staff-sidebar">
      <div className="sidebar-logo">
        <div className="logo-text">
          <Wrench size={16} color="#185FA5" />
          <span>AutoParts Pro</span>
        </div>
        <div className="logo-sub">Staff Portal</div>
      </div>

      <div className="nav-section-label">Main</div>
      <NavItem to="/staff/dashboard" icon={LayoutDashboard} label="Dashboard" />
      <NavItem to="/staff/customers" icon={Users} label="Customers" />
      <NavItem to="/staff/customers/segments" icon={BarChart2} label="Customer Reports" />
      <NavItem to="/staff/sales/new" icon={ShoppingCart} label="Sales" />
      <NavItem to="/staff/invoices" icon={FileText} label="Invoices" />

      <div className="nav-section-label">Inventory</div>
      <NavItem to="/staff/parts" icon={Package} label="Parts" />
      <NavItem to="/staff/appointments" icon={CalendarClock} label="Appointments" />

      <div className="sidebar-footer">
        <div className="avatar-circle">
          {user?.name?.slice(0, 2).toUpperCase() || 'ST'}
        </div>
        <div style={{ display: 'flex', flexDirection: 'column' }}>
          <span style={{ fontSize: '13px', fontWeight: 500, color: '#111' }}>{user?.name || 'Staff User'}</span>
          <span style={{ fontSize: '11px', color: '#999' }}>Staff</span>
        </div>
      </div>
    </aside>
  );
};

export default StaffSidebar;
