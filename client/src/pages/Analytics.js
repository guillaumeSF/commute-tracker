import React, { useState, useEffect } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar, PieChart, Pie, Cell } from 'recharts';
import { analyticsAPI } from '../services/api';
import toast from 'react-hot-toast';

const Analytics = () => {
  const [overview, setOverview] = useState([]);
  const [trafficTrends, setTrafficTrends] = useState([]);
  const [bestWorstTimes, setBestWorstTimes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedDays, setSelectedDays] = useState(30);

  useEffect(() => {
    fetchAnalytics();
  }, [selectedDays]);

  const fetchAnalytics = async () => {
    try {
      setLoading(true);
      const [overviewRes, trendsRes, timesRes] = await Promise.all([
        analyticsAPI.getOverview({ days: selectedDays }),
        analyticsAPI.getTrafficTrends({ days: 7 }),
        analyticsAPI.getBestWorstTimes({ days: selectedDays })
      ]);
      
      setOverview(overviewRes.data);
      setTrafficTrends(trendsRes.data);
      setBestWorstTimes(timesRes.data);
    } catch (error) {
      console.error('Error fetching analytics:', error);
      toast.error('Failed to load analytics data');
    } finally {
      setLoading(false);
    }
  };

  const formatDuration = (seconds) => {
    const minutes = Math.round(seconds / 60);
    return `${minutes} min`;
  };

  const getTrafficLevelColor = (level) => {
    switch (level) {
      case 'low': return '#10B981';
      case 'medium': return '#F59E0B';
      case 'high': return '#F97316';
      case 'severe': return '#EF4444';
      default: return '#6B7280';
    }
  };

  const COLORS = ['#10B981', '#F59E0B', '#F97316', '#EF4444'];

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
          <h1 className="text-3xl font-bold text-gray-900">Analytics</h1>
          <p className="text-gray-600 mt-2">Insights into your commute patterns</p>
        </div>
        <select
          value={selectedDays}
          onChange={(e) => setSelectedDays(parseInt(e.target.value))}
          className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
        >
          <option value={7}>Last 7 days</option>
          <option value={30}>Last 30 days</option>
          <option value={90}>Last 90 days</option>
        </select>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="text-sm font-medium text-gray-600">Total Trips</h3>
          <p className="text-2xl font-bold text-gray-900">{overview.length}</p>
        </div>
        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="text-sm font-medium text-gray-600">Total Checks</h3>
          <p className="text-2xl font-bold text-gray-900">
            {overview.reduce((sum, trip) => sum + (parseInt(trip.total_checks) || 0), 0)}
          </p>
        </div>
        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="text-sm font-medium text-gray-600">Avg Duration</h3>
          <p className="text-2xl font-bold text-gray-900">
            {overview.length > 0 
              ? formatDuration(overview.reduce((sum, trip) => sum + (parseFloat(trip.avg_duration_seconds) || 0), 0) / overview.length)
              : '0 min'
            }
          </p>
        </div>
        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="text-sm font-medium text-gray-600">Active Trips</h3>
          <p className="text-2xl font-bold text-gray-900">
            {overview.filter(trip => parseInt(trip.total_checks) > 0).length}
          </p>
        </div>
      </div>

      {/* Traffic Level Distribution */}
      {overview.length > 0 && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-white p-6 rounded-lg shadow">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Traffic Level Distribution</h3>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={[
                    { name: 'Low', value: overview.reduce((sum, trip) => sum + (parseInt(trip.low_traffic_count) || 0), 0) },
                    { name: 'Medium', value: overview.reduce((sum, trip) => sum + (parseInt(trip.medium_traffic_count) || 0), 0) },
                    { name: 'High', value: overview.reduce((sum, trip) => sum + (parseInt(trip.high_traffic_count) || 0), 0) },
                    { name: 'Severe', value: overview.reduce((sum, trip) => sum + (parseInt(trip.severe_traffic_count) || 0), 0) }
                  ].filter(item => item.value > 0)}
                  cx="50%"
                  cy="50%"
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                  label={({ name, value }) => `${name}: ${value}`}
                >
                  {COLORS.map((color, index) => (
                    <Cell key={`cell-${index}`} fill={color} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>

          {/* Best/Worst Times */}
          <div className="bg-white p-6 rounded-lg shadow">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Best & Worst Times</h3>
            <div className="space-y-4">
              {bestWorstTimes.map((trip) => (
                <div key={trip.name} className="border-b border-gray-200 pb-4 last:border-b-0">
                  <h4 className="font-medium text-gray-900 mb-2">{trip.name}</h4>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <p className="text-green-600 font-medium">Best Time</p>
                      <p>{trip.best_hour?.hour || 'N/A'}:00 ({trip.best_hour?.avg_duration_minutes || 'N/A'} min)</p>
                    </div>
                    <div>
                      <p className="text-red-600 font-medium">Worst Time</p>
                      <p>{trip.worst_hour?.hour || 'N/A'}:00 ({trip.worst_hour?.avg_duration_minutes || 'N/A'} min)</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Trip Performance */}
      {overview.length > 0 && (
        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Trip Performance</h3>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Trip</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Avg Duration</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Min Duration</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Max Duration</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Total Checks</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Traffic Distribution</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {overview.map((trip) => (
                  <tr key={trip.id}>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">{trip.name}</div>
                      <div className="text-sm text-gray-500">
                        {trip.origin_address} → {trip.destination_address}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {formatDuration(trip.avg_duration_seconds || 0)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {formatDuration(trip.min_duration_seconds || 0)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {formatDuration(trip.max_duration_seconds || 0)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {trip.total_checks || 0}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex space-x-1">
                        {trip.low_traffic_count > 0 && (
                          <div className="w-3 h-3 bg-green-500 rounded" title={`Low: ${trip.low_traffic_count}`}></div>
                        )}
                        {trip.medium_traffic_count > 0 && (
                          <div className="w-3 h-3 bg-yellow-500 rounded" title={`Medium: ${trip.medium_traffic_count}`}></div>
                        )}
                        {trip.high_traffic_count > 0 && (
                          <div className="w-3 h-3 bg-orange-500 rounded" title={`High: ${trip.high_traffic_count}`}></div>
                        )}
                        {trip.severe_traffic_count > 0 && (
                          <div className="w-3 h-3 bg-red-500 rounded" title={`Severe: ${trip.severe_traffic_count}`}></div>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {overview.length === 0 && (
        <div className="bg-white p-12 rounded-lg shadow text-center">
          <div className="text-gray-400 mb-4">
            <svg className="mx-auto h-12 w-12" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
            </svg>
          </div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">No data available</h3>
          <p className="text-gray-500">Create some trips and wait for data to accumulate to see analytics.</p>
        </div>
      )}
    </div>
  );
};

export default Analytics;
