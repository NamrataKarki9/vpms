import React from 'react';
import TransactionsTable from '../../components/staff/TransactionsTable';

const Invoices = ({ sales }) => {
  return (
    <div className="staff-card">
      <div className="staff-card-header">
        <h3 className="staff-card-title">Full Invoice History</h3>
      </div>
      <div className="staff-card-body">
        <TransactionsTable transactions={sales} />
      </div>
    </div>
  );
};

export default Invoices;
