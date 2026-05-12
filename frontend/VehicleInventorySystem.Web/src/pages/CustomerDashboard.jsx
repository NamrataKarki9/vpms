import React, { useState, useEffect } from 'react';
import { apiFetch } from '../services/api.js';
import { useToast } from '../context/ToastContext';

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
      
      // Load part requests
      const pr = await apiFetch(`/Service/part-requests?customerId=${user.id}`);
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
      await apiFetch(`/Service/part-requests/${id}`, { method: 'DELETE' });
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
  if (subView === 'vehicles') return <VehiclesPage vehicles={vehicles} onAddVehicle={handleAddVehicle} onDeleteVehicle={handleDeleteVehicle} onBack={() => setSubView('main')} />;
  if (subView === 'appointments') return <AppointmentsPage list={appointments} vehicles={vehicles} onDelete={handleDeleteAppointment} onBack={() => setSubView('main')} onNew={() => setSubView('book')} />;
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
                <span><strong>{v.make}</strong> {v.model}</span>
                <span style={{ opacity: 0.7 }}>{v.plateNumber}</span>
              </div>
            ))}
            {vehicles.length === 0 && <p style={{opacity:0.5}}>No vehicles yet. Add one to get started!</p>}
          </div>
          <button onClick={() => setSubView('vehicles')} style={{ width: '100%', marginTop: '1rem' }}>+ Add Vehicle</button>
        </div>

        <div className="card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <h3>My Purchase History</h3>
            <button className="btn-small" onClick={() => setSubView('history')}>View All</button>
          </div>
          <div style={{ marginTop: '1rem' }}>
            {history.slice(0, 3).map(s => (
              <div key={s.id} className="list-item">
                <span>{s.items?.[0]?.part?.name || 'Invoice'}</span>
                <span>Rs. {s.totalAmount?.toFixed(2)}</span>
              </div>
            ))}
            {history.length === 0 && <p style={{opacity:0.5}}>No purchase history yet.</p>}
          </div>
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

  const fuelTypes = ['Petrol', 'Diesel', 'Hybrid', 'Electric', 'CNG'];

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

    try {
      await onAddVehicle({
        plateNumber: form.plateNumber.trim(),
        model: form.model.trim(),
        make: form.make.trim(),
        year: form.year,
        fuelType: form.fuelType || null,
        mileage: form.mileage
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
            <div>
              <label>License Plate Number *</label>
              <input
                type="text"
                placeholder="e.g., ABC-1234"
                value={form.plateNumber}
                onChange={e => setForm({...form, plateNumber: e.target.value})}
                style={{ borderColor: error && error.includes('required') ? '#ef4444' : '' }}
              />
            </div>

            <div>
              <label>Vehicle Make *</label>
              <input
                type="text"
                placeholder="e.g., Toyota"
                value={form.make}
                onChange={e => setForm({...form, make: e.target.value})}
              />
            </div>

            <div>
              <label>Vehicle Model *</label>
              <input
                type="text"
                placeholder="e.g., Camry"
                value={form.model}
                onChange={e => setForm({...form, model: e.target.value})}
              />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
              <div>
                <label>Year *</label>
                <input
                  type="number"
                  min="1900"
                  max={new Date().getFullYear() + 1}
                  value={form.year}
                  onChange={e => setForm({...form, year: parseInt(e.target.value)})}
                />
              </div>
              <div>
                <label>Fuel Type</label>
                <select value={form.fuelType} onChange={e => setForm({...form, fuelType: e.target.value})}>
                  <option value="">Select...</option>
                  {fuelTypes.map(ft => <option key={ft} value={ft}>{ft}</option>)}
                </select>
              </div>
            </div>

            <div>
              <label>Current Mileage (km)</label>
              <input
                type="number"
                min="0"
                value={form.mileage}
                onChange={e => setForm({...form, mileage: parseInt(e.target.value) || 0})}
              />
            </div>

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
              <strong>{v.make} {v.model}</strong>
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

function AppointmentsPage({ list, vehicles, onDelete, onBack, onNew }) {
  const [cancelDialog, setCancelDialog] = useState({ isOpen: false, id: null, name: '' });
  const [successDialog, setSuccessDialog] = useState({ isOpen: false, message: '' });

  const handleCancelClick = (id, serviceType) => {
    setCancelDialog({ isOpen: true, id, name: serviceType });
function AppointmentsPage({ list, onDelete, onUpdate, onBack, onNew }) {
  const showToast = useToast();
  const [cancelDialog, setCancelDialog] = useState({ isOpen: false, id: null, type: '', name: '' });
  const [rescheduleDialog, setRescheduleDialog] = useState({ isOpen: false, id: null, newDate: '' });
  const [rescheduleError, setRescheduleError] = useState('');
  const [successDialog, setSuccessDialog] = useState({ isOpen: false, message: '' });

  const validateCancel = (appointment) => {
    const appointmentDate = new Date(appointment.date);
    const now = new Date();
    
    if (appointmentDate < now) {
      return 'Past appointments cannot be cancelled.';
    }
    
    if (appointment.status === 'cancelled') {
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
  const validateReschedule = (appointment, newDate) => {
    const appointmentDate = new Date(appointment.date);
    const now = new Date();
    const hoursUntilAppointment = (appointmentDate - now) / (1000 * 60 * 60);

    if (appointmentDate < now) {
      return 'Past or completed appointments cannot be rescheduled.';
    }

    if (appointment.status === 'cancelled') {
      return 'Cancelled appointments cannot be rescheduled.';
    }

    if (hoursUntilAppointment < 24) {
      return 'Appointments can only be rescheduled at least 24 hours before the scheduled service time.';
    }

    const selectedDate = new Date(newDate);
    if (selectedDate <= now) {
      return 'Please select a valid future date and time.';
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

    const updatedAppointment = {
      ...appointment,
      appointmentDate: new Date(rescheduleDialog.newDate).toISOString(),
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
              <button onClick={() => handleCancelClick(a.id, a.serviceType)} className="btn-small" style={{ background: 'var(--error)', color: '#fff' }}>Cancel</button>
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
  const [form, setForm] = useState({ vehicleId: '', serviceType: '', appointmentDate: '', appointmentTime: '10:00', description: '' });
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [successDialog, setSuccessDialog] = useState(false);

  const serviceTypes = ['Oil Change', 'Filter Replacement', 'Tire Rotation', 'Brake Service', 'Full Service', 'Diagnosis', 'Other'];

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

    if (!validateBooking()) return;

    setIsSubmitting(true);
    try {
      const { apiFetch } = await import('../services/api');
      
      const appointmentData = {
        customerId: user.id,
        vehicleId: parseInt(form.vehicleId),
        appointmentDate: new Date(form.appointmentDate).toISOString().split('T')[0],
        appointmentTime: form.appointmentTime,
        serviceType: form.serviceType.trim(),
        description: form.description.trim()
      };

      const result = await apiFetch('/Service/appointments', {
        method: 'POST',
        body: JSON.stringify(appointmentData)
      });

      if (result) {
        setSuccessDialog(true);
        setTimeout(() => {
          onComplete(result.appointment || result);
        }, 2000);
      }
    } catch (err) {
      setError(err.message || 'Failed to book appointment');
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
          <label>Preferred Time *</label>
          <input 
            type="time" 
            value={form.appointmentTime} 
            onChange={e => setForm({...form, appointmentTime: e.target.value})}
          />
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

        <div>
          <label>Problem Description (Optional)</label>
          <textarea 
            placeholder="Describe any issues or special requests..." 
            value={form.description} 
            onChange={e => setForm({...form, description: e.target.value})}
            style={{ minHeight: '100px' }}
          />
        </div>

        {error && !error.includes('date') && !error.includes('service') && !error.includes('vehicle') && <p style={{ color: '#ef4444', fontSize: '0.9rem' }}>{error}</p>}

        <button type="submit" onClick={handleSubmit} disabled={isSubmitting} style={{ marginTop: '1rem', opacity: isSubmitting ? 0.6 : 1, cursor: isSubmitting ? 'not-allowed' : 'pointer' }}>
          {isSubmitting ? 'Booking...' : 'Confirm Booking'}
        </button>
      </form>

      {successDialog && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999 }}>
          <div style={{ background: '#fff', padding: '2rem', borderRadius: '12px', maxWidth: '400px', boxShadow: '0 10px 40px rgba(0,0,0,0.2)', textAlign: 'center' }}>
            <p style={{ color: '#10b981', fontSize: '2rem', marginBottom: '0.5rem' }}>✓</p>
            <p style={{ fontSize: '1rem', fontWeight: 500 }}>Appointment booked successfully!</p>
            <p style={{ fontSize: '0.9rem', opacity: 0.7, marginTop: '0.5rem' }}>You will receive a confirmation email shortly.</p>
            <button onClick={() => setSuccessDialog(false)} style={{ marginTop: '1.5rem', background: '#10b981', color: '#fff', padding: '0.6rem 1.2rem', borderRadius: '6px', border: 'none', cursor: 'pointer' }}>OK</button>
          </div>
        </div>
      )}
    </div>
  );
}

function RequestsPage({ list, onDelete, onBack, onNew }) {
function RequestsPage({ list, onDelete, onUpdate, onBack, onNew }) {
  const showToast = useToast();
  const [cancelDialog, setCancelDialog] = useState({ isOpen: false, id: null, name: '' });
  const [successDialog, setSuccessDialog] = useState({ isOpen: false, message: '' });

  const handleCancelClick = (id, partName) => {
    setCancelDialog({ isOpen: true, id, name: partName });
  };

  const handleConfirmCancel = () => {
    onDelete(cancelDialog.id);
    setSuccessDialog({ isOpen: true, message: 'Part request cancelled.' });
    setCancelDialog({ isOpen: false, id: null, name: '' });
  };

  const handleEditClick = (request) => {
    setEditingId(request.id);
    setEditData({ partName: request.partName, vehicleDetails: request.vehicleDetails });
  };

  const handleSaveEdit = (id) => {
    if (!editData.partName.trim() || !editData.vehicleDetails.trim()) {
      showToast('error', 'Please fill in all fields.');
      return;
    }

    const request = list.find(r => r.id === id);
    const updatedRequest = {
      id: request.id,
      customerId: request.customerId,
      partName: editData.partName,
      vehicleDetails: editData.vehicleDetails,
      requestDate: request.requestDate || new Date().toISOString(),
      isFulfilled: request.isFulfilled || false
    };
    
    onUpdate(updatedRequest);
    setSuccessDialog({ isOpen: true, message: 'Special order request updated successfully.' });
    setEditingId(null);
  };

  return (
    <div className="card" style={{ maxWidth: '800px', margin: 'auto' }}>
      <button onClick={onBack} className="btn-small" style={{ marginBottom: '1rem', background: '#cbd5e1' }}>← Back</button>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
        <h2>Special Part Requests</h2>
        <button onClick={onNew}>+ New Request</button>
      </div>
      <div className="data-list">
        {list.map(r => (
          <div key={r.id} className="list-item" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '1rem' }}>
            <div>
              <strong>{r.partName}</strong>
              <div style={{ fontSize: '0.8rem', opacity: 0.6 }}>For: {r.vehicleDetails}</div>
            </div>
            <button onClick={() => handleCancelClick(r.id, r.partName)} className="btn-small" style={{ background: 'var(--error)', color: '#fff' }}>Cancel Request</button>
          </div>
        ))}
        {list.length === 0 && <p style={{textAlign: 'center', padding: '3rem', opacity: 0.5}}>No active requests.</p>}
      </div>

      {cancelDialog.isOpen && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999 }}>
          <div style={{ background: '#fff', padding: '2rem', borderRadius: '12px', maxWidth: '400px', boxShadow: '0 10px 40px rgba(0,0,0,0.2)' }}>
            <h3>Cancel Request</h3>
            <p>Are you sure you want to cancel the request for <strong>{cancelDialog.name}</strong>?</p>
            <div style={{ display: 'flex', gap: '1rem', marginTop: '2rem' }}>
              <button onClick={() => setCancelDialog({ isOpen: false, id: null, name: '' })} style={{ flex: 1, background: '#cbd5e1', color: '#0f172a' }}>No, Keep It</button>
              <button onClick={handleConfirmCancel} style={{ flex: 1, background: 'var(--error)', color: '#fff' }}>Yes, Cancel</button>
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
  const [form, setForm] = useState({ partName: '', vehicleDetails: '' });
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [successDialog, setSuccessDialog] = useState(false);

  const partCategories = ['Engine Components', 'Brake & Suspension', 'Electrical System', 'Body & Interior', 'Filters & Fluids', 'Other'];

  const handleSubmit = async () => {
    if (!form.partName || !form.vehicleDetails) {
      setError('Please fill in all fields');
      showToast('error', 'Please fill in all fields.');
      return;
    }

    setIsSubmitting(true);
    try {
      const { apiFetch } = await import('../services/api');
      const result = await apiFetch('/Service/part-requests', {
        method: 'POST',
        body: JSON.stringify({
          customerId: user.id,
          partName: form.partName,
          vehicleDetails: form.vehicleDetails,
          requestDate: new Date().toISOString(),
          isFulfilled: false
        })
      });

      if (result) {
        setSuccessDialog(true);
        setTimeout(() => {
          onComplete(result);
        }, 2000);
      } else {
        showToast('error', 'Failed to submit request. Please try again.');
      }
    } catch (err) {
      setError(err.message || 'Failed to submit request');
    } catch (error) {
      console.error('Error submitting request:', error);
      showToast('error', 'Error submitting request: ' + error.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="card" style={{ maxWidth: '600px', margin: 'auto' }}>
      <button onClick={onBack} className="btn-small" style={{ marginBottom: '1rem', background: '#cbd5e1' }}>← Back</button>
      <h2>Submit Special Order</h2>
      <div className="mini-form" style={{ marginTop: '2rem' }}>
        <label>Part Category *</label>
        <select value={form.partName} onChange={e => { setForm({...form, partName: e.target.value}); setError(''); }}>
          <option value="">Select Category</option>
          {partCategories.map(cat => <option key={cat} value={cat}>{cat}</option>)}
        </select>

        <label>Vehicle Details *</label>
        <input
          type="text"
          placeholder="e.g., Toyota Camry 2020"
          value={form.vehicleDetails}
          onChange={e => { setForm({...form, vehicleDetails: e.target.value}); setError(''); }}
        />

        {error && <p style={{ color: '#ef4444', fontSize: '0.9rem' }}>{error}</p>}

        <button 
          onClick={handleSubmit} 
          disabled={isSubmitting} 
          style={{ marginTop: '1rem', opacity: isSubmitting ? 0.6 : 1, cursor: isSubmitting ? 'not-allowed' : 'pointer' }}
        >
          {isSubmitting ? 'Submitting...' : 'Submit Special Order'}
        </button>
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
