import React from 'react';

function Header({ user, onLogout, onNavigateStaff }) {
  const [showNotifications, setShowNotifications] = React.useState(false);

  const handleScroll = (e, id) => {
    e.preventDefault();
    const element = document.getElementById(id);
    if (element) {
      const headerOffset = 80;
      const elementPosition = element.getBoundingClientRect().top;
      const offsetPosition = elementPosition + window.pageYOffset - headerOffset;

      window.scrollTo({
        top: offsetPosition,
        behavior: "smooth"
      });

      element.classList.add('section-highlight');
      setTimeout(() => element.classList.remove('section-highlight'), 2000);
    }
  };

  const notifications = user?.role === 'Staff' ? [
    { id: 1, text: 'Low Stock: Brake Pads (5 remaining)', time: '2h ago', type: 'warning' },
    { id: 2, text: 'New order from Aaysha Kandel', time: '4h ago', type: 'info' },
    { id: 3, text: 'Payment reminder sent to Test User', time: '1d ago', type: 'success' }
  ] : [
    { id: 1, text: 'Your order is ready for pickup!', time: '1h ago', type: 'success' },
    { id: 2, text: 'New 10% discount on Oil Filters', time: '5h ago', type: 'info' },
    { id: 3, text: 'Maintenance reminder: Spark Plugs', time: '2d ago', type: 'warning' }
  ];

  return (
    <header className="main-header" onClick={() => showNotifications && setShowNotifications(false)}>
      <div className="header-content">
        <div className="logo-group">
          <div className="logo" onClick={() => window.location.reload()} style={{ cursor: 'pointer' }}>Vehicle Inventory System</div>
          <button className="home-link-btn" onClick={() => window.location.reload()}>Home</button>
        </div>
        
        {user && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '2rem' }}>
          <nav style={{ display: 'flex', gap: '1.5rem' }}>
            {user.role === 'Admin' ? (
              <>
                <a href="#stats" onClick={(e) => handleScroll(e, 'stats')}>Financials</a>
                <a href="#staff" onClick={(e) => handleScroll(e, 'staff')}>Staff</a>
                <a href="#inventory" onClick={(e) => handleScroll(e, 'inventory')}>Inventory</a>
                <a href="#vendors" onClick={(e) => handleScroll(e, 'vendors')}>Vendors</a>
              </>
            ) : user.role === 'Staff' ? (
              <>
                <a href="#" onClick={() => onNavigateStaff('main')}>Dashboard</a>
                <a href="#" onClick={() => onNavigateStaff('sales')}>New Sale</a>
                <a href="#" onClick={() => onNavigateStaff('invoices')}>Invoices</a>
              </>
            ) : (
              <>
                <a href="#welcome">Home</a>
                <a href="#parts">Browse Parts</a>
              </>
            )}
          </nav>

          {/* Notification Icon and Dropdown */}
          {(user.role === 'Staff' || user.role === 'Customer') && (
            <div style={{ position: 'relative' }}>
              <div 
                style={{ cursor: 'pointer', fontSize: '1.2rem' }} 
                onClick={(e) => { e.stopPropagation(); setShowNotifications(!showNotifications); }}
                title="Notifications"
              >
                🔔
                <span style={{ 
                  position: 'absolute', 
                  top: '-5px', 
                  right: '-5px', 
                  background: '#ef4444', 
                  width: '8px', 
                  height: '8px', 
                  borderRadius: '50%', 
                  border: '2px solid #fff' 
                }}></span>
              </div>

              {showNotifications && (
                <div style={{ 
                  position: 'absolute', 
                  top: '100%', 
                  right: 0, 
                  marginTop: '1rem', 
                  width: '300px', 
                  background: '#fff', 
                  borderRadius: '12px', 
                  boxShadow: '0 10px 25px rgba(0,0,0,0.1)', 
                  zIndex: 1000,
                  padding: '1rem',
                  border: '1px solid #e2e8f0'
                }}>
                  <h4 style={{ margin: '0 0 1rem 0', color: '#1e293b', borderBottom: '1px solid #f1f5f9', paddingBottom: '0.5rem' }}>Notifications</h4>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.8rem' }}>
                    {notifications.map(n => (
                      <div key={n.id} style={{ fontSize: '0.85rem', padding: '0.8rem', background: '#f8fafc', borderRadius: '8px', borderLeft: `4px solid ${n.type === 'warning' ? '#f59e0b' : n.type === 'success' ? '#10b981' : '#3b82f6'}` }}>
                        <div style={{ color: '#334155', fontWeight: 500 }}>{n.text}</div>
                        <div style={{ fontSize: '0.75rem', opacity: 0.6, marginTop: '4px' }}>{n.time}</div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', paddingLeft: '1rem', borderLeft: '1px solid #e2e8f0' }}>
            <div className="user-profile">
              <div className="user-info">
                <span className="user-name">{user.name}</span>
                <span className="user-role">{user.role}</span>
              </div>
              <button className="logout-btn" onClick={onLogout}>Logout</button>
            </div>
          </div>
        </div>
      )}
    </div>
  </header>
  );
}

export default Header;
