import React, { useState, useEffect } from 'react';
import { Trash2, Calendar, Clock, MapPin, TrendingUp, Download } from 'lucide-react';
import { formatDate, formatTime, formatDuration, getTrafficLevelColor } from '../utils/formatters';

const Checks = () => {
  const [checks, setChecks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filterTrip, setFilterTrip] = useState('');
  const [filterTraffic, setFilterTraffic] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [sortBy, setSortBy] = useState('recorded_at');
  const [sortOrder, setSortOrder] = useState('desc');
  const [trips, setTrips] = useState([]);

  useEffect(() => {
    fetchChecks();
    fetchTrips();
  }, [filterTrip, filterTraffic, startDate, endDate, sortBy, sortOrder]);

  const fetchTrips = async () => {
    try {
      const response = await fetch('/api/trips');
      if (response.ok) {
        const data = await response.json();
        setTrips(data);
      }
    } catch (error) {
      console.error('Error fetching trips:', error);
    }
  };

  const fetchChecks = async () => {
    try {
      setLoading(true);
      let url = '/api/checks';
      const params = new URLSearchParams();
      
      if (filterTrip) params.append('trip_id', filterTrip);
      if (filterTraffic) params.append('traffic_level', filterTraffic);
      if (startDate) params.append('start_date', startDate);
      if (endDate) params.append('end_date', endDate);
      if (sortBy) params.append('sort_by', sortBy);
      if (sortOrder) params.append('sort_order', sortOrder);
      
      if (params.toString()) {
        url += '?' + params.toString();
      }

      const response = await fetch(url);
      if (response.ok) {
        const data = await response.json();
        setChecks(data);
      } else {
        setError('Failed to fetch checks');
      }
    } catch (error) {
      console.error('Error fetching checks:', error);
      setError('Failed to fetch checks');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (checkId) => {
    if (!window.confirm('Are you sure you want to delete this check?')) {
      return;
    }

    try {
      const response = await fetch(`/api/checks/${checkId}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        // Remove the deleted check from the state
        setChecks(checks.filter(check => check.id !== checkId));
      } else {
        alert('Failed to delete check');
      }
    } catch (error) {
      console.error('Error deleting check:', error);
      alert('Failed to delete check');
    }
  };

  const handleSort = (field) => {
    if (sortBy === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(field);
      setSortOrder('desc');
    }
  };

  const getSortIcon = (field) => {
    if (sortBy !== field) return null;
    return sortOrder === 'asc' ? '↑' : '↓';
  };

  const exportToCSV = () => {
    if (checks.length === 0) {
      alert('No data to export');
      return;
    }

    // Create CSV headers
    const headers = [
      'Date',
      'Time',
      'Trip Name',
      'Origin Address',
      'Destination Address',
      'Duration (minutes)',
      'Distance (km)',
      'Traffic Level',
      'Speed (km/h)'
    ];

    // Create CSV rows
    const csvRows = [
      headers.join(','),
      ...checks.map(check => {
        const speedKmh = Math.round((check.distance_meters / 1000) / (check.duration_seconds / 3600));
        return [
          formatDate(check.recorded_at),
          formatTime(check.recorded_at),
          `"${check.trip_name}"`,
          `"${check.origin_address}"`,
          `"${check.destination_address}"`,
          Math.round(check.duration_seconds / 60),
          Math.round(check.distance_meters / 1000 * 10) / 10,
          check.traffic_level,
          speedKmh
        ].join(',');
      })
    ];

    // Create and download CSV file
    const csvContent = csvRows.join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `travel-time-checks-${formatDate(new Date()).replace(/\//g, '-')}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto"></div>
            <p className="mt-4 text-gray-600">Loading checks...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <p className="text-red-600">{error}</p>
            <button
              onClick={fetchChecks}
              className="mt-4 bg-primary-600 text-white px-4 py-2 rounded-lg hover:bg-primary-700"
            >
              Retry
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Travel Time Checks</h1>
          <p className="mt-2 text-gray-600">
            View and manage all travel time check records
          </p>
        </div>

        {/* Filters */}
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Filter by Trip
              </label>
              <select
                value={filterTrip}
                onChange={(e) => setFilterTrip(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
              >
                <option value="">All Trips</option>
                {trips.map(trip => (
                  <option key={trip.id} value={trip.id}>
                    {trip.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Filter by Traffic Level
              </label>
              <select
                value={filterTraffic}
                onChange={(e) => setFilterTraffic(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
              >
                <option value="">All Traffic Levels</option>
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
                <option value="severe">Severe</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Start Date
              </label>
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                End Date
              </label>
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
              />
            </div>

            <div className="flex items-end">
              <button
                onClick={() => {
                  setFilterTrip('');
                  setFilterTraffic('');
                  setStartDate('');
                  setEndDate('');
                }}
                className="w-full bg-gray-200 text-gray-700 px-4 py-2 rounded-md hover:bg-gray-300"
              >
                Clear Filters
              </button>
            </div>
          </div>
        </div>

        {/* Checks Table */}
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center space-y-2 sm:space-y-0">
              <h2 className="text-lg font-semibold text-gray-900">
                All Checks ({checks.length})
              </h2>
              <button
                onClick={exportToCSV}
                disabled={checks.length === 0}
                className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2 text-sm"
              >
                <Download className="h-4 w-4" />
                <span>Export CSV</span>
              </button>
            </div>
          </div>

          {checks.length === 0 ? (
            <div className="p-8 text-center">
              <Clock className="h-12 w-12 mx-auto text-gray-300 mb-4" />
              <p className="text-gray-500">No checks found</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200 text-sm">
                <thead className="bg-gray-50">
                  <tr>
                    <th
                      className="px-3 lg:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                      onClick={() => handleSort('recorded_at')}
                    >
                      <div className="flex items-center">
                        <Calendar className="h-4 w-4 mr-1" />
                        <span className="hidden sm:inline">Date/Time</span>
                        <span className="sm:hidden">Date</span>
                        {getSortIcon('recorded_at')}
                      </div>
                    </th>
                    <th
                      className="px-3 lg:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                      onClick={() => handleSort('trip_name')}
                    >
                      <div className="flex items-center">
                        <MapPin className="h-4 w-4 mr-1" />
                        Trip {getSortIcon('trip_name')}
                      </div>
                    </th>
                    <th
                      className="px-3 lg:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                      onClick={() => handleSort('duration_seconds')}
                    >
                      <div className="flex items-center">
                        <Clock className="h-4 w-4 mr-1" />
                        Duration {getSortIcon('duration_seconds')}
                      </div>
                    </th>
                    <th
                      className="px-3 lg:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                      onClick={() => handleSort('traffic_level')}
                    >
                      <div className="flex items-center">
                        <TrendingUp className="h-4 w-4 mr-1" />
                        <span className="hidden sm:inline">Traffic Level</span>
                        <span className="sm:hidden">Traffic</span>
                        {getSortIcon('traffic_level')}
                      </div>
                    </th>
                    <th className="px-3 lg:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {checks.map((check) => (
                    <tr key={check.id} className="hover:bg-gray-50">
                      <td className="px-3 lg:px-6 py-4 whitespace-nowrap">
                        <div>
                          <div className="text-sm font-medium text-gray-900">
                            {formatDate(check.recorded_at)}
                          </div>
                          <div className="text-sm text-gray-500">
                            {formatTime(check.recorded_at)}
                          </div>
                        </div>
                      </td>
                      <td className="px-3 lg:px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">
                          <span className="hidden sm:inline">{check.trip_name}</span>
                          <span className="sm:hidden">{check.trip_name.length > 20 ? check.trip_name.substring(0, 20) + '...' : check.trip_name}</span>
                        </div>
                        <div className="text-sm text-gray-500 hidden sm:block">
                          {check.origin_address} → {check.destination_address}
                        </div>
                      </td>
                      <td className="px-3 lg:px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">
                          {formatDuration(check.duration_seconds)}
                        </div>
                        <div className="text-sm text-gray-500">
                          {Math.round(check.distance_meters / 1000 * 10) / 10} km
                        </div>
                      </td>
                      <td className="px-3 lg:px-6 py-4 whitespace-nowrap">
                        <span
                          className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium capitalize"
                          style={{
                            backgroundColor: getTrafficLevelColor(check.traffic_level) + '20',
                            color: getTrafficLevelColor(check.traffic_level)
                          }}
                        >
                          {check.traffic_level}
                        </span>
                      </td>
                      <td className="px-3 lg:px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <button
                          onClick={() => handleDelete(check.id)}
                          className="text-red-600 hover:text-red-900"
                          title="Delete check"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Checks;

