import React from 'react';
import { AlertTriangle, Clock } from 'lucide-react';

const badgeStyles = {
  Credit:  { bg:'#FAEEDA', color:'#854F0B' },
  Paid:    { bg:'#EAF3DE', color:'#3B6D11' },
  Overdue: { bg:'#FCEBEB', color:'#A32D2D' },
  Loyalty: { bg:'#E6F1FB', color:'#185FA5' },
}

function StatusBadge({ status }) {
  const s = badgeStyles[status] || { bg:'#F0F0F0', color:'#555' }
  return (
    <span style={{
      background: s.bg, color: s.color,
      fontSize:'11px', fontWeight:'500',
      padding:'3px 10px', borderRadius:'20px',
      display:'inline-block'
    }}>
      {status}
    </span>
  )
}

const Dashboard = ({ sales, customers, parts, appointments }) => {
  const lowStockParts = (parts || []).filter(p => p.stock < 10).sort((a, b) => a.stock - b.stock);
  const todaySales = (sales || []).filter(s => new Date(s.date).toDateString() === new Date().toDateString());
  const totalTodayAmount = todaySales.reduce((sum, s) => sum + (s.total || 0), 0);
  
  const dashboardAlerts = [
    ...lowStockParts.slice(0, 2).map(p => ({ type: 'stock', message: `Low stock: ${p.name} (${p.stock} units)`, time: 'Immediate' })),
    ...appointments.filter(a => a.status === 0).slice(0, 2).map(a => ({ type: 'appointment', message: `New appointment: ${a.customer?.name}`, time: a.appointmentTime }))
  ];

  return (
    <div style={{ padding: '0' }}>
      {/* 2A. METRIC CARDS */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '12px', marginBottom: '24px' }}>
        {[
          { label: "Today's Sales", value: `Rs. ${totalTodayAmount.toLocaleString()}`, delta: "↑ 12%", deltaType: 'pos' },
          { label: "Invoices Issued", value: sales.length, delta: "↑ 5%", deltaType: 'pos' },
          { label: "Customers Served", value: customers.length, delta: "↑ 2%", deltaType: 'pos' },
          { label: "Low Stock Alerts", value: lowStockParts.length, delta: "↓ 3", deltaType: 'neg' }
        ].map((m, i) => (
          <div key={i} style={{ background: '#fff', border: '1px solid #EBEBEB', borderRadius: '12px', padding: '18px 20px' }}>
            <p style={{ fontSize: '11px', color: '#AAA', textTransform: 'uppercase', letterSpacing: '0.5px', margin: '0 0 8px' }}>{m.label}</p>
            <p style={{ fontSize: '22px', font_weight: 500, color: '#111', margin: '0 0 4px' }}>{m.value}</p>
            <p style={{ fontSize: '12px', color: m.deltaType === 'neg' ? '#A32D2D' : '#0F6E56', margin: '0' }}>{m.delta}</p>
          </div>
        ))}
      </div>

      {/* 2B. MAIN CONTENT GRID */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 300px', gap: '16px', marginBottom: '24px' }}>
        
        {/* Left Column — Recent Transactions */}
        <div style={{ background: '#fff', border: '1px solid #EBEBEB', borderRadius: '12px', overflow: 'hidden' }}>
          <div style={{ padding: '14px 18px', borderBottom: '1px solid #EBEBEB', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span style={{ fontSize: '13px', fontWeight: 500, color: '#111' }}>Recent Transactions</span>
          </div>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid #F0F0F0' }}>
                <th style={{ fontSize: '11px', color: '#AAA', textTransform: 'uppercase', letterSpacing: '0.4px', padding: '10px 18px', textAlign: 'left', fontWeight: 500, borderRight: '1px solid #F0F0F0' }}>Customer</th>
                <th style={{ fontSize: '11px', color: '#AAA', textTransform: 'uppercase', letterSpacing: '0.4px', padding: '10px 18px', textAlign: 'left', fontWeight: 500, borderRight: '1px solid #F0F0F0' }}>Date</th>
                <th style={{ fontSize: '11px', color: '#AAA', textTransform: 'uppercase', letterSpacing: '0.4px', padding: '10px 18px', textAlign: 'left', fontWeight: 500, borderRight: '1px solid #F0F0F0' }}>Amount</th>
                <th style={{ fontSize: '11px', color: '#AAA', textTransform: 'uppercase', letterSpacing: '0.4px', padding: '10px 18px', textAlign: 'left', fontWeight: 500 }}>Status</th>
              </tr>
            </thead>
            <tbody>
              {sales.slice(0, 6).map(t => (
                <tr key={t.id} style={{ borderBottom: '1px solid #F5F5F5' }} onMouseEnter={e => e.currentTarget.style.background = '#FAFAFA'} onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
                  <td style={{ padding: '11px 18px', fontSize: '13px', color: '#111', borderRight: '1px solid #F0F0F0' }}>
                    <span style={{ fontWeight: 500 }}>{t.customerName}</span>
                    <br />
                    <span style={{ fontSize: '11px', color: '#AAA' }}>ID: {t.id}</span>
                  </td>
                  <td style={{ padding: '11px 18px', fontSize: '13px', color: '#555', borderRight: '1px solid #F0F0F0' }}>{t.date}</td>
                  <td style={{ padding: '11px 18px', fontSize: '13px', color: '#111', borderRight: '1px solid #F0F0F0' }}>Rs. {t.total?.toLocaleString() || t.amount?.toLocaleString()}</td>
                  <td style={{ padding: '11px 18px' }}>
                    <StatusBadge status={t.paymentStatus === 'full-payment' ? 'Paid' : (t.paymentStatus === 'half-payment' ? 'Credit' : 'Loyalty')} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Right Column — Alerts */}
        <div style={{ background: '#fff', border: '1px solid #EBEBEB', borderRadius: '12px', overflow: 'hidden' }}>
          <div style={{ padding: '14px 18px', borderBottom: '1px solid #EBEBEB' }}>
            <span style={{ fontSize: '13px', fontWeight: 500, color: '#111' }}>Alerts</span>
          </div>
          {dashboardAlerts.map((alert, i) => (
            <div key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: '10px', padding: '12px 16px', borderBottom: '1px solid #F5F5F5' }}>
              <div style={{
                width: '30px', height: '30px', flexShrink: 0, border_radius: '8px',
                background: alert.type === 'stock' ? '#FCEBEB' : '#FAEEDA',
                color: alert.type === 'stock' ? '#A32D2D' : '#854F0B',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                font_size: '14px'
              }}>
                {alert.type === 'stock' ? <AlertTriangle size={14} /> : <Clock size={14} />}
              </div>
              <div>
                <p style={{ fontSize: '12px', color: '#333', margin: '0 0 3px', lineHeight: 1.4 }}>{alert.message}</p>
                <p style={{ fontSize: '11px', color: '#AAA', margin: '0' }}>{alert.time}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* 2D. BOTTOM ROW */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '16px' }}>
        
        {/* Left Card — Low Stock Parts */}
        <div style={{ background: '#fff', border: '1px solid #EBEBEB', borderRadius: '12px', overflow: 'hidden' }}>
          <div style={{ padding: '14px 18px', borderBottom: '1px solid #EBEBEB' }}>
            <span style={{ fontSize: '13px', fontWeight: 500, color: '#111' }}>Low Stock Parts</span>
          </div>
          {lowStockParts.slice(0, 5).map(p => (
            <div key={p.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 18px', borderBottom: '1px solid #F5F5F5' }}>
              <div>
                <div style={{ fontSize: '13px', color: '#111' }}>{p.name}</div>
                <div style={{ fontSize: '11px', color: '#AAA' }}>{p.partCode || 'SKU-00'+p.id}</div>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <div style={{ width: '80px', height: '4px', background: '#F5F5F5', borderRadius: '2px', position: 'relative' }}>
                  <div style={{
                    position: 'absolute', left: 0, top: 0, bottom: 0,
                    width: `${(p.stock / 10) * 100}%`,
                    background: p.stock <= 5 ? '#E24B4A' : '#EF9F27',
                    borderRadius: '2px'
                  }} />
                </div>
                <StatusBadge status={p.stock <= 5 ? 'Overdue' : 'Credit'} />
              </div>
            </div>
          ))}
        </div>

        {/* Right Card — Today's Appointments */}
        <div style={{ background: '#fff', border: '1px solid #EBEBEB', borderRadius: '12px', overflow: 'hidden' }}>
          <div style={{ padding: '14px 18px', borderBottom: '1px solid #EBEBEB' }}>
            <span style={{ fontSize: '13px', fontWeight: 500, color: '#111' }}>Today's Appointments</span>
          </div>
          {appointments.slice(0, 5).map(a => (
            <div key={a.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 18px', borderBottom: '1px solid #F5F5F5' }}>
              <div>
                <div style={{ fontSize: '13px', fontWeight: 500, color: '#111' }}>{a.customer?.name}</div>
                <div style={{ fontSize: '11px', color: '#AAA' }}>{a.vehicle?.make} {a.vehicle?.model} • {a.serviceType}</div>
              </div>
              <div style={{ textAlign: 'right' }}>
                <div style={{ fontSize: '12px', fontWeight: 500, color: '#111' }}>{a.appointmentTime}</div>
                <StatusBadge status={a.status === 0 ? 'Credit' : (a.status === 1 ? 'Loyalty' : 'Paid')} />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
