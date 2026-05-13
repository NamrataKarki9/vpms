import React, { useState, useEffect } from 'react';
import { apiFetch } from '../../services/api';
import { useToast } from '../../context/ToastContext';
import { Bell, TrendingUp, Users, AlertCircle, Send } from 'lucide-react';
import { ExportCustomerReportPdf } from '../../utils/Pdf/CustomerReportPdf';

const TAB_CONFIG = [
  { id: 'high-spenders', label: 'High Spenders', icon: TrendingUp, color: '#1D4ED8', bg: '#DBEAFE' },
  { id: 'regulars', label: 'Regulars', icon: Users, color: '#15803D', bg: '#DCFCE7' },
  { id: 'pending-credits', label: 'On Credit', icon: AlertCircle, color: '#B91C1C', bg: '#FEE2E2' },
];

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

const CustomerSegments = () => {
  const [activeTab, setActiveTab] = useState('high-spenders');
  const [period, setPeriod] = useState('daily');
  const [customDateRange, setCustomDateRange] = useState({ startDate: '', endDate: '' });
  const [appliedReportFilter, setAppliedReportFilter] = useState(DEFAULT_REPORT_FILTER);
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(false);
  const showToast = useToast();

  const fetchSegmentData = async (segment, reportFilter) => {
    setLoading(true);
    try {
      const query = buildReportQuery(reportFilter);
      const res = await apiFetch(`/Reports/customers/${segment}?${query}`);
      setData(res || []);
    } catch (err) {
      showToast('error', 'Failed to load report data.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchSegmentData(activeTab, appliedReportFilter); }, [activeTab, appliedReportFilter]);

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

  const handleSendReminder = async (customerId) => {
    try {
      await apiFetch('/Reports/send-unpaid-reminders', { method: 'POST' });
      showToast('success', 'Payment reminder sent.');
    } catch {
      showToast('error', 'Failed to send reminder.');
    }
  };

  const activeConfig = TAB_CONFIG.find(t => t.id === activeTab);

  const renderTable = () => {
    if (loading) return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', padding: '60px', gap: '16px', flexDirection: 'column' }}>
        <div className="spinner" />
        <span style={{ color: '#64748B', fontSize: '14px' }}>Loading report data...</span>
      </div>
    );
    if (!data.length) return (
      <div className="empty-state">
        <div className="empty-state-icon">📊</div>
        <h4>No Data Found</h4>
        <p>No customers in this segment yet.</p>
      </div>
    );

    if (activeTab === 'high-spenders') return (
      <table className="staff-table">
        <thead>
          <tr>
            <th>Rank</th>
            <th>Customer</th>
            <th>Total Spent</th>
            <th>Purchases</th>
            <th>Last Purchase</th>
          </tr>
        </thead>
        <tbody>
          {data.map((item, idx) => (
            <tr key={item.customerId || idx}>
              <td>
                <span style={{ background: idx < 3 ? '#FEF9C3' : '#F1F5F9', color: idx < 3 ? '#854D0E' : '#64748B', padding: '3px 10px', borderRadius: '12px', fontSize: '12px', fontWeight: 700 }}>
                  #{idx + 1}
                </span>
              </td>
              <td>
                <div style={{ fontWeight: 600, color: '#1E293B' }}>{item.customerName}</div>
              </td>
              <td><strong style={{ color: '#1E3A5F', fontSize: '14px' }}>Rs. {item.totalSpent?.toFixed(2)}</strong></td>
              <td>
                <span style={{ background: '#DBEAFE', color: '#1D4ED8', padding: '3px 10px', borderRadius: '12px', fontWeight: 700, fontSize: '12px' }}>
                  {item.orderCount || item.purchaseCount || 0} orders
                </span>
              </td>
              <td style={{ color: '#64748B', fontSize: '12px' }}>{item.lastVisit ? new Date(item.lastVisit).toLocaleDateString() : '—'}</td>
            </tr>
          ))}
        </tbody>
      </table>
    );

    if (activeTab === 'regulars') return (
      <table className="staff-table">
        <thead>
          <tr>
            <th>Customer</th>
            <th>Visit Count</th>
            <th>Avg Spend</th>
            <th>Last Seen</th>
          </tr>
        </thead>
        <tbody>
          {data.map((item, idx) => (
            <tr key={item.customerId || idx}>
              <td><strong style={{ color: '#1E293B' }}>{item.customerName}</strong></td>
              <td>
                <span style={{ background: '#DCFCE7', color: '#15803D', padding: '3px 10px', borderRadius: '12px', fontWeight: 700, fontSize: '12px' }}>
                  {item.visitCount || 0} visits
                </span>
              </td>
              <td style={{ fontWeight: 600, color: '#1E293B' }}>Rs. {item.avgSpend?.toFixed(2) || '0.00'}</td>
              <td style={{ color: '#64748B', fontSize: '12px' }}>{item.lastVisit ? new Date(item.lastVisit).toLocaleDateString() : '—'}</td>
            </tr>
          ))}
        </tbody>
      </table>
    );

    if (activeTab === 'pending-credits') return (
      <table className="staff-table">
        <thead>
          <tr>
            <th>Customer</th>
            <th>Phone</th>
            <th>Amount Due</th>
            <th>Due Since</th>
            <th>Action</th>
          </tr>
        </thead>
        <tbody>
          {data.map((item, idx) => (
            <tr key={item.customerId || idx}>
              <td><strong style={{ color: '#1E293B' }}>{item.customerName}</strong></td>
              <td style={{ color: '#64748B' }}>{item.customerPhone || '—'}</td>
              <td>
                <span style={{ fontWeight: 800, color: '#B91C1C', fontSize: '14px' }}>Rs. {item.totalPending?.toFixed(2)}</span>
              </td>
              <td style={{ color: '#64748B', fontSize: '12px' }}>{item.oldestInvoiceDate ? new Date(item.oldestInvoiceDate).toLocaleDateString() : '—'}</td>
              <td>
                <button className="btn-send-reminder" onClick={() => handleSendReminder(item.customerId)} style={{ display: 'inline-flex', alignItems: 'center', gap: '5px' }}>
                  <Send size={11} /> Remind
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    );
  };

  return (
    <div>
      {/* Page Header */}
      <div className="page-section-header" style={{ marginBottom: '24px' }}>
        <h2>Customer Reports</h2>
        <p>Analyze customer segments and manage credit collections</p>
      </div>

      <div className="staff-card">
        {/* Tab Header */}
        <div className="report-section-header" style={{ padding: '20px 22px', borderBottom: '1px solid #E8ECF0' }}>
          <div className="staff-tab-bar" style={{ flexWrap: 'wrap' }}>
            {TAB_CONFIG.map(tab => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  className={`staff-tab-btn ${activeTab === tab.id ? 'active' : ''}`}
                  onClick={() => setActiveTab(tab.id)}
                  style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}
                >
                  <Icon size={13} />
                  {tab.label}
                </button>
              );
            })}
          </div>
          {data.length > 0 && (
            <span style={{ background: activeConfig?.bg, color: activeConfig?.color, padding: '4px 12px', borderRadius: '12px', fontSize: '12px', fontWeight: 700 }}>
              {data.length} records
            </span>
          )}
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
        <div>{renderTable()}</div>
        <div className="report-export-actions report-export-actions--in-card">
          <button
            type="button"
            className="report-export-btn report-export-btn--customer"
            onClick={() => ExportCustomerReportPdf(data, activeTab, 'Staff', appliedReportFilter)}
          >
            Export Customer Report PDF
          </button>
        </div>
      </div>
    </div>
  );
};

export default CustomerSegments;
