const axios = require('axios');

const GOOGLE_MAPS_API_KEY = process.env.GOOGLE_MAPS_API_KEY;
const GOOGLE_MAPS_API_URL = 'https://maps.googleapis.com/maps/api/directions/json';

const fetchTravelTime = async (origin, destination) => {
  try {
    if (!GOOGLE_MAPS_API_KEY) {
      throw new Error('Google Maps API key is not configured');
    }

    const response = await axios.get(GOOGLE_MAPS_API_URL, {
      params: {
        origin: origin,
        destination: destination,
        key: GOOGLE_MAPS_API_KEY,
        departure_time: 'now',
        traffic_model: 'best_guess'
      }
    });

    if (response.data.status !== 'OK') {
      throw new Error(`Google Maps API error: ${response.data.status}`);
    }

    const route = response.data.routes[0];
    const leg = route.legs[0];

    return {
      duration_seconds: leg.duration_in_traffic ? leg.duration_in_traffic.value : leg.duration.value,
      distance_meters: leg.distance.value,
      traffic_level: getTrafficLevel(leg.duration_in_traffic, leg.duration),
      polyline: route.overview_polyline.points
    };
  } catch (error) {
    console.error('Error fetching travel time:', error.message);
    throw error;
  }
};

const getTrafficLevel = (durationInTraffic, duration) => {
  if (!durationInTraffic || !duration) return 'unknown';
  
  const trafficRatio = durationInTraffic.value / duration.value;
  
  if (trafficRatio < 1.1) return 'low';
  if (trafficRatio < 1.3) return 'medium';
  if (trafficRatio < 1.5) return 'high';
  return 'severe';
};

module.exports = {
  fetchTravelTime
};
