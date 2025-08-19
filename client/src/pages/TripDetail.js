import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar, PieChart, Pie, Cell } from 'recharts';
import { tripsAPI, analyticsAPI } from '../services/api';
import toast from 'react-hot-toast';
import { ArrowLeft, Clock, MapPin, TrendingUp, Edit, Calendar, Settings, RefreshCw } from 'lucide-react';
import TripForm from '../components/TripForm';
import { formatCronSchedule, formatDuration, formatDate, formatTime, getTrafficLevelColor, getNextScheduledCheck, formatNextCheck } from '../utils/formatters';

const TripDetail = () => {
  const { id } = useParams();
  const [trip, setTrip] = useState(null);
  const [analytics, setAnalytics] = useState(null);
  const [travelTimes, setTravelTimes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedDays, setSelectedDays] = useState(30);
  const [showEditForm, setShowEditForm] = useState(false);
  const [checkingNow, setCheckingNow] = useState(false);

  useEffect(() => {
    fetchTripData();
  }, [id, selectedDays]);

  const fetchTripData = async () => {
    try {
      setLoading(true);
      const [tripRes, analyticsRes, travelTimesRes] = await Promise.all([
        tripsAPI.getById(id),
        analyticsAPI.getTripAnalytics(id, { days: selectedDays }),
        tripsAPI.getTravelTimes(id, { days: selectedDays })
      ]);
      
      setTrip(tripRes.data);
      setAnalytics(analyticsRes.data);
      setTravelTimes(travelTimesRes.data);
    } catch (error) {
      console.error('Error fetching trip data:', error);
      toast.error('Failed to load trip data');
    } finally {
      setLoading(false);
    }
  };

  const handleCheckNow = async () => {
    try {
      setCheckingNow(true);
      await tripsAPI.checkNow(id);
      toast.success('Travel time checked successfully');
      fetchTripData();
    } catch (error) {
      console.error('Error checking travel time:', error);
      toast.error('Failed to check travel time. Please try again.');
    } finally {
      setCheckingNow(false);
    }
  };

  const handleUpdateTrip = async (tripData) => {
    try {
      await tripsAPI.update(id, tripData);
      toast.success('Trip updated successfully');
      setShowEditForm(false);
      fetchTripData();
    } catch (error) {
      console.error('Error updating trip:', error);
      toast.error('Failed to update trip');
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

  if (!trip) {
    return (
      <div className="text-center py-12">
        <h2 className="text-2xl font-bold text-gray-900 mb-4">Trip not found</h2>
        <Link to="/trips" className="text-primary-600 hover:text-primary-700">
          Back to trips
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <Link
            to="/trips"
            className="text-gray-400 hover:text-gray-600"
          >
            <ArrowLeft className="h-6 w-6" />
          </Link>
          <div>
            <h1 className="text-3xl font-bold text-gray-900">{trip.name}</h1>
            <p className="text-gray-600 mt-1">
              {trip.origin_address} → {trip.destination_address}
            </p>
          </div>
        </div>
        <div className="flex items-center space-x-3">
          <select
            value={selectedDays}
            onChange={(e) => setSelectedDays(parseInt(e.target.value))}
            className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
          >
            <option value={7}>Last 7 days</option>
            <option value={30}>Last 30 days</option>
            <option value={90}>Last 90 days</option>
          </select>
          <button
            onClick={() => setShowEditForm(true)}
            className="bg-gray-600 text-white px-4 py-2 rounded-lg hover:bg-gray-700 flex items-center space-x-2"
          >
            <Edit className="h-4 w-4" />
            <span>Edit</span>
          </button>
          <button
            onClick={handleCheckNow}
            disabled={checkingNow}
            className="bg-primary-600 text-white px-4 py-2 rounded-lg hover:bg-primary-700 flex items-center space-x-2 disabled:opacity-50"
          >
            {checkingNow ? (
              <RefreshCw className="h-4 w-4 animate-spin" />
            ) : (
              <Clock className="h-4 w-4" />
            )}
            <span>{checkingNow ? 'Checking...' : 'Check Now'}</span>
          </button>
        </div>
      </div>

      {/* Trip Form Modal */}
      {showEditForm && (
        <TripForm
          trip={trip}
          onSubmit={handleUpdateTrip}
          onCancel={() => setShowEditForm(false)}
        />
      )}

      {/* Trip Info */}
      <div className="bg-white p-6 rounded-lg shadow">
        <div className="grid grid-cols-1 md:grid-cols-5 gap-6">
          <div>
            <h3 className="text-sm font-medium text-gray-600 flex items-center">
              <Calendar className="h-4 w-4 mr-1" />
              Schedule
            </h3>
            <p className="text-lg font-semibold text-gray-900">{formatCronSchedule(trip.schedule_cron)}</p>
            <p className="text-xs text-gray-500 mt-1">Raw: {trip.schedule_cron}</p>
          </div>
          <div>
            <h3 className="text-sm font-medium text-gray-600 flex items-center">
              <Settings className="h-4 w-4 mr-1" />
              Status
            </h3>
            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
              trip.is_active 
                ? 'bg-green-100 text-green-800' 
                : 'bg-gray-100 text-gray-800'
            }`}>
              {trip.is_active ? 'Active' : 'Paused'}
            </span>
          </div>
          <div>
            <h3 className="text-sm font-medium text-gray-600 flex items-center">
              <Clock className="h-4 w-4 mr-1" />
              Next Check
            </h3>
            {trip.is_active ? (
              <>
                <p className="text-lg font-semibold text-gray-900">
                  {formatNextCheck(getNextScheduledCheck(trip.schedule_cron))}
                </p>
                <p className="text-xs text-gray-500">
                  {getNextScheduledCheck(trip.schedule_cron) ? 
                    formatDate(getNextScheduledCheck(trip.schedule_cron)) + ' ' + formatTime(getNextScheduledCheck(trip.schedule_cron)) : 
                    'Not scheduled'
                  }
                </p>
              </>
            ) : (
              <p className="text-lg font-semibold text-gray-400">Paused</p>
            )}
          </div>
          <div>
            <h3 className="text-sm font-medium text-gray-600">Created</h3>
            <p className="text-lg font-semibold text-gray-900">{formatDate(trip.created_at)}</p>
            <p className="text-xs text-gray-500">{formatTime(trip.created_at)}</p>
          </div>
          <div>
            <h3 className="text-sm font-medium text-gray-600">Last Updated</h3>
            <p className="text-lg font-semibold text-gray-900">{formatDate(trip.updated_at)}</p>
            <p className="text-xs text-gray-500">{formatTime(trip.updated_at)}</p>
          </div>
        </div>
      </div>

      {/* Summary Stats */}
      {analytics && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <div className="bg-white p-6 rounded-lg shadow">
            <div className="flex items-center">
              <div className="p-2 bg-blue-100 rounded-lg">
                <Clock className="h-6 w-6 text-blue-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Total Checks</p>
                <p className="text-2xl font-bold text-gray-900">{analytics.summary.total_checks}</p>
              </div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-lg shadow">
            <div className="flex items-center">
              <div className="p-2 bg-green-100 rounded-lg">
                <TrendingUp className="h-6 w-6 text-green-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Avg Duration</p>
                <p className="text-2xl font-bold text-gray-900">{analytics.summary.avg_duration_minutes} min</p>
              </div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-lg shadow">
            <div className="flex items-center">
              <div className="p-2 bg-yellow-100 rounded-lg">
                <MapPin className="h-6 w-6 text-yellow-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Min Duration</p>
                <p className="text-2xl font-bold text-gray-900">{analytics.summary.min_duration_minutes} min</p>
              </div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-lg shadow">
            <div className="flex items-center">
              <div className="p-2 bg-red-100 rounded-lg">
                <MapPin className="h-6 w-6 text-red-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Max Duration</p>
                <p className="text-2xl font-bold text-gray-900">{analytics.summary.max_duration_minutes} min</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Charts */}
      {analytics && travelTimes.length > 0 && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Travel Time Trend */}
          <div className="bg-white p-6 rounded-lg shadow">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Travel Time Trend</h3>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={travelTimes.slice(-20)}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis 
                  dataKey="recorded_at" 
                  tickFormatter={(value) => formatTime(value)}
                  angle={-45}
                  textAnchor="end"
                  height={80}
                />
                <YAxis tickFormatter={(value) => formatDuration(value)} />
                <Tooltip 
                  labelFormatter={(value) => formatTime(value)}
                  formatter={(value) => [formatDuration(value), 'Duration']}
                />
                <Line 
                  type="monotone" 
                  dataKey="duration_seconds" 
                  stroke="#3B82F6" 
                  strokeWidth={2}
                  dot={{ fill: '#3B82F6', strokeWidth: 2, r: 4 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>

          {/* Hourly Averages */}
          <div className="bg-white p-6 rounded-lg shadow">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Hourly Averages</h3>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={analytics.hourly_data}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="hour" />
                <YAxis tickFormatter={(value) => formatDuration(value)} />
                <Tooltip formatter={(value) => [formatDuration(value), 'Avg Duration']} />
                <Bar dataKey="avg_duration_seconds" fill="#3B82F6" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {/* Traffic Distribution */}
      {analytics && analytics.traffic_distribution.length > 0 && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-white p-6 rounded-lg shadow">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Traffic Level Distribution</h3>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={analytics.traffic_distribution.map(item => ({
                    name: item.traffic_level.charAt(0).toUpperCase() + item.traffic_level.slice(1),
                    value: item.count
                  }))}
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

          <div className="bg-white p-6 rounded-lg shadow">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Traffic Level Breakdown</h3>
            <div className="space-y-4">
              {analytics.traffic_distribution.map((item) => (
                <div key={item.traffic_level} className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div 
                      className="w-4 h-4 rounded-full"
                      style={{ backgroundColor: getTrafficLevelColor(item.traffic_level) }}
                    ></div>
                    <span className="text-sm font-medium capitalize">{item.traffic_level}</span>
                  </div>
                  <div className="text-right">
                    <div className="text-lg font-bold">{item.count}</div>
                    <div className="text-xs text-gray-500">{formatDuration(item.avg_duration_seconds)} avg</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Recent Travel Times */}
      {travelTimes.length > 0 && (
        <div className="bg-white rounded-lg shadow">
          <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-center">
            <h3 className="text-lg font-semibold text-gray-900">Recent Travel Times</h3>
            <span className="text-sm text-gray-500">Showing last {Math.min(travelTimes.length, 10)} records</span>
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Date & Time</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Duration</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Distance</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Traffic Level</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Speed</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {travelTimes.slice(0, 10).map((time) => {
                  const speedKmh = Math.round((time.distance_meters / 1000) / (time.duration_seconds / 3600));
                  return (
                    <tr key={time.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        <div>{formatDate(time.recorded_at)}</div>
                        <div className="text-gray-500">{formatTime(time.recorded_at)}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {formatDuration(time.duration_seconds)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {Math.round(time.distance_meters / 1000 * 10) / 10} km
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span 
                          className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium`}
                          style={{ 
                            backgroundColor: getTrafficLevelColor(time.traffic_level) + '20',
                            color: getTrafficLevelColor(time.traffic_level)
                          }}
                        >
                          {time.traffic_level}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {speedKmh} km/h
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {travelTimes.length === 0 && (
        <div className="bg-white p-12 rounded-lg shadow text-center">
          <div className="text-gray-400 mb-4">
            <Clock className="mx-auto h-12 w-12" />
          </div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">No travel time data yet</h3>
          <p className="text-gray-500 mb-4">This trip hasn't collected any travel time data yet.</p>
          <button
            onClick={handleCheckNow}
            disabled={checkingNow}
            className="bg-primary-600 text-white px-4 py-2 rounded-lg hover:bg-primary-700 disabled:opacity-50"
          >
            {checkingNow ? 'Checking...' : 'Check Travel Time Now'}
          </button>
        </div>
      )}
    </div>
  );
};

export default TripDetail;
