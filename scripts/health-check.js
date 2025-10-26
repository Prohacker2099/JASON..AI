import fetch from 'node-fetch';

const healthUrl = 'http://localhost:3001/api/health';

async function checkHealth() {
  console.log(`Checking health at: ${healthUrl}`);
  try {
    const response = await fetch(healthUrl, { timeout: 5000 });
    if (response.ok) {
      const data = await response.json();
      console.log('Health check successful!');
      console.log('Response:', JSON.stringify(data, null, 2));
      process.exit(0); // Success
    } else {
      console.error(`Health check failed with status: ${response.status}`);
      const text = await response.text();
      console.error('Response body:', text);
      process.exit(1); // Failure
    }
  } catch (error) {
    console.error('Error during health check:', error.message);
    process.exit(1); // Failure
  }
}

checkHealth();
