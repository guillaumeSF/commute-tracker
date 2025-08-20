const express = require('express');
const { pool } = require('../config/database');
const router = express.Router();

// GET /api/checks - Get all checks with optional filtering and sorting
router.get('/', async (req, res) => {
  try {
    const { trip_id, traffic_level, sort_by = 'recorded_at', sort_order = 'desc' } = req.query;
    
    let query = `
      SELECT 
        tt.id,
        tt.recorded_at,
        tt.duration_seconds,
        tt.distance_meters,
        tt.traffic_level,
        t.name as trip_name,
        t.origin_address,
        t.destination_address
      FROM travel_times tt
      JOIN trips t ON tt.trip_id = t.id
      WHERE 1=1
    `;
    
    const params = [];
    let paramIndex = 1;
    
    // Add filters
    if (trip_id) {
      query += ` AND tt.trip_id = $${paramIndex}`;
      params.push(trip_id);
      paramIndex++;
    }
    
    if (traffic_level) {
      query += ` AND tt.traffic_level = $${paramIndex}`;
      params.push(traffic_level);
      paramIndex++;
    }
    
    // Add sorting
    const validSortFields = ['recorded_at', 'trip_name', 'duration_seconds', 'traffic_level'];
    const validSortOrders = ['asc', 'desc'];
    
    const sortField = validSortFields.includes(sort_by) ? sort_by : 'recorded_at';
    const sortOrder = validSortOrders.includes(sort_order.toLowerCase()) ? sort_order.toUpperCase() : 'DESC';
    
    query += ` ORDER BY ${sortField} ${sortOrder}`;
    
    const result = await pool.query(query, params);
    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching checks:', error);
    res.status(500).json({ error: 'Failed to fetch checks' });
  }
});

// DELETE /api/checks/:id - Delete a specific check
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    const result = await pool.query(
      'DELETE FROM travel_times WHERE id = $1 RETURNING id',
      [id]
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Check not found' });
    }
    
    res.json({ message: 'Check deleted successfully' });
  } catch (error) {
    console.error('Error deleting check:', error);
    res.status(500).json({ error: 'Failed to delete check' });
  }
});

module.exports = router;

