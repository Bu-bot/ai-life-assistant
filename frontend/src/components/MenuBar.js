// frontend/src/components/MenuBar.js
import React, { useState } from 'react';

const MenuBar = ({ currentPage, onPageChange, recordingsCount }) => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const menuItems = [
    {
      id: 'home',
      label: 'Home',
      icon: '🏠',
      description: 'Record & Chat'
    },
    {
      id: 'tasks',
      label: 'Tasks',
      icon: '✅',
      description: 'Manage Tasks'
    },
    {
      id: 'analytics',
      label: 'Analytics',
      icon: '📊',
      description: 'Life Insights'
    },
    {
      id: 'usage',
      label: 'Usage',
      icon: '💰',
      description: 'Cost Tracking'
    },
    {
      id: 'settings',
      label: 'Settings',
      icon: '⚙️',
      description: 'App Settings'
    }
  ];

  const handleMenuClick = (pageId) => {
    onPageChange(pageId);
    setIsMobileMenuOpen(false); // Close mobile menu after selection
  };

  const toggleMobileMenu = () => {
    setIsMobileMenuOpen(!isMobileMenuOpen);
  };

  return (
    <nav className="menu-bar">
      <div className="menu-container">
        {/* Logo/Brand */}
        <div className="menu-brand">
          <span className="brand-icon">🎙️</span>
          <span className="brand-text">AI Life Assistant</span>
          <span className="brand-badge">{recordingsCount}</span>
        </div>

        {/* Desktop Menu */}
        <div className="menu-items desktop-menu">
          {menuItems.map(item => (
            <button
              key={item.id}
              className={`menu-item ${currentPage === item.id ? 'active' : ''}`}
              onClick={() => handleMenuClick(item.id)}
              title={item.description}
            >
              <span className="menu-icon">{item.icon}</span>
              <span className="menu-label">{item.label}</span>
            </button>
          ))}
        </div>

        {/* Mobile Menu Toggle */}
        <button 
          className="mobile-menu-toggle"
          onClick={toggleMobileMenu}
          aria-label="Toggle menu"
        >
          <span className={`hamburger ${isMobileMenuOpen ? 'open' : ''}`}>
            <span></span>
            <span></span>
            <span></span>
          </span>
        </button>
      </div>

      {/* Mobile Menu Dropdown */}
      {isMobileMenuOpen && (
        <div className="mobile-menu">
          <div className="mobile-menu-items">
            {menuItems.map(item => (
              <button
                key={item.id}
                className={`mobile-menu-item ${currentPage === item.id ? 'active' : ''}`}
                onClick={() => handleMenuClick(item.id)}
              >
                <span className="menu-icon">{item.icon}</span>
                <div className="menu-content">
                  <span className="menu-label">{item.label}</span>
                  <span className="menu-description">{item.description}</span>
                </div>
              </button>
            ))}
          </div>
        </div>
      )}
    </nav>
  );
};

export default MenuBar;