import React, { useState, useEffect } from 'react';
import StaffManager from '../components/management/StaffManager';
import InventoryManager from '../components/management/InventoryManager';
import CustomerManager from '../components/management/CustomerManager';
import Dialog from '../components/Dialog';
import { vendorService } from '../services/vendorService';
import { useToast } from '../context/ToastContext';
import PartFormModal from '../components/parts/PartFormModal';
import VendorSearchSelect from '../components/VendorSearchSelect';

export function AdminDashboard({ staffList, onAddStaff, onRemoveStaff, onUpdateStaff, sales, inventory, onUpdateInventory, customerList, onRemoveCustomer, onUpdateCustomer, onOpenVendorManagement }) {
  const showToast = useToast();
  const [viewType, setViewType] = useState('daily');
  const [adminRoute, setAdminRoute] = useState('main');
  const [report, setReport] = useState({ period: 'daily', revenue: 0, count: 0 });
  const [vendors, setVendors] = useState([]);
  const [isAddPartModalOpen, setIsAddPartModalOpen] = useState(false);
  const [isAddPartSaving, setIsAddPartSaving] = useState(false);
  const [liveTransactions, setLiveTransactions] = useState([]);
  const [isLiveTransactionsLoading, setIsLiveTransactionsLoading] = useState(false);
  const [liveTransactionsError, setLiveTransactionsError] = useState('');

  const refreshLiveTransactions = async () => {
    setIsLiveTransactionsLoading(true);
    setLiveTransactionsError('');
    try {
      const { apiFetch } = await import('../services/api');
      const response = await apiFetch('/Transactions/recent');
      console.log('Live transactions:', response);
      setLiveTransactions(Array.isArray(response) ? response : []);
    } catch (error) {
      setLiveTransactions([]);
      setLiveTransactionsError('Unable to load live transactions.');
      showToast('error', 'Unable to load live transactions.');
    } finally {
      setIsLiveTransactionsLoading(false);
    }
  };

  useEffect(() => {
    import('../services/api').then(({ apiFetch }) => {
      const period = viewType.trim().toLowerCase();
      apiFetch(`/Reports/revenue?period=${encodeURIComponent(period)}`).then(response => {
        const data = response?.data ?? response;
        if (data) {
          setReport({
            period: data.period ?? data.Period ?? period,
            revenue: Number(data.revenue ?? data.totalRevenue ?? data.TotalRevenue ?? 0),
            count: Number(data.count ?? data.invoiceCount ?? data.InvoiceCount ?? 0)
          });
        }
      });
      vendorService.getVendors({ pageNumber: 1, pageSize: 200, status: 'all' }).then((res) => {
        if (Array.isArray(res)) {
          setVendors(res);
          return;
        }
        const items = Array.isArray(res?.items) ? res.items : [];
        setVendors(items);
      }).catch(() => setVendors([]));
    });
  }, [viewType]);

  useEffect(() => {
    refreshLiveTransactions();
  }, []);

  useEffect(() => {
    if (Array.isArray(sales) && sales.length > 0) {
      refreshLiveTransactions();
    }
  }, [sales]);

  const handleAdminAddPart = async (payload) => {
    setIsAddPartSaving(true);
    try {
      const { apiFetch } = await import('../services/api');
      const newPart = await apiFetch('/parts', {
        method: 'POST',
        body: JSON.stringify(payload)
      });
      const vendorName = vendors.find(v => v.id === payload.vendorId)?.name || 'Unknown Vendor';
      onUpdateInventory([...inventory, { id: newPart.id, name: newPart.name, stock: newPart.stockLevel, price: newPart.price, vendor: vendorName }]);
      showToast('success', 'Part created successfully.');
      setIsAddPartModalOpen(false);
    } catch (error) {
      showToast('error', error?.message || 'Failed to create part.');
    } finally {
      setIsAddPartSaving(false);
    }
  };

  if (adminRoute === 'add-staff') return <AddStaffPage onAdd={onAddStaff} onBack={() => setAdminRoute('main')} />;
  if (adminRoute === 'manage-inventory') return <InventoryPurchasePage inventory={inventory} onUpdate={onUpdateInventory} onBack={() => setAdminRoute('main')} onRefreshTransactions={refreshLiveTransactions} />;
  if (adminRoute === 'manage-customers') return <CustomerManagementPage customers={customerList} onRemove={onRemoveCustomer} onUpdate={onUpdateCustomer} onBack={() => setAdminRoute('main')} />;
  if (adminRoute === 'view-all-inventory') return <FullInventoryPage inventory={inventory} onBack={() => setAdminRoute('main')} />;
  if (adminRoute === 'view-all-staff') return <FullStaffPage staffList={staffList} onBack={() => setAdminRoute('main')} />;

  return (
    <div style={{ position: 'relative', minHeight: '100vh' }}>
      <div style={{ 
        position: 'fixed', 
        top: '50%', 
        left: '50%', 
        transform: 'translate(-50%, -50%)', 
        width: '40rem',
        height: '40rem',
        opacity: 0.05, 
        zIndex: -1, 
        pointerEvents: 'none',
        userSelect: 'none',
        backgroundImage: `url('https://cdn-icons-png.flaticon.com/512/912/912318.png')`,
        backgroundSize: 'contain',
        backgroundRepeat: 'no-repeat',
        backgroundPosition: 'center',
        filter: 'hue-rotate(10deg)'
      }}>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(350px, 1fr))', gap: '2rem', alignItems: 'start' }}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
        <div className="card" id="stats">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <h3>Live Financials</h3>
            <select value={viewType} onChange={e => setViewType(e.target.value)} style={{ width: 'auto', padding: '0.4rem', marginBottom: 0 }}>
              <option value="daily">Daily</option>
              <option value="monthly">Monthly</option>
              <option value="yearly">Yearly</option>
            </select>
          </div>
          <table style={{ width: '100%', borderCollapse: 'collapse', marginTop: '1rem' }}>
            <thead><tr><th>Period</th><th>Count</th><th>Revenue</th></tr></thead>
            <tbody><tr><td style={{ textTransform: 'capitalize' }}>{report.period ?? viewType}</td><td>{report.count ?? 0}</td><td>Rs. {(report.revenue ?? 0).toFixed(2)}</td></tr></tbody>
          </table>
        </div>
        <div id="vendors" className="card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <h3>Partners & Vendors</h3>
            <div style={{ display: 'flex', gap: '8px' }}>
              <button onClick={onOpenVendorManagement} className="btn-small" style={{ background: '#dbeafe', color: '#1d4ed8' }}>Vendor Management</button>
            </div>
          </div>
          <div className="data-list">
            {vendors.slice(0, 5).map(v => (
              <div key={v.id} className="list-item"><span>{v.name}</span><span className="badge">Active</span></div>
            ))}
            {vendors.length === 0 && <p style={{opacity: 0.5}}>No vendors found.</p>}
            {vendors.length > 5 && <p style={{ textAlign: 'center', fontSize: '0.8rem', opacity: 0.5, marginTop: '0.5rem' }}>+ {vendors.length - 5} more partners...</p>}
          </div>
        </div>
        <div id="live-transactions" className="card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <h3>Live Transactions</h3>
            <button onClick={refreshLiveTransactions} className="btn-small" style={{ background: '#f1f5f9', color: '#0f172a' }}>
              Refresh
            </button>
          </div>
          <div className="data-list" style={{ marginTop: '1rem' }}>
            {isLiveTransactionsLoading ? (
              <p style={{ textAlign: 'center', padding: '2rem', opacity: 0.6 }}>Loading transactions...</p>
            ) : liveTransactions.length === 0 ? (
              <p style={{ textAlign: 'center', padding: '2rem', opacity: 0.6 }}>No transactions found.</p>
            ) : (
              liveTransactions.map((tx) => {
                const invoiceId = tx.invoiceId ?? tx.InvoiceId ?? tx.id ?? tx.Id;
                const type = tx.type ?? tx.Type ?? 'Unknown';
                const dateValue = tx.date ?? tx.Date;
                const dateLabel = dateValue ? new Date(dateValue).toLocaleString() : 'N/A';
                const customerName = tx.customerName ?? tx.CustomerName;
                const vendorName = tx.vendorName ?? tx.VendorName;
                const totalAmount = tx.totalAmount ?? tx.TotalAmount ?? 0;
                const itemCount = tx.itemCount ?? tx.ItemCount ?? tx.items?.length ?? 0;
                const isPaid = tx.isPaid ?? tx.IsPaid;
                const summary = tx.summary ?? tx.Summary ?? (type === 'Sale'
                  ? `Sale to ${customerName || 'Walk-in'}`
                  : `Purchase from ${vendorName || 'Unknown Vendor'}`);

                return (
                  <div key={invoiceId} className="list-item" style={{ alignItems: 'flex-start' }}>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                      <strong>{summary}</strong>
                      <span style={{ fontSize: '0.8rem', opacity: 0.6 }}>{dateLabel}</span>
                      <span style={{ fontSize: '0.8rem', opacity: 0.6 }}>{type} - {itemCount} item{itemCount === 1 ? '' : 's'}</span>
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '6px' }}>
                      <span className="badge">Rs. {Number(totalAmount || 0).toFixed(2)}</span>
                      <span className="badge" style={{ background: isPaid ? '#dcfce7' : '#fee2e2', color: isPaid ? '#15803d' : '#991b1b' }}>
                        {isPaid ? 'Paid' : 'Unpaid'}
                      </span>
                    </div>
                  </div>
                );
              })
            )}
            {liveTransactionsError && !isLiveTransactionsLoading && (
              <p style={{ textAlign: 'center', padding: '0.5rem', color: '#ef4444' }}>{liveTransactionsError}</p>
            )}
          </div>
        </div>
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
        <StaffManager userRole="Admin" staffList={staffList} onNavigate={setAdminRoute} onRemove={onRemoveStaff} onUpdate={onUpdateStaff} />
        <div id="customers"><CustomerManager customers={customerList} onNavigate={setAdminRoute} onRemove={onRemoveCustomer} onEdit={onUpdateCustomer} /></div>
      </div>
        <div id="inventory"><InventoryManager inventory={inventory} onNavigate={setAdminRoute} onAddPart={() => setIsAddPartModalOpen(true)} /></div>
    </div>
      <PartFormModal
        isOpen={isAddPartModalOpen}
        isEditing={false}
        initialPart={null}
        vendors={vendors}
        onClose={() => setIsAddPartModalOpen(false)}
        onSubmit={handleAdminAddPart}
        isSaving={isAddPartSaving}
      />
    </div>
  );
}

function AddStaffPage({ onAdd, onBack }) {
  const showToast = useToast();
  const [newStaff, setNewStaff] = useState({
    fullName: '',
    emailAddress: '',
    phoneNumber: '',
    password: '',
    confirmPassword: ''
  });
  const [errors, setErrors] = useState({});
  const [isSaving, setIsSaving] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const handleChange = (field) => (event) => {
    const { value } = event.target;
    setNewStaff((current) => ({ ...current, [field]: value }));
    setErrors((current) => ({ ...current, [field]: '' }));
  };

  const validate = () => {
    const nextErrors = {};

    if (!newStaff.fullName.trim()) {
      nextErrors.fullName = 'Full Name is required.';
    }

    if (!newStaff.emailAddress.trim()) {
      nextErrors.emailAddress = 'Email Address is required.';
    }

    if (!newStaff.phoneNumber.trim()) {
      nextErrors.phoneNumber = 'Phone Number is required.';
    }

    if (!newStaff.password) {
      nextErrors.password = 'Password is required.';
    } else if (newStaff.password.length < 6) {
      nextErrors.password = 'Password must be at least 6 characters.';
    }

    if (!newStaff.confirmPassword) {
      nextErrors.confirmPassword = 'Confirm Password is required.';
    } else if (newStaff.password !== newStaff.confirmPassword) {
      nextErrors.confirmPassword = 'Passwords do not match.';
    }

    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  };

  const handleAdd = async (event) => {
    event.preventDefault();

    if (!validate()) {
      showToast('error', 'Please fix the highlighted staff form errors.');
      return;
    }

    setIsSaving(true);
    try {
      const isCreated = await onAdd({
        fullName: newStaff.fullName.trim(),
        emailAddress: newStaff.emailAddress.trim(),
        phoneNumber: newStaff.phoneNumber.trim(),
        password: newStaff.password,
        confirmPassword: newStaff.confirmPassword
      });
      if (isCreated) {
        onBack();
      }
    } finally {
      setIsSaving(false);
    }
  };

  const errorMessages = Object.values(errors).filter(Boolean);

  return (
    <div className="card" style={{ maxWidth: '600px', margin: 'auto' }}>
      <button onClick={onBack} className="btn-small" style={{ marginBottom: '1rem', background: '#cbd5e1', color: '#0f172a' }}>← Back</button>
      <h2>Add System Staff</h2>
      <p style={{ opacity: 0.7, marginTop: '0.5rem' }}>Create a staff account with secure credentials and contact details.</p>
      <form onSubmit={handleAdd} className="vendor-form" style={{ marginTop: '1.5rem' }}>
        <div className="vendor-form-grid">
          <label>
            <span>Full Name</span>
            <input
              type="text"
              placeholder="Staff full name"
              value={newStaff.fullName}
              onChange={handleChange('fullName')}
              aria-invalid={Boolean(errors.fullName)}
            />
          </label>
          <label>
            <span>Email Address</span>
            <input
              type="email"
              placeholder="staff@example.com"
              value={newStaff.emailAddress}
              onChange={handleChange('emailAddress')}
              aria-invalid={Boolean(errors.emailAddress)}
            />
          </label>
          <label>
            <span>Phone Number</span>
            <input
              type="text"
              placeholder="98XXXXXXXX"
              value={newStaff.phoneNumber}
              onChange={handleChange('phoneNumber')}
              aria-invalid={Boolean(errors.phoneNumber)}
            />
          </label>
          <label>
            <span>Password</span>
            <div style={{ position: 'relative' }}>
              <input
                type={showPassword ? 'text' : 'password'}
                placeholder="At least 6 characters"
                value={newStaff.password}
                onChange={handleChange('password')}
                aria-invalid={Boolean(errors.password)}
                style={{ marginBottom: 0, paddingRight: '4.5rem' }}
              />
              <button
                type="button"
                onClick={() => setShowPassword((current) => !current)}
                style={{ position: 'absolute', right: '0.85rem', top: '0.85rem', background: 'none', border: 'none', color: 'var(--primary)', cursor: 'pointer', padding: 0 }}
              >
                {showPassword ? 'Hide' : 'Show'}
              </button>
            </div>
          </label>
          <label>
            <span>Confirm Password</span>
            <div style={{ position: 'relative' }}>
              <input
                type={showConfirmPassword ? 'text' : 'password'}
                placeholder="Re-enter password"
                value={newStaff.confirmPassword}
                onChange={handleChange('confirmPassword')}
                aria-invalid={Boolean(errors.confirmPassword)}
                style={{ marginBottom: 0, paddingRight: '4.5rem' }}
              />
              <button
                type="button"
                onClick={() => setShowConfirmPassword((current) => !current)}
                style={{ position: 'absolute', right: '0.85rem', top: '0.85rem', background: 'none', border: 'none', color: 'var(--primary)', cursor: 'pointer', padding: 0 }}
              >
                {showConfirmPassword ? 'Hide' : 'Show'}
              </button>
            </div>
          </label>
        </div>

        {errorMessages.length > 0 && (
          <div className="form-error" style={{ marginTop: '1rem' }}>
            {errorMessages.map((message) => (
              <div key={message}>{message}</div>
            ))}
          </div>
        )}

        <div className="modal-actions" style={{ marginTop: '1.5rem' }}>
          <button type="button" className="btn-secondary" onClick={onBack} disabled={isSaving}>
            Cancel
          </button>
          <button type="submit" disabled={isSaving}>
            {isSaving ? 'Creating...' : 'Create Staff'}
          </button>
        </div>
      </form>
    </div>
  );
}

function InventoryPurchasePage({ inventory, onUpdate, onBack, onRefreshTransactions }) {
  const showToast = useToast();
  const [purchaseData, setPurchaseData] = useState({ partId: '', quantity: '', vendorId: '' });
  const [vendors, setVendors] = useState([]);
  useEffect(() => {
    import('../services/api').then(({ apiFetch }) =>
      apiFetch('/vendors?pageSize=200').then((res) => {
        const items = Array.isArray(res?.items) ? res.items : Array.isArray(res) ? res : [];
        setVendors(items);
      })
    );
  }, []);
  const handlePurchase = async (e) => {
    e.preventDefault();
    const part = inventory.find(p => p.id === parseInt(purchaseData.partId));
    if (!part) return;
    try {
      const { apiFetch } = await import('../services/api');
      await apiFetch('/Transactions/purchase', {
        method: 'POST',
        body: JSON.stringify({
          vendorId: parseInt(purchaseData.vendorId),
          totalAmount: part.price * parseInt(purchaseData.quantity),
          items: [{ partId: parseInt(purchaseData.partId), quantity: parseInt(purchaseData.quantity), unitPrice: part.price * 0.7 }]
        })
      });
      showToast('success', 'Stock updated successfully.');
      const updatedInventory = inventory.map(p => p.id === parseInt(purchaseData.partId) ? { ...p, stock: p.stock + parseInt(purchaseData.quantity) } : p);
      onUpdate(updatedInventory);
      if (onRefreshTransactions) {
        await onRefreshTransactions();
      }
      onBack();
    } catch(err) { showToast('error', 'Purchase failed.'); }
  };
  return (
    <div className="card" style={{ maxWidth: '600px', margin: 'auto' }}>
      <button onClick={onBack} className="btn-small" style={{ marginBottom: '1rem', background: '#cbd5e1', color: '#0f172a' }}>← Back</button>
      <h2>New Stock Purchase</h2>
      <form onSubmit={handlePurchase} className="mini-form">
        <select required onChange={e => setPurchaseData({...purchaseData, partId: e.target.value})} value={purchaseData.partId}>
          <option value="">Select Part</option>
          {inventory.map(p => <option key={p.id} value={p.id}>{p.name} (Current: {p.stock})</option>)}
        </select>
        <input type="number" placeholder="Quantity" required onChange={e => setPurchaseData({...purchaseData, quantity: e.target.value})} value={purchaseData.quantity} />
        <VendorSearchSelect
          vendors={vendors}
          value={purchaseData.vendorId ? Number(purchaseData.vendorId) : null}
          onChange={(id) => setPurchaseData({...purchaseData, vendorId: id ? String(id) : ''})}
        />
        <button type="submit" style={{ marginTop: '1rem' }}>Complete Purchase</button>
      </form>
    </div>
  );
}

function CustomerManagementPage({ customers, onRemove, onUpdate, onBack }) {
  const showToast = useToast();
  const [editingId, setEditingId] = useState(null);
  const [editData, setEditData] = useState({ name: '', email: '', phone: '', plate: '' });
  const [validationErrors, setValidationErrors] = useState({ name: '', email: '', phone: '' });
  const [removeDialog, setRemoveDialog] = useState({ isOpen: false, customerId: null, customerName: '' });
  const [successDialog, setSuccessDialog] = useState({ isOpen: false, message: '' });
  const [isRemoving, setIsRemoving] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const startEdit = (c) => { setEditingId(c.id); setEditData({ name: c.name, email: c.email || '', phone: c.phone || '', plate: c.plate || '' }); setValidationErrors({ name: '', email: '', phone: '' }); };

  const validateName = (name) => {
    if (!name.trim()) return 'Name is required';
    if (!/^[a-zA-Z\s]*$/.test(name)) return 'Name must contain only letters and spaces';
    return '';
  };

  const validateEmail = (email) => {
    if (!email.trim()) return 'Email is required';
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) return 'Invalid email format';
    return '';
  };

  const validatePhone = (phone) => {
    if (!phone.trim()) return 'Phone number is required';
    if (!/^\d{10}$/.test(phone.replace(/\D/g, ''))) return 'Phone must be 10 digits with no letters or symbols';
    return '';
  };
  
  const handleSave = async (id) => {
    const nameError = validateName(editData.name);
    const emailError = validateEmail(editData.email);
    const phoneError = validatePhone(editData.phone);

    setValidationErrors({ name: nameError, email: emailError, phone: phoneError });

    if (nameError || emailError || phoneError) return;

    setIsSaving(true);
    try {
      const { apiFetch } = await import('../services/api');
      await apiFetch(`/users/${id}`, {
        method: 'PUT',
        body: JSON.stringify({ 
          name: editData.name, 
          email: editData.email,
          phoneNumber: editData.phone
        })
      });
      
      const originalCustomer = customers.find(c => c.id === id);
      const updatedCustomer = { 
        ...originalCustomer,
        name: editData.name, 
        email: editData.email,
        phone: editData.phone,
        plate: editData.plate
      };
      
      setEditingId(null);
      onUpdate(updatedCustomer);
      setSuccessDialog({ isOpen: true, message: `${editData.name} has been updated successfully.` });
    } catch (error) {
      showToast('error', 'Error updating customer: ' + (error.message || 'Unknown error'));
    } finally {
      setIsSaving(false);
    }
  };

  const handleRemoveClick = (customerId, customerName) => {
    setRemoveDialog({ isOpen: true, customerId, customerName });
  };

  const handleConfirmRemove = async () => {
    setIsRemoving(true);
    try {
      await onRemove(removeDialog.customerId);
      setRemoveDialog({ isOpen: false, customerId: null, customerName: '' });
      setSuccessDialog({ isOpen: true, message: `${removeDialog.customerName} has been removed successfully.` });
    } catch (error) {
      showToast('error', 'Error removing customer: ' + (error.message || 'Unknown error'));
      setRemoveDialog({ isOpen: false, customerId: null, customerName: '' });
    } finally {
      setIsRemoving(false);
    }
  };

  return (
    <div className="card" style={{ maxWidth: '800px', margin: 'auto' }}>
      <button onClick={onBack} className="btn-small" style={{ marginBottom: '1rem', background: '#cbd5e1', color: '#0f172a' }}>← Back</button>
      <h2>Customer Database</h2>
      <div className="data-list">
        {customers.map(c => (
          <div key={c.id} className="list-item">
            {editingId === c.id ? (
              <div className="mini-form" style={{ width: '100%' }}>
                <div>
                  <label style={{ fontSize: '0.85rem', opacity: 0.7 }}>Name</label>
                  <input 
                    type="text" 
                    value={editData.name} 
                    onChange={e => {
                      setEditData({...editData, name: e.target.value});
                      setValidationErrors({...validationErrors, name: validateName(e.target.value)});
                    }}
                    placeholder="Customer Name"
                    style={{ borderColor: validationErrors.name ? '#ef4444' : '' }}
                  />
                  {validationErrors.name && <span style={{ fontSize: '0.75rem', color: '#ef4444' }}>{validationErrors.name}</span>}
                </div>
                <div>
                  <label style={{ fontSize: '0.85rem', opacity: 0.7 }}>Email</label>
                  <input 
                    type="email" 
                    value={editData.email} 
                    onChange={e => {
                      setEditData({...editData, email: e.target.value});
                      setValidationErrors({...validationErrors, email: validateEmail(e.target.value)});
                    }}
                    placeholder="Email"
                    style={{ borderColor: validationErrors.email ? '#ef4444' : '' }}
                  />
                  {validationErrors.email && <span style={{ fontSize: '0.75rem', color: '#ef4444' }}>{validationErrors.email}</span>}
                </div>
                <div>
                  <label style={{ fontSize: '0.85rem', opacity: 0.7 }}>Phone</label>
                  <input 
                    type="text" 
                    value={editData.phone} 
                    onChange={e => {
                      setEditData({...editData, phone: e.target.value});
                      setValidationErrors({...validationErrors, phone: validatePhone(e.target.value)});
                    }}
                    placeholder="Phone Number"
                    style={{ borderColor: validationErrors.phone ? '#ef4444' : '' }}
                  />
                  {validationErrors.phone && <span style={{ fontSize: '0.75rem', color: '#ef4444' }}>{validationErrors.phone}</span>}
                </div>
                <div>
                  <label style={{ fontSize: '0.85rem', opacity: 0.7 }}>Plate Number</label>
                  <input 
                    type="text" 
                    value={editData.plate} 
                    onChange={e => setEditData({...editData, plate: e.target.value})}
                    placeholder="Vehicle Plate"
                  />
                </div>
                <div style={{ display: 'flex', gap: '0.5rem', marginTop: '1rem' }}>
                  <button onClick={() => handleSave(c.id)} className="btn-small" disabled={isSaving || validationErrors.name || validationErrors.email || validationErrors.phone} style={{ flex: 1 }}>
                    {isSaving ? 'Saving...' : 'Save'}
                  </button>
                  <button onClick={() => setEditingId(null)} className="btn-small" style={{ flex: 1, background: '#cbd5e1', color: '#0f172a' }}>Cancel</button>
                </div>
              </div>
            ) : (
              <div style={{ display: 'flex', justifyContent: 'space-between', width: '100%' }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                  <strong>{c.name}</strong>
                  {c.vehicleInfo ? (
                    <div style={{ fontSize: '0.75rem', opacity: 0.7 }}>
                      <span style={{ fontWeight: 600 }}>
                        {c.vehicleInfo.make?.toLowerCase().includes(c.vehicleInfo.model?.toLowerCase()) || c.vehicleInfo.model?.toLowerCase().includes(c.vehicleInfo.make?.toLowerCase()) 
                          ? c.vehicleInfo.make 
                          : `${c.vehicleInfo.make} ${c.vehicleInfo.model}`} ({c.vehicleInfo.year})
                      </span>
                      <br />
                      Plate: {c.vehicleInfo.plateNumber}
                      {c.vehicleCount > 1 && <span className="badge" style={{ marginLeft: '5px', fontSize: '0.6rem', padding: '1px 4px' }}>+{c.vehicleCount - 1} more</span>}
                    </div>
                  ) : (
                    <span style={{ fontSize: '0.75rem', opacity: 0.5 }}>No vehicle added</span>
                  )}
                </div>
                <div><button onClick={() => startEdit(c)} className="btn-small">Edit</button><button onClick={() => handleRemoveClick(c.id, c.name)} className="btn-small">Remove</button></div>
              </div>
            )}
          </div>
        ))}
      </div>

      <Dialog
        isOpen={removeDialog.isOpen}
        title="Remove Customer"
        message={`Are you sure you want to remove ${removeDialog.customerName}? This action cannot be undone.`}
        type="confirm"
        confirmText="Remove"
        cancelText="Cancel"
        isLoading={isRemoving}
        onConfirm={handleConfirmRemove}
        onCancel={() => setRemoveDialog({ isOpen: false, customerId: null, customerName: '' })}
      />

      <Dialog
        isOpen={successDialog.isOpen}
        title="Success"
        message={successDialog.message}
        type="success"
        confirmText="OK"
        onConfirm={() => setSuccessDialog({ isOpen: false, message: '' })}
      />
    </div>
  );
}


function FullInventoryPage({ inventory, onBack }) {
  return (
    <div className="card" style={{ maxWidth: '900px', margin: 'auto' }}>
      <button onClick={onBack} className="btn-small" style={{ marginBottom: '1rem', background: '#cbd5e1', color: '#0f172a' }}>← Back</button>
      <h2>Full Inventory</h2>
      <div className="data-list">
        {inventory.map(p => (
          <div key={p.id} className="list-item">
            <div><strong>{p.name}</strong><br/>Vendor: {p.vendor}</div>
            <div>Rs. {p.price}<br/><span className="badge">{p.stock} Stock</span></div>
          </div>
        ))}
      </div>
    </div>
  );
}

function FullStaffPage({ staffList, onBack }) {
  return (
    <div className="card" style={{ maxWidth: "900px", margin: "auto" }}>
      <button onClick={onBack} className="btn-small" style={{ marginBottom: "1rem", background: "#cbd5e1", color: "#0f172a" }}>← Back to Dashboard</button>
      <h2>System Staff Directory</h2>
      <div className="data-list" style={{ marginTop: "2rem" }}>
        {staffList.map(s => (
          <div key={s.id} className="list-item" style={{ padding: "1.2rem" }}>
            <div>
              <strong style={{ fontSize: "1.1rem" }}>{s.name}</strong>
              <div style={{ opacity: 0.6 }}>{s.email}</div>
            </div>
            <div style={{ textAlign: "right" }}>
              <span className="badge" style={{ background: "var(--primary)" }}>{s.role}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
