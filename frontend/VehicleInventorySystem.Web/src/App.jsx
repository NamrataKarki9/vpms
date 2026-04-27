import React, { useState, useEffect } from 'react';
import Header from './components/Header';
import Footer from './components/Footer';
import CustomerVehicleForm from './components/management/CustomerVehicleForm';
import { AdminView } from './components/views/AdminView';
import { StaffView } from './components/views/StaffView';
import { CustomerView } from './components/views/CustomerView';
import MainLayout from './layout/MainLayout';
import VendorPage from './pages/vendors/VendorPage';
import './index.css';

const ROLES = { ADMIN: 'Admin', STAFF: 'Staff', CUSTOMER: 'Customer' };

function App() {
  const [currentPath, setCurrentPath] = useState(() => window.location.pathname || '/');
  const [user, setUser] = useState(() => {
    const saved = localStorage.getItem('vis_user');
    return saved ? JSON.parse(saved) : null;
  });
  const [view, setView] = useState(() => {
    const saved = localStorage.getItem('vis_user');
    return saved ? 'dashboard' : 'login';
  });
  
  const [staffList, setStaffList] = useState([]);
  const [customerList, setCustomerList] = useState([]);
  const [inventory, setInventory] = useState([]);
  const [salesHistory, setSalesHistory] = useState([]);
  const [staffView, setStaffView] = useState('main');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const handlePopState = () => setCurrentPath(window.location.pathname || '/');
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  const handleNavigate = (event, path) => {
    event.preventDefault();
    if (path === currentPath) {
      return;
    }

    window.history.pushState({}, '', path);
    setCurrentPath(path);
  };

  useEffect(() => {
    import('./api').then(({ apiFetch }) => {
      const loadAllData = async () => {
        try {
          // Fetch Users Data
          const usersRes = await apiFetch('/Users') || [];
          setStaffList(usersRes.filter(u => u.role === 1 || u.role === 0).map(u => ({
             ...u, role: u.role === 0 ? 'Admin' : 'Staff', password: u.passwordHash || ''
          })));
          
          setCustomerList(usersRes.filter(u => u.role === 2).map(c => ({
             ...c, plate: c.vehicles?.length > 0 ? c.vehicles[0].plateNumber : 'N/A', spend: 0, password: c.passwordHash || ''
          })));

          // Fetch Inventory Data
          const partsRes = await apiFetch('/Inventory/parts') || [];
          setInventory(partsRes.map(p => ({
             id: p.id, name: p.name, stock: p.stockLevel, price: p.price, vendor: p.vendor?.name || 'Local'
          })));

          // Fetch Transaction History
          const salesRes = await apiFetch('/Transactions') || [];
          setSalesHistory(salesRes.map(s => ({
            id: s.id,
            customerName: s.customerName,
            total: s.totalAmount,
            date: new Date(s.date).toLocaleDateString(),
            discountApplied: false // Calculated on-the-fly if needed
          })));

          setIsLoading(false);
        } catch (error) {
          console.error("Cloud DB Connection Error:", error);
          alert("Failed to connect to NEON Cloud API.");
          setIsLoading(false);
        }
      };
      loadAllData();
    });
  }, []);

  const logout = () => { 
    localStorage.removeItem('vis_user');
    setUser(null); 
    setView('login'); 
  };
  const handleAddStaff = async (newStaff) => {
    try {
      const { apiFetch } = await import('./api');
      const savedStaff = await apiFetch('/Users/register/staff', {
        method: 'POST',
        body: JSON.stringify({ name: newStaff.name, email: newStaff.email, passwordHash: newStaff.password })
      });
      setStaffList([...staffList, { ...savedStaff, role: 'Staff', password: savedStaff.passwordHash || newStaff.password }]);
      alert('System staff successfully saved to NEON Cloud!');
    } catch(err) {
      alert('Network Error saving to cloud.');
    }
  };
  const handleRemoveStaff = (id) => setStaffList(staffList.filter(s => s.id !== id));
  const handleUpdateStaff = async (id, updatedData) => {
    try {
      const { apiFetch } = await import('./api');
      await apiFetch(`/Users/${id}`, {
        method: 'PUT',
        body: JSON.stringify({ name: updatedData.name, email: updatedData.email, passwordHash: updatedData.password })
      });
      setStaffList(staffList.map(s => s.id === id ? { ...s, name: updatedData.name, email: updatedData.email, password: updatedData.password || s.password } : s));
      alert('Staff credentials updated on cloud!');
    } catch(err) {
      alert('Failed to update staff credentials.');
    }
  };
  const handleRegisterCustomer = async (customerData) => {
    try {
      const { apiFetch } = await import('./api');
      let year = 2000;
      let model = 'Unknown';
      if (customerData.vehicle) {
        const parts = customerData.vehicle.split(' (');
        model = parts[0];
        if (parts.length > 1) {
          year = parseInt(parts[1].replace(')', '')) || 2000;
        }
      }
      const savedCustomer = await apiFetch('/Users/register/customer', {
        method: 'POST',
        body: JSON.stringify({ 
          name: customerData.name, 
          email: customerData.email, 
          passwordHash: customerData.password,
          vehicles: [{ plateNumber: customerData.plate, model: model, make: model.split(' ')[0] || 'Unknown', year: year }]
        })
      });
      setCustomerList(prev => [...prev, { ...savedCustomer, plate: customerData.plate, spend: 0, password: savedCustomer.passwordHash || customerData.password }]);
      return savedCustomer.id;
    } catch(err) {
      console.error(err);
      alert('Network Error saving customer to cloud.');
      return false;
    }
  };
  const handleRemoveCustomer = (id) => setCustomerList(customerList.filter(c => c.id !== id));
  const handleUpdateCustomer = (updatedCust) => setCustomerList(customerList.map(c => c.id === updatedCust.id ? updatedCust : c));
  
  const handleProcessSale = async (customerId, cartItems) => {
    const customer = customerList.find(c => c.id === parseInt(customerId));
    if (!customer || cartItems.length === 0) return alert('Please select a customer and at least one item.');

    try {
      const { apiFetch } = await import('./api');
      const totalAmount = cartItems.reduce((sum, item) => sum + (item.price * item.quantity), 0);
      
      const invoice = await apiFetch('/Transactions/sale', {
        method: 'POST',
        body: JSON.stringify({
          customerId: parseInt(customerId),
          totalAmount: totalAmount,
          items: cartItems.map(item => ({
            partId: item.id,
            quantity: item.quantity,
            unitPrice: item.price
          }))
        })
      });

      const finalPrice = invoice.totalAmount;
      const isDiscounted = finalPrice < totalAmount;
      
      const newInvoice = { 
        id: invoice.id, 
        customerName: customer.name, 
        total: finalPrice, 
        date: new Date().toLocaleDateString(), 
        discountApplied: isDiscounted 
      };

      setSalesHistory([newInvoice, ...salesHistory]);
      setCustomerList(customerList.map(c => c.id === customer.id ? { ...c, spend: (c.spend ?? 0) + finalPrice } : c));
      
      // Update inventory for all items in cart
      let updatedInv = [...inventory];
      cartItems.forEach(item => {
        updatedInv = updatedInv.map(p => p.id === item.id ? { ...p, stock: Math.max(0, p.stock - item.quantity) } : p);
      });
      setInventory(updatedInv);
      
      alert(`Success: Invoice generated. ${isDiscounted ? '10% Loyalty Discount Applied!' : ''} Total: Rs. ${finalPrice.toFixed(2)}`);
    } catch (e) {
      alert('Failed to process sale.');
    }
  };

  const handleUpdateInventory = (newParts) => setInventory(newParts);

  if (currentPath === '/vendors') {
    return (
      <MainLayout currentPath={currentPath} onNavigate={handleNavigate}>
        <VendorPage />
      </MainLayout>
    );
  }

  return (
    <div className="app-container">
      {user && <Header user={user} onLogout={logout} onNavigateStaff={setStaffView} />}
      <main className="main-content">
        {isLoading && <div style={{ padding: '2rem', textAlign: 'center' }}>Connecting to NEON Cloud DB...</div>}
        {!isLoading && view === 'login' && <Login onLogin={(u) => { localStorage.setItem('vis_user', JSON.stringify(u)); setUser(u); setView('dashboard'); }} onSignUp={() => setView('signup')} staff={staffList} customers={customerList} />}
        {!isLoading && view === 'signup' && <SignUp onComplete={(u) => { localStorage.setItem('vis_user', JSON.stringify(u)); setUser(u); setView('dashboard'); }} onBack={() => setView('login')} onAddCustomer={handleRegisterCustomer} />}

        {!isLoading && view === 'dashboard' && (
          <Dashboard 
            user={user} staffList={staffList} customerList={customerList} inventory={inventory} salesHistory={salesHistory}
            onAddStaff={handleAddStaff} onRemoveStaff={handleRemoveStaff} onUpdateStaff={handleUpdateStaff} onProcessSale={handleProcessSale}
            onUpdateInventory={handleUpdateInventory} onRemoveCustomer={handleRemoveCustomer} onUpdateCustomer={handleUpdateCustomer}
            staffView={staffView} setStaffView={setStaffView} onOpenVendorManagement={() => { window.history.pushState({}, '', '/vendors'); setCurrentPath('/vendors'); }}
          />
        )}
      </main>
      {user && <Footer />}
    </div>
  );
}

function Login({ onLogin, onSignUp, staff, customers }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  const handleLogin = () => {
    if (!email || !password) return alert('Please enter both email and password.');

    // 1. Admin Verification
    if (email === 'np01cp4s230131@islingtoncollege.edu.np') {
      if (password === '1234') {
        onLogin({ name: 'System Admin', role: ROLES.ADMIN });
        return;
      }
      return alert('Access Denied: Incorrect Admin password.');
    }

    // 2. Staff Verification
    const staffMember = staff.find(s => s.email.toLowerCase() === email.toLowerCase());
    if (staffMember) {
      if (staffMember.password === password || (!staffMember.password && password === 'password')) {
        onLogin({ id: staffMember.id, name: staffMember.name || email.split('@')[0], role: ROLES.STAFF });
        return;
      }
      return alert('Access Denied: Incorrect password for Staff.');
    }

    // 3. Customer Verification
    const customer = customers.find(c => c.email && c.email.toLowerCase() === email.toLowerCase());
    if (customer) {
      if (customer.password === password || (!customer.password && password === 'password')) {
        onLogin({ id: customer.id, name: customer.name, role: ROLES.CUSTOMER });
        return;
      }
      return alert('Access Denied: Incorrect password for Customer.');
    }

    alert('Access Denied: Account not found. Please sign up or contact Admin.');
  };

  return (
    <div className="card" style={{ maxWidth: '400px', margin: 'auto' }}>
      <h2>Login</h2>
      <input type="email" placeholder="Email" value={email} onChange={e => setEmail(e.target.value)} />
      <div style={{ position: 'relative', width: '100%' }}>
        <input type={showPassword ? "text" : "password"} placeholder="Password" value={password} onChange={e => setPassword(e.target.value)} style={{ width: '100%', marginBottom: '1rem' }} />
        <button type="button" onClick={() => setShowPassword(!showPassword)} style={{ position: 'absolute', right: '10px', top: '12px', background: 'none', border: 'none', color: 'var(--primary)', cursor: 'pointer', padding: 0, boxShadow: 'none' }}>
          {showPassword ? 'Hide' : 'Show'}
        </button>
      </div>
      <button onClick={handleLogin}>Enter System</button>
      <p style={{ marginTop: '1.5rem', textAlign: 'center', fontSize: '0.9rem' }}>New customer? <button onClick={onSignUp} className="btn-small">Sign Up Here</button></p>
    </div>
  );
}


function SignUp({ onComplete, onBack, onAddCustomer }) {
  return <div style={{ maxWidth: '600px', margin: 'auto' }}><button onClick={onBack} className="btn-small">← Back</button><CustomerVehicleForm onRegister={async (data) => { const newId = await onAddCustomer(data); if(newId) onComplete({ id: newId, name: data.name, role: ROLES.CUSTOMER }); }} /></div>;
}

function Dashboard({ user, staffList, customerList, inventory, salesHistory, onAddStaff, onRemoveStaff, onUpdateStaff, onProcessSale, onUpdateInventory, onRemoveCustomer, onUpdateCustomer, staffView, setStaffView, onOpenVendorManagement }) {
  return (
    <div>
      <h1>{user.role} Dashboard</h1>
      {user.role === ROLES.ADMIN && (<AdminView staffList={staffList} onAddStaff={onAddStaff} onRemoveStaff={onRemoveStaff} onUpdateStaff={onUpdateStaff} sales={salesHistory} inventory={inventory} onUpdateInventory={onUpdateInventory} customerList={customerList} onRemoveCustomer={onRemoveCustomer} onUpdateCustomer={onUpdateCustomer} onOpenVendorManagement={onOpenVendorManagement} />)}
      {user.role === ROLES.STAFF && (<StaffView view={staffView} setView={setStaffView} customers={customerList} parts={inventory} sales={salesHistory} onProcessSale={onProcessSale} />)}
      {user.role === ROLES.CUSTOMER && (<CustomerView user={user} sales={salesHistory} />)}
    </div>
  );
}

// Views have been extracted to src/components/views/

export default App;
