import React from 'react';
import { TbBellExclamation, TbAlertTriangle } from 'react-icons/tb';

const AlertsPanel = ({ alerts }) => {
  return (
    <div className="dashboard-card">
      <div className="card-header">
        <div className="card-title">Alerts</div>
      </div>
      <div className="card-body">
        <div className="alert-list">
          {alerts.map((alert, idx) => (
            <div key={idx} className="alert-item">
              <div className={`alert-icon-box ${alert.type === 'stock' ? 'alert-stock' : 'alert-credit'}`}>
                {alert.type === 'stock' ? <TbAlertTriangle size={16} /> : <TbBellExclamation size={16} />}
              </div>
              <div className="alert-content">
                <div className="alert-text">{alert.text}</div>
                <div className="alert-time">{alert.time}</div>
              </div>
            </div>
          ))}
          {alerts.length === 0 && (
            <div style={{ padding: '2rem', textAlign: 'center', opacity: 0.5, fontSize: '12px' }}>
              No active alerts.
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AlertsPanel;
