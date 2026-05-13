import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useToast } from '../../context/ToastContext';
import { apiFetch } from '../../services/api';
import { Mail, Eye, FileText } from 'lucide-react';

const getPaymentBadge = (status) => {
  if (status === 'full-payment')    return { label: 'Paid',    cls: 'badge-paid'    };
  if (status === 'half-payment')    return { label: 'Credit',  cls: 'badge-credit'  };
  if (status === 'partial-payment') return { label: 'Overdue', cls: 'badge-overdue' };
  return { label: status || 'N/A', cls: 'badge-pending' };
};

const TransactionsTable = ({ transactions = [] }) => {
  const showToast  = useToast();
  const navigate   = useNavigate();
  const [emailingId, setEmailingId] = useState(null);

  const handleEmail = async (id, e) => {
    e.stopPropagation();
    setEmailingId(id);
    try {
      await apiFetch(`/Transactions/${id}/email`, { method: 'POST' });
      showToast('success', `Invoice #${id} sent to customer email.`);
    } catch {
      showToast('error', 'Failed to send email.');
    } finally {
      setEmailingId(null);
    }
  };

  return (
    <table className="staff-table">
      <thead>
        <tr>
          <th>Invoice</th>
          <th>Customer</th>
          <th>Date</th>
          <th>Amount</th>
          <th>Status</th>
          <th>Actions</th>
        </tr>
      </thead>
      <tbody>
        {transactions.map(t => {
          const { label, cls } = getPaymentBadge(t.paymentStatus);
          return (
            <tr
              key={t.id}
              style={{ cursor: 'pointer' }}
              onClick={() => navigate(`/staff/invoices/${t.id}`)}
            >
              <td>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <div style={{ width: 30, height: 30, borderRadius: '7px', background: '#EBF2FB', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                    <FileText size={13} color="#1E3A5F" />
                  </div>
                  <span style={{ fontWeight: 700, color: '#1E3A5F', fontSize: '13px' }}>#{t.id}</span>
                </div>
              </td>
              <td>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <div style={{ width: 30, height: 30, borderRadius: '50%', background: 'linear-gradient(135deg,#1E3A5F,#2563A8)', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '11px', fontWeight: 700, flexShrink: 0 }}>
                    {(t.customerName || 'U')[0].toUpperCase()}
                  </div>
                  <div>
                    <div style={{ fontWeight: 600, fontSize: '13px', color: '#1E293B' }}>{t.customerName}</div>
                    <div style={{ fontSize: '11px', color: '#94A3B8' }}>ID: {t.id}</div>
                  </div>
                </div>
              </td>
              <td style={{ color: '#64748B', fontSize: '13px' }}>{t.date}</td>
              <td><strong style={{ fontSize: '13.5px', color: '#1E293B' }}>Rs. {(parseFloat(t.total) || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}</strong></td>
              <td><span className={`badge-pill ${cls}`}>{label}</span></td>
              <td onClick={e => e.stopPropagation()}>
                <div style={{ display: 'flex', gap: '6px' }}>
                  <button
                    onClick={e => handleEmail(t.id, e)}
                    disabled={emailingId === t.id}
                    style={{
                      display: 'inline-flex', alignItems: 'center', gap: '4px',
                      padding: '4px 10px', borderRadius: '6px',
                      border: '1px solid #E2E8F0',
                      background: emailingId === t.id ? '#F1F5F9' : '#fff',
                      color: '#1E3A5F', cursor: emailingId === t.id ? 'not-allowed' : 'pointer',
                      fontSize: '11px', fontWeight: 600, transition: 'all 0.15s',
                    }}
                    onMouseEnter={e => { if (emailingId !== t.id) e.currentTarget.style.background = '#EBF2FB'; }}
                    onMouseLeave={e => { e.currentTarget.style.background = emailingId === t.id ? '#F1F5F9' : '#fff'; }}
                  >
                    <Mail size={11} />
                    {emailingId === t.id ? '...' : 'Email'}
                  </button>
                  <button
                    onClick={() => navigate(`/staff/invoices/${t.id}`)}
                    style={{
                      display: 'inline-flex', alignItems: 'center', gap: '4px',
                      padding: '4px 10px', borderRadius: '6px',
                      border: '1px solid #E2E8F0', background: '#fff',
                      color: '#64748B', cursor: 'pointer',
                      fontSize: '11px', fontWeight: 600, transition: 'all 0.15s',
                    }}
                    onMouseEnter={e => { e.currentTarget.style.background = '#F1F5F9'; }}
                    onMouseLeave={e => { e.currentTarget.style.background = '#fff'; }}
                  >
                    <Eye size={11} /> View
                  </button>
                </div>
              </td>
            </tr>
          );
        })}
        {transactions.length === 0 && (
          <tr>
            <td colSpan="6">
              <div className="empty-state">
                <div className="empty-state-icon">📋</div>
                <h4>No Transactions</h4>
                <p>Recent sales will appear here.</p>
              </div>
            </td>
          </tr>
        )}
      </tbody>
    </table>
  );
};

export default TransactionsTable;
