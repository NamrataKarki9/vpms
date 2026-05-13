import React, { useEffect, useState } from 'react';
import Header from './components/Header';
import Footer from './components/Footer';
import { AdminDashboard } from './pages/AdminDashboard';
import { StaffDashboard } from './pages/StaffDashboard';
import { CustomerDashboard } from './pages/CustomerDashboard';
import { LoginPage } from './pages/LoginPage';
import { SignupPage } from './pages/SignupPage';
import { ForgotPasswordPage } from './pages/ForgotPasswordPage';
import { VerifyOtpPage } from './pages/VerifyOtpPage';
import { ResetPasswordPage } from './pages/ResetPasswordPage';
import MainLayout from './layout/MainLayout';
import VendorPage from './pages/vendors/VendorPage';
import PartsPage from './pages/parts/PartsPage';
import { useToast } from './context/ToastContext';
import { apiFetch, authApi, clearStoredUser, getStoredUser, saveStoredUser } from './services/api';
import './index.css';

const ROLES = { ADMIN: 'Admin', STAFF: 'Staff', CUSTOMER: 'Customer' };
const DASHBOARD_PATHS = {
  [ROLES.ADMIN]: '/admin',
  [ROLES.STAFF]: '/staff',
  [ROLES.CUSTOMER]: '/customer',
};
const PUBLIC_PATHS = new Set(['/login', '/signup', '/forgot-password', '/verify-otp', '/reset-password']);

const getDashboardPath = (role) => DASHBOARD_PATHS[role] || '/login';

function App() {
  const showToast = useToast();
  const [currentPath, setCurrentPath] = useState(() => window.location.pathname || '/login');
  const [user, setUser] = useState(() => getStoredUser());
  const [staffList, setStaffList] = useState([]);
  const [customerList, setCustomerList] = useState([]);
  const [inventory, setInventory] = useState([]);
  const [salesHistory, setSalesHistory] = useState([]);
  const [staffView, setStaffView] = useState('main');
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    const handlePopState = () => setCurrentPath(window.location.pathname || '/login');
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  useEffect(() => {
    const handleUnauthorized = () => {
      setUser(null);
      setStaffList([]);
      setCustomerList([]);
      setInventory([]);
      setSalesHistory([]);
      window.history.pushState({}, '', '/login');
      setCurrentPath('/login');
      showToast('error', 'Your session has expired. Please log in again.');
    };

    const handleForbidden = (event) => {
      showToast('error', event.detail?.message || 'You are not authorized to access this page.');
    };

    window.addEventListener('vis:unauthorized', handleUnauthorized);
    window.addEventListener('vis:forbidden', handleForbidden);

    return () => {
      window.removeEventListener('vis:unauthorized', handleUnauthorized);
      window.removeEventListener('vis:forbidden', handleForbidden);
    };
  }, [showToast]);

  useEffect(() => {
    if (!user) {
      if (!PUBLIC_PATHS.has(currentPath)) {
        window.history.replaceState({}, '', '/login');
        setCurrentPath('/login');
      }
      return;
    }

    const dashboardPath = getDashboardPath(user.role);
    if (currentPath === '/' || PUBLIC_PATHS.has(currentPath)) {
      window.history.replaceState({}, '', dashboardPath);
      setCurrentPath(dashboardPath);
      return;
    }

    if ((currentPath === '/vendors' || currentPath === '/parts') && user.role !== ROLES.ADMIN) {
      window.history.replaceState({}, '', dashboardPath);
      setCurrentPath(dashboardPath);
      showToast('error', 'You are not authorized to access this page.');
      return;
    }

    if (Object.values(DASHBOARD_PATHS).includes(currentPath) && currentPath !== dashboardPath) {
      window.history.replaceState({}, '', dashboardPath);
      setCurrentPath(dashboardPath);
    }
  }, [currentPath, showToast, user]);

  useEffect(() => {
    if (user) {
      loadAllData(user);
    }
  }, [user]);

  const handleNavigate = (event, path) => {
    event.preventDefault();
    if (path === currentPath) return;
    window.history.pushState({}, '', path);
    setCurrentPath(path);
  };

  const loadAllData = async (activeUser = user) => {
    if (!activeUser) {
      return;
    }

    setIsLoading(true);
    try {
      if (activeUser.role === ROLES.CUSTOMER) {
        setStaffList([]);
        setCustomerList([]);
        setInventory([]);
        setSalesHistory([]);
        return;
      }

      if (activeUser.role === ROLES.ADMIN) {
        const [usersRes, partsRes, salesRes] = await Promise.all([
          apiFetch('/users'),
          apiFetch('/parts'),
          apiFetch('/Transactions/sales')
        ]);

        const users = Array.isArray(usersRes) ? usersRes : [];
        setStaffList(users.filter((u) => u.role === 'Admin' || u.role === 'Staff'));
        setCustomerList(users.filter((u) => u.role === 'Customer').map((c) => ({
          id: c.id,
          name: c.name,
          email: c.email || '',
          phone: c.phoneNumber || '',
          role: c.role,
          isActive: c.isActive,
          plate: c.vehicles?.length > 0 ? c.vehicles[0].plateNumber : 'N/A',
          vehicleInfo: c.vehicles?.length > 0 ? c.vehicles[0] : null,
          vehicleCount: c.vehicles?.length || 0,
          spend: 0
        })));

        const parts = Array.isArray(partsRes) ? partsRes : [];
        setInventory(parts.map((p) => ({
          id: p.id,
          name: p.name || '',
          stock: p.stockLevel || 0,
          price: p.price || 0,
          vendor: p.vendorName || 'Unknown Vendor'
        })));

        const sales = Array.isArray(salesRes) ? salesRes : [];
        setSalesHistory(sales.map((s) => ({
          id: s.id,
          customerName: s.customerName,
          total: s.totalAmount,
          date: new Date(s.date).toLocaleDateString(),
          discountApplied: false
        })));
      } else if (activeUser.role === ROLES.STAFF) {
        // Staff only needs customers and parts for sales operations
        const [customersRes, partsRes, salesRes] = await Promise.all([
          apiFetch('/users/customers'),
          apiFetch('/parts'),
          apiFetch('/Transactions/sales')
        ]);

        setStaffList([]);
        const customers = Array.isArray(customersRes) ? customersRes : [];
        setCustomerList(customers.map((c) => ({
          id: c.id,
          name: c.name,
          email: c.email || '',
          phone: c.phoneNumber || '',
          role: c.role,
          isActive: c.isActive,
          plate: c.vehicles?.length > 0 ? c.vehicles[0].plateNumber : 'N/A',
          vehicleInfo: c.vehicles?.length > 0 ? c.vehicles[0] : null,
          vehicleCount: c.vehicles?.length || 0,
          spend: 0
        })));

        const parts = Array.isArray(partsRes) ? partsRes : [];
        setInventory(parts.map((p) => ({
          id: p.id,
          name: p.name || '',
          stock: p.stockLevel || 0,
          price: p.price || 0,
          vendor: p.vendorName || 'Unknown Vendor'
        })));

        const sales = Array.isArray(salesRes) ? salesRes : [];
        setSalesHistory(sales.map((s) => ({
          id: s.id,
          customerName: s.customerName,
          total: s.totalAmount,
          date: new Date(s.date).toLocaleDateString(),
          discountApplied: false
        })));
      }
    } catch (error) {
      console.error('Data load error:', error);
      showToast('error', 'Some data failed to load. Please refresh if needed.');
    } finally {
      setIsLoading(false);
    }
  };

  const logout = () => {
    clearStoredUser();
    setUser(null);
    setStaffList([]);
    setCustomerList([]);
    setInventory([]);
    setSalesHistory([]);
    window.history.pushState({}, '', '/login');
    setCurrentPath('/login');
  };

  const handleAddStaff = async (newStaff) => {
    try {
      const savedStaff = await authApi.createStaff({
        fullName: newStaff.fullName,
        emailAddress: newStaff.emailAddress,
        phoneNumber: newStaff.phoneNumber,
        password: newStaff.password,
        confirmPassword: newStaff.confirmPassword
      });
      setStaffList((prev) => [...prev, { ...savedStaff }]);
      showToast('success', 'Staff created successfully.');
      return true;
    } catch (err) {
      showToast('error', err.message || 'Failed to create staff.');
      return false;
    }
  };

  const handleRemoveStaff = async (id) => {
    try {
      await authApi.toggleUserStatus(id);
      setStaffList((prev) => prev.filter((s) => s.id !== id));
      showToast('success', 'Staff deactivated successfully.');
    } catch (err) {
      throw new Error(err.message || 'Failed to deactivate staff member');
    }
  };

  const handleUpdateStaff = async (id, updatedData) => {
    try {
      const requestBody = {
        name: updatedData.name,
        email: updatedData.email
      };
      if (updatedData.password && updatedData.password.trim().length > 0) {
        requestBody.password = updatedData.password.trim();
      }
      const response = await authApi.updateUser(id, requestBody);
      setStaffList((prev) => prev.map((s) =>
        s.id === id ? { ...s, ...response } : s
      ));
      showToast('success', 'User updated successfully.');
    } catch (err) {
      throw new Error(err.message || 'Failed to update staff credentials');
    }
  };

  const handleRegisterCustomer = async (customerData) => {
    try {
      const vehicle = customerData.vehicle || {};

      await authApi.registerCustomer({
        name: customerData.name,
        email: customerData.email,
        password: customerData.password,
        confirmPassword: customerData.password,
        phoneNumber: customerData.phone,
        vehicles: [{
          plateNumber: vehicle.plateNumber,
          make: vehicle.make,
          model: vehicle.model,
          year: Number(vehicle.year),
          fuelType: vehicle.fuelType,
          mileage: Number(vehicle.mileage)
        }]
      });

      const loginResponse = await authApi.login(customerData.email.trim(), customerData.password);
      await loadAllData(); // Refresh list to include new customer
      return {
        id: loginResponse.id,
        name: loginResponse.fullName,
        email: loginResponse.emailAddress,
        role: loginResponse.role,
        token: loginResponse.token
      };
    } catch (err) {
      showToast('error', err.message || 'Registration failed.');
      return false;
    }
  };

  const handleRemoveCustomer = async (id) => {
    try {
      await authApi.toggleUserStatus(id);
      setCustomerList((prev) => prev.filter((c) => c.id !== id));
    } catch (err) {
      throw new Error(err.message || 'Failed to remove customer');
    }
  };

  const handleUpdateCustomer = (updatedCust) =>
    setCustomerList((prev) => prev.map((c) => c.id === updatedCust.id ? updatedCust : c));

  const handleProcessSale = async (customerId, cartItems, paymentStatus = 'full-payment') => {
    const customer = customerList.find((c) => c.id === parseInt(customerId, 10));
    if (!customer || cartItems.length === 0) return showToast('error', 'Please select a customer and at least one item.');

    try {
      const totalAmount = cartItems.reduce((sum, item) => sum + (item.price * item.quantity), 0);

      // Build the sale request payload matching the backend DTO
      const salePayload = {
        customerId: parseInt(customerId, 10),
        //vehicleId: customer.vehicleInfo?.id || null, // Auto-fetch from customer's first vehicle
        totalAmount,
        paymentStatus: paymentStatus || 'full-payment',
        items: cartItems.map((item) => ({
          partId: item.id,
          quantity: item.quantity,
          unitPrice: item.price
        }))
      };

      console.log('Sale payload:', salePayload);

      const invoice = await apiFetch('/Transactions/sale', {
        method: 'POST',
        body: JSON.stringify(salePayload)
      });

      console.log('Sale response:', invoice);

      const finalPrice = invoice.totalAmount;
      const isDiscounted = invoice.discountApplied || finalPrice < totalAmount;

      const newInvoice = {
        id: invoice.id,
        customerName: customer.name,
        total: finalPrice,
        date: new Date().toLocaleDateString(),
        discountApplied: isDiscounted
      };

      setSalesHistory((prev) => [newInvoice, ...prev]);
      setCustomerList((prev) => prev.map((c) => c.id === customer.id ? { ...c, spend: (c.spend ?? 0) + finalPrice } : c));

      let updatedInv = [...inventory];
      cartItems.forEach((item) => {
        updatedInv = updatedInv.map((p) => p.id === item.id ? { ...p, stock: Math.max(0, p.stock - item.quantity) } : p);
      });
      setInventory(updatedInv);

      showToast('success', `Invoice #${invoice.id} generated. ${isDiscounted ? '10% Loyalty Discount Applied! ' : ''}Total: Rs. ${finalPrice.toFixed(2)}`);
    } catch (error) {
      console.error('Sale error:', error);
      const errorMessage = error.message || 'Failed to process sale.';
      showToast('error', errorMessage);
    }
  };

  const handleUpdateInventory = (newParts) => setInventory(newParts);

  const handleLogin = async (loggedInUser) => {
    saveStoredUser(loggedInUser);
    setUser(loggedInUser);
    const dashboardPath = getDashboardPath(loggedInUser.role);
    window.history.pushState({}, '', dashboardPath);
    setCurrentPath(dashboardPath);
    await loadAllData(loggedInUser);
  };

  if (currentPath === '/parts') {
    if (user?.role !== ROLES.ADMIN) {
      return null;
    }

    return (
      <MainLayout currentPath={currentPath} onNavigate={handleNavigate}>
        <PartsPage />
      </MainLayout>
    );
  }

  if (currentPath === '/vendors') {
    if (user?.role !== ROLES.ADMIN) {
      return null;
    }

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
        {currentPath === '/login' && (
          <LoginPage
            onLogin={handleLogin}
            onSignUp={() => {
              window.history.pushState({}, '', '/signup');
              setCurrentPath('/signup');
            }}
            onForgotPassword={() => {
              window.history.pushState({}, '', '/forgot-password');
              setCurrentPath('/forgot-password');
            }}
          />
        )}
        {currentPath === '/forgot-password' && (
          <ForgotPasswordPage
            onContinue={() => {
              window.history.pushState({}, '', '/verify-otp');
              setCurrentPath('/verify-otp');
            }}
            onBack={() => {
              window.history.pushState({}, '', '/login');
              setCurrentPath('/login');
            }}
          />
        )}
        {currentPath === '/verify-otp' && (
          <VerifyOtpPage
            onContinue={() => {
              window.history.pushState({}, '', '/reset-password');
              setCurrentPath('/reset-password');
            }}
            onBack={() => {
              window.history.pushState({}, '', '/forgot-password');
              setCurrentPath('/forgot-password');
            }}
            onMissingEmail={() => {
              window.history.replaceState({}, '', '/forgot-password');
              setCurrentPath('/forgot-password');
            }}
          />
        )}
        {currentPath === '/reset-password' && (
          <ResetPasswordPage
            onComplete={() => {
              window.history.pushState({}, '', '/login');
              setCurrentPath('/login');
            }}
            onMissingOtp={() => {
              window.history.replaceState({}, '', '/forgot-password');
              setCurrentPath('/forgot-password');
            }}
            onBack={() => {
              window.history.pushState({}, '', '/verify-otp');
              setCurrentPath('/verify-otp');
            }}
          />
        )}
        {currentPath === '/signup' && (
          <SignupPage
            onComplete={handleLogin}
            onBack={() => {
              window.history.pushState({}, '', '/login');
              setCurrentPath('/login');
            }}
            onAddCustomer={handleRegisterCustomer}
          />
        )}
        {user && currentPath === getDashboardPath(user.role) && (
          <Dashboard
            user={user}
            staffList={staffList}
            customerList={customerList}
            inventory={inventory}
            salesHistory={salesHistory}
            isLoading={isLoading}
            onAddStaff={handleAddStaff}
            onRemoveStaff={handleRemoveStaff}
            onUpdateStaff={handleUpdateStaff}
            onProcessSale={handleProcessSale}
            onUpdateInventory={handleUpdateInventory}
            onRemoveCustomer={handleRemoveCustomer}
            onUpdateCustomer={handleUpdateCustomer}
            onRegisterCustomer={handleRegisterCustomer}
            staffView={staffView}
            setStaffView={setStaffView}
            onOpenVendorManagement={() => {
              window.history.pushState({}, '', '/vendors');
              setCurrentPath('/vendors');
            }}
          />
        )}
      </main>
      {user && <Footer />}
    </div>
  );
}

function Dashboard({ user, staffList, customerList, inventory, salesHistory, isLoading, onAddStaff, onRemoveStaff, onUpdateStaff, onProcessSale, onUpdateInventory, onRemoveCustomer, onUpdateCustomer, onRegisterCustomer, staffView, setStaffView, onOpenVendorManagement }) {
  return (
    <div>
      <h1>{user.role} Dashboard</h1>
      {isLoading && <div style={{ padding: '1rem', textAlign: 'center', opacity: 0.6 }}>Loading data...</div>}
      {user.role === ROLES.ADMIN && (<AdminDashboard staffList={staffList} onAddStaff={onAddStaff} onRemoveStaff={onRemoveStaff} onUpdateStaff={onUpdateStaff} sales={salesHistory} inventory={inventory} onUpdateInventory={onUpdateInventory} customerList={customerList} onRemoveCustomer={onRemoveCustomer} onUpdateCustomer={onUpdateCustomer} onOpenVendorManagement={onOpenVendorManagement} />)}
      {user.role === ROLES.STAFF && (<StaffDashboard view={staffView} setView={setStaffView} customers={customerList} parts={inventory} sales={salesHistory} onProcessSale={onProcessSale} onRegisterCustomer={onRegisterCustomer} />)}
      {user.role === ROLES.CUSTOMER && (<CustomerDashboard user={user} sales={salesHistory} />)}
    </div>
  );
}

export default App;
