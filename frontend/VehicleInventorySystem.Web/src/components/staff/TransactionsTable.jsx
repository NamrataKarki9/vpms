import React from 'react';

const TransactionsTable = ({ transactions }) => {
  const getStatusBadge = (status, total) => {
    if (total > 5000) return <span className="badge badge-loyalty">Loyalty</span>;
    if (status === 'full-payment') return <span className="badge badge-paid">Paid</span>;
    if (status === 'half-payment') return <span className="badge badge-credit">Credit</span>;
    if (status === 'partial-payment') return <span className="badge badge-overdue">Overdue</span>;
    return <span className="badge">{status}</span>;
  };

  return (
    <div className="dashboard-card">
      <div className="card-header">
        <div className="card-title">Recent Transactions</div>
      </div>
      <div className="card-body">
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
            {transactions.map((t) => (
              <tr key={t.id}>
                <td>
                  <div className="customer-cell">
                    <strong>{t.customerName}</strong>
                    <span className="cust-id">ID: {t.id}</span>
                  </div>
                </td>
                <td>{t.date}</td>
                <td>Rs. {t.total.toFixed(2)}</td>
                <td>{getStatusBadge(t.paymentStatus, t.total)}</td>
              </tr>
            ))}
            {transactions.length === 0 && (
              <tr>
                <td colSpan="4" style={{ textAlign: 'center', padding: '2rem', opacity: 0.5 }}>
                  No recent transactions.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default TransactionsTable;
