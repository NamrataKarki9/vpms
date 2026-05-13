import React from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Search, Plus } from 'lucide-react';
import { clearStoredUser } from '../../services/api';

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

  const handleLogout = () => {
    clearStoredUser();
    navigate('/login');
    window.location.reload(); // Ensure state is cleared
  };

  return (
    <header style={{ 
      display: 'flex', 
      alignItems: 'center', 
      justifyContent: 'space-between', 
      height: '52px', 
      padding: '0 24px', 
      background: '#fff', 
      borderBottom: '1px solid #EBEBEB', 
      flexShrink: 0 
    }}>
      <h1 style={{ fontSize: '15px', fontWeight: 500, color: '#111', margin: 0 }}>
        {getTitle(location.pathname)}
      </h1>
      
      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
        <button 
          onClick={() => navigate('/staff/sales/new')}
          style={{ 
            background: '#185FA5', 
            color: '#fff', 
            border: 'none', 
            borderRadius: '8px', 
            padding: '7px 16px', 
            fontSize: '13px', 
            fontWeight: 500, 
            display: 'flex', 
            alignItems: 'center', 
            gap: '6px', 
            cursor: 'pointer' 
          }}
        >
          <Plus size={14} />
          <span>New Sale</span>
        </button>

        <button 
          onClick={handleLogout}
          style={{ 
            background: 'transparent', 
            border: '1px solid #E5E5E5', 
            borderRadius: '8px', 
            padding: '7px 14px', 
            fontSize: '13px', 
            color: '#555', 
            cursor: 'pointer' 
          }}
          onMouseEnter={(e) => e.currentTarget.style.background = '#F5F5F3'}
          onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
        >
          Logout
        </button>
      </div>
    </header>
  );
};

export default StaffTopBar;
