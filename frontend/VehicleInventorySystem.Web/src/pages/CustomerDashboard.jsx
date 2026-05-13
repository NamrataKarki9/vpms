import React, { useState, useEffect } from 'react';
import { apiFetch } from '../services/api.js';
import { useToast } from '../context/ToastContext';
import VehicleForm from '../components/forms/VehicleForm';
import { CustomerHistory } from './CustomerHistory';

export function CustomerDashboard({ user }) {
  const showToast = useToast();
  const [history, setHistory] = useState([]);
  const [subView, setSubView] = useState('main');
  const [appointments, setAppointments] = useState([]);
  const [partRequests, setPartRequests] = useState([]);
  const [vehicles, setVehicles] = useState([]);

  const [chatMessages, setChatMessages] = useState([
    { sender: 'bot', text: 'Hello! I am your AI assistant. How can I help you with your vehicle today?' }
  ]);
  const [chatInput, setChatInput] = useState('');
  const [showChat, setShowChat] = useState(false);
  
  useEffect(() => {
    if (user && user.id) {
      loadData();
    }
  }, [user]);

  const loadData = async () => {
    try {
      const { apiFetch } = await import('../services/api');
      
      // Load history
      const h = await apiFetch(`/Customers/${user.id}/history`);
      if (h) setHistory(h);
      
      // Load vehicles
      const v = await apiFetch(`/Customers/${user.id}/vehicles`);
      if (v) setVehicles(v);
      
      // Load appointments
      const a = await apiFetch(`/Service/appointments?customerId=${user.id}`);
      if (a) setAppointments(a);
      
      // Load special part requests
      const pr = await apiFetch(`/Service/special-part-requests?customerId=${user.id}`);
      if (pr) setPartRequests(pr);
    } catch (error) {
      console.error('Error loading data:', error);
    }
  };

  const handleAddVehicle = async (newVehicle) => {
    try {
      const { apiFetch } = await import('../services/api');
      const savedVehicle = await apiFetch(`/Customers/${user.id}/vehicles`, {
        method: 'POST',
        body: JSON.stringify(newVehicle)
      });
      setVehicles([...vehicles, savedVehicle]);
      return savedVehicle;
    } catch (error) {
      console.error('Error adding vehicle:', error);
      throw error;
    }
  };

  const handleDeleteVehicle = async (vehicleId) => {
    try {
      const { apiFetch } = await import('../services/api');
      await apiFetch(`/Customers/${user.id}/vehicles/${vehicleId}`, { method: 'DELETE' });
      setVehicles(prev => prev.filter(v => v.id !== vehicleId));
    } catch (error) {
      console.error('Error deleting vehicle:', error);
      alert('Failed to delete vehicle');
    }
  };

  const handleDeleteAppointment = async (id) => {
    try {
      await apiFetch(`/Service/appointments/${id}`, { method: 'DELETE' });
      setAppointments(prev => prev.filter(a => a.id !== id));
    } catch (error) {
      console.error('Error deleting appointment:', error);
      showToast('error', 'Failed to delete appointment');
    }
  };

  const handleDeleteRequest = async (id) => {
    try {
      const { apiFetch } = await import('../services/api');
      await apiFetch(`/Service/special-part-requests/${id}`, { method: 'DELETE' });
      setPartRequests(prev => prev.filter(r => r.id !== id));
    } catch (error) {
      console.error('Error deleting request:', error);
      showToast('error', 'Failed to delete request');
    }
  };

  const handleUpdateAppointment = async (updatedAppointment) => {
    try {
      await apiFetch(`/Service/appointments/${updatedAppointment.id}`, {
        method: 'PUT',
        body: JSON.stringify(updatedAppointment)
      });
      setAppointments(prev => prev.map(a => a.id === updatedAppointment.id ? updatedAppointment : a));
    } catch (error) {
      console.error('Error updating appointment:', error);
      showToast('error', 'Failed to update appointment');
    }
  };

  const handleUpdateRequest = async (updatedRequest) => {
    try {
      await apiFetch(`/Service/part-requests/${updatedRequest.id}`, {
        method: 'PUT',
        body: JSON.stringify(updatedRequest)
      });
      setPartRequests(prev => prev.map(r => r.id === updatedRequest.id ? updatedRequest : r));
    } catch (error) {
      console.error('Error updating request:', error);
      showToast('error', 'Failed to update request');
    }
  };

  const handleChatSubmit = (e) => {
    e.preventDefault();
    if (!chatInput.trim()) return;
    const userMsg = chatInput;
    setChatMessages(prev => [...prev, { sender: 'user', text: userMsg }]);
    setChatInput('');
    setTimeout(() => {
      let botResponse = "I'm analyzing your request...";
      const lowerMsg = userMsg.toLowerCase();
      if (lowerMsg.includes('oil')) botResponse = "You should schedule an oil change every 5,000 miles. Use our 'Book Appointment' page!";
      else if (lowerMsg.includes('part')) botResponse = "Need something special? Check out our 'Special Orders' section.";
      else if (lowerMsg.includes('vehicle')) botResponse = "You can add and manage multiple vehicles in your profile. Click 'Manage Vehicles' to add or edit vehicles.";
      else botResponse = "I can help you with bookings, parts, vehicles, or your history. What's on your mind?";
      setChatMessages(prev => [...prev, { sender: 'bot', text: botResponse }]);
    }, 1000);
  };

  if (subView === 'history') return <HistoryPage history={history} onBack={() => setSubView('main')} />;
  if (subView === 'customer-history') return <CustomerHistory user={user} onBack={() => setSubView('main')} />;
  if (subView === 'vehicles') return <VehiclesPage vehicles={vehicles} onAddVehicle={handleAddVehicle} onDeleteVehicle={handleDeleteVehicle} onBack={() => setSubView('main')} />;
  if (subView === 'appointments') return <AppointmentsPage list={appointments} vehicles={vehicles} onDelete={handleDeleteAppointment} onUpdate={handleUpdateAppointment} onBack={() => setSubView('main')} onNew={() => setSubView('book')} />;
  if (subView === 'book') return <BookingPage user={user} vehicles={vehicles} onComplete={(newApp) => { setAppointments([...appointments, newApp]); setSubView('appointments'); }} onBack={() => setSubView('main')} />;
  if (subView === 'requests') return <RequestsPage list={partRequests} onDelete={handleDeleteRequest} onBack={() => setSubView('main')} onNew={() => setSubView('new-request')} />;
  if (subView === 'new-request') return <NewRequestPage user={user} onComplete={(newReq) => { setPartRequests([...partRequests, newReq]); setSubView('requests'); }} onBack={() => setSubView('main')} />;

  return (
    <>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(350px, 1fr))', gap: '2rem', alignItems: 'start' }}>
        <div className="card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <h3>My Vehicles</h3>
            <button className="btn-small" onClick={() => setSubView('vehicles')}>Manage</button>
          </div>
          <p style={{ opacity: 0.6, fontSize: '0.9rem' }}>You have {vehicles.length} vehicles registered.</p>
          <div style={{ marginTop: '1rem' }}>
            {vehicles.slice(0, 2).map(v => (
              <div key={v.id} className="list-item" style={{ fontSize: '0.9rem' }}>
                <span><strong>{v.make?.toLowerCase().includes(v.model?.toLowerCase()) || v.model?.toLowerCase().includes(v.make?.toLowerCase()) ? v.make : `${v.make} ${v.model}`}</strong></span>
                <span style={{ opacity: 0.7 }}>{v.plateNumber}</span>
              </div>
            ))}
            {vehicles.length === 0 && <p style={{opacity:0.5}}>No vehicles yet. Add one to get started!</p>}
          </div>
          <button onClick={() => setSubView('vehicles')} style={{ width: '100%', marginTop: '1rem' }}>+ Add Vehicle</button>
        </div>

        <div className="card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <h3>Service Bookings</h3>
            <button className="btn-small" onClick={() => setSubView('appointments')}>Manage</button>
          </div>
          <p style={{ opacity: 0.6, fontSize: '0.9rem' }}>You have {appointments.filter(a => a.status !== 'Cancelled').length} upcoming appointments.</p>
          <button onClick={() => setSubView('book')} style={{ width: '100%', marginTop: '1rem' }}>Book New Appointment</button>
        </div>

        <div className="card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <h3>Special Part Requests</h3>
            <button className="btn-small" onClick={() => setSubView('requests')}>View All</button>
          </div>
          <p style={{ opacity: 0.6, fontSize: '0.9rem' }}>Track your sourcing requests for custom parts.</p>
          <button onClick={() => setSubView('new-request')} style={{ width: '100%', marginTop: '1rem' }}>Submit Special Order</button>
        </div>

        <div className="card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <h3>Full Purchase & Service History</h3>
            <button className="btn-small" onClick={() => setSubView('customer-history')}>View</button>
          </div>
          <p style={{ opacity: 0.6, fontSize: '0.9rem' }}>View detailed purchase and service records with filtering by vehicle.</p>
          <button onClick={() => setSubView('customer-history')} style={{ width: '100%', marginTop: '1rem' }}>View Complete History</button>
        </div>
      </div>

      {/* Floating AI Widget */}
      <div style={{ position: 'fixed', bottom: '22rem', right: '3rem', zIndex: 10000 }}>
        {!showChat ? (
          <button onClick={() => setShowChat(true)} style={{ width: '60px', height: '60px', borderRadius: '50%', background: 'var(--primary)', color: '#fff', fontSize: '1.8rem', boxShadow: '0 8px 32px rgba(0,0,0,0.2)', border: 'none', cursor: 'pointer' }}>🤖</button>
        ) : (
          <div style={{ width: '350px', height: '450px', background: '#fff', borderRadius: '20px', boxShadow: '0 12px 48px rgba(0,0,0,0.15)', display: 'flex', flexDirection: 'column', border: '1px solid #e2e8f0', overflow: 'hidden' }}>
            <div style={{ background: 'var(--primary)', color: '#fff', padding: '1rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <strong>🤖 AI Assistant</strong>
              <button onClick={() => setShowChat(false)} style={{ background: 'transparent', border: 'none', color: '#fff', fontSize: '1.2rem', cursor: 'pointer' }}>×</button>
            </div>
            <div style={{ flex: 1, padding: '1rem', overflowY: 'auto', background: '#f8fafc', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              {chatMessages.map((msg, i) => (
                <div key={i} style={{ alignSelf: msg.sender === 'user' ? 'flex-end' : 'flex-start', background: msg.sender === 'user' ? 'var(--primary)' : '#fff', color: msg.sender === 'user' ? '#fff' : '#0f172a', padding: '0.6rem 0.9rem', borderRadius: '15px', maxWidth: '80%', fontSize: '0.85rem' }}>{msg.text}</div>
              ))}
            </div>
            <form onSubmit={handleChatSubmit} style={{ padding: '1rem', background: '#fff', borderTop: '1px solid #e2e8f0', display: 'flex', gap: '0.5rem' }}>
              <input type="text" value={chatInput} onChange={e => setChatInput(e.target.value)} placeholder="Ask something..." style={{ margin: 0, flex: 1 }} />
              <button type="submit">✈️</button>
            </form>
          </div>
        )}
      </div>
    </>
  );
}

function HistoryPage({ history, onBack }) {
  return (
    <div className="card" style={{ maxWidth: '800px', margin: 'auto' }}>
      <button onClick={onBack} className="btn-small" style={{ marginBottom: '1rem', background: '#cbd5e1' }}>← Back</button>
      <h2>Full Purchase History</h2>
      <div className="data-list" style={{ marginTop: '2rem' }}>
        {history.map(s => (
          <div key={s.id} className="list-item">
            <div>
              <strong>{s.items?.[0]?.part?.name || 'Service'}</strong>
              <div style={{ fontSize: '0.8rem', opacity: 0.6 }}>Date: {new Date(s.date).toLocaleDateString()}</div>
            </div>
            <span style={{ fontWeight: 700 }}>Rs. {s.totalAmount?.toFixed(2)}</span>
          </div>
        ))}
        {history.length === 0 && <p style={{ textAlign: 'center', padding: '3rem', opacity: 0.5 }}>No purchase history.</p>}
      </div>
    </div>
  );
}

function VehiclesPage({ vehicles, onAddVehicle, onDeleteVehicle, onBack }) {
  const [isAdding, setIsAdding] = useState(false);
  const [form, setForm] = useState({ plateNumber: '', model: '', make: '', year: new Date().getFullYear(), fuelType: '', mileage: 0 });
  const [error, setError] = useState('');
  const [successDialog, setSuccessDialog] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!form.plateNumber.trim() || !form.model.trim() || !form.make.trim()) {
      setError('Please fill in all required fields');
      return;
    }

    if (form.year < 1900 || form.year > new Date().getFullYear() + 1) {
      setError('Please enter a valid year');
      return;
    }

    if (!form.fuelType) {
      setError('Please select a fuel type');
      return;
    }

    if (Number.isNaN(Number(form.mileage)) || Number(form.mileage) < 0) {
      setError('Mileage must be 0 or greater');
      return;
    }

    if (!form.fuelType) {
      setError('Please select a fuel type');
      return;
    }

    if (Number.isNaN(Number(form.mileage)) || Number(form.mileage) < 0) {
      setError('Mileage must be 0 or greater');
      return;
    }

    try {
      await onAddVehicle({
        plateNumber: form.plateNumber.trim(),
        model: form.model.trim(),
        make: form.make.trim(),
        year: form.year,
        fuelType: form.fuelType || null,
        mileage: Number(form.mileage)
        mileage: Number(form.mileage)
      });
      setForm({ plateNumber: '', model: '', make: '', year: new Date().getFullYear(), fuelType: '', mileage: 0 });
      setIsAdding(false);
      setSuccessDialog(true);
    } catch (err) {
      setError(err.message || 'Failed to add vehicle');
    }
  };

  return (
    <div className="card" style={{ maxWidth: '800px', margin: 'auto' }}>
      <button onClick={onBack} className="btn-small" style={{ marginBottom: '1rem', background: '#cbd5e1' }}>← Back</button>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
        <h2>My Vehicles</h2>
        <button onClick={() => setIsAdding(!isAdding)}>+ Add New Vehicle</button>
      </div>

      {isAdding && (
        <div className="card" style={{ background: '#f8fafc', marginBottom: '2rem', padding: '1.5rem' }}>
          <h3>Add New Vehicle</h3>
          <form style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <VehicleForm
              value={form}
              onChange={setForm}
              errors={{}}
              showMileageHint={false}
            />
            <VehicleForm
              value={form}
              onChange={setForm}
              errors={{}}
              showMileageHint={false}
            />

            {error && <p style={{ color: '#ef4444', fontSize: '0.9rem' }}>{error}</p>}

            <div style={{ display: 'flex', gap: '1rem' }}>
              <button type="button" onClick={() => setIsAdding(false)} style={{ flex: 1, background: '#cbd5e1' }}>Cancel</button>
              <button type="submit" onClick={handleSubmit} style={{ flex: 1, background: 'var(--primary)', color: '#fff' }}>Add Vehicle</button>
            </div>
          </form>
        </div>
      )}

      <div className="data-list">
        {vehicles.map(v => (
          <div key={v.id} className="list-item" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', gap: '1rem' }}>
            <div style={{ flex: 1 }}>
              <strong>{v.make?.toLowerCase().includes(v.model?.toLowerCase()) || v.model?.toLowerCase().includes(v.make?.toLowerCase()) ? v.make : `${v.make} ${v.model}`}</strong>
              <div style={{ fontSize: '0.85rem', opacity: 0.7, marginTop: '0.25rem' }}>
                <div>Plate: {v.plateNumber}</div>
                <div>Year: {v.year}</div>
                {v.fuelType && <div>Fuel: {v.fuelType}</div>}
                <div>Mileage: {v.mileage} km</div>
              </div>
            </div>
            <button onClick={() => onDeleteVehicle(v.id)} className="btn-small" style={{ background: 'var(--error)', color: '#fff' }}>Delete</button>
          </div>
        ))}
        {vehicles.length === 0 && <p style={{ textAlign: 'center', padding: '2rem', opacity: 0.5 }}>No vehicles yet. Add your first vehicle!</p>}
      </div>

      {successDialog && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999 }}>
          <div style={{ background: '#fff', padding: '2rem', borderRadius: '12px', maxWidth: '400px', boxShadow: '0 10px 40px rgba(0,0,0,0.2)', textAlign: 'center' }}>
            <p style={{ color: '#10b981', fontSize: '2rem', marginBottom: '0.5rem' }}>✓</p>
            <p style={{ fontSize: '1rem', fontWeight: 500 }}>Vehicle added successfully!</p>
            <button onClick={() => setSuccessDialog(false)} style={{ marginTop: '1.5rem', background: '#10b981', color: '#fff', padding: '0.6rem 1.2rem', borderRadius: '6px', border: 'none', cursor: 'pointer' }}>OK</button>
          </div>
        </div>
      )}
    </div>
  );
}

function AppointmentsPage({ list, vehicles, onDelete, onUpdate, onBack, onNew }) {
  const showToast = useToast();
  const [cancelDialog, setCancelDialog] = useState({ isOpen: false, id: null, type: '', name: '' });
  const [rescheduleDialog, setRescheduleDialog] = useState({ isOpen: false, id: null, newDate: '' });
  const [rescheduleError, setRescheduleError] = useState('');
  const [successDialog, setSuccessDialog] = useState({ isOpen: false, message: '' });

  const validateCancel = (appointment) => {
    const appointmentDate = new Date(appointment.appointmentDate);
    const now = new Date();
    
    if (appointmentDate < now) {
      return 'Past appointments cannot be cancelled.';
    }
    
    if (appointment.status === 'Cancelled') {
      return 'This appointment is already cancelled.';
    }
    
    return '';
  };

  const handleCancelClick = (id) => {
    const appointment = list.find(a => a.id === id);
    const error = validateCancel(appointment);
    
    if (error) {
      showToast('error', error);
      return;
    }
    
    setCancelDialog({ isOpen: true, id, type: 'appointment', name: appointment.serviceType });
  };

  const handleConfirmCancel = () => {
    onDelete(cancelDialog.id);
    setSuccessDialog({ isOpen: true, message: 'Appointment cancelled successfully.' });
    setCancelDialog({ isOpen: false, id: null, name: '' });
  };

  const getVehicleInfo = (vehicleId) => {
    return vehicles.find(v => v.id === vehicleId);
  };

  const validateReschedule = (appointment, newDate) => {
    const appointmentDate = new Date(appointment.appointmentDate);
    const now = new Date();
    const hoursUntilAppointment = (appointmentDate - now) / (1000 * 60 * 60);

    if (appointmentDate < now) {
      return 'Past or completed appointments cannot be rescheduled.';
    }

    if (appointment.status === 'Cancelled') {
      return 'Cancelled appointments cannot be rescheduled.';
    }

    if (hoursUntilAppointment < 24) {
      return 'Appointments can only be rescheduled at least 24 hours before the scheduled service time.';
    }

    if (!newDate || newDate.trim() === '') {
      return 'Please select a new date and time.';
    }

    if (newDate) {
      const selectedDate = new Date(newDate);
      if (selectedDate <= now) {
        return 'Please select a valid future date and time.';
      }
    }

    if ((appointment.rescheduleCount || 0) >= 2) {
      return 'You have reached the maximum number of allowed reschedules for this appointment.';
    }

    return '';
  };

  const handleRescheduleClick = (appointment) => {
    const error = validateReschedule(appointment, new Date().toISOString().split('T')[0]);
    if (error && error.includes('maximum')) {
      showToast('error', error);
      return;
    }
    setRescheduleDialog({ isOpen: true, id: appointment.id, newDate: '' });
    setRescheduleError('');
  };

  const handleConfirmReschedule = () => {
    const appointment = list.find(a => a.id === rescheduleDialog.id);
    const error = validateReschedule(appointment, rescheduleDialog.newDate);
    
    if (error) {
      setRescheduleError(error);
      return;
    }

    // Parse the datetime-local value (format: "2026-05-16T02:20")
    const [dateStr, timeStr] = rescheduleDialog.newDate.split('T');
    
    const updatedAppointment = {
      ...appointment,
      appointmentDate: dateStr + 'T00:00:00Z',
      appointmentTime: timeStr + ':00',
      rescheduleCount: (appointment.rescheduleCount || 0) + 1
    };
    
    onUpdate(updatedAppointment);
    setSuccessDialog({ isOpen: true, message: 'Appointment rescheduled successfully!' });
    setRescheduleDialog({ isOpen: false, id: null, newDate: '' });
    setRescheduleError('');
  };

  const getTodayDate = () => {
    return new Date().toISOString().split('T')[0];
  };

  return (
    <div className="card" style={{ maxWidth: '800px', margin: 'auto' }}>
      <button onClick={onBack} className="btn-small" style={{ marginBottom: '1rem', background: '#cbd5e1' }}>← Back</button>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
        <h2>My Service Bookings</h2>
        <button onClick={onNew}>+ Book New</button>
      </div>
      <div className="data-list">
        {list.filter(a => a.status !== 'Cancelled').map(a => {
          const vehicle = getVehicleInfo(a.vehicleId);
          const appointmentDate = new Date(a.appointmentDate);
          const now = new Date();
          const hoursUntilAppointment = (appointmentDate - now) / (1000 * 60 * 60);
          const canReschedule = hoursUntilAppointment >= 24 && (a.rescheduleCount || 0) < 2;

          return (
            <div key={a.id} className="list-item" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', gap: '1rem' }}>
              <div style={{ flex: 1 }}>
                <strong>{a.serviceType}</strong>
                {vehicle && (
                  <div style={{ fontSize: '0.85rem', opacity: 0.7, marginTop: '0.25rem' }}>
                    <div>Vehicle: {vehicle.make} {vehicle.model} ({vehicle.plateNumber})</div>
                  </div>
                )}
                <div style={{ fontSize: '0.8rem', opacity: 0.6, marginTop: '0.25rem' }}>
                  Scheduled: {new Date(a.appointmentDate).toLocaleDateString()} at {a.appointmentTime || 'TBD'}
                </div>
              </div>
              <div style={{ display: 'flex', gap: '0.5rem' }}>
                {canReschedule && (
                  <button onClick={() => handleRescheduleClick(a)} className="btn-small" style={{ background: '#3b82f6', color: '#fff' }}>Reschedule</button>
                )}
                <button onClick={() => handleCancelClick(a.id)} className="btn-small" style={{ background: 'var(--error)', color: '#fff' }}>Cancel</button>
              </div>
            </div>
          );
        })}
        {list.filter(a => a.status !== 'Cancelled').length === 0 && <p style={{textAlign: 'center', padding: '3rem', opacity: 0.5}}>No upcoming appointments. Book one now!</p>}
      </div>

      {cancelDialog.isOpen && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999 }}>
          <div style={{ background: '#fff', padding: '2rem', borderRadius: '12px', maxWidth: '400px', boxShadow: '0 10px 40px rgba(0,0,0,0.2)' }}>
            <h3>Cancel Appointment</h3>
            <p>Are you sure you want to cancel <strong>{cancelDialog.name}</strong>?</p>
            <p style={{ fontSize: '0.9rem', opacity: 0.7 }}>This action cannot be undone.</p>
            <div style={{ display: 'flex', gap: '1rem', marginTop: '2rem' }}>
              <button onClick={() => setCancelDialog({ isOpen: false, id: null, name: '' })} style={{ flex: 1, background: '#cbd5e1', color: '#0f172a' }}>No, Keep It</button>
              <button onClick={handleConfirmCancel} style={{ flex: 1, background: 'var(--error)', color: '#fff' }}>Yes, Cancel</button>
            </div>
          </div>
        </div>
      )}

      {rescheduleDialog.isOpen && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999 }}>
          <div style={{ background: '#fff', padding: '2rem', borderRadius: '12px', maxWidth: '400px', boxShadow: '0 10px 40px rgba(0,0,0,0.2)' }}>
            <h3>Reschedule Appointment</h3>
            <p style={{ fontSize: '0.9rem', opacity: 0.7, marginBottom: '1.5rem' }}>Select a new date and time for your appointment.</p>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', marginBottom: '1.5rem' }}>
              <div>
                <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 500 }}>New Date & Time *</label>
                <input 
                  type="datetime-local" 
                  value={rescheduleDialog.newDate}
                  onChange={e => {
                    setRescheduleDialog({ ...rescheduleDialog, newDate: e.target.value });
                    setRescheduleError('');
                  }}
                  min={new Date().toISOString().slice(0, 16)}
                  style={{ width: '100%', padding: '0.5rem', border: '1px solid #cbd5e1', borderRadius: '6px' }}
                />
              </div>
            </div>

            {rescheduleError && (
              <p style={{ fontSize: '0.85rem', color: '#ef4444', marginBottom: '1rem', background: '#fee2e2', padding: '0.75rem', borderRadius: '6px' }}>
                {rescheduleError}
              </p>
            )}

            <div style={{ display: 'flex', gap: '1rem' }}>
              <button onClick={() => setRescheduleDialog({ isOpen: false, id: null, newDate: '' })} style={{ flex: 1, background: '#cbd5e1', color: '#0f172a' }}>Cancel</button>
              <button onClick={handleConfirmReschedule} style={{ flex: 1, background: '#3b82f6', color: '#fff' }}>Reschedule</button>
            </div>
          </div>
        </div>
      )}

      {successDialog.isOpen && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999 }}>
          <div style={{ background: '#fff', padding: '2rem', borderRadius: '12px', maxWidth: '400px', boxShadow: '0 10px 40px rgba(0,0,0,0.2)', textAlign: 'center' }}>
            <p style={{ color: '#10b981', fontSize: '2rem', marginBottom: '0.5rem' }}>✓</p>
            <p style={{ fontSize: '1rem', fontWeight: 500 }}>{successDialog.message}</p>
            <button onClick={() => setSuccessDialog({ isOpen: false, message: '' })} style={{ marginTop: '1.5rem', background: '#10b981', color: '#fff', padding: '0.6rem 1.2rem', borderRadius: '6px', border: 'none', cursor: 'pointer' }}>OK</button>
          </div>
        </div>
      )}
    </div>
  );
}

function BookingPage({ user, vehicles, onComplete, onBack }) {
  const [form, setForm] = useState({ vehicleId: '', serviceType: '', appointmentDate: '', appointmentTime: '09:00', description: '' });
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [successDialog, setSuccessDialog] = useState(false);

  const serviceTypes = ['Oil Change', 'Filter Replacement', 'Tire Rotation', 'Brake Service', 'Full Service', 'Diagnosis', 'Other'];
  const timeSlots = [
    { value: '09:00', label: '09:00 AM' },
    { value: '10:00', label: '10:00 AM' },
    { value: '11:00', label: '11:00 AM' },
    { value: '12:00', label: '12:00 PM' },
    { value: '14:00', label: '02:00 PM' },
    { value: '15:00', label: '03:00 PM' },
    { value: '16:00', label: '04:00 PM' }
  ];

  const getTodayDate = () => {
    return new Date().toISOString().split('T')[0];
  };

  const getSelectedVehicle = () => {
    return vehicles.find(v => v.id === parseInt(form.vehicleId));
  };

  const validateBooking = () => {
    if (!form.vehicleId) {
      setError('Please select a vehicle');
      return false;
    }

    if (!form.appointmentDate) {
      setError('Please select a date');
      return false;
    }

    if (!form.serviceType.trim()) {
      setError('Please select or enter a service type');
      return false;
    }

    const selectedDate = new Date(form.appointmentDate);
    const now = new Date();

    if (selectedDate <= now) {
      setError('Appointment date must be in the future');
      return false;
    }

    return true;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccessMessage('');

    if (!validateBooking()) return;

    // Validate time slot is selected
    if (!form.appointmentTime) {
      setError('Please select a time slot');
      return;
    }

    setIsSubmitting(true);
    try {
      const { apiFetch } = await import('../services/api');
      
      const appointmentData = {
        customerId: user.id,
        vehicleId: parseInt(form.vehicleId),
        appointmentDate: new Date(form.appointmentDate).toISOString(),
        appointmentTime: form.appointmentTime + ':00',
        serviceType: form.serviceType.trim(),
        description: form.description.trim()
      };

      const result = await apiFetch('/Service/appointments', {
        method: 'POST',
        body: JSON.stringify(appointmentData)
      });

      if (result) {
        setSuccessMessage('Appointment booked successfully.');
        setSuccessDialog(true);
        setTimeout(() => {
          onComplete({...result.appointment, status: 'Confirmed'});
        }, 2000);
      }
    } catch (err) {
      const errorMsg = err.message || 'Failed to book appointment';
      if (errorMsg.includes('unavailable') || errorMsg.includes('time slot')) {
        setError('This time slot is unavailable. Please choose another time.');
      } else {
        setError(errorMsg);
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const selectedVehicle = getSelectedVehicle();

  return (
    <div className="card" style={{ maxWidth: '600px', margin: 'auto' }}>
      <button onClick={onBack} className="btn-small" style={{ marginBottom: '1rem', background: '#cbd5e1' }}>← Back</button>
      <h2>Book Service Appointment</h2>
      
      <form style={{ marginTop: '2rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
        <div>
          <label>Select Vehicle *</label>
          <select 
            value={form.vehicleId} 
            onChange={e => {
              setForm({...form, vehicleId: e.target.value});
              setError('');
            }}
            style={{ borderColor: error && error.includes('vehicle') ? '#ef4444' : '' }}
          >
            <option value="">-- Select a Vehicle --</option>
            {vehicles.map(vehicle => (
              <option key={vehicle.id} value={vehicle.id}>
                {vehicle.make} {vehicle.model} ({vehicle.plateNumber})
              </option>
            ))}
          </select>
          {error && error.includes('vehicle') && <span style={{ fontSize: '0.75rem', color: '#ef4444' }}>{error}</span>}
        </div>

        {selectedVehicle && (
          <div style={{ background: '#f8fafc', padding: '1rem', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
            <h4>Vehicle Details</h4>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', fontSize: '0.9rem' }}>
              <div>
                <strong>Make:</strong> {selectedVehicle.make}
              </div>
              <div>
                <strong>Model:</strong> {selectedVehicle.model}
              </div>
              <div>
                <strong>Plate:</strong> {selectedVehicle.plateNumber}
              </div>
              <div>
                <strong>Year:</strong> {selectedVehicle.year}
              </div>
              {selectedVehicle.fuelType && (
                <div>
                  <strong>Fuel:</strong> {selectedVehicle.fuelType}
                </div>
              )}
              <div>
                <strong>Mileage:</strong> {selectedVehicle.mileage} km
              </div>
            </div>
          </div>
        )}

        <div>
          <label>Appointment Date *</label>
          <input 
            type="date" 
            value={form.appointmentDate} 
            onChange={e => {
              setForm({...form, appointmentDate: e.target.value});
              setError('');
            }}
            min={getTodayDate()}
            style={{ borderColor: error && error.includes('date') ? '#ef4444' : '' }}
          />
          {error && error.includes('date') && <span style={{ fontSize: '0.75rem', color: '#ef4444' }}>{error}</span>}
        </div>

        <div>
          <label>Preferred Time Slot *</label>
          <select 
            value={form.appointmentTime} 
            onChange={e => {
              setForm({...form, appointmentTime: e.target.value});
              setError('');
            }}
            style={{ borderColor: error && error.includes('time') ? '#ef4444' : '' }}
          >
            <option value="">-- Select Time Slot --</option>
            {timeSlots.map(slot => (
              <option key={slot.value} value={slot.value}>{slot.label}</option>
            ))}
          </select>
          {error && error.includes('time') && <span style={{ fontSize: '0.75rem', color: '#ef4444' }}>{error}</span>}
        </div>

        <div>
          <label>Service Type *</label>
          <select 
            value={form.serviceType} 
            onChange={e => {
              setForm({...form, serviceType: e.target.value});
              setError('');
            }}
            style={{ borderColor: error && error.includes('service') ? '#ef4444' : '' }}
          >
            <option value="">-- Select Service Type --</option>
            {serviceTypes.map(st => <option key={st} value={st}>{st}</option>)}
          </select>
          {error && error.includes('service') && <span style={{ fontSize: '0.75rem', color: '#ef4444' }}>{error}</span>}
        </div>

        <div style={{ width: '100%' }}>
          <label>Problem Description (Optional)</label>
          <textarea 
            placeholder="Describe any issues or special requests..." 
            value={form.description} 
            onChange={e => setForm({...form, description: e.target.value})}
            maxLength={500}
            style={{ 
              width: '100%',
              minHeight: '140px',
              fontSize: '1rem',
              padding: '12px 14px',
              border: '2px solid #6366f1',
              borderRadius: '8px',
              backgroundColor: '#ffffff',
              fontFamily: 'inherit',
              resize: 'vertical',
              transition: 'border-color 0.2s ease, box-shadow 0.2s ease',
              color: '#334155',
              lineHeight: '1.5',
              boxSizing: 'border-box'
            }}
            onFocus={(e) => {
              e.target.style.borderColor = '#6366f1';
              e.target.style.outline = 'none';
              e.target.style.boxShadow = '0 0 0 3px rgba(99, 102, 241, 0.1)';
            }}
            onBlur={(e) => {
              e.target.style.borderColor = '#cbd5e1';
              e.target.style.boxShadow = 'none';
            }}
          />
        </div>

        {error && !error.includes('date') && !error.includes('service') && !error.includes('vehicle') && !error.includes('time') && <p style={{ color: '#ef4444', fontSize: '0.9rem' }}>{error}</p>}
        {error && (error.includes('unavailable') || error.includes('time slot')) && <p style={{ color: '#ef4444', fontSize: '0.9rem', background: '#fee2e2', padding: '0.75rem', borderRadius: '6px', borderLeft: '4px solid #ef4444' }}>{error}</p>}

        <button type="submit" onClick={handleSubmit} disabled={isSubmitting} style={{ marginTop: '1rem', opacity: isSubmitting ? 0.6 : 1, cursor: isSubmitting ? 'not-allowed' : 'pointer' }}>
          {isSubmitting ? 'Booking...' : 'Confirm Booking'}
        </button>
      </form>

      {successDialog && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999 }}>
          <div style={{ background: '#fff', padding: '2rem', borderRadius: '12px', maxWidth: '400px', boxShadow: '0 10px 40px rgba(0,0,0,0.2)', textAlign: 'center' }}>
            <p style={{ color: '#10b981', fontSize: '2rem', marginBottom: '0.5rem' }}>✓</p>
            <p style={{ fontSize: '1rem', fontWeight: 500, color: '#10b981' }}>{successMessage}</p>
            <p style={{ fontSize: '0.9rem', opacity: 0.7, marginTop: '0.5rem' }}>Status: <strong>Confirmed</strong></p>
            <button onClick={() => setSuccessDialog(false)} style={{ marginTop: '1.5rem', background: '#10b981', color: '#fff', padding: '0.6rem 1.2rem', borderRadius: '6px', border: 'none', cursor: 'pointer' }}>OK</button>
          </div>
        </div>
      )}
    </div>
  );
}

function RequestsPage({ list, onDelete, onUpdate, onBack, onNew }) {
  const showToast = useToast();
  const [cancelDialog, setCancelDialog] = useState({ isOpen: false, id: null, name: '' });
  const [successDialog, setSuccessDialog] = useState({ isOpen: false, message: '' });

  const handleCancelClick = (id, partName) => {
    setCancelDialog({ isOpen: true, id, name: partName });
  };

  const handleConfirmCancel = async () => {
    try {
      const { apiFetch } = await import('../services/api');
      await apiFetch(`/Service/special-part-requests/${cancelDialog.id}`, { method: 'DELETE' });
      onDelete(cancelDialog.id);
      setSuccessDialog({ isOpen: true, message: 'Request cancelled.' });
      setCancelDialog({ isOpen: false, id: null, name: '' });
    } catch (error) {
      showToast('error', 'Failed to cancel request: ' + error.message);
    }
  };

  const getPartName = (request) => {
    return request.part ? request.part.name : request.customPartName;
  };

  const getVehicleDisplay = (vehicle) => {
    return vehicle ? `${vehicle.make} ${vehicle.model}` : 'N/A';
  };

  // Convert enum integers to strings
  const urgencyLabels = ['Low', 'Medium', 'High'];
  const statusLabels = ['Pending', 'Approved', 'Rejected', 'Fulfilled'];

  const getUrgencyLabel = (urgency) => {
    return typeof urgency === 'string' ? urgency : urgencyLabels[urgency] || 'Unknown';
  };

  const getStatusLabel = (status) => {
    return typeof status === 'string' ? status : statusLabels[status] || 'Unknown';
  };

  const getUrgencyColor = (urgency) => {
    const label = getUrgencyLabel(urgency);
    return label === 'High' ? '#fee2e2' : label === 'Medium' ? '#fef3c7' : '#dbeafe';
  };

  const getUrgencyTextColor = (urgency) => {
    const label = getUrgencyLabel(urgency);
    return label === 'High' ? '#991b1b' : label === 'Medium' ? '#92400e' : '#1e40af';
  };

  const getStatusColor = (status) => {
    const label = getStatusLabel(status);
    return label === 'Pending' ? '#fef3c7' : label === 'Approved' ? '#dbeafe' : label === 'Fulfilled' ? '#dcfce7' : '#fee2e2';
  };

  return (
    <div className="card" style={{ maxWidth: '1000px', margin: 'auto' }}>
      <button onClick={onBack} className="btn-small" style={{ marginBottom: '1rem', background: '#cbd5e1' }}>← Back</button>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
        <h2>Special Part Requests</h2>
        <button onClick={onNew}>+ New Request</button>
      </div>
      
      {list.length === 0 ? (
        <p style={{ textAlign: 'center', padding: '3rem', opacity: 0.5 }}>No requests yet. Create one to get started!</p>
      ) : (
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.9rem' }}>
            <thead>
              <tr style={{ borderBottom: '2px solid #e2e8f0', background: '#f8fafc' }}>
                <th style={{ padding: '0.75rem', textAlign: 'left', fontWeight: 600 }}>Vehicle</th>
                <th style={{ padding: '0.75rem', textAlign: 'left', fontWeight: 600 }}>Part Name</th>
                <th style={{ padding: '0.75rem', textAlign: 'left', fontWeight: 600 }}>Qty</th>
                <th style={{ padding: '0.75rem', textAlign: 'left', fontWeight: 600 }}>Urgency</th>
                <th style={{ padding: '0.75rem', textAlign: 'left', fontWeight: 600 }}>Status</th>
                <th style={{ padding: '0.75rem', textAlign: 'left', fontWeight: 600 }}>Date</th>
                <th style={{ padding: '0.75rem', textAlign: 'center', fontWeight: 600 }}>Action</th>
              </tr>
            </thead>
            <tbody>
              {list.map(req => (
                <tr key={req.id} style={{ borderBottom: '1px solid #e2e8f0' }}>
                  <td style={{ padding: '0.75rem' }}>
                    {getVehicleDisplay(req.vehicle)}
                  </td>
                  <td style={{ padding: '0.75rem' }}>
                    {getPartName(req)}
                  </td>
                  <td style={{ padding: '0.75rem' }}>{req.quantity}</td>
                  <td style={{ padding: '0.75rem' }}>
                    <span style={{ display: 'inline-block', padding: '0.25rem 0.75rem', borderRadius: '4px', background: getUrgencyColor(req.urgency), color: getUrgencyTextColor(req.urgency), fontSize: '0.8rem', fontWeight: 500 }}>
                      {getUrgencyLabel(req.urgency)}
                    </span>
                  </td>
                  <td style={{ padding: '0.75rem' }}>
                    <span style={{ display: 'inline-block', padding: '0.25rem 0.75rem', borderRadius: '4px', background: getStatusColor(req.status), fontSize: '0.8rem', fontWeight: 500 }}>
                      {getStatusLabel(req.status)}
                    </span>
                  </td>
                  <td style={{ padding: '0.75rem', opacity: 0.7, fontSize: '0.85rem' }}>
                    {new Date(req.requestedAt).toLocaleDateString()}
                  </td>
                  <td style={{ padding: '0.75rem', textAlign: 'center' }}>
                    <button onClick={() => handleCancelClick(req.id, getPartName(req))} className="btn-small" style={{ background: 'var(--error)', color: '#fff', padding: '0.4rem 0.8rem', fontSize: '0.8rem' }}>Delete</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {cancelDialog.isOpen && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999 }}>
          <div style={{ background: '#fff', padding: '2rem', borderRadius: '12px', maxWidth: '400px', boxShadow: '0 10px 40px rgba(0,0,0,0.2)' }}>
            <h3>Delete Request</h3>
            <p>Are you sure you want to delete the request for <strong>{cancelDialog.name}</strong>?</p>
            <p style={{ fontSize: '0.9rem', opacity: 0.7, marginTop: '0.5rem' }}>This action cannot be undone.</p>
            <div style={{ display: 'flex', gap: '1rem', marginTop: '2rem' }}>
              <button onClick={() => setCancelDialog({ isOpen: false, id: null, name: '' })} style={{ flex: 1, background: '#cbd5e1', color: '#0f172a' }}>Keep It</button>
              <button onClick={handleConfirmCancel} style={{ flex: 1, background: 'var(--error)', color: '#fff' }}>Delete</button>
            </div>
          </div>
        </div>
      )}

      {successDialog.isOpen && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999 }}>
          <div style={{ background: '#fff', padding: '2rem', borderRadius: '12px', maxWidth: '400px', boxShadow: '0 10px 40px rgba(0,0,0,0.2)', textAlign: 'center' }}>
            <p style={{ color: '#10b981', fontSize: '2rem', marginBottom: '0.5rem' }}>✓</p>
            <p style={{ fontSize: '1rem', fontWeight: 500 }}>{successDialog.message}</p>
            <button onClick={() => setSuccessDialog({ isOpen: false, message: '' })} style={{ marginTop: '1.5rem', background: '#10b981', color: '#fff', padding: '0.6rem 1.2rem', borderRadius: '6px', border: 'none', cursor: 'pointer' }}>OK</button>
          </div>
        </div>
      )}
    </div>
  );
}

function NewRequestPage({ user, onComplete, onBack }) {
  const showToast = useToast();
  const [vehicles, setVehicles] = useState([]);
  const [parts, setParts] = useState([]);
  const [form, setForm] = useState({ vehicleId: '', partId: '', customPartName: '', quantity: 1, urgency: 'Medium', description: '' });
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [successDialog, setSuccessDialog] = useState(false);
  const [selectedPart, setSelectedPart] = useState(null);
  const [requests, setRequests] = useState([]);

  // Convert enum integers to strings
  const urgencyLabels = ['Low', 'Medium', 'High'];
  const statusLabels = ['Pending', 'Approved', 'Rejected', 'Fulfilled'];

  const getUrgencyLabel = (urgency) => {
    return typeof urgency === 'string' ? urgency : urgencyLabels[urgency] || 'Unknown';
  };

  const getStatusLabel = (status) => {
    return typeof status === 'string' ? status : statusLabels[status] || 'Unknown';
  };

  const getUrgencyColor = (urgency) => {
    const label = getUrgencyLabel(urgency);
    return label === 'High' ? '#fee2e2' : label === 'Medium' ? '#fef3c7' : '#dbeafe';
  };

  const getUrgencyTextColor = (urgency) => {
    const label = getUrgencyLabel(urgency);
    return label === 'High' ? '#991b1b' : label === 'Medium' ? '#92400e' : '#1e40af';
  };

  const getStatusColor = (status) => {
    const label = getStatusLabel(status);
    return label === 'Pending' ? '#fef3c7' : label === 'Approved' ? '#dbeafe' : label === 'Fulfilled' ? '#dcfce7' : '#fee2e2';
  };

  useEffect(() => {
    loadVehiclesAndParts();
    loadRequests();
  }, [user]);

  const loadVehiclesAndParts = async () => {
    try {
      const { apiFetch } = await import('../services/api');
      const vehicleList = await apiFetch(`/Customers/${user.id}/vehicles`);
      const partsList = await apiFetch('/parts');
      setVehicles(vehicleList || []);
      setParts(partsList || []);
    } catch (error) {
      console.error('Error loading vehicles or parts:', error);
      showToast('error', 'Failed to load vehicles or parts');
    }
  };

  const loadRequests = async () => {
    try {
      const { apiFetch } = await import('../services/api');
      const requestsList = await apiFetch(`/Service/special-part-requests?customerId=${user.id}`);
      setRequests(requestsList || []);
    } catch (error) {
      console.error('Error loading requests:', error);
    }
  };

  const handlePartChange = (e) => {
    const partId = parseInt(e.target.value) || '';
    setForm({...form, partId, customPartName: ''});
    if (partId) {
      const part = parts.find(p => p.id === partId);
      setSelectedPart(part);
    } else {
      setSelectedPart(null);
    }
    setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    // Validation
    if (!form.vehicleId) {
      setError('Please select a vehicle');
      return;
    }

    if (!form.partId && !form.customPartName.trim()) {
      setError('Please select a part or enter a custom part name');
      return;
    }

    if (form.quantity <= 0) {
      setError('Quantity must be greater than 0');
      return;
    }

    if (!form.urgency) {
      setError('Please select urgency level');
      return;
    }

    setIsSubmitting(true);
    try {
      const { apiFetch } = await import('../services/api');
      
      // Convert urgency string to enum integer (Low=0, Medium=1, High=2)
      const urgencyMap = { Low: 0, Medium: 1, High: 2 };
      // Convert status string to enum integer (Pending=0, Approved=1, Rejected=2, Fulfilled=3)
      const statusMap = { Pending: 0, Approved: 1, Rejected: 2, Fulfilled: 3 };
      
      const requestData = {
        customerId: user.id,
        vehicleId: parseInt(form.vehicleId),
        partId: form.partId ? parseInt(form.partId) : null,
        customPartName: form.customPartName.trim() || null,
        quantity: parseInt(form.quantity),
        urgency: urgencyMap[form.urgency],
        description: form.description.trim(),
        status: statusMap['Pending'],
        requestedAt: new Date().toISOString()
      };

      const result = await apiFetch('/Service/special-part-requests', {
        method: 'POST',
        body: JSON.stringify(requestData)
      });

      if (result) {
        setSuccessDialog(true);
        setTimeout(() => {
          setForm({ vehicleId: '', partId: '', customPartName: '', quantity: 1, urgency: 'Medium', description: '' });
          setSelectedPart(null);
          loadRequests();
        }, 1500);
      }
    } catch (error) {
      console.error('Error submitting request:', error);
      setError(error.message || 'Failed to submit request');
    } finally {
      setIsSubmitting(false);
    }
  };

  const getVehicleLabel = (v) => `${v.make} ${v.model} - ${v.plateNumber}`;
  const getPartLabel = (p) => p.name;
  const hasLowStock = selectedPart && selectedPart.stockLevel < 10;

  return (
    <div className="card" style={{ maxWidth: '800px', margin: 'auto' }}>
      <button onClick={onBack} className="btn-small" style={{ marginBottom: '1rem', background: '#cbd5e1' }}>← Back</button>
      <h2>Request Unavailable Part</h2>
      
      <form style={{ marginTop: '2rem', display: 'flex', flexDirection: 'column', gap: '1.5rem' }} onSubmit={handleSubmit}>
        {/* Select Vehicle */}
        <div>
          <label>Select Vehicle *</label>
          <select 
            value={form.vehicleId} 
            onChange={e => { setForm({...form, vehicleId: e.target.value}); setError(''); }}
            style={{ borderColor: error && error.includes('vehicle') ? '#ef4444' : '' }}
          >
            <option value="">-- Select a Vehicle --</option>
            {vehicles.map(vehicle => (
              <option key={vehicle.id} value={vehicle.id}>
                {getVehicleLabel(vehicle)}
              </option>
            ))}
          </select>
          {error && error.includes('vehicle') && <span style={{ fontSize: '0.75rem', color: '#ef4444' }}>{error}</span>}
        </div>

        {/* Select Part */}
        <div>
          <label>Select Part from Inventory</label>
          <select 
            value={form.partId} 
            onChange={handlePartChange}
          >
            <option value="">-- Select a Part --</option>
            {parts.map(part => (
              <option key={part.id} value={part.id}>
                {getPartLabel(part)}
              </option>
            ))}
          </select>

          {/* Stock Warning - Only show if part selected and stock < 10 */}
          {hasLowStock && (
            <div style={{ marginTop: '0.5rem', padding: '0.75rem', background: '#fef3c7', border: '1px solid #fcd34d', borderRadius: '6px', fontSize: '0.9rem', color: '#92400e' }}>
              ⚠️ Low Stock: Only {selectedPart.stockLevel} left
            </div>
          )}
        </div>

        {/* Custom Part Input */}
        <div style={{ background: '#f8fafc', padding: '1rem', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
          <label style={{ fontSize: '0.9rem', opacity: 0.8 }}>Can't find your part?</label>
          <input
            type="text"
            placeholder="Enter part name"
            value={form.customPartName}
            onChange={e => { setForm({...form, customPartName: e.target.value}); setError(''); }}
            style={{ marginTop: '0.5rem' }}
          />
        </div>

        {/* Quantity */}
        <div>
          <label>Quantity *</label>
          <input
            type="number"
            min="1"
            value={form.quantity}
            onChange={e => { setForm({...form, quantity: parseInt(e.target.value) || 1}); setError(''); }}
            style={{ borderColor: error && error.includes('Quantity') ? '#ef4444' : '' }}
          />
          {error && error.includes('Quantity') && <span style={{ fontSize: '0.75rem', color: '#ef4444' }}>{error}</span>}
        </div>

        {/* Urgency */}
        <div>
          <label>Urgency *</label>
          <select 
            value={form.urgency} 
            onChange={e => { setForm({...form, urgency: e.target.value}); setError(''); }}
            style={{ borderColor: error && error.includes('urgency') ? '#ef4444' : '' }}
          >
            <option value="Low">Low</option>
            <option value="Medium">Medium</option>
            <option value="High">High</option>
          </select>
        </div>

        {/* Description */}
        <div style={{ width: '100%' }}>
          <label>Description (Optional)</label>
          <textarea
            placeholder="Any additional details about the part you need..."
            value={form.description}
            onChange={e => setForm({...form, description: e.target.value})}
            maxLength={500}
            style={{ 
              width: '100%',
              minHeight: '140px',
              fontSize: '1rem',
              padding: '12px 14px',
              border: '2px solid #e2e8f0',
              borderRadius: '8px',
              backgroundColor: '#ffffff',
              fontFamily: 'inherit',
              resize: 'vertical',
              transition: 'border-color 0.2s ease, box-shadow 0.2s ease',
              color: '#334155',
              lineHeight: '1.5',
              boxSizing: 'border-box'
            }}
            onFocus={(e) => {
              e.target.style.borderColor = '#6366f1';
              e.target.style.outline = 'none';
              e.target.style.boxShadow = '0 0 0 3px rgba(99, 102, 241, 0.1)';
            }}
            onBlur={(e) => {
              e.target.style.borderColor = '#e2e8f0';
              e.target.style.boxShadow = 'none';
            }}
          />
        </div>

        {error && !error.includes('vehicle') && !error.includes('Quantity') && !error.includes('urgency') && (
          <p style={{ color: '#ef4444', fontSize: '0.9rem', background: '#fee2e2', padding: '0.75rem', borderRadius: '6px', borderLeft: '4px solid #ef4444' }}>
            {error}
          </p>
        )}

        <button type="submit" disabled={isSubmitting} style={{ marginTop: '1rem', opacity: isSubmitting ? 0.6 : 1, cursor: isSubmitting ? 'not-allowed' : 'pointer', background: 'var(--primary)', color: '#fff' }}>
          {isSubmitting ? 'Submitting...' : 'Submit Request'}
        </button>
      </form>

      {/* My Requests Table */}
      <div style={{ marginTop: '3rem', paddingTop: '2rem', borderTop: '1px solid #e2e8f0' }}>
        <h3>My Requests</h3>
        <div className="data-list" style={{ marginTop: '1rem' }}>
          {requests.length === 0 ? (
            <p style={{ textAlign: 'center', padding: '2rem', opacity: 0.5 }}>No requests yet</p>
          ) : (
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.9rem' }}>
                <thead>
                  <tr style={{ borderBottom: '2px solid #e2e8f0', background: '#f8fafc' }}>
                    <th style={{ padding: '0.75rem', textAlign: 'left', fontWeight: 600 }}>Vehicle</th>
                    <th style={{ padding: '0.75rem', textAlign: 'left', fontWeight: 600 }}>Part Name</th>
                    <th style={{ padding: '0.75rem', textAlign: 'left', fontWeight: 600 }}>Qty</th>
                    <th style={{ padding: '0.75rem', textAlign: 'left', fontWeight: 600 }}>Urgency</th>
                    <th style={{ padding: '0.75rem', textAlign: 'left', fontWeight: 600 }}>Status</th>
                    <th style={{ padding: '0.75rem', textAlign: 'left', fontWeight: 600 }}>Date</th>
                  </tr>
                </thead>
                <tbody>
                  {requests.map(req => (
                    <tr key={req.id} style={{ borderBottom: '1px solid #e2e8f0' }}>
                      <td style={{ padding: '0.75rem' }}>
                        {req.vehicle ? `${req.vehicle.make} ${req.vehicle.model}` : 'N/A'}
                      </td>
                      <td style={{ padding: '0.75rem' }}>
                        {req.part ? req.part.name : req.customPartName}
                      </td>
                      <td style={{ padding: '0.75rem' }}>{req.quantity}</td>
                      <td style={{ padding: '0.75rem' }}>
                        <span style={{ display: 'inline-block', padding: '0.25rem 0.75rem', borderRadius: '4px', background: getUrgencyColor(req.urgency), color: getUrgencyTextColor(req.urgency), fontSize: '0.8rem', fontWeight: 500 }}>
                          {getUrgencyLabel(req.urgency)}
                        </span>
                      </td>
                      <td style={{ padding: '0.75rem' }}>
                        <span style={{ display: 'inline-block', padding: '0.25rem 0.75rem', borderRadius: '4px', background: getStatusColor(req.status), fontSize: '0.8rem', fontWeight: 500 }}>
                          {getStatusLabel(req.status)}
                        </span>
                      </td>
                      <td style={{ padding: '0.75rem', opacity: 0.7, fontSize: '0.85rem' }}>
                        {new Date(req.requestedAt).toLocaleDateString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {successDialog && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999 }}>
          <div style={{ background: '#fff', padding: '2rem', borderRadius: '12px', maxWidth: '400px', boxShadow: '0 10px 40px rgba(0,0,0,0.2)', textAlign: 'center' }}>
            <p style={{ color: '#10b981', fontSize: '2rem', marginBottom: '0.5rem' }}>✓</p>
            <p style={{ fontSize: '1rem', fontWeight: 500 }}>Request submitted successfully!</p>
            <button onClick={() => setSuccessDialog(false)} style={{ marginTop: '1.5rem', background: '#10b981', color: '#fff', padding: '0.6rem 1.2rem', borderRadius: '6px', border: 'none', cursor: 'pointer' }}>OK</button>
          </div>
        </div>
      )}
    </div>
  );
}
