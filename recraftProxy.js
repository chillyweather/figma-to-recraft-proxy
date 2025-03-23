const express = require('express');
const cors = require('cors');
const axios = require('axios');
require('dotenv').config();

// Initialize Express
const app = express();
const PORT = process.env.PORT || 3003;

// Enable CORS for Figma domains
app.use(cors({
  origin: ['https://www.figma.com', 'https://*.figma.com'],
  methods: ['POST', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

// Parse JSON bodies
app.use(express.json());

// Health check endpoint
app.get('/health', (req, res) => {
  res.status(200).json({ status: 'ok' });
});

// Proxy endpoint for Recraft API
app.post('/recraft/generate', async (req, res) => {
  try {
    // Log the incoming request
    console.log('Received request for image generation:', req.body);
    
    // Extract the Recraft API key from environment variables
    const recraftApiKey = process.env.RECRAFT_API_KEY;
    
    if (!recraftApiKey) {
      return res.status(500).json({ error: 'API key not configured on server' });
    }
    
    // Make the request to Recraft API
    const response = await axios({
      method: 'POST',
      url: 'https://external.api.recraft.ai/v1/images/generations',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${recraftApiKey}`
      },
      data: {
        prompt: req.body.prompt || 'A colorful abstract design',
        style: req.body.style || 'digital_illustration',
        model: req.body.model || 'recraftv3'
      }
    });
    
    // Log successful response
    console.log('Successful response from Recraft API:', response.data);
    
    // Return the Recraft API response to the client
    return res.status(200).json(response.data);
  } catch (error) {
    // Log the error
    console.error('Error calling Recraft API:', error.response ? error.response.data : error.message);
    
    // Return an error response
    return res.status(error.response ? error.response.status : 500).json({
      error: error.response ? error.response.data : error.message
    });
  }
});

// Start the server
app.listen(PORT, () => {
  console.log(`Proxy server running on port ${PORT}`);
});
