import React from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Plus, ChevronRight, HelpCircle } from 'lucide-react';

const ROUTE_CRUMBS = {
  '/customer': [{ label: 'Dashboard' }],
  '/customer/vehicles': [{ label: 'Garage', path: '/customer/vehicles' }, { label: 'My Vehicles' }],
  '/customer/appointments': [{ label: 'Services', path: '/customer/appointments' }, { label: 'Appointments' }],
  '/customer/book': [{ label: 'Services', path: '/customer/appointments' }, { label: 'Book Appointment' }],
  '/customer/requests': [{ label: 'Services', path: '/customer/appointments' }, { label: 'Special Orders' }],
  '/customer/new-request': [{ label: 'Services', path: '/customer/appointments' }, { label: 'Submit Special Order' }],
  '/customer/history': [{ label: 'Garage', path: '/customer/vehicles' }, { label: 'Service History' }],
};

const CustomerTopBar = () => {
  const location = useLocation();
  const navigate = useNavigate();

  let crumbs = ROUTE_CRUMBS[location.pathname] || [{ label: 'Customer Portal' }];

  return (
    <header className="staff-topbar">
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

        {/* Book Appointment CTA */}
        <button
          onClick={() => navigate('/customer/book')}
          className="btn-sale-primary"
          style={{ height: '36px' }}
        >
          <Plus size={14} />
          <span>Book Service</span>
        </button>
      </div>
    </header>
  );
};

export default CustomerTopBar;
