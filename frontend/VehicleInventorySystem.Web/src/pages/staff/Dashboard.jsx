import React from 'react';
import { AlertTriangle, Clock, TrendingUp, TrendingDown, Package, FileText, Users, DollarSign } from 'lucide-react';

const METRIC_ICONS = [DollarSign, FileText, Users, Package];
const METRIC_COLORS = [
  { from: '#1E3A5F', to: '#2563A8', light: '#DBEAFE', text: '#1D4ED8' },
  { from: '#065F46', to: '#059669', light: '#DCFCE7', text: '#15803D' },
  { from: '#7C3AED', to: '#9333EA', light: '#EDE9FE', text: '#6D28D9' },
  { from: '#B45309', to: '#D97706', light: '#FEF3C7', text: '#B45309' },
];

function StatusBadge({ status, paymentStatus }) {
  let label = status;
  let cls = 'badge-pill badge-pending';

  if (paymentStatus === 'full-payment' || status === 'Paid') { label = 'Paid'; cls = 'badge-pill badge-paid'; }
  else if (paymentStatus === 'half-payment' || status === 'Credit') { label = 'Credit'; cls = 'badge-pill badge-credit'; }
  else if (paymentStatus === 'partial-payment' || status === 'Overdue') { label = 'Overdue'; cls = 'badge-pill badge-overdue'; }
  else if (status === 'Loyalty') { label = 'Loyalty'; cls = 'badge-pill badge-loyalty'; }

  return <span className={cls}>{label}</span>;
}

const Dashboard = ({ sales = [], customers = [], parts = [], appointments = [] }) => {
  const today = new Date().toDateString();

  const lowStockParts = (parts || []).filter(p => p.stock < 10).sort((a, b) => a.stock - b.stock);
  const todaySalesList = (sales || []).filter(s => s.date && new Date(s.date).toDateString() === today);
  const totalTodayAmount = todaySalesList.reduce((sum, s) => sum + (parseFloat(s.total) || 0), 0);
  const todayInvoicesCount = todaySalesList.length;
  const todayCustomersCount = new Set(todaySalesList.map(s => s.customerName)).size;

  const dashboardAlerts = [
    ...lowStockParts.slice(0, 3).map(p => ({ type: 'stock', message: `Low stock: ${p.name}`, sub: `${p.stock} units remaining`, time: 'Now' })),
    ...appointments.filter(a => a.status === 0).slice(0, 2).map(a => ({ type: 'appointment', message: `Appointment: ${a.customer?.name}`, sub: a.serviceType, time: a.appointmentTime }))
  ];

  const metrics = [
    { label: "Today's Revenue", value: `Rs. ${totalTodayAmount.toLocaleString()}`, sub: todaySalesList.length > 0 ? `${todaySalesList.length} transactions` : 'No sales today', up: totalTodayAmount > 0 },
    { label: "Invoices Issued", value: todayInvoicesCount, sub: 'Generated today', up: true },
    { label: "Customers Served", value: todayCustomersCount, sub: 'Unique today', up: true },
    { label: "Low Stock Alerts", value: lowStockParts.length, sub: lowStockParts.length > 0 ? 'Needs attention' : 'All well stocked', up: lowStockParts.length === 0 },
  ];

  return (
    <div>
      {/* ── Page Header ── */}
      <div className="page-section-header" style={{ marginBottom: '24px' }}>
        <h2>Dashboard Overview</h2>
        <p>Real-time summary for {new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</p>
      </div>

      {/* ── Metric Cards ── */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '14px', marginBottom: '24px' }}>
        {metrics.map((m, i) => {
          const Icon = METRIC_ICONS[i];
          const col = METRIC_COLORS[i];
          return (
            <div key={i} className="metric-card">
              <div className="metric-card-accent" style={{ background: `linear-gradient(135deg, ${col.from}, ${col.to})` }} />
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '14px' }}>
                <div style={{ width: 40, height: 40, borderRadius: '10px', background: col.light, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Icon size={18} color={col.text} />
                </div>
                {m.up
                  ? <TrendingUp size={14} color="#15803D" />
                  : <TrendingDown size={14} color="#B91C1C" />}
              </div>
              <p style={{ fontSize: '11px', color: '#64748B', textTransform: 'uppercase', letterSpacing: '0.7px', fontWeight: 600, marginBottom: '6px' }}>{m.label}</p>
              <p style={{ fontSize: '26px', fontWeight: 800, color: '#1E293B', letterSpacing: '-0.5px', marginBottom: '4px' }}>{m.value}</p>
              <p style={{ fontSize: '12px', color: '#94A3B8' }}>{m.sub}</p>
            </div>
          );
        })}
      </div>

      {/* ── Main 2-col ── */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 300px', gap: '16px', marginBottom: '16px' }}>

        {/* Recent Transactions Table */}
        <div className="staff-card">
          <div className="staff-card-header">
            <span className="staff-card-title">Recent Transactions</span>
            <span style={{ fontSize: '12px', color: '#94A3B8' }}>{sales.length} total records</span>
          </div>
          <table className="staff-table">
            <thead>
              <tr>
                <th>Customer</th>
                <th>Date</th>
                <th>Amount</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {sales.slice(0, 8).map(t => (
                <tr key={t.id}>
                  <td>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <div style={{ width: 30, height: 30, borderRadius: '50%', background: 'linear-gradient(135deg,#1E3A5F,#2563A8)', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '11px', fontWeight: 700, flexShrink: 0 }}>
                        {(t.customerName || 'U')[0].toUpperCase()}
                      </div>
                      <div>
                        <div style={{ fontWeight: 600, fontSize: '13px', color: '#1E293B' }}>{t.customerName}</div>
                        <div style={{ fontSize: '11px', color: '#94A3B8' }}>Invoice #{t.id}</div>
                      </div>
                    </div>
                  </td>
                  <td style={{ color: '#64748B' }}>{t.date}</td>
                  <td><strong style={{ color: '#1E293B' }}>Rs. {(parseFloat(t.total) || 0).toLocaleString()}</strong></td>
                  <td><StatusBadge paymentStatus={t.paymentStatus} /></td>
                </tr>
              ))}
              {sales.length === 0 && (
                <tr><td colSpan="4">
                  <div className="empty-state">
                    <div className="empty-state-icon">📋</div>
                    <h4>No Transactions Yet</h4>
                    <p>Sales will appear here once processed.</p>
                  </div>
                </td></tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Alerts Panel */}
        <div className="staff-card">
          <div className="staff-card-header">
            <span className="staff-card-title">System Alerts</span>
            {dashboardAlerts.length > 0 && (
              <span style={{ background: '#FEE2E2', color: '#B91C1C', fontSize: '11px', fontWeight: 700, padding: '2px 8px', borderRadius: '12px' }}>
                {dashboardAlerts.length}
              </span>
            )}
          </div>
          <div>
            {dashboardAlerts.map((alert, i) => (
              <div key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: '12px', padding: '14px 18px', borderBottom: '1px solid #F1F5F9' }}>
                <div style={{
                  width: 34, height: 34, flexShrink: 0, borderRadius: '9px',
                  background: alert.type === 'stock' ? '#FEE2E2' : '#FEF3C7',
                  display: 'flex', alignItems: 'center', justifyContent: 'center'
                }}>
                  {alert.type === 'stock'
                    ? <AlertTriangle size={15} color="#B91C1C" />
                    : <Clock size={15} color="#B45309" />}
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <p style={{ fontSize: '13px', color: '#1E293B', fontWeight: 600, marginBottom: '2px' }}>{alert.message}</p>
                  <p style={{ fontSize: '11px', color: '#94A3B8' }}>{alert.sub}</p>
                </div>
                <span style={{ fontSize: '10px', color: '#CBD5E1', fontWeight: 600, whiteSpace: 'nowrap', marginTop: '2px' }}>{alert.time}</span>
              </div>
            ))}
            {dashboardAlerts.length === 0 && (
              <div className="empty-state">
                <div className="empty-state-icon">✅</div>
                <h4>All Clear</h4>
                <p>No active alerts right now.</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ── Bottom Row ── */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>

        {/* Low Stock Parts */}
        <div className="staff-card">
          <div className="staff-card-header">
            <span className="staff-card-title">Low Stock Parts</span>
            {lowStockParts.length > 0 && (
              <span style={{ background: '#FEE2E2', color: '#B91C1C', fontSize: '11px', fontWeight: 700, padding: '2px 8px', borderRadius: '12px' }}>
                {lowStockParts.length} critical
              </span>
            )}
          </div>
          <div>
            {lowStockParts.slice(0, 5).map(p => (
              <div key={p.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '13px 18px', borderBottom: '1px solid #F1F5F9' }}>
                <div>
                  <div style={{ fontSize: '13px', fontWeight: 600, color: '#1E293B', marginBottom: '2px' }}>{p.name}</div>
                  <div style={{ fontSize: '11px', color: '#94A3B8' }}>{p.partCode || `SKU-${p.id}`}</div>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <div>
                    <div className="stock-bar-track">
                      <div className="stock-bar-fill" style={{
                        width: `${Math.min((p.stock / 10) * 100, 100)}%`,
                        background: p.stock <= 3 ? '#EF4444' : p.stock <= 6 ? '#F59E0B' : '#10B981'
                      }} />
                    </div>
                  </div>
                  <span className={`badge-pill ${p.stock <= 5 ? 'badge-overdue' : 'badge-credit'}`}>
                    {p.stock} left
                  </span>
                </div>
              </div>
            ))}
            {lowStockParts.length === 0 && (
              <div className="empty-state">
                <div className="empty-state-icon">📦</div>
                <h4>Stock Healthy</h4>
                <p>All parts are well stocked.</p>
              </div>
            )}
          </div>
        </div>

        {/* Appointments */}
        <div className="staff-card">
          <div className="staff-card-header">
            <span className="staff-card-title">Upcoming Appointments</span>
            <span style={{ fontSize: '12px', color: '#94A3B8' }}>{appointments.length} scheduled</span>
          </div>
          <div>
            {appointments.slice(0, 5).map(a => {
              const statusColors = { 0: { dot: '#F59E0B', label: 'Pending', cls: 'badge-credit' }, 1: { dot: '#3B82F6', label: 'Confirmed', cls: 'badge-loyalty' }, 2: { dot: '#10B981', label: 'Done', cls: 'badge-paid' } };
              const sc = statusColors[a.status] || statusColors[0];
              return (
                <div key={a.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '13px 18px', borderBottom: '1px solid #F1F5F9' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <div style={{ width: 36, height: 36, borderRadius: '10px', background: '#F1F5F9', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <Clock size={16} color="#64748B" />
                    </div>
                    <div>
                      <div style={{ fontSize: '13px', fontWeight: 600, color: '#1E293B' }}>{a.customer?.name}</div>
                      <div style={{ fontSize: '11px', color: '#94A3B8' }}>{a.serviceType}</div>
                    </div>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <div style={{ fontSize: '12px', fontWeight: 700, color: '#1E293B', marginBottom: '3px' }}>{a.appointmentTime}</div>
                    <span className={`badge-pill ${sc.cls}`}>{sc.label}</span>
                  </div>
                </div>
              );
            })}
            {appointments.length === 0 && (
              <div className="empty-state">
                <div className="empty-state-icon">📅</div>
                <h4>No Appointments</h4>
                <p>No appointments scheduled yet.</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
