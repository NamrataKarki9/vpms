import React from 'react';

function Footer() {
  return (
    <footer className="main-footer">
      <div className="footer-content">
        <div className="footer-section about">
          <h4>Vehicle Inventory System</h4>
          <p>Streamlining vehicle services and inventory management since 2026.</p>
        </div>

        <div className="footer-section links">
          <h4>Quick Links</h4>
          <ul>
            <li><a href="#about">About Center</a></li>
            <li><a href="#services">Our Services</a></li>
            <li><a href="#terms">Terms of Trade</a></li>
          </ul>
        </div>

        <div className="footer-section contact">
          <h4>Contact Us</h4>
          <p>📧 support@vehicleinventorysystem.com</p>
          <p>📞 +977 (986) 273-8557</p>
          <p>📍 Kamal Pokhari, Kathmandu, Nepal</p>
        </div>
      </div>
      <div className="footer-bottom">
        <p>&copy; 2026 Vehicle Parts Selling and Inventory Management System. All Rights Reserved.</p>
      </div>
    </footer>
  );
}

export default Footer;
