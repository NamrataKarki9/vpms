import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useToast } from '../../context/ToastContext';
import { apiFetch } from '../../services/api';
import { Search, Mail, Eye, FileText, ChevronLeft, ChevronRight } from 'lucide-react';

const getPaymentLabel = (status) => {
  if (status === 'full-payment') return { label: 'Paid', cls: 'badge-paid' };
  if (status === 'half-payment') return { label: 'Credit', cls: 'badge-credit' };
  if (status === 'partial-payment') return { label: 'Overdue', cls: 'badge-overdue' };
  return { label: status || 'N/A', cls: 'badge-pending' };
};

const Invoices = () => {
  const showToast = useToast();
  const navigate = useNavigate();
  const [sales, setSales] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [emailingId, setEmailingId] = useState(null);
  const [pagination, setPagination] = useState({
    pageNumber: 1,
    pageSize: 10,
    totalItems: 0,
    totalPages: 0,
    hasNextPage: false,
    hasPreviousPage: false
  });

  const fetchInvoices = async () => {
    setLoading(true);
    try {
      const data = await apiFetch(`/Transactions/sales?pageNumber=${pagination.pageNumber}&pageSize=${pagination.pageSize}`);
      if (data && data.items) {
        setSales(data.items.map(s => ({
          id: s.id,
          customerName: s.customerName,
          customerEmail: s.customerEmail,
          total: s.totalAmount,
          date: new Date(s.date).toLocaleDateString(),
          paymentStatus: s.paymentStatus,
        })));
        setPagination({
          ...pagination,
          totalItems: data.totalItems,
          totalPages: data.totalPages,
          hasNextPage: data.hasNextPage,
          hasPreviousPage: data.hasPreviousPage
        });
      } else {
        setSales((data || []).map(s => ({
          id: s.id,
          customerName: s.customerName,
          customerEmail: s.customerEmail,
          total: s.totalAmount,
          date: new Date(s.date).toLocaleDateString(),
          paymentStatus: s.paymentStatus,
        })));
        setPagination({ totalItems: (data || []).length, totalPages: 1, hasNextPage: false, hasPreviousPage: false });
      }
    } catch (err) {
      showToast('error', 'Could not refresh invoices.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchInvoices();
  }, [pagination.pageNumber]);

  const handlePageChange = (newPage) => {
    if (newPage >= 1 && newPage <= pagination.totalPages) {
      setPagination(prev => ({ ...prev, pageNumber: newPage }));
    }
  };

  const filtered = sales.filter(s => {
    const matchSearch = (s.customerName || '').toLowerCase().includes(search.toLowerCase()) ||
      String(s.id).includes(search);
    const matchStatus = filterStatus === 'all' || s.paymentStatus === filterStatus;
    return matchSearch && matchStatus;
  });

  const handleEmail = async (id, e) => {
    e.stopPropagation();
    setEmailingId(id);
    try {
      await apiFetch(`/Transactions/${id}/email`, { method: 'POST' });
      showToast('success', `Invoice #${id} sent to customer email.`);
    } catch (err) {
      showToast('error', 'Failed to send email.');
    } finally {
      setEmailingId(null);
    }
  };

  // Summary stats
  const totalRevenue = sales.reduce((sum, s) => sum + (parseFloat(s.total) || 0), 0);
  const paidCount = sales.filter(s => s.paymentStatus === 'full-payment').length;
  const creditCount = sales.filter(s => s.paymentStatus !== 'full-payment').length;

  return (
    <div>
      {/* Page Header */}
      <div className="page-section-header" style={{ marginBottom: '24px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', position: 'relative' }}>
          <div>
            <h2>Invoice History</h2>
            <p>Full transaction ledger — all sales and credits</p>
          </div>
          <div style={{ display: 'flex', gap: '12px' }}>
            {[
              { label: 'Total Revenue', value: `Rs. ${(totalRevenue / 1000).toFixed(1)}k` },
              { label: 'Paid',          value: paidCount },
              { label: 'On Credit',     value: creditCount },
            ].map((s, i) => (
              <div key={i} style={{ background: 'rgba(255,255,255,0.15)', borderRadius: '10px', padding: '10px 16px', textAlign: 'center', backdropFilter: 'blur(4px)' }}>
                <div style={{ fontSize: '18px', fontWeight: 800, color: '#fff' }}>{s.value}</div>
                <div style={{ fontSize: '10px', color: 'rgba(255,255,255,0.65)', marginTop: '2px' }}>{s.label}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Table Card */}
      <div className="staff-card">
        {/* Filters Row */}
        <div className="staff-card-header" style={{ gap: '12px', flexWrap: 'wrap' }}>
          <span className="staff-card-title">All Invoices</span>
          <div style={{ display: 'flex', gap: '10px', alignItems: 'center', marginLeft: 'auto' }}>
            {/* Status filter pills */}
            <div style={{ display: 'flex', gap: '6px' }}>
              {[
                { id: 'all',             label: 'All' },
                { id: 'full-payment',    label: 'Paid' },
                { id: 'half-payment',    label: 'Credit' },
                { id: 'partial-payment', label: 'Overdue' },
              ].map(f => (
                <button
                  key={f.id}
                  onClick={() => setFilterStatus(f.id)}
                  style={{
                    padding: '4px 12px', borderRadius: '20px', fontSize: '12px', fontWeight: 600,
                    border: filterStatus === f.id ? '1.5px solid #2563A8' : '1px solid #E2E8F0',
                    background: filterStatus === f.id ? '#DBEAFE' : '#F8FAFC',
                    color: filterStatus === f.id ? '#1D4ED8' : '#64748B',
                    cursor: 'pointer', transition: 'all 0.15s',
                  }}
                >
                  {f.label}
                </button>
              ))}
            </div>
            {/* Search */}
            <div style={{ position: 'relative' }}>
              <Search size={13} color="#94A3B8" style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)' }} />
              <input
                type="text"
                placeholder="Search name or ID..."
                value={search}
                onChange={e => setSearch(e.target.value)}
                className="search-input-field"
                style={{ paddingLeft: '30px', width: '200px' }}
              />
            </div>
          </div>
        </div>

        {/* Table */}
        <div style={{ position: 'relative' }}>
          {loading && (
             <div style={{ position: 'absolute', inset: 0, background: 'rgba(255,255,255,0.7)', zIndex: 10, display: 'flex', justifyContent: 'center', alignItems: 'center', borderRadius: '8px' }}>
                <div className="spinner" />
             </div>
          )}
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
              {filtered.map(t => {
                const { label, cls } = getPaymentLabel(t.paymentStatus);
                return (
                  <tr
                    key={t.id}
                    style={{ cursor: 'pointer' }}
                    onClick={() => navigate(`/staff/invoices/${t.id}`)}
                  >
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <div style={{ width: 32, height: 32, borderRadius: '8px', background: '#EBF2FB', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                          <FileText size={14} color="#1E3A5F" />
                        </div>
                        <span style={{ fontWeight: 700, color: '#1E3A5F', fontSize: '13px' }}>#{t.id}</span>
                      </div>
                    </td>
                    <td>
                      <div>
                        <div style={{ fontWeight: 600, color: '#1E293B', fontSize: '13.5px' }}>{t.customerName}</div>
                        {t.customerEmail && (
                          <div style={{ fontSize: '11px', color: '#94A3B8' }}>{t.customerEmail}</div>
                        )}
                      </div>
                    </td>
                    <td style={{ color: '#64748B', fontSize: '13px' }}>{t.date}</td>
                    <td>
                      <strong style={{ fontSize: '14px', color: '#1E293B' }}>
                        Rs. {(parseFloat(t.total) || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                      </strong>
                    </td>
                    <td><span className={`badge-pill ${cls}`}>{label}</span></td>
                    <td onClick={e => e.stopPropagation()}>
                      <div style={{ display: 'flex', gap: '8px' }}>
                        <button
                          onClick={e => handleEmail(t.id, e)}
                          disabled={emailingId === t.id}
                          className="staff-tab-btn"
                          title="Send Invoice Email"
                          style={{
                            display: 'inline-flex', alignItems: 'center', gap: '5px',
                            padding: '5px 12px', borderRadius: '6px',
                            fontSize: '12px', fontWeight: 600, transition: 'all 0.15s',
                          }}
                        >
                          <Mail size={12} />
                          {emailingId === t.id ? 'Sending...' : 'Email'}
                        </button>
                        <button
                          onClick={() => navigate(`/staff/invoices/${t.id}`)}
                          className="staff-tab-btn"
                          title="View Invoice Detail"
                          style={{
                            display: 'inline-flex', alignItems: 'center', gap: '5px',
                            padding: '5px 12px', borderRadius: '6px',
                            fontSize: '12px', fontWeight: 600, transition: 'all 0.15s',
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
              {!loading && filtered.length === 0 && (
                <tr><td colSpan="6">
                  <div className="empty-state">
                    <div className="empty-state-icon">{search ? '🔍' : '🧾'}</div>
                    <h4>{search ? 'No Results' : 'No Invoices Yet'}</h4>
                    <p>{search ? `No invoices matching "${search}"` : 'Invoices will appear here after completing a sale.'}</p>
                  </div>
                </td></tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Bar */}
        {pagination.totalPages > 1 && (
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '16px 22px', borderTop: '1px solid #E8ECF0', background: '#F8FAFC' }}>
            <span style={{ fontSize: '13px', color: '#64748B' }}>
              Page {pagination.pageNumber} of {pagination.totalPages}
            </span>
            <div style={{ display: 'flex', gap: '8px' }}>
              <button
                className="staff-tab-btn"
                disabled={!pagination.hasPreviousPage}
                onClick={() => handlePageChange(pagination.pageNumber - 1)}
                style={{ padding: '6px 12px', opacity: pagination.hasPreviousPage ? 1 : 0.5 }}
              >
                <ChevronLeft size={14} style={{ marginRight: '4px' }} /> Previous
              </button>
              <button
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
      </div>
    </div>
  );
};

export default Invoices;
