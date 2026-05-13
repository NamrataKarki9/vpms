import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Car, 
  CalendarClock, 
  ClipboardList, 
  History as HistoryIcon, 
  PlusCircle, 
  Trash2, 
  ChevronRight, 
  AlertCircle,
  Clock,
  CheckCircle2,
  Package,
  MessageSquare,
  X,
  Send,
  TrendingUp
} from 'lucide-react';
import { apiFetch } from '../services/api.js';
import { useToast } from '../context/ToastContext';
import VehicleForm from '../components/forms/VehicleForm';
import { CustomerHistory as CustomerHistoryComp } from './CustomerHistory';

// --- METRICS & COLORS (Similar to Staff) ---
const METRIC_COLORS = [
  { from: '#1E3A5F', to: '#2563A8', light: '#DBEAFE', text: '#1D4ED8' }, // Blue
  { from: '#065F46', to: '#059669', light: '#DCFCE7', text: '#15803D' }, // Green
  { from: '#7C3AED', to: '#9333EA', light: '#EDE9FE', text: '#6D28D9' }, // Purple
  { from: '#B45309', to: '#D97706', light: '#FEF3C7', text: '#B45309' }, // Amber
];

/**
 * CUSTOMER OVERVIEW (DASHBOARD MAIN VIEW)
 */
export function CustomerOverview({ user }) {
  const navigate = useNavigate();
  const [vehicles, setVehicles] = useState([]);
  const [appointments, setAppointments] = useState([]);
  const [partRequests, setPartRequests] = useState([]);
  const [history, setHistory] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (user?.id) loadData();
  }, [user]);

  const loadData = async () => {
    try {
      const [v, a, pr, h] = await Promise.all([
        apiFetch(`/Customers/${user.id}/vehicles`),
        apiFetch(`/Service/appointments?customerId=${user.id}`),
        apiFetch(`/Service/special-part-requests?customerId=${user.id}`),
        apiFetch(`/Customers/${user.id}/history`)
      ]);
      if (v) setVehicles(v);
      if (a) setAppointments(a);
      if (pr) setPartRequests(pr);
      if (h) setHistory(h);
    } catch (err) {
      console.error('Error loading overview data:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const metrics = [
    { label: "My Vehicles", value: vehicles.length, sub: "Registered in garage", icon: Car, color: METRIC_COLORS[0], path: '/customer/vehicles' },
    { label: "Bookings", value: appointments.filter(a => a.status !== 'Cancelled').length, sub: "Upcoming services", icon: CalendarClock, color: METRIC_COLORS[1], path: '/customer/appointments' },
    { label: "Special Orders", value: partRequests.length, sub: "Active part requests", icon: Package, color: METRIC_COLORS[2], path: '/customer/requests' },
    { label: "Total Visits", value: history.length, sub: "Complete history", icon: HistoryIcon, color: METRIC_COLORS[3], path: '/customer/history' },
  ];

  return (
    <div className="customer-dashboard-overview">
      {/* Page Header */}
      <div className="page-section-header" style={{ marginBottom: '24px' }}>
        <h2>Welcome back, {user?.name?.split(' ')[0] || 'Customer'}!</h2>
        <p>Manage your vehicles and service appointments from your personal portal.</p>
      </div>

      {/* Metric Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px', marginBottom: '24px' }}>
        {metrics.map((m, i) => (
          <div key={i} className="metric-card" onClick={() => navigate(m.path)} style={{ cursor: 'pointer' }}>
            <div className="metric-card-accent" style={{ background: `linear-gradient(135deg, ${m.color.from}, ${m.color.to})` }} />
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '14px' }}>
              <div style={{ width: 40, height: 40, borderRadius: '10px', background: m.color.light, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <m.icon size={18} color={m.color.text} />
              </div>
              <TrendingUp size={14} color="#15803D" />
            </div>
            <p style={{ fontSize: '11px', color: '#64748B', textTransform: 'uppercase', letterSpacing: '0.7px', fontWeight: 600, marginBottom: '6px' }}>{m.label}</p>
            <p style={{ fontSize: '26px', fontWeight: 800, color: '#1E293B', letterSpacing: '-0.5px', marginBottom: '4px' }}>{m.value}</p>
            <p style={{ fontSize: '12px', color: '#94A3B8' }}>{m.sub}</p>
          </div>
        ))}
      </div>

      {/* Main Content Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(350px, 1fr))', gap: '16px' }}>
        
        {/* Recent Appointments */}
        <div className="staff-card">
          <div className="staff-card-header">
            <span className="staff-card-title">Upcoming Appointments</span>
            <button className="btn-view-customer" onClick={() => navigate('/customer/appointments')}>Manage All</button>
          </div>
          <div className="staff-card-body">
            {appointments.filter(a => a.status !== 'Cancelled').slice(0, 3).map(a => (
              <div key={a.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '14px 20px', borderBottom: '1px solid #F1F5F9' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <div style={{ width: 36, height: 36, borderRadius: '10px', background: '#F1F5F9', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <Clock size={16} color="#64748B" />
                  </div>
                  <div>
                    <div style={{ fontSize: '13px', fontWeight: 600, color: '#1E293B' }}>{a.serviceType}</div>
                    <div style={{ fontSize: '11px', color: '#94A3B8' }}>{new Date(a.appointmentDate).toLocaleDateString()} at {a.appointmentTime}</div>
                  </div>
                </div>
                <span className="badge-pill badge-loyalty">Confirmed</span>
              </div>
            ))}
            {appointments.filter(a => a.status !== 'Cancelled').length === 0 && (
              <div className="empty-state">
                <div className="empty-state-icon">📅</div>
                <h4>No Bookings</h4>
                <p>You have no upcoming service appointments.</p>
                <button className="btn-sale-primary" style={{ marginTop: '12px' }} onClick={() => navigate('/customer/book')}>Book Now</button>
              </div>
            )}
          </div>
        </div>

        {/* My Vehicles Summary */}
        <div className="staff-card">
          <div className="staff-card-header">
            <span className="staff-card-title">My Garage</span>
            <button className="btn-view-customer" onClick={() => navigate('/customer/vehicles')}>View Garage</button>
          </div>
          <div className="staff-card-body">
            {vehicles.slice(0, 3).map(v => (
              <div key={v.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '14px 20px', borderBottom: '1px solid #F1F5F9' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <div style={{ width: 36, height: 36, borderRadius: '10px', background: '#F1F5F9', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <Car size={16} color="#64748B" />
                  </div>
                  <div>
                    <div style={{ fontSize: '13px', fontWeight: 600, color: '#1E293B' }}>{v.make} {v.model}</div>
                    <div style={{ fontSize: '11px', color: '#94A3B8' }}>{v.plateNumber} • {v.year}</div>
                  </div>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontSize: '11px', color: '#94A3B8' }}>Mileage</div>
                  <div style={{ fontSize: '12px', fontWeight: 700, color: '#1E293B' }}>{v.mileage} km</div>
                </div>
              </div>
            ))}
            {vehicles.length === 0 && (
              <div className="empty-state">
                <div className="empty-state-icon">🚗</div>
                <h4>Empty Garage</h4>
                <p>Add your vehicles to track service history.</p>
                <button className="btn-sale-primary" style={{ marginTop: '12px' }} onClick={() => navigate('/customer/vehicles')}>Add Vehicle</button>
              </div>
            )}
          </div>
        </div>

      </div>
    </div>
  );
}

/**
 * VEHICLES PAGE
 */
export function VehiclesPage({ user }) {
  const navigate = useNavigate();
  const [vehicles, setVehicles] = useState([]);
  const [isAdding, setIsAdding] = useState(false);
  const [form, setForm] = useState({ plateNumber: '', model: '', make: '', year: new Date().getFullYear(), fuelType: '', mileage: 0 });
  const [error, setError] = useState('');
  const [successDialog, setSuccessDialog] = useState(false);

  useEffect(() => {
    loadVehicles();
  }, [user]);

  const loadVehicles = async () => {
    const v = await apiFetch(`/Customers/${user.id}/vehicles`);
    if (v) setVehicles(v);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    if (!form.plateNumber.trim() || !form.model.trim() || !form.make.trim()) {
      setError('Please fill in all required fields');
      return;
    }
    try {
      const savedVehicle = await apiFetch(`/Customers/${user.id}/vehicles`, {
        method: 'POST',
        body: JSON.stringify({
          plateNumber: form.plateNumber.trim(),
          model: form.model.trim(),
          make: form.make.trim(),
          year: form.year,
          fuelType: form.fuelType || null,
          mileage: Number(form.mileage)
        })
      });
      setVehicles([...vehicles, savedVehicle]);
      setForm({ plateNumber: '', model: '', make: '', year: new Date().getFullYear(), fuelType: '', mileage: 0 });
      setIsAdding(false);
      setSuccessDialog(true);
    } catch (err) {
      setError(err.message || 'Failed to add vehicle');
    }
  };

  const handleDeleteVehicle = async (id) => {
    if (!window.confirm('Are you sure you want to remove this vehicle?')) return;
    try {
      await apiFetch(`/Customers/${user.id}/vehicles/${id}`, { method: 'DELETE' });
      setVehicles(prev => prev.filter(v => v.id !== id));
    } catch (err) {
      alert('Failed to delete vehicle');
    }
  };

  return (
    <div>
      <div className="page-section-header" style={{ marginBottom: '24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h2>My Vehicles</h2>
          <p>Manage and track all vehicles in your personal garage.</p>
        </div>
        <button className="btn-sale-primary" onClick={() => setIsAdding(!isAdding)}>
          <PlusCircle size={14} />
          <span>Add Vehicle</span>
        </button>
      </div>

      {isAdding && (
        <div className="staff-card" style={{ marginBottom: '24px', padding: '24px' }}>
          <h3 style={{ marginBottom: '20px' }}>Register New Vehicle</h3>
          <form style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
            <VehicleForm value={form} onChange={setForm} errors={{}} showMileageHint={false} />
            <div style={{ gridColumn: 'span 2', display: 'flex', gap: '12px', marginTop: '12px' }}>
              <button type="button" onClick={() => setIsAdding(false)} className="btn-view-customer" style={{ padding: '10px 24px' }}>Cancel</button>
              <button type="submit" onClick={handleSubmit} className="btn-sale-primary" style={{ padding: '10px 24px' }}>Save Vehicle</button>
            </div>
            {error && <p style={{ color: '#ef4444', fontSize: '13px', gridColumn: 'span 2' }}>{error}</p>}
          </form>
        </div>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '20px' }}>
        {vehicles.map(v => (
          <div key={v.id} className="staff-card" style={{ position: 'relative' }}>
            <div className="staff-card-header">
              <span className="staff-card-title">{v.make} {v.model}</span>
              <span className="badge-pill badge-paid">{v.year}</span>
            </div>
            <div style={{ padding: '20px' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '16px' }}>
                <div>
                  <div style={{ fontSize: '11px', color: '#94A3B8', textTransform: 'uppercase' }}>Plate Number</div>
                  <div style={{ fontSize: '14px', fontWeight: 700, color: '#1E293B' }}>{v.plateNumber}</div>
                </div>
                <div>
                  <div style={{ fontSize: '11px', color: '#94A3B8', textTransform: 'uppercase' }}>Fuel Type</div>
                  <div style={{ fontSize: '14px', fontWeight: 700, color: '#1E293B' }}>{v.fuelType || 'N/A'}</div>
                </div>
                <div>
                  <div style={{ fontSize: '11px', color: '#94A3B8', textTransform: 'uppercase' }}>Current Mileage</div>
                  <div style={{ fontSize: '14px', fontWeight: 700, color: '#1E293B' }}>{v.mileage?.toLocaleString()} km</div>
                </div>
              </div>
              <button 
                onClick={() => handleDeleteVehicle(v.id)} 
                style={{ width: '100%', background: '#FFF5F5', color: '#B91C1C', border: '1px solid #FCA5A5', padding: '8px', borderRadius: '8px', fontSize: '12px', fontWeight: 600, cursor: 'pointer' }}
              >
                <Trash2 size={12} style={{ marginRight: '6px' }} />
                Remove Vehicle
              </button>
            </div>
          </div>
        ))}
        {vehicles.length === 0 && (
          <div className="staff-card" style={{ gridColumn: 'span 3', padding: '60px', textAlign: 'center' }}>
            <Car size={48} color="#CBD5E1" style={{ marginBottom: '16px' }} />
            <h4>Your garage is empty</h4>
            <p style={{ color: '#94A3B8' }}>Add your first vehicle to start tracking services.</p>
          </div>
        )}
      </div>

      {successDialog && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(30,58,95,0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999, backdropFilter: 'blur(4px)' }}>
          <div className="staff-card" style={{ padding: '32px', maxWidth: '400px', textAlign: 'center', boxShadow: '0 20px 50px rgba(0,0,0,0.2)' }}>
            <div style={{ width: '64px', height: '64px', borderRadius: '50%', background: '#DCFCE7', color: '#15803D', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px' }}>
              <CheckCircle2 size={32} />
            </div>
            <h3 style={{ marginBottom: '12px' }}>Vehicle Added!</h3>
            <p style={{ color: '#64748B', marginBottom: '24px' }}>Your vehicle has been registered successfully.</p>
            <button className="btn-sale-primary" style={{ width: '100%' }} onClick={() => setSuccessDialog(false)}>Great, Thanks!</button>
          </div>
        </div>
      )}
    </div>
  );
}

/**
 * APPOINTMENTS PAGE
 */
export function AppointmentsPage({ user }) {
  const navigate = useNavigate();
  const showToast = useToast();
  const [appointments, setAppointments] = useState([]);
  const [vehicles, setVehicles] = useState([]);
  const [cancelDialog, setCancelDialog] = useState({ isOpen: false, id: null, name: '' });
  const [rescheduleDialog, setRescheduleDialog] = useState({ isOpen: false, id: null, newDate: '' });
  const [rescheduleError, setRescheduleError] = useState('');
  const [successDialog, setSuccessDialog] = useState({ isOpen: false, message: '' });

  useEffect(() => {
    loadData();
  }, [user]);

  const loadData = async () => {
    const [a, v] = await Promise.all([
      apiFetch(`/Service/appointments?customerId=${user.id}`),
      apiFetch(`/Customers/${user.id}/vehicles`)
    ]);
    if (a) setAppointments(a);
    if (v) setVehicles(v);
  };

  const handleCancelClick = (a) => {
    if (new Date(a.appointmentDate) < new Date()) {
      showToast('error', 'Past appointments cannot be cancelled.');
      return;
    }
    setCancelDialog({ isOpen: true, id: a.id, name: a.serviceType });
  };

  const handleConfirmCancel = async () => {
    try {
      await apiFetch(`/Service/appointments/${cancelDialog.id}`, { method: 'DELETE' });
      setAppointments(prev => prev.filter(a => a.id !== cancelDialog.id));
      setSuccessDialog({ isOpen: true, message: 'Appointment cancelled successfully.' });
      setCancelDialog({ isOpen: false, id: null, name: '' });
    } catch (err) {
      showToast('error', 'Failed to cancel appointment');
    }
  };

  const handleConfirmReschedule = async () => {
    if (!rescheduleDialog.newDate) {
      setRescheduleError('Please select a new date and time.');
      return;
    }
    try {
      const appointment = appointments.find(a => a.id === rescheduleDialog.id);
      const [dateStr, timeStr] = rescheduleDialog.newDate.split('T');
      const updated = {
        ...appointment,
        appointmentDate: dateStr + 'T00:00:00Z',
        appointmentTime: timeStr + ':00',
        rescheduleCount: (appointment.rescheduleCount || 0) + 1
      };
      await apiFetch(`/Service/appointments/${updated.id}`, { method: 'PUT', body: JSON.stringify(updated) });
      setAppointments(prev => prev.map(a => a.id === updated.id ? updated : a));
      setSuccessDialog({ isOpen: true, message: 'Appointment rescheduled!' });
      setRescheduleDialog({ isOpen: false, id: null, newDate: '' });
    } catch (err) {
      setRescheduleError(err.message || 'Failed to reschedule');
    }
  };

  return (
    <div>
      <div className="page-section-header" style={{ marginBottom: '24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h2>My Appointments</h2>
          <p>Track and manage your upcoming vehicle service bookings.</p>
        </div>
        <button className="btn-sale-primary" onClick={() => navigate('/customer/book')}>
          <PlusCircle size={14} />
          <span>Book Service</span>
        </button>
      </div>

      <div className="staff-card">
        <div className="staff-card-header">
          <span className="staff-card-title">Scheduled Services</span>
        </div>
        <table className="staff-table">
          <thead>
            <tr>
              <th>Service Type</th>
              <th>Vehicle</th>
              <th>Date & Time</th>
              <th>Status</th>
              <th style={{ textAlign: 'center' }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {appointments.filter(a => a.status !== 'Cancelled').map(a => {
              const vehicle = vehicles.find(v => v.id === a.vehicleId);
              return (
                <tr key={a.id}>
                  <td>
                    <div style={{ fontWeight: 600, color: '#1E293B' }}>{a.serviceType}</div>
                    <div style={{ fontSize: '11px', color: '#94A3B8' }}>Booking #{a.id}</div>
                  </td>
                  <td>
                    {vehicle ? (
                      <div>
                        <div style={{ fontWeight: 500 }}>{vehicle.make} {vehicle.model}</div>
                        <div style={{ fontSize: '11px', color: '#64748B' }}>{vehicle.plateNumber}</div>
                      </div>
                    ) : 'N/A'}
                  </td>
                  <td>
                    <div style={{ color: '#1E293B', fontWeight: 500 }}>{new Date(a.appointmentDate).toLocaleDateString()}</div>
                    <div style={{ fontSize: '11px', color: '#64748B' }}>{a.appointmentTime}</div>
                  </td>
                  <td><span className="badge-pill badge-loyalty">Confirmed</span></td>
                  <td>
                    <div style={{ display: 'flex', gap: '8px', justifyContent: 'center' }}>
                      <button className="btn-view-customer" onClick={() => setRescheduleDialog({ isOpen: true, id: a.id, newDate: '' })}>Reschedule</button>
                      <button className="btn-view-customer" style={{ background: '#FFF5F5', color: '#B91C1C' }} onClick={() => handleCancelClick(a)}>Cancel</button>
                    </div>
                  </td>
                </tr>
              );
            })}
            {appointments.filter(a => a.status !== 'Cancelled').length === 0 && (
              <tr>
                <td colSpan="5">
                  <div className="empty-state">
                    <div className="empty-state-icon">📅</div>
                    <h4>No upcoming appointments</h4>
                    <p>Book a service to keep your vehicle in top condition.</p>
                  </div>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Cancel Dialog */}
      {cancelDialog.isOpen && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(30,58,95,0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999, backdropFilter: 'blur(4px)' }}>
          <div className="staff-card" style={{ padding: '32px', maxWidth: '400px', boxShadow: '0 20px 50px rgba(0,0,0,0.2)' }}>
            <h3 style={{ marginBottom: '12px' }}>Cancel Appointment?</h3>
            <p style={{ color: '#64748B', marginBottom: '24px' }}>Are you sure you want to cancel your <strong>{cancelDialog.name}</strong> appointment? This cannot be undone.</p>
            <div style={{ display: 'flex', gap: '12px' }}>
              <button className="btn-view-customer" style={{ flex: 1 }} onClick={() => setCancelDialog({ isOpen: false, id: null, name: '' })}>No, Keep it</button>
              <button className="btn-sale-primary" style={{ flex: 1, background: '#EF4444' }} onClick={handleConfirmCancel}>Yes, Cancel</button>
            </div>
          </div>
        </div>
      )}

      {/* Reschedule Dialog */}
      {rescheduleDialog.isOpen && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(30,58,95,0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999, backdropFilter: 'blur(4px)' }}>
          <div className="staff-card" style={{ padding: '32px', maxWidth: '400px', width: '100%', boxShadow: '0 20px 50px rgba(0,0,0,0.2)' }}>
            <h3 style={{ marginBottom: '12px' }}>Reschedule</h3>
            <p style={{ color: '#64748B', marginBottom: '20px' }}>Select a new date and time for your service.</p>
            <input 
              type="datetime-local" 
              className="search-input-field"
              style={{ width: '100%', marginBottom: '16px', height: '40px' }}
              value={rescheduleDialog.newDate}
              onChange={e => { setRescheduleDialog({ ...rescheduleDialog, newDate: e.target.value }); setRescheduleError(''); }}
            />
            {rescheduleError && <p style={{ color: '#EF4444', fontSize: '12px', marginBottom: '16px' }}>{rescheduleError}</p>}
            <div style={{ display: 'flex', gap: '12px' }}>
              <button className="btn-view-customer" style={{ flex: 1 }} onClick={() => setRescheduleDialog({ isOpen: false, id: null, newDate: '' })}>Cancel</button>
              <button className="btn-sale-primary" style={{ flex: 1 }} onClick={handleConfirmReschedule}>Update Booking</button>
            </div>
          </div>
        </div>
      )}

      {/* Success Dialog */}
      {successDialog.isOpen && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(30,58,95,0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999, backdropFilter: 'blur(4px)' }}>
          <div className="staff-card" style={{ padding: '32px', maxWidth: '400px', textAlign: 'center' }}>
            <div style={{ width: '64px', height: '64px', borderRadius: '50%', background: '#DCFCE7', color: '#15803D', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px' }}>
              <CheckCircle2 size={32} />
            </div>
            <h3>Done!</h3>
            <p style={{ color: '#64748B', marginBottom: '24px' }}>{successDialog.message}</p>
            <button className="btn-sale-primary" style={{ width: '100%' }} onClick={() => setSuccessDialog({ isOpen: false, message: '' })}>Close</button>
          </div>
        </div>
      )}
    </div>
  );
}

/**
 * BOOKING PAGE
 */
export function BookingPage({ user }) {
  const navigate = useNavigate();
  const [vehicles, setVehicles] = useState([]);
  const [form, setForm] = useState({ vehicleId: '', serviceType: '', appointmentDate: '', appointmentTime: '09:00', description: '' });
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [successDialog, setSuccessDialog] = useState(false);

  useEffect(() => {
    apiFetch(`/Customers/${user.id}/vehicles`).then(v => v && setVehicles(v));
  }, [user]);

  const serviceTypes = ['Oil Change', 'Filter Replacement', 'Tire Rotation', 'Brake Service', 'Full Service', 'Diagnosis', 'Other'];
  const timeSlots = ['09:00', '10:00', '11:00', '12:00', '14:00', '15:00', '16:00'];

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.vehicleId || !form.appointmentDate || !form.serviceType) {
      setError('Please fill all required fields');
      return;
    }
    setIsSubmitting(true);
    try {
      await apiFetch('/Service/appointments', {
        method: 'POST',
        body: JSON.stringify({
          customerId: user.id,
          vehicleId: parseInt(form.vehicleId),
          appointmentDate: new Date(form.appointmentDate).toISOString(),
          appointmentTime: form.appointmentTime + ':00',
          serviceType: form.serviceType,
          description: form.description
        })
      });
      setSuccessDialog(true);
    } catch (err) {
      setError(err.message || 'Failed to book appointment');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div style={{ maxWidth: '700px', margin: '0 auto' }}>
      <div className="page-section-header" style={{ marginBottom: '24px' }}>
        <h2>Book a Service</h2>
        <p>Schedule your next maintenance or repair appointment.</p>
      </div>

      <div className="staff-card" style={{ padding: '28px' }}>
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          <div>
            <label style={{ fontSize: '13px', fontWeight: 600, display: 'block', marginBottom: '8px' }}>Select Vehicle *</label>
            <select className="search-input-field" style={{ width: '100%', height: '42px' }} value={form.vehicleId} onChange={e => setForm({...form, vehicleId: e.target.value})}>
              <option value="">-- Choose from your garage --</option>
              {vehicles.map(v => <option key={v.id} value={v.id}>{v.make} {v.model} ({v.plateNumber})</option>)}
            </select>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
            <div>
              <label style={{ fontSize: '13px', fontWeight: 600, display: 'block', marginBottom: '8px' }}>Service Type *</label>
              <select className="search-input-field" style={{ width: '100%', height: '42px' }} value={form.serviceType} onChange={e => setForm({...form, serviceType: e.target.value})}>
                <option value="">-- Select type --</option>
                {serviceTypes.map(s => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
            <div>
              <label style={{ fontSize: '13px', fontWeight: 600, display: 'block', marginBottom: '8px' }}>Preferred Date *</label>
              <input type="date" className="search-input-field" style={{ width: '100%', height: '42px' }} min={new Date().toISOString().split('T')[0]} value={form.appointmentDate} onChange={e => setForm({...form, appointmentDate: e.target.value})} />
            </div>
          </div>

          <div>
            <label style={{ fontSize: '13px', fontWeight: 600, display: 'block', marginBottom: '8px' }}>Preferred Time Slot *</label>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
              {timeSlots.map(t => (
                <button 
                  key={t} 
                  type="button"
                  onClick={() => setForm({...form, appointmentTime: t})}
                  style={{
                    padding: '8px 16px', borderRadius: '8px', border: '1px solid #E2E8F0',
                    background: form.appointmentTime === t ? '#1E3A5F' : '#fff',
                    color: form.appointmentTime === t ? '#fff' : '#64748B',
                    fontSize: '12px', fontWeight: 600, cursor: 'pointer', transition: '0.2s'
                  }}
                >
                  {t}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label style={{ fontSize: '13px', fontWeight: 600, display: 'block', marginBottom: '8px' }}>Problem Description (Optional)</label>
            <textarea 
              className="search-input-field" 
              style={{ width: '100%', minHeight: '100px', resize: 'vertical' }} 
              placeholder="Tell us what's wrong with your vehicle..."
              value={form.description}
              onChange={e => setForm({...form, description: e.target.value})}
            />
          </div>

          {error && <p style={{ color: '#EF4444', fontSize: '13px' }}>{error}</p>}

          <div style={{ display: 'flex', gap: '12px', marginTop: '12px' }}>
            <button type="button" className="btn-view-customer" style={{ flex: 1, padding: '12px' }} onClick={() => navigate('/customer/appointments')}>Cancel</button>
            <button type="submit" className="btn-sale-primary" style={{ flex: 1, padding: '12px' }} disabled={isSubmitting}>
              {isSubmitting ? 'Processing...' : 'Confirm Booking'}
            </button>
          </div>
        </form>
      </div>

      {successDialog && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(30,58,95,0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999, backdropFilter: 'blur(4px)' }}>
          <div className="staff-card" style={{ padding: '32px', maxWidth: '400px', textAlign: 'center' }}>
            <div style={{ width: '64px', height: '64px', borderRadius: '50%', background: '#DCFCE7', color: '#15803D', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px' }}>
              <CheckCircle2 size={32} />
            </div>
            <h3>Booking Confirmed!</h3>
            <p style={{ color: '#64748B', marginBottom: '24px' }}>Your service has been scheduled. We'll see you then!</p>
            <button className="btn-sale-primary" style={{ width: '100%' }} onClick={() => navigate('/customer/appointments')}>View Appointments</button>
          </div>
        </div>
      )}
    </div>
  );
}

/**
 * SPECIAL REQUESTS PAGE
 */
export function RequestsPage({ user }) {
  const navigate = useNavigate();
  const [requests, setRequests] = useState([]);

  useEffect(() => {
    apiFetch(`/Service/special-part-requests?customerId=${user.id}`).then(r => r && setRequests(r));
  }, [user]);

  const getStatusCls = (s) => {
    const status = (typeof s === 'string' ? s : ['Pending', 'Approved', 'Rejected', 'Fulfilled'][s]) || 'Pending';
    if (status === 'Approved' || status === 'Fulfilled') return 'badge-paid';
    if (status === 'Rejected') return 'badge-overdue';
    return 'badge-pending';
  };

  return (
    <div>
      <div className="page-section-header" style={{ marginBottom: '24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h2>Special Part Orders</h2>
          <p>Track requests for parts that are currently out of stock or custom-ordered.</p>
        </div>
        <button className="btn-sale-primary" onClick={() => navigate('/customer/new-request')}>
          <PlusCircle size={14} />
          <span>New Order</span>
        </button>
      </div>

      <div className="staff-card">
        <div className="staff-card-header">
          <span className="staff-card-title">My Orders</span>
        </div>
        <table className="staff-table">
          <thead>
            <tr>
              <th>Part Name</th>
              <th>Vehicle</th>
              <th>Quantity</th>
              <th>Urgency</th>
              <th>Status</th>
              <th>Date Requested</th>
            </tr>
          </thead>
          <tbody>
            {requests.map(r => (
              <tr key={r.id}>
                <td>
                  <div style={{ fontWeight: 600, color: '#1E293B' }}>{r.part ? r.part.name : r.customPartName}</div>
                  <div style={{ fontSize: '11px', color: '#94A3B8' }}>Order #{r.id}</div>
                </td>
                <td>{r.vehicle ? `${r.vehicle.make} ${r.vehicle.model}` : 'N/A'}</td>
                <td>{r.quantity}</td>
                <td><span className="badge-pill" style={{ background: r.urgency === 2 ? '#FEE2E2' : r.urgency === 1 ? '#FEF3C7' : '#DBEAFE', color: r.urgency === 2 ? '#B91C1C' : r.urgency === 1 ? '#B45309' : '#1D4ED8' }}>{['Low', 'Medium', 'High'][r.urgency] || r.urgency}</span></td>
                <td><span className={`badge-pill ${getStatusCls(r.status)}`}>{typeof r.status === 'string' ? r.status : ['Pending', 'Approved', 'Rejected', 'Fulfilled'][r.status]}</span></td>
                <td style={{ color: '#64748B' }}>{new Date(r.requestedAt).toLocaleDateString()}</td>
              </tr>
            ))}
            {requests.length === 0 && (
              <tr>
                <td colSpan="6">
                  <div className="empty-state">
                    <div className="empty-state-icon">📦</div>
                    <h4>No special orders</h4>
                    <p>Need a part we don't have in stock? Submit a request!</p>
                  </div>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

/**
 * NEW REQUEST PAGE
 */
export function NewRequestPage({ user }) {
  const navigate = useNavigate();
  const [vehicles, setVehicles] = useState([]);
  const [parts, setParts] = useState([]);
  const [form, setForm] = useState({ vehicleId: '', partId: '', customPartName: '', quantity: 1, urgency: 'Medium', description: '' });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [successDialog, setSuccessDialog] = useState(false);

  useEffect(() => {
    Promise.all([
      apiFetch(`/Customers/${user.id}/vehicles`),
      apiFetch('/parts')
    ]).then(([v, p]) => {
      if (v) setVehicles(v);
      if (p) setParts(p);
    });
  }, [user]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.vehicleId || (!form.partId && !form.customPartName)) return;
    setIsSubmitting(true);
    try {
      const urgencyMap = { Low: 0, Medium: 1, High: 2 };
      await apiFetch('/Service/special-part-requests', {
        method: 'POST',
        body: JSON.stringify({
          customerId: user.id,
          vehicleId: parseInt(form.vehicleId),
          partId: form.partId ? parseInt(form.partId) : null,
          customPartName: form.customPartName || null,
          quantity: parseInt(form.quantity),
          urgency: urgencyMap[form.urgency],
          description: form.description,
          status: 0,
          requestedAt: new Date().toISOString()
        })
      });
      setSuccessDialog(true);
    } catch (err) {
      alert(err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div style={{ maxWidth: '700px', margin: '0 auto' }}>
      <div className="page-section-header" style={{ marginBottom: '24px' }}>
        <h2>Submit Special Order</h2>
        <p>Request parts that are not in our regular inventory.</p>
      </div>

      <div className="staff-card" style={{ padding: '28px' }}>
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          <div>
            <label style={{ fontSize: '13px', fontWeight: 600, display: 'block', marginBottom: '8px' }}>Select Vehicle *</label>
            <select className="search-input-field" style={{ width: '100%', height: '42px' }} value={form.vehicleId} onChange={e => setForm({...form, vehicleId: e.target.value})}>
              <option value="">-- Select vehicle --</option>
              {vehicles.map(v => <option key={v.id} value={v.id}>{v.make} {v.model} ({v.plateNumber})</option>)}
            </select>
          </div>

          <div>
            <label style={{ fontSize: '13px', fontWeight: 600, display: 'block', marginBottom: '8px' }}>Part Name / Selection *</label>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
              <select className="search-input-field" style={{ height: '42px' }} value={form.partId} onChange={e => setForm({...form, partId: e.target.value, customPartName: ''})}>
                <option value="">-- Choose existing --</option>
                {parts.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
              </select>
              <input type="text" className="search-input-field" style={{ height: '42px' }} placeholder="Or enter custom part name" value={form.customPartName} onChange={e => setForm({...form, customPartName: e.target.value, partId: ''})} />
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
            <div>
              <label style={{ fontSize: '13px', fontWeight: 600, display: 'block', marginBottom: '8px' }}>Quantity *</label>
              <input type="number" className="search-input-field" style={{ width: '100%', height: '42px' }} min="1" value={form.quantity} onChange={e => setForm({...form, quantity: e.target.value})} />
            </div>
            <div>
              <label style={{ fontSize: '13px', fontWeight: 600, display: 'block', marginBottom: '8px' }}>Urgency *</label>
              <select className="search-input-field" style={{ width: '100%', height: '42px' }} value={form.urgency} onChange={e => setForm({...form, urgency: e.target.value})}>
                <option value="Low">Low</option>
                <option value="Medium">Medium</option>
                <option value="High">High</option>
              </select>
            </div>
          </div>

          <div>
            <label style={{ fontSize: '13px', fontWeight: 600, display: 'block', marginBottom: '8px' }}>Additional Details</label>
            <textarea className="search-input-field" style={{ width: '100%', minHeight: '80px' }} placeholder="Specify brand, part numbers, or other details..." value={form.description} onChange={e => setForm({...form, description: e.target.value})} />
          </div>

          <div style={{ display: 'flex', gap: '12px', marginTop: '12px' }}>
            <button type="button" className="btn-view-customer" style={{ flex: 1, padding: '12px' }} onClick={() => navigate('/customer/requests')}>Cancel</button>
            <button type="submit" className="btn-sale-primary" style={{ flex: 1, padding: '12px' }} disabled={isSubmitting}>Submit Request</button>
          </div>
        </form>
      </div>

      {successDialog && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(30,58,95,0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999, backdropFilter: 'blur(4px)' }}>
          <div className="staff-card" style={{ padding: '32px', maxWidth: '400px', textAlign: 'center' }}>
            <div style={{ width: '64px', height: '64px', borderRadius: '50%', background: '#DCFCE7', color: '#15803D', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px' }}>
              <CheckCircle2 size={32} />
            </div>
            <h3>Request Submitted</h3>
            <p style={{ color: '#64748B', marginBottom: '24px' }}>We've received your special order request and will process it shortly.</p>
            <button className="btn-sale-primary" style={{ width: '100%' }} onClick={() => navigate('/customer/requests')}>View My Requests</button>
          </div>
        </div>
      )}
    </div>
  );
}

/**
 * HISTORY PAGE
 */
export function HistoryPage({ user }) {
  return (
    <div style={{ maxWidth: '1000px', margin: '0 auto' }}>
      <div className="page-section-header" style={{ marginBottom: '24px' }}>
        <h2>Service History</h2>
        <p>Complete records of all services and purchases made for your vehicles.</p>
      </div>
      <CustomerHistoryComp user={user} isEmbedded={true} />
    </div>
  );
}

/**
 * MAIN EXPORT (LAYOUT WRAPPER FOR AI CHAT)
 */
export function CustomerDashboard({ user }) {
  const [chatMessages, setChatMessages] = useState([
    { sender: 'bot', text: 'Hello! I am your AI assistant. How can I help you with your vehicle today?' }
  ]);
  const [chatInput, setChatInput] = useState('');
  const [showChat, setShowChat] = useState(false);

  const handleChatSubmit = (e) => {
    e.preventDefault();
    if (!chatInput.trim()) return;
    const userMsg = chatInput;
    setChatMessages(prev => [...prev, { sender: 'user', text: userMsg }]);
    setChatInput('');
    setTimeout(() => {
      let botResponse = "I can help you with bookings, parts, vehicles, or your history. What's on your mind?";
      const lowerMsg = userMsg.toLowerCase();
      if (lowerMsg.includes('oil')) botResponse = "You should schedule an oil change every 5,000 miles. Use our 'Book Service' page!";
      else if (lowerMsg.includes('part')) botResponse = "Need something special? Check out our 'Special Orders' section.";
      else if (lowerMsg.includes('vehicle')) botResponse = "You can add and manage multiple vehicles in your 'My Vehicles' section.";
      setChatMessages(prev => [...prev, { sender: 'bot', text: botResponse }]);
    }, 1000);
  };

  return (
    <>
      <CustomerOverview user={user} />

      {/* Floating AI Widget */}
      <div style={{ position: 'fixed', bottom: '2rem', right: '2rem', zIndex: 10000 }}>
        {!showChat ? (
          <button 
            onClick={() => setShowChat(true)} 
            style={{ 
              width: '56px', height: '56px', borderRadius: '50%', 
              background: 'linear-gradient(135deg, #1E3A5F 0%, #2563A8 100%)', 
              color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center',
              boxShadow: '0 8px 24px rgba(30,58,95,0.3)', border: 'none', cursor: 'pointer',
              transition: 'transform 0.2s'
            }}
            onMouseEnter={e => e.currentTarget.style.transform = 'scale(1.05)'}
            onMouseLeave={e => e.currentTarget.style.transform = 'scale(1)'}
          >
            <MessageSquare size={24} />
          </button>
        ) : (
          <div className="staff-card" style={{ width: '350px', height: '480px', display: 'flex', flexDirection: 'column', boxShadow: '0 12px 48px rgba(30,58,95,0.25)', border: 'none' }}>
            <div style={{ background: 'linear-gradient(135deg, #1E3A5F 0%, #2563A8 100%)', color: '#fff', padding: '16px 20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <div style={{ width: 32, height: 32, background: 'rgba(255,255,255,0.15)', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>🤖</div>
                <div style={{ fontWeight: 700, fontSize: '14px' }}>AI Assistant</div>
              </div>
              <button onClick={() => setShowChat(false)} style={{ background: 'transparent', border: 'none', color: '#fff', cursor: 'pointer' }}><X size={18} /></button>
            </div>
            <div style={{ flex: 1, padding: '20px', overflowY: 'auto', background: '#F8FAFC', display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {chatMessages.map((msg, i) => (
                <div key={i} style={{ 
                  alignSelf: msg.sender === 'user' ? 'flex-end' : 'flex-start', 
                  background: msg.sender === 'user' ? '#1E3A5F' : '#fff', 
                  color: msg.sender === 'user' ? '#fff' : '#1E293B', 
                  padding: '10px 14px', borderRadius: '14px', 
                  maxWidth: '85%', fontSize: '13px', lineHeight: '1.5',
                  boxShadow: msg.sender === 'user' ? 'none' : '0 2px 4px rgba(0,0,0,0.04)',
                  border: msg.sender === 'user' ? 'none' : '1px solid #E2E8F0'
                }}>
                  {msg.text}
                </div>
              ))}
            </div>
            <form onSubmit={handleChatSubmit} style={{ padding: '16px', background: '#fff', borderTop: '1px solid #E2E8F0', display: 'flex', gap: '8px' }}>
              <input 
                type="text" 
                value={chatInput} 
                onChange={e => setChatInput(e.target.value)} 
                placeholder="Type a message..." 
                className="search-input-field"
                style={{ flex: 1, height: '38px' }} 
              />
              <button type="submit" className="btn-sale-primary" style={{ width: '38px', height: '38px', padding: 0, justifyContent: 'center' }}>
                <Send size={16} />
              </button>
            </form>
          </div>
        )}
      </div>
    </>
  );
}
