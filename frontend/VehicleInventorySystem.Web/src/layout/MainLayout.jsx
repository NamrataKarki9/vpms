import React from 'react';
import Sidebar from './Sidebar';

export default function MainLayout({ currentPath, onNavigate, children }) {
  return (
    <div className="app-shell">
      <Sidebar currentPath={currentPath} onNavigate={onNavigate} />
      <main className="app-main">
        {children}
      </main>
    </div>
  );
}
