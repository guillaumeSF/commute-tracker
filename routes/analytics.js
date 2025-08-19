const express = require('express');
const { pool } = require('../config/database');

const router = express.Router();

// Get analytics for all trips
router.get('/overview', async (req, res) => {
  try {
    const { days = 30 } = req.query;
    
    const result = await pool.query(`
      SELECT 
        t.id,
        t.name,
        t.origin_address,
        t.destination_address,
        COUNT(tt.id) as total_checks,
        AVG(tt.duration_seconds) as avg_duration_seconds,
        MIN(tt.duration_seconds) as min_duration_seconds,
        MAX(tt.duration_seconds) as max_duration_seconds,
        AVG(tt.distance_meters) as avg_distance_meters,
        COUNT(CASE WHEN tt.traffic_level = 'low' THEN 1 END) as low_traffic_count,
        COUNT(CASE WHEN tt.traffic_level = 'medium' THEN 1 END) as medium_traffic_count,
        COUNT(CASE WHEN tt.traffic_level = 'high' THEN 1 END) as high_traffic_count,
        COUNT(CASE WHEN tt.traffic_level = 'severe' THEN 1 END) as severe_traffic_count
      FROM trips t
      LEFT JOIN travel_times tt ON t.id = tt.trip_id 
        AND tt.recorded_at >= NOW() - INTERVAL '${days} days'
      GROUP BY t.id, t.name, t.origin_address, t.destination_address
      ORDER BY t.created_at DESC
    `);

    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching analytics overview:', error);
    res.status(500).json({ error: 'Failed to fetch analytics' });
  }
});

// Get detailed analytics for a specific trip
router.get('/trip/:id', async (req, res) => {
  try {
    const { days = 30 } = req.query;
    const tripId = req.params.id;

    // Get trip details
    const tripResult = await pool.query('SELECT * FROM trips WHERE id = $1', [tripId]);
    if (tripResult.rows.length === 0) {
      return res.status(404).json({ error: 'Trip not found' });
    }

    // Get travel times
    const travelTimesResult = await pool.query(`
      SELECT * FROM travel_times 
      WHERE trip_id = $1 
      AND recorded_at >= NOW() - INTERVAL '${days} days'
      ORDER BY recorded_at ASC
    `, [tripId]);

    // Get hourly averages
    const hourlyResult = await pool.query(`
      SELECT 
        EXTRACT(HOUR FROM recorded_at) as hour,
        AVG(duration_seconds) as avg_duration_seconds,
        COUNT(*) as count
      FROM travel_times 
      WHERE trip_id = $1 
      AND recorded_at >= NOW() - INTERVAL '${days} days'
      GROUP BY EXTRACT(HOUR FROM recorded_at)
      ORDER BY hour
    `, [tripId]);

    // Get daily averages
    const dailyResult = await pool.query(`
      SELECT 
        DATE(recorded_at) as date,
        AVG(duration_seconds) as avg_duration_seconds,
        MIN(duration_seconds) as min_duration_seconds,
        MAX(duration_seconds) as max_duration_seconds,
        COUNT(*) as count
      FROM travel_times 
      WHERE trip_id = $1 
      AND recorded_at >= NOW() - INTERVAL '${days} days'
      GROUP BY DATE(recorded_at)
      ORDER BY date DESC
    `, [tripId]);

    // Get traffic level distribution
    const trafficResult = await pool.query(`
      SELECT 
        traffic_level,
        COUNT(*) as count,
        AVG(duration_seconds) as avg_duration_seconds
      FROM travel_times 
      WHERE trip_id = $1 
      AND recorded_at >= NOW() - INTERVAL '${days} days'
      GROUP BY traffic_level
      ORDER BY count DESC
    `, [tripId]);

    const analytics = {
      trip: tripResult.rows[0],
      summary: {
        total_checks: travelTimesResult.rows.length,
        avg_duration_minutes: travelTimesResult.rows.length > 0 
          ? Math.round(travelTimesResult.rows.reduce((sum, row) => sum + row.duration_seconds, 0) / travelTimesResult.rows.length / 60 * 100) / 100
          : 0,
        min_duration_minutes: travelTimesResult.rows.length > 0 
          ? Math.round(Math.min(...travelTimesResult.rows.map(row => row.duration_seconds)) / 60)
          : 0,
        max_duration_minutes: travelTimesResult.rows.length > 0 
          ? Math.round(Math.max(...travelTimesResult.rows.map(row => row.duration_seconds)) / 60)
          : 0
      },
      hourly_data: hourlyResult.rows,
      daily_data: dailyResult.rows,
      traffic_distribution: trafficResult.rows,
      recent_travel_times: travelTimesResult.rows.slice(-10) // Last 10 entries
    };

    res.json(analytics);
  } catch (error) {
    console.error('Error fetching trip analytics:', error);
    res.status(500).json({ error: 'Failed to fetch trip analytics' });
  }
});

// Get traffic trends
router.get('/traffic-trends', async (req, res) => {
  try {
    const { days = 7 } = req.query;
    
    const result = await pool.query(`
      SELECT 
        DATE(recorded_at) as date,
        traffic_level,
        COUNT(*) as count
      FROM travel_times 
      WHERE recorded_at >= NOW() - INTERVAL '${days} days'
      GROUP BY DATE(recorded_at), traffic_level
      ORDER BY date DESC, count DESC
    `);

    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching traffic trends:', error);
    res.status(500).json({ error: 'Failed to fetch traffic trends' });
  }
});

// Get best and worst times for all trips
router.get('/best-worst-times', async (req, res) => {
  try {
    const { days = 30 } = req.query;
    
    const result = await pool.query(`
      SELECT 
        t.name,
        t.id,
        EXTRACT(HOUR FROM tt.recorded_at) as hour,
        AVG(tt.duration_seconds) as avg_duration_seconds,
        COUNT(*) as sample_size
      FROM trips t
      JOIN travel_times tt ON t.id = tt.trip_id 
        AND tt.recorded_at >= NOW() - INTERVAL '${days} days'
      GROUP BY t.id, t.name, EXTRACT(HOUR FROM tt.recorded_at)
      HAVING COUNT(*) >= 3
      ORDER BY t.name, avg_duration_seconds
    `);

    // Group by trip and find best/worst hours
    const trips = {};
    result.rows.forEach(row => {
      if (!trips[row.id]) {
        trips[row.id] = {
          name: row.name,
          hours: []
        };
      }
      trips[row.id].hours.push({
        hour: parseInt(row.hour),
        avg_duration_minutes: Math.round(row.avg_duration_seconds / 60),
        sample_size: parseInt(row.sample_size)
      });
    });

    // Find best and worst hours for each trip
    Object.keys(trips).forEach(tripId => {
      const trip = trips[tripId];
      if (trip.hours.length > 0) {
        trip.best_hour = trip.hours[0];
        trip.worst_hour = trip.hours[trip.hours.length - 1];
      }
    });

    res.json(Object.values(trips));
  } catch (error) {
    console.error('Error fetching best/worst times:', error);
    res.status(500).json({ error: 'Failed to fetch best/worst times' });
  }
});

module.exports = router;
