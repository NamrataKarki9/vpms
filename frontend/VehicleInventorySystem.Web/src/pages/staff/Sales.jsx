import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useToast } from '../../context/ToastContext';
import { apiFetch } from '../../services/api';
import { ArrowLeft, ArrowRight, Mail, Printer, CheckCircle, Trash2 } from 'lucide-react';

const STEPS_PURCHASE = ['Build Cart', 'Review Invoice', 'Complete'];
const STEPS_SERVICE = ['Service Details', 'Review Invoice', 'Complete'];
const SERVICE_TYPES = ['Oil Change', 'Filter Replacement', 'Tire Rotation', 'Brake Service', 'Full Service', 'Diagnosis', 'Other'];

const Sales = ({ customers, parts, onProcessSale }) => {
  const showToast = useToast();
  const navigate = useNavigate();
  const [saleType, setSaleType] = useState('purchase'); // 'purchase' or 'service'
  const [step, setStep] = useState(0);
  const [selectedCust, setSelectedCust] = useState('');
  const [selectedVehicle, setSelectedVehicle] = useState('');
  const [selectedPart, setSelectedPart] = useState('');
  const [quantity, setQuantity] = useState(1);
  const [cart, setCart] = useState([]);
  const [paymentStatus, setPaymentStatus] = useState('');
  const [processedInvoiceId, setProcessedInvoiceId] = useState(null);
  const [processedInvoiceData, setProcessedInvoiceData] = useState(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [customerVehicles, setCustomerVehicles] = useState([]);
  
  // Service-specific state
  const [serviceForm, setServiceForm] = useState({
    serviceType: '',
    serviceDate: '',
    mileage: '',
    description: '',
    mechanicNotes: '',
    serviceCharge: '',
    paymentType: ''
  });

  // Fetch all vehicles when customer is selected
  React.useEffect(() => {
    const fetchVehicles = async () => {
      if (!selectedCust) {
        setCustomerVehicles([]);
        setSelectedVehicle('');
        return;
      }
      try {
        const vehicles = await apiFetch(`/customer/${selectedCust}/vehicles`);
        // Debug: log raw API response so we can see if deleted vehicles are returned
        // eslint-disable-next-line no-console
        console.log('API /customer/{id}/vehicles response for', selectedCust, vehicles);
        // Filter out any soft-deleted vehicles (check both deletedAt and DeletedAt properties)
        const activeVehicles = (vehicles || []).filter(v => !v.deletedAt && !v.DeletedAt);
        // Debug: log filtered active vehicles
        // eslint-disable-next-line no-console
        console.log('Filtered active vehicles:', activeVehicles);
        setCustomerVehicles(activeVehicles);
        setSelectedVehicle(''); // Reset vehicle selection
      } catch (err) {
        showToast('error', 'Failed to load customer vehicles');
        setCustomerVehicles([]);
      }
    };
    fetchVehicles();
  }, [selectedCust, showToast]);

  const selectedCustomer = customers.find(c => c.id === parseInt(selectedCust));

  const handleAddToCart = () => {
    if (!selectedPart) return;
    if (!selectedVehicle) return showToast('error', 'Please select a vehicle first.');
    const part = parts.find(p => p.id === parseInt(selectedPart));
    if (!part) return;
    if (part.stock < parseInt(quantity)) return showToast('error', `Insufficient stock! Only ${part.stock} available.`);
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

  const getCalc = () => {
    if (paymentStatus === 'full-payment') return { payNow: totalAmount, credit: 0 };
    if (paymentStatus === 'half-payment') return { payNow: totalAmount * 0.5, credit: totalAmount * 0.5 };
    if (paymentStatus === 'partial-payment') return { payNow: totalAmount * 0.1, credit: totalAmount * 0.9 };
    return { payNow: 0, credit: 0 };
  };
  const { payNow, credit } = getCalc();

  const handleComplete = async () => {
    setIsProcessing(true);
    try {
      const salePayload = {
        customerId: parseInt(selectedCust, 10),
        vehicleId: selectedVehicle ? parseInt(selectedVehicle, 10) : null,
        totalAmount,
        paymentStatus,
        items: cart.map(item => ({ partId: item.id, quantity: item.quantity, unitPrice: item.price }))
      };
      const response = await apiFetch('/Transactions/sale', { method: 'POST', body: JSON.stringify(salePayload) });
      setProcessedInvoiceId(response.id);
      setStep(2);
      showToast('success', `Invoice #${response.id} created successfully!`);
    } catch (err) {
      showToast('error', err.message || 'Failed to process sale.');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleSendEmail = async () => {
    try {
      await apiFetch(`/Transactions/${processedInvoiceId}/email`, { method: 'POST' });
      showToast('success', 'Invoice email sent to customer.');
    } catch (err) {
      showToast('error', 'Failed to send email.');
    }
  };

  const handleServiceComplete = async () => {
    if (!selectedCust || !selectedVehicle || !serviceForm.serviceType || !serviceForm.serviceDate || !serviceForm.serviceCharge || !paymentStatus) {
      showToast('error', 'Please fill all required fields');
      return;
    }
    
    setIsProcessing(true);
    try {
      const servicePayload = {
        customerId: parseInt(selectedCust, 10),
        vehicleId: parseInt(selectedVehicle, 10),
        serviceType: serviceForm.serviceType,
        serviceDate: new Date(serviceForm.serviceDate).toISOString(),
        mileage: parseInt(serviceForm.mileage) || 0,
        description: serviceForm.description,
        mechanicNotes: serviceForm.mechanicNotes,
        serviceCharge: parseFloat(serviceForm.serviceCharge),
        paymentStatus
      };
      
      const response = await apiFetch('/Service/service-invoice', { method: 'POST', body: JSON.stringify(servicePayload) });
      setProcessedInvoiceId(response.id);
      setProcessedInvoiceData(response);
      setStep(2);
      showToast('success', `Service Invoice #${response.invoiceNumber} created successfully!`);
    } catch (err) {
      showToast('error', err.message || 'Failed to process service invoice.');
    } finally {
      setIsProcessing(false);
    }
  };

  const resetForm = () => {
    setCart([]);
    setSelectedCust('');
    setSelectedVehicle('');
    setPaymentStatus('');
    setStep(0);
    setProcessedInvoiceId(null);
    setProcessedInvoiceData(null);
    setServiceForm({
      serviceType: '',
      serviceDate: '',
      mileage: '',
      description: '',
      mechanicNotes: '',
      serviceCharge: '',
      paymentType: ''
    });
  };

  // ── Step Indicator ──
  const StepBar = ({ steps }) => (
    <div style={{ display: 'flex', alignItems: 'center', gap: 0, marginBottom: '28px' }}>
      {steps.map((s, i) => (
        <React.Fragment key={i}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <div style={{
              width: 28, height: 28, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center',
              background: i < step ? '#15803D' : i === step ? 'linear-gradient(135deg,#1E3A5F,#2563A8)' : '#E2E8F0',
              color: i <= step ? '#fff' : '#94A3B8', fontSize: '12px', fontWeight: 700,
              boxShadow: i === step ? '0 2px 8px rgba(30,58,95,0.35)' : 'none',
              flexShrink: 0
            }}>
              {i < step ? '✓' : i + 1}
            </div>
            <span style={{ fontSize: '13px', fontWeight: i === step ? 700 : 500, color: i === step ? '#1E293B' : '#94A3B8' }}>{s}</span>
          </div>
          {i < steps.length - 1 && (
            <div style={{ flex: 1, height: '2px', background: i < step ? '#15803D' : '#E2E8F0', margin: '0 12px', minWidth: '40px', borderRadius: '1px' }} />
          )}
        </React.Fragment>
      ))}
    </div>
  );

  // ── Step 2: Success ──
  if (step === 2) return (
    <div style={{ maxWidth: '560px', margin: '60px auto 0' }}>
      <div className="staff-card" style={{ padding: 0, overflow: 'hidden' }}>
        <div style={{ background: 'linear-gradient(135deg,#065F46,#059669)', padding: '40px', textAlign: 'center', color: '#fff' }}>
          <div style={{ width: 72, height: 72, borderRadius: '50%', background: 'rgba(255,255,255,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px', backdropFilter: 'blur(4px)' }}>
            <CheckCircle size={36} color="#fff" />
          </div>
          <h2 style={{ color: '#fff', fontSize: '22px', fontWeight: 800, marginBottom: '6px' }}>
            {saleType === 'purchase' ? 'Sale Completed!' : 'Service Invoice Created!'}
          </h2>
          <p style={{ color: 'rgba(255,255,255,0.8)', fontSize: '14px' }}>Invoice #{processedInvoiceId} has been generated</p>
        </div>
        <div style={{ padding: '32px' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <button onClick={handleSendEmail} className="btn-sale-primary" style={{ width: '100%', height: '46px', justifyContent: 'center', fontSize: '14px' }}>
              <Mail size={16} /> Send Invoice to Customer Email
            </button>
            <button
              onClick={() => {
                if (saleType === 'service' && processedInvoiceData) {
                  navigate(`/staff/invoices/${processedInvoiceId}`, {
                    state: { kind: 'service', serviceInvoice: processedInvoiceData }
                  });
                  return;
                }

                navigate(`/staff/invoices/${processedInvoiceId}`);
              }}
              style={{ width: '100%', height: '46px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', background: '#F8FAFC', border: '1.5px solid #E2E8F0', borderRadius: '8px', cursor: 'pointer', fontSize: '14px', fontWeight: 600, color: '#1E293B' }}
            >
              View Invoice Details
            </button>
            <button onClick={() => window.print()} style={{ width: '100%', height: '46px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', background: 'none', border: 'none', borderRadius: '8px', cursor: 'pointer', fontSize: '14px', fontWeight: 600, color: '#64748B' }}>
              <Printer size={16} /> Print Physical Copy
            </button>
          </div>
          <button onClick={resetForm} style={{ display: 'block', width: '100%', marginTop: '20px', background: 'none', border: 'none', color: '#94A3B8', cursor: 'pointer', fontSize: '13px', textAlign: 'center' }}>
            + Create Another Sale
          </button>
        </div>
      </div>
    </div>
  );

  // ── Step 1: Review ──
  if (step === 1) {
    const STEPS = saleType === 'purchase' ? STEPS_PURCHASE : STEPS_SERVICE;
    const serviceCharge = parseFloat(serviceForm.serviceCharge) || 0;
    const getServicePaymentCalc = () => {
      if (paymentStatus === 'full-payment') return { payNow: serviceCharge, credit: 0 };
      if (paymentStatus === 'half-payment') return { payNow: serviceCharge * 0.5, credit: serviceCharge * 0.5 };
      if (paymentStatus === 'partial-payment') return { payNow: serviceCharge * 0.1, credit: serviceCharge * 0.9 };
      return { payNow: 0, credit: 0 };
    };
    const servicePaymentCalc = saleType === 'service' ? getServicePaymentCalc() : null;

    return (
      <div style={{ maxWidth: '720px', margin: '0 auto' }}>
        <StepBar steps={STEPS} />
        <div className="staff-card" style={{ overflow: 'hidden' }}>
          {/* Invoice Header */}
          <div style={{ background: 'linear-gradient(135deg,#1E3A5F,#2563A8)', padding: '28px 32px', color: '#fff' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <div>
                <h3 style={{ color: '#fff', fontWeight: 800, fontSize: '18px', marginBottom: '4px' }}>
                  {saleType === 'purchase' ? 'Purchase Invoice Preview' : 'Service Invoice Preview'}
                </h3>
                <p style={{ color: 'rgba(255,255,255,0.7)', fontSize: '13px' }}>Review before confirming</p>
              </div>
              <div style={{ textAlign: 'right' }}>
                <p style={{ color: 'rgba(255,255,255,0.7)', fontSize: '11px', marginBottom: '2px' }}>DATE</p>
                <p style={{ color: '#fff', fontWeight: 700 }}>{new Date().toLocaleDateString()}</p>
              </div>
            </div>
          </div>
          <div style={{ padding: '28px 32px' }}>
            {/* Customer info */}
            <div style={{ background: '#F8FAFC', border: '1px solid #E2E8F0', borderRadius: '10px', padding: '16px 20px', marginBottom: '24px' }}>
              <p style={{ fontSize: '11px', color: '#94A3B8', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.7px', marginBottom: '6px' }}>Bill To</p>
              <p style={{ fontWeight: 700, fontSize: '16px', color: '#1E293B', marginBottom: '2px' }}>{customers.find(c => c.id === parseInt(selectedCust))?.name}</p>
              <p style={{ fontSize: '13px', color: '#64748B' }}>{customers.find(c => c.id === parseInt(selectedCust))?.phone}</p>
            </div>

            {saleType === 'purchase' ? (
              <>
                {/* Items Table for Purchase */}
                <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: '24px' }}>
                  <thead>
                    <tr style={{ borderBottom: '2px solid #E8ECF0' }}>
                      <th style={{ textAlign: 'left', padding: '10px 0', fontSize: '11px', color: '#64748B', textTransform: 'uppercase', letterSpacing: '0.7px', fontWeight: 700 }}>Item</th>
                      <th style={{ textAlign: 'center', padding: '10px 0', fontSize: '11px', color: '#64748B', textTransform: 'uppercase', letterSpacing: '0.7px', fontWeight: 700 }}>Qty</th>
                      <th style={{ textAlign: 'right', padding: '10px 0', fontSize: '11px', color: '#64748B', textTransform: 'uppercase', letterSpacing: '0.7px', fontWeight: 700 }}>Price</th>
                      <th style={{ textAlign: 'right', padding: '10px 0', fontSize: '11px', color: '#64748B', textTransform: 'uppercase', letterSpacing: '0.7px', fontWeight: 700 }}>Total</th>
                    </tr>
                  </thead>
                  <tbody>
                    {cart.map(item => (
                      <tr key={item.id} style={{ borderBottom: '1px solid #F1F5F9' }}>
                        <td style={{ padding: '13px 0', fontSize: '14px', fontWeight: 600, color: '#1E293B' }}>{item.name}</td>
                        <td style={{ padding: '13px 0', textAlign: 'center' }}>
                          <span style={{ background: '#EEF2FF', color: '#4F46E5', padding: '3px 10px', borderRadius: '12px', fontWeight: 700, fontSize: '13px' }}>{item.quantity}</span>
                        </td>
                        <td style={{ padding: '13px 0', textAlign: 'right', color: '#475569' }}>Rs. {item.price.toFixed(2)}</td>
                        <td style={{ padding: '13px 0', textAlign: 'right', fontWeight: 700, color: '#1E293B' }}>Rs. {(item.price * item.quantity).toFixed(2)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </>
            ) : (
              <>
                {/* Service Details */}
                <div style={{ background: '#F8FAFC', border: '1px solid #E2E8F0', borderRadius: '10px', padding: '16px 20px', marginBottom: '24px' }}>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                    <div>
                      <p style={{ fontSize: '11px', color: '#94A3B8', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.7px', marginBottom: '4px' }}>Service Type</p>
                      <p style={{ fontSize: '14px', fontWeight: 600, color: '#1E293B' }}>{serviceForm.serviceType}</p>
                    </div>
                    <div>
                      <p style={{ fontSize: '11px', color: '#94A3B8', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.7px', marginBottom: '4px' }}>Service Date</p>
                      <p style={{ fontSize: '14px', fontWeight: 600, color: '#1E293B' }}>{new Date(serviceForm.serviceDate).toLocaleDateString()}</p>
                    </div>
                    <div>
                      <p style={{ fontSize: '11px', color: '#94A3B8', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.7px', marginBottom: '4px' }}>Mileage</p>
                      <p style={{ fontSize: '14px', fontWeight: 600, color: '#1E293B' }}>{serviceForm.mileage || '-'} km</p>
                    </div>
                    <div>
                      <p style={{ fontSize: '11px', color: '#94A3B8', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.7px', marginBottom: '4px' }}>Service Charge</p>
                      <p style={{ fontSize: '14px', fontWeight: 600, color: '#1E293B' }}>Rs. {serviceCharge.toFixed(2)}</p>
                    </div>
                  </div>
                  {serviceForm.description && (
                    <div style={{ marginTop: '12px', paddingTop: '12px', borderTop: '1px solid #E2E8F0' }}>
                      <p style={{ fontSize: '11px', color: '#94A3B8', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.7px', marginBottom: '4px' }}>Description</p>
                      <p style={{ fontSize: '13px', color: '#475569' }}>{serviceForm.description}</p>
                    </div>
                  )}
                  {serviceForm.mechanicNotes && (
                    <div style={{ marginTop: '12px', paddingTop: '12px', borderTop: '1px solid #E2E8F0' }}>
                      <p style={{ fontSize: '11px', color: '#94A3B8', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.7px', marginBottom: '4px' }}>Mechanic Notes</p>
                      <p style={{ fontSize: '13px', color: '#475569' }}>{serviceForm.mechanicNotes}</p>
                    </div>
                  )}
                </div>
              </>
            )}

            {/* Totals */}
            <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '28px' }}>
              <div style={{ width: '260px', background: 'linear-gradient(135deg,#1E3A5F,#2563A8)', borderRadius: '12px', padding: '18px 22px', color: '#fff' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: saleType === 'purchase' ? (credit > 0 ? '10px' : 0) : (servicePaymentCalc?.credit > 0 ? '10px' : 0) }}>
                  <span style={{ opacity: 0.8, fontSize: '13px' }}>Due Now:</span>
                  <span style={{ fontWeight: 800, fontSize: '20px' }}>
                    Rs. {saleType === 'purchase' ? payNow.toFixed(2) : servicePaymentCalc?.payNow.toFixed(2)}
                  </span>
                </div>
                {(saleType === 'purchase' ? credit : servicePaymentCalc?.credit) > 0 && (
                  <div style={{ borderTop: '1px solid rgba(255,255,255,0.2)', paddingTop: '10px', display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ opacity: 0.7, fontSize: '12px' }}>Credit Balance:</span>
                    <span style={{ fontSize: '14px', fontWeight: 600, color: '#FDE68A' }}>
                      Rs. {saleType === 'purchase' ? credit.toFixed(2) : servicePaymentCalc?.credit.toFixed(2)}
                    </span>
                  </div>
                )}
              </div>
            </div>

            {/* Actions */}
            <div style={{ display: 'flex', gap: '12px' }}>
              <button onClick={() => setStep(0)} style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', padding: '11px 20px', border: '1.5px solid #E2E8F0', borderRadius: '8px', background: '#F8FAFC', cursor: 'pointer', fontSize: '14px', fontWeight: 600, color: '#64748B' }}>
                <ArrowLeft size={15} /> Edit
              </button>
              <button onClick={saleType === 'purchase' ? handleComplete : handleServiceComplete} disabled={isProcessing} className="btn-sale-primary" style={{ flex: 1, height: '46px', justifyContent: 'center', fontSize: '14px' }}>
                {isProcessing ? 'Processing...' : 'Confirm & Complete Transaction'}
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // ── Step 0: Choose Type & Build ──
  const STEPS = saleType === 'purchase' ? STEPS_PURCHASE : STEPS_SERVICE;
  
  return (
    <div style={{ maxWidth: '800px', margin: '0 auto' }}>
      <StepBar steps={STEPS} />
      <div className="staff-card" style={{ overflow: 'hidden' }}>
        <div className="staff-card-header">
          <span className="staff-card-title">
            {saleType === 'purchase' ? 'New Purchase Sale' : 'New Service Invoice'}
          </span>
        </div>
        <div style={{ padding: '24px 28px' }}>
          {/* Sale Type Selector */}
          <div style={{ marginBottom: '24px', paddingBottom: '24px', borderBottom: '1px solid #E2E8F0' }}>
            <label style={{ fontSize: '12px', color: '#64748B', fontWeight: 600, display: 'block', marginBottom: '8px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Sale Type *</label>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
              <button
                onClick={() => { setSaleType('purchase'); setPaymentStatus(''); setServiceForm({ serviceType: '', serviceDate: '', mileage: '', description: '', mechanicNotes: '', serviceCharge: '', paymentType: '' }); }}
                style={{
                  padding: '12px 16px',
                  borderRadius: '8px',
                  border: saleType === 'purchase' ? '2px solid #1E3A5F' : '1.5px solid #E2E8F0',
                  background: saleType === 'purchase' ? '#DBEAFE' : '#F8FAFC',
                  cursor: 'pointer',
                  fontSize: '14px',
                  fontWeight: 600,
                  color: saleType === 'purchase' ? '#1E3A5F' : '#64748B',
                  transition: '0.2s'
                }}
              >
                Purchase Parts
              </button>
              <button
                onClick={() => { setSaleType('service'); setCart([]); setPaymentStatus(''); }}
                style={{
                  padding: '12px 16px',
                  borderRadius: '8px',
                  border: saleType === 'service' ? '2px solid #1E3A5F' : '1.5px solid #E2E8F0',
                  background: saleType === 'service' ? '#DBEAFE' : '#F8FAFC',
                  cursor: 'pointer',
                  fontSize: '14px',
                  fontWeight: 600,
                  color: saleType === 'service' ? '#1E3A5F' : '#64748B',
                  transition: '0.2s'
                }}
              >
                Service Invoice
              </button>
            </div>
          </div>

          {/* PURCHASE FORM */}
          {saleType === 'purchase' ? (
            <>
              {/* Customer Select */}
              <div style={{ marginBottom: '20px' }}>
                <label style={{ fontSize: '12px', color: '#64748B', fontWeight: 600, display: 'block', marginBottom: '6px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Customer</label>
                <select value={selectedCust} onChange={e => { setSelectedCust(e.target.value); setSelectedVehicle(''); }} className="search-input-field" style={{ width: '100%' }}>
                  <option value="">Choose customer...</option>
                  {customers.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
              </div>

              {/* Vehicle Select */}
              <div style={{ marginBottom: '20px' }}>
                <label style={{ fontSize: '12px', color: '#64748B', fontWeight: 600, display: 'block', marginBottom: '6px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Vehicle</label>
                <select value={selectedVehicle} onChange={e => setSelectedVehicle(e.target.value)} disabled={!selectedCust} className="search-input-field" style={{ width: '100%', opacity: !selectedCust ? 0.5 : 1, cursor: !selectedCust ? 'not-allowed' : 'pointer' }}>
                  <option value="">Choose vehicle...</option>
                  {customerVehicles.map(v => <option key={v.id} value={v.id}>{v.plateNumber} — {v.make} {v.model}</option>)}
                </select>
              </div>

              {/* Part + Qty Row */}
              <div style={{ display: 'flex', gap: '12px', marginBottom: '24px' }}>
                <div style={{ flex: 2 }}>
                  <label style={{ fontSize: '12px', color: '#64748B', fontWeight: 600, display: 'block', marginBottom: '6px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Part</label>
                  <select value={selectedPart} onChange={e => setSelectedPart(e.target.value)} className="search-input-field" style={{ width: '100%' }}>
                    <option value="">Choose part...</option>
                    {parts.map(p => <option key={p.id} value={p.id}>{p.name} ({p.stock} in stock) — Rs. {p.price}</option>)}
                  </select>
                </div>
                <div style={{ flex: 1 }}>
                  <label style={{ fontSize: '12px', color: '#64748B', fontWeight: 600, display: 'block', marginBottom: '6px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Qty</label>
                  <input type="number" min="1" value={quantity} onChange={e => setQuantity(e.target.value)} className="search-input-field" style={{ width: '100%' }} />
                </div>
                <div style={{ alignSelf: 'flex-end' }}>
                  <button onClick={handleAddToCart} className="btn-sale-primary" style={{ height: '38px' }}>
                    + Add
                  </button>
                </div>
              </div>

              {/* Cart */}
              <div style={{ border: '1px solid #E2E8F0', borderRadius: '10px', overflow: 'hidden', marginBottom: '20px' }}>
                <div style={{ background: '#F8FAFC', padding: '12px 16px', borderBottom: '1px solid #E2E8F0', fontSize: '12px', fontWeight: 700, color: '#64748B', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                  Cart Summary
                </div>
                {cart.length === 0 ? (
                  <div className="empty-state" style={{ padding: '36px' }}>
                    <div className="empty-state-icon">🛒</div>
                    <h4>Cart is Empty</h4>
                    <p>Add parts above to build your order.</p>
                  </div>
                ) : (
                  <>
                    {cart.map(item => (
                      <div key={item.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '13px 16px', borderBottom: '1px solid #F1F5F9' }}>
                        <div>
                          <span style={{ fontWeight: 600, color: '#1E293B', fontSize: '14px' }}>{item.name}</span>
                          <span style={{ color: '#94A3B8', fontSize: '12px', marginLeft: '8px' }}>× {item.quantity}</span>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                          <strong style={{ fontSize: '14px', color: '#1E293B' }}>Rs. {(item.price * item.quantity).toFixed(2)}</strong>
                          <button onClick={() => handleRemove(item.id)} style={{ background: '#FEE2E2', border: 'none', borderRadius: '6px', padding: '5px', cursor: 'pointer', display: 'flex', alignItems: 'center' }}>
                            <Trash2 size={13} color="#B91C1C" />
                          </button>
                        </div>
                      </div>
                    ))}
                    <div style={{ padding: '14px 16px', background: '#F8FAFC', display: 'flex', justifyContent: 'flex-end', fontWeight: 700, fontSize: '16px', color: '#1E293B' }}>
                      Total: Rs. {totalAmount.toFixed(2)}
                    </div>
                  </>
                )}
              </div>

              {/* Payment Type */}
              <div style={{ marginBottom: '24px' }}>
                <label style={{ fontSize: '12px', color: '#64748B', fontWeight: 600, display: 'block', marginBottom: '6px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Payment Type</label>
                <select value={paymentStatus} onChange={e => setPaymentStatus(e.target.value)} className="search-input-field" style={{ width: '100%' }}>
                  <option value="">Select payment type...</option>
                  <option value="full-payment">Full Payment (100%)</option>
                  <option value="half-payment">Half Payment (50% now)</option>
                  <option value="partial-payment">Partial Payment (10% now)</option>
                </select>

                {paymentStatus && (
                  <div style={{ marginTop: '12px', padding: '16px', background: paymentStatus === 'full-payment' ? '#F0FDF4' : '#FFFBEB', border: `1.5px dashed ${paymentStatus === 'full-payment' ? '#86EFAC' : '#FCD34D'}`, borderRadius: '10px' }}>
                    <div style={{ fontSize: '12px', fontWeight: 700, color: paymentStatus === 'full-payment' ? '#15803D' : '#B45309', marginBottom: '6px' }}>
                      {paymentStatus === 'full-payment' ? '✓ Full payment upfront' : paymentStatus === 'half-payment' ? '⚡ 50% now, 50% on credit' : '⚡ 10% now, 90% on credit'}
                    </div>
                    <div style={{ fontSize: '16px', fontWeight: 800, color: '#1E293B' }}>
                      Amount Due Now: <span style={{ color: paymentStatus === 'full-payment' ? '#15803D' : '#D97706' }}>Rs. {payNow.toFixed(2)}</span>
                    </div>
                    {credit > 0 && <div style={{ fontSize: '12px', color: '#B91C1C', marginTop: '4px' }}>Credit Added: Rs. {credit.toFixed(2)}</div>}
                  </div>
                )}
              </div>

              <button
                onClick={() => setStep(1)}
                disabled={!paymentStatus || !selectedCust || !selectedVehicle || cart.length === 0}
                className="btn-sale-primary"
                style={{ width: '100%', height: '46px', justifyContent: 'center', fontSize: '14px' }}
              >
                Next: Review Invoice <ArrowRight size={16} />
              </button>
            </>
          ) : (
            // SERVICE FORM
            <>
              {/* Customer Select */}
              <div style={{ marginBottom: '20px' }}>
                <label style={{ fontSize: '12px', color: '#64748B', fontWeight: 600, display: 'block', marginBottom: '6px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Customer *</label>
                <select value={selectedCust} onChange={e => { setSelectedCust(e.target.value); setSelectedVehicle(''); }} className="search-input-field" style={{ width: '100%' }}>
                  <option value="">Choose customer...</option>
                  {customers.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
              </div>

              {/* Vehicle Select */}
              <div style={{ marginBottom: '20px' }}>
                <label style={{ fontSize: '12px', color: '#64748B', fontWeight: 600, display: 'block', marginBottom: '6px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Vehicle *</label>
                <select value={selectedVehicle} onChange={e => setSelectedVehicle(e.target.value)} disabled={!selectedCust} className="search-input-field" style={{ width: '100%', opacity: !selectedCust ? 0.5 : 1, cursor: !selectedCust ? 'not-allowed' : 'pointer' }}>
                  <option value="">Choose vehicle...</option>
                  {customerVehicles.map(v => <option key={v.id} value={v.id}>{v.plateNumber} — {v.make} {v.model}</option>)}
                </select>
              </div>

              {/* Service Type */}
              <div style={{ marginBottom: '20px' }}>
                <label style={{ fontSize: '12px', color: '#64748B', fontWeight: 600, display: 'block', marginBottom: '6px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Service Type *</label>
                <select value={serviceForm.serviceType} onChange={e => setServiceForm({...serviceForm, serviceType: e.target.value})} className="search-input-field" style={{ width: '100%' }}>
                  <option value="">Select service type...</option>
                  {SERVICE_TYPES.map(st => <option key={st} value={st}>{st}</option>)}
                </select>
              </div>

              {/* Service Date & Mileage */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '20px' }}>
                <div>
                  <label style={{ fontSize: '12px', color: '#64748B', fontWeight: 600, display: 'block', marginBottom: '6px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Service Date *</label>
                  <input type="date" value={serviceForm.serviceDate} onChange={e => setServiceForm({...serviceForm, serviceDate: e.target.value})} className="search-input-field" style={{ width: '100%' }} />
                </div>
                <div>
                  <label style={{ fontSize: '12px', color: '#64748B', fontWeight: 600, display: 'block', marginBottom: '6px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Mileage (km)</label>
                  <input type="number" placeholder="e.g., 45000" value={serviceForm.mileage} onChange={e => setServiceForm({...serviceForm, mileage: e.target.value})} className="search-input-field" style={{ width: '100%' }} />
                </div>
              </div>

              {/* Description */}
              <div style={{ marginBottom: '20px' }}>
                <label style={{ fontSize: '12px', color: '#64748B', fontWeight: 600, display: 'block', marginBottom: '6px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Customer Problem / Description</label>
                <textarea value={serviceForm.description} onChange={e => setServiceForm({...serviceForm, description: e.target.value})} placeholder="Describe the customer's problem or what needs to be serviced..." className="search-input-field" style={{ width: '100%', minHeight: '90px', resize: 'vertical' }} />
              </div>

              {/* Mechanic Notes */}
              <div style={{ marginBottom: '20px' }}>
                <label style={{ fontSize: '12px', color: '#64748B', fontWeight: 600, display: 'block', marginBottom: '6px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Mechanic Notes</label>
                <textarea value={serviceForm.mechanicNotes} onChange={e => setServiceForm({...serviceForm, mechanicNotes: e.target.value})} placeholder="Any additional notes or observations from the mechanic..." className="search-input-field" style={{ width: '100%', minHeight: '80px', resize: 'vertical' }} />
              </div>

              {/* Service Charge & Payment */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '20px' }}>
                <div>
                  <label style={{ fontSize: '12px', color: '#64748B', fontWeight: 600, display: 'block', marginBottom: '6px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Service Charge (Rs.) *</label>
                  <input type="number" placeholder="0.00" value={serviceForm.serviceCharge} onChange={e => setServiceForm({...serviceForm, serviceCharge: e.target.value})} className="search-input-field" style={{ width: '100%' }} />
                </div>
                <div>
                  <label style={{ fontSize: '12px', color: '#64748B', fontWeight: 600, display: 'block', marginBottom: '6px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Payment Type *</label>
                  <select value={paymentStatus} onChange={e => setPaymentStatus(e.target.value)} className="search-input-field" style={{ width: '100%' }}>
                    <option value="">Select payment type...</option>
                    <option value="full-payment">Full Payment (100%)</option>
                    <option value="half-payment">Half Payment (50% now)</option>
                    <option value="partial-payment">Partial Payment (10% now)</option>
                  </select>
                </div>
              </div>

              {paymentStatus && parseFloat(serviceForm.serviceCharge) > 0 && (
                <div style={{ marginBottom: '24px', padding: '16px', background: paymentStatus === 'full-payment' ? '#F0FDF4' : '#FFFBEB', border: `1.5px dashed ${paymentStatus === 'full-payment' ? '#86EFAC' : '#FCD34D'}`, borderRadius: '10px' }}>
                  <div style={{ fontSize: '12px', fontWeight: 700, color: paymentStatus === 'full-payment' ? '#15803D' : '#B45309', marginBottom: '6px' }}>
                    {paymentStatus === 'full-payment' ? '✓ Full payment upfront' : paymentStatus === 'half-payment' ? '⚡ 50% now, 50% on credit' : '⚡ 10% now, 90% on credit'}
                  </div>
                  <div style={{ fontSize: '16px', fontWeight: 800, color: '#1E293B' }}>
                    Amount Due Now: <span style={{ color: paymentStatus === 'full-payment' ? '#15803D' : '#D97706' }}>Rs. {(
                      paymentStatus === 'full-payment' ? parseFloat(serviceForm.serviceCharge) :
                      paymentStatus === 'half-payment' ? parseFloat(serviceForm.serviceCharge) * 0.5 :
                      parseFloat(serviceForm.serviceCharge) * 0.1
                    ).toFixed(2)}</span>
                  </div>
                </div>
              )}

              <button
                onClick={() => setStep(1)}
                disabled={!selectedCust || !selectedVehicle || !serviceForm.serviceType || !serviceForm.serviceDate || !serviceForm.serviceCharge || !paymentStatus}
                className="btn-sale-primary"
                style={{ width: '100%', height: '46px', justifyContent: 'center', fontSize: '14px' }}
              >
                Next: Review Invoice <ArrowRight size={16} />
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default Sales;
