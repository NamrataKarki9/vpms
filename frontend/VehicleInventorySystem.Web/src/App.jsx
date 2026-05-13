import React, { useEffect, useState } from 'react';
import { Routes, Route, Navigate, useLocation, useNavigate } from 'react-router-dom';
import Header from './components/Header';
import Footer from './components/Footer';
import { AdminDashboard } from './pages/AdminDashboard';
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

// Staff Section Components
import StaffLayout from './components/staff/StaffLayout';
import Dashboard from './pages/staff/Dashboard';
import Customers from './pages/staff/Customers';
import CustomerSegments from './pages/staff/CustomerSegments';
import CustomerDetail from './pages/staff/CustomerDetail';
import Sales from './pages/staff/Sales';
import Invoices from './pages/staff/Invoices';
import Inventory from './pages/staff/Inventory';
import Appointments from './pages/staff/Appointments';

import './index.css';

const ROLES = { ADMIN: 'Admin', STAFF: 'Staff', CUSTOMER: 'Customer' };

function App() {
  const showToast = useToast();
  const location = useLocation();
  const navigate = useNavigate();
  const [user, setUser] = useState(() => getStoredUser());
  const [staffList, setStaffList] = useState([]);
  const [customerList, setCustomerList] = useState([]);
  const [inventory, setInventory] = useState([]);
  const [salesHistory, setSalesHistory] = useState([]);
  const [appointments, setAppointments] = useState([]);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    const handleUnauthorized = () => {
      setUser(null);
      clearStoredUser();
      navigate('/login');
      showToast('error', 'Your session has expired. Please log in again.');
    };

    window.addEventListener('vis:unauthorized', handleUnauthorized);
    return () => window.removeEventListener('vis:unauthorized', handleUnauthorized);
  }, [navigate, showToast]);

  useEffect(() => {
    if (user) {
      loadAllData(user);
    }
  }, [user]);

  const loadAllData = async (activeUser = user) => {
    if (!activeUser) return;
    setIsLoading(true);
    try {
      if (activeUser.role === ROLES.ADMIN || activeUser.role === ROLES.STAFF) {
        const [partsRes, salesRes] = await Promise.all([
          apiFetch('/parts'),
          apiFetch('/Transactions/sales')
        ]);

        const parts = Array.isArray(partsRes) ? partsRes : [];
        setInventory(parts.map((p) => ({
          id: p.id ?? p.Id,
          name: p.name ?? p.Name ?? '',
          stock: p.stockLevel ?? p.StockLevel ?? 0,
          stockLevel: p.stockLevel ?? p.StockLevel ?? 0,
          price: p.price ?? p.Price ?? 0,
          vendorId: p.vendorId ?? p.VendorId ?? 0,
          vendorName: p.vendorName ?? p.VendorName ?? '',
          vendor: p.vendorName ?? p.VendorName ?? 'Unknown Vendor',
          partCode: p.partCode ?? p.PartCode ?? ''
        })));

        const sales = Array.isArray(salesRes) ? salesRes : [];
        setSalesHistory(sales.map((s) => ({
          id: s.id,
          customerName: s.customerName,
          total: s.totalAmount,
          date: new Date(s.date).toLocaleDateString(),
          paymentStatus: s.paymentStatus
        })));
      }

      if (activeUser.role === ROLES.ADMIN) {
        const usersRes = await apiFetch('/users');
        const users = Array.isArray(usersRes) ? usersRes : [];
        setStaffList(users.filter((u) => u.role === 'Admin' || u.role === 'Staff'));
        setCustomerList(users.filter((u) => u.role === 'Customer').map((c) => ({
          id: c.id,
          name: c.name,
          email: c.email || '',
          phone: c.phoneNumber || '',
          isActive: c.isActive,
          plate: c.vehicles?.length > 0 ? c.vehicles[0].plateNumber : 'N/A',
          vehicleInfo: c.vehicles?.length > 0 ? c.vehicles[0] : null
        })));
      } else if (activeUser.role === ROLES.STAFF) {
        const [custsRes, apptsRes] = await Promise.all([
          apiFetch('/users/customers'),
          apiFetch('/Service/appointments')
        ]);
        const customers = Array.isArray(custsRes) ? custsRes : [];
        setCustomerList(customers.map((c) => ({
          id: c.id,
          name: c.name,
          email: c.email || '',
          phone: c.phoneNumber || '',
          isActive: c.isActive,
          plate: c.vehicles?.length > 0 ? c.vehicles[0].plateNumber : 'N/A',
          vehicleInfo: c.vehicles?.length > 0 ? c.vehicles[0] : null
        })));
        setAppointments(apptsRes || []);
      } else if (activeUser.role === ROLES.CUSTOMER) {
        setInventory([]);
        setSalesHistory([]);
      }
    } catch (error) {
      console.error('Data load error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const logout = () => {
    clearStoredUser();
    setUser(null);
    navigate('/login');
  };

  const handleLogin = async (loggedInUser) => {
    saveStoredUser(loggedInUser);
    setUser(loggedInUser);
    const path = loggedInUser.role === ROLES.STAFF ? '/staff/dashboard' : (loggedInUser.role === ROLES.ADMIN ? '/admin' : '/customer');
    navigate(path);
  };

  const handleProcessSale = async (customerId, cartItems, paymentStatus) => {
    try {
      const totalAmount = cartItems.reduce((sum, item) => sum + (item.price * item.quantity), 0);
      const salePayload = {
        customerId: parseInt(customerId, 10),
        totalAmount,
        paymentStatus,
        items: cartItems.map(item => ({ partId: item.id, quantity: item.quantity, unitPrice: item.price }))
      };
      const response = await apiFetch('/Transactions/sale', { method: 'POST', body: JSON.stringify(salePayload) });
      showToast('success', `Sale #${response.id} processed successfully!`);
      await loadAllData(); // Refresh inventory and sales history
    } catch (err) {
      showToast('error', err.message || 'Failed to process sale.');
    }
  };

  const handleAddStaff = async (staffPayload) => {
    try {
      await authApi.createStaff(staffPayload);
      showToast('success', 'Staff member created successfully.');
      await loadAllData(user);
      return true;
    } catch (error) {
      showToast('error', error.message || 'Failed to create staff member.');
      return false;
    }
  };

  const handleUpdateCustomer = (updatedCustomer) => {
    setCustomerList((current) =>
      current.map((customer) => (customer.id === updatedCustomer.id ? { ...customer, ...updatedCustomer } : customer))
    );
  };

  const handleRemoveCustomer = async (customerId) => {
    await authApi.toggleUserStatus(customerId);
    setCustomerList((current) => current.filter((customer) => customer.id !== customerId));
  };

  const isStaffSection = location.pathname.startsWith('/staff');

  return (
    <div className="app-container">
      {!isStaffSection && user && <Header user={user} onLogout={logout} onNavigateStaff={() => navigate('/staff/dashboard')} />}
      
      <main className={isStaffSection ? "" : "main-content"}>
        <Routes>
          <Route path="/" element={user ? <Navigate to={user.role === ROLES.STAFF ? "/staff/dashboard" : (user.role === ROLES.ADMIN ? "/admin" : "/customer")} /> : <Navigate to="/login" />} />
          <Route path="/login" element={<LoginPage onLogin={handleLogin} onSignUp={() => navigate('/signup')} onForgotPassword={() => navigate('/forgot-password')} />} />
          <Route path="/signup" element={<SignupPage onComplete={handleLogin} onBack={() => navigate('/login')} onAddCustomer={() => {}} />} />
          
          {/* Staff Section with Layout Overhaul */}
          {user?.role === ROLES.STAFF && (
            <Route path="/staff" element={<StaffLayout user={user} />}>
              <Route index element={<Navigate to="dashboard" />} />
              <Route path="dashboard" element={<Dashboard sales={salesHistory} customers={customerList} parts={inventory} appointments={appointments} />} />
              <Route path="customers" element={<Customers customers={customerList} />} />
              <Route path="customers/:id" element={<CustomerDetail />} />
              <Route path="customers/segments" element={<CustomerSegments />} />
              <Route path="sales/new" element={<Sales customers={customerList} parts={inventory} onProcessSale={handleProcessSale} />} />
              <Route path="invoices" element={<Invoices sales={salesHistory} />} />
              <Route path="parts" element={<Inventory parts={inventory} />} />
              <Route path="appointments" element={<Appointments appointments={appointments} />} />
              <Route path="analytics" element={<CustomerSegments />} /> {/* Reusing segments for now as placeholder for analytics */}
              <Route path="history" element={<Invoices sales={salesHistory} />} /> {/* Reusing invoices for history */}
            </Route>
          )}

          {/* Admin and Customer fallbacks */}
          <Route
            path="/admin"
            element={user?.role === ROLES.ADMIN ? (
              <AdminDashboard
                staffList={staffList}
                onAddStaff={handleAddStaff}
                sales={salesHistory}
                inventory={inventory}
                onUpdateInventory={setInventory}
                customerList={customerList}
                onRemoveCustomer={handleRemoveCustomer}
                onUpdateCustomer={handleUpdateCustomer}
                onOpenVendorManagement={() => navigate('/vendors')}
              />
            ) : <Navigate to="/" />}
          />
          <Route path="/customer" element={user?.role === ROLES.CUSTOMER ? <CustomerDashboard user={user} sales={salesHistory} /> : <Navigate to="/" />} />
          <Route path="/parts" element={user?.role === ROLES.ADMIN ? <MainLayout><PartsPage /></MainLayout> : <Navigate to="/" />} />
          <Route path="/vendors" element={user?.role === ROLES.ADMIN ? <MainLayout><VendorPage /></MainLayout> : <Navigate to="/" />} />
          
          <Route path="/forgot-password" element={<ForgotPasswordPage onContinue={() => navigate('/verify-otp')} onBack={() => navigate('/login')} />} />
          <Route path="/verify-otp" element={<VerifyOtpPage onContinue={() => navigate('/reset-password')} onBack={() => navigate('/forgot-password')} />} />
          <Route path="/reset-password" element={<ResetPasswordPage onComplete={() => navigate('/login')} onBack={() => navigate('/verify-otp')} />} />
        </Routes>
      </main>

      {!isStaffSection && user && <Footer />}
    </div>
  );
}

export default App;
