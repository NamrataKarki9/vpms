import React, { useState, useEffect } from 'react';

export function CustomerView({ user }) {
  const [history, setHistory] = useState([]);
  const [subView, setSubView] = useState('main'); // 'main', 'history', 'appointments', 'book', 'requests', 'new-request'
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
    const { apiFetch } = await import('../../api');
    const h = await apiFetch(`/Customers/${user.id}/history`);
    if (h) setHistory(h);
    
    // In a real app, we'd have endpoints for these. For now we simulate/use dummy lists
    // if the user had some.
  };

  const handleDeleteAppointment = (id) => {
    setAppointments(prev => prev.filter(a => a.id !== id));
    alert('Appointment cancelled successfully.');
  };

  const handleDeleteRequest = (id) => {
    setPartRequests(prev => prev.filter(r => r.id !== id));
    alert('Special order request removed.');
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
  if (subView === 'appointments') return <AppointmentsPage list={appointments} onDelete={handleDeleteAppointment} onBack={() => setSubView('main')} onNew={() => setSubView('book')} />;
  if (subView === 'book') return <BookingPage user={user} onComplete={(newApp) => { setAppointments([...appointments, { ...newApp, id: Date.now() }]); setSubView('appointments'); }} onBack={() => setSubView('main')} />;
  if (subView === 'requests') return <RequestsPage list={partRequests} onDelete={handleDeleteRequest} onBack={() => setSubView('main')} onNew={() => setSubView('new-request')} />;
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

function AppointmentsPage({ list, onDelete, onBack, onNew }) {
  return (
    <div className="card" style={{ maxWidth: '800px', margin: 'auto' }}>
      <button onClick={onBack} className="btn-small" style={{ marginBottom: '1rem', background: '#cbd5e1' }}>← Back</button>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
        <h2>My Service Bookings</h2>
        <button onClick={onNew}>+ Book New</button>
      </div>
      <div className="data-list">
        {list.map(a => (
          <div key={a.id} className="list-item">
            <div>
              <strong>{a.serviceType}</strong>
              <div style={{ fontSize: '0.8rem', opacity: 0.6 }}>Scheduled: {a.date}</div>
            </div>
            <button onClick={() => onDelete(a.id)} className="btn-small" style={{ background: 'var(--error)' }}>Cancel</button>
          </div>
        ))}
        {list.length === 0 && <p style={{textAlign: 'center', padding: '3rem', opacity: 0.5}}>No upcoming appointments.</p>}
      </div>
    </div>
  );
}

function BookingPage({ onComplete, onBack }) {
  const [form, setForm] = useState({ date: '', serviceType: '', description: '' });
  return (
    <div className="card" style={{ maxWidth: '600px', margin: 'auto' }}>
      <button onClick={onBack} className="btn-small" style={{ marginBottom: '1rem', background: '#cbd5e1' }}>← Back</button>
      <h2>Book Service Appointment</h2>
      <div className="mini-form" style={{ marginTop: '2rem' }}>
        <label>Appointment Date</label>
        <input type="date" value={form.date} onChange={e => setForm({...form, date: e.target.value})} />
        <label>Service Type</label>
        <input type="text" placeholder="e.g. Oil Change, Full Service" value={form.serviceType} onChange={e => setForm({...form, serviceType: e.target.value})} />
        <label>Additional Notes</label>
        <textarea placeholder="Tell us about any issues..." value={form.description} onChange={e => setForm({...form, description: e.target.value})} style={{ minHeight: '100px' }} />
        <button onClick={() => onComplete(form)} style={{ marginTop: '1rem' }}>Confirm Booking</button>
      </div>
    </div>
  );
}

function RequestsPage({ list, onDelete, onBack, onNew }) {
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
            <div>
              <strong>{r.partName}</strong>
              <div style={{ fontSize: '0.8rem', opacity: 0.6 }}>For: {r.vehicleDetails}</div>
            </div>
            <button onClick={() => onDelete(r.id)} className="btn-small" style={{ background: 'var(--error)' }}>Cancel Request</button>
          </div>
        ))}
        {list.length === 0 && <p style={{textAlign: 'center', padding: '3rem', opacity: 0.5}}>No active requests.</p>}
      </div>
    </div>
  );
}

function NewRequestPage({ onComplete, onBack }) {
  const [form, setForm] = useState({ partName: '', vehicleDetails: '' });
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
        <button onClick={() => onComplete(form)} style={{ marginTop: '1rem' }}>Submit Special Order</button>
      </div>
    </div>
  );
}
