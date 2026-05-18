import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useToast } from '../../context/ToastContext';
import { apiFetch } from '../../services/api';
import { ChevronLeft, ChevronRight, Eye, FileText, Mail, Search } from 'lucide-react';

const getPaymentLabel = (status) => {
  if (status === 'full-payment') return { label: 'Paid', cls: 'badge-paid' };
  if (status === 'half-payment') return { label: 'Credit', cls: 'badge-credit' };
  if (status === 'partial-payment') return { label: 'Overdue', cls: 'badge-overdue' };
  return { label: status || 'N/A', cls: 'badge-pending' };
};

const getInvoiceId = (invoice) =>
  invoice?.id ??
  invoice?.invoiceId ??
  invoice?.invoiceNo ??
  invoice?.invoiceNumber ??
  invoice?.transactionId ??
  '';

const normalizeInvoice = (invoice) => ({
  id: getInvoiceId(invoice),
  customerName: invoice.customerName,
  customerEmail: invoice.customerEmail,
  total: invoice.totalAmount,
  date: invoice.date ? new Date(invoice.date).toLocaleDateString() : '',
  paymentStatus: invoice.paymentStatus,
});

const DEFAULT_PAGINATION = {
  pageNumber: 1,
  pageSize: 10,
  totalItems: 0,
  totalPages: 0,
  hasNextPage: false,
  hasPreviousPage: false,
};

const Invoices = ({ sales: propSales = [] }) => {
  const showToast = useToast();
  const navigate = useNavigate();
  const [sales, setSales] = useState(() => propSales.map(normalizeInvoice));
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [emailingId, setEmailingId] = useState(null);
  const [pagination, setPagination] = useState(DEFAULT_PAGINATION);

  useEffect(() => {
    let isCancelled = false;

    const fetchInvoices = async () => {
      setLoading(true);

      try {
        const data = await apiFetch(
          `/Transactions/sales?pageNumber=${pagination.pageNumber}&pageSize=${pagination.pageSize}`
        );

        if (isCancelled) return;

        if (data && Array.isArray(data.items)) {
          setSales(data.items.map(normalizeInvoice));
          setPagination((current) => ({
            ...current,
            totalItems: data.totalItems ?? 0,
            totalPages: data.totalPages ?? 0,
            hasNextPage: data.hasNextPage ?? false,
            hasPreviousPage: data.hasPreviousPage ?? false,
          }));
        } else {
          const invoices = Array.isArray(data) ? data : [];
          setSales(invoices.map(normalizeInvoice));
          setPagination((current) => ({
            ...current,
            totalItems: invoices.length,
            totalPages: invoices.length > 0 ? 1 : 0,
            hasNextPage: false,
            hasPreviousPage: false,
          }));
        }
      } catch {
        if (!isCancelled) {
          showToast('error', 'Could not refresh invoices.');
        }
      } finally {
        if (!isCancelled) {
          setLoading(false);
        }
      }
    };

    fetchInvoices();

    return () => {
      isCancelled = true;
    };
  }, [pagination.pageNumber, pagination.pageSize, showToast]);

  const handlePageChange = (newPage) => {
    if (newPage >= 1 && newPage <= pagination.totalPages) {
      setPagination((current) => ({ ...current, pageNumber: newPage }));
    }
  };

  const filtered = sales.filter((invoice) => {
    const id = getInvoiceId(invoice);
    const matchSearch =
      (invoice.customerName || '').toLowerCase().includes(search.toLowerCase()) ||
      String(id).includes(search);
    const matchStatus = filterStatus === 'all' || invoice.paymentStatus === filterStatus;
    return matchSearch && matchStatus;
  });

  const handleEmail = async (id, event) => {
    event.stopPropagation();

    if (!id) {
      showToast('error', 'This invoice cannot be emailed because it has no invoice ID.');
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

  const handleViewInvoice = (invoice) => {
    const id = getInvoiceId(invoice);

    if (!id) {
      showToast('error', 'This invoice cannot be opened because it has no invoice ID.');
      return;
    }

    navigate(`/staff/invoices/${id}`);
  };

  const totalRevenue = sales.reduce((sum, invoice) => sum + (parseFloat(invoice.total) || 0), 0);
  const paidCount = sales.filter((invoice) => invoice.paymentStatus === 'full-payment').length;
  const creditCount = sales.filter((invoice) => invoice.paymentStatus !== 'full-payment').length;

  return (
    <div>
      <div className="page-section-header" style={{ marginBottom: '24px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', position: 'relative' }}>
          <div>
            <h2>Invoice History</h2>
            <p>Full transaction ledger - all sales and credits</p>
          </div>
          <div style={{ display: 'flex', gap: '12px' }}>
            {[
              { label: 'Total Revenue', value: `Rs. ${(totalRevenue / 1000).toFixed(1)}k` },
              { label: 'Paid', value: paidCount },
              { label: 'On Credit', value: creditCount },
            ].map((stat) => (
              <div
                key={stat.label}
                style={{
                  background: 'rgba(255,255,255,0.15)',
                  borderRadius: '10px',
                  padding: '10px 16px',
                  textAlign: 'center',
                  backdropFilter: 'blur(4px)',
                }}
              >
                <div style={{ fontSize: '18px', fontWeight: 800, color: '#fff' }}>{stat.value}</div>
                <div style={{ fontSize: '10px', color: 'rgba(255,255,255,0.65)', marginTop: '2px' }}>{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="staff-card">
        <div className="staff-card-header" style={{ gap: '12px', flexWrap: 'wrap' }}>
          <span className="staff-card-title">All Invoices</span>
          <div style={{ display: 'flex', gap: '10px', alignItems: 'center', marginLeft: 'auto', flexWrap: 'wrap' }}>
            <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
              {[
                { id: 'all', label: 'All' },
                { id: 'full-payment', label: 'Paid' },
                { id: 'half-payment', label: 'Credit' },
                { id: 'partial-payment', label: 'Overdue' },
              ].map((filter) => (
                <button
                  key={filter.id}
                  type="button"
                  onClick={() => setFilterStatus(filter.id)}
                  style={{
                    padding: '4px 12px',
                    borderRadius: '20px',
                    fontSize: '12px',
                    fontWeight: 600,
                    border: filterStatus === filter.id ? '1.5px solid #2563A8' : '1px solid #E2E8F0',
                    background: filterStatus === filter.id ? '#DBEAFE' : '#F8FAFC',
                    color: filterStatus === filter.id ? '#1D4ED8' : '#64748B',
                    cursor: 'pointer',
                    transition: 'all 0.15s',
                  }}
                >
                  {filter.label}
                </button>
              ))}
            </div>
            <div style={{ position: 'relative' }}>
              <Search size={13} color="#94A3B8" style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)' }} />
              <input
                type="text"
                placeholder="Search name or ID..."
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                className="search-input-field"
                style={{ paddingLeft: '30px', width: '200px' }}
              />
            </div>
          </div>
        </div>

        {loading ? (
          <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', padding: '60px', gap: '16px', flexDirection: 'column' }}>
            <div className="spinner" />
            <span style={{ color: '#64748B', fontSize: '14px' }}>Loading invoices...</span>
          </div>
        ) : (
          <>
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
                  {filtered.map((invoice, index) => {
                    const id = getInvoiceId(invoice);
                    const { label, cls } = getPaymentLabel(invoice.paymentStatus);

                    return (
                      <tr
                        key={id || `${invoice.customerName || 'invoice'}-${invoice.date || index}`}
                        style={{ cursor: id ? 'pointer' : 'default' }}
                        onClick={() => handleViewInvoice(invoice)}
                      >
                        <td>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <div style={{ width: 32, height: 32, borderRadius: '8px', background: '#EBF2FB', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                              <FileText size={14} color="#1E3A5F" />
                            </div>
                            <span style={{ fontWeight: 700, color: '#1E3A5F', fontSize: '13px' }}>{id ? `#${id}` : 'No ID'}</span>
                          </div>
                        </td>
                        <td>
                          <div>
                            <div style={{ fontWeight: 600, color: '#1E293B', fontSize: '13.5px' }}>{invoice.customerName}</div>
                            {invoice.customerEmail && (
                              <div style={{ fontSize: '11px', color: '#94A3B8' }}>{invoice.customerEmail}</div>
                            )}
                          </div>
                        </td>
                        <td style={{ color: '#64748B', fontSize: '13px' }}>{invoice.date}</td>
                        <td>
                          <strong style={{ fontSize: '14px', color: '#1E293B' }}>
                            Rs. {(parseFloat(invoice.total) || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                          </strong>
                        </td>
                        <td><span className={`badge-pill ${cls}`}>{label}</span></td>
                        <td onClick={(event) => event.stopPropagation()}>
                          <div style={{ display: 'flex', gap: '8px' }}>
                            <button
                              type="button"
                              onClick={(event) => handleEmail(id, event)}
                              disabled={!id || emailingId === id}
                              className="staff-tab-btn"
                              title="Send Invoice Email"
                              style={{
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: '5px',
                                padding: '5px 12px',
                                borderRadius: '6px',
                                border: '1px solid #E2E8F0',
                                background: emailingId === id ? '#F1F5F9' : '#fff',
                                color: '#1E3A5F',
                                cursor: !id || emailingId === id ? 'not-allowed' : 'pointer',
                                fontSize: '12px',
                                fontWeight: 600,
                                transition: 'all 0.15s',
                              }}
                              onMouseEnter={(event) => {
                                if (id && emailingId !== id) event.currentTarget.style.background = '#EBF2FB';
                              }}
                              onMouseLeave={(event) => {
                                event.currentTarget.style.background = emailingId === id ? '#F1F5F9' : '#fff';
                              }}
                            >
                              <Mail size={12} />
                              {emailingId === id ? 'Sending...' : 'Email'}
                            </button>
                            <button
                              type="button"
                              onClick={() => handleViewInvoice(invoice)}
                              disabled={!id}
                              className="staff-tab-btn"
                              title="View Invoice Detail"
                              style={{
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: '5px',
                                padding: '5px 12px',
                                borderRadius: '6px',
                                border: '1px solid #E2E8F0',
                                background: '#fff',
                                color: '#64748B',
                                cursor: id ? 'pointer' : 'not-allowed',
                                fontSize: '12px',
                                fontWeight: 600,
                                transition: 'all 0.15s',
                              }}
                              onMouseEnter={(event) => {
                                if (id) event.currentTarget.style.background = '#F1F5F9';
                              }}
                              onMouseLeave={(event) => {
                                event.currentTarget.style.background = '#fff';
                              }}
                            >
                              <Eye size={12} />
                              View
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                  {filtered.length === 0 && (
                    <tr>
                      <td colSpan="6">
                        <div className="empty-state">
                          <div className="empty-state-icon">{search ? 'Search' : 'Invoice'}</div>
                          <h4>{search ? 'No Results' : 'No Invoices Yet'}</h4>
                          <p>{search ? `No invoices matching "${search}"` : 'Invoices will appear here after completing a sale.'}</p>
                        </div>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            {pagination.totalPages > 1 && (
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '16px 22px', borderTop: '1px solid #E8ECF0', background: '#F8FAFC' }}>
                <span style={{ fontSize: '13px', color: '#64748B' }}>
                  Page {pagination.pageNumber} of {pagination.totalPages}
                </span>
                <div style={{ display: 'flex', gap: '8px' }}>
                  <button
                    type="button"
                    className="staff-tab-btn"
                    disabled={!pagination.hasPreviousPage}
                    onClick={() => handlePageChange(pagination.pageNumber - 1)}
                    style={{ padding: '6px 12px', opacity: pagination.hasPreviousPage ? 1 : 0.5 }}
                  >
                    <ChevronLeft size={14} style={{ marginRight: '4px' }} /> Previous
                  </button>
                  <button
                    type="button"
                    className="staff-tab-btn"
                    disabled={!pagination.hasNextPage}
                    onClick={() => handlePageChange(pagination.pageNumber + 1)}
                    style={{ padding: '6px 12px', opacity: pagination.hasNextPage ? 1 : 0.5 }}
                  >
                    Next <ChevronRight size={14} style={{ marginLeft: '4px' }} />
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default Invoices;
