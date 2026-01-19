// Simple test for USPT endpoints
import fetch from 'node-fetch';

async function testUSPT() {
  const baseUrl = 'http://localhost:3001';
  
  try {
    // Test health endpoint
    console.log('Testing health endpoint...');
    const health = await fetch(`${baseUrl}/api/health`);
    if (health.ok) {
      console.log('✅ Health endpoint working');
    } else {
      console.log('❌ Health endpoint failed');
      return;
    }
    
    // Test USPT status
    console.log('Testing USPT status...');
    const usptStatus = await fetch(`${baseUrl}/api/uspt/status`);
    if (usptStatus.ok) {
      const status = await usptStatus.json();
      console.log('✅ USPT status:', status);
    } else {
      console.log('❌ USPT status failed');
    }
    
    // Test USPT ingest
    console.log('Testing USPT ingest...');
    const ingestResponse = await fetch(`${baseUrl}/api/uspt/ingest`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        text: 'Hello world, this is a test message for style analysis.',
        source: 'chat',
        metadata: { context: 'test' }
      })
    });
    
    if (ingestResponse.ok) {
      const result = await ingestResponse.json();
      console.log('✅ USPT ingest:', result);
    } else {
      console.log('❌ USPT ingest failed');
    }
    
    // Test USPT score
    console.log('Testing USPT score...');
    const scoreResponse = await fetch(`${baseUrl}/api/uspt/score`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        text: 'This is a formal message with proper punctuation and structure.'
      })
    });
    
    if (scoreResponse.ok) {
      const score = await scoreResponse.json();
      console.log('✅ USPT score:', score);
    } else {
      console.log('❌ USPT score failed');
    }
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
  }
}

testUSPT();
