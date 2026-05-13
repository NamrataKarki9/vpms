import React from 'react';
import { Outlet } from 'react-router-dom';
import StaffSidebar from './StaffSidebar';
import StaffTopBar from './StaffTopBar';
import '../../styles/staff.css';

const StaffLayout = ({ user }) => {
  return (
    <div className="staff-shell">
      <StaffSidebar user={user} />
      
      <div className="staff-body">
        <StaffTopBar />
        
        <main className="staff-content">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default StaffLayout;
