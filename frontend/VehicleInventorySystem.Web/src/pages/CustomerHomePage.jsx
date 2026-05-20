import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronRight, AlertCircle, LogOut } from 'lucide-react';
import { apiFetch } from '../services/api';
import '../styles/customer-home.css';

export function CustomerHomePage({ user, onLogout }) {
  const navigate = useNavigate();
  const [parts, setParts] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const loadParts = async () => {
      try {
        const response = await apiFetch('/parts');
        const partsList = Array.isArray(response) ? response : response?.items || response?.Items || [];
        setParts(partsList);
        setError('');
      } catch (err) {
        console.error('Error loading parts:', err);
        setError('Failed to load parts. Please try again later.');
        setParts([]);
      } finally {
        setIsLoading(false);
      }
    };

    loadParts();
  }, []);

  const getStockStatus = (stockLevel) => {
    const stock = Number(stockLevel ?? 0);
    
    if (stock === 0) {
      return { status: 'Out of Stock', color: '#EF4444', bgColor: '#FEE2E2' };
    }
    
    if (stock > 0 && stock < 10) {
      return { status: `Only ${stock} left`, color: '#D97706', bgColor: '#FEF3C7' };
    }
    
    return { status: 'Available', color: '#10B981', bgColor: '#DCFCE7' };
  };

  const handleRequestPart = (partId, partName) => {
    navigate('/customer/new-request', { 
      state: { selectedPartId: partId, selectedPartName: partName } 
    });
  };

  const normalizePart = (part) => {
    const id = part.id ?? part.Id;
    const name = (part.name ?? part.Name ?? 'Unnamed Part');
    const category = part.category ?? part.Category ?? 'Parts';
    const explicitImage = part.imageUrl ?? part.image ?? part.imagePath ?? part.ImageUrl ?? part.Image ?? null;

    const inferImageFromName = (n) => {
      const s = (n || '').toString().toLowerCase();
      if (s.includes('engine') || s.includes('motor') || s.includes('toyota')) return '/images/toyotaengine.jpg';
      if (s.includes('steering') || s.includes('steer')) return '/images/steeringcover.jpg';
      if (s.includes('tire') || s.includes('tyre') || s.includes('tyre')) return '/images/tyree.jpg';
      if (s.includes('wheel') || s.includes('rim')) return '/images/wheel.jpg';
      if (s.includes('mirror')) return '/images/mirror.jpg';
      if (s.includes('grease') || s.includes('oil') || s.includes('lubricant')) return '/images/greaseoil.jpg';
      return null;
    };

    const image = explicitImage || inferImageFromName(name) || inferImageFromName(category) || null;

    return {
      id,
      name,
      category,
      image,
      stockLevel: Number(part.stockLevel ?? part.StockLevel ?? 0),
      price: Number(part.price ?? part.Price ?? 0),
      description: part.description ?? part.Description ?? '',
    };
  };

  const normalizedParts = parts.map(normalizePart);

  return (
    <div className="customer-home-page">
      {/* HEADER */}
      <header className="customer-home-header">
        <div className="customer-home-header-content">
          <div className="customer-home-logo">
            <span className="customer-home-logo-icon">🔧</span>
            <span className="customer-home-logo-text">AutoParts Pro</span>
          </div>
          <div className="customer-home-header-right">
            <span className="customer-home-user-info">Welcome, {user?.name?.split(' ')[0] || 'Customer'}</span>
            <button 
              type="button"
              className="customer-home-logout-btn"
              onClick={onLogout}
              title="Logout"
            >
              <LogOut size={18} />
              Logout
            </button>
          </div>
        </div>
      </header>

      {/* HERO SECTION */}
      <section className="hero-section-home">
        <div className="hero-overlay-home"></div>
        <div className="hero-content-home">
          <h1 className="hero-title-home">Premium Vehicle Parts & Services</h1>
          <p className="hero-subtitle-home">Browse available automotive parts and request special orders easily.</p>
          <div className="hero-buttons-home">
            <button 
              className="hero-button-home"
              onClick={() => document.querySelector('.parts-section-home')?.scrollIntoView({ behavior: 'smooth' })}
            >
              Browse Parts <ChevronRight size={18} />
            </button>
            <button 
              className="hero-button-secondary-home"
              onClick={() => navigate('/customer')}
            >
              Go to Dashboard
            </button>
          </div>
        </div>
      </section>

      {/* OUR PARTS SECTION */}
      <section className="parts-section-home">
        <div className="parts-container-home">
          <div className="section-header-home">
            <h2>Our Parts</h2>
            <p>Explore our available vehicle parts inventory</p>
          </div>

          {isLoading ? (
            <div className="loading-state-home">
              <div className="spinner-home"></div>
              <p>Loading parts...</p>
            </div>
          ) : error ? (
            <div className="error-state-home">
              <AlertCircle size={24} />
              <p>{error}</p>
            </div>
          ) : normalizedParts.length === 0 ? (
            <div className="empty-state-home">
              <p>No parts available at the moment.</p>
            </div>
          ) : (
            <div className="parts-grid-home">
              {normalizedParts.map((part) => {
                const stockStatus = getStockStatus(part.stockLevel);
                
                return (
                  <div key={part.id} className="part-card-home">
                    <div className="part-image-placeholder-home">
                      {part.image ? (
                        <img
                          src={part.image}
                          alt={part.name}
                          className="part-image-home"
                          onError={(e) => { e.currentTarget.style.display = 'none'; }}
                        />
                      ) : (
                        <svg viewBox="0 0 200 200" xmlns="http://www.w3.org/2000/svg">
                          <rect width="200" height="200" fill="#E5E7EB" />
                          <circle cx="100" cy="80" r="30" fill="#9CA3AF" />
                          <path d="M 70 120 Q 100 150 130 120" stroke="#9CA3AF" strokeWidth="3" fill="none" strokeLinecap="round" />
                          <text x="100" y="185" textAnchor="middle" fontSize="14" fill="#6B7280">Image</text>
                        </svg>
                      )}
                    </div>

                    <div className="part-card-content-home">
                      <h3 className="part-name-home">{part.name}</h3>

                      <div className="stock-status-badge-home" style={{ 
                        backgroundColor: stockStatus.bgColor,
                        color: stockStatus.color
                      }}>
                        {stockStatus.status}
                      </div>

                      <div className="part-card-footer-home">
                        <button
                          className="request-button-home"
                          onClick={() => handleRequestPart(part.id, part.name)}
                        >
                          Request Part
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </section>

      {/* FOOTER */}
      <footer className="customer-home-footer">
        <div className="footer-content-home">
          <div className="footer-section-home about">
            <h4>Vehicle Parts & Inventory System</h4>
            <p>Your trusted partner for quality automotive parts and seamless service management.</p>
          </div>

          <div className="footer-section-home links">
            <h4>Quick Links</h4>
            <ul>
              <li><a href="#" onClick={(e) => { e.preventDefault(); navigate('/customer/dashboard'); }}>My Dashboard</a></li>
              <li><a href="#" onClick={(e) => { e.preventDefault(); navigate('/customer/requests'); }}>My Orders</a></li>
              <li><a href="#" onClick={(e) => { e.preventDefault(); navigate('/customer/appointments'); }}>Appointments</a></li>
            </ul>
          </div>

          <div className="footer-section-home contact">
            <h4>Contact Us</h4>
            <p>📧 support@vehicleinventorysystem.com</p>
            <p>📞 +977 (986) 273-8557</p>
            <p>📍 Kamal Pokhari, Kathmandu, Nepal</p>
          </div>
        </div>

        <div className="footer-bottom-home">
          <p>&copy; 2026 Vehicle Parts Selling and Inventory Management System. All Rights Reserved.</p>
        </div>
      </footer>
    </div>
  );
}
