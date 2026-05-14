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

export default function PartsStatsCards({ total, active, inactive, lowStock }) {
  return (
    <div className="vendor-stats-grid">
      <StatCard title="Total Parts" value={total} accent="#2563eb" hint="All registered part records" />
      <StatCard title="Active Parts" value={active} accent="#10b981" hint="Currently available for ordering" />
      <StatCard title="Inactive Parts" value={inactive} accent="#ef4444" hint="Soft deleted or disabled parts" />
      <StatCard title="Low Stock" value={lowStock} accent="#f97316" hint="Parts below the stock threshold" />
    </div>
  );
}
