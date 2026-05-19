import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Menu, X } from 'lucide-react';
import '../styles/landing-page.css';

export function LandingPageNavbar() {
  const navigate = useNavigate();
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const handleNavigation = (path) => {
    navigate(path);
    setIsMenuOpen(false);
  };

  return (
    <nav className="landing-navbar">
      <div className="navbar-container">
        {/* Logo */}
        <div className="navbar-logo">
          <button onClick={() => handleNavigation('/')} className="logo-btn">
            <span className="logo-icon">⚙️</span>
            <span className="logo-text">VPMS</span>
          </button>
        </div>

        {/* Navigation Links */}
        <div className={`navbar-menu ${isMenuOpen ? 'active' : ''}`}>
          <button 
            onClick={() => handleNavigation('/')} 
            className="nav-link"
          >
            Home
          </button>
          <button 
            onClick={() => handleNavigation('/login')} 
            className="nav-link"
          >
            Login
          </button>
          <button 
            onClick={() => handleNavigation('/signup')} 
            className="nav-link nav-link-signup"
          >
            Sign Up
          </button>
        </div>

        {/* Mobile Menu Toggle */}
        <button 
          className="mobile-menu-toggle"
          onClick={() => setIsMenuOpen(!isMenuOpen)}
        >
          {isMenuOpen ? <X size={24} /> : <Menu size={24} />}
        </button>
      </div>
    </nav>
  );
}
