import React, { useState, useEffect } from 'react';
import { apiFetch } from '../services/api.js';

export function CustomerDashboard({ user }) {
  const [history, setHistory] = useState([]);
  const [subView, setSubView] = useState('main');
  const [appointments, setAppointments] = useState([]);
  const [partRequests, setPartRequests] = useState([]);

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
    const { apiFetch } = await import('../services/api');
    const h = await apiFetch(`/Customers/${user.id}/history`);
    if (h) setHistory(h);
  };

  const handleDeleteAppointment = async (id) => {
    try {
      await apiFetch(`/Service/appointments/${id}`, { method: 'DELETE' });
      setAppointments(prev => prev.filter(a => a.id !== id));
    } catch (error) {
      console.error('Error deleting appointment:', error);
      alert('Failed to delete appointment');
    }
  };

  const handleDeleteRequest = async (id) => {
    try {
      await apiFetch(`/Service/part-requests/${id}`, { method: 'DELETE' });
      setPartRequests(prev => prev.filter(r => r.id !== id));
    } catch (error) {
      console.error('Error deleting request:', error);
      alert('Failed to delete request');
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
      alert('Failed to update appointment');
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
      alert('Failed to update request');
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
      else botResponse = "I can help you with bookings, parts, or your history. What's on your mind?";
      setChatMessages(prev => [...prev, { sender: 'bot', text: botResponse }]);
    }, 1000);
  };

  if (subView === 'history') return <HistoryPage history={history} onBack={() => setSubView('main')} />;
  if (subView === 'appointments') return <AppointmentsPage list={appointments} onDelete={handleDeleteAppointment} onUpdate={handleUpdateAppointment} onBack={() => setSubView('main')} onNew={() => setSubView('book')} />;
  if (subView === 'book') return <BookingPage user={user} list={appointments} onComplete={(newApp) => { setAppointments([...appointments, { ...newApp, id: Date.now(), status: 'scheduled', rescheduleCount: 0 }]); setSubView('appointments'); }} onBack={() => setSubView('main')} />;
  if (subView === 'requests') return <RequestsPage list={partRequests} onDelete={handleDeleteRequest} onUpdate={handleUpdateRequest} onBack={() => setSubView('main')} onNew={() => setSubView('new-request')} />;
  if (subView === 'new-request') return <NewRequestPage user={user} onComplete={(newReq) => { setPartRequests([...partRequests, { ...newReq, id: Date.now() }]); setSubView('requests'); }} onBack={() => setSubView('main')} />;

  return (
    <>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(350px, 1fr))', gap: '2rem', alignItems: 'start' }}>
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
            {history.length === 0 && <p style={{opacity:0.5}}>No recent history.</p>}
          </div>
        </div>

        <div className="card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <h3>Service Bookings</h3>
            <button className="btn-small" onClick={() => setSubView('appointments')}>Manage</button>
          </div>
          <p style={{ opacity: 0.6, fontSize: '0.9rem' }}>You have {appointments.length} upcoming appointments.</p>
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
              <strong>{s.items?.[0]?.part?.name || 'Standard Service'}</strong>
              <div style={{ fontSize: '0.8rem', opacity: 0.6 }}>Date: {new Date(s.date).toLocaleDateString()}</div>
            </div>
            <span style={{ fontWeight: 700 }}>Rs. {s.totalAmount?.toFixed(2)}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

function AppointmentsPage({ list, onDelete, onUpdate, onBack, onNew }) {
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
      alert(error);
      return;
    }
    
    setCancelDialog({ isOpen: true, id, type: 'appointment', name: appointment.serviceType });
  };

  const handleConfirmCancel = () => {
    onDelete(cancelDialog.id);
    setSuccessDialog({ isOpen: true, message: 'Appointment cancelled successfully.' });
    setCancelDialog({ isOpen: false, id: null, type: '', name: '' });
  };

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
      alert(error);
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
        {list.map(a => (
          <div key={a.id} className="list-item" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '1rem' }}>
            <div style={{ flex: 1 }}>
              <strong>{a.serviceType}</strong>
              <div style={{ fontSize: '0.8rem', opacity: 0.6 }}>Scheduled: {new Date(a.appointmentDate).toLocaleDateString()}</div>
            </div>
            <div style={{ display: 'flex', gap: '0.5rem' }}>
              <button onClick={() => handleRescheduleClick(a)} className="btn-small" style={{ background: '#3b82f6' }}>Reschedule</button>
              <button onClick={() => handleCancelClick(a.id)} className="btn-small" style={{ background: 'var(--error)' }}>Cancel</button>
            </div>
          </div>
        ))}
        {list.length === 0 && <p style={{textAlign: 'center', padding: '3rem', opacity: 0.5}}>No upcoming appointments.</p>}
      </div>

      {/* Cancel Dialog */}
      {cancelDialog.isOpen && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999 }}>
          <div style={{ background: '#fff', padding: '2rem', borderRadius: '12px', maxWidth: '400px', boxShadow: '0 10px 40px rgba(0,0,0,0.2)' }}>
            <h3>Cancel Appointment</h3>
            <p>Are you sure you want to cancel <strong>{cancelDialog.name}</strong>?</p>
            <p style={{ fontSize: '0.9rem', opacity: 0.7 }}>This action cannot be undone.</p>
            <div style={{ display: 'flex', gap: '1rem', marginTop: '2rem' }}>
              <button onClick={() => setCancelDialog({ isOpen: false, id: null, type: '', name: '' })} style={{ flex: 1, background: '#cbd5e1', color: '#0f172a' }}>No, Keep It</button>
              <button onClick={handleConfirmCancel} style={{ flex: 1, background: 'var(--error)', color: '#fff' }}>Yes, Cancel</button>
            </div>
          </div>
        </div>
      )}

      {/* Reschedule Dialog */}
      {rescheduleDialog.isOpen && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999 }}>
          <div style={{ background: '#fff', padding: '2rem', borderRadius: '12px', maxWidth: '400px', boxShadow: '0 10px 40px rgba(0,0,0,0.2)' }}>
            <h3>Reschedule Appointment</h3>
            <p style={{ fontSize: '0.9rem', opacity: 0.7, marginBottom: '1rem' }}>Select a new date for your appointment (must be at least 24 hours away)</p>
            <input 
              type="date" 
              value={rescheduleDialog.newDate} 
              onChange={e => {
                setRescheduleDialog({...rescheduleDialog, newDate: e.target.value});
                setRescheduleError('');
              }}
              min={getTodayDate()}
              style={{ width: '100%', marginBottom: '0.5rem' }}
            />
            {rescheduleError && <p style={{ color: '#ef4444', fontSize: '0.85rem', marginBottom: '1rem' }}>{rescheduleError}</p>}
            <div style={{ display: 'flex', gap: '1rem', marginTop: '1.5rem' }}>
              <button onClick={() => setRescheduleDialog({ isOpen: false, id: null, newDate: '' })} style={{ flex: 1, background: '#cbd5e1', color: '#0f172a' }}>Cancel</button>
              <button onClick={handleConfirmReschedule} style={{ flex: 1, background: 'var(--primary)', color: '#fff' }}>Confirm</button>
            </div>
          </div>
        </div>
      )}

      {/* Success Dialog */}
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

function BookingPage({ onComplete, onBack, user, list = [] }) {
  const [form, setForm] = useState({ date: '', serviceType: '', description: '', vehicleId: user?.vehicles?.[0]?.id || '' });
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [successDialog, setSuccessDialog] = useState(false);

  React.useEffect(() => {
    if (user?.vehicles && user.vehicles.length > 0 && !form.vehicleId) {
      setForm(prev => ({ ...prev, vehicleId: user.vehicles[0].id }));
    }
  }, [user?.vehicles]);

  const getTodayDate = () => {
    return new Date().toISOString().split('T')[0];
  };

  const validateBooking = () => {
    if (!form.vehicleId) {
      setError('Please select a vehicle.');
      return false;
    }

    if (!form.date) {
      setError('Please select an appointment date.');
      return false;
    }

    if (!form.serviceType.trim()) {
      setError('Please select a service type.');
      return false;
    }

    const selectedDate = new Date(form.date);
    const now = new Date();

    if (selectedDate <= now) {
      setError('Please select a valid future date.');
      return false;
    }

    const sameDay = list.some(a => a.date === form.date && a.status !== 'cancelled');
    if (sameDay) {
      setError('An appointment for this vehicle is already booked for the selected date.');
      return false;
    }

    return true;
  };

  const handleSubmit = async () => {
    setError('');
    if (!validateBooking()) return;

    setIsSubmitting(true);
    try {
      const appointmentData = {
        customerId: user?.id,
        vehicleId: parseInt(form.vehicleId),
        appointmentDate: new Date(form.date).toISOString(),
        serviceType: form.serviceType,
        description: form.description
      };

      const response = await apiFetch('/Service/appointments', {
        method: 'POST',
        body: JSON.stringify(appointmentData)
      });

      if (response && response.id) {
        setSuccessDialog(true);
        setForm({ date: '', serviceType: '', description: '', vehicleId: user?.vehicles?.[0]?.id || '' });
        
        setTimeout(() => {
          onComplete(response);
        }, 2000);
      } else {
        setError('Failed to book appointment. Please try again.');
      }
    } catch (error) {
      console.error('Error booking appointment:', error);
      setError('Error booking appointment: ' + error.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="card" style={{ maxWidth: '600px', margin: 'auto' }}>
      <button onClick={onBack} className="btn-small" style={{ marginBottom: '1rem', background: '#cbd5e1' }}>← Back</button>
      <h2>Book Service Appointment</h2>
      <div className="mini-form" style={{ marginTop: '2rem' }}>
        <label>Select Vehicle</label>
        <select 
          value={form.vehicleId} 
          onChange={e => {
            setForm({...form, vehicleId: e.target.value});
            setError('');
          }}
          style={{ borderColor: error && error.includes('vehicle') ? '#ef4444' : '' }}
        >
          <option value="">Select a Vehicle</option>
          {user?.vehicles && user.vehicles.map(vehicle => (
            <option key={vehicle.id} value={vehicle.id}>
              {vehicle.model || 'Vehicle'} ({vehicle.plateNumber || 'No plate'})
            </option>
          ))}
        </select>
        {error && error.includes('vehicle') && <span style={{ fontSize: '0.75rem', color: '#ef4444' }}>{error}</span>}

        <label>Appointment Date</label>
        <input 
          type="date" 
          value={form.date} 
          onChange={e => {
            setForm({...form, date: e.target.value});
            setError('');
          }}
          min={getTodayDate()}
          style={{ borderColor: error && error.includes('date') ? '#ef4444' : '' }}
        />
        {error && error.includes('date') && <span style={{ fontSize: '0.75rem', color: '#ef4444' }}>{error}</span>}
        
        <label>Service Type</label>
        <input 
          type="text" 
          placeholder="e.g. Oil Change, Full Service" 
          value={form.serviceType} 
          onChange={e => {
            setForm({...form, serviceType: e.target.value});
            setError('');
          }}
          style={{ borderColor: error && error.includes('service') ? '#ef4444' : '' }}
        />
        {error && error.includes('service') && <span style={{ fontSize: '0.75rem', color: '#ef4444' }}>{error}</span>}
        
        <label>Additional Notes</label>
        <textarea 
          placeholder="Tell us about any issues..." 
          value={form.description} 
          onChange={e => setForm({...form, description: e.target.value})} 
          style={{ minHeight: '100px' }}
        />
        
        {error && !error.includes('date') && !error.includes('service') && !error.includes('vehicle') && <p style={{ color: '#ef4444', fontSize: '0.9rem', marginBottom: '1rem' }}>{error}</p>}
        
        <button onClick={handleSubmit} disabled={isSubmitting} style={{ marginTop: '1rem', opacity: isSubmitting ? 0.6 : 1, cursor: isSubmitting ? 'not-allowed' : 'pointer' }}>
          {isSubmitting ? 'Booking...' : 'Confirm Booking'}
        </button>
      </div>

      {/* Success Dialog */}
      {successDialog && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999 }}>
          <div style={{ background: '#fff', padding: '2rem', borderRadius: '12px', maxWidth: '400px', boxShadow: '0 10px 40px rgba(0,0,0,0.2)', textAlign: 'center' }}>
            <p style={{ color: '#10b981', fontSize: '2rem', marginBottom: '0.5rem' }}>✓</p>
            <p style={{ fontSize: '1rem', fontWeight: 500 }}>Appointment booked successfully!</p>
            <button onClick={() => setSuccessDialog(false)} style={{ marginTop: '1.5rem', background: '#10b981', color: '#fff', padding: '0.6rem 1.2rem', borderRadius: '6px', border: 'none', cursor: 'pointer' }}>OK</button>
          </div>
        </div>
      )}
    </div>
  );
}

function RequestsPage({ list, onDelete, onUpdate, onBack, onNew }) {
  const [cancelDialog, setCancelDialog] = useState({ isOpen: false, id: null, name: '' });
  const [editingId, setEditingId] = useState(null);
  const [editData, setEditData] = useState({ partName: '', vehicleDetails: '' });
  const [successDialog, setSuccessDialog] = useState({ isOpen: false, message: '' });

  const partCategories = ['Engine Components', 'Brake & Suspension', 'Electrical System', 'Body & Interior'];
  const vehicleBrands = ['Toyota', 'Hyundai', 'Suzuki', 'Honda', 'Mahindra'];

  const handleCancelClick = (id, partName) => {
    setCancelDialog({ isOpen: true, id, name: partName });
  };

  const handleConfirmCancel = () => {
    onDelete(cancelDialog.id);
    setSuccessDialog({ isOpen: true, message: 'Special order request removed.' });
    setCancelDialog({ isOpen: false, id: null, name: '' });
  };

  const handleEditClick = (request) => {
    setEditingId(request.id);
    setEditData({ partName: request.partName, vehicleDetails: request.vehicleDetails });
  };

  const handleSaveEdit = (id) => {
    if (!editData.partName.trim() || !editData.vehicleDetails.trim()) {
      alert('Please fill in all fields.');
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
          <div key={r.id} className="list-item">
            {editingId === r.id ? (
              <div style={{ display: 'flex', gap: '1rem', width: '100%', flexDirection: 'column' }}>
                <div>
                  <label style={{ fontSize: '0.85rem', opacity: 0.7 }}>Part Category</label>
                  <select 
                    value={editData.partName} 
                    onChange={e => setEditData({...editData, partName: e.target.value})}
                    style={{ width: '100%' }}
                  >
                    <option value="">Select Category</option>
                    {partCategories.map(cat => <option key={cat} value={cat}>{cat}</option>)}
                  </select>
                </div>
                <div>
                  <label style={{ fontSize: '0.85rem', opacity: 0.7 }}>Vehicle Brand</label>
                  <select 
                    value={editData.vehicleDetails} 
                    onChange={e => setEditData({...editData, vehicleDetails: e.target.value})}
                    style={{ width: '100%' }}
                  >
                    <option value="">Select Brand</option>
                    {vehicleBrands.map(brand => <option key={brand} value={brand}>{brand}</option>)}
                  </select>
                </div>
                <div style={{ display: 'flex', gap: '0.5rem' }}>
                  <button onClick={() => handleSaveEdit(r.id)} className="btn-small" style={{ background: '#10b981', flex: 1 }}>Save</button>
                  <button onClick={() => setEditingId(null)} className="btn-small" style={{ background: '#cbd5e1', flex: 1 }}>Cancel</button>
                </div>
              </div>
            ) : (
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%' }}>
                <div>
                  <strong>{r.partName}</strong>
                  <div style={{ fontSize: '0.8rem', opacity: 0.6 }}>For: {r.vehicleDetails}</div>
                </div>
                <div style={{ display: 'flex', gap: '0.5rem' }}>
                  <button onClick={() => handleEditClick(r)} className="btn-small" style={{ background: '#3b82f6' }}>Edit</button>
                  <button onClick={() => handleCancelClick(r.id, r.partName)} className="btn-small" style={{ background: 'var(--error)' }}>Cancel Request</button>
                </div>
              </div>
            )}
          </div>
        ))}
        {list.length === 0 && <p style={{textAlign: 'center', padding: '3rem', opacity: 0.5}}>No active requests.</p>}
      </div>

      {/* Cancel Dialog */}
      {cancelDialog.isOpen && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999 }}>
          <div style={{ background: '#fff', padding: '2rem', borderRadius: '12px', maxWidth: '400px', boxShadow: '0 10px 40px rgba(0,0,0,0.2)' }}>
            <h3>Cancel Special Order</h3>
            <p>Are you sure you want to cancel the order for <strong>{cancelDialog.name}</strong>?</p>
            <p style={{ fontSize: '0.9rem', opacity: 0.7 }}>This action cannot be undone.</p>
            <div style={{ display: 'flex', gap: '1rem', marginTop: '2rem' }}>
              <button onClick={() => setCancelDialog({ isOpen: false, id: null, name: '' })} style={{ flex: 1, background: '#cbd5e1', color: '#0f172a' }}>No, Keep It</button>
              <button onClick={handleConfirmCancel} style={{ flex: 1, background: 'var(--error)', color: '#fff' }}>Yes, Cancel</button>
            </div>
          </div>
        </div>
      )}

      {/* Success Dialog */}
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
  const [form, setForm] = useState({ partName: '', vehicleDetails: '' });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [successDialog, setSuccessDialog] = useState(false);

  const handleSubmit = async () => {
    if (!form.partName || !form.vehicleDetails) {
      alert('Please fill in all fields.');
      return;
    }

    setIsSubmitting(true);
    try {
      const requestData = {
        partName: form.partName,
        vehicleDetails: form.vehicleDetails,
        customerId: user?.id
      };

      const response = await apiFetch('/Service/part-requests', {
        method: 'POST',
        body: JSON.stringify(requestData)
      });

      if (response && response.id) {
        setSuccessDialog(true);
        setForm({ partName: '', vehicleDetails: '' });
        
        setTimeout(() => {
          onComplete(response);
        }, 2000);
      } else {
        alert('Failed to submit request. Please try again.');
      }
    } catch (error) {
      console.error('Error submitting request:', error);
      alert('Error submitting request: ' + error.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="card" style={{ maxWidth: '600px', margin: 'auto' }}>
      <button onClick={onBack} className="btn-small" style={{ marginBottom: '1rem', background: '#cbd5e1' }}>← Back</button>
      <h2>Submit Special Order</h2>
      <div className="mini-form" style={{ marginTop: '2rem' }}>
        <label>Part Category</label>
        <select value={form.partName} onChange={e => setForm({...form, partName: e.target.value})}>
          <option value="">Select Category</option>
          <option>Engine Components</option>
          <option>Brake & Suspension</option>
          <option>Electrical System</option>
          <option>Body & Interior</option>
        </select>
        <label>Vehicle Brand</label>
        <select value={form.vehicleDetails} onChange={e => setForm({...form, vehicleDetails: e.target.value})}>
          <option value="">Select Brand</option>
          <option>Toyota</option>
          <option>Hyundai</option>
          <option>Suzuki</option>
          <option>Honda</option>
          <option>Mahindra</option>
        </select>
        <button onClick={handleSubmit} disabled={isSubmitting} style={{ marginTop: '1rem', opacity: isSubmitting ? 0.6 : 1, cursor: isSubmitting ? 'not-allowed' : 'pointer' }}>
          {isSubmitting ? 'Submitting...' : 'Submit Special Order'}
        </button>
      </div>

      {/* Success Dialog */}
      {successDialog && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999 }}>
          <div style={{ background: '#fff', padding: '2rem', borderRadius: '12px', maxWidth: '400px', boxShadow: '0 10px 40px rgba(0,0,0,0.2)', textAlign: 'center' }}>
            <p style={{ color: '#10b981', fontSize: '2rem', marginBottom: '0.5rem' }}>✓</p>
            <p style={{ fontSize: '1rem', fontWeight: 500 }}>Special order request submitted successfully!</p>
            <button onClick={() => setSuccessDialog(false)} style={{ marginTop: '1.5rem', background: '#10b981', color: '#fff', padding: '0.6rem 1.2rem', borderRadius: '6px', border: 'none', cursor: 'pointer' }}>OK</button>
          </div>
        </div>
      )}
    </div>
  );
}
