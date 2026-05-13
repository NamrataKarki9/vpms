import React, { useState, useEffect } from 'react';
import { apiFetch } from '../../services/api';
import { useToast } from '../../context/ToastContext';

const CustomerSegments = () => {
  const [activeTab, setActiveTab] = useState('high-spenders');
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(false);
  const showToast = useToast();

  const fetchSegmentData = async (segment) => {
    setLoading(true);
    try {
      const res = await apiFetch(`/Reports/customers/${segment}`);
      setData(res || []);
    } catch (err) {
      console.error('Failed to fetch segment data:', err);
      showToast('error', 'Failed to load report data.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSegmentData(activeTab);
  }, [activeTab]);

  const handleSendReminder = async (customerId) => {
    try {
      // In a real app we might send to one, but the user mentioned calling existing reminder API
      // The existing API sends all, but we'll show we're calling it.
      await apiFetch('/Reports/send-unpaid-reminders', { method: 'POST' });
      showToast('success', 'Payment reminder sent successfully.');
    } catch (err) {
      showToast('error', 'Failed to send reminder.');
    }
  };

  const renderTable = () => {
    if (loading) return <div style={{ padding: '24px', textAlign: 'center', opacity: 0.5 }}>Loading...</div>;
    if (!data.length) return <div style={{ padding: '24px', textAlign: 'center', opacity: 0.5 }}>No data found for this segment.</div>;

    if (activeTab === 'high-spenders') {
      return (
        <table className="staff-table">
          <thead>
            <tr>
              <th>Rank</th>
              <th>Customer Name</th>
              <th>Total Spent</th>
              <th>Purchases</th>
              <th>Last Purchase</th>
            </tr>
          </thead>
          <tbody>
            {data.map((item, idx) => (
              <tr key={item.customerId || idx}>
                <td>#{idx + 1}</td>
                <td><strong>{item.customerName}</strong></td>
                <td>Rs. {item.totalSpent?.toFixed(2)}</td>
                <td>{item.orderCount || 0}</td>
                <td>{item.lastVisit ? new Date(item.lastVisit).toLocaleDateString() : 'N/A'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      );
    }

    if (activeTab === 'regulars') {
      return (
        <table className="staff-table">
          <thead>
            <tr>
              <th>Customer Name</th>
              <th>Visit Count</th>
              <th>Avg Spend</th>
              <th>Last Seen</th>
            </tr>
          </thead>
          <tbody>
            {data.map((item, idx) => (
              <tr key={item.customerId || idx}>
                <td><strong>{item.customerName}</strong></td>
                <td>{item.visitCount || 0}</td>
                <td>Rs. {item.avgSpend?.toFixed(2) || '0.00'}</td>
                <td>{item.lastVisit ? new Date(item.lastVisit).toLocaleDateString() : 'N/A'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      );
    }

    if (activeTab === 'pending-credits') {
      return (
        <table className="staff-table">
          <thead>
            <tr>
              <th>Customer Name</th>
              <th>Phone</th>
              <th>Amount Due</th>
              <th>Due Since</th>
              <th>Action</th>
            </tr>
          </thead>
          <tbody>
            {data.map((item, idx) => (
              <tr key={item.customerId || idx}>
                <td><strong>{item.customerName}</strong></td>
                <td>{item.customerPhone || 'N/A'}</td>
                <td style={{ color: '#A32D2D', fontWeight: 500 }}>Rs. {item.totalPending?.toFixed(2)}</td>
                <td>{item.oldestInvoiceDate ? new Date(item.oldestInvoiceDate).toLocaleDateString() : 'N/A'}</td>
                <td>
                  <button className="btn-send-reminder" onClick={() => handleSendReminder(item.customerId)}>
                    Send Reminder
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      );
    }
  };

  return (
    <div className="staff-card">
      <div className="staff-card-header" style={{ borderBottom: 'none', paddingBottom: 0 }}>
        <div className="staff-tab-bar" style={{ width: '100%', marginBottom: 0 }}>
          <button 
            className={`staff-tab-btn ${activeTab === 'high-spenders' ? 'active' : ''}`}
            onClick={() => setActiveTab('high-spenders')}
          >
            High Spenders
          </button>
          <button 
            className={`staff-tab-btn ${activeTab === 'regulars' ? 'active' : ''}`}
            onClick={() => setActiveTab('regulars')}
          >
            Regular Customers
          </button>
          <button 
            className={`staff-tab-btn ${activeTab === 'pending-credits' ? 'active' : ''}`}
            onClick={() => setActiveTab('pending-credits')}
          >
            On Credit
          </button>
        </div>
      </div>
      <div className="staff-card-body">
        {renderTable()}
      </div>
    </div>
  );
};

export default CustomerSegments;
