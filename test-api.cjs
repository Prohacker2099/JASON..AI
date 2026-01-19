#!/usr/bin/env node

// Test the JASON Travel API endpoints
const http = require('http');

const options = {
  hostname: 'localhost',
  port: 5000,
  path: '/api/health',
  method: 'GET',
  headers: {
    'Content-Type': 'application/json'
  }
};

console.log('🔗 Testing JASON Travel API...');
console.log('='.repeat(40));

const req = http.request(options, (res) => {
  console.log(`📡 Status Code: ${res.statusCode}`);
  
  let data = '';
  res.on('data', (chunk) => {
    data += chunk;
  });
  
  res.on('end', () => {
    try {
      const json = JSON.parse(data);
      console.log('✅ API Response:', JSON.stringify(json, null, 2));
    } catch (e) {
      console.log('📄 Raw Response:', data);
    }
  });
});

req.on('error', (error) => {
  console.error('❌ API Error:', error.message);
  console.log('\n🔄 Server might still be starting...');
  console.log('🌐 Client is ready at: http://localhost:3000');
  console.log('🎯 Navigate to the Travel section to test Cambodia search!');
});

req.end();
