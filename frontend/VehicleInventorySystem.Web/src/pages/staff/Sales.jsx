import React, { useState } from 'react';
import { useToast } from '../../context/ToastContext';

const Sales = ({ customers, parts, onProcessSale }) => {
  const showToast = useToast();
  const [selectedCust, setSelectedCust] = useState('');
  const [selectedPart, setSelectedPart] = useState('');
  const [quantity, setQuantity] = useState(1);
  const [cart, setCart] = useState([]);
  const [paymentStatus, setPaymentStatus] = useState('');

  const handleAddToCart = () => {
    if (!selectedPart) return;
    const part = parts.find(p => p.id === parseInt(selectedPart));
    if (!part) return;
    if (part.stock < quantity) return showToast('error', 'Insufficient stock!');

    const existing = cart.find(c => c.id === part.id);
    if (existing) {
      setCart(cart.map(c => c.id === part.id ? { ...c, quantity: c.quantity + parseInt(quantity) } : c));
    } else {
      setCart([...cart, { ...part, quantity: parseInt(quantity) }]);
    }
    setSelectedPart('');
    setQuantity(1);
  };

  const handleRemove = (id) => setCart(cart.filter(c => c.id !== id));
  const totalAmount = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  
  const handleComplete = () => {
    if (!selectedCust) return showToast('error', 'Please select a customer.');
    if (cart.length === 0) return showToast('error', 'Cart is empty.');
    if (!paymentStatus) return showToast('error', 'Please select a payment status.');
    onProcessSale(selectedCust, cart, paymentStatus);
    setCart([]);
    setSelectedCust('');
    setPaymentStatus('');
  };

  return (
    <div className="staff-card" style={{ maxWidth: '800px', margin: 'auto', padding: '24px' }}>
      <h2 style={{ marginBottom: '20px' }}>New Sale Transaction</h2>
      
      <div style={{ marginBottom: '20px' }}>
        <label style={{ fontSize: '12px', color: '#888', display: 'block', marginBottom: '4px' }}>Select Customer</label>
        <select 
          value={selectedCust} 
          onChange={e => setSelectedCust(e.target.value)}
          className="search-input-field"
          style={{ width: '100%', background: '#fff' }}
        >
          <option value="">Choose Customer...</option>
          {customers.map(c => <option key={c.id} value={c.id}>{c.name} ({c.plate})</option>)}
        </select>
      </div>

      <div style={{ display: 'flex', gap: '16px', marginBottom: '24px' }}>
        <div style={{ flex: 2 }}>
          <label style={{ fontSize: '12px', color: '#888', display: 'block', marginBottom: '4px' }}>Add Part</label>
          <select 
            value={selectedPart} 
            onChange={e => setSelectedPart(e.target.value)}
            className="search-input-field"
            style={{ width: '100%', background: '#fff' }}
          >
            <option value="">Choose Part...</option>
            {parts.map(p => <option key={p.id} value={p.id}>{p.name} ({p.stock} in stock)</option>)}
          </select>
        </div>
        <div style={{ flex: 1 }}>
          <label style={{ fontSize: '12px', color: '#888', display: 'block', marginBottom: '4px' }}>Quantity</label>
          <input 
            type="number" 
            min="1" 
            value={quantity} 
            onChange={e => setQuantity(e.target.value)}
            className="search-input-field"
            style={{ width: '100%', background: '#fff' }}
          />
        </div>
        <button 
          onClick={handleAddToCart} 
          className="btn-sale-primary" 
          style={{ marginTop: '22px' }}
        >
          Add
        </button>
      </div>

      <div style={{ marginTop: '24px' }}>
        <h3 style={{ fontSize: '14px', marginBottom: '12px' }}>Cart Summary</h3>
        <div style={{ border: '1px solid #EEE', borderRadius: '8px', overflow: 'hidden' }}>
          {cart.map(item => (
            <div key={item.id} style={{ display: 'flex', justifyContent: 'space-between', padding: '12px', borderBottom: '1px solid #EEE' }}>
              <span>{item.name} x {item.quantity}</span>
              <div style={{ display: 'flex', gap: '16px', alignItems: 'center' }}>
                <strong>Rs. {(item.price * item.quantity).toFixed(2)}</strong>
                <button onClick={() => handleRemove(item.id)} style={{ background: 'none', border: 'none', color: '#ef4444', cursor: 'pointer' }}>Remove</button>
              </div>
            </div>
          ))}
          {cart.length === 0 && <div style={{ padding: '20px', textAlign: 'center', opacity: 0.5 }}>Cart is empty.</div>}
        </div>
        <div style={{ marginTop: '16px', textAlign: 'right', fontSize: '18px', fontWeight: 500 }}>
          Total: Rs. {totalAmount.toFixed(2)}
        </div>
      </div>

      <div style={{ marginTop: '24px' }}>
        <label style={{ fontSize: '12px', color: '#888', display: 'block', marginBottom: '4px' }}>Payment Type</label>
        <select 
          value={paymentStatus} 
          onChange={e => setPaymentStatus(e.target.value)}
          className="search-input-field"
          style={{ width: '100%', background: '#fff' }}
        >
          <option value="">Select Status...</option>
          <option value="full-payment">Full Payment</option>
          <option value="half-payment">Half Payment (50%)</option>
          <option value="partial-payment">Partial Payment (10%)</option>
        </select>
      </div>

      <button 
        onClick={handleComplete} 
        disabled={!paymentStatus || cart.length === 0} 
        className="btn-sale-primary" 
        style={{ width: '100%', marginTop: '32px', height: '44px', fontSize: '14px' }}
      >
        Complete Sale & Print Invoice
      </button>
    </div>
  );
};

export default Sales;
