import React from 'react';

function StatCard({ title, value, accent, hint }) {
  return (
    <div className="metric-card vendor-stat-card">
      <span className="metric-card-accent" style={{ background: accent }} />
      <div className="vendor-stat-top">
        <span className="vendor-stat-title">{title}</span>
        <span className="vendor-stat-accent" style={{ background: accent }} />
      </div>
      <div className="vendor-stat-value">{value}</div>
      <div className="vendor-stat-hint">{hint}</div>
    </div>
  );
}

export default function StaffStatsCards({ total, active, inactive }) {
  return (
    <div className="vendor-stats-grid">
      <StatCard title="Total Staff" value={total} accent="#2563eb" hint="All registered staff members" />
      <StatCard title="Active Staff" value={active} accent="#10b981" hint="Currently active staff accounts" />
      <StatCard title="Inactive Staff" value={inactive} accent="#ef4444" hint="Disabled or archived accounts" />
    </div>
  );
}
