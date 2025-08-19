import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { MapPin, BarChart3, Home, Plus } from 'lucide-react';

const Navbar = () => {
  const location = useLocation();

  const isActive = (path) => {
    return location.pathname === path;
  };

  return (
    <nav className="bg-white shadow-lg border-b">
      <div className="container mx-auto px-4">
        <div className="flex justify-between items-center h-16">
          <div className="flex items-center space-x-4">
            <Link to="/" className="flex items-center space-x-2">
              <MapPin className="h-8 w-8 text-primary-600" />
              <span className="text-xl font-bold text-gray-900">Commute Tracker</span>
            </Link>
          </div>
          
          <div className="flex items-center space-x-1">
            <Link
              to="/"
              className={`px-3 py-2 rounded-md text-sm font-medium flex items-center space-x-1 ${
                isActive('/') 
                  ? 'bg-primary-100 text-primary-700' 
                  : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
              }`}
            >
              <Home className="h-4 w-4" />
              <span>Dashboard</span>
            </Link>
            
            <Link
              to="/trips"
              className={`px-3 py-2 rounded-md text-sm font-medium flex items-center space-x-1 ${
                isActive('/trips') 
                  ? 'bg-primary-100 text-primary-700' 
                  : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
              }`}
            >
              <MapPin className="h-4 w-4" />
              <span>Trips</span>
            </Link>
            
            <Link
              to="/analytics"
              className={`px-3 py-2 rounded-md text-sm font-medium flex items-center space-x-1 ${
                isActive('/analytics') 
                  ? 'bg-primary-100 text-primary-700' 
                  : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
              }`}
            >
              <BarChart3 className="h-4 w-4" />
              <span>Analytics</span>
            </Link>
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
