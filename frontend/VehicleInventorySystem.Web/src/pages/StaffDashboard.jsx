import React, { useState, useEffect } from 'react';
import CustomerVehicleForm from '../components/management/CustomerVehicleForm';

export function StaffDashboard({ view, setView, customers, parts, sales, onProcessSale, onRegisterCustomer }) {

  if (view === 'sales') return <ProcessSalePage customers={customers} parts={parts} onProcessSale={onProcessSale} onBack={() => setView('main')} />;
  if (view === 'invoices') return <InvoicesPage sales={sales} onBack={() => setView('main')} />;
  if (view === 'customers') return <CustomerSearchPage onBack={() => setView('main')} />;
  if (view === 'reports') return <ReportsPage onBack={() => setView('main')} />;
  if (view === 'orders') return <OrdersPage onBack={() => setView('main')} />;
  if (view === 'register-customer') return <RegisterCustomerPage onRegister={onRegisterCustomer} onBack={() => setView('main')} />;

  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(350px, 1fr))', gap: '2rem', alignItems: 'start' }}>
      {/* Dashboard Overview Cards */}
      <div className="card" id="sales">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
           <h3>Process Sale</h3>
           <button className="btn-small" onClick={() => setView('sales')}>Open Full View</button>
        </div>
        <p style={{ opacity: 0.6, fontSize: '0.9rem' }}>Generate new invoices and handle customer transactions.</p>
        <button onClick={() => setView('sales')} style={{ width: '100%', marginTop: '1rem' }}>Go to Sale Entry</button>
      </div>

      <div className="card">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
           <h3>Recent Invoices</h3>
           <button className="btn-small" onClick={() => setView('invoices')}>View All</button>
        </div>
        <div style={{ marginTop: '1rem' }}>
          {sales.slice(0, 3).map(s => (
            <div key={s.id} className="list-item" style={{ fontSize: '0.85rem', marginBottom: '0.5rem' }}>
              <span>{s.customerName}</span>
              <span>Rs. {s.total.toFixed(2)}</span>
            </div>
          ))}
          {sales.length === 0 && <p style={{opacity: 0.5}}>No recent activity.</p>}
        </div>
      </div>

      <div className="card" id="customers">
        <h3>Customer Analytics & Search</h3>
        <p style={{ opacity: 0.6, fontSize: '0.85rem' }}>Search by plate, phone, or name.</p>
        <div style={{ position: 'relative', marginTop: '1rem' }}>
          <input 
            type="text" 
            placeholder="Quick lookup..." 
            onChange={(e) => {
               if (e.target.value.length > 2) setView('customers');
            }}
            style={{ marginBottom: 0, paddingRight: '2.5rem' }} 
          />
          <span style={{ position: 'absolute', right: '12px', top: '10px', opacity: 0.5 }}>🔍</span>
        </div>
        <button onClick={() => setView('customers')} className="btn-small" style={{ width: '100%', marginTop: '1rem', background: 'transparent', border: '1px solid var(--primary)', color: 'var(--primary)' }}>Open Full Search Engine</button>
      </div>

      <div className="card" id="register">
        <h3>Register New Customer</h3>
        <p style={{ opacity: 0.6, fontSize: '0.9rem' }}>Add customer details and vehicle information.</p>
        <button onClick={() => setView('register-customer')} style={{ width: '100%', marginTop: '1rem' }}>Register Customer</button>
      </div>

      <div className="card" id="reports">
        <h3>Customer Reports</h3>
        <p style={{ opacity: 0.6, fontSize: '0.9rem' }}>View high-spenders, regular visitors, and unpaid reminders.</p>
        <button onClick={() => setView('reports')} style={{ width: '100%', marginTop: '1rem' }}>Generate Reports</button>
      </div>

      <div className="card" id="orders">
        <h3>New Orders</h3>
        <p style={{ opacity: 0.6, fontSize: '0.9rem' }}>Manage incoming part requests and service orders.</p>
        <button onClick={() => setView('orders')} style={{ width: '100%', marginTop: '1rem' }}>View Pending Orders</button>
      </div>
    </div>
  );
}

function ProcessSalePage({ customers, parts, onProcessSale, onBack }) {
  const [selectedCust, setSelectedCust] = useState('');
  const [selectedPart, setSelectedPart] = useState('');
  const [quantity, setQuantity] = useState(1);
  const [cart, setCart] = useState([]);
  const [paymentStatus, setPaymentStatus] = useState('');

  const handleAddToCart = () => {
    if (!selectedPart) return;
    const part = parts.find(p => p.id === parseInt(selectedPart));
    if (!part) return;
    if (part.stock < quantity) return alert('Insufficient stock!');

    const existing = cart.find(c => c.id === part.id);
    if (existing) {
      setCart(cart.map(c => c.id === part.id ? { ...c, quantity: c.quantity + parseInt(quantity) } : c));
    } else {
      setCart([...cart, { ...part, quantity: parseInt(quantity) }]);
    }
    setSelectedPart('');
    setQuantity(1);
  };

  const handleRemove = (id) => setCart(cart.filter(c => c.id !== id));

  const totalAmount = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  
  const getAmountPaid = () => {
    switch(paymentStatus) {
      case 'full-payment':
        return totalAmount;
      case 'half-payment':
        return totalAmount / 2;
      case 'partial-payment':
        return totalAmount * 0.1; // 10% of total
      default:
        return 0;
    }
  };

  const amountPaid = getAmountPaid();
  const remainingAmount = totalAmount - amountPaid;

  const handleComplete = () => {
    if (!selectedCust) return alert('Please select a customer.');
    if (cart.length === 0) return alert('Cart is empty.');
    if (!paymentStatus) return alert('Please select a payment status.');
    onProcessSale(selectedCust, cart, paymentStatus);
    onBack();
  };

  return (
    <div className="card" style={{ maxWidth: '700px', margin: 'auto' }}>
      <button onClick={onBack} className="btn-small" style={{ marginBottom: '1rem', background: '#cbd5e1', color: '#0f172a' }}>← Back to Dashboard</button>
      <h2>Process New Sale</h2>
      
      <div className="mini-form" style={{ marginTop: '2rem', background: '#f8fafc', padding: '1.5rem', borderRadius: '12px' }}>
        <label>1. Select Customer</label>
        <select value={selectedCust} onChange={e => setSelectedCust(e.target.value)}>
          <option value="">Select Customer</option>
          {customers.map(c => <option key={c.id} value={c.id}>{c.name} - {c.plate}</option>)}
        </select>
      </div>

      <div className="mini-form" style={{ marginTop: '1.5rem', border: '2px dashed #e2e8f0', padding: '1.5rem', borderRadius: '12px' }}>
        <label>2. Add Items to Cart</label>
        <div style={{ display: 'flex', gap: '1rem' }}>
          <select style={{ flex: 2 }} value={selectedPart} onChange={e => setSelectedPart(e.target.value)}>
            <option value="">{parts.length > 0 ? 'Select Part' : 'No parts available'}</option>
            {parts.map(p => <option key={p.id} value={p.id}>{p.name} (Stock: {p.stock})</option>)}
          </select>
          <input style={{ flex: 1 }} type="number" min="1" value={quantity} onChange={e => setQuantity(e.target.value)} placeholder="Qty" />
          <button 
            onClick={handleAddToCart} 
            className="btn-small" 
            style={{ background: '#10b981', color: '#fff', display: 'flex', alignItems: 'center', gap: '5px', padding: '0.8rem 1.2rem' }}
          >
            <span>🛒</span> Add to Cart
          </button>
        </div>
      </div>

      <div style={{ marginTop: '2rem' }}>
        <h3>Cart Summary</h3>
        <div className="data-list" style={{ minHeight: '100px', background: '#fff', border: '1px solid #e2e8f0' }}>
          {cart.map(item => (
            <div key={item.id} className="list-item" style={{ fontSize: '0.9rem' }}>
              <div>
                <strong>{item.name}</strong>
                <div style={{ opacity: 0.6 }}>{item.quantity} x Rs. {item.price}</div>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                <strong>Rs. {item.quantity * item.price}</strong>
                <button onClick={() => handleRemove(item.id)} className="btn-small" style={{ background: '#fee2e2', color: '#991b1b', padding: '2px 8px' }}>×</button>
              </div>
            </div>
          ))}
          {cart.length === 0 && <p style={{ opacity: 0.5, textAlign: 'center', padding: '1rem' }}>No items in cart.</p>}
        </div>
        
        <div style={{ marginTop: '1.5rem', padding: '1rem', background: 'var(--primary)', color: '#fff', borderRadius: '8px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span style={{ fontSize: '1.1rem', fontWeight: 600 }}>Total Amount:</span>
          <span style={{ fontSize: '1.5rem', fontWeight: 800 }}>Rs. {totalAmount.toFixed(2)}</span>
        </div>
      </div>

      <div className="mini-form" style={{ marginTop: '2rem', background: '#f8fafc', padding: '1.5rem', borderRadius: '12px' }}>
        <label>3. Select Payment Status</label>
        <select 
          value={paymentStatus} 
          onChange={e => setPaymentStatus(e.target.value)}
        >
          <option value="">Choose Payment Type</option>
          <option value="full-payment">Full Payment (100%)</option>
          <option value="half-payment">Half Payment (50%)</option>
          <option value="partial-payment">Partial Payment (10%)</option>
        </select>
      </div>

      {paymentStatus && (
        <div style={{ marginTop: '2rem', padding: '1.5rem', background: '#f0f9ff', border: '2px solid #0ea5e9', borderRadius: '12px' }}>
          <h3 style={{ marginTop: 0, color: '#0369a1' }}>📋 Invoice Preview</h3>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem', paddingBottom: '1rem', borderBottom: '1px solid #bae6fd' }}>
            <span style={{ fontSize: '0.9rem', opacity: 0.8 }}>Total Bill Amount:</span>
            <span style={{ fontWeight: 700, fontSize: '1.1rem' }}>Rs. {totalAmount.toFixed(2)}</span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem', padding: '0.75rem', background: '#dcfce7', borderRadius: '8px' }}>
            <span style={{ fontSize: '0.9rem', fontWeight: 500 }}>💚 Amount Paid:</span>
            <span style={{ fontWeight: 700, fontSize: '1.1rem', color: '#15803d' }}>Rs. {amountPaid.toFixed(2)}</span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.75rem', background: '#fee2e2', borderRadius: '8px' }}>
            <span style={{ fontSize: '0.9rem', fontWeight: 500 }}>⏳ Remaining Balance:</span>
            <span style={{ fontWeight: 700, fontSize: '1.1rem', color: '#991b1b' }}>Rs. {remainingAmount.toFixed(2)}</span>
          </div>
          <div style={{ marginTop: '1rem', fontSize: '0.85rem', opacity: 0.7 }}>
            <strong>Payment Type:</strong> {paymentStatus === 'full-payment' ? 'Full Payment' : paymentStatus === 'half-payment' ? 'Half Payment (50%)' : 'Partial Payment (10%)'}
          </div>
        </div>
      )}

      <button 
        onClick={handleComplete} 
        disabled={!paymentStatus || cart.length === 0}
        style={{ marginTop: '1.5rem', width: '100%', background: !paymentStatus || cart.length === 0 ? '#cbd5e1' : '#10b981', color: '#fff', fontWeight: 600, fontSize: '1.1rem', padding: '1rem', cursor: !paymentStatus || cart.length === 0 ? 'not-allowed' : 'pointer', opacity: !paymentStatus || cart.length === 0 ? 0.6 : 1 }}
      >
        {!paymentStatus ? 'Select Payment Status First' : 'Finalize Transaction & Generate Invoice'}
      </button>
    </div>
  );
}

function InvoicesPage({ sales, onBack }) {
  const handleEmailInvoice = async (invoiceId) => {
    try {
      const { apiFetch } = await import('../services/api');
      await apiFetch(`/Transactions/${invoiceId}/email`, { method: 'POST' });
      alert(`Invoice #${invoiceId} has been successfully emailed.`);
    } catch(err) { alert('Email failed.'); }
  };

  return (
    <div className="card" style={{ maxWidth: '900px', margin: 'auto' }}>
      <button onClick={onBack} className="btn-small" style={{ marginBottom: '1rem', background: '#cbd5e1', color: '#0f172a' }}>← Back</button>
      <h2>Full Invoice History</h2>
      <div className="data-list" style={{ marginTop: '2rem' }}>
        {sales.map(s => (
          <div key={s.id} className="list-item">
            <div style={{ display: 'flex', gap: '2rem', alignItems: 'center' }}>
               <span style={{ fontWeight: 700, minWidth: '80px' }}>#{s.id}</span>
               <div style={{ display: 'flex', flexDirection: 'column' }}>
                  <strong>{s.customerName}</strong>
                  <span style={{ fontSize: '0.8rem', opacity: 0.6 }}>{s.date}</span>
               </div>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '2rem' }}>
               <span className="badge">Rs. {s.total.toFixed(2)}</span>
               <button onClick={() => handleEmailInvoice(s.id)} className="btn-small">Email PDF</button>
            </div>
          </div>
        ))}
        {sales.length === 0 && <p style={{textAlign: 'center', padding: '3rem', opacity: 0.5}}>No invoices found in database.</p>}
      </div>
    </div>
  );
}

function CustomerSearchPage({ onBack }) {
  const [searchTerm, setSearchTerm] = useState('');
  const [searchResults, setSearchResults] = useState(null);

  const handleSearch = async () => {
    if (!searchTerm) return;
    try {
      const { apiFetch } = await import('../services/api');
      const results = await apiFetch(`/Customers/search?query=${encodeURIComponent(searchTerm)}`);
      setSearchResults(results || []);
    } catch(err) { alert('Search failed.'); }
  };

  return (
    <div className="card" style={{ maxWidth: '800px', margin: 'auto' }}>
      <button onClick={onBack} className="btn-small" style={{ marginBottom: '1rem', background: '#cbd5e1', color: '#0f172a' }}>← Back</button>
      <h2>Customer Analytics & Global Search</h2>
      <div className="mini-form" style={{ flexDirection: 'row', marginTop: '2rem' }}>
        <input type="text" placeholder="Search by Plate, Phone, or Name..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} style={{ marginBottom: 0 }} />
        <button onClick={handleSearch} style={{ whiteSpace: 'nowrap' }}>Execute Search</button>
      </div>
      
      {searchResults && (
        <div className="data-list" style={{ marginTop: '2rem' }}>
          <h3>Search Results ({searchResults.length})</h3>
          {searchResults.map(c => (
            <div key={c.id} className="list-item">
              <div>
                <strong>{c.name}</strong>
                <div style={{ fontSize: '0.8rem', opacity: 0.6 }}>{c.email}</div>
              </div>
              <span className="badge">{c.vehicles && c.vehicles.length > 0 ? c.vehicles[0].plateNumber : 'No Vehicle'}</span>
            </div>
          ))}
          {searchResults.length === 0 && <p style={{opacity: 0.5}}>No matching customer found.</p>}
        </div>
      )}
    </div>
  );
}

function ReportsPage({ onBack }) {
  const [reportType, setReportType] = useState('high-spenders');
  const [reportData, setReportData] = useState([]);

  useEffect(() => {
    setReportData([]);
    import('../services/api').then(({ apiFetch }) => {
      apiFetch(`/Reports/customers/${reportType}`).then(res => {
        if (res) setReportData(res);
      });
    });
  }, [reportType]);

  const handleSendReminders = async () => {
    try {
      const { apiFetch } = await import('../services/api');
      const res = await apiFetch('/Reports/send-unpaid-reminders', { method: 'POST' });
      alert(res.message || 'Reminders sent.');
    } catch(err) { alert('Failed.'); }
  };

  const reportConfig = {
    'high-spenders': {
      title: 'High Spenders',
      subtitle: 'Customers who spent the most',
      color: '#10b981',
      bgColor: 'rgba(16, 185, 129, 0.08)',
      borderColor: 'rgba(16, 185, 129, 0.25)',
      mainLabel: (item) => `Rs. ${item.totalSpent?.toFixed(2) || '0.00'}`,
      extraInfo: (item) => `${item.purchaseCount} purchase${item.purchaseCount !== 1 ? 's' : ''}`
    },
    'regulars': {
      title: 'Regular Customers',
      subtitle: 'Frequent buyers',
      color: '#3b82f6',
      bgColor: 'rgba(59, 130, 246, 0.08)',
      borderColor: 'rgba(59, 130, 246, 0.25)',
      mainLabel: (item) => `${item.visitCount} visit${item.visitCount !== 1 ? 's' : ''}`,
      extraInfo: null
    },
    'pending-credits': {
      title: 'Pending Credits',
      subtitle: 'Unpaid balances',
      color: '#ef4444',
      bgColor: 'rgba(239, 68, 68, 0.08)',
      borderColor: 'rgba(239, 68, 68, 0.25)',
      mainLabel: (item) => `Rs. ${item.totalPending?.toFixed(2) || '0.00'}`,
      extraInfo: (item) => `${item.unpaidInvoiceCount} unpaid invoice${item.unpaidInvoiceCount !== 1 ? 's' : ''}`
    }
  };

  const config = reportConfig[reportType];

  return (
    <div className="card" style={{ maxWidth: '900px', margin: 'auto' }}>
      <button onClick={onBack} className="btn-small" style={{ marginBottom: '1rem', background: '#cbd5e1', color: '#0f172a' }}>← Back</button>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h2 style={{ margin: 0 }}>{config.title}</h2>
          <p style={{ opacity: 0.6, fontSize: '0.85rem', marginTop: '0.25rem', marginBottom: 0 }}>{config.subtitle}</p>
        </div>
        <select value={reportType} onChange={e => setReportType(e.target.value)} style={{ width: 'auto', marginBottom: 0 }}>
          <option value="high-spenders">High Spenders</option>
          <option value="regulars">Regular Customers</option>
          <option value="pending-credits">Pending Credits</option>
        </select>
      </div>
      
      <div style={{ marginTop: '2rem' }}>
        {reportData.map((item, i) => (
          <div key={i} style={{
            display: 'flex', justifyContent: 'space-between', alignItems: 'center',
            padding: '1rem 1.25rem', marginBottom: '0.75rem',
            background: config.bgColor, borderRadius: '10px',
            borderLeft: `4px solid ${config.color}`,
            borderTop: `1px solid ${config.borderColor}`,
            borderRight: `1px solid ${config.borderColor}`,
            borderBottom: `1px solid ${config.borderColor}`
          }}>
            <div>
              <div style={{ fontWeight: 700, fontSize: '1rem' }}>{item.customerName}</div>
              <div style={{ fontSize: '0.8rem', opacity: 0.55, marginTop: '2px' }}>
                {item.customerPhone || ''}
              </div>
            </div>
            <div style={{ textAlign: 'right' }}>
              <div style={{ fontWeight: 700, color: config.color, fontSize: '1.05rem' }}>
                {config.mainLabel(item)}
              </div>
              {config.extraInfo && (
                <div style={{ fontSize: '0.8rem', opacity: 0.55, marginTop: '2px' }}>
                  {config.extraInfo(item)}
                </div>
              )}
            </div>
          </div>
        ))}
        {reportData.length === 0 && (
          <div style={{ textAlign: 'center', padding: '3rem 1rem', opacity: 0.5 }}>
            <p style={{ margin: 0 }}>No data available for this report.</p>
          </div>
        )}
      </div>

      {reportType === 'pending-credits' && (
        <div style={{ marginTop: '3rem', padding: '2rem', background: 'rgba(239, 68, 68, 0.05)', borderRadius: '12px', border: '1px solid rgba(239, 68, 68, 0.2)' }}>
          <h3>Urgent Actions</h3>
          <p style={{ opacity: 0.7, marginBottom: '1rem' }}>Send automated email reminders to all customers with unpaid balances (F15 System Task).</p>
          <button onClick={handleSendReminders} style={{ background: 'var(--error)' }}>Send All Unpaid Reminders</button>
        </div>
      )}
    </div>
  );
}

function OrdersPage({ onBack }) {
  return (
    <div className="card" style={{ maxWidth: '800px', margin: 'auto' }}>
      <button onClick={onBack} className="btn-small" style={{ marginBottom: '1rem', background: '#cbd5e1', color: '#0f172a' }}>← Back</button>
      <h2>Inventory & Pending Orders</h2>
      <div style={{ padding: '4rem', textAlign: 'center' }}>
        <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>📦</div>
        <p style={{ opacity: 0.5 }}>The order management module is initializing...</p>
        <button className="btn-small" style={{ marginTop: '1rem' }} disabled>Fetch Latest Updates</button>
      </div>
    </div>
  );
}

function RegisterCustomerPage({ onRegister, onBack }) {
  return (
    <div style={{ maxWidth: '600px', margin: 'auto' }}>
      <button onClick={onBack} className="btn-small">← Back to Dashboard</button>
      <h2 style={{ marginTop: '1rem', marginBottom: '2rem' }}>Register New Customer</h2>
      <CustomerVehicleForm 
        onRegister={async (data) => { 
          const savedCustomer = await onRegister(data); 
          if(savedCustomer) {
            alert(`Customer ${data.name} registered successfully!`);
            onBack();
          }
        }} 
      />
    </div>
  );
}
