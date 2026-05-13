import React, { useState, useEffect } from 'react';
import { useToast } from '../context/ToastContext';
import CustomerVehicleForm from '../components/management/CustomerVehicleForm';
import VehicleForm from '../components/management/VehicleForm';
import Dialog from '../components/Dialog';

// New Components
import StaffLayout from '../components/staff/StaffLayout';
import MetricCard from '../components/staff/MetricCard';
import TransactionsTable from '../components/staff/TransactionsTable';
import AlertsPanel from '../components/staff/AlertsPanel';
import LowStockList from '../components/staff/LowStockList';
import AppointmentsList from '../components/staff/AppointmentsList';
import { ExportCustomerReportPdf } from "../utils/Pdf/CustomerReportPdf";

const DEFAULT_REPORT_FILTER = { period: 'daily', startDate: '', endDate: '' };

const isValidCustomDateRange = ({ startDate, endDate }) => {
  if (!startDate || !endDate) return false;
  return new Date(endDate) >= new Date(startDate);
};

const buildReportQuery = ({ period, startDate, endDate }) => {
  const params = new URLSearchParams();
  params.set('period', period);

  if (period === 'custom') {
    params.set('startDate', startDate);
    params.set('endDate', endDate);
  }

  return params.toString();
};

export function StaffDashboard({ view, setView, customers, parts, sales, onProcessSale, onRegisterCustomer }) {
  const showToast = useToast();
  const [selectedCustomerId, setSelectedCustomerId] = useState(null);
  const [appointments, setAppointments] = useState([]);
  const [partRequests, setPartRequests] = useState([]);
  const [isServiceLoading, setIsServiceLoading] = useState(false);

  // Fetch service data for the dashboard metrics and lists
  useEffect(() => {
    const fetchServiceData = async () => {
      setIsServiceLoading(true);
      try {
        const { apiFetch } = await import('../services/api');
        const [appts, reqs] = await Promise.all([
          apiFetch('/Service/appointments'),
          apiFetch('/Service/part-requests')
        ]);
        setAppointments(appts || []);
        setPartRequests(reqs || []);
      } catch (err) {
        console.error('Dashboard service fetch error:', err);
      } finally {
        setIsServiceLoading(false);
      }
    };
    fetchServiceData();
  }, []);

  const getPageTitle = () => {
    switch (view) {
      case 'sales': return 'Process New Sale';
      case 'invoices': return 'Invoice History';
      case 'customers': return 'Customer Directory';
      case 'customer-details': return 'Customer Details';
      case 'reports': return 'Financial Analytics';
      case 'orders': return 'Service Management';
      case 'register-customer': return 'Register Customer';
      case 'parts': return 'Parts Inventory';
      case 'history': return 'Activity History';
      default: return 'Dashboard Overview';
    }
  };

  const renderContent = () => {
    if (view === 'sales') return <ProcessSalePage customers={customers} parts={parts} onProcessSale={onProcessSale} onBack={() => setView('main')} />;
    if (view === 'invoices') return <InvoicesPage sales={sales} onBack={() => setView('main')} />;
    if (view === 'customers') return <CustomerSearchPage customers={customers} onSelectCustomer={(id) => { setSelectedCustomerId(id); setView('customer-details'); }} onBack={() => setView('main')} />;
    if (view === 'customer-details') return <CustomerDetailPage customerId={selectedCustomerId} onBack={() => setView('customers')} />;
    if (view === 'reports') return <ReportsPage onBack={() => setView('main')} />;
    if (view === 'orders') return <OrdersPage appointments={appointments} partRequests={partRequests} onBack={() => setView('main')} />;
    if (view === 'register-customer') return <RegisterCustomerPage onRegister={onRegisterCustomer} onBack={() => setView('main')} />;
    if (view === 'parts') return <InventoryPage parts={parts} onBack={() => setView('main')} />;
    if (view === 'history') return <HistoryPage sales={sales} onBack={() => setView('main')} />;

    // Main Dashboard View
    const lowStockParts = (parts || []).filter(p => p.stockLevel < 10).sort((a, b) => a.stockLevel - b.stockLevel);
    const todaySales = (sales || []).filter(s => new Date(s.date).toDateString() === new Date().toDateString());
    const totalTodayAmount = todaySales.reduce((sum, s) => sum + (s.total || 0), 0);
    
    const dashboardAlerts = [
      ...lowStockParts.slice(0, 2).map(p => ({ type: 'stock', text: `Low stock: ${p.name} (${p.stockLevel} units)`, time: 'Immediate' })),
      ...appointments.filter(a => a.status === 0).slice(0, 2).map(a => ({ type: 'credit', text: `New appointment: ${a.customer?.name}`, time: a.appointmentTime }))
    ];

    return (
      <>
        {/* Section A — Metric Cards */}
        <div className="section-metrics">
          <MetricCard label="Today's Sales" value={`Rs. ${totalTodayAmount.toFixed(2)}`} delta="12%" deltaType="pos" />
          <MetricCard label="Invoices Issued" value={sales.length} delta="5%" deltaType="pos" />
          <MetricCard label="Customers Served" value={customers.length} delta="2%" deltaType="pos" />
          <MetricCard label="Low Stock Alerts" value={lowStockParts.length} delta="3" deltaType="neg" />
        </div>

        {/* Section B — Two-column row */}
        <div className="content-row-2col">
          <TransactionsTable transactions={sales.slice(0, 6)} />
          <AlertsPanel alerts={dashboardAlerts} />
        </div>

        {/* Section C — Two-column row */}
        <div className="content-row-even">
          <LowStockList parts={lowStockParts.slice(0, 5)} />
          <AppointmentsList appointments={appointments.slice(0, 5)} />
        </div>
      </>
    );
  };

  return (
    <StaffLayout 
      activeView={view} 
      setView={setView} 
      pageTitle={getPageTitle()}
      onNewSale={() => setView('sales')}
      user={{ name: 'Staff User', role: 'Inventory Manager' }}
    >
      {renderContent()}
    </StaffLayout>
  );
}

// Sub-pages

function ProcessSalePage({ customers, parts, onProcessSale, onBack }) {
  const showToast = useToast();
  const [selectedCust, setSelectedCust] = useState('');
  const [selectedVehicle, setSelectedVehicle] = useState('');
  const [selectedPart, setSelectedPart] = useState('');
  const [quantity, setQuantity] = useState(1);
  const [cart, setCart] = useState([]);
  const [paymentStatus, setPaymentStatus] = useState('');

  // Get vehicles for selected customer
  const selectedCustomer = customers.find(c => c.id === parseInt(selectedCust));
  const customerVehicles = selectedCustomer?.vehicleInfo ? [selectedCustomer.vehicleInfo] : [];

  const handleAddToCart = () => {
    if (!selectedPart) return;
    const part = parts.find(p => p.id === parseInt(selectedPart));
    if (!part) return;
    if (part.stockLevel < quantity) return showToast('error', 'Insufficient stock!');

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
  
  const handleComplete = () => {
    if (!selectedCust) return showToast('error', 'Please select a customer.');
    if (!selectedVehicle) return showToast('error', 'Please select a vehicle.');
    if (cart.length === 0) return showToast('error', 'Cart is empty.');
    if (!paymentStatus) return showToast('error', 'Please select a payment status.');
    onProcessSale(selectedCust, cart, paymentStatus, parseInt(selectedVehicle));
    onBack();
  };

  return (
    <div className="dashboard-card" style={{ maxWidth: '700px', margin: 'auto', padding: '24px' }}>
      <button onClick={onBack} className="btn-small" style={{ marginBottom: '1rem' }}>← Back</button>
      <h2>New Sale Transaction</h2>
      <div style={{ marginTop: '1rem' }}>
        <label style={{ fontSize: '12px', color: '#64748b' }}>Select Customer</label>
        <select value={selectedCust} onChange={e => { setSelectedCust(e.target.value); setSelectedVehicle(''); }} style={{ width: '100%', padding: '8px', borderRadius: '8px', border: '0.5px solid #E5E5E5' }}>
          <option value="">Select...</option>
          {customers.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
        </select>
      </div>

      <div style={{ marginTop: '1rem' }}>
        <label style={{ fontSize: '12px', color: '#64748b' }}>Select Vehicle</label>
        <select value={selectedVehicle} onChange={e => setSelectedVehicle(e.target.value)} disabled={!selectedCust} style={{ width: '100%', padding: '8px', borderRadius: '8px', border: '0.5px solid #E5E5E5', opacity: !selectedCust ? 0.5 : 1, cursor: !selectedCust ? 'not-allowed' : 'pointer' }}>
          <option value="">Select...</option>
          {customerVehicles.map(v => <option key={v.id} value={v.id}>{v.plateNumber} - {v.make} {v.model}</option>)}
        </select>
      </div>
      <div style={{ marginTop: '1rem', display: 'flex', gap: '1rem' }}>
        <div style={{ flex: 2 }}>
          <label style={{ fontSize: '12px', color: '#64748b' }}>Add Part</label>
          <select value={selectedPart} onChange={e => setSelectedPart(e.target.value)} style={{ width: '100%', padding: '8px', borderRadius: '8px', border: '0.5px solid #E5E5E5' }}>
            <option value="">Choose Part...</option>
            {parts.map(p => <option key={p.id} value={p.id}>{p.name} ({p.stockLevel} in stock)</option>)}
          </select>
        </div>
        <div style={{ flex: 1 }}>
          <label style={{ fontSize: '12px', color: '#64748b' }}>Quantity</label>
          <input type="number" min="1" value={quantity} onChange={e => setQuantity(e.target.value)} style={{ width: '100%', padding: '8px', borderRadius: '8px', border: '0.5px solid #E5E5E5' }} />
        </div>
        <button onClick={handleAddToCart} className="btn-primary" style={{ marginTop: '1.5rem' }}>Add</button>
      </div>

      <div style={{ marginTop: '2rem' }}>
        <h3>Cart Summary</h3>
        {cart.map(item => (
          <div key={item.id} style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: '0.5px solid #E5E5E5' }}>
            <span>{item.name} x {item.quantity}</span>
            <span>Rs. {(item.price * item.quantity).toFixed(2)}</span>
          </div>
        ))}
        <div style={{ marginTop: '1rem', fontWeight: 500, fontSize: '18px', textAlign: 'right' }}>
          Total: Rs. {totalAmount.toFixed(2)}
        </div>
      </div>

      <div style={{ marginTop: '2rem' }}>
        <label style={{ fontSize: '12px', color: '#64748b' }}>Payment Type</label>
        <select value={paymentStatus} onChange={e => setPaymentStatus(e.target.value)} style={{ width: '100%', padding: '8px', borderRadius: '8px', border: '0.5px solid #E5E5E5' }}>
          <option value="">Select Status...</option>
          <option value="full-payment">Full Payment</option>
          <option value="half-payment">Half Payment (50%)</option>
          <option value="partial-payment">Partial Payment (10%)</option>
        </select>
      </div>

      <button onClick={handleComplete} disabled={!paymentStatus} className="btn-primary" style={{ width: '100%', marginTop: '2rem', padding: '12px' }}>
        Complete Sale
      </button>
    </div>
  );
}

function InvoicesPage({ sales: initialSales, onBack }) {
  const showToast = useToast();
  const [sales, setSales] = useState(initialSales || []);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    const fetchInvoices = async () => {
      setIsLoading(true);
      try {
        const { transactionsApi } = await import('../services/api');
        const data = await transactionsApi.getSales();
        if (data) setSales(data.map(s => ({ id: s.id, customerName: s.customerName, total: s.totalAmount, date: new Date(s.date).toLocaleDateString(), paymentStatus: s.paymentStatus })));
      } catch (err) { showToast('error', 'Unable to load invoices.'); }
      finally { setIsLoading(false); }
    };
    fetchInvoices();
  }, [showToast]);

  return (
    <div className="dashboard-card">
      <div className="card-header">
        <div className="card-title">Full Invoice History</div>
        <button onClick={onBack} className="btn-small">Back</button>
      </div>
      <div className="card-body">
        <TransactionsTable transactions={sales} />
      </div>
    </div>
  );
}

function CustomerSearchPage({ customers = [], onSelectCustomer, onBack }) {
  const [searchTerm, setSearchTerm] = useState('');
  const filtered = (customers || []).filter(c => 
    (c.name || '').toLowerCase().includes(searchTerm.toLowerCase()) || 
    (c.plate || '').toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="dashboard-card">
      <div className="card-header">
        <div className="card-title">Customer Directory</div>
        <div style={{ display: 'flex', gap: '10px', alignItems: 'center', flexWrap: 'wrap' }}>
          <input type="text" placeholder="Filter..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} style={{ padding: '6px 12px', borderRadius: '8px', border: '0.5px solid #E5E5E5', fontSize: '13px' }} />
          <button onClick={onBack} className="btn-small">Back</button>
        </div>
      </div>
      <div className="card-body">
        <table className="staff-table">
          <thead><tr><th>Name</th><th>Plate</th><th>Phone</th><th>Actions</th></tr></thead>
          <tbody>
            {filtered.map(c => (
              <tr key={c.id}>
                <td>{c.name}</td>
                <td>{c.plate}</td>
                <td>{c.phone}</td>
                <td><button onClick={() => onSelectCustomer(c.id)} className="btn-small">View</button></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function CustomerDetailPage({ customerId, onBack }) {
  const [customer, setCustomer] = useState(null);
  const [vehicles, setVehicles] = useState([]);
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      try {
        const { apiFetch } = await import('../services/api');
        const [custRes, vehiclesRes, historyRes] = await Promise.all([
          apiFetch(`/Customers/${customerId}`),
          apiFetch(`/Customers/${customerId}/vehicles`),
          apiFetch(`/Customers/${customerId}/history`),
        ]);
        setCustomer(custRes);
        setVehicles(vehiclesRes || []);
        setHistory(historyRes || []);
      } catch {}
      setLoading(false);
    };
    if (customerId) loadData();
  }, [customerId]);

  if (loading) return <div style={{ padding: '40px', textAlign: 'center' }}>Loading...</div>;
  if (!customer) return <div style={{ padding: '40px', textAlign: 'center' }}>Customer not found</div>;

  return (
    <div className="dashboard-card" style={{ padding: '24px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
        <h2>{customer.name}</h2>
        <button onClick={onBack} className="btn-small">Back</button>
      </div>
      <p style={{ color: '#64748b' }}>{customer.email} | {customer.phoneNumber}</p>
      
      <h3 style={{ marginTop: '2rem', borderBottom: '0.5px solid #E5E5E5', paddingBottom: '8px' }}>Registered Vehicles</h3>
      {vehicles.map(v => (
        <div key={v.id} className="list-row">
          <div className="row-left">
            <strong>{v.make} {v.model}</strong>
            <span style={{ fontSize: '11px', color: '#64748b' }}>Year: {v.year}</span>
          </div>
          <div className="row-right">
            <span className="badge badge-loyalty">{v.plateNumber}</span>
          </div>
        </div>
      ))}
      
      <h3 style={{ marginTop: '2rem', borderBottom: '0.5px solid #E5E5E5', paddingBottom: '8px' }}>Purchase History</h3>
      {history.map(inv => (
        <div key={inv.id} className="list-row">
          <div className="row-left">
            <strong>Invoice #{inv.id}</strong>
            <span style={{ fontSize: '11px', color: '#64748b' }}>{new Date(inv.date).toLocaleDateString()}</span>
          </div>
          <div className="row-right">
            <strong>Rs. {inv.totalAmount.toFixed(2)}</strong>
          </div>
        </div>
      ))}
    </div>
  );
}

function ReportsPage({ onBack }) {
  const showToast = useToast();
  const [reportType, setReportType] = useState('high-spenders');
  const [period, setPeriod] = useState('daily');
  const [customDateRange, setCustomDateRange] = useState({ startDate: '', endDate: '' });
  const [appliedReportFilter, setAppliedReportFilter] = useState(DEFAULT_REPORT_FILTER);
  const [data, setData] = useState([]);

  useEffect(() => {
    import('../services/api').then(({ apiFetch }) => {
      const query = buildReportQuery(appliedReportFilter);
      apiFetch(`/Reports/customers/${reportType}?${query}`).then(res => setData(res || []));
    });
  }, [reportType, appliedReportFilter]);

  const handlePeriodChange = (event) => {
    const nextPeriod = event.target.value;
    setPeriod(nextPeriod);

    if (nextPeriod !== 'custom') {
      setAppliedReportFilter({ period: nextPeriod, startDate: '', endDate: '' });
    }
  };

  const handleGenerateCustomReport = (event) => {
    event.preventDefault();

    if (!isValidCustomDateRange(customDateRange)) {
      showToast('error', 'Please select a valid date range.');
      return;
    }

    setAppliedReportFilter({
      period: 'custom',
      startDate: customDateRange.startDate,
      endDate: customDateRange.endDate
    });
  };

  return (
    <div className="dashboard-card">
      <div className="card-header report-section-header">
        <div className="card-title">Customer Reports</div>
        <div className="report-header-controls">
          <select value={reportType} onChange={e => setReportType(e.target.value)} className="report-period-select">
            <option value="high-spenders">High Spenders</option>
            <option value="regulars">Regulars</option>
            <option value="pending-credits">Pending Credits</option>
          </select>
          <button onClick={onBack} className="btn-small">Back</button>
        </div>
      </div>
      <form className="report-filter-panel report-filter-panel--staff" onSubmit={handleGenerateCustomReport}>
        <label>
          <span>Report Period</span>
          <select value={period} onChange={handlePeriodChange}>
            <option value="daily">Daily</option>
            <option value="monthly">Monthly</option>
            <option value="yearly">Yearly</option>
            <option value="custom">Custom Date Range</option>
          </select>
        </label>
        {period === 'custom' && (
          <>
            <label>
              <span>From Date</span>
              <input
                type="date"
                required
                value={customDateRange.startDate}
                onChange={(event) => setCustomDateRange((current) => ({ ...current, startDate: event.target.value }))}
              />
            </label>
            <label>
              <span>To Date</span>
              <input
                type="date"
                required
                min={customDateRange.startDate || undefined}
                value={customDateRange.endDate}
                onChange={(event) => setCustomDateRange((current) => ({ ...current, endDate: event.target.value }))}
              />
            </label>
            <button type="submit" className="report-generate-btn">Generate Report</button>
          </>
        )}
      </form>
      <div className="card-body">
        {data.map((item, i) => (
          <div key={i} className="list-row">
            <div className="row-left">
              <strong>{item.customerName}</strong>
              <span style={{ fontSize: '11px', color: '#64748b' }}>Customer ID: {item.customerId}</span>
            </div>
            <div className="row-right">
              <span style={{ color: 'var(--staff-primary)', fontWeight: 500 }}>
                {reportType === 'high-spenders' ? `Rs. ${item.totalSpent?.toFixed(2)}` : `${item.visitCount || item.unpaidInvoiceCount} records`}
              </span>
            </div>
          </div>
        ))}
      </div>
      <div className="report-export-actions report-export-actions--in-card">
        <button
          onClick={() =>
            ExportCustomerReportPdf(
              data,
              reportType,
              "Staff",
              appliedReportFilter
            )
          }
          className="report-export-btn report-export-btn--customer"
        >
          Export Customer Report PDF
        </button>
      </div>
    </div>
  );
}

function OrdersPage({ appointments, partRequests, onBack }) {
  const [activeTab, setActiveTab] = useState('appointments');

  return (
    <div className="dashboard-card">
      <div className="card-header">
        <div style={{ display: 'flex', gap: '1rem' }}>
          <button onClick={() => setActiveTab('appointments')} className={`nav-item ${activeTab === 'appointments' ? 'active' : ''}`} style={{ padding: '6px 12px' }}>Appointments</button>
          <button onClick={() => setActiveTab('requests')} className={`nav-item ${activeTab === 'requests' ? 'active' : ''}`} style={{ padding: '6px 12px' }}>Part Requests</button>
        </div>
        <button onClick={onBack} className="btn-small">Back</button>
      </div>
      <div className="card-body">
        {activeTab === 'appointments' ? (
          appointments.map(a => (
            <div key={a.id} className="list-row">
              <div className="row-left">
                <strong>{a.customer?.name}</strong>
                <span style={{ fontSize: '11px', color: '#64748b' }}>{a.serviceType}</span>
              </div>
              <div className="row-right">
                <span style={{ fontWeight: 500 }}>{a.appointmentTime}</span>
                <div style={{ fontSize: '10px', color: '#64748b' }}>{new Date(a.appointmentDate).toLocaleDateString()}</div>
              </div>
            </div>
          ))
        ) : (
          partRequests.map(r => (
            <div key={r.id} className="list-row">
              <div className="row-left">
                <strong>{r.partName}</strong>
                <span style={{ fontSize: '11px', color: '#64748b' }}>Request from {r.customer?.name}</span>
              </div>
              <div className="row-right">
                <span className={`badge ${r.isFulfilled ? 'badge-paid' : 'badge-overdue'}`}>{r.isFulfilled ? 'Fulfilled' : 'Pending'}</span>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

function InventoryPage({ parts, onBack }) {
  return (
    <div className="dashboard-card">
      <div className="card-header">
        <div className="card-title">Parts Inventory</div>
        <button onClick={onBack} className="btn-small">Back</button>
      </div>
      <div className="card-body">
        <table className="staff-table">
          <thead><tr><th>Part Name</th><th>Code</th><th>Category</th><th>Stock</th><th>Price</th></tr></thead>
          <tbody>
            {parts.map(p => (
              <tr key={p.id}>
                <td><strong>{p.name}</strong></td>
                <td>{p.partCode}</td>
                <td>{p.category}</td>
                <td>
                  <span className={`badge ${p.stockLevel < 10 ? 'badge-overdue' : 'badge-paid'}`}>{p.stockLevel}</span>
                </td>
                <td>Rs. {p.price?.toFixed(2)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <Dialog 
        isOpen={isAddingVehicle} 
        onClose={() => setIsAddingVehicle(false)} 
        title={`Add Vehicle for ${customer.name}`}
      >
        <VehicleForm 
          onSubmit={handleAddVehicle} 
          onCancel={() => setIsAddingVehicle(false)} 
          isSaving={isSavingVehicle} 
        />
      </Dialog>
    </div>
  );
}

function HistoryPage({ sales, onBack }) {
  return (
    <div className="dashboard-card">
      <div className="card-header">
        <div className="card-title">Activity History</div>
        <button onClick={onBack} className="btn-small">Back</button>
      </div>
      <div className="card-body">
        <TransactionsTable transactions={sales} />
      </div>
    </div>
  );
}

function RegisterCustomerPage({ onRegister, onBack }) {
  return (
    <div className="dashboard-card" style={{ padding: '24px', maxWidth: '600px', margin: 'auto' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
        <h2>Register New Customer</h2>
        <button onClick={onBack} className="btn-small">Back</button>
      </div>
      <CustomerVehicleForm onRegister={async (data) => { await onRegister(data); onBack(); }} />
    </div>
  );
}
