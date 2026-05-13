import React from 'react';

const MetricCard = ({ label, value, delta, deltaType }) => {
  return (
    <div className="metric-card">
      <div className="metric-label">{label}</div>
      <div className="metric-value">{value}</div>
      <div className={`metric-delta ${deltaType === 'pos' ? 'delta-pos' : 'delta-neg'}`}>
        {deltaType === 'pos' ? '↑' : '↓'} {delta}
      </div>
    </div>
  );
};

export default MetricCard;
