import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { MapPin, BarChart3, Home, Plus, Clock, Menu, X } from 'lucide-react';

const Navbar = () => {
  const location = useLocation();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const isActive = (path) => {
    return location.pathname === path;
  };

  const toggleMobileMenu = () => {
    setIsMobileMenuOpen(!isMobileMenuOpen);
  };

  const closeMobileMenu = () => {
    setIsMobileMenuOpen(false);
  };

  const navItems = [
    { path: '/', icon: Home, label: 'Dashboard' },
    { path: '/trips', icon: MapPin, label: 'Trips' },
    { path: '/analytics', icon: BarChart3, label: 'Analytics' },
    { path: '/checks', icon: Clock, label: 'Checks' }
  ];

  return (
    <nav className="bg-white shadow-lg border-b">
      <div className="container mx-auto px-4">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <div className="flex items-center space-x-4">
            <Link to="/" className="flex items-center space-x-2" onClick={closeMobileMenu}>
              <MapPin className="h-8 w-8 text-primary-600" />
              <span className="text-xl font-bold text-gray-900">Commute Tracker</span>
            </Link>
          </div>
          
          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center space-x-1">
            {navItems.map((item) => {
              const Icon = item.icon;
              return (
                <Link
                  key={item.path}
                  to={item.path}
                  className={`px-3 py-2 rounded-md text-sm font-medium flex items-center space-x-1 ${
                    isActive(item.path) 
                      ? 'bg-primary-100 text-primary-700' 
                      : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
                  }`}
                >
                  <Icon className="h-4 w-4" />
                  <span>{item.label}</span>
                </Link>
              );
            })}
          </div>

          {/* Mobile menu button */}
          <div className="md:hidden">
            <button
              onClick={toggleMobileMenu}
              className="inline-flex items-center justify-center p-2 rounded-md text-gray-600 hover:text-gray-900 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-primary-500"
              aria-expanded="false"
            >
              <span className="sr-only">Open main menu</span>
              {isMobileMenuOpen ? (
                <X className="block h-6 w-6" aria-hidden="true" />
              ) : (
                <Menu className="block h-6 w-6" aria-hidden="true" />
              )}
            </button>
          </div>
        </div>

        {/* Mobile Navigation */}
        <div className={`md:hidden ${isMobileMenuOpen ? 'block' : 'hidden'}`}>
          <div className="px-2 pt-2 pb-3 space-y-1 sm:px-3 bg-white border-t">
            {navItems.map((item) => {
              const Icon = item.icon;
              return (
                <Link
                  key={item.path}
                  to={item.path}
                  onClick={closeMobileMenu}
                  className={`block px-3 py-2 rounded-md text-base font-medium flex items-center space-x-2 ${
                    isActive(item.path) 
                      ? 'bg-primary-100 text-primary-700' 
                      : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
                  }`}
                >
                  <Icon className="h-5 w-5" />
                  <span>{item.label}</span>
                </Link>
              );
            })}
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
