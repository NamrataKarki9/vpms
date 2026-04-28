import React from 'react';

function StatCard({ title, value, accent, hint }) {
  return (
    <div className="vendor-stat-card card">
      <div className="vendor-stat-top">
        <span className="vendor-stat-title">{title}</span>
        <span className="vendor-stat-accent" style={{ background: accent }} />
      </div>
      <div className="vendor-stat-value">{value}</div>
      <div className="vendor-stat-hint">{hint}</div>
    </div>
  );
}

export default function VendorStatsCards({ total, active, inactive }) {
  return (
    <div className="vendor-stats-grid">
      <StatCard title="Total Vendors" value={total} accent="#2563eb" hint="All registered vendor records" />
      <StatCard title="Active Vendors" value={active} accent="#10b981" hint="Currently available for purchasing" />
      <StatCard title="Inactive Vendors" value={inactive} accent="#ef4444" hint="Soft deleted or disabled vendors" />
    </div>
  );
}
