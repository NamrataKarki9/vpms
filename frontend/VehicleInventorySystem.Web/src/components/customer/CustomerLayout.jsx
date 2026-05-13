import React, { useState } from 'react';
import { Outlet } from 'react-router-dom';
import { MessageSquare, X, Send } from 'lucide-react';
import CustomerSidebar from './CustomerSidebar';
import CustomerTopBar from './CustomerTopBar';
import '../../styles/staff.css';

const CustomerLayout = ({ user }) => {
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
    <div className="staff-shell">
      <CustomerSidebar user={user} />
      
      <div className="staff-body">
        <CustomerTopBar />
        
        <main className="staff-content">
          <Outlet />
        </main>
      </div>

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
    </div>
  );
};

export default CustomerLayout;

