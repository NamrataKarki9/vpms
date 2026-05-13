import React from 'react';
import { Clock, CheckCircle, AlertCircle, Calendar } from 'lucide-react';

const STATUS_MAP = {
  0: { label: 'Pending',   cls: 'badge-credit',  dot: '#F59E0B', icon: AlertCircle  },
  1: { label: 'Confirmed', cls: 'badge-loyalty',  dot: '#3B82F6', icon: Clock        },
  2: { label: 'Completed', cls: 'badge-paid',     dot: '#10B981', icon: CheckCircle  },
};

const Appointments = ({ appointments = [] }) => {
  const pending   = appointments.filter(a => a.status === 0).length;
  const confirmed = appointments.filter(a => a.status === 1).length;
  const completed = appointments.filter(a => a.status === 2).length;

  return (
    <div>
      {/* Page Header */}
      <div className="page-section-header" style={{ marginBottom: '24px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', position: 'relative' }}>
          <div>
            <h2>Service Appointments</h2>
            <p>{appointments.length} total appointments scheduled</p>
          </div>
          <div style={{ display: 'flex', gap: '10px' }}>
            {[
              { label: 'Pending',   value: pending,   color: '#FCD34D' },
              { label: 'Confirmed', value: confirmed, color: '#93C5FD' },
              { label: 'Done',      value: completed, color: '#86EFAC' },
            ].map((s, i) => (
              <div key={i} style={{ background: 'rgba(255,255,255,0.15)', borderRadius: '10px', padding: '10px 16px', textAlign: 'center', backdropFilter: 'blur(4px)' }}>
                <div style={{ fontSize: '20px', fontWeight: 800, color: s.color }}>{s.value}</div>
                <div style={{ fontSize: '10px', color: 'rgba(255,255,255,0.65)', marginTop: '2px' }}>{s.label}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="staff-card">
        <div className="staff-card-header">
          <span className="staff-card-title">All Appointments</span>
          <Calendar size={16} color="#64748B" />
        </div>
        <table className="staff-table">
          <thead>
            <tr>
              <th>Customer</th>
              <th>Service Type</th>
              <th>Vehicle</th>
              <th>Date</th>
              <th>Time</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            {appointments.map(a => {
              const sc = STATUS_MAP[a.status] || STATUS_MAP[0];
              const StatusIcon = sc.icon;
              return (
                <tr key={a.id}>
                  <td>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <div style={{ width: 34, height: 34, borderRadius: '50%', background: 'linear-gradient(135deg,#1E3A5F,#2563A8)', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '12px', fontWeight: 700, flexShrink: 0 }}>
                        {(a.customer?.name || 'U')[0].toUpperCase()}
                      </div>
                      <div>
                        <div style={{ fontWeight: 600, fontSize: '13.5px', color: '#1E293B' }}>{a.customer?.name || '—'}</div>
                        {a.customer?.email && <div style={{ fontSize: '11px', color: '#94A3B8' }}>{a.customer.email}</div>}
                      </div>
                    </div>
                  </td>
                  <td>
                    <span style={{ background: '#EEF2FF', color: '#4F46E5', padding: '4px 10px', borderRadius: '6px', fontSize: '12px', fontWeight: 600 }}>
                      {a.serviceType}
                    </span>
                  </td>
                  <td style={{ color: '#475569' }}>
                    {a.vehicle ? `${a.vehicle.make} ${a.vehicle.model}` : (
                      <span style={{ color: '#CBD5E1', fontStyle: 'italic' }}>Not specified</span>
                    )}
                  </td>
                  <td>
                    <div style={{ fontWeight: 500, color: '#1E293B', fontSize: '13px' }}>
                      {new Date(a.appointmentDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                    </div>
                  </td>
                  <td>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <Clock size={12} color="#64748B" />
                      <strong style={{ color: '#1E293B' }}>{a.appointmentTime}</strong>
                    </div>
                  </td>
                  <td>
                    <div style={{ display: 'inline-flex', alignItems: 'center', gap: '5px' }}>
                      <span style={{ width: 7, height: 7, borderRadius: '50%', background: sc.dot, display: 'inline-block', flexShrink: 0 }} />
                      <span className={`badge-pill ${sc.cls}`}>{sc.label}</span>
                    </div>
                  </td>
                </tr>
              );
            })}
            {appointments.length === 0 && (
              <tr><td colSpan="6">
                <div className="empty-state">
                  <div className="empty-state-icon">📅</div>
                  <h4>No Appointments</h4>
                  <p>No service appointments have been scheduled yet.</p>
                </div>
              </td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default Appointments;
