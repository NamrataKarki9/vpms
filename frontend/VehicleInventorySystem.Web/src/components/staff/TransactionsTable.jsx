import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useToast } from '../../context/ToastContext';
import { apiFetch } from '../../services/api';
import { Mail, Eye, FileText } from 'lucide-react';

const getPaymentBadge = (status) => {
  if (status === 'full-payment') return { label: 'Paid', cls: 'badge-paid' };
  if (status === 'half-payment') return { label: 'Credit', cls: 'badge-credit' };
  if (status === 'partial-payment') return { label: 'Overdue', cls: 'badge-overdue' };
  return { label: status || 'N/A', cls: 'badge-pending' };
};

const getTransactionId = (transaction) =>
  transaction?.id ??
  transaction?.invoiceId ??
  transaction?.invoiceNo ??
  transaction?.invoiceNumber ??
  transaction?.transactionId ??
  '';

const getTransactionKey = (transaction, index) => {
  const id = getTransactionId(transaction);
  return id || `${transaction?.invoiceNumber || transaction?.date || 'transaction'}-${transaction?.customerName || transaction?.vendorName || 'unknown'}-${index}`;
};

const TransactionsTable = ({ transactions = [] }) => {
  const showToast = useToast();
  const navigate = useNavigate();
  const [emailingId, setEmailingId] = useState(null);

  const handleView = (transaction) => {
    const id = getTransactionId(transaction);
    if (!id) {
      showToast('error', 'This transaction cannot be opened because it has no invoice ID.');
      return;
    }

    navigate(`/staff/invoices/${id}`);
  };

  const handleEmail = async (transaction, event) => {
    event.stopPropagation();
    const id = getTransactionId(transaction);
    if (!id) {
      showToast('error', 'This transaction cannot be emailed because it has no invoice ID.');
      return;
    }

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
    <div className="staff-table-scroll">
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
          {transactions.map((transaction, index) => {
            const id = getTransactionId(transaction);
            const displayName = transaction.customerName || transaction.vendorName || transaction.summary || 'Unknown Transaction';
            const { label, cls } = getPaymentBadge(transaction.paymentStatus);

            return (
              <tr
                key={getTransactionKey(transaction, index)}
                style={{ cursor: id ? 'pointer' : 'default' }}
                onClick={() => handleView(transaction)}
              >
                <td>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <div style={{ width: 30, height: 30, borderRadius: '7px', background: '#EBF2FB', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                      <FileText size={13} color="#1E3A5F" />
                    </div>
                    <span style={{ fontWeight: 700, color: '#1E3A5F', fontSize: '13px' }}>
                      {id ? `#${id}` : 'No ID'}
                    </span>
                  </div>
                </td>
                <td>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <div style={{ width: 30, height: 30, borderRadius: '50%', background: 'linear-gradient(135deg,#1E3A5F,#2563A8)', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '11px', fontWeight: 700, flexShrink: 0 }}>
                      {(displayName || 'U')[0].toUpperCase()}
                    </div>
                    <div>
                      <div style={{ fontWeight: 600, fontSize: '13px', color: '#1E293B' }}>{displayName}</div>
                      <div style={{ fontSize: '11px', color: '#94A3B8' }}>ID: {id || 'Unavailable'}</div>
                    </div>
                  </div>
                </td>
                <td style={{ color: '#64748B', fontSize: '13px' }}>{transaction.date}</td>
                <td>
                  <strong style={{ fontSize: '13.5px', color: '#1E293B' }}>
                    Rs. {(parseFloat(transaction.total ?? transaction.amount) || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                  </strong>
                </td>
                <td><span className={`badge-pill ${cls}`}>{label}</span></td>
                <td onClick={(event) => event.stopPropagation()}>
                  <div style={{ display: 'flex', gap: '6px' }}>
                    <button
                      onClick={(event) => handleEmail(transaction, event)}
                      disabled={!id || emailingId === id}
                      style={{
                        display: 'inline-flex', alignItems: 'center', gap: '4px',
                        padding: '4px 10px', borderRadius: '6px',
                        border: '1px solid #E2E8F0',
                        background: emailingId === id ? '#F1F5F9' : '#fff',
                        color: '#1E3A5F', cursor: !id || emailingId === id ? 'not-allowed' : 'pointer',
                        fontSize: '11px', fontWeight: 600, transition: 'all 0.15s',
                      }}
                      onMouseEnter={(event) => { if (id && emailingId !== id) event.currentTarget.style.background = '#EBF2FB'; }}
                      onMouseLeave={(event) => { event.currentTarget.style.background = emailingId === id ? '#F1F5F9' : '#fff'; }}
                    >
                      <Mail size={11} />
                      {emailingId === id ? '...' : 'Email'}
                    </button>
                    <button
                      onClick={() => handleView(transaction)}
                      disabled={!id}
                      style={{
                        display: 'inline-flex', alignItems: 'center', gap: '4px',
                        padding: '4px 10px', borderRadius: '6px',
                        border: '1px solid #E2E8F0', background: '#fff',
                        color: '#64748B', cursor: id ? 'pointer' : 'not-allowed',
                        fontSize: '11px', fontWeight: 600, transition: 'all 0.15s',
                      }}
                      onMouseEnter={(event) => { if (id) event.currentTarget.style.background = '#F1F5F9'; }}
                      onMouseLeave={(event) => { event.currentTarget.style.background = '#fff'; }}
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
                  <div className="empty-state-icon">--</div>
                  <h4>No Transactions</h4>
                  <p>Recent sales will appear here.</p>
                </div>
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
};

export default TransactionsTable;
