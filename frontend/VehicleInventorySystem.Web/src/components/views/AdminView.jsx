import React, { useState, useEffect } from 'react';
import StaffManager from '../management/StaffManager';
import InventoryManager from '../management/InventoryManager';
import CustomerManager from '../management/CustomerManager';
import Dialog from '../Dialog';
import { vendorService } from '../../services/vendorService';

export function AdminView({ staffList, onAddStaff, onRemoveStaff, onUpdateStaff, sales, inventory, onUpdateInventory, customerList, onRemoveCustomer, onUpdateCustomer, onOpenVendorManagement }) {
  const [viewType, setViewType] = useState('daily');
  const [adminRoute, setAdminRoute] = useState('main');
  const [report, setReport] = useState({ TotalRevenue: 0, InvoiceCount: 0 });
  const [vendors, setVendors] = useState([]);
  const [isSeeding, setIsSeeding] = useState(false);

  useEffect(() => {
    import('../../api').then(({ apiFetch }) => {
      apiFetch(`/Reports/revenue?period=${viewType}`).then(res => {
        if (res) {
          setReport({
            TotalRevenue: res.totalRevenue ?? res.TotalRevenue ?? 0,
            InvoiceCount: res.invoiceCount ?? res.InvoiceCount ?? 0
          });
        }
      });
      vendorService.getVendors({ pageNumber: 1, pageSize: 5 }).then((res) => {
        if (Array.isArray(res)) {
          setVendors(res);
          return;
        }
        const items = Array.isArray(res?.items) ? res.items : [];
        setVendors(items);
      }).catch(() => setVendors([]));
    });
  }, [viewType]);

  const handleSeedData = async () => {
    if (!window.confirm('This will add 50 realistic items (10 Vendors, 40 Parts) to your database. Continue?')) return;
    setIsSeeding(true);
    try {
      const { apiFetch } = await import('../../api');
      const seedVendors = [
        { name: 'Global Auto Parts', email: 'sales@globalauto.com', contactPerson: 'John Global', phone: '9841000111', address: 'Kathmandu' },
        { name: 'Elite Tires Nepal', email: 'info@elitetires.com', contactPerson: 'Sita Ram', phone: '9841000222', address: 'Pokhara' },
        { name: 'Premium Lubricants', email: 'orders@premlub.com', contactPerson: 'Rajesh Lub', phone: '9841000333', address: 'Lalitpur' },
        { name: 'Brake Master Ltd', email: 'support@brakemaster.com', contactPerson: 'Bimal Brake', phone: '9841000444', address: 'Butwal' },
        { name: 'Spark Systems', email: 'tech@sparksys.com', contactPerson: 'Anjali Spark', phone: '9841000555', address: 'Biratnagar' },
        { name: 'Duraflex Belts', email: 'sales@duraflex.com', contactPerson: 'Karan Belt', phone: '9841000666', address: 'Kathmandu' },
        { name: 'Cooling Pros', email: 'info@coolingpros.com', contactPerson: 'Maya Cool', phone: '9841000777', address: 'Dharan' },
        { name: 'Chassis Tech', email: 'orders@chassistech.com', contactPerson: 'Niranjan Tech', phone: '9841000888', address: 'Hetauda' },
        { name: 'Vantage Electronics', email: 'support@vantage.com', contactPerson: 'Suman Elec', phone: '9841000999', address: 'Kathmandu' },
        { name: 'Standard Filters', email: 'info@stdfill.com', contactPerson: 'Gita Fill', phone: '9841001111', address: 'Nepalgunj' }
      ];
      const createdVendors = [];
      for (const v of seedVendors) {
        const res = await apiFetch('/Inventory/vendors', { method: 'POST', body: JSON.stringify(v) });
        if (res) createdVendors.push(res);
      }
      const partTemplates = [
        { name: 'Semi-Synthetic Oil', code: 'OIL-S', price: 2500 },
        { name: 'Ceramic Brake Pads', code: 'BRK-C', price: 4500 },
        { name: 'Iridium Spark Plug', code: 'SPK-I', price: 850 },
        { name: 'Performance Air Filter', code: 'FLT-A', price: 1200 },
        { name: 'Radial Tire 205/55R16', code: 'TIR-R', price: 8500 },
        { name: 'Headlight Bulb H7', code: 'LGT-H7', price: 450 },
        { name: 'Timing Belt Kit', code: 'BELT-T', price: 12500 },
        { name: 'Radiator Coolant (5L)', code: 'COL-5', price: 1800 },
        { name: 'Wiper Blade Set', code: 'WIP-24', price: 1100 },
        { name: 'Heavy Duty Battery', code: 'BAT-HD', price: 15500 }
      ];
      const partsToSeed = [];
      for (let i = 1; i <= 40; i++) {
        const template = partTemplates[i % partTemplates.length];
        const vendor = createdVendors[i % createdVendors.length];
        partsToSeed.push({
          name: `${template.name} - Type ${Math.ceil(i/10)}`,
          partCode: `${template.code}-${100 + i}`,
          description: `High quality ${template.name}`,
          price: template.price + (i * 50),
          stockLevel: 10 + (i % 20),
          vendorId: vendor.id
        });
      }
      for (const p of partsToSeed) {
        await apiFetch('/Inventory/parts', { method: 'POST', body: JSON.stringify(p) });
      }

      // Seed 5 Customers
      const seedCustomers = [
        { name: 'Aaysha Kandel', email: 'aaysha@gmail.com', plate: 'BA 1 PA 1234', phone: '9801112223' },
        { name: 'Suman Shrestha', email: 'suman@outlook.com', plate: 'BA 2 PA 5678', phone: '9803334445' },
        { name: 'Prativa Rai', email: 'prativa@gmail.com', plate: 'BA 3 PA 9012', phone: '9805556667' },
        { name: 'Bibek Thapa', email: 'bibek@yahoo.com', plate: 'BA 4 PA 3456', phone: '9807778889' },
        { name: 'Nisha Gurung', email: 'nisha@gmail.com', plate: 'BA 5 PA 7890', phone: '9809990001' }
      ];

      for (const c of seedCustomers) {
        await apiFetch('/Users', { method: 'POST', body: JSON.stringify({ ...c, role: 'Customer', password: 'password' }) });
      }

      alert('System fully populated with Vendors, Parts, and Sample Customers!');
      window.location.reload();
    } catch(err) { alert('Seeding partially failed.'); }
    finally { setIsSeeding(false); }
  };

  if (adminRoute === 'add-staff') return <AddStaffPage onAdd={onAddStaff} onBack={() => setAdminRoute('main')} />;
  if (adminRoute === 'manage-inventory') return <InventoryPurchasePage inventory={inventory} onUpdate={onUpdateInventory} onBack={() => setAdminRoute('main')} />;
  if (adminRoute === 'manage-customers') return <CustomerManagementPage customers={customerList} onRemove={onRemoveCustomer} onUpdate={onUpdateCustomer} onBack={() => setAdminRoute('main')} />;
  if (adminRoute === 'add-part') return <AddPartPage inventory={inventory} vendors={vendors} onUpdate={onUpdateInventory} onBack={() => setAdminRoute('main')} />;
  if (adminRoute === 'view-all-inventory') return <FullInventoryPage inventory={inventory} onBack={() => setAdminRoute('main')} />;
  if (adminRoute === 'view-all-staff') return <FullStaffPage staffList={staffList} onBack={() => setAdminRoute('main')} />;

  return (
    <div style={{ position: 'relative', minHeight: '100vh' }}>
      {/* Faded Background Icon - Exact Blue Professional Icon */}
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
            <button onClick={handleSeedData} className="btn-small" style={{ background: isSeeding ? '#64748b' : 'var(--secondary)' }} disabled={isSeeding}>
              {isSeeding ? 'Seeding...' : 'Seed Data'}
            </button>
            <select value={viewType} onChange={e => setViewType(e.target.value)} style={{ width: 'auto', padding: '0.4rem', marginBottom: 0 }}>
              <option value="daily">Daily</option>
              <option value="monthly">Monthly</option>
              <option value="yearly">Yearly</option>
            </select>
          </div>
          <table style={{ width: '100%', borderCollapse: 'collapse', marginTop: '1rem' }}>
            <thead><tr><th>Period</th><th>Count</th><th>Revenue</th></tr></thead>
            <tbody><tr><td style={{ textTransform: 'capitalize' }}>{viewType}</td><td>{report.InvoiceCount ?? 0}</td><td>Rs. {(report.TotalRevenue ?? 0).toFixed(2)}</td></tr></tbody>
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
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
        <StaffManager userRole="Admin" staffList={staffList} onNavigate={setAdminRoute} onRemove={onRemoveStaff} onUpdate={onUpdateStaff} />
        <div id="customers"><CustomerManager customers={customerList} onNavigate={setAdminRoute} onRemove={onRemoveCustomer} onEdit={onUpdateCustomer} /></div>
      </div>
      <div id="inventory"><InventoryManager inventory={inventory} onNavigate={setAdminRoute} /></div>
    </div>
    </div>
  );
}

function AddStaffPage({ onAdd, onBack }) {
  const [newStaff, setNewStaff] = useState({ name: '', email: '', password: '', role: 'Staff' });
  const [showPassword, setShowPassword] = useState(false);
  const handleAdd = (e) => { e.preventDefault(); onAdd(newStaff); onBack(); };
  return (
    <div className="card" style={{ maxWidth: '600px', margin: 'auto' }}>
      <button onClick={onBack} className="btn-small" style={{ marginBottom: '1rem', background: '#cbd5e1', color: '#0f172a' }}>← Back</button>
      <h2>Add System Staff</h2>
      <form onSubmit={handleAdd} className="mini-form">
        <input type="text" placeholder="Full Name" required value={newStaff.name} onChange={e => setNewStaff({...newStaff, name: e.target.value})} />
        <input type="email" placeholder="Email" required value={newStaff.email} onChange={e => setNewStaff({...newStaff, email: e.target.value})} />
        <div style={{ position: 'relative', width: '100%' }}>
          <input type={showPassword ? "text" : "password"} placeholder="Password" required value={newStaff.password} onChange={e => setNewStaff({...newStaff, password: e.target.value})} style={{ width: '100%', marginBottom: 0 }} />
          <button type="button" onClick={() => setShowPassword(!showPassword)} style={{ position: 'absolute', right: '10px', top: '12px', background: 'none', border: 'none', color: 'var(--primary)', cursor: 'pointer', padding: 0 }}>{showPassword ? 'Hide' : 'Show'}</button>
        </div>
        <button type="submit" style={{ marginTop: '1rem' }}>Save Staff Member</button>
      </form>
    </div>
  );
}

function InventoryPurchasePage({ inventory, onUpdate, onBack }) {
  const [purchaseData, setPurchaseData] = useState({ partId: '', quantity: '', vendorId: '' });
  const [vendors, setVendors] = useState([]);
  useEffect(() => { import('../../api').then(({ apiFetch }) => apiFetch('/Inventory/vendors').then(res => res && setVendors(res))); }, []);
  const handlePurchase = async (e) => {
    e.preventDefault();
    const part = inventory.find(p => p.id === parseInt(purchaseData.partId));
    if (!part) return;
    try {
      const { apiFetch } = await import('../../api');
      await apiFetch('/Transactions/purchase', {
        method: 'POST',
        body: JSON.stringify({
          vendorId: parseInt(purchaseData.vendorId),
          totalAmount: part.price * parseInt(purchaseData.quantity),
          items: [{ partId: parseInt(purchaseData.partId), quantity: parseInt(purchaseData.quantity), unitPrice: part.price * 0.7 }]
        })
      });
      alert('Stock updated!');
      const updatedInventory = inventory.map(p => p.id === parseInt(purchaseData.partId) ? { ...p, stock: p.stock + parseInt(purchaseData.quantity) } : p);
      onUpdate(updatedInventory);
      onBack();
    } catch(err) { alert('Purchase failed.'); }
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
        <select required onChange={e => setPurchaseData({...purchaseData, vendorId: e.target.value})} value={purchaseData.vendorId}>
          <option value="">Select Vendor</option>
          {vendors.map(v => <option key={v.id} value={v.id}>{v.name}</option>)}
        </select>
        <button type="submit" style={{ marginTop: '1rem' }}>Complete Purchase</button>
      </form>
    </div>
  );
}

function CustomerManagementPage({ customers, onRemove, onUpdate, onBack }) {
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
      const { apiFetch } = await import('../../api');
      await apiFetch(`/Users/${id}`, {
        method: 'PUT',
        body: JSON.stringify({ 
          name: editData.name, 
          email: editData.email,
          phoneNumber: editData.phone
        })
      });
      
      // Find the original customer to preserve all properties
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
      alert('Error updating customer: ' + (error.message || 'Unknown error'));
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
      alert('Error removing customer: ' + (error.message || 'Unknown error'));
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
                <div><strong>{c.name}</strong><br/>{c.plate}</div>
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

function AddPartPage({ inventory, vendors, onUpdate, onBack }) {
  const [partData, setPartData] = useState({ name: '', code: '', description: '', price: '', vendorId: '', initialStock: '0' });
  const handleSave = async (e) => {
    e.preventDefault();
    try {
      const { apiFetch } = await import('../../api');
      const newPart = await apiFetch('/Inventory/parts', {
        method: 'POST',
        body: JSON.stringify({ name: partData.name, partCode: partData.code, description: partData.description, price: parseFloat(partData.price), stockLevel: parseInt(partData.initialStock), vendorId: parseInt(partData.vendorId) })
      });
      onUpdate([...inventory, { id: newPart.id, name: newPart.name, stock: newPart.stockLevel, price: newPart.price, vendor: vendors.find(v => v.id === parseInt(partData.vendorId))?.name || 'Local' }]);
      alert('Part registered!'); onBack();
    } catch(err) { alert('Error.'); }
  };
  return (
    <div className="card" style={{ maxWidth: '600px', margin: 'auto' }}>
      <button onClick={onBack} className="btn-small" style={{ marginBottom: '1rem', background: '#cbd5e1', color: '#0f172a' }}>← Back</button>
      <h2>New Part</h2>
      <form onSubmit={handleSave} className="mini-form">
        <input placeholder="Name" required value={partData.name} onChange={e => setPartData({...partData, name: e.target.value})} />
        <input placeholder="Code" required value={partData.code} onChange={e => setPartData({...partData, code: e.target.value})} />
        <input type="number" placeholder="Price" required value={partData.price} onChange={e => setPartData({...partData, price: e.target.value})} />
        <select required value={partData.vendorId} onChange={e => setPartData({...partData, vendorId: e.target.value})}>
          <option value="">Vendor</option>{vendors.map(v => <option key={v.id} value={v.id}>{v.name}</option>)}
        </select>
        <button type="submit">Register</button>
      </form>
    </div>
  );
}

function AddVendorPage({ onBack, onVendorAdded }) {
  const [vendorData, setVendorData] = useState({ name: '', email: '' });
  const handleSave = async (e) => {
    e.preventDefault();
    try {
      const { apiFetch } = await import('../../api');
      const savedVendor = await apiFetch('/Inventory/vendors', { method: 'POST', body: JSON.stringify(vendorData) });
      alert('Vendor saved!'); onVendorAdded(savedVendor);
    } catch(err) { alert('Error.'); }
  };
  return (
    <div className="card" style={{ maxWidth: '600px', margin: 'auto' }}>
      <button onClick={onBack} className="btn-small" style={{ marginBottom: '1rem', background: '#cbd5e1', color: '#0f172a' }}>← Back</button>
      <h2>New Vendor</h2>
      <form onSubmit={handleSave} className="mini-form">
        <input placeholder="Name" required value={vendorData.name} onChange={e => setVendorData({...vendorData, name: e.target.value})} />
        <input placeholder="Email" required value={vendorData.email} onChange={e => setVendorData({...vendorData, email: e.target.value})} />
        <button type="submit">Save</button>
      </form>
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

function FullVendorsPage({ vendors, onBack }) {
  return (
    <div className="card" style={{ maxWidth: '900px', margin: 'auto' }}>
      <button onClick={onBack} className="btn-small" style={{ marginBottom: '1rem', background: '#cbd5e1', color: '#0f172a' }}>← Back</button>
      <h2>All Vendors</h2>
      <div className="data-list">
        {vendors.map(v => (
          <div key={v.id} className="list-item">
            <div><strong>{v.name}</strong><br/>{v.email}</div>
          </div>
        ))}
      </div>
    </div>
  );
}


function FullStaffPage({ staffList, onBack }) {
  return (
    <div className="card" style={{ maxWidth: "900px", margin: "auto" }}>
      <button onClick={onBack} className="btn-small" style={{ marginBottom: "1rem", background: "#cbd5e1", color: "#0f172a" }}>? Back to Dashboard</button>
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
