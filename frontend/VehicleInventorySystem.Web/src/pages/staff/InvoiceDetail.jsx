import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { apiFetch } from '../../services/api';
import { ArrowLeft, Printer, Mail, CheckCircle, Clock } from 'lucide-react';
import { useToast } from '../../context/ToastContext';

const InvoiceDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const showToast = useToast();
  const [invoice, setInvoice] = useState(null);
  const [loading, setLoading] = useState(true);
  const [emailSending, setEmailSending] = useState(false);

  useEffect(() => {
    const loadInvoice = async () => {
      try {
        const sales = await apiFetch('/Transactions/sales');
        const found = (sales || []).find(s => s.id === parseInt(id));
        setInvoice(found);
      } catch (err) {
        console.error('Failed to load invoice:', err);
      } finally {
        setLoading(false);
      }
    };
    loadInvoice();
  }, [id]);

  const handleEmail = async () => {
    setEmailSending(true);
    try {
      await apiFetch(`/Transactions/${id}/email`, { method: 'POST' });
      showToast('success', `Invoice #${id} sent to customer email.`);
    } catch (err) {
      showToast('error', 'Failed to send email.');
    } finally {
      setEmailSending(false);
    }
  };

  const getPaymentLabel = (status) => {
    if (status === 'full-payment') return 'Full Payment';
    if (status === 'half-payment') return 'Half Payment (50%)';
    if (status === 'partial-payment') return 'Partial Payment (10%)';
    return status || 'N/A';
  };

  if (loading) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '60vh', flexDirection: 'column', gap: '16px' }}>
        <div style={{ width: '40px', height: '40px', border: '3px solid #E5E7EB', borderTop: '3px solid #1E3A5F', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
        <span style={{ color: '#64748B', fontSize: '14px' }}>Loading invoice...</span>
      </div>
    );
  }

  if (!invoice) {
    return (
      <div style={{ textAlign: 'center', padding: '80px 40px' }}>
        <p style={{ fontSize: '48px', margin: '0 0 16px' }}>🗒️</p>
        <h3 style={{ color: '#1E293B', margin: '0 0 8px' }}>Invoice Not Found</h3>
        <p style={{ color: '#64748B', margin: '0 0 24px' }}>Invoice #{id} could not be located.</p>
        <button onClick={() => navigate('/staff/invoices')} style={{ background: '#1E3A5F', color: '#fff', border: 'none', padding: '10px 24px', borderRadius: '8px', cursor: 'pointer', fontWeight: 600 }}>
          Back to Invoices
        </button>
      </div>
    );
  }

  const isPaid = invoice.paymentStatus === 'full-payment';
  const subtotal = invoice.items?.reduce((sum, item) => sum + (item.quantity * item.unitPrice), 0) || invoice.totalAmount;

  return (
    <div style={{ maxWidth: '720px', margin: '0 auto' }}>

      {/* Back navigation */}
      <button
        onClick={() => navigate('/staff/invoices')}
        style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', background: 'none', border: 'none', color: '#64748B', cursor: 'pointer', fontSize: '14px', marginBottom: '24px', padding: 0, fontWeight: 500 }}
      >
        <ArrowLeft size={16} />
        Back to Invoices
      </button>

      {/* Invoice Card */}
      <div style={{ background: '#fff', borderRadius: '16px', overflow: 'hidden', boxShadow: '0 4px 24px rgba(0,0,0,0.08)', border: '1px solid #E8ECF0' }}>

        {/* ── HEADER (mirrors email header) ── */}
        <div style={{
          background: 'linear-gradient(135deg, #1E3A5F 0%, #2563A8 100%)',
          padding: '36px 40px',
          color: '#fff',
          position: 'relative',
          overflow: 'hidden'
        }}>
          {/* Decorative circle */}
          <div style={{ position: 'absolute', top: '-40px', right: '-40px', width: '180px', height: '180px', borderRadius: '50%', background: 'rgba(255,255,255,0.06)' }} />
          <div style={{ position: 'absolute', bottom: '-60px', right: '60px', width: '140px', height: '140px', borderRadius: '50%', background: 'rgba(255,255,255,0.04)' }} />

          <div style={{ position: 'relative' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <div>
                <h1 style={{ margin: '0 0 4px', fontSize: '22px', fontWeight: 700, letterSpacing: '-0.3px' }}>
                  Vehicle Inventory System
                </h1>
                <p style={{ margin: 0, opacity: 0.75, fontSize: '14px' }}>AutoParts Pro — Staff Portal</p>
              </div>
              <div style={{ textAlign: 'right' }}>
                <span style={{ 
                  background: isPaid ? 'rgba(34,197,94,0.2)' : 'rgba(251,191,36,0.2)', 
                  color: isPaid ? '#86EFAC' : '#FDE68A',
                  padding: '6px 14px', borderRadius: '20px', fontSize: '12px', fontWeight: 600, letterSpacing: '0.5px',
                  border: `1px solid ${isPaid ? 'rgba(134,239,172,0.3)' : 'rgba(253,230,138,0.3)'}`
                }}>
                  {isPaid ? '✓ PAID IN FULL' : '⏳ CREDIT TRANSACTION'}
                </span>
              </div>
            </div>

            <div style={{ marginTop: '24px', display: 'flex', gap: '40px' }}>
              <div>
                <p style={{ margin: '0 0 4px', fontSize: '11px', opacity: 0.6, textTransform: 'uppercase', letterSpacing: '0.8px' }}>Invoice Number</p>
                <p style={{ margin: 0, fontSize: '28px', fontWeight: 700 }}>#{invoice.id}</p>
              </div>
              <div>
                <p style={{ margin: '0 0 4px', fontSize: '11px', opacity: 0.6, textTransform: 'uppercase', letterSpacing: '0.8px' }}>Date Issued</p>
                <p style={{ margin: 0, fontSize: '18px', fontWeight: 500 }}>{new Date(invoice.date).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}</p>
              </div>
            </div>
          </div>
        </div>

        {/* ── BODY ── */}
        <div style={{ padding: '36px 40px' }}>

          {/* Customer & Payment Info row */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px', marginBottom: '36px' }}>
            <div style={{ background: '#F8FAFC', border: '1px solid #E8ECF0', borderRadius: '10px', padding: '20px' }}>
              <p style={{ margin: '0 0 12px', fontSize: '11px', color: '#94A3B8', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.8px' }}>Billed To</p>
              <p style={{ margin: '0 0 4px', fontSize: '17px', fontWeight: 700, color: '#1E293B' }}>
                {invoice.customerName || 'Walk-in Customer'}
              </p>
              <p style={{ margin: 0, fontSize: '13px', color: '#64748B' }}>{invoice.customerEmail || '—'}</p>
            </div>
            <div style={{ background: '#F8FAFC', border: '1px solid #E8ECF0', borderRadius: '10px', padding: '20px' }}>
              <p style={{ margin: '0 0 12px', fontSize: '11px', color: '#94A3B8', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.8px' }}>Payment Info</p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ fontSize: '13px', color: '#64748B' }}>Invoice Date</span>
                  <span style={{ fontSize: '13px', fontWeight: 500, color: '#1E293B' }}>
                    {new Date(invoice.date).toLocaleDateString()}
                  </span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ fontSize: '13px', color: '#64748B' }}>Payment Status</span>
                  <span style={{ fontSize: '13px', fontWeight: 600, color: isPaid ? '#16A34A' : '#D97706' }}>
                    {getPaymentLabel(invoice.paymentStatus)}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Items Table */}
          <div style={{ border: '1px solid #E8ECF0', borderRadius: '10px', overflow: 'hidden', marginBottom: '28px' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ background: '#F1F5F9' }}>
                  <th style={{ padding: '14px 20px', textAlign: 'left', fontSize: '11px', fontWeight: 700, color: '#64748B', textTransform: 'uppercase', letterSpacing: '0.8px' }}>Item</th>
                  <th style={{ padding: '14px 16px', textAlign: 'center', fontSize: '11px', fontWeight: 700, color: '#64748B', textTransform: 'uppercase', letterSpacing: '0.8px', borderLeft: '1px solid #E8ECF0' }}>Qty</th>
                  <th style={{ padding: '14px 16px', textAlign: 'right', fontSize: '11px', fontWeight: 700, color: '#64748B', textTransform: 'uppercase', letterSpacing: '0.8px', borderLeft: '1px solid #E8ECF0' }}>Unit Price</th>
                  <th style={{ padding: '14px 20px', textAlign: 'right', fontSize: '11px', fontWeight: 700, color: '#64748B', textTransform: 'uppercase', letterSpacing: '0.8px', borderLeft: '1px solid #E8ECF0' }}>Total</th>
                </tr>
              </thead>
              <tbody>
                {invoice.items?.length > 0 ? (
                  invoice.items.map((item, idx) => (
                    <tr key={idx} style={{ borderTop: '1px solid #E8ECF0', background: idx % 2 === 0 ? '#fff' : '#FAFBFC' }}>
                      <td style={{ padding: '16px 20px', fontSize: '14px', fontWeight: 500, color: '#1E293B' }}>{item.partName}</td>
                      <td style={{ padding: '16px 16px', textAlign: 'center', fontSize: '14px', color: '#475569', borderLeft: '1px solid #E8ECF0' }}>
                        <span style={{ background: '#EEF2FF', color: '#4F46E5', padding: '3px 10px', borderRadius: '12px', fontWeight: 600, fontSize: '13px' }}>
                          {item.quantity}
                        </span>
                      </td>
                      <td style={{ padding: '16px 16px', textAlign: 'right', fontSize: '14px', color: '#475569', borderLeft: '1px solid #E8ECF0' }}>Rs. {item.unitPrice.toFixed(2)}</td>
                      <td style={{ padding: '16px 20px', textAlign: 'right', fontSize: '14px', fontWeight: 700, color: '#1E293B', borderLeft: '1px solid #E8ECF0' }}>Rs. {(item.quantity * item.unitPrice).toFixed(2)}</td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="4" style={{ padding: '32px', textAlign: 'center', color: '#94A3B8', fontSize: '14px' }}>
                      No line items available.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {/* Totals Section */}
          <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '36px' }}>
            <div style={{ width: '280px' }}>
              <div style={{ background: 'linear-gradient(135deg, #1E3A5F 0%, #2563A8 100%)', borderRadius: '12px', padding: '20px 24px', color: '#fff' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                  <span style={{ fontSize: '13px', opacity: 0.8 }}>Total Amount</span>
                  <span style={{ fontSize: '22px', fontWeight: 800 }}>Rs. {invoice.totalAmount.toFixed(2)}</span>
                </div>
                <div style={{ borderTop: '1px solid rgba(255,255,255,0.2)', marginTop: '12px', paddingTop: '12px' }}>
                  <span style={{ fontSize: '12px', opacity: 0.7 }}>{getPaymentLabel(invoice.paymentStatus)}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end', borderTop: '1px solid #E8ECF0', paddingTop: '24px' }}>
            <button
              onClick={() => window.print()}
              style={{
                display: 'inline-flex', alignItems: 'center', gap: '8px',
                padding: '10px 20px', borderRadius: '8px', border: '1px solid #E2E8F0',
                background: '#F8FAFC', color: '#1E293B', cursor: 'pointer', fontSize: '14px', fontWeight: 600
              }}
            >
              <Printer size={15} /> Print
            </button>
            <button
              onClick={handleEmail}
              disabled={emailSending}
              style={{
                display: 'inline-flex', alignItems: 'center', gap: '8px',
                padding: '10px 24px', borderRadius: '8px', border: 'none',
                background: emailSending ? '#94A3B8' : '#1E3A5F',
                color: '#fff', cursor: emailSending ? 'not-allowed' : 'pointer',
                fontSize: '14px', fontWeight: 600, transition: 'background 0.2s'
              }}
            >
              <Mail size={15} />
              {emailSending ? 'Sending...' : 'Send Invoice Email'}
            </button>
          </div>
        </div>

        {/* ── FOOTER ── */}
        <div style={{ background: '#F8FAFC', borderTop: '1px solid #E8ECF0', padding: '16px 40px', textAlign: 'center' }}>
          <p style={{ margin: 0, fontSize: '13px', color: '#94A3B8' }}>
            <strong style={{ color: '#64748B' }}>Vehicle Inventory System</strong> — Thank you for choosing us.
          </p>
        </div>
      </div>
    </div>
  );
};

export default InvoiceDetail;
