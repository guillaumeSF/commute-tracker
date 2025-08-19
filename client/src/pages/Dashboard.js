import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { MapPin, Clock, TrendingUp, AlertTriangle, Plus } from 'lucide-react';
import { analyticsAPI } from '../services/api';
import toast from 'react-hot-toast';

const Dashboard = () => {
  const [overview, setOverview] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchOverview();
  }, []);

  const fetchOverview = async () => {
    try {
      setLoading(true);
      const response = await analyticsAPI.getOverview({ days: 7 });
      setOverview(response.data);
    } catch (error) {
      console.error('Error fetching overview:', error);
      toast.error('Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  };

  const getTrafficLevelColor = (level) => {
    switch (level) {
      case 'low': return 'text-green-600 bg-green-100';
      case 'medium': return 'text-yellow-600 bg-yellow-100';
      case 'high': return 'text-orange-600 bg-orange-100';
      case 'severe': return 'text-red-600 bg-red-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  const formatDuration = (seconds) => {
    const minutes = Math.round(seconds / 60);
    return `${minutes} min`;
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
          <p className="text-gray-600 mt-2">Overview of your commute tracking</p>
        </div>
        <Link
          to="/trips"
          className="bg-primary-600 text-white px-4 py-2 rounded-lg hover:bg-primary-700 flex items-center space-x-2"
        >
          <Plus className="h-4 w-4" />
          <span>Add Trip</span>
        </Link>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-lg shadow">
          <div className="flex items-center">
            <div className="p-2 bg-blue-100 rounded-lg">
              <MapPin className="h-6 w-6 text-blue-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Active Trips</p>
              <p className="text-2xl font-bold text-gray-900">
                {overview.filter(trip => trip.is_active).length}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow">
          <div className="flex items-center">
            <div className="p-2 bg-green-100 rounded-lg">
              <Clock className="h-6 w-6 text-green-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Total Checks</p>
              <p className="text-2xl font-bold text-gray-900">
                {overview
                  .filter(trip => trip.is_active)
                  .reduce((sum, trip) => sum + (parseInt(trip.total_checks) || 0), 0)
                }
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow">
          <div className="flex items-center">
            <div className="p-2 bg-purple-100 rounded-lg">
              <TrendingUp className="h-6 w-6 text-purple-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Avg Duration</p>
              <p className="text-2xl font-bold text-gray-900">
                {(() => {
                  const activeTripsWithData = overview.filter(trip => trip.is_active && trip.total_checks > 0);
                  if (activeTripsWithData.length === 0) return '0 min';
                  
                  // Calculate weighted average based on number of checks
                  const totalChecks = activeTripsWithData.reduce((sum, trip) => sum + (parseInt(trip.total_checks) || 0), 0);
                  const totalDuration = activeTripsWithData.reduce((sum, trip) => {
                    return sum + ((parseFloat(trip.avg_duration_seconds) || 0) * (parseInt(trip.total_checks) || 0));
                  }, 0);
                  
                  const avgDuration = totalChecks > 0 ? totalDuration / totalChecks : 0;
                  return formatDuration(avgDuration);
                })()}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Trips Overview */}
      <div className="bg-white rounded-lg shadow">
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900">Recent Trips</h2>
        </div>
        <div className="divide-y divide-gray-200">
          {overview.length === 0 ? (
            <div className="p-6 text-center text-gray-500">
              <MapPin className="h-12 w-12 mx-auto text-gray-300 mb-4" />
              <p>No trips found. Create your first trip to start tracking!</p>
              <Link
                to="/trips"
                className="inline-block mt-4 bg-primary-600 text-white px-4 py-2 rounded-lg hover:bg-primary-700"
              >
                Create Trip
              </Link>
            </div>
          ) : (
            overview.slice(0, 5).map((trip) => (
              <div key={trip.id} className="p-6 hover:bg-gray-50">
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <div className="flex items-center space-x-3">
                      <h3 className="text-lg font-medium text-gray-900">
                        <Link to={`/trips/${trip.id}`} className="hover:text-primary-600">
                          {trip.name}
                        </Link>
                      </h3>
                      {trip.total_checks === 0 && (
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                          <AlertTriangle className="h-3 w-3 mr-1" />
                          No data
                        </span>
                      )}
                    </div>
                    <p className="text-sm text-gray-600 mt-1">
                      {trip.origin_address} → {trip.destination_address}
                    </p>
                    {trip.total_checks > 0 && (
                      <div className="flex items-center space-x-4 mt-2 text-sm text-gray-500">
                        <span>Avg: {formatDuration(trip.avg_duration_seconds)}</span>
                        <span>Min: {formatDuration(trip.min_duration_seconds)}</span>
                        <span>Max: {formatDuration(trip.max_duration_seconds)}</span>
                        <span>{trip.total_checks} checks</span>
                      </div>
                    )}
                  </div>
                  <div className="flex items-center space-x-2">
                    <Link
                      to={`/trips/${trip.id}`}
                      className="text-primary-600 hover:text-primary-700 text-sm font-medium"
                    >
                      View Details
                    </Link>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
        {overview.length > 5 && (
          <div className="px-6 py-4 border-t border-gray-200">
            <Link
              to="/trips"
              className="text-primary-600 hover:text-primary-700 text-sm font-medium"
            >
              View all trips →
            </Link>
          </div>
        )}
      </div>
    </div>
  );
};

export default Dashboard;
