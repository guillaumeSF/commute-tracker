const cron = require('node-cron');
const { pool } = require('../config/database');
const { fetchTravelTime } = require('./googleMapsService');

const scheduledJobs = new Map();

const scheduleTripChecks = async () => {
  try {
    // Get all active trips
    const result = await pool.query('SELECT * FROM trips WHERE is_active = true');
    const trips = result.rows;

    // Clear existing schedules
    scheduledJobs.forEach(job => job.stop());
    scheduledJobs.clear();

    // Schedule each trip
    trips.forEach(trip => {
      scheduleTrip(trip);
    });

    console.log(`Scheduled ${trips.length} active trips`);
  } catch (error) {
    console.error('Error scheduling trips:', error);
  }
};

const scheduleTrip = (trip) => {
  try {
    const job = cron.schedule(trip.schedule_cron, async () => {
      await checkTripTravelTime(trip);
    }, {
      scheduled: true,
      timezone: "America/New_York" // Adjust timezone as needed
    });

    scheduledJobs.set(trip.id, job);
    console.log(`Scheduled trip: ${trip.name} with cron: ${trip.schedule_cron}`);
  } catch (error) {
    console.error(`Error scheduling trip ${trip.name}:`, error);
  }
};

const checkTripTravelTime = async (trip) => {
  try {
    console.log(`Checking travel time for trip: ${trip.name}`);
    
    const travelData = await fetchTravelTime(trip.origin_address, trip.destination_address);
    
    // Store the travel time data
    await pool.query(
      'INSERT INTO travel_times (trip_id, duration_seconds, distance_meters, traffic_level) VALUES ($1, $2, $3, $4)',
      [trip.id, travelData.duration_seconds, travelData.distance_meters, travelData.traffic_level]
    );

    console.log(`Recorded travel time for ${trip.name}: ${Math.round(travelData.duration_seconds / 60)} minutes`);
  } catch (error) {
    console.error(`Error checking travel time for trip ${trip.name}:`, error);
  }
};

const addTripSchedule = (trip) => {
  if (trip.is_active) {
    scheduleTrip(trip);
  }
};

const removeTripSchedule = (tripId) => {
  const job = scheduledJobs.get(tripId);
  if (job) {
    job.stop();
    scheduledJobs.delete(tripId);
    console.log(`Removed schedule for trip ID: ${tripId}`);
  }
};

const updateTripSchedule = (trip) => {
  removeTripSchedule(trip.id);
  if (trip.is_active) {
    scheduleTrip(trip);
  }
};

module.exports = {
  scheduleTripChecks,
  addTripSchedule,
  removeTripSchedule,
  updateTripSchedule
};
