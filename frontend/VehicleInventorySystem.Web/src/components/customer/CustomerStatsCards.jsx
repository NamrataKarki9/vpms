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

export default function CustomerStatsCards({ total, active, inactive }) {
  return (
    <div className="vendor-stats-grid">
      <StatCard title="Total Customers" value={total} accent="#2563eb" hint="All registered customers" />
      <StatCard title="Active Customers" value={active} accent="#10b981" hint="Currently active accounts" />
      <StatCard title="Inactive Customers" value={inactive} accent="#ef4444" hint="Disabled or archived accounts" />
    </div>
  );
}
