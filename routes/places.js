const express = require('express');
const axios = require('axios');
const router = express.Router();

// Google Places Autocomplete endpoint
router.get('/autocomplete', async (req, res) => {
  try {
    const { input } = req.query;
    
    if (!input || input.length < 3) {
      return res.json({ predictions: [] });
    }

    const response = await axios.get(
      `https://maps.googleapis.com/maps/api/place/autocomplete/json`,
      {
        params: {
          input: input,
          key: process.env.GOOGLE_MAPS_API_KEY,
          types: 'address'
        }
      }
    );

    res.json(response.data);
  } catch (error) {
    console.error('Places autocomplete error:', error);
    res.status(500).json({ 
      error: 'Failed to fetch address suggestions',
      details: error.message 
    });
  }
});

// Google Places Details endpoint
router.get('/details', async (req, res) => {
  try {
    const { place_id } = req.query;
    
    if (!place_id) {
      return res.status(400).json({ error: 'Place ID is required' });
    }

    const response = await axios.get(
      `https://maps.googleapis.com/maps/api/place/details/json`,
      {
        params: {
          place_id: place_id,
          key: process.env.GOOGLE_MAPS_API_KEY,
          fields: 'formatted_address'
        }
      }
    );

    res.json(response.data);
  } catch (error) {
    console.error('Places details error:', error);
    res.status(500).json({ 
      error: 'Failed to fetch place details',
      details: error.message 
    });
  }
});

module.exports = router;

