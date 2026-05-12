import React, { useState, useEffect } from 'react';
import Header from './components/Header';
import Footer from './components/Footer';
import CustomerVehicleForm from './components/management/CustomerVehicleForm';
import { AdminDashboard } from './pages/AdminDashboard';
import { StaffDashboard } from './pages/StaffDashboard';
import { CustomerDashboard } from './pages/CustomerDashboard';
import { LoginPage } from './pages/LoginPage';
import { SignupPage } from './pages/SignupPage';
import MainLayout from './layout/MainLayout';
import VendorPage from './pages/vendors/VendorPage';
import PartsPage from './pages/parts/PartsPage';
import { useToast } from './context/ToastContext';
import './index.css';

const ROLES = { ADMIN: 'Admin', STAFF: 'Staff', CUSTOMER: 'Customer' };

function App() {
  const showToast = useToast();
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
    import('./services/api').then(({ apiFetch }) => {
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
          const partsRes = await apiFetch('/parts') || [];
          setInventory(partsRes.map(p => ({
             id: p.id || p.Id,
             name: p.name || p.Name || '',
             stock: p.stockLevel || p.StockLevel || 0,
             price: p.price || p.Price || 0,
             vendor: p.vendorName || p.VendorName || 'Unknown Vendor'
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
          showToast('error', 'Failed to connect to NEON Cloud API.');
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
      const { apiFetch } = await import('./services/api');
      const savedStaff = await apiFetch('/Users/register/staff', {
        method: 'POST',
        body: JSON.stringify({ name: newStaff.name, email: newStaff.email, password: newStaff.password })
      });
      setStaffList([...staffList, { ...savedStaff, role: 'Staff', password: savedStaff.passwordHash || newStaff.password }]);
      showToast('success', 'System staff successfully saved to NEON Cloud!');
    } catch(err) {
      showToast('error', err.message || 'Network Error saving to cloud.');
    }
  };
  const handleRemoveStaff = async (id) => {
    try {
      const { apiFetch } = await import('./services/api');
      await apiFetch(`/Users/${id}`, {
        method: 'DELETE'
      });
      setStaffList(staffList.filter(s => s.id !== id));
    } catch(err) {
      throw new Error(err.message || 'Failed to remove staff member');
    }
  };
  const handleUpdateStaff = async (id, updatedData) => {
    try {
      const { apiFetch } = await import('./services/api');
      const requestBody = { 
        name: updatedData.name, 
        email: updatedData.email
      };
      // Only include password if it's provided and not empty
      if (updatedData.password && updatedData.password.trim().length > 0) {
        requestBody.password = updatedData.password.trim();
      }
      const response = await apiFetch(`/Users/${id}`, {
        method: 'PUT',
        body: JSON.stringify(requestBody)
      });
      
      setStaffList(staffList.map(s => 
        s.id === id 
          ? { ...s, name: updatedData.name, email: updatedData.email, password: updatedData.password || s.password } 
          : s
      ));
    } catch(err) {
      throw new Error(err.message || 'Failed to update staff credentials');
    }
  };
  const handleRegisterCustomer = async (customerData) => {
    try {
      const { apiFetch } = await import('./services/api');
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
          password: customerData.password,
          phoneNumber: customerData.phone,
          vehicles: [{ plateNumber: customerData.plate, model: model, make: model.split(' ')[0] || 'Unknown', year: year }]
        })
      });
      setCustomerList(prev => [...prev, { ...savedCustomer, plate: customerData.plate, phone: customerData.phone, spend: 0 }]);
      return savedCustomer;
    } catch(err) {
      console.error(err);
      showToast('error', 'Network Error saving customer to cloud.');
      return false;
    }
  };
  const handleRemoveCustomer = async (id) => {
    try {
      const { apiFetch } = await import('./services/api');
      await apiFetch(`/Users/${id}`, {
        method: 'DELETE'
      });
      setCustomerList(customerList.filter(c => c.id !== id));
    } catch(err) {
      throw new Error(err.message || 'Failed to remove customer');
    }
  };
  const handleUpdateCustomer = (updatedCust) => setCustomerList(customerList.map(c => c.id === updatedCust.id ? updatedCust : c));
  
  const handleProcessSale = async (customerId, cartItems) => {
    const customer = customerList.find(c => c.id === parseInt(customerId));
    if (!customer || cartItems.length === 0) return showToast('error', 'Please select a customer and at least one item.');

    try {
      const { apiFetch } = await import('./services/api');
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
      
      showToast('success', `Invoice generated. ${isDiscounted ? '10% Loyalty Discount Applied! ' : ''}Total: Rs. ${finalPrice.toFixed(2)}`);
    } catch (e) {
      showToast('error', 'Failed to process sale.');
    }
  };

  const handleUpdateInventory = (newParts) => setInventory(newParts);

  if (currentPath === '/parts') {
    return (
      <MainLayout currentPath={currentPath} onNavigate={handleNavigate}>
        <PartsPage />
      </MainLayout>
    );
  }

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
        {!isLoading && view === 'login' && <LoginPage onLogin={(u) => { localStorage.setItem('vis_user', JSON.stringify(u)); setUser(u); setView('dashboard'); }} onSignUp={() => setView('signup')} staff={staffList} customers={customerList} />}
        {!isLoading && view === 'signup' && <SignupPage onComplete={(u) => { localStorage.setItem('vis_user', JSON.stringify(u)); setUser(u); setView('dashboard'); }} onBack={() => setView('login')} onAddCustomer={handleRegisterCustomer} />}

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

function Dashboard({ user, staffList, customerList, inventory, salesHistory, onAddStaff, onRemoveStaff, onUpdateStaff, onProcessSale, onUpdateInventory, onRemoveCustomer, onUpdateCustomer, staffView, setStaffView, onOpenVendorManagement }) {
  return (
    <div>
      <h1>{user.role} Dashboard</h1>
      {user.role === ROLES.ADMIN && (<AdminDashboard staffList={staffList} onAddStaff={onAddStaff} onRemoveStaff={onRemoveStaff} onUpdateStaff={onUpdateStaff} sales={salesHistory} inventory={inventory} onUpdateInventory={onUpdateInventory} customerList={customerList} onRemoveCustomer={onRemoveCustomer} onUpdateCustomer={onUpdateCustomer} onOpenVendorManagement={onOpenVendorManagement} />)}
      {user.role === ROLES.STAFF && (<StaffDashboard view={staffView} setView={setStaffView} customers={customerList} parts={inventory} sales={salesHistory} onProcessSale={onProcessSale} />)}
      {user.role === ROLES.CUSTOMER && (<CustomerDashboard user={user} sales={salesHistory} />)}
    </div>
  );
}

export default App;
