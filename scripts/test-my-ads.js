// Test script for /api/ads/my-ads endpoint
const axios = require('axios');
require('dotenv').config();

// Configuration
const BASE_URL = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
const TEST_TOKEN = process.env.TEST_TOKEN; // Set this in your .env file

async function testMyAdsEndpoint() {
  try {
    console.log('Testing /api/ads/my-ads endpoint...');
    
    // Make the request with the test token
    const response = await axios.get(`${BASE_URL}/api/ads/my-ads`, {
      headers: {
        'Authorization': `Bearer ${TEST_TOKEN}`,
        'Content-Type': 'application/json'
      },
      params: {
        page: 1,
        limit: 10
      }
    });

    console.log('Response status:', response.status);
    console.log('Response data:', JSON.stringify(response.data, null, 2));
    
    if (response.data.success) {
      console.log(`✅ Successfully retrieved ${response.data.data.length} ads`);
      console.log('Pagination info:', response.data.pagination);
    } else {
      console.error('❌ Request was not successful');
    }
  } catch (error) {
    console.error('❌ Error testing /api/ads/my-ads:', error.response?.data || error.message);
    
    if (error.response) {
      console.error('Response status:', error.response.status);
      console.error('Response data:', error.response.data);
    }
  }
}

// Run the test
testMyAdsEndpoint();
