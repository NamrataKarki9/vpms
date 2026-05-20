import React from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Star, 
  Zap, 
  Shield, 
  Headphones, 
  Truck, 
  CheckCircle,
  Mail,
  Send
} from 'lucide-react';
import { LandingPageNavbar } from '../components/LandingPageNavbar';
import '../styles/landing-page.css';

export function LandingPage() {
  const navigate = useNavigate();
  const [emailSubscribe, setEmailSubscribe] = React.useState('');
  const [subscribeError, setSubscribeError] = React.useState('');
  const [subscribeSuccess, setSubscribeSuccess] = React.useState(false);

  const handleSubscribe = (e) => {
    e.preventDefault();
    if (!emailSubscribe.trim()) {
      setSubscribeError('Please enter your email');
      return;
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(emailSubscribe)) {
      setSubscribeError('Please enter a valid email');
      return;
    }
    setSubscribeSuccess(true);
    setSubscribeError('');
    setEmailSubscribe('');
    setTimeout(() => setSubscribeSuccess(false), 3000);
  };

  const products = [
    { id: 1, name: 'Bike Mirror', description: '⭐⭐⭐⭐⭐', image: '/images/bikemirror.jpg' },
    { id: 2, name: 'Steering Wheel', description: '⭐⭐⭐⭐⭐', image: '/images/steeringwheel.jpg' },
    { id: 3, name: 'Chain and Sprocket', description: '⭐⭐⭐⭐⭐', image: '/images/Chain&SprocketKit.jpg' },
    { id: 4, name: 'Motorcycle Tyres', description: '⭐⭐⭐⭐⭐', image: '/images/MotorcycleTyres.jpg' },
    { id: 5, name: 'Premium Car Seat', description: '⭐⭐⭐⭐⭐', image: '/images/premiuimcarseat.jpg' },
  ];

  const products2 = [
    { id: 6, name: 'Car Tyre', description: '⭐⭐⭐⭐⭐', image: '/images/cartyre.jpg'},
    { id: 7, name: 'Car Headlight', description: '⭐⭐⭐⭐⭐', image: '/images/headlight.jpg' },
    { id: 8, name: 'Air Filter', description: '⭐⭐⭐⭐⭐', image: '/images/airfilter.jpg' },
    { id: 9, name: 'AC Control Panel', description: '⭐⭐⭐⭐⭐', image: '/images/accontrol.jpg' },
    { id: 10, name: 'Brake', description: '⭐⭐⭐⭐⭐', image: '/images/brakes.jpg' },
  ];

  return (
    <div className="landing-page">
      <LandingPageNavbar />

      {/*  HERO SECTION  */}
      <section className="hero-section">
        <div className="hero-overlay"></div>
        <img 
          className="hero-image" 
          src="/images/mainimage.jpg" 
          alt="Automotive Parts" 
        />
        <div className="hero-content">
          <h1 className="hero-title">Premium Vehicle Parts & Service Solutions</h1>
          <p className="hero-subtitle">Quality parts, expert service, and seamless inventory management</p>
          <button 
            className="hero-button"
            onClick={() => navigate('/login')}
          >
            Explore Services
          </button>
        </div>
      </section>

      {/*  PROMO CARDS SECTION */}
      <section className="promo-cards-section">
        <div className="promo-cards-container">
          {/* Card 1: Quality Vehicle Parts */}
          <div className="promo-card">
            <div className="promo-card-image">
              <img src="/images/qualityservice.jpg" alt="Quality Parts" />
            </div>
            <div className="promo-card-content">
              <h3>Quality Vehicle Parts</h3>
              <p>Genuine, certified automotive components for all makes and models</p>
              <button className="promo-card-button">View Parts</button>
            </div>
          </div>

          {/* Card 2: Service Booking */}
          <div className="promo-card">
            <div className="promo-card-image">
              <img src="/images/servicebooking.jpg" alt="Service Booking" />
            </div>
            <div className="promo-card-content">
              <h3>Service Booking</h3>
              <p>Schedule professional maintenance and repair services online</p>
              <button className="promo-card-button">Book Service</button>
            </div>
          </div>

          {/* Card 3: Customer Support */}
          <div className="promo-card">
            <div className="promo-card-image">
              <img src="/images/customerservice.jpg" alt="Support" />
            </div>
            <div className="promo-card-content">
              <h3>Customer Support</h3>
              <p>24/7 expert assistance for all your automotive needs</p>
              <button className="promo-card-button">Get Help</button>
            </div>
          </div>
        </div>
      </section>

      {/*  ALL KINDS OF PARTS SECTION */}
      <section className="all-parts-section">
        <div className="all-parts-container">
          <div className="all-parts-content">
            <h2>All Kinds Of Parts That You Need Can Find Here</h2>
            <button 
              className="all-parts-button"
              onClick={() => navigate('/login')}
            >
              SHOP NOW
            </button>
          </div>
        </div>
        <img src="/images/shop3.jpg" alt="Mechanics Working" className="all-parts-bg-image" />
        <div className="all-parts-bg-image-overlay"></div>
      </section>

      {/*  SERVICE BENEFITS SECTION  */}
      <section className="service-benefits-section">
        <div className="benefits-container">
          <div className="benefit-block">
            <Zap className="benefit-icon" />
            <h3>Fast Service</h3>
            <p>Quick turnaround times on all parts and services</p>
          </div>

          <div className="benefit-block">
            <CheckCircle className="benefit-icon" />
            <h3>Genuine Parts</h3>
            <p>100% authentic automotive components verified</p>
          </div>

          <div className="benefit-block">
            <Headphones className="benefit-icon" />
            <h3>Online Support</h3>
            <p>Instant help through chat, email, and phone</p>
          </div>
        </div>
      </section>

      {/*  BEST SELLERS / POPULAR PARTS SECTION */}
      <section className="popular-parts-section">
        <div className="section-header">
          <h2>Best Sellers</h2>
          <p>Premium parts chosen by our valued customers</p>
        </div>

        <div className="products-grid">
          {products.map((product) => (
            <div key={product.id} className="product-card">
              <div className="product-image">
                <img src={product.image} alt={product.name} />
              </div>
              <div className="product-info">
                <h4>{product.name}</h4>
                <div className="product-rating">{product.description}</div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* MAIN SERVICE PROMO SECTION  */}
      <section className="service-promo-section">
        <div className="service-promo-content">
          <h2>All kinds of vehicle parts and services available here</h2>
          <p>Complete inventory for automotive maintenance and upgrades</p>
          <button 
            className="service-promo-button"
            onClick={() => navigate('/login')}
          >
            Book Service
          </button>
        </div>
        <div className="service-promo-image">
          <img src="/images/vehicleservice.jpg" alt="Vehicle Service" />
        </div>
      </section>

      {/*  PRODUCTS COLLECTION SECTION  */}
      <section className="products-collection-section">
        <div className="section-header">
          <h2>Our Products</h2>
          <p>Browse our extensive collection of quality parts</p>
        </div>

        <div className="products-grid">
          {products2.map((product) => (
            <div key={product.id} className="product-card">
              <div className="product-image">
                <img src={product.image} alt={product.name} />
              </div>
              <div className="product-info">
                <h4>{product.name}</h4>
                <div className="product-rating">{product.description}</div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/*  FOOTER  */}
      <footer className="landing-footer">
        <div className="footer-content">
          {/* Footer Column 1 - About */}
          <div className="footer-column">
            <div className="footer-logo">
              <span className="footer-logo-icon">⚙️</span>
              <span className="footer-logo-text">VPMS</span>
            </div>
            <p className="footer-description">
              Your trusted partner for premium vehicle parts and professional service solutions.
            </p>
          </div>

          {/* Footer Column 2 - Navigation */}
          <div className="footer-column">
            <h4>Navigation</h4>
            <ul className="footer-links">
              <li><button className="footer-link-btn" onClick={() => window.scrollTo(0, 0)}>Home</button></li>
              <li><button className="footer-link-btn" onClick={() => navigate('/login')}>Login</button></li>
              <li><button className="footer-link-btn" onClick={() => navigate('/signup')}>Sign Up</button></li>
            </ul>
          </div>

          {/* Footer Column 3 - Contact */}
          <div className="footer-column">
            <h4>Contact Information</h4>
            <ul className="footer-contact">
              <li>📧 support@vpms.com</li>
              <li>📞 01-500687 HELP</li>
              <li>📍 Vehicle Parts, Kathmandu, Nepal</li>
            </ul>
          </div>

          {/* Footer Column 4 - Hours */}
          <div className="footer-column">
            <h4>Business Hours</h4>
            <ul className="footer-hours">
              <li>Monday - Friday: 8AM - 6PM</li>
              <li>Saturday: 9AM - 4PM</li>
              <li>Sunday: Closed</li>
            </ul>
          </div>
        </div>

        <div className="footer-bottom">
          <p>&copy; 2026 Vehicle Parts Management System. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}
