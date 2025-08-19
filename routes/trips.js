const express = require('express');
const { body, validationResult } = require('express-validator');
const { pool } = require('../config/database');
const { addTripSchedule, removeTripSchedule, updateTripSchedule } = require('../services/schedulerService');
const { fetchTravelTime } = require('../services/googleMapsService');

const router = express.Router();

// Validation middleware
const validateTrip = [
  body('name').notEmpty().withMessage('Trip name is required'),
  body('origin_address').notEmpty().withMessage('Origin address is required'),
  body('destination_address').notEmpty().withMessage('Destination address is required'),
  body('schedule_cron').notEmpty().withMessage('Schedule is required')
];

// Get all trips
router.get('/', async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT 
        t.*,
        MAX(tt.recorded_at) as last_check_at
      FROM trips t
      LEFT JOIN travel_times tt ON t.id = tt.trip_id
      GROUP BY t.id, t.name, t.origin_address, t.destination_address, t.schedule_cron, t.is_active, t.created_at, t.updated_at
      ORDER BY t.created_at DESC
    `);
    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching trips:', error);
    res.status(500).json({ error: 'Failed to fetch trips' });
  }
});

// Get a single trip
router.get('/:id', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM trips WHERE id = $1', [req.params.id]);
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Trip not found' });
    }
    
    res.json(result.rows[0]);
  } catch (error) {
    console.error('Error fetching trip:', error);
    res.status(500).json({ error: 'Failed to fetch trip' });
  }
});

// Create a new trip
router.post('/', validateTrip, async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  try {
    const { name, origin_address, destination_address, schedule_cron, is_active = true } = req.body;

    const result = await pool.query(
      'INSERT INTO trips (name, origin_address, destination_address, schedule_cron, is_active) VALUES ($1, $2, $3, $4, $5) RETURNING *',
      [name, origin_address, destination_address, schedule_cron, is_active]
    );

    const newTrip = result.rows[0];
    
    // Add to scheduler if active
    if (is_active) {
      addTripSchedule(newTrip);
    }

    res.status(201).json(newTrip);
  } catch (error) {
    console.error('Error creating trip:', error);
    res.status(500).json({ error: 'Failed to create trip' });
  }
});

// Update a trip
router.put('/:id', validateTrip, async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  try {
    const { name, origin_address, destination_address, schedule_cron, is_active } = req.body;
    const tripId = req.params.id;

    const result = await pool.query(
      'UPDATE trips SET name = $1, origin_address = $2, destination_address = $3, schedule_cron = $4, is_active = $5, updated_at = CURRENT_TIMESTAMP WHERE id = $6 RETURNING *',
      [name, origin_address, destination_address, schedule_cron, is_active, tripId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Trip not found' });
    }

    const updatedTrip = result.rows[0];
    
    // Update scheduler
    updateTripSchedule(updatedTrip);

    res.json(updatedTrip);
  } catch (error) {
    console.error('Error updating trip:', error);
    res.status(500).json({ error: 'Failed to update trip' });
  }
});

// Delete a trip
router.delete('/:id', async (req, res) => {
  try {
    const result = await pool.query('DELETE FROM trips WHERE id = $1 RETURNING *', [req.params.id]);
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Trip not found' });
    }

    // Remove from scheduler
    removeTripSchedule(req.params.id);

    res.json({ message: 'Trip deleted successfully' });
  } catch (error) {
    console.error('Error deleting trip:', error);
    res.status(500).json({ error: 'Failed to delete trip' });
  }
});

// Get travel times for a trip
router.get('/:id/travel-times', async (req, res) => {
  try {
    const { limit = 100, days = 30 } = req.query;
    
    const result = await pool.query(
      `SELECT * FROM travel_times 
       WHERE trip_id = $1 
       AND recorded_at >= NOW() - INTERVAL '${days} days'
       ORDER BY recorded_at DESC 
       LIMIT $2`,
      [req.params.id, limit]
    );

    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching travel times:', error);
    res.status(500).json({ error: 'Failed to fetch travel times' });
  }
});

// Manually check travel time for a trip
router.post('/:id/check-now', async (req, res) => {
  try {
    const tripResult = await pool.query('SELECT * FROM trips WHERE id = $1', [req.params.id]);
    
    if (tripResult.rows.length === 0) {
      return res.status(404).json({ error: 'Trip not found' });
    }

    const trip = tripResult.rows[0];
    const travelData = await fetchTravelTime(trip.origin_address, trip.destination_address);
    
    // Store the travel time data
    const insertResult = await pool.query(
      'INSERT INTO travel_times (trip_id, duration_seconds, distance_meters, traffic_level) VALUES ($1, $2, $3, $4) RETURNING *',
      [trip.id, travelData.duration_seconds, travelData.distance_meters, travelData.traffic_level]
    );

    res.json(insertResult.rows[0]);
  } catch (error) {
    console.error('Error checking travel time:', error);
    res.status(500).json({ error: 'Failed to check travel time' });
  }
});

module.exports = router;
