import React from 'react';

const LowStockList = ({ parts }) => {
  return (
    <div className="dashboard-card">
      <div className="card-header">
        <div className="card-title">Low Stock Parts</div>
      </div>
      <div className="card-body">
        {parts.map((part) => (
          <div key={part.id} className="list-row">
            <div className="row-left">
              <span style={{ fontSize: '13px' }}>{part.name}</span>
              <span style={{ fontSize: '11px', color: '#64748b' }}>SKU: {part.partCode || `P-${part.id}`}</span>
            </div>
            <div className="row-right">
              <div className="progress-wrap">
                <div className="progress-bar-bg">
                  <div 
                    className="progress-bar-fill" 
                    style={{ 
                      width: `${Math.min(100, (part.stockLevel / 20) * 100)}%`,
                      backgroundColor: part.stockLevel <= 5 ? '#E24B4A' : '#EF9F27'
                    }} 
                  />
                </div>
                <span className="badge" style={{ 
                  backgroundColor: part.stockLevel <= 5 ? '#FCEBEB' : '#FAEEDA',
                  color: part.stockLevel <= 5 ? '#A32D2D' : '#854F0B'
                }}>
                  {part.stockLevel} units
                </span>
              </div>
            </div>
          </div>
        ))}
        {parts.length === 0 && (
          <div style={{ padding: '2rem', textAlign: 'center', opacity: 0.5, fontSize: '12px' }}>
            All inventory levels healthy.
          </div>
        )}
      </div>
    </div>
  );
};

export default LowStockList;
